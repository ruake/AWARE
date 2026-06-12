#!/usr/bin/env node

/**
 * AWARE Scheduler — Suite Orchestrator
 *
 * Reads config/test-suites.yml, evaluates cron schedules against the
 * current time, dispatches run-tests.yml for due suites, and persists
 * scheduler-status.json for the AWARE portal to consume.
 *
 * Environment:
 *   GITHUB_TOKEN       — GitHub PAT or actions token
 *   GITHUB_SHA         — commit SHA for status
 *   GITHUB_REPOSITORY  — owner/repo
 *   GITHUB_STEP_SUMMARY — path to step summary file
 *   GITHUB_ACTOR       — triggering user
 *   GITHUB_REF_NAME    — branch name
 *   GITHUB_EVENT_NAME  — event name
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "artifacts", "aware-app", "src", "data");
const STATUS_FILE = join(DATA_DIR, "scheduler-status.json");
const CONFIG_FILE = join(ROOT, "config", "test-suites.yml");
const WORKFLOW = "run-tests.yml";

// ── Utilities ────────────────────────────────────────────────────────────────

function sh(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: "utf-8",
    maxBuffer: 16 * 1024 * 1024,
    ...opts,
  }).trim();
}

function yq(expr, file) {
  return JSON.parse(sh(`yq -o=json '${expr}' "${file}"`));
}

function gh(args) {
  const token = process.env.GITHUB_TOKEN;
  const env = token ? { ...process.env, GH_TOKEN: token } : process.env;
  try {
    return sh(`gh ${args}`, { env });
  } catch (e) {
    const short = e.message.slice(0, 200);
    console.error(`  \u26a0 gh ${args.split(/\s/)[0]} … ${short}`);
    return null;
  }
}

const isoNow = () => new Date().toISOString();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Cron matching ────────────────────────────────────────────────────────────

function matchCron(cronExp, date = new Date()) {
  if (!cronExp || cronExp === "null" || cronExp === "~") return false;
  const parts = cronExp.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const fields = [
    { v: date.getUTCMinutes(), lo: 0, hi: 59 },
    { v: date.getUTCHours(), lo: 0, hi: 23 },
    { v: date.getUTCDate(), lo: 1, hi: 31 },
    { v: date.getUTCMonth() + 1, lo: 1, hi: 12 },
    { v: date.getUTCDay(), lo: 0, hi: 6 },
  ];
  return fields.every((f, i) => matchField(parts[i], f.v, f.lo, f.hi));
}

function matchField(pattern, value, lo, hi) {
  if (pattern === "*") return true;
  if (pattern.startsWith("*/")) {
    const step = parseInt(pattern.slice(2), 10);
    return step > 0 && value % step === 0;
  }
  if (pattern.includes(","))
    return pattern.split(",").some((p) => matchField(p.trim(), value, lo, hi));
  if (pattern.includes("-")) {
    const [a, b] = pattern.split("-").map(Number);
    return value >= a && value <= b;
  }
  return parseInt(pattern, 10) === value;
}

function nextCron(cronExp, from = new Date()) {
  if (!cronExp || cronExp === "null") return null;
  for (let i = 0; i < 525600; i++) {
    const d = new Date(from.getTime() + i * 60_000);
    if (matchCron(cronExp, d)) return d.toISOString();
  }
  return null;
}

// ── GitHub API ───────────────────────────────────────────────────────────────

function getActiveRuns(suiteId) {
  const out = gh(
    `run list --workflow "${WORKFLOW}" --limit 50 --json databaseId,displayTitle,status,createdAt`
  );
  if (!out) return [];
  try {
    const runs = JSON.parse(out);
    const activeStatuses = new Set([
      "in_progress",
      "pending",
      "queued",
      "waiting",
      "requested",
    ]);
    return runs.filter(
      (r) =>
        r.displayTitle &&
        r.displayTitle.includes(suiteId) &&
        activeStatuses.has(r.status)
    );
  } catch {
    return [];
  }
}

function dispatchSuite(suiteId, envLabel, parallelism) {
  const ref = process.env.GITHUB_REF_NAME || "main";
  const out = gh(
    `workflow run "${WORKFLOW}" --ref "${ref}" -f suite=${suiteId} -f environment="${envLabel}" -f parallelism=${parallelism}`
  );
  return out !== null;
}

function getLatestRunForSuite(suiteId) {
  const out = gh(
    `run list --workflow "${WORKFLOW}" --limit 10 --json databaseId,displayTitle,status,conclusion,createdAt,updatedAt`
  );
  if (!out) return null;
  try {
    const runs = JSON.parse(out).filter(
      (r) => r.displayTitle && r.displayTitle.includes(suiteId)
    );
    if (runs.length === 0) return null;
    runs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return runs[0];
  } catch {
    return null;
  }
}

// ── Status file I/O ──────────────────────────────────────────────────────────

function readStatus() {
  if (!existsSync(STATUS_FILE)) {
    return { lastRun: null, status: "healthy", suites: [], recentDispatches: [] };
  }
  try {
    return JSON.parse(readFileSync(STATUS_FILE, "utf-8"));
  } catch {
    return { lastRun: null, status: "healthy", suites: [], recentDispatches: [] };
  }
}

function writeStatus(status) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2) + "\n");
}

// ── Git commit ───────────────────────────────────────────────────────────────

function commitStatusFile() {
  try {
    sh(`git config user.name "AWARE Scheduler"`);
    sh(`git config user.email "scheduler@aware.dev"`);
    sh(`git add "${STATUS_FILE}"`);
    const diff = sh("git diff --cached --stat");
    if (!diff) {
      console.log("  \u2139 No status changes to commit");
      return;
    }
    sh(`git commit -m "scheduler: update status [skip ci]"`);
    sh(`git push`);
    console.log("  \u2713 Status committed to repo");
  } catch (e) {
    console.error(`  \u26a0 Git commit/push: ${e.message.slice(0, 200)}`);
  }
}

// ── Schedule descriptions ───────────────────────────────────────────────────

function describeSchedule(cron) {
  if (!cron || cron === "null") return null;
  const known = {
    "0 2 * * *": "Daily 02:00 UTC",
    "0 6 * * *": "Daily 06:00 UTC",
    "0 4 * * 1": "Monday 04:00 UTC",
    "0 */2 * * *": "Every 2 hours",
  };
  return known[cron] || cron;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const now = new Date();
  const timestamp = isoNow();
  const repo = process.env.GITHUB_REPOSITORY || "unknown/repo";

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  AWARE Scheduler  —  ${timestamp}`);
  console.log(`  Repo: ${repo}`);
  console.log(`  SHA:  ${(process.env.GITHUB_SHA || "?").slice(0, 7)}`);
  console.log(`${"=".repeat(60)}\n`);

  //── Read config ──────────────────────────────────────────────────────────
  if (!existsSync(CONFIG_FILE)) {
    console.error(`  \u2717 Config not found: ${CONFIG_FILE}`);
    process.exit(1);
  }

  let config;
  try {
    config = yq(".", CONFIG_FILE);
  } catch (e) {
    console.error(`  \u2717 Failed to parse config: ${e.message}`);
    process.exit(1);
  }

  const suites = config.suites || [];
  console.log(`  \u{1F4CB} ${suites.length} suites defined\n`);

  //── Process each suite ───────────────────────────────────────────────────
  const prevStatus = readStatus();
  const dispatchResults = [];
  const suiteStatuses = [];
  let totalDispatched = 0;

  for (const suite of suites) {
    const cron = suite.schedule || null;
    const due = matchCron(cron, now);
    const parallelism = suite.parallelism || 4;
    const envs = suite.environments || [];

    let activeCount = 0;
    let latestRun = null;
    let dispatchAction = null;

    if (due) {
      const active = getActiveRuns(suite.id);
      activeCount = active.length;

      if (activeCount > 0) {
        dispatchAction = `\u23F3 ${activeCount} active run(s)`;
      } else {
        let dispatched = 0;
        let errors = [];
        for (const env of envs) {
          const ok = dispatchSuite(suite.id, env, parallelism);
          if (ok) {
            dispatched++;
            await sleep(500);
          } else {
            errors.push(env);
          }
        }
        totalDispatched += dispatched;
        dispatchAction = `\u{1F680} ${dispatched}/${envs.length} envs`;
        if (errors.length > 0) {
          dispatchAction += ` (${errors.length} failed)`;
        }

        if (dispatched > 0) {
          dispatchResults.push({
            timestamp,
            suite: suite.id,
            environments: envs,
            dispatched,
            failed: errors.length,
            errors: errors.length > 0 ? errors : undefined,
            workflow: WORKFLOW,
          });
        }
      }
    }

    // Fetch latest run info regardless of due state
    latestRun = getLatestRunForSuite(suite.id);
    if (!latestRun && activeCount === 0 && !dispatchAction) {
      dispatchAction = "\u2014";
    }

    // Determine suite status
    let suiteStatus = "idle";
    if (dispatchAction && dispatchAction.includes("\u{1F680}")) {
      suiteStatus = "running";
    } else if (activeCount > 0) {
      suiteStatus = "running";
    } else if (latestRun) {
      suiteStatus =
        latestRun.conclusion === "success"
          ? "passed"
          : latestRun.conclusion === "failure"
            ? "failed"
            : "idle";
    }

    // Put icon first in console output
    const glyph = due ? "\u{1F7E2}" : "\u26AA";
    console.log(`  ${glyph} ${suite.id.padEnd(28)} ${dispatchAction || "\u2014"}`);

    suiteStatuses.push({
      id: suite.id,
      name: suite.name,
      schedule: cron,
      scheduleDesc: describeSchedule(cron),
      due,
      lastDispatched: latestRun?.createdAt || null,
      lastConclusion: latestRun?.conclusion || null,
      lastRunUrl:
        latestRun?.databaseId
          ? `https://github.com/${repo}/actions/runs/${latestRun.databaseId}`
          : null,
      activeRuns: activeCount,
      status: suiteStatus,
      nextDue: due ? null : nextCron(cron, now),
      environments: envs,
      runners: suite.runners || [],
    });
  }

  //── Build status object ─────────────────────────────────────────────────
  const hasErrors = dispatchResults.some((d) => d.failed > 0);
  const overall = hasErrors ? "degraded" : "healthy";

  // Keep recent dispatches (last 50)
  const allDispatches = [...dispatchResults, ...(prevStatus.recentDispatches || [])].slice(
    0,
    50
  );

  const newStatus = {
    lastRun: timestamp,
    lastRunBy: process.env.GITHUB_ACTOR || "scheduler",
    status: overall,
    suites: suiteStatuses,
    recentDispatches: allDispatches,
    summary: {
      total: suites.length,
      scheduled: suites.filter((s) => s.schedule).length,
      due: suiteStatuses.filter((s) => s.due).length,
      dispatched: totalDispatched,
      running: suiteStatuses.filter((s) => s.activeRuns > 0).length,
    },
  };

  writeStatus(newStatus);

  //── Generate GITHUB_STEP_SUMMARY ────────────────────────────────────────
  const summaryLines = [
    `# AWARE Scheduler Report`,
    ``,
    `| | |`,
    `|---|---|`,
    `| **Run** | ${timestamp} |`,
    `| **Trigger** | ${process.env.GITHUB_EVENT_NAME || "manual"} |`,
    `| **Status** | \`${overall}\` |`,
    `| **Suites due** | ${newStatus.summary.due} |`,
    `| **Environments dispatched** | ${totalDispatched} |`,
    ``,
    `## Suite Status`,
    ``,
    `| Suite | Schedule | Status | Action |`,
    `|-------|----------|--------|--------|`,
  ];

  for (const s of suiteStatuses) {
    const statusGlyph =
      s.status === "running"
        ? "\u{1F7E2}"
        : s.status === "passed"
          ? "\u2705"
          : s.status === "failed"
            ? "\u274C"
            : "\u26AA";
    const actionStr = s.due
      ? "\u{1F680} dispatching"
      : s.activeRuns > 0
        ? `\u23F3 ${s.activeRuns} active`
        : s.lastConclusion === "success"
          ? "\u2705 passed"
          : s.lastConclusion === "failure"
            ? "\u274C failed"
            : "\u2014";
    summaryLines.push(
      `| ${s.id} | ${s.scheduleDesc || "\u2014"} | ${statusGlyph} ${s.status} | ${actionStr} |`
    );
  }

  summaryLines.push(
    ``,
    `## Summary`,
    ``,
    `- **Total suites**: ${newStatus.summary.total}`,
    `- **Scheduled**: ${newStatus.summary.scheduled}`,
    `- **Due now**: ${newStatus.summary.due}`,
    `- **Dispatched**: ${totalDispatched} environment(s)`,
    `- **Running**: ${newStatus.summary.running} suite(s)`,
    ``,
  );

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    writeFileSync(summaryPath, summaryLines.join("\n"));
  }

  //── Commit status file ──────────────────────────────────────────────────
  commitStatusFile();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  \u2705 Scheduler complete \u2014 ${totalDispatched} env(s) dispatched`);
  console.log(`${"=".repeat(60)}\n`);
}

//── Run ───────────────────────────────────────────────────────────────────

try {
  await main();
} catch (e) {
  console.error(`\n\u274C Scheduler failed: ${e.message}`);
  console.error(e.stack);
  const sp = process.env.GITHUB_STEP_SUMMARY;
  if (sp) {
    writeFileSync(sp, `# AWARE Scheduler Report\n\n\u274C **Failed**: ${e.message}\n`);
  }
  process.exit(1);
}

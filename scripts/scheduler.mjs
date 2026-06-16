#!/usr/bin/env node

/**
 * AWARE Scheduler — Kubernetes-inspired reconciler for test suite orchestration.
 *
 * On every reconciliation tick:
 *   1. **Poll phase**: reconcile RUNNING runs against GitHub workflow state
 *   2. **Cron evaluation**: check which suites are due
 *   3. **Dispatch phase**: dispatch controller.yml for due suites × environments
 *   4. **Status commit**: push updated runs.json + scheduler-status.json to `data` branch
 *
 * Controller pattern (like k8s):
 *   - Each Run has `conditions[]` (Dispatched, WorkflowRunning, Completed, Passed)
 *   - Conditions drive the derived `status` ("PENDING"|"RUNNING"|"PASS"|"FAIL"|"ERROR")
 *   - The reconciler polls GitHub workflow runs and updates conditions accordingly
 *   - A "garbage collection" pass cleans up stale RUNNING entries
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

import { Reconciler, ResourceReconciler } from "./lib/reconciler.mjs";
import {
  getWorkflowRun,
  findLatestDispatch,
  dispatchWorkflow,
} from "./lib/ghApi.mjs";
import {
  RUN_STATUSES,
  CONDITION_TYPES,
  CONDITION_STATUS,
  condition,
  deriveRunStatus,
  upsertCondition,
  initialRunConditions,
  completeRunConditions,
  readRuns,
  writeRuns,
} from "./lib/runStatus.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "artifacts", "aware-app", "data");
const RUNS_FILE = join(DATA_DIR, "runs.json");
const STATUS_FILE = join(DATA_DIR, "scheduler-status.json");
const CONFIG_FILE = join(ROOT, "config", "test-suites.yml");
const WORKFLOW_FILE = "controller.yml";
const DATA_BRANCH = "data";

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

function describeSchedule(cron) {
  if (!cron || cron === "null") return null;
  const known = {
    "0 2 * * *": "Daily 02:00 UTC",
    "0 6 * * *": "Daily 06:00 UTC",
    "0 4 * * 1": "Monday 04:00 UTC",
    "0 */2 * * *": "Every 2 hours",
    "*/10 * * * *": "Every 10 minutes",
  };
  return known[cron] || cron;
}

// ── Env map ──────────────────────────────────────────────────────────────────

const ENV_MAP = {
  "QA / Staging":     { id: "qa_staging", target: "QA",   network: "staging" },
  "QA / Production":  { id: "qa_prod",    target: "QA",   network: "production" },
  "UAT / Staging":    { id: "uat_staging",target: "UAT",  network: "staging" },
  "UAT / Production": { id: "uat_prod",   target: "UAT",  network: "production" },
  "PROD / Staging":   { id: "prod_staging",target: "PROD",network: "staging" },
  "PROD / Production":{ id: "prod_prod",  target: "PROD", network: "production" },
};

function makeRunId(suiteId, envLabel) {
  const slug = suiteId.replace(/^suite_/, "").slice(0, 8);
  const ts = Date.now().toString(36);
  return `${slug}_${ts}`;
}

// ── Git commit (pushes data files to the `data` branch) ─────────────────────

function commitDataFiles() {
  const mainBranch = process.env.GITHUB_REF_NAME || "main";
  try {
    const runsContent = readFileSync(RUNS_FILE, "utf-8");
    const statusContent = readFileSync(STATUS_FILE, "utf-8");

    sh(`git config user.name "AWARE Scheduler"`);
    sh(`git config user.email "scheduler@aware.dev"`);

    sh(`git fetch origin ${DATA_BRANCH}:${DATA_BRANCH} 2>/dev/null || true`);
    try {
      sh(`git checkout -f ${DATA_BRANCH}`);
    } catch {
      sh(`git checkout --orphan ${DATA_BRANCH}`);
      for (const e of readdirSync(ROOT)) {
        if (e !== ".git") rmSync(join(ROOT, e), { recursive: true, force: true });
      }
    }

    writeFileSync(join(ROOT, "runs.json"), runsContent);
    writeFileSync(join(ROOT, "scheduler-status.json"), statusContent);

    sh(`git add "runs.json" "scheduler-status.json"`);
    const diff = sh("git diff --cached --stat");
    if (!diff) {
      console.log("  \u2139 No data changes to commit");
      sh(`git checkout -f ${mainBranch}`);
      return;
    }
    sh(`git commit -m "scheduler: update runs + status [skip ci]"`);
    sh(`git push origin ${DATA_BRANCH}`);
    sh(`git checkout -f ${mainBranch}`);
    console.log(`  \u2713 Data committed to ${DATA_BRANCH} branch`);
  } catch (e) {
    console.error(`  \u26a0 Git commit/push: ${e.message.slice(0, 200)}`);
    try { sh(`git checkout -f ${mainBranch}`); } catch {}
  }
}

// ── Main controller ─────────────────────────────────────────────────────────

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

  //── Load existing runs ──────────────────────────────────────────────────
  let runs = readRuns(RUNS_FILE);

  //── Phase 1: Reconcile RUNNING runs (poll GH workflow state) ─────────
  console.log("  \u{1F504} Reconcile phase — polling active workflows...");
  let runsMutated = false;
  const runningRuns = runs.filter((r) => r.status === "RUNNING" && r.workflowRunId);
  for (const run of runningRuns) {
    const wf = getWorkflowRun(run.workflowRunId);
    if (!wf) continue;

    if (!run.conditions) run.conditions = initialRunConditions();

    if (wf.isCompleted) {
      const passed = wf.isSuccess;
      run.conditions = completeRunConditions(passed);
      run.status = deriveRunStatus(run.conditions);
      run.passPct = passed ? 100 : 0;
      run.updatedAt = wf.updatedAt || timestamp;
      runsMutated = true;
      console.log(`  \u2705 Run ${run.id} reconciled → ${run.status}`);
    } else if (wf.isActive) {
      // Still running — update timestamp
      run.updatedAt = wf.updatedAt || timestamp;
    }
  }
  if (runsMutated) writeRuns(RUNS_FILE, runs);

  //── Phase 2: Evaluate cron + dispatch due suites ─────────────────────
  console.log("\n  \u{1F4C5} Dispatch phase — evaluating schedules...");
  const dispatchResults = [];
  const suiteStatuses = [];
  let totalDispatched = 0;

  for (const suite of suites) {
    const cron = suite.schedule || null;
    const due = matchCron(cron, now);
    const parallelism = suite.parallelism || 4;
    const envs = suite.environments || [];

    let dispatchAction = null;
    let activeCount = 0;

    if (due) {
      // Check for active runs via GH API
      const active = []; // simplified — we check via runs.json below
      activeCount = runs.filter((r) => (r.suiteId || r.suite) === suite.id && r.status === "RUNNING").length;

      if (activeCount > 0) {
        dispatchAction = `\u23F3 ${activeCount} active run(s)`;
      } else {
        let dispatched = 0;
        let errors = [];
        for (const env of envs) {
          const ok = dispatchWorkflow(WORKFLOW_FILE, process.env.GITHUB_REF_NAME || "main", {
            force_suite: suite.id,
            force_env: env,
          });
          if (ok) {
            const runId = makeRunId(suite.id, env);
            const envInfo = ENV_MAP[env] || { id: "qa_staging", target: "QA", network: "staging" };

            // Wait for GH to index, then find workflowRunId
            await sleep(2000);
            const latest = findLatestDispatch(WORKFLOW_FILE, suite.id, env);

            runs.unshift({
              id: runId,
              label: `${suite.name} — ${env}`,
              suiteId: suite.id,
              envId: envInfo.id,
              status: "RUNNING",
              conditions: initialRunConditions(),
              passPct: 0,
              failures: 0,
              duration: "\u2014",
              durationMs: 0,
              started: timestamp,
              build: (process.env.GITHUB_SHA || "?").slice(0, 7),
              rev: process.env.GITHUB_SHA || "?",
              env: envInfo.target,
              network: envInfo.network,
              workflowRunId: latest?.databaseId || null,
            });
            dispatched++;
            await sleep(1000);
          } else {
            errors.push(env);
          }
        }
        writeRuns(RUNS_FILE, runs);
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
            workflow: WORKFLOW_FILE,
          });
        }
      }
    }

    // Determine suite status for status object
    const runningCount = runs.filter((r) => (r.suiteId || r.suite) === suite.id && r.status === "RUNNING").length;
    const lastRun = runs.find((r) => (r.suiteId || r.suite) === suite.id && r.status !== "RUNNING");
    let suiteStatus = "idle";
    if (runningCount > 0) {
      suiteStatus = "running";
    } else if (lastRun) {
      suiteStatus = lastRun.status === "PASS" ? "passed" : lastRun.status === "FAIL" ? "failed" : "idle";
    }

    const glyph = due ? "\u{1F7E2}" : "\u26AA";
    console.log(`  ${glyph} ${suite.id.padEnd(28)} ${dispatchAction || "\u2014"}`);

    suiteStatuses.push({
      id: suite.id,
      name: suite.name,
      schedule: cron,
      scheduleDesc: describeSchedule(cron),
      due,
      lastDispatched: timestamp,
      lastConclusion: lastRun?.status || null,
      lastRunUrl: null,
      activeRuns: runningCount,
      status: suiteStatus,
      nextDue: due ? null : nextCron(cron, now),
      environments: envs,
      runners: suite.runners || [],
    });
  }

  //── Phase 3: Garbage collect stale runs ──────────────────────────────
  const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const staleCount = runs.filter(
    (r) => r.status === "RUNNING" && r.started < staleThreshold
  ).length;
  if (staleCount > 0) {
    console.log(`  \u{1F9F9} GC: ${staleCount} stale RUNNING run(s) older than 24h — marking ERROR`);
    for (const run of runs) {
      if (run.status === "RUNNING" && run.started < staleThreshold) {
        run.status = "ERROR";
        run.conditions = completeRunConditions(false);
        run.conditions = upsertCondition(run.conditions, condition("Reconciled", "True", "StaleGC", "Marked as ERROR by garbage collector (no workflow update in 24h)"));
        run.updatedAt = timestamp;
        runsMutated = true;
      }
    }
    if (runsMutated) writeRuns(RUNS_FILE, runs);
  }

  //── Phase 4: Build + persist scheduler status ────────────────────────
  const prevStatus = readSchedulerStatus();
  const overall = dispatchResults.some((d) => d.failed > 0) ? "degraded" : "healthy";
  const allDispatches = [...dispatchResults, ...(prevStatus.recentDispatches || [])].slice(0, 50);

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

  writeSchedulerStatus(newStatus);

  //── Phase 5: Commit to data branch ───────────────────────────────────
  commitDataFiles();

  //── Generate GITHUB_STEP_SUMMARY ─────────────────────────────────────
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
    `| **Stale runs GC'd** | ${staleCount} |`,
    ``,
    `## Suite Status`,
    ``,
    `| Suite | Schedule | Status | Action |`,
    `|-------|----------|--------|--------|`,
  ];

  for (const s of suiteStatuses) {
    const statusGlyph =
      s.status === "running" ? "\u{1F7E2}" :
      s.status === "passed" ? "\u2705" :
      s.status === "failed" ? "\u274C" : "\u26AA";
    const actionStr = s.due ? "\u{1F680} dispatching" :
      s.activeRuns > 0 ? `\u23F3 ${s.activeRuns} active` :
      s.lastConclusion === "PASS" ? "\u2705 passed" :
      s.lastConclusion === "FAIL" ? "\u274C failed" : "\u2014";
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
    `- **Stale GC'd**: ${staleCount} run(s)`,
    ``,
  );

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    writeFileSync(summaryPath, summaryLines.join("\n"));
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  \u2705 Scheduler complete \u2014 ${totalDispatched} env(s) dispatched, ${staleCount} stale GC'd`);
  console.log(`${"=".repeat(60)}\n`);
}

// ── Scheduler status I/O ─────────────────────────────────────────────────

function readSchedulerStatus() {
  if (!existsSync(STATUS_FILE)) {
    return { lastRun: null, status: "healthy", suites: [], recentDispatches: [] };
  }
  try {
    return JSON.parse(readFileSync(STATUS_FILE, "utf-8"));
  } catch {
    return { lastRun: null, status: "healthy", suites: [], recentDispatches: [] };
  }
}

function writeSchedulerStatus(status) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2) + "\n");
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

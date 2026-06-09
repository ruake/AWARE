#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RUNS_FILE = path.resolve(ROOT, "src", "data", "runs.json");
const DIFFS_FILE = path.resolve(ROOT, "src", "data", "diff-rows.json");

const resultsPath = process.argv[2] || "test-results/playwright-results.json";

function getBuildInfo() {
  try {
    const rev = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    const build = rev.slice(0, 7);
    return { rev, build };
  } catch {
    return { rev: "unknown", build: "unknown" };
  }
}

function parseResults(resultsPath) {
  const raw = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
  let passed = 0;
  let failed = 0;
  let totalDuration = 0;
  let testCount = 0;

  function walk(suite) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const t of spec.tests) {
          testCount++;
          const ok = t.results?.some(r => r.status === "passed");
          if (ok) passed++;
          else failed++;
          for (const r of t.results || []) {
            totalDuration += r.duration || 0;
          }
        }
      }
    }
    if (suite.suites) {
      for (const s of suite.suites) walk(s);
    }
  }

  for (const suite of raw.suites || []) walk(suite);

  const total = passed + failed;
  const passPct = total > 0 ? Math.round((passed / total) * 100) : 0;
  const durationSec = Math.round(totalDuration / 1000);
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  const durationStr = `${minutes}m ${seconds.toString().padStart(2, "0")}s`;

  let status = "PASS";
  if (failed > 0 && passed > 0) status = failed > passed / 2 ? "FAIL" : "FLAKY";
  else if (failed > 0) status = "FAIL";

  return { passed, failed, total, passPct, durationMs: totalDuration, durationStr, status };
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return []; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

const { rev, build } = getBuildInfo();
const results = parseResults(resultsPath);

const now = new Date();
const runId = `run_${now.toISOString().slice(0, 10).replace(/-/g, "")}_${Date.now().toString(36)}`;

const run = {
  id: runId,
  label: `CI — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
  suite: "suite_full",
  target: "Prod",
  status: results.status,
  passPct: results.passPct,
  failures: results.failed,
  duration: results.durationStr,
  durationMs: results.durationMs,
  started: now.toISOString(),
  build,
  rev,
  env: "production",
  network: "production",
};

const runs = readJSON(RUNS_FILE);
runs.unshift(run);
writeJSON(RUNS_FILE, runs);
console.log(`✓ Recorded run ${run.id}: ${results.passed}/${results.total} passed (${results.passPct}%) ${results.status}`);

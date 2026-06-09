#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RUNS_FILE = path.resolve(ROOT, "src", "data", "runs.json");
const DIFFS_FILE = path.resolve(ROOT, "src", "data", "diff-rows.json");
const TEST_RESULTS_FILE = path.resolve(ROOT, "src", "data", "test-results.json");

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

function parseResults(raw) {
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

function extractTestResults(raw, runId) {
  const results = [];
  const categories = {
    "smoke": "Smoke",
    "login": "Security",
    "checkboxes": "Functional",
    "dropdown": "Functional",
    "dynamic": "Performance",
    "alerts": "Security",
    "frames": "Functional",
    "windows": "Functional",
  };

  function walk(suite) {
    const suiteName = suite.title || "";
    const suiteLower = suiteName.toLowerCase();
    let category = "General";
    for (const [kw, cat] of Object.entries(categories)) {
      if (suiteLower.includes(kw)) { category = cat; break; }
    }
    if (suite.specs) {
      for (const spec of suite.specs) {
        const name = spec.title || "unknown";
        for (const t of spec.tests) {
          const ok = t.results?.some(r => r.status === "passed");
          const lastResult = t.results?.[t.results.length - 1];
          let error = "";
          if (!ok && lastResult) {
            const err = lastResult.error || (lastResult.errors && lastResult.errors[0]);
            if (err) error = err.message || String(err);
          }
          results.push({
            id: `tr_${runId}_${results.length}`,
            name,
            status: ok ? "PASS" : "FAIL",
            duration: lastResult?.duration || 0,
            category,
            suite: suiteName,
            ...(error ? { error } : {}),
          });
        }
      }
    }
    if (suite.suites) {
      for (const s of suite.suites) walk(s);
    }
  }

  for (const suite of raw.suites || []) walk(suite);
  return results;
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return []; }
}

function readJSONObj(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return {}; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

const { rev, build } = getBuildInfo();
const now = new Date();
const runId = `run_${now.toISOString().slice(0, 10).replace(/-/g, "")}_${Date.now().toString(36)}`;
const raw = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
const results = parseResults(raw);
const testResults = extractTestResults(raw, runId);

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

const testResultsByRun = readJSONObj(TEST_RESULTS_FILE);
testResultsByRun[run.id] = testResults;
writeJSON(TEST_RESULTS_FILE, testResultsByRun);
console.log(`✓ Recorded ${testResults.length} test results for ${run.id}`);

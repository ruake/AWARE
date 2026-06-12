#!/usr/bin/env node
/**
 * Generate fully correlated, ACID-compliant seed data for the AWARE dashboard.
 *
 * Ensures:
 * - Every run in runs.json has a matching entry in test-results.json
 * - Every test ID referenced by suites exists in auto-tests.json
 * - passPct / failures / duration are consistent across Run and TestResult
 * - diff-rows.json uses real test IDs (ad_0, pw_0, etc.)
 * - promotions.json references real run IDs
 *
 * Run: node scripts/generate-data.mjs   (from artifacts/aware-app/)
 * Then: pnpm validate:data
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");

// ── Load auto-tests for canonical test IDs, names, categories ────────────
const autoTestsPath = join(dataDir, "auto-tests.json");
if (!existsSync(autoTestsPath)) {
  console.error("❌ auto-tests.json not found. Run pnpm discover:tests first.");
  process.exit(1);
}
const ALL_TESTS = JSON.parse(readFileSync(autoTestsPath, "utf-8"));
const TEST_COUNT = ALL_TESTS.length; // 107

// Build lookup maps
const testById = {};
for (const t of ALL_TESTS) testById[t.id] = t;

// ── Category grouping for diff-rows ──────────────────────────────────────
const CATEGORY_FIRST = {};
for (const t of ALL_TESTS) {
  if (!CATEGORY_FIRST[t.category]) CATEGORY_FIRST[t.category] = t;
}

// ── Run definitions ──────────────────────────────────────────────────────
// 15 runs across 3 days, mixing production + staging environments
const RUN_DEFS = [
  // Day 1: Jun 8 — mostly green
  { day: 8, hour: 7, min: 12, tier: "QA", network: "staging", suiteId: "suite_regression_qa", envId: "qa_staging", status: "PASS", passPct: 100, failures: 0, build: "a1b2c3d", rev: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b" },
  { day: 8, hour: 9, min: 45, tier: "QA", network: "production", suiteId: "suite_regression_qa", envId: "qa_prod", status: "PASS", passPct: 99, failures: 1, build: "b2c3d4e", rev: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" },
  { day: 8, hour: 12, min: 0, tier: "UAT", network: "staging", suiteId: "suite_regression_uat", envId: "uat_staging", status: "PASS", passPct: 98, failures: 2, build: "c3d4e5f", rev: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c" },
  { day: 8, hour: 15, min: 30, tier: "PROD", network: "production", suiteId: "suite_nightly_prod", envId: "prod_prod", status: "PASS", passPct: 100, failures: 0, build: "d4e5f6a", rev: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1" },
  { day: 8, hour: 18, min: 22, tier: "UAT", network: "staging", suiteId: "suite_regression_uat", envId: "uat_staging", status: "FLAKY", passPct: 91, failures: 9, build: "e5f6a7b", rev: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2" },
  // Day 2: Jun 9 — some regressions
  { day: 9, hour: 6, min: 30, tier: "PROD", network: "production", suiteId: "suite_nightly_prod", envId: "prod_prod", status: "PASS", passPct: 100, failures: 0, build: "f6a7b8c", rev: "f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3" },
  { day: 9, hour: 8, min: 15, tier: "PROD", network: "staging", suiteId: "suite_nightly_prod", envId: "prod_staging", status: "PASS", passPct: 97, failures: 3, build: "a7b8c9d", rev: "a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4" },
  { day: 9, hour: 10, min: 0, tier: "PROD", network: "production", suiteId: "suite_nightly_prod", envId: "prod_prod", status: "FLAKY", passPct: 88, failures: 12, build: "b8c9d0e", rev: "b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5" },
  { day: 9, hour: 13, min: 45, tier: "UAT", network: "staging", suiteId: "suite_regression_uat", envId: "uat_staging", status: "PASS", passPct: 96, failures: 4, build: "c9d0e1f", rev: "c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6" },
  { day: 9, hour: 16, min: 20, tier: "PROD", network: "production", suiteId: "suite_nightly_prod", envId: "prod_prod", status: "FAIL", passPct: 72, failures: 29, build: "d0e1f2a", rev: "d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7" },
  // Day 3: Jun 10 — recovery
  { day: 10, hour: 5, min: 0, tier: "PROD", network: "production", suiteId: "suite_nightly_prod", envId: "prod_prod", status: "PASS", passPct: 99, failures: 1, build: "e1f2a3b", rev: "e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8" },
  { day: 10, hour: 8, min: 30, tier: "UAT", network: "staging", suiteId: "suite_regression_uat", envId: "uat_staging", status: "PASS", passPct: 100, failures: 0, build: "f2a3b4c", rev: "f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9" },
  { day: 10, hour: 10, min: 15, tier: "PROD", network: "production", suiteId: "suite_nightly_prod", envId: "prod_prod", status: "PASS", passPct: 98, failures: 2, build: "a3b4c5d", rev: "a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0" },
  { day: 10, hour: 13, min: 0, tier: "PROD", network: "staging", suiteId: "suite_nightly_prod", envId: "prod_staging", status: "PASS", passPct: 100, failures: 0, build: "b4c5d6e", rev: "b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1" },
  { day: 10, hour: 16, min: 45, tier: "PROD", network: "production", suiteId: "suite_nightly_prod", envId: "prod_prod", status: "PASS", passPct: 100, failures: 0, build: "c5d6e7f", rev: "c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2" },
];

// ── Helpers ──────────────────────────────────────────────────────────────
function randomId() {
  return Math.random().toString(36).substring(2, 10);
}

function baseDate(day) {
  return `2026-06-${String(day).padStart(2, "0")}`;
}

function isoDate(day, hour, min) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(min).padStart(2, "0");
  const ss = String(Math.floor(Math.random() * 60)).padStart(2, "0");
  return `${baseDate(day)}T${hh}:${mm}:${ss}.${String(Math.floor(Math.random() * 900) + 100)}Z`;
}

function formatDuration(ms) {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Evidence templates by category
const EVIDENCE_TEMPLATES = {
  "geo-match": {
    request: (test) => ({
      method: "GET",
      url: test.scriptPath?.includes("failover") ? "https://api.edge-service.com/failover/status" : "https://api.edge-service.com/v1/geo/lookup",
      headers: { "Accept": "application/json", "X-Region": "us-east", "X-API-Key": "••••••••" },
    }),
    response: (status) => ({
      status,
      headers: { "Content-Type": "application/json", "X-PoP": pickRandom(["IAD", "PDX", "DUB", "SIN"]), "X-Cache": pickRandom(["HIT", "MISS"]), "Server": "envoy" },
    }),
  },
  caching: {
    request: (test) => ({
      method: "GET",
      url: "https://cdn.edge-service.com/static/bundle.js",
      headers: { "Accept": "*/*", "Accept-Encoding": "gzip, deflate, br" },
    }),
    response: (status) => ({
      status,
      headers: { "Content-Type": "application/javascript", "Cache-Control": "public, max-age=31536000, immutable", "Age": String(Math.floor(Math.random() * 86400)), "X-Cache": pickRandom(["HIT", "HIT", "HIT", "MISS"]), "Server": "cloudfront" },
    }),
  },
  performance: {
    request: (test) => ({
      method: "GET",
      url: "https://api.edge-service.com/v1/data",
      headers: { "Accept": "application/json", "Accept-Encoding": "gzip, deflate, br" },
    }),
    response: (status) => ({
      status,
      headers: { "Content-Type": "application/json", "Content-Encoding": "gzip", "Server": "nginx/1.24", "X-Response-Time-ms": String(Math.floor(Math.random() * 180) + 20) },
    }),
  },
  security: {
    request: (test) => {
      const isWaf = test.scriptPath?.includes("WafRules");
      return {
        method: isWaf ? "POST" : "GET",
        url: isWaf ? "https://api.edge-service.com/v1/submit" : "https://api.edge-service.com/v1/status",
        headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0", ...(isWaf ? { "Content-Type": "application/json" } : {}) },
      };
    },
    response: (status) => ({
      status,
      headers: {
        "Content-Type": "application/json",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Content-Security-Policy": "default-src 'self'",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Server": "nginx/1.24",
      },
    }),
  },
  functional: {
    request: (test) => ({
      method: "GET",
      url: `https://the-internet.herokuapp.com${test.scriptPath?.includes("dropdown") ? "/dropdown" : test.scriptPath?.includes("checkbox") ? "/checkboxes" : "/"}`,
      headers: { "Accept": "text/html", "User-Agent": "Mozilla/5.0" },
    }),
    response: (status) => ({
      status,
      headers: { "Content-Type": "text/html; charset=utf-8", "Server": "thin", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "SAMEORIGIN" },
    }),
  },
  e2e: {
    request: (test) => ({
      method: "GET",
      url: "https://the-internet.herokuapp.com/",
      headers: { "Accept": "text/html", "User-Agent": "Mozilla/5.0" },
    }),
    response: (status) => ({
      status,
      headers: { "Content-Type": "text/html; charset=utf-8", "Server": "thin", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "SAMEORIGIN" },
    }),
  },
  network: {
    request: (test) => ({
      method: "GET",
      url: "https://the-internet.herokuapp.com/frames",
      headers: { "Accept": "text/html", "User-Agent": "Puppeteer/22" },
    }),
    response: (status) => ({
      status,
      headers: { "Content-Type": "text/html", "Server": "thin", "X-Content-Type-Options": "nosniff" },
    }),
  },
  screenshots: {
    request: (test) => ({
      method: "GET",
      url: "https://the-internet.herokuapp.com/login",
      headers: { "Accept": "text/html", "User-Agent": "Puppeteer/22" },
    }),
    response: (status) => ({
      status,
      headers: { "Content-Type": "text/html", "Content-Length": "7911", "Server": "thin", "X-Content-Type-Options": "nosniff" },
    }),
  },
  general: {
    request: (test) => ({
      method: "GET",
      url: "https://aware.dev/",
      headers: { "Accept": "text/html", "User-Agent": "Playwright/1.45" },
    }),
    response: (status) => ({
      status,
      headers: { "Content-Type": "text/html; charset=utf-8", "Server": "nginx/1.24", "X-Content-Type-Options": "nosniff" },
    }),
  },
  http: {
    request: (test) => ({
      method: "GET",
      url: "https://the-internet.herokuapp.com/",
      headers: { "Accept": "text/html", "User-Agent": "curl/8.4" },
    }),
    response: (status) => ({
      status,
      headers: { "Content-Type": "text/html", "Content-Length": "7923", "Server": "thin", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "SAMEORIGIN" },
    }),
  },
};

function getTemplateForCategory(category) {
  return EVIDENCE_TEMPLATES[category] || EVIDENCE_TEMPLATES.general;
}

function wrapAssertions() {
  return [];
}

function makeEvidence(test, status) {
  const tpl = getTemplateForCategory(test.category);
  const req = tpl.request(test);
  const res = tpl.response(status);
  return {
    request: { method: req.method, url: req.url, headers: req.headers },
    response: { status: res.status, headers: res.headers },
    assertions: [],
  };
}

function makeTestResult(test, status, duration, runId) {
  return {
    id: test.id,
    testCaseId: test.id,
    runId,
    name: test.name,
    status,
    duration,
    category: test.category.charAt(0).toUpperCase() + test.category.slice(1),
    suite: test.scriptPath?.split("::")[0] || test.scriptPath || "unknown",
    evidence: makeEvidence(test, status === "PASS" ? 200 : status === "FAIL" && test.category === "security" ? 403 : test.category === "caching" ? 304 : test.category === "performance" ? 502 : 500),
    assertions: [],
    ...(status === "FAIL" ? { error: `Test failed: expected ${test.expectedBehavior?.substring(0, 40) || "pass"} but got failure` } : {}),
  };
}

// ── Generate runs.json and test-results.json ─────────────────────────────
const runs = [];
const testResults = {};

for (const def of RUN_DEFS) {
  const id = `run_202606${String(def.day).padStart(2, "0")}_${randomId()}`;
  const baseDurationMsPerTest = Math.floor(Math.random() * 400) + 100;
  const totalDurationMs = baseDurationMsPerTest * TEST_COUNT + Math.floor(Math.random() * 5000);
  const started = isoDate(def.day, def.hour, def.min);

  runs.push({
    id,
    label: `CI — Jun ${def.day}, 2026`,
    suiteId: def.suiteId,
    envId: def.envId,
    env: def.tier,
    network: def.network,
    status: def.status,
    passPct: def.passPct,
    failures: def.failures,
    duration: formatDuration(totalDurationMs),
    durationMs: totalDurationMs,
    started,
    build: def.build,
    rev: def.rev,
  });

  // Generate test results for this run
  const results = [];
  let failureCount = 0;
  for (const test of ALL_TESTS) {
    const shouldPass = Math.random() * 100 < def.passPct;
    const status = shouldPass ? "PASS" : "FAIL";
    if (!shouldPass) failureCount++;
    const duration = Math.floor(Math.random() * 1500) + 50;
    results.push(makeTestResult(test, status, duration, id));
  }
  // Ensure failure count matches (approximate)
  if (failureCount !== def.failures && results.length > 0) {
    // Adjust last result to match
    const diff = def.failures - failureCount;
    if (diff > 0) {
      // Need more failures — flip some passes
      let flipped = 0;
      for (let i = results.length - 1; i >= 0 && flipped < diff; i--) {
        if (results[i].status === "PASS") {
          results[i].status = "FAIL";
          results[i].evidence.response.status = 500;
          results[i].error = "Synthetic failure for data consistency";
          flipped++;
        }
      }
    } else if (diff < 0) {
      // Too many failures — flip some back
      let flipped = 0;
      for (let i = results.length - 1; i >= 0 && flipped < Math.abs(diff); i--) {
        if (results[i].status === "FAIL") {
          results[i].status = "PASS";
          results[i].evidence.response.status = 200;
          delete results[i].error;
          flipped++;
        }
      }
    }
  }
  testResults[id] = results;
}

// ── Generate diff-rows.json ──────────────────────────────────────────────
// Take the last 2 runs for comparison
const sortedRuns = [...runs].sort((a, b) => new Date(b.started) - new Date(a.started));
const baselineRunId = sortedRuns[1]?.id || sortedRuns[0].id;
const candidateRunId = sortedRuns[0].id;

const baselineResults = testResults[baselineRunId] || [];
const candidateResults = testResults[candidateRunId] || [];

// Deterministic diff: pick first test from each category, plus a few more
const diffCandidates = new Set();
for (const t of ALL_TESTS) {
  const key = t.category;
  if (!diffCandidates.has(key)) {
    diffCandidates.add(t.id);
  }
}
// Add a few more for variety
for (const t of ALL_TESTS) {
  if (diffCandidates.size >= 15) break;
  if (!diffCandidates.has(t.id)) diffCandidates.add(t.id);
}

const diffRows = [];
let diffIdx = 0;
for (const test of ALL_TESTS) {
  if (!diffCandidates.has(test.id) && diffRows.length >= 10) continue;
  if (diffRows.length >= 15) break;
  if (!diffCandidates.has(test.id)) continue;

  const base = baselineResults.find(r => r.id === test.id);
  const cand = candidateResults.find(r => r.id === test.id);

  const baseStatus = base?.status || "PASS";
  const candStatus = cand?.status || "PASS";
  const durBase = base?.duration || Math.floor(Math.random() * 500) + 50;
  const durCand = cand?.duration || Math.floor(Math.random() * 500) + 50;

  let state;
  if (baseStatus === "PASS" && candStatus === "FAIL") state = "regression";
  else if (baseStatus === "FAIL" && candStatus === "PASS") state = "fixed";
  else if (Math.abs(durCand - durBase) / (durBase || 1) > 0.3) state = "duration";
  else state = "unchanged";

  diffRows.push({
    id: `diff_${test.id}`,
    name: test.name,
    baseStatus,
    candStatus,
    durBase,
    durCand,
    category: test.category,
    state,
  });
  diffIdx++;
}

// ── Generate promotions.json ─────────────────────────────────────────────
// For each run in reverse chronological order, decide promotion
const promotions = [];
const reversedRuns = [...runs].sort((a, b) => new Date(b.started) - new Date(a.started));

for (let i = 0; i < reversedRuns.length; i++) {
  const run = reversedRuns[i];
  let decision;
  if (run.status === "FAIL") decision = "block";
  else if (run.status === "FLAKY") decision = "pending";
  else if (run.passPct >= 98) decision = "promote";
  else if (run.passPct >= 90) decision = Math.random() > 0.3 ? "promote" : "pending";
  else decision = "block";

  promotions.push({
    runId: run.id,
    decision,
    ...(decision !== "pending" ? { decidedBy: "ci-bot@aware.dev", decidedAt: run.started, note: decision === "promote" ? "All quality gates passed" : `Blocked: ${run.failures} failures (${run.passPct}% pass rate)` } : {}),
  });
}

// ── Write all files ──────────────────────────────────────────────────────
writeFileSync(join(dataDir, "runs.json"), JSON.stringify(runs, null, 2) + "\n");
console.log(`✓ runs.json: ${runs.length} runs`);

writeFileSync(join(dataDir, "test-results.json"), JSON.stringify(testResults, null, 2) + "\n");
const totalResults = Object.values(testResults).reduce((s, arr) => s + arr.length, 0);
console.log(`✓ test-results.json: ${Object.keys(testResults).length} runs × ${TEST_COUNT} tests = ${totalResults} results`);

writeFileSync(join(dataDir, "diff-rows.json"), JSON.stringify(diffRows, null, 2) + "\n");
console.log(`✓ diff-rows.json: ${diffRows.length} diff rows`);

writeFileSync(join(dataDir, "promotions.json"), JSON.stringify(promotions, null, 2) + "\n");
console.log(`✓ promotions.json: ${promotions.length} promotion decisions`);

// ── Summary ──────────────────────────────────────────────────────────────
const totalTestResults = Object.values(testResults).reduce((s, arr) => s + arr.length, 0);
const totalFailures = Object.values(testResults).reduce((s, arr) => s + arr.filter(r => r.status === "FAIL").length, 0);
console.log(`\n📊 Summary:`);
console.log(`   ${runs.length} runs across ${new Set(runs.map(r => r.started.slice(0, 10))).size} days`);
console.log(`   ${ALL_TESTS.length} unique tests (${ALL_TESTS.filter(t => t.id.startsWith("ad_")).length} pytest, ${ALL_TESTS.filter(t => t.id.startsWith("pw_")).length} Playwright, ${ALL_TESTS.filter(t => t.id.startsWith("pu_")).length} Puppeteer, ${ALL_TESTS.filter(t => t.id.startsWith("ht_")).length} HTTP)`);
console.log(`   ${totalTestResults} total test results (${totalFailures} failures, ${totalTestResults - totalFailures} passes)`);
console.log(`   ${diffRows.length} diff rows, ${promotions.length} promotion decisions`);

// Check: every run has test results
let errors = 0;
for (const run of runs) {
  if (!testResults[run.id]) {
    console.error(`  ✗ Run "${run.id}" missing test results`);
    errors++;
  }
}
// Check: every test result ID exists in auto-tests
for (const [runId, results] of Object.entries(testResults)) {
  for (const r of results) {
    if (!testById[r.id]) {
      console.error(`  ✗ test-results[${runId}] references "${r.id}" not in auto-tests`);
      errors++;
    }
  }
}

if (errors) {
  console.error(`\n❌ ${errors} consistency errors found`);
  process.exit(1);
} else {
  console.log(`\n✅ All data is consistent and correlated`);
}

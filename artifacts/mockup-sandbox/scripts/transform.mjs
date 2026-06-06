#!/usr/bin/env node
/**
 * transform.mjs — converts pytest / Playwright / Akamai Test Centre / Catchpoint
 * output to the portal's JSON data files.
 *
 * Usage:
 *   node scripts/transform.mjs --pytest report.json
 *   node scripts/transform.mjs --playwright report.json
 *   node scripts/transform.mjs --akamai report.json
 *   node scripts/transform.mjs --catchpoint report.json
 *   node scripts/transform.mjs --pytest r.json --playwright pw.json
 *   node scripts/transform.mjs --out ./my-data --pytest results.json
 *
 * Each source contributes what it can; missing data is filled from
 * other sources or with sensible defaults.
 *
 * Examples:
 *   pytest --json-report=report.json && node scripts/transform.mjs --pytest report.json
 *   npx playwright test --reporter=json 2> report.json && node scripts/transform.mjs --playwright report.json
 */

import fs from "fs";
import path from "path";

const OUT_DIR = process.argv.includes("--out")
  ? path.resolve(process.argv[process.argv.indexOf("--out") + 1])
  : path.resolve(import.meta.dirname, "..", "data");

// ── Helpers ──────────────────────────────────────────

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf-8"));
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

const ENVS = ["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"];

// ── Normalise status strings ─────────────────────────

function toPortalStatus(status) {
  if (!status) return "PASS";
  const s = String(status).toLowerCase().trim();
  if (["pass", "passed", "success", "ok", "true", "expected", "0"].includes(s)) return "PASS";
  if (["fail", "failed", "error", "failure", "false", "unexpected", "1"].includes(s)) return "FAIL";
  return "PASS";
}

function toPortalSuite(fileName) {
  if (!fileName) return "default";
  const base = path.basename(fileName, path.extname(fileName));
  return base.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function toDiffState(baseStatus, candStatus, durBase, durCand) {
  if (baseStatus === "PASS" && candStatus === "FAIL") return "regression";
  if (baseStatus === "FAIL" && candStatus === "PASS") return "fixed";
  if (Math.abs(durCand - durBase) > durBase * 0.2) return "duration";
  return "unchanged";
}

// ── Source adapters ──────────────────────────────────

const ADAPTERS = {};

/**
 * pytest JSON report adapter
 * Input format: pytest --json-report=report.json
 * https://pypi.org/project/pytest-json-report/
 *
 * Also handles JUnit XML converted to JSON.
 */
ADAPTERS.pytest = (data) => {
  const tests = data.tests || [];
  const runId = `run_${Date.now()}`;
  const started = data.created
    ? new Date(data.created * 1000).toISOString()
    : new Date().toISOString();
  const durationSec = data.duration || 0;
  const passed = tests.filter(t => toPortalStatus(t.outcome) === "PASS").length;
  const total = tests.length || 1;

  // runs.json — single run
  const runs = [{
    id: runId,
    label: `pytest · ${total} tests`,
    suite: "default",
    target: "Prod",
    status: data.exitcode === 0 ? "PASS" : "FAIL",
    passPct: Math.round((passed / total) * 100),
    failures: total - passed,
    duration: `${Math.round(durationSec)}s`,
    durationMs: Math.round(durationSec * 1000),
    started,
    pm: "pytest",
    ew: "",
    env: ENVS[0],
  }];

  // Per-test results
  const testResults = tests.map((t, i) => ({
    id: t.nodeid || `test_${i}`,
    name: t.nodeid || `test_${i}`,
    status: toPortalStatus(t.outcome),
    duration: Math.round((t.call?.duration || t.duration || 0) * 1000),
    category: t.nodeid?.split("/")[0] || "general",
    suite: toPortalSuite(t.nodeid || ""),
  }));

  // diff.json — compare pass vs fail
  const diffs = testResults.map((tr, i) => ({
    id: `diff_${i}`,
    name: tr.name,
    baseStatus: "PASS",
    candStatus: tr.status,
    durBase: 120,
    durCand: tr.duration,
    category: tr.category,
    state: tr.status === "FAIL" ? "regression" : "unchanged",
  }));

  // diff/details.json
  const details = diffs.map(() => ({
    history: [{ runId, status: "PASS", duration: 0, env: ENVS[0] }],
    passRate: 100,
    flakinessScore: 0,
    avgDuration: 0,
  }));

  // env summary
  const summary = [{
    label: "pytest",
    passRate: Math.round((passed / total) * 100),
    trend: 0,
    failures: total - passed,
    color: data.exitcode === 0 ? "#1e8e3e" : "#d93025",
    alert: data.exitcode === 0 ? null : `${total - passed} FAILURES`,
  }];

  // pass-rate chart data
  const passRateChartData = [
    ["Run", "Pass Rate", { type: "string", role: "tooltip" }],
    [started.slice(0, 10), Math.round((passed / total) * 100), `${passed}/${total} passed`],
  ];

  // env-pass-rate chart data
  const envPassRateData = [
    ["Run", "Pass Rate", { type: "string", role: "tooltip", p: { html: true } }],
    [started.slice(0, 10), Math.round((passed / total) * 100),
      `<b>${started.slice(0, 10)}</b><br>Passed: ${passed}/${total}`],
  ];

  return { runs, diffs, details, summary, passRateChartData, envPassRateData };
};

/**
 * Playwright JSON report adapter
 * Input: npx playwright test --reporter=json 2> report.json
 * https://playwright.dev/docs/test-reporters#json-reporter
 */
ADAPTERS.playwright = (data) => {
  const suites = data.suites || [];
  const allSpecs = [];
  const runId = `pw_${Date.now()}`;
  const started = new Date().toISOString();

  function flattenSpecs(suite) {
    for (const spec of suite.specs || []) {
      const specData = {
        title: spec.title,
        file: suite.file || spec.file || "",
        line: spec.line,
        tests: spec.tests || [],
        ok: spec.ok,
      };
      allSpecs.push(specData);
    }
    for (const child of suite.suites || []) {
      flattenSpecs(child);
    }
  }
  for (const suite of suites) flattenSpecs(suite);

  const passed = allSpecs.filter(s => s.ok !== false).length;
  const total = allSpecs.length || 1;

  // runs.json
  const runs = [{
    id: runId,
    label: `Playwright · ${total} specs`,
    suite: "e2e",
    target: "Prod",
    status: passed === total ? "PASS" : "FAIL",
    passPct: Math.round((passed / total) * 100),
    failures: total - passed,
    duration: `${Math.round((data.stats?.duration || 0) / 1000)}s`,
    durationMs: data.stats?.duration || 0,
    started,
    pm: "playwright",
    ew: data.config?.version || "",
    env: ENVS[0],
  }];

  const testResults = allSpecs.map((s, i) => {
    const t = s.tests?.[0] || {};
    const status = s.ok !== false && toPortalStatus(t.status) === "PASS" ? "PASS" : "FAIL";
    return {
      id: s.title || `spec_${i}`,
      name: s.title || `spec_${i}`,
      status,
      duration: Math.round(t.duration || 0),
      category: toPortalSuite(s.file),
      suite: toPortalSuite(s.file),
    };
  });

  const diffs = testResults.map((tr, i) => ({
    id: `diff_${i}`,
    name: tr.name,
    baseStatus: "PASS",
    candStatus: tr.status,
    durBase: 120,
    durCand: tr.duration,
    category: tr.category,
    state: tr.status === "FAIL" ? "regression" : "unchanged",
  }));

  const details = diffs.map(() => ({
    history: [{ runId, status: "PASS", duration: 0, env: ENVS[0] }],
    passRate: 100,
    flakinessScore: 0,
    avgDuration: 0,
  }));

  const summary = [{
    label: "Playwright",
    passRate: Math.round((passed / total) * 100),
    trend: 0,
    failures: total - passed,
    color: passed === total ? "#1e8e3e" : "#d93025",
    alert: passed === total ? null : `${total - passed} FAILURES`,
  }];

  const passRateChartData = [
    ["Run", "Pass Rate", { type: "string", role: "tooltip" }],
    [started.slice(0, 10), Math.round((passed / total) * 100), `${passed}/${total} passed`],
  ];

  const envPassRateData = [
    ["Run", "Pass Rate", { type: "string", role: "tooltip", p: { html: true } }],
    [started.slice(0, 10), Math.round((passed / total) * 100),
      `<b>${started.slice(0, 10)}</b><br>Passed: ${passed}/${total}`],
  ];

  return { runs, diffs, details, summary, passRateChartData, envPassRateData };
};

/**
 * Catchpoint JSON adapter
 * Catchpoint exports test result JSON via their API or scheduled reports.
 * Common fields: testName, status, totalTime, timestamp, node, errorType
 */
ADAPTERS.catchpoint = (data) => {
  const now = Date.now();
  const runId = `cp_${now}`;
  const started = new Date().toISOString();

  // Catchpoint can return single test or a batch
  const tests = Array.isArray(data) ? data : (data.tests || data.results || [data].filter(Boolean));

  const parsedTests = tests.map((t, i) => {
    const status = toPortalStatus(t.status ?? t.result ?? t.success ?? t.passed);
    return {
      id: `cp_test_${i}`,
      name: t.testName || t.name || t.url || `Catchpoint ${i}`,
      status,
      duration: Math.round(t.totalTime ?? t.duration ?? t.responseTime ?? t.time ?? 0),
      category: (t.node || t.division || "catchpoint").replace(/[^a-zA-Z0-9_-]/g, "_"),
      suite: (t.testType || t.type || "catchpoint").replace(/[^a-zA-Z0-9_-]/g, "_"),
    };
  });

  const passed = parsedTests.filter(t => t.status === "PASS").length;
  const total = parsedTests.length || 1;

  const runs = [{
    id: runId,
    label: `Catchpoint · ${total} nodes`,
    suite: "synthetic",
    target: "Prod",
    status: passed === total ? "PASS" : "FAIL",
    passPct: Math.round((passed / total) * 100),
    failures: total - passed,
    duration: `${Math.round((data.duration || data.totalDuration || 0) / 1000)}s` || "0s",
    durationMs: data.duration || data.totalDuration || 0,
    started,
    pm: "catchpoint",
    ew: "",
    env: ENVS[0],
  }];

  const diffs = parsedTests.map((tr, i) => ({
    id: `diff_${i}`,
    name: tr.name,
    baseStatus: "PASS",
    candStatus: tr.status,
    durBase: 120,
    durCand: tr.duration,
    category: tr.category,
    state: tr.status === "FAIL" ? "regression" : "unchanged",
  }));

  const details = diffs.map(() => ({
    history: [{ runId, status: "PASS", duration: 0, env: ENVS[0] }],
    passRate: 100,
    flakinessScore: 0,
    avgDuration: 0,
  }));

  const summary = [{
    label: "Catchpoint",
    passRate: Math.round((passed / total) * 100),
    trend: 0,
    failures: total - passed,
    color: passed === total ? "#1e8e3e" : "#d93025",
    alert: passed === total ? null : `${total - passed} FAILURES`,
  }];

  const passRateChartData = [
    ["Run", "Pass Rate", { type: "string", role: "tooltip" }],
    [started.slice(0, 10), Math.round((passed / total) * 100), `${passed}/${total} passed`],
  ];

  const envPassRateData = [
    ["Run", "Pass Rate", { type: "string", role: "tooltip", p: { html: true } }],
    [started.slice(0, 10), Math.round((passed / total) * 100),
      `<b>${started.slice(0, 10)}</b><br>Passed: ${passed}/${total}`],
  ];

  return { runs, diffs, details, summary, passRateChartData, envPassRateData };
};

/**
 * Akamai Test Centre adapter
 * Akamai Test Centre output varies by product. Common patterns:
 * - Property Manager validation: { tests: [{ name, status, rule }] }
 * - EdgeWorker tests: { results: [{ testName, passed, executionTimeMs }] }
 * - API validation: [{ endpoint, statusCode, passed }]
 *
 * This adapter normalises the most common shapes.
 */
ADAPTERS.akamai = (data) => {
  const now = Date.now();
  const runId = `akamai_${now}`;
  const started = new Date().toISOString();

  // Try different common Akamai data shapes
  let rawTests = [];
  if (Array.isArray(data)) {
    rawTests = data;
  } else if (data.tests) {
    rawTests = data.tests;
  } else if (data.results) {
    rawTests = data.results;
  } else if (data.ruleSet || data.propertyManager) {
    // May be a PM validation result
    rawTests = [data];
  }

  const parsedTests = rawTests.map((t, i) => {
    // Handle various field naming conventions
    const name = t.name || t.testName || t.rule || t.endpoint || t.description || `Test ${i}`;
    const rawStatus = t.status ?? t.result ?? t.passed ?? t.success ?? t.outcome;
    const status = toPortalStatus(rawStatus);
    const duration = Math.round(
      t.duration ?? t.executionTimeMs ?? t.responseTime ?? t.time ?? 0
    );

    return {
      id: `akamai_${i}`,
      name,
      status,
      duration,
      category: (t.ruleSet || t.category || t.product || "akamai").replace(/[^a-zA-Z0-9_-]/g, "_"),
      suite: (t.suite || t.group || "default").replace(/[^a-zA-Z0-9_-]/g, "_"),
    };
  });

  const passed = parsedTests.filter(t => t.status === "PASS").length;
  const total = parsedTests.length || 1;

  const runs = [{
    id: runId,
    label: `Akamai Test Centre · ${total} checks`,
    suite: "edge",
    target: "CDN",
    status: passed === total ? "PASS" : "FAIL",
    passPct: Math.round((passed / total) * 100),
    failures: total - passed,
    duration: `${Math.round((data.totalDuration || data.duration || 0) / 1000)}s` || "0s",
    durationMs: data.totalDuration || data.duration || 0,
    started,
    pm: data.pmVersion || data.propertyManager || "akamai-pm",
    ew: data.ewVersion || data.edgeWorker || "",
    env: ENVS[0],
  }];

  const diffs = parsedTests.map((tr, i) => ({
    id: `diff_${i}`,
    name: tr.name,
    baseStatus: "PASS",
    candStatus: tr.status,
    durBase: 120,
    durCand: tr.duration,
    category: tr.category,
    state: tr.status === "FAIL" ? "regression" : "unchanged",
  }));

  const details = diffs.map(() => ({
    history: [{ runId, status: "PASS", duration: 0, env: ENVS[0] }],
    passRate: 100,
    flakinessScore: 0,
    avgDuration: 0,
  }));

  const summary = [{
    label: "Akamai Test Centre",
    passRate: Math.round((passed / total) * 100),
    trend: 0,
    failures: total - passed,
    color: passed === total ? "#1e8e3e" : "#d93025",
    alert: passed === total ? null : `${total - passed} FAILURES`,
  }];

  const passRateChartData = [
    ["Run", "Pass Rate", { type: "string", role: "tooltip" }],
    [started.slice(0, 10), Math.round((passed / total) * 100), `${passed}/${total} passed`],
  ];

  const envPassRateData = [
    ["Run", "Pass Rate", { type: "string", role: "tooltip", p: { html: true } }],
    [started.slice(0, 10), Math.round((passed / total) * 100),
      `<b>${started.slice(0, 10)}</b><br>Passed: ${passed}/${total}`],
  ];

  return { runs, diffs, details, summary, passRateChartData, envPassRateData };
};

// ── Merge multiple sources ───────────────────────────

function mergeResults(results) {
  let runs = [];
  let diffs = [];
  let details = [];
  let summary = [];
  let passRateChartData = null;
  let envPassRateData = null;

  for (const r of results) {
    if (!r) continue;
    if (r.runs) runs.push(...r.runs);
    if (r.diffs) diffs.push(...r.diffs);
    if (r.details) details.push(...r.details);
    if (r.summary) summary.push(...r.summary);
    if (!passRateChartData) passRateChartData = r.passRateChartData;
    if (!envPassRateData) envPassRateData = r.envPassRateData;
  }

  return { runs, diffs, details, summary, passRateChartData, envPassRateData };
}

// ── Write output ─────────────────────────────────────

function writeFiles(results) {
  const { runs, diffs, details, summary, passRateChartData, envPassRateData } = results;

  if (!runs.length && !diffs.length && !details.length && !summary.length) {
    console.error("❌ No data produced. Check your input file format.");
    process.exit(1);
  }

  fs.mkdirSync(path.join(OUT_DIR, "diff"), { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "dashboard"), { recursive: true });

  const files = {};
  if (runs.length)        files["runs.json"] = runs;
  if (diffs.length)       files["diff.json"] = diffs;
  if (details.length)     files["diff/details.json"] = details;
  if (summary.length)     files["dashboard/env-summary.json"] = summary;
  if (passRateChartData)  files["dashboard/pass-rate.json"] = passRateChartData;
  if (envPassRateData)    files["dashboard/env-pass-rate.json"] = envPassRateData;

  for (const [filePath, data] of Object.entries(files)) {
    const fullPath = path.join(OUT_DIR, filePath);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    console.log(`  ✅ ${path.relative(OUT_DIR, fullPath)}`);
  }

  const runCount = runs.length;
  const testCount = diffs.length;
  const failCount = diffs.filter(d => d.candStatus === "FAIL").length;
  console.log(`\n📁 Generated in ${OUT_DIR}`);
  console.log(`   ${runCount} run(s), ${testCount} test(s), ${failCount} failure(s)`);
}

// ── CLI ──────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage:
  node scripts/transform.mjs --pytest report.json
  node scripts/transform.mjs --playwright report.json
  node scripts/transform.mjs --akamai report.json
  node scripts/transform.mjs --catchpoint report.json
  node scripts/transform.mjs --pytest r.json --playwright pw.json  (merge)
  node scripts/transform.mjs --out ./my-data --pytest results.json

Sources:
  --pytest       pytest JSON report (pytest --json-report)
  --playwright   Playwright JSON report (--reporter=json)
  --akamai       Akamai Test Centre export (JSON)
  --catchpoint   Catchpoint test results export (JSON)

Options:
  --out <dir>    Output directory (default: ./data)
  --help, -h     Show this help
`);
    process.exit(0);
  }

  const sources = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (ADAPTERS[arg.replace(/^--/, "")]) {
      const sourceName = arg.replace(/^--/, "");
      const filePath = args[++i];
      if (!filePath || filePath.startsWith("--")) {
        console.error(`❌ Missing file path for --${sourceName}`);
        process.exit(1);
      }
      const data = loadJSON(filePath);
      const result = ADAPTERS[sourceName](data);
      sources.push(result);
      console.log(`  📥 ${sourceName}: ${filePath} (${Array.isArray(data) ? data.length + ' items' : Object.keys(data).length + ' keys'})`);
    }
  }

  if (sources.length === 0) {
    console.error("❌ No valid sources found. Use --pytest, --playwright, --akamai, or --catchpoint.");
    process.exit(1);
  }

  const merged = mergeResults(sources);
  writeFiles(merged);
  console.log("\n✅ Transform complete. Run with VITE_USE_MOCK=false to use live data.");
}

main();

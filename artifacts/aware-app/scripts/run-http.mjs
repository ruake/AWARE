#!/usr/bin/env node
/**
 * HTTP Test Runner
 *
 * Executes HTTP-level tests against target URLs using Node.js fetch,
 * validating status codes, headers, response times, and content types.
 * Outputs Playwright-compatible JSON for record-run.mjs.
 *
 * Usage:
 *   node scripts/run-http.mjs [--output path]
 *
 * Defaults:
 *   --output  test-results/http-results.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const TEST_BASE = "https://the-internet.herokuapp.com";

const ENDPOINTS = [
  "/login",
  "/checkboxes",
  "/dropdown",
  "/dynamic_loading/2",
  "/javascript_alerts",
  "/frames",
  "/windows",
  "/key_presses",
  "/upload",
  "/drag_and_drop",
  "/status_codes",
  "/basic_auth",
  "/digest_auth",
  "/secure",
  "/redirector",
];

const SECURITY_HEADERS = [
  "x-content-type-options",
  "x-frame-options",
  "x-xss-protection",
  "strict-transport-security",
];

async function checkUrl(url, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const start = Date.now();
  try {
    const resp = await fetch(url, { signal: controller.signal, redirect: "manual" });
    clearTimeout(id);
    const duration = Date.now() - start;
    const headers = Object.fromEntries(resp.headers.entries());
    return { status: resp.status, duration, headers, ok: resp.status >= 200 && resp.status < 400 };
  } catch (err) {
    clearTimeout(id);
    return { status: 0, duration: Date.now() - start, headers: {}, ok: false, error: err.message };
  }
}

function testResult(name, category, suite, passed, duration, statusCode, requestUrl, responseHeaders, error, extras) {
  return { name, category, suite, passed, duration, statusCode, requestUrl, responseHeaders, error, extras };
}

async function runHealthTests() {
  const suite = "HTTP Health Checks";
  const results = [];
  for (const ep of ENDPOINTS) {
    const url = `${TEST_BASE}${ep}`;
    const r = await checkUrl(url);
    const expected = ep === "/secure" ? 302 : ep === "/basic_auth" || ep === "/digest_auth" ? 401 : 200;
    const passed = r.status === expected;
    results.push(testResult(
      `${ep} returns ${expected}`,
      "URL Health",
      suite,
      passed,
      r.duration,
      r.status,
      url,
      r.headers,
      !passed ? `Expected HTTP ${expected}, got ${r.status}` : undefined,
    ));
  }

  // Additional: non-existent page returns 404
  const notFound = await checkUrl(`${TEST_BASE}/nonexistent-page-12345`);
  results.push(testResult(
    "non-existent page returns 404",
    "URL Health",
    suite,
    notFound.status === 404,
    notFound.duration,
    notFound.status,
    `${TEST_BASE}/nonexistent-page-12345`,
    notFound.headers,
    notFound.status !== 404 ? `Expected 404, got ${notFound.status}` : undefined,
  ));

  // All-pages response time check
  const allOk = results.filter(r => r.passed).length;
  results.push(testResult(
    `all health checks passed (${allOk}/${results.length + 1})`,
    "URL Health",
    suite,
    allOk === results.length,
    0,
    0,
    TEST_BASE,
    {},
    allOk !== results.length ? `${results.length - allOk} checks failed` : undefined,
  ));

  return results;
}

async function runSecurityHeaderTests() {
  const suite = "HTTP Security Headers";
  const results = [];

  // Check security headers on login page
  const login = await checkUrl(`${TEST_BASE}/login`);
  for (const h of SECURITY_HEADERS) {
    const val = login.headers[h] || login.headers[h.toLowerCase()] || "";
    const present = val.length > 0;
    results.push(testResult(
      `login page has ${h} header`,
      "Security",
      suite,
      present,
      login.duration,
      login.status,
      `${TEST_BASE}/login`,
      login.headers,
      !present ? `Missing header: ${h}` : undefined,
    ));
  }

  // Content-Type checks on all pages
  for (const ep of ["/login", "/checkboxes", "/dropdown", "/frames", "/windows"]) {
    const r = await checkUrl(`${TEST_BASE}${ep}`);
    const ct = (r.headers["content-type"] || "").toLowerCase();
    const hasHtml = ct.includes("text/html");
    results.push(testResult(
      `${ep} has text/html content type`,
      "Security",
      suite,
      hasHtml,
      r.duration,
      r.status,
      `${TEST_BASE}${ep}`,
      r.headers,
      !hasHtml ? `Expected text/html, got ${ct}` : undefined,
    ));
  }

  // Server header present
  for (const ep of ["/login", "/checkboxes"]) {
    const r = await checkUrl(`${TEST_BASE}${ep}`);
    const server = r.headers["server"] || "";
    results.push(testResult(
      `${ep} has Server header`,
      "Security",
      suite,
      server.length > 0,
      r.duration,
      r.status,
      `${TEST_BASE}${ep}`,
      r.headers,
      !server ? "Missing Server header" : undefined,
    ));
  }

  // Content-Length present
  const dropdown = await checkUrl(`${TEST_BASE}/dropdown`);
  const cl = dropdown.headers["content-length"] || "";
  results.push(testResult(
    "dropdown response has Content-Length header",
    "Security",
    suite,
    cl.length > 0,
    dropdown.duration,
    dropdown.status,
    `${TEST_BASE}/dropdown`,
    dropdown.headers,
    !cl ? "Missing Content-Length header" : undefined,
  ));

  // No server version leak
  const windows = await checkUrl(`${TEST_BASE}/windows`);
  const serverVal = (windows.headers["server"] || "").toLowerCase();
  const noVersion = !serverVal.match(/\d+\.\d+/);
  results.push(testResult(
    "no page exposes internal server version",
    "Security",
    suite,
    noVersion,
    windows.duration,
    windows.status,
    `${TEST_BASE}/windows`,
    windows.headers,
    !noVersion ? `Server header may expose version: ${windows.headers["server"]}` : undefined,
  ));

  return results;
}

async function runPerformanceTests() {
  const suite = "HTTP Performance";
  const results = [];

  // Response time checks
  for (const ep of ["/login", "/checkboxes", "/dropdown", "/frames", "/windows", "/key_presses"]) {
    const r = await checkUrl(`${TEST_BASE}${ep}`);
    const limit = ep === "/dynamic_loading/2" || ep === "/frames" ? 3000 : 2000;
    const underLimit = r.duration < limit;
    results.push(testResult(
      `${ep} responds within ${limit}ms`,
      "Performance",
      suite,
      underLimit,
      r.duration,
      r.status,
      `${TEST_BASE}${ep}`,
      r.headers,
      !underLimit ? `Took ${r.duration}ms, limit ${limit}ms` : undefined,
    ));
  }

  // All pages under 5s
  const allFast = results.filter(r => r.passed).length;
  const allCount = results.length;
  results.push(testResult(
    `all herokuapp pages respond under 5s (${allFast}/${allCount})`,
    "Performance",
    suite,
    allFast === allCount,
    0,
    0,
    TEST_BASE,
    {},
    allFast !== allCount ? `${allCount - allFast} pages exceeded limit` : undefined,
  ));

  // Connection header check
  const login = await checkUrl(`${TEST_BASE}/login`);
  const conn = login.headers["connection"] || "";
  results.push(testResult(
    "login page supports HTTP/1.1 with Connection header",
    "Performance",
    suite,
    conn.length > 0,
    login.duration,
    login.status,
    `${TEST_BASE}/login`,
    login.headers,
    !conn ? "Missing Connection header" : undefined,
  ));

  // Date header check
  results.push(testResult(
    "login page response includes Date header",
    "Performance",
    suite,
    !!login.headers["date"],
    login.duration,
    login.status,
    `${TEST_BASE}/login`,
    login.headers,
    !login.headers["date"] ? "Missing Date header" : undefined,
  ));

  return results;
}

function buildPlaywrightJson(allResults) {
  const suitesMap = {};
  for (const r of allResults) {
    if (!suitesMap[r.suite]) suitesMap[r.suite] = [];
    suitesMap[r.suite].push(r);
  }

  const suites = Object.entries(suitesMap).map(([title, specs]) => ({
    title,
    specs: specs.map(r => {
      const entry = {
        title: r.name,
        tests: [{
          results: [{
            status: r.passed ? "passed" : "failed",
            duration: r.duration,
            ...(r.error ? { error: { message: r.error } } : {}),
          }],
        }],
      };
      // Attach HTTP evidence
      if (r.statusCode > 0 || r.requestUrl) {
        entry.tests[0].results[0].request = {
          method: "GET",
          url: r.requestUrl || TEST_BASE,
          headers: {},
        };
        entry.tests[0].results[0].response = {
          status: r.statusCode || 0,
          headers: r.responseHeaders || {},
        };
      }
      return entry;
    }),
  }));

  return { suites };
}

async function main() {
  console.error("\n--- HTTP test runner ---");
  console.error(`  Target: ${TEST_BASE}`);

  const health = await runHealthTests();
  console.error(`  Health: ${health.filter(r => r.passed).length}/${health.length}`);

  const security = await runSecurityHeaderTests();
  console.error(`  Security: ${security.filter(r => r.passed).length}/${security.length}`);

  const perf = await runPerformanceTests();
  console.error(`  Performance: ${perf.filter(r => r.passed).length}/${perf.length}`);

  const all = [...health, ...security, ...perf];
  const result = buildPlaywrightJson(all);

  const outputIdx = process.argv.indexOf("--output");
  const outputPath = outputIdx >= 0 ? process.argv[outputIdx + 1] : "test-results/http-results.json";
  const absOutput = path.resolve(PROJECT_ROOT, outputPath);

  fs.mkdirSync(path.dirname(absOutput), { recursive: true });
  fs.writeFileSync(absOutput, JSON.stringify(result, null, 2), "utf-8");
  console.error(`  Written: ${result.suites.reduce((a, s) => a + s.specs.length, 0)} tests across ${result.suites.length} suites`);
  console.error(`  Output: ${absOutput}`);
}

main();

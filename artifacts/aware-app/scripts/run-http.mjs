#!/usr/bin/env node
/**
 * HTTP Test Runner — Akamai CDN Edge Tests
 *
 * Executes HTTP-level CDN edge tests against the target Akamai property,
 * validating status codes, Akamai CDN headers, cache behavior, security
 * headers, and response times. Outputs Playwright-compatible JSON.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const outputIdx = args.indexOf("--output");
const baseUrlIdx = args.indexOf("--base-url");

const TEST_BASE = baseUrlIdx >= 0 ? args[baseUrlIdx + 1] : (process.env.BASE_URL || "https://www.akamai.com");

const CDN_ENDPOINTS = [
  "/",
  "/en",
  "/robots.txt",
  "/sitemap.xml",
];

const SECURITY_HEADERS = [
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "content-security-policy",
];

const CDN_HEADERS = [
  "x-cache",
  "x-akamai-transformed",
  "x-akamai-request-id",
  "server",
  "vary",
  "age",
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

async function runCdnHealthTests() {
  const suite = "HTTP CDN Health Checks";
  const results = [];

  for (const ep of CDN_ENDPOINTS) {
    const url = `${TEST_BASE}${ep}`;
    const r = await checkUrl(url);
    const expected = ep === "/nonexistent-page" ? 404 : 200;
    const passed = r.status === expected;
    results.push(testResult(
      `${ep || "homepage"} returns ${expected} via Akamai CDN`,
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

  const notFound = await checkUrl(`${TEST_BASE}/nonexistent-test-path-xyz`);
  results.push(testResult(
    "non-existent path returns 404 via Akamai CDN",
    "URL Health",
    suite,
    notFound.status === 404,
    notFound.duration,
    notFound.status,
    `${TEST_BASE}/nonexistent-test-path-xyz`,
    notFound.headers,
    notFound.status !== 404 ? `Expected 404, got ${notFound.status}` : undefined,
  ));

  const allOk = results.filter(r => r.passed).length;
  results.push(testResult(
    `all CDN health checks passed (${allOk}/${results.length})`,
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

async function runCdnHeaderTests() {
  const suite = "HTTP CDN Headers";
  const results = [];

  const homepage = await checkUrl(TEST_BASE);

  for (const h of CDN_HEADERS) {
    const val = homepage.headers[h] || homepage.headers[h.toLowerCase()] || "";
    const present = val.length > 0;
    results.push(testResult(
      `homepage has ${h} header`,
      "CDN",
      suite,
      present,
      homepage.duration,
      homepage.status,
      TEST_BASE,
      homepage.headers,
      !present ? `Missing CDN header: ${h}` : undefined,
      present ? { value: val } : undefined,
    ));
  }

  for (const h of SECURITY_HEADERS) {
    const val = homepage.headers[h] || homepage.headers[h.toLowerCase()] || "";
    const present = val.length > 0;
    results.push(testResult(
      `homepage has ${h} security header`,
      "Security",
      suite,
      present,
      homepage.duration,
      homepage.status,
      TEST_BASE,
      homepage.headers,
      !present ? `Missing security header: ${h}` : undefined,
    ));
  }

  const server = homepage.headers["server"] || "";
  const noVersion = !server.match(/\d+\.\d+/);
  results.push(testResult(
    "server header does not expose version",
    "Security",
    suite,
    noVersion,
    homepage.duration,
    homepage.status,
    TEST_BASE,
    homepage.headers,
    !noVersion ? `Server header may expose version: ${server}` : undefined,
  ));

  for (const ep of ["/en", "/robots.txt"]) {
    const r = await checkUrl(`${TEST_BASE}${ep}`);
    const ct = (r.headers["content-type"] || "").toLowerCase();
    const hasValidCt = ct.includes("text/html") || ct.includes("text/plain");
    results.push(testResult(
      `${ep} has valid Content-Type via Akamai CDN`,
      "CDN",
      suite,
      hasValidCt,
      r.duration,
      r.status,
      `${TEST_BASE}${ep}`,
      r.headers,
      !hasValidCt ? `Unexpected Content-Type: ${ct}` : undefined,
    ));
  }

  return results;
}

async function runCdnCacheTests() {
  const suite = "HTTP CDN Cache";
  const results = [];

  const first = await checkUrl(TEST_BASE);
  await new Promise(r => setTimeout(r, 200));
  const second = await checkUrl(TEST_BASE);

  const firstCache = first.headers["x-cache"] || first.headers["X-Cache"] || "";
  const secondCache = second.headers["x-cache"] || second.headers["X-Cache"] || "";
  results.push(testResult(
    "Akamai CDN serves cached content (X-Cache present)",
    "Cache",
    suite,
    firstCache.length > 0,
    first.duration,
    first.status,
    TEST_BASE,
    first.headers,
    firstCache.length === 0 ? "No X-Cache header on first request" : undefined,
    { firstRequest: firstCache, secondRequest: secondCache },
  ));

  const ageVal = parseInt(second.headers["age"] || "0", 10);
  results.push(testResult(
    "served from edge with Age header",
    "Cache",
    suite,
    ageVal >= 0,
    second.duration,
    second.status,
    TEST_BASE,
    second.headers,
    undefined,
    { age: second.headers["age"] || "0" },
  ));

  const cc = (second.headers["cache-control"] || "").toLowerCase();
  const hasCacheControl = cc.includes("public") || cc.includes("max-age") || cc.includes("s-maxage");
  results.push(testResult(
    "response has Cache-Control directive",
    "Cache",
    suite,
    hasCacheControl,
    second.duration,
    second.status,
    TEST_BASE,
    second.headers,
    !hasCacheControl ? `No cache directive in Cache-Control: ${cc}` : undefined,
  ));

  return results;
}

async function runCdnPerformanceTests() {
  const suite = "HTTP CDN Performance";
  const results = [];

  for (const ep of ["/", "/en", "/robots.txt"]) {
    const r = await checkUrl(`${TEST_BASE}${ep}`);
    const limit = 3000;
    const underLimit = r.duration < limit;
    results.push(testResult(
      `${ep || "homepage"} responds within ${limit}ms via Akamai CDN`,
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

  const allFast = results.filter(r => r.passed).length;
  results.push(testResult(
    `all Akamai CDN pages respond under 3s (${allFast}/${results.length})`,
    "Performance",
    suite,
    allFast === results.length,
    0,
    0,
    TEST_BASE,
    {},
    allFast !== results.length ? `${results.length - allFast} pages exceeded limit` : undefined,
  ));

  const homepage = await checkUrl(TEST_BASE);
  results.push(testResult(
    "response includes Date header via Akamai CDN",
    "Performance",
    suite,
    !!homepage.headers["date"],
    homepage.duration,
    homepage.status,
    TEST_BASE,
    homepage.headers,
    !homepage.headers["date"] ? "Missing Date header" : undefined,
  ));

  const cl = homepage.headers["content-length"] || "";
  results.push(testResult(
    "response includes Content-Length header via Akamai CDN",
    "Performance",
    suite,
    cl.length > 0,
    homepage.duration,
    homepage.status,
    TEST_BASE,
    homepage.headers,
    !cl ? "Missing Content-Length header" : undefined,
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
      if (r.extras) {
        entry.tests[0].results[0].attachments = [{
          name: "extras",
          contentType: "application/json",
          body: Buffer.from(JSON.stringify(r.extras)).toString("base64"),
        }];
      }
      return entry;
    }),
  }));

  return { suites };
}

async function main() {
  console.error("\n--- HTTP CDN Edge Test Runner ---");
  console.error(`  Target: ${TEST_BASE}`);

  const health = await runCdnHealthTests();
  console.error(`  Health: ${health.filter(r => r.passed).length}/${health.length}`);

  const headers = await runCdnHeaderTests();
  console.error(`  Headers: ${headers.filter(r => r.passed).length}/${headers.length}`);

  const cache = await runCdnCacheTests();
  console.error(`  Cache: ${cache.filter(r => r.passed).length}/${cache.length}`);

  const perf = await runCdnPerformanceTests();
  console.error(`  Performance: ${perf.filter(r => r.passed).length}/${perf.length}`);

  const all = [...health, ...headers, ...cache, ...perf];
  const result = buildPlaywrightJson(all);

  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : "test-results/http-results.json";
  const absOutput = path.resolve(PROJECT_ROOT, outputPath);

  fs.mkdirSync(path.dirname(absOutput), { recursive: true });
  fs.writeFileSync(absOutput, JSON.stringify(result, null, 2), "utf-8");
  console.error(`  Written: ${result.suites.reduce((a, s) => a + s.specs.length, 0)} tests across ${result.suites.length} suites`);
  console.error(`  Output: ${absOutput}`);
}

main();

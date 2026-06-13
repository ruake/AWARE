#!/usr/bin/env node
/**
 * generate-realistic-data.mjs
 *
 * Runs real HTTP tests against Akamai-served public endpoints, then uses
 * the actual measurements to seed 30 historical runs with realistic variance.
 *
 * Usage:  node scripts/generate-realistic-data.mjs  (from artifacts/aware-app/)
 */

import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");

// ── Real HTTP probe targets ───────────────────────────────────────────────
const PROBE_TARGETS = [
  { id: "geo_01",    url: "https://www.akamai.com/",                     category: "Geo-match",    checkCache: true  },
  { id: "geo_02",    url: "https://developer.akamai.com/",               category: "Geo-match",    checkCache: true  },
  { id: "geo_03",    url: "https://techdocs.akamai.com/",                category: "Geo-match",    checkCache: true  },
  { id: "cache_01",  url: "https://www.akamai.com/content/dam/site/en/images/backgrounds/homepage.jpg", category: "Caching", checkCache: true },
  { id: "cache_02",  url: "https://www.akamai.com/css/main.css",         category: "Caching",      checkCache: true  },
  { id: "sec_01",    url: "https://www.akamai.com/",                     category: "Security",     checkCache: false },
  { id: "sec_02",    url: "https://developer.akamai.com/",               category: "Security",     checkCache: false },
  { id: "edge_01",   url: "https://www.akamai.com/robots.txt",           category: "Edge-Routing", checkCache: true  },
  { id: "http_01",   url: "https://www.akamai.com/sitemap.xml",          category: "Http-Protocol",checkCache: false },
  { id: "http_02",   url: "https://developer.akamai.com/sitemap.xml",    category: "Http-Protocol",checkCache: false },
];

// ── Probe a single URL and return real timing + headers ───────────────────
async function probeUrl(target) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(target.url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "AWARE-CDN-Monitor/2.0 (Akamai test probe)",
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
    });
    clearTimeout(timeout);
    const duration = Date.now() - start;

    const headers = {};
    for (const [k, v] of res.headers.entries()) headers[k] = v;

    // Determine CDN cache status
    const cacheStatus = headers["x-cache"] || headers["x-check-cacheable"] || headers["cf-cache-status"] || "UNKNOWN";
    const pop = headers["x-pop"] || headers["x-served-by"] || headers["x-cache-hits"] ? "IAD" : null;
    const server = headers["server"] || headers["via"] || "AkamaiGHost";
    const tls = headers["alt-svc"] || null;

    // Security header checks
    const secHeaders = {
      hsts: !!headers["strict-transport-security"],
      xfo:  headers["x-frame-options"] || null,
      xcto: headers["x-content-type-options"] || null,
      csp:  !!headers["content-security-policy"],
    };

    return {
      id: target.id,
      url: target.url,
      category: target.category,
      status: res.status >= 200 && res.status < 400 ? "PASS" : "FAIL",
      httpStatus: res.status,
      duration,
      cacheStatus,
      pop,
      server,
      tls,
      secHeaders,
      rawHeaders: headers,
      ok: true,
    };
  } catch (err) {
    const duration = Date.now() - start;
    return {
      id: target.id,
      url: target.url,
      category: target.category,
      status: "FAIL",
      httpStatus: 0,
      duration: duration || 5000,
      cacheStatus: "MISS",
      pop: null,
      server: "unknown",
      tls: null,
      secHeaders: {},
      rawHeaders: {},
      ok: false,
      error: err.message,
    };
  }
}

// ── Run all probes ────────────────────────────────────────────────────────
console.log("🔍  Probing Akamai CDN endpoints in parallel…");
const probeResults = await Promise.all(PROBE_TARGETS.map(probeUrl));

for (const r of probeResults) {
  const icon = r.status === "PASS" ? "✅" : "❌";
  console.log(`  ${icon}  ${r.id.padEnd(8)} ${r.duration.toString().padStart(5)}ms  ${r.httpStatus}  cache=${r.cacheStatus}  ${r.url}`);
}

const avgDuration = Math.round(probeResults.reduce((s, r) => s + r.duration, 0) / probeResults.length);
console.log(`\n   avg TTFB: ${avgDuration}ms`);

// ── Build evidence for a test result from probe data ─────────────────────
function buildEvidence(probe, status) {
  const pop = probe.pop || pickRandom(["IAD", "ORD", "DFW", "LAX", "MIA", "SEA"]);
  const cacheHit = probe.cacheStatus?.toLowerCase().includes("hit");

  const reqHeaders = {
    "Accept":          "text/html,*/*",
    "Accept-Encoding": "gzip, deflate, br",
    "User-Agent":      "AWARE-CDN-Monitor/2.0",
    "Cache-Control":   "no-cache",
  };

  const resHeaders = {
    "Content-Type":    probe.rawHeaders["content-type"] || "text/html; charset=utf-8",
    "Server":          probe.server || "AkamaiGHost",
    "X-Cache":         probe.cacheStatus || (cacheHit ? "HIT" : "MISS"),
    "X-PoP":           pop,
    "X-Check-Cacheable": cacheHit ? "YES" : "NO",
    ...(probe.rawHeaders["strict-transport-security"] ? { "Strict-Transport-Security": probe.rawHeaders["strict-transport-security"] } : {}),
    ...(probe.rawHeaders["x-frame-options"]           ? { "X-Frame-Options":           probe.rawHeaders["x-frame-options"] }           : {}),
    ...(probe.rawHeaders["x-content-type-options"]    ? { "X-Content-Type-Options":    probe.rawHeaders["x-content-type-options"] }    : {}),
    ...(probe.rawHeaders["cache-control"]             ? { "Cache-Control":             probe.rawHeaders["cache-control"] }             : {}),
    ...(probe.rawHeaders["age"]                       ? { "Age":                       probe.rawHeaders["age"] }                       : {}),
  };

  const assertions = buildAssertions(probe, status);

  return {
    request:  { method: "GET", url: probe.url, headers: reqHeaders },
    response: { status: status === "PASS" ? probe.httpStatus || 200 : pickRandom([500, 503, 504]), headers: resHeaders },
    assertions,
  };
}

function buildAssertions(probe, status) {
  const assertions = [];
  const pop = probe.pop || "IAD";

  if (probe.category === "Geo-match") {
    const expectedPop = "IAD";
    assertions.push({
      assertion: `Resolved PoP is ${expectedPop} (US-East)`,
      expected:  expectedPop,
      actual:    status === "PASS" ? expectedPop : pickRandom(["ORD", "DFW", "LAX"]),
      passed:    status === "PASS",
    });
    assertions.push({
      assertion: "HTTP status is 200",
      expected:  "200",
      actual:    status === "PASS" ? "200" : pickRandom(["503", "502"]),
      passed:    status === "PASS",
    });
  } else if (probe.category === "Caching") {
    assertions.push({
      assertion: "X-Cache header is HIT",
      expected:  "HIT",
      actual:    status === "PASS" ? "HIT" : "MISS",
      passed:    status === "PASS",
    });
    assertions.push({
      assertion: "Cache-Control contains max-age",
      expected:  "max-age present",
      actual:    status === "PASS" ? "max-age=31536000" : "no-store",
      passed:    status === "PASS",
    });
  } else if (probe.category === "Security") {
    const hasHsts = !!probe.rawHeaders["strict-transport-security"];
    assertions.push({
      assertion: "Strict-Transport-Security header present",
      expected:  "present",
      actual:    hasHsts ? "present" : "missing",
      passed:    hasHsts,
    });
    assertions.push({
      assertion: "X-Content-Type-Options is nosniff",
      expected:  "nosniff",
      actual:    probe.rawHeaders["x-content-type-options"] || "missing",
      passed:    !!probe.rawHeaders["x-content-type-options"],
    });
  } else if (probe.category === "Edge-Routing") {
    assertions.push({
      assertion: "EdgeWorker activation confirmed",
      expected:  "active",
      actual:    status === "PASS" ? "active" : "inactive",
      passed:    status === "PASS",
    });
  } else {
    assertions.push({
      assertion: "HTTP status 2xx",
      expected:  "2xx",
      actual:    status === "PASS" ? String(probe.httpStatus || 200) : "503",
      passed:    status === "PASS",
    });
  }

  return assertions;
}

// ── Filmstrip frames (SVG data-URI waterfall frames) ─────────────────────
function buildFilmstrip(duration, status) {
  const phases = [
    { name: "DNS",      pct: 0.06, color: "#a78bfa" },
    { name: "TCP",      pct: 0.04, color: "#60a5fa" },
    { name: "TLS",      pct: 0.10, color: "#38bdf8" },
    { name: "TTFB",     pct: 0.66, color: "#fbbf24" },
    { name: "Download", pct: 0.14, color: "#34d399" },
  ];

  return phases.map((ph, i) => {
    const ms = Math.max(1, Math.round(duration * ph.pct));
    const w = Math.round(ph.pct * 200);
    const phaseStatus = i === 3 && status === "FAIL" ? "fail" : "pass"; // TTFB fails for failing tests
    const barColor = phaseStatus === "fail" ? "#ef4444" : ph.color;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" style="font-family:monospace"><rect width="200" height="60" fill="#0f172a"/><rect x="0" y="20" width="${w}" height="16" rx="2" fill="${barColor}"/><text x="4" y="14" font-size="9" fill="#94a3b8">${ph.name}</text><text x="${w + 4}" y="32" font-size="9" fill="${barColor}">${ms}ms</text></svg>`;
    return {
      id:        `frame_${ph.name.toLowerCase()}_${i}`,
      label:     `${ph.name} (${ms}ms)`,
      dataUri:   `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
      timestamp: Math.round(duration * phases.slice(0, i + 1).reduce((s, p) => s + p.pct, 0)),
    };
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(base, pct = 0.25) {
  const delta = base * pct;
  return Math.max(50, Math.round(base + (Math.random() * 2 - 1) * delta));
}

function isoTs(daysAgo, hour, min) {
  const d = new Date("2026-06-13T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, min, Math.floor(Math.random() * 60), 0);
  return d.toISOString();
}

function formatDur(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function shortHash() {
  return Math.random().toString(36).substring(2, 9);
}

function longHash() {
  return Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

// ── 30-run schedule definition ────────────────────────────────────────────
// 3 envs × 10 runs each, spread over the last 30 days
// Incident window: days 18-22 ago = cache degradation affecting PROD
const RUN_SCHEDULE = [
  // QA — staging + production, every 2-3 days
  { daysAgo: 29, h: 6,  m: 10, tier: "QA",   network: "staging",    envId: "qa_staging",   suiteId: "suite_regression_qa",  incident: false },
  { daysAgo: 26, h: 8,  m: 30, tier: "QA",   network: "production", envId: "qa_prod",      suiteId: "suite_regression_qa",  incident: false },
  { daysAgo: 23, h: 7,  m: 5,  tier: "QA",   network: "staging",    envId: "qa_staging",   suiteId: "suite_regression_qa",  incident: false },
  { daysAgo: 20, h: 9,  m: 45, tier: "QA",   network: "production", envId: "qa_prod",      suiteId: "suite_regression_qa",  incident: true  },
  { daysAgo: 17, h: 6,  m: 0,  tier: "QA",   network: "staging",    envId: "qa_staging",   suiteId: "suite_regression_qa",  incident: false },
  { daysAgo: 14, h: 7,  m: 30, tier: "QA",   network: "production", envId: "qa_prod",      suiteId: "suite_regression_qa",  incident: false },
  { daysAgo: 11, h: 6,  m: 15, tier: "QA",   network: "staging",    envId: "qa_staging",   suiteId: "suite_regression_qa",  incident: false },
  { daysAgo: 8,  h: 8,  m: 0,  tier: "QA",   network: "production", envId: "qa_prod",      suiteId: "suite_regression_qa",  incident: false },
  { daysAgo: 5,  h: 6,  m: 30, tier: "QA",   network: "staging",    envId: "qa_staging",   suiteId: "suite_regression_qa",  incident: false },
  { daysAgo: 2,  h: 7,  m: 0,  tier: "QA",   network: "production", envId: "qa_prod",      suiteId: "suite_regression_qa",  incident: false },
  // UAT — every 3 days, always production network
  { daysAgo: 28, h: 10, m: 0,  tier: "UAT",  network: "staging",    envId: "uat_staging",  suiteId: "suite_regression_uat", incident: false },
  { daysAgo: 25, h: 11, m: 30, tier: "UAT",  network: "production", envId: "uat_prod",     suiteId: "suite_regression_uat", incident: false },
  { daysAgo: 22, h: 10, m: 15, tier: "UAT",  network: "staging",    envId: "uat_staging",  suiteId: "suite_regression_uat", incident: true  },
  { daysAgo: 19, h: 12, m: 0,  tier: "UAT",  network: "production", envId: "uat_prod",     suiteId: "suite_regression_uat", incident: true  },
  { daysAgo: 16, h: 10, m: 45, tier: "UAT",  network: "staging",    envId: "uat_staging",  suiteId: "suite_regression_uat", incident: false },
  { daysAgo: 13, h: 11, m: 0,  tier: "UAT",  network: "production", envId: "uat_prod",     suiteId: "suite_regression_uat", incident: false },
  { daysAgo: 10, h: 10, m: 30, tier: "UAT",  network: "staging",    envId: "uat_staging",  suiteId: "suite_regression_uat", incident: false },
  { daysAgo: 7,  h: 12, m: 15, tier: "UAT",  network: "production", envId: "uat_prod",     suiteId: "suite_regression_uat", incident: false },
  { daysAgo: 4,  h: 10, m: 0,  tier: "UAT",  network: "staging",    envId: "uat_staging",  suiteId: "suite_regression_uat", incident: false },
  { daysAgo: 1,  h: 11, m: 45, tier: "UAT",  network: "production", envId: "uat_prod",     suiteId: "suite_regression_uat", incident: false },
  // PROD — nightly, every 3 days
  { daysAgo: 27, h: 2,  m: 0,  tier: "PROD", network: "staging",    envId: "prod_staging", suiteId: "suite_nightly_prod",   incident: false },
  { daysAgo: 24, h: 2,  m: 30, tier: "PROD", network: "production", envId: "prod_prod",    suiteId: "suite_nightly_prod",   incident: false },
  { daysAgo: 21, h: 2,  m: 15, tier: "PROD", network: "staging",    envId: "prod_staging", suiteId: "suite_nightly_prod",   incident: true  },
  { daysAgo: 18, h: 2,  m: 0,  tier: "PROD", network: "production", envId: "prod_prod",    suiteId: "suite_nightly_prod",   incident: true  },
  { daysAgo: 15, h: 2,  m: 45, tier: "PROD", network: "staging",    envId: "prod_staging", suiteId: "suite_nightly_prod",   incident: false },
  { daysAgo: 12, h: 2,  m: 0,  tier: "PROD", network: "production", envId: "prod_prod",    suiteId: "suite_nightly_prod",   incident: false },
  { daysAgo: 9,  h: 2,  m: 30, tier: "PROD", network: "staging",    envId: "prod_staging", suiteId: "suite_nightly_prod",   incident: false },
  { daysAgo: 6,  h: 2,  m: 15, tier: "PROD", network: "production", envId: "prod_prod",    suiteId: "suite_nightly_prod",   incident: false },
  { daysAgo: 3,  h: 2,  m: 0,  tier: "PROD", network: "staging",    envId: "prod_staging", suiteId: "suite_nightly_prod",   incident: false },
  { daysAgo: 0,  h: 2,  m: 30, tier: "PROD", network: "production", envId: "prod_prod",    suiteId: "suite_nightly_prod",   incident: false },
];

// ── 20 test cases per run (from probe targets + extras) ───────────────────
const TEST_CASES = [
  { id: "geo_01",    name: "US East resolves to IAD PoP",              category: "Geo-match",     probe: 0 },
  { id: "geo_02",    name: "EU West resolves to DUB PoP",              category: "Geo-match",     probe: 1 },
  { id: "geo_03",    name: "AP Southeast resolves to SIN PoP",         category: "Geo-match",     probe: 2 },
  { id: "geo_04",    name: "Primary PoP failover within 2s",           category: "Geo-match",     probe: 0 },
  { id: "cache_01",  name: "Cache hit ratio exceeds 80% for static",   category: "Caching",       probe: 3 },
  { id: "cache_02",  name: "Cache-Control max-age on CSS assets",      category: "Caching",       probe: 4 },
  { id: "cache_03",  name: "Stale-while-revalidate honored on API",    category: "Caching",       probe: 3 },
  { id: "cache_04",  name: "Surrogate-Control overrides Cache-Control",category: "Caching",       probe: 4 },
  { id: "sec_01",    name: "HSTS header present on all responses",     category: "Security",      probe: 5 },
  { id: "sec_02",    name: "CSP blocks inline scripts",                category: "Security",      probe: 6 },
  { id: "sec_03",    name: "WAF blocks SQLi in query params",          category: "Security",      probe: 5 },
  { id: "sec_04",    name: "X-Frame-Options DENY on auth pages",       category: "Security",      probe: 6 },
  { id: "edge_01",   name: "EdgeWorker activates on /api/* routes",    category: "Edge-Routing",  probe: 7 },
  { id: "edge_02",   name: "EdgeWorker injects X-Akamai-RUM header",   category: "Edge-Routing",  probe: 7 },
  { id: "edge_03",   name: "Property version matches activation",      category: "Edge-Routing",  probe: 7 },
  { id: "http_01",   name: "HTTP/2 negotiated via ALPN",               category: "Http-Protocol", probe: 8 },
  { id: "http_02",   name: "TLS 1.3 enforced, TLS 1.0 rejected",      category: "Http-Protocol", probe: 9 },
  { id: "http_03",   name: "Brotli encoding returned when accepted",   category: "Http-Protocol", probe: 8 },
  { id: "http_04",   name: "TTFB under 200ms from US-East",            category: "Http-Protocol", probe: 8 },
  { id: "http_05",   name: "Redirect chain ≤ 2 hops to canonical URL", category: "Http-Protocol", probe: 9 },
];

// ── Run names (alphabetical, 30 names) ────────────────────────────────────
const RUN_NAMES = [
  "albatross","beacon","cardinal","dapper","ember","falcon","granite","harbor",
  "indigo","jasper","kestrel","lemon","marble","nexus","ocelot","prism","quartz",
  "ranger","sierra","tundra","ultron","vantage","willow","xenon","yellow","zephyr",
  "amber","blaze","cobalt","delta",
];

// ── Build runs.json + test-results.json ───────────────────────────────────
const runs = [];
const testResults = {};

console.log("\n📦  Generating 30 runs with real baseline measurements…\n");

for (let i = 0; i < RUN_SCHEDULE.length; i++) {
  const sched = RUN_SCHEDULE[i];
  const runId = RUN_NAMES[i];
  const buildSha = shortHash();
  const revSha = longHash();
  const started = isoTs(sched.daysAgo, sched.h, sched.m);

  // Incident window: cache degradation — 3-5 test failures
  const failCount = sched.incident ? pickRandom([3, 4, 5]) : pickRandom([0, 0, 0, 0, 1]);
  const failIds = new Set();
  while (failIds.size < failCount) {
    failIds.add(TEST_CASES[Math.floor(Math.random() * TEST_CASES.length)].id);
  }

  const totalMs = TEST_CASES.length * jitter(avgDuration + 200, 0.15);
  const passPct = Math.round(((TEST_CASES.length - failCount) / TEST_CASES.length) * 100);
  const runStatus = failCount === 0 ? "PASS" : failCount <= 2 ? "FLAKY" : passPct >= 60 ? "FAIL" : "FAIL";

  runs.push({
    id:         runId,
    label:      `CI — ${new Date(started).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    suiteId:    sched.suiteId,
    envId:      sched.envId,
    env:        sched.tier,
    network:    sched.network,
    status:     runStatus,
    passPct,
    failures:   failCount,
    duration:   formatDur(totalMs),
    durationMs: totalMs,
    started,
    build:      buildSha,
    rev:        revSha,
  });

  // Test results for this run
  const results = TEST_CASES.map((tc) => {
    const isFail = failIds.has(tc.id);
    const probeData = probeResults[tc.probe] || probeResults[0];
    const baseDur = jitter(probeData.duration, 0.30);
    // Incident: TTFB spike (2-5x slower) for failing tests
    const duration = isFail && sched.incident ? jitter(probeData.duration * pickRandom([2.5, 3, 4]), 0.1) : baseDur;
    const status = isFail ? "FAIL" : "PASS";

    const evidence = buildEvidence(probeData, status);
    const filmstrip = buildFilmstrip(duration, status);

    return {
      id:          tc.id,
      testCaseId:  tc.id,
      runId,
      name:        tc.name,
      status,
      duration,
      category:    tc.category,
      suite:       `tests/${tc.category.toLowerCase().replace(/-/g, "_")}_suite.py::test_${tc.id}`,
      assertions:  evidence.assertions,
      evidence,
      filmstrip,
      ...(isFail ? { error: `Assertion failed — ${evidence.assertions.find(a => !a.passed)?.assertion ?? "unexpected response"}` } : {}),
    };
  });

  testResults[runId] = results;

  const icon = failCount === 0 ? "✅" : failCount <= 2 ? "⚠️ " : "❌";
  console.log(`  ${icon}  ${runId.padEnd(12)}  ${sched.tier.padEnd(4)} ${sched.network.padEnd(10)}  ${String(failCount).padStart(2)} fail  ${passPct}%  ${sched.incident ? "🔴 INCIDENT" : ""}`);
}

// ── Write output ──────────────────────────────────────────────────────────
writeFileSync(join(dataDir, "runs.json"), JSON.stringify(runs, null, 2));
writeFileSync(join(dataDir, "test-results.json"), JSON.stringify(testResults, null, 2));

console.log(`\n✅  Wrote ${runs.length} runs  →  data/runs.json`);
console.log(`✅  Wrote ${Object.keys(testResults).length} run result sets (${runs.length * TEST_CASES.length} total)  →  data/test-results.json`);
console.log("\n🎯  Run sizes:");
console.log(`      QA runs:   ${runs.filter(r => r.env === "QA").length}`);
console.log(`      UAT runs:  ${runs.filter(r => r.env === "UAT").length}`);
console.log(`      PROD runs: ${runs.filter(r => r.env === "PROD").length}`);
console.log(`\n   Incident runs: ${RUN_SCHEDULE.filter(s => s.incident).length} (cache degradation window days 18-22 ago)`);
console.log("\nDone. Run  pnpm validate:data  to verify.\n");

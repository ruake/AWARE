#!/usr/bin/env node
/**
 * generate-data.mjs — generates sample JSON files from bundled mock data
 *
 * Usage:
 *   node scripts/generate-data.mjs
 *   node scripts/generate-data.mjs --out ./data
 *
 * This produces the 6 JSON files the portal expects, so users can
 * see the exact contract. Replace the data below or pipe real test
 * output through scripts/transform.mjs.
 */

import fs from "fs";
import path from "path";

const OUT_DIR = process.argv.includes("--out")
  ? path.resolve(process.argv[process.argv.indexOf("--out") + 1])
  : path.resolve(import.meta.dirname, "..", "data");

const ENVS = ["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"];

// ── runs.json ────────────────────────────────────────

const RUNS = Array.from({ length: 12 }).map((_, i) => {
  const isFail = i === 2 || i === 7;
  const isPartial = i === 4;
  const status = isFail ? "FAIL" : isPartial ? "PARTIAL" : "PASS";
  const failCount = status === "PASS" ? 0 : status === "FAIL" ? (i === 2 ? 6 : 12) : 3;
  const passPct = status === "PASS" ? 100 : 100 - Math.floor(failCount / 10);
  return {
    id: `run_892_2341.1.0_prod_${1000 + i}`,
    label: "Prod/Production · PM 892 · EW 2341.1.0",
    suite: i % 3 === 0 ? "full_suite" : "geo_gating",
    target: i % 2 === 0 ? "Prod" : "UAT",
    status,
    passPct,
    failures: failCount,
    duration: `${45 + (i % 15)}m`,
    durationMs: (45 + (i % 15)) * 60000,
    started: `2026-06-06T14:${String(30 - i).padStart(2, "0")}Z`,
    pm: "v892",
    ew: "2341.1.0",
    env: ENVS[i % ENVS.length],
  };
});

// ── diff.json ────────────────────────────────────────

const DIFF_ROWS = Array.from({ length: 15 }).map((_, i) => {
  let state = "unchanged";
  if (i === 1 || i === 4) state = "regression";
  if (i === 2) state = "fixed";
  if (i === 5) state = "duration";
  return {
    id: `diff_${i}`,
    name: `Regression Check /path/${i}`,
    baseStatus: state === "fixed" ? "FAIL" : "PASS",
    candStatus: state === "regression" ? "FAIL" : "PASS",
    durBase: 120,
    durCand: state === "duration" ? 340 : 125,
    category: "geo-match",
    state,
  };
});

// ── diff/details.json ────────────────────────────────

const TEST_DETAILS = DIFF_ROWS.map((_, testIdx) => {
  const history = RUNS.map((run, runIdx) => {
    const base = (testIdx * 7 + runIdx * 13) % 100;
    const status = base < 70 ? "PASS" : "FAIL";
    return {
      runId: run.id,
      status,
      duration: 100 + ((base * 3 + runIdx * 5) % 200),
      env: ENVS[runIdx % ENVS.length],
    };
  });
  const passCount = history.filter(h => h.status === "PASS").length;
  const passRate = Math.round((passCount / history.length) * 100);
  const flips = history.filter((h, i) => i > 0 && h.status !== history[i - 1].status).length;
  const flakinessScore = Math.round((flips / (history.length - 1)) * 100);
  const avgDuration = Math.round(history.reduce((s, h) => s + h.duration, 0) / history.length);
  return { history, passRate, flakinessScore, avgDuration };
});

// ── dashboard/env-summary.json ───────────────────────

const ENV_SUMMARY = [
  { label: "Prod/Production", passRate: 87, trend: -4, failures: 14, color: "#d93025", alert: "PASS RATE DROPPED 4%" },
  { label: "Prod/Staging",    passRate: 92, trend: -2, failures: 6,  color: "#f9ab00", alert: null },
  { label: "UAT/Production",  passRate: 100,trend: 0,  failures: 0,  color: "#1e8e3e", alert: null },
  { label: "UAT/Staging",     passRate: 98, trend: -1, failures: 2,  color: "#1e8e3e", alert: null },
];

// ── dashboard/pass-rate.json ─────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const PASS_RATE_DATA = [
  ["Day", "Pass Rate", { type: "string", role: "tooltip" }],
  ...RUNS.map((run, i) => [DAYS[i], run.passPct, `${run.id} — ${run.passPct}%`]),
];

// ── dashboard/env-pass-rate.json ─────────────────────

const ENV_PASS_RATE_DATA = [
  [
    "Day", "Prod/Production", "Prod/Staging",
    "UAT/Production", "UAT/Staging",
    { type: "string", role: "tooltip", p: { html: true } },
  ],
  ...DAYS.slice(0, 10).map((day, d) => {
    const prodProd = Math.max(70, 100 - d * 2 - (d === 4 ? 18 : 0));
    const prodStg = Math.max(70, 100 - d * 2 - (d === 4 ? 15 : 0));
    const uatProd = Math.max(95, 100 - d * 1 - (d === 6 ? 5 : 0));
    const uatStg = Math.max(92, 100 - d * 1);
    return [
      day, prodProd, prodStg, uatProd, uatStg,
      `<b>${day}</b><br>Prod/Prod: ${prodProd}%<br>Prod/Stg: ${prodStg}%<br>UAT/Prod: ${uatProd}%<br>UAT/Stg: ${uatStg}%`,
    ];
  }),
];

// ── Test Case Management Data ─────────────────────────

const TEST_TAGS = [
  { id: "tag_geo", name: "geo", color: "#1a73e8" },
  { id: "tag_locale", name: "locale", color: "#9334e6" },
  { id: "tag_health", name: "health", color: "#e8710a" },
  { id: "tag_security", name: "security", color: "#d93025" },
  { id: "tag_perf", name: "performance", color: "#1e8e3e" },
  { id: "tag_regression", name: "regression", color: "#f9ab00" },
  { id: "tag_smoke", name: "smoke", color: "#185abc" },
  { id: "tag_e2e", name: "e2e", color: "#c5221f" },
];

const TEST_NAMES = [
  "Verify Geo match for /api/v1/data resolves correct PoP",
  "Check locale split serves fr-CA content in Quebec region",
  "Validate URL health check returns 200 for /api/v2/status",
  "Ensure edge redirect preserves query params on /api/v3/data",
  "Verify cache TTL header matches origin max-age directive",
  "Check gzip compression enabled for /api/v1/assets/*",
  "Validate CORS headers present on cross-origin /api/v2/config",
  "Ensure rate limiting triggers after 100 req/min on /api/v1/auth",
  "Verify TLS 1.3 negotiation for /api/v3/secure endpoint",
  "Check WAF rules block SQL injection on /api/v1/search",
  "Validate JWT token expiry returns 401 on /api/v2/user/profile",
  "Ensure CDN purge invalidates /api/v1/cache/* within 5s",
  "Check IPv6 preference when client supports dual-stack",
  "Verify HTTP/3 (QUIC) upgrade from Alt-Svc header",
  "Validate origin shield hit ratio exceeds 80% for /api/v3/*",
  "Check mobile redirect rules for /api/v1/mobile/* paths",
  "Ensure API key rotation completes within 30s propagation",
  "Verify websocket upgrade handshake on /api/v2/ws endpoint",
  "Check custom error page served on 5xx origin responses",
  "Validate signed URL expiry enforced for /api/v1/media/*",
  "Verify SRI hash validation on injected script tags",
  "Check geo-blocking returns 403 for disallowed regions",
  "Ensure log delivery to Splunk within 60s of request",
  "Validate DDoS mitigation triggers at 10000 req/s threshold",
  "Check A/B testing cookie routing for /api/v1/experiments",
];

const CATEGORIES = ["geo-match", "locale-split", "url-health", "security", "performance", "caching", "routing", "tls", "ddos"];
const PRIORITIES = ["P0", "P1", "P2", "P3"];
const SEVERITIES = ["critical", "major", "minor", "trivial"];
const OWNERS = ["alice@co.com", "bob@co.com", "carol@co.com", "dave@co.com", "eve@co.com"];

function requestHeaders(i, cat) {
  const h = { Accept: "application/json", "User-Agent": "AWARE-TestRunner/2.0" };
  if (cat === "geo-match") h["X-Geo-Hint"] = "us-east";
  if (cat === "locale-split") h["Accept-Language"] = i % 2 === 0 ? "fr-CA" : "en-US";
  if (cat === "security") h["X-Forwarded-For"] = `192.168.${i}.1`;
  return h;
}

function testCookies(i) {
  const c = { session: `tok_${i}_abc123` };
  if (i % 3 === 0) c["ab_test"] = "control";
  if (i % 5 === 0) c["geo_override"] = "enabled";
  return c;
}

function captureHeaders(i) {
  const base = ["X-Cache", "X-Request-ID", "Akamai-Cache-Status", "Age"];
  if (i % 2 === 0) base.push("X-RateLimit-Remaining");
  if (i % 3 === 0) base.push("Set-Cookie");
  return base.slice(0, 3 + (i % 4));
}

function filmstrip(i) {
  return {
    enabled: i % 4 === 0,
    threshold: 0.98 + (i % 3) * 0.01,
    region: i % 2 === 0 ? "full" : "viewport",
    ignoreAreas: i % 3 === 0 ? [".analytics-banner", ".cookie-notice"] : [],
  };
}

function predicates(i, cat) {
  const base = [
    { id: `pred_${i}_0`, type: "statusCode", field: "", expected: "200", operator: "equals", description: "Response status is 200" },
    { id: `pred_${i}_1`, type: "responseTime", field: "duration", expected: "1000", operator: "lt", description: "Response time < 1000ms" },
  ];
  if (cat === "security" || cat === "ddos") {
    base.push({ id: `pred_${i}_2`, type: "headerContains", field: "X-Frame-Options", expected: "DENY", operator: "contains", description: "X-Frame-Options is DENY" });
  } else if (cat === "caching") {
    base.push({ id: `pred_${i}_2`, type: "headerEquals", field: "X-Cache", expected: "HIT", operator: "equals", description: "Edge cache HIT" });
  } else if (cat === "performance") {
    base.push({ id: `pred_${i}_2`, type: "headerContains", field: "Content-Encoding", expected: "gzip", operator: "equals", description: "gzip encoding enabled" });
  } else if (cat === "geo-match" || cat === "locale-split") {
    base.push({ id: `pred_${i}_2`, type: "cookieEquals", field: "geo_override", expected: "enabled", operator: "equals", description: "Geo override cookie set" });
  }
  return base;
}

const TEST_CASES = Array.from({ length: 25 }).map((_, i) => {
  const tagCount = 1 + (i % 3);
  const shuffled = [...TEST_TAGS].sort(() => Math.random() - 0.5);
  const tags = shuffled.slice(0, tagCount).map(t => t.id);
  const priority = PRIORITIES[i % PRIORITIES.length];
  const cat = CATEGORIES[i % CATEGORIES.length];
  const now = `2026-0${1 + (i % 9)}-0${1 + (i % 7)}T10:00:00Z`;
  const updated = `2026-0${1 + (i % 9)}-0${1 + (i % 7)}T14:30:00Z`;
  return {
    id: `tc_${i}`,
    name: TEST_NAMES[i],
    description: `Automated test verifying ${cat} behavior for endpoint group ${i}. Ensures correct behavior across Akamai CDN edge network with configurable thresholds and alerting.`,
    category: cat,
    priority,
    severity: priority === "P0" ? "critical" : priority === "P1" ? "major" : priority === "P2" ? "minor" : "trivial",
    status: i < 22 ? "active" : i === 22 ? "disabled" : "deprecated",
    tags,
    owner: OWNERS[i % OWNERS.length],
    suiteIds: i < 10 ? ["suite_full", "suite_geo"] : i < 18 ? ["suite_full", "suite_perf"] : i < 22 ? ["suite_full"] : [],
    automated: true,
    scriptPath: `tests/aware/${cat}/tc_${i}.spec.ts`,
    preconditions: `- Akamai EdgeGrid credentials configured\n- ${cat} test data seeded\n- Target environment reachable`,
    expectedBehavior: `- Response status 200\n- Correct ${cat} headers present\n- Response time < 500ms\n- Cache HIT ratio > 0.8`,
    documentation: `## ${TEST_NAMES[i]}\n\nValidates ${cat} behavior for endpoint group ${i}.\n\n### Test Steps\n1. Send HTTP ${cat === "security" ? "GET with payload" : "GET"} request\n2. Validate response headers\n3. Check response time\n4. Confirm cache behavior\n5. Run predicates\n\n### Request\n- Method: GET\n- Headers: ${Object.keys(requestHeaders(i, cat)).join(", ")}\n- Expected Status: 200\n\n### Expected Results\n- Status: 200 OK\n- Response time < 500ms\n- Cache HIT ratio > 0.8\n\n### Notes\nThis test is part of the ${cat} validation suite.`,
    relatedTestIds: [`tc_${(i + 1) % 25}`, `tc_${(i + 2) % 25}`],
    requestHeaders: requestHeaders(i, cat),
    cookies: testCookies(i),
    expectedStatus: cat === "security" ? 403 : cat === "ddos" ? 429 : cat === "tls" ? 302 : 200,
    captureResponseHeaders: captureHeaders(i),
    filmstrip: filmstrip(i),
    predicates: predicates(i, cat),
    version: 1 + (i % 3),
    changelog: [
      { version: 1, timestamp: now, author: OWNERS[i % OWNERS.length], summary: "Initial creation", changes: ["Test case created"] },
    ],
    createdAt: now,
    updatedAt: updated,
  };
});

const TEST_SUITES = [
  { id: "suite_full", name: "Full Regression Suite", description: "Complete end-to-end regression covering all category groups. Runs on every production deploy.", parentId: null, testIds: TEST_CASES.filter(t => t.status === "active").map(t => t.id), config: { target: "Prod", environment: "Production", parallelism: 8, retries: 2, failFast: false, timeoutMinutes: 60, integration: { slackChannel: "#regression-alerts", slackWebhookUrl: "https://hooks.slack.com/services/T00/B00/xxxx", notifyOn: ["fail", "deploy"], githubCommentPr: true, githubDeploymentStatus: true, requireApproval: true, approvers: ["alice@co.com", "bob@co.com"], webhookUrl: "https://hooks.example.com/aware/notify" } }, tags: ["regression", "e2e"], schedule: "0 6 * * 1-5", createdAt: "2026-01-15T08:00:00Z", updatedAt: "2026-06-01T12:00:00Z" },
  { id: "suite_geo", name: "Geo & Locale Validation", description: "Tests for geographic routing, locale splitting, and multi-region behavior.", parentId: null, testIds: TEST_CASES.filter(t => t.category === "geo-match" || t.category === "locale-split").slice(0, 8).map(t => t.id), config: { target: "Prod", environment: "Production", parallelism: 4, retries: 1, failFast: false, timeoutMinutes: 30, integration: { slackChannel: "#geo-alerts", notifyOn: ["fail"], githubCommentPr: true, githubDeploymentStatus: false, requireApproval: false, approvers: [] } }, tags: ["geo", "locale"], schedule: "0 */4 * * *", createdAt: "2026-02-10T09:00:00Z", updatedAt: "2026-05-28T16:00:00Z" },
  { id: "suite_perf", name: "Performance & Caching", description: "Performance benchmarks, cache hit ratio validation, and compression checks.", parentId: null, testIds: TEST_CASES.filter(t => t.category === "performance" || t.category === "caching").slice(0, 6).map(t => t.id), config: { target: "Prod", environment: "Staging", parallelism: 6, retries: 2, failFast: true, timeoutMinutes: 45, integration: { slackChannel: "#perf-bot", notifyOn: ["pass", "fail"], githubCommentPr: true, githubDeploymentStatus: true, requireApproval: true, approvers: ["carol@co.com", "dave@co.com"], webhookUrl: "https://hooks.example.com/perf" } }, tags: ["performance"], schedule: "0 */2 * * *", createdAt: "2026-03-05T10:00:00Z", updatedAt: "2026-06-02T08:00:00Z" },
  { id: "suite_security", name: "Security & WAF", description: "Security-focused tests including WAF bypass attempts, DDoS simulation, and TLS configuration.", parentId: null, testIds: TEST_CASES.filter(t => t.category === "security" || t.category === "ddos" || t.category === "tls").map(t => t.id), config: { target: "Prod", environment: "Staging", parallelism: 3, retries: 0, failFast: true, timeoutMinutes: 20 }, tags: ["security"], schedule: "0 0 * * *", createdAt: "2026-01-20T12:00:00Z", updatedAt: "2026-05-15T10:00:00Z" },
  { id: "suite_health", name: "Health & Monitoring", description: "URL health checks and endpoint availability monitoring.", parentId: null, testIds: TEST_CASES.filter(t => t.category === "url-health").map(t => t.id), config: { target: "Prod", environment: "Production", parallelism: 2, retries: 3, failFast: false, timeoutMinutes: 10 }, tags: ["health", "smoke"], schedule: "*/5 * * * *", createdAt: "2026-04-01T06:00:00Z", updatedAt: "2026-06-01T08:00:00Z" },
  { id: "suite_uat", name: "UAT Validation", description: "User acceptance tests targeting UAT stages for pre-release validation.", parentId: "suite_full", testIds: TEST_CASES.slice(0, 8).map(t => t.id), config: { target: "UAT", environment: "Staging", parallelism: 2, retries: 1, failFast: true, timeoutMinutes: 30 }, tags: ["smoke"], schedule: null, createdAt: "2026-05-01T09:00:00Z", updatedAt: "2026-05-20T14:00:00Z" },
  { id: "suite_smoke", name: "Smoke Tests", description: "Quick smoke tests to verify basic functionality after deployment.", parentId: "suite_full", testIds: TEST_CASES.slice(0, 5).map(t => t.id), config: { target: "Prod", environment: "Production", parallelism: 1, retries: 0, failFast: true, timeoutMinutes: 5 }, tags: ["smoke"], schedule: null, createdAt: "2026-05-15T10:00:00Z", updatedAt: "2026-06-01T12:00:00Z" },
  { id: "suite_canary", name: "Canary Release", description: "Tests targeting canary deployments with gradual traffic rollout.", parentId: "suite_full", testIds: TEST_CASES.filter(t => t.priority === "P0" || t.priority === "P1").slice(0, 6).map(t => t.id), config: { target: "Prod", environment: "Production", parallelism: 2, retries: 2, failFast: true, timeoutMinutes: 15 }, tags: ["regression"], schedule: null, createdAt: "2026-05-20T11:00:00Z", updatedAt: "2026-06-02T09:00:00Z" },
];

// ── Write files ──────────────────────────────────────

const files = {
  "runs.json": RUNS,
  "diff.json": DIFF_ROWS,
  "diff/details.json": TEST_DETAILS,
  "dashboard/env-summary.json": ENV_SUMMARY,
  "dashboard/pass-rate.json": PASS_RATE_DATA,
  "dashboard/env-pass-rate.json": ENV_PASS_RATE_DATA,
  "test-cases.json": TEST_CASES,
  "test-suites.json": TEST_SUITES,
  "test-tags.json": TEST_TAGS,
};

fs.mkdirSync(path.join(OUT_DIR, "diff"), { recursive: true });
fs.mkdirSync(path.join(OUT_DIR, "dashboard"), { recursive: true });

for (const [filePath, data] of Object.entries(files)) {
  const fullPath = path.join(OUT_DIR, filePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`  ✅ ${path.relative(OUT_DIR, fullPath)}`);
}

console.log(`\n📁 Generated in ${OUT_DIR}`);
console.log("   Set VITE_USE_MOCK=false and VITE_API_BASE_URL=/data to use these files.");
console.log("   Default VITE_USE_MOCK=true uses in-memory mock data (no network needed).");

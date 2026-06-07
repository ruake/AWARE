import type {
  Run, TestResult, TestDetail, TestRunPoint, DiffRow,
  TestCase, TestSuite, TestTag, TestChangeLogEntry, PromotionDecision,
  Predicate, FilmstripConfig, TestStats, TestCaseFilter, SuiteNode,
  GenerateParams, ImportResult
} from "./types";

export type {
  Run, TestResult, TestDetail, TestRunPoint, DiffRow,
  TestCase, TestSuite, TestTag, TestChangeLogEntry, PromotionDecision,
  Predicate, FilmstripConfig, TestStats, TestCaseFilter, SuiteNode,
  GenerateParams, ImportResult
};

const ENVS = ["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"];

export const RUNS: Run[] = Array.from({ length: 12 }).map((_, i) => {
  const isFail = i === 2 || i === 7;
  const isPartial = i === 4;
  const status: Run["status"] = isFail ? "FAIL" : isPartial ? "PARTIAL" : "PASS";
  const failCount = status === "PASS" ? 0 : status === "FAIL" ? (i === 2 ? 6 : 12) : 3;
  const passPct = status === "PASS" ? 100 : 100 - Math.floor(failCount / 10);
  return {
    id: `run_892_2341.1.0_prod_${1000 + i}`,
    label: `Prod/Production · PM 892 · EW 2341.1.0`,
    suite: i % 3 === 0 ? "full_suite" : "geo_gating",
    target: i % 2 === 0 ? "Prod" : "UAT",
    status,
    passPct: Math.max(50, passPct),
    failures: failCount,
    duration: `${45 + (i % 15)}m`,
    durationMs: (45 + (i % 15)) * 60000,
    started: `2026-06-0${6 - Math.floor(i / 4)}T${String(14 - (i % 6)).padStart(2, "0")}:${String(30 - (i % 30)).padStart(2, "0")}Z`,
    pm: "v892",
    ew: `2341.1.${i}`,
    env: ENVS[i % ENVS.length],
  };
});

export function getRunIndex(runId: string): number {
  return RUNS.findIndex(r => r.id === runId);
}

export function getRunById(id: string): Run | undefined {
  return RUNS.find(r => r.id === id);
}

export function generateTestHistory(testIndex: number): TestDetail {
  const history: TestRunPoint[] = RUNS.map((run, runIdx) => {
    const base = (testIndex * 7 + runIdx * 13) % 100;
    const status: "PASS" | "FAIL" = base < 72 ? "PASS" : "FAIL";
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
}

export const DIFF_ROWS: DiffRow[] = [
  { id: "diff_0", name: "Verify Geo match /api/v1/data resolves correct PoP", baseStatus: "PASS", candStatus: "PASS", durBase: 120, durCand: 122, category: "geo-match", state: "unchanged" },
  { id: "diff_1", name: "Check locale split fr-CA content Quebec region", baseStatus: "PASS", candStatus: "FAIL", durBase: 95, durCand: 98, category: "locale-split", state: "regression" },
  { id: "diff_2", name: "Validate URL health check 200 /api/v2/status", baseStatus: "FAIL", candStatus: "PASS", durBase: 210, durCand: 185, category: "url-health", state: "fixed" },
  { id: "diff_3", name: "Ensure edge redirect preserves query params /api/v3/data", baseStatus: "PASS", candStatus: "PASS", durBase: 88, durCand: 91, category: "routing", state: "unchanged" },
  { id: "diff_4", name: "Verify cache TTL header matches origin max-age directive", baseStatus: "PASS", candStatus: "FAIL", durBase: 145, durCand: 148, category: "caching", state: "regression" },
  { id: "diff_5", name: "Check gzip compression /api/v1/assets/*", baseStatus: "PASS", candStatus: "PASS", durBase: 120, durCand: 340, category: "performance", state: "duration" },
  { id: "diff_6", name: "Validate CORS headers cross-origin /api/v2/config", baseStatus: "PASS", candStatus: "PASS", durBase: 75, durCand: 77, category: "security", state: "unchanged" },
  { id: "diff_7", name: "Ensure rate limiting triggers 100 req/min /api/v1/auth", baseStatus: "PASS", candStatus: "PASS", durBase: 320, durCand: 318, category: "security", state: "unchanged" },
  { id: "diff_8", name: "Verify TLS 1.3 negotiation /api/v3/secure endpoint", baseStatus: "PASS", candStatus: "PASS", durBase: 55, durCand: 58, category: "tls", state: "unchanged" },
  { id: "diff_9", name: "Check WAF rules block SQL injection /api/v1/search", baseStatus: "PASS", candStatus: "FAIL", durBase: 180, durCand: 182, category: "security", state: "regression" },
  { id: "diff_10", name: "Validate JWT token expiry returns 401 /api/v2/user", baseStatus: "PASS", candStatus: "PASS", durBase: 95, durCand: 97, category: "security", state: "unchanged" },
  { id: "diff_11", name: "Ensure CDN purge invalidates /api/v1/cache/* within 5s", baseStatus: "FAIL", candStatus: "PASS", durBase: 4200, durCand: 3800, category: "caching", state: "fixed" },
  { id: "diff_12", name: "Check IPv6 preference dual-stack client", baseStatus: "PASS", candStatus: "PASS", durBase: 66, durCand: 68, category: "routing", state: "unchanged" },
  { id: "diff_13", name: "Verify HTTP/3 QUIC upgrade from Alt-Svc header", baseStatus: "PASS", candStatus: "PASS", durBase: 110, durCand: 320, category: "performance", state: "duration" },
  { id: "diff_14", name: "Validate origin shield hit ratio > 80% /api/v3/*", baseStatus: "PASS", candStatus: "PASS", durBase: 200, durCand: 205, category: "caching", state: "unchanged" },
];

export const TEST_DETAILS: TestDetail[] = Array.from({ length: DIFF_ROWS.length }).map((_, i) => generateTestHistory(i));

export const ENV_SUMMARY = [
  { label: "Prod/Production", passRate: 87, trend: -4, failures: 14, color: "#d93025", alert: "PASS RATE DROPPED 4%" },
  { label: "Prod/Staging", passRate: 92, trend: -2, failures: 6, color: "#f9ab00", alert: null },
  { label: "UAT/Production", passRate: 100, trend: 0, failures: 0, color: "#1e8e3e", alert: null },
  { label: "UAT/Staging", passRate: 98, trend: -1, failures: 2, color: "#1e8e3e", alert: null },
];

export const PASS_RATE_CHART = RUNS.map((run, i) => ({
  label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][i],
  passRate: run.passPct,
  runId: run.id,
}));

export const ENV_PASS_RATE_CHART = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"].map((day, d) => ({
  day,
  "Prod/Production": Math.max(70, 100 - d * 2 - (d === 4 ? 18 : 0)),
  "Prod/Staging": Math.max(70, 100 - d * 2 - (d === 4 ? 15 : 0)),
  "UAT/Production": Math.max(95, 100 - d * 1 - (d === 6 ? 5 : 0)),
  "UAT/Staging": Math.max(92, 100 - d * 1),
}));

// ── Test tags ──────────────────────────────────────────────

export const TEST_TAGS: TestTag[] = [
  { id: "tag_geo", name: "geo", color: "#1a73e8" },
  { id: "tag_locale", name: "locale", color: "#9334e6" },
  { id: "tag_health", name: "health", color: "#e8710a" },
  { id: "tag_security", name: "security", color: "#d93025" },
  { id: "tag_perf", name: "performance", color: "#1e8e3e" },
  { id: "tag_regression", name: "regression", color: "#f9ab00" },
  { id: "tag_smoke", name: "smoke", color: "#185abc" },
  { id: "tag_e2e", name: "e2e", color: "#c5221f" },
];

// ── Seed helpers ───────────────────────────────────────────

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
const BASE_PRIORITIES: TestCase["priority"][] = ["P0", "P1", "P2", "P3"];
const BASE_SEVERITIES: TestCase["severity"][] = ["critical", "major", "minor", "trivial"];
const OWNERS = ["alice@co.com", "bob@co.com", "carol@co.com", "dave@co.com", "eve@co.com"];

function seedPredicates(i: number, cat: string): Predicate[] {
  const base: Predicate[] = [
    { id: `pred_${i}_0`, type: "statusCode", field: "", expected: "200", operator: "equals", description: "Response status is 200" },
    { id: `pred_${i}_1`, type: "responseTime", field: "duration", expected: "1000", operator: "lt", description: "Response time < 1000ms" },
  ];
  if (cat === "security" || cat === "ddos") {
    base.push({ id: `pred_${i}_2`, type: "headerContains", field: "X-Frame-Options", expected: "DENY", operator: "contains", description: "X-Frame-Options is DENY" });
    base.push({ id: `pred_${i}_3`, type: "headerContains", field: "Content-Security-Policy", expected: "default-src", operator: "contains", description: "CSP header present" });
  } else if (cat === "caching") {
    base.push({ id: `pred_${i}_2`, type: "headerEquals", field: "X-Cache", expected: "HIT", operator: "equals", description: "Edge cache HIT" });
    base.push({ id: `pred_${i}_3`, type: "headerContains", field: "Age", expected: "", operator: "exists", description: "Age header present" });
  } else if (cat === "performance") {
    base.push({ id: `pred_${i}_2`, type: "headerContains", field: "Content-Encoding", expected: "gzip", operator: "equals", description: "gzip encoding enabled" });
  } else if (cat === "geo-match" || cat === "locale-split") {
    base.push({ id: `pred_${i}_2`, type: "headerContains", field: "X-Region", expected: "", operator: "exists", description: "Region header present" });
    base.push({ id: `pred_${i}_3`, type: "cookieEquals", field: "geo_override", expected: "enabled", operator: "equals", description: "Geo override cookie set" });
  }
  return base;
}

function seedFilmstrip(i: number): FilmstripConfig {
  return {
    enabled: i % 4 === 0,
    threshold: 0.98 + (i % 3) * 0.01,
    region: i % 2 === 0 ? "full" : "viewport",
    ignoreAreas: i % 3 === 0 ? [".analytics-banner", ".cookie-notice"] : [],
  };
}

function seedRequestHeaders(i: number, cat: string): Record<string, string> {
  const h: Record<string, string> = {
    "Accept": "application/json",
    "User-Agent": "AWARE-TestRunner/2.0",
  };
  if (cat === "geo-match") h["X-Geo-Hint"] = "us-east";
  if (cat === "locale-split") h["Accept-Language"] = i % 2 === 0 ? "fr-CA" : "en-US";
  if (cat === "security") h["X-Forwarded-For"] = `192.168.${i}.1`;
  return h;
}

function seedCookies(i: number): Record<string, string> {
  const c: Record<string, string> = { session: `tok_${i}_abc123` };
  if (i % 3 === 0) c["ab_test"] = "control";
  if (i % 5 === 0) c["geo_override"] = "enabled";
  return c;
}

function seedCaptureHeaders(i: number): string[] {
  const base = ["X-Cache", "X-Request-ID", "Akamai-Cache-Status", "Age"];
  if (i % 2 === 0) base.push("X-RateLimit-Remaining");
  if (i % 3 === 0) base.push("Set-Cookie");
  return base.slice(0, 3 + (i % 4));
}

// ── Base mock data ─────────────────────────────────────────

const BASE_TEST_CASES: TestCase[] = Array.from({ length: 25 }).map((_, i) => {
  const tagCount = 1 + (i % 3);
  const tags = TEST_TAGS.slice(i % TEST_TAGS.length).slice(0, tagCount).map(t => t.id);
  const priority = BASE_PRIORITIES[i % BASE_PRIORITIES.length];
  const cat = CATEGORIES[i % CATEGORIES.length];
  const now = `2026-0${1 + (i % 9)}-0${1 + (i % 7)}T10:00:00Z`;
  const updated = `2026-0${1 + (i % 9)}-0${1 + (i % 7)}T14:30:00Z`;
  return {
    id: `tc_${i}`,
    name: TEST_NAMES[i],
    description: `Automated test verifying ${cat} behavior for endpoint group ${i}. Ensures correct behavior across Akamai CDN edge network with configurable thresholds and alerting.`,
    category: cat,
    priority,
    severity: BASE_SEVERITIES[BASE_PRIORITIES.indexOf(priority)],
    status: (i < 22 ? "active" : i === 22 ? "disabled" : "deprecated") as TestCase["status"],
    tags,
    owner: OWNERS[i % OWNERS.length],
    suiteIds: i < 10 ? ["suite_full", "suite_geo"] : i < 18 ? ["suite_full", "suite_perf"] : i < 22 ? ["suite_full"] : [],
    automated: true,
    scriptPath: `tests/aware/${cat}/tc_${i}.spec.ts`,
    preconditions: `- Akamai EdgeGrid credentials configured\n- ${cat} test data seeded\n- Target environment reachable`,
    expectedBehavior: `- Response status 200\n- Correct ${cat} headers present\n- Response time < 500ms\n- Cache HIT ratio > 0.8`,
    documentation: `## ${TEST_NAMES[i]}\n\nValidates ${cat} behavior for endpoint group ${i}.\n\n### Test Steps\n1. Send HTTP GET request\n2. Validate response headers\n3. Check response time\n4. Confirm cache behavior\n5. Run predicates\n\n### Expected Results\n- Status: 200 OK\n- Response time < 500ms\n- Cache HIT ratio > 0.8`,
    relatedTestIds: [`tc_${(i + 1) % 25}`, `tc_${(i + 2) % 25}`],
    requestHeaders: seedRequestHeaders(i, cat),
    cookies: seedCookies(i),
    expectedStatus: cat === "security" ? 403 : cat === "ddos" ? 429 : cat === "tls" ? 302 : 200,
    captureResponseHeaders: seedCaptureHeaders(i),
    testType: "web",
    config: {},
    assertions: [],
    filmstrip: seedFilmstrip(i),
    predicates: seedPredicates(i, cat),
    version: 1 + (i % 3),
    changelog: [
      { version: 1, timestamp: now, author: OWNERS[i % OWNERS.length], summary: "Initial creation", changes: ["Test case created"] },
    ],
    createdAt: now,
    updatedAt: updated,
  };
});

const BASE_TEST_SUITES: TestSuite[] = [
  {
    id: "suite_full", name: "Full Regression Suite",
    description: "Complete end-to-end regression covering all category groups. Runs on every production deploy.",
    parentId: null,
    testIds: BASE_TEST_CASES.filter(t => t.status === "active").map(t => t.id),
    config: { target: "Prod", environment: "Production", parallelism: 8, retries: 2, failFast: false, timeoutMinutes: 60 },
    tags: ["regression", "e2e"], schedule: "0 6 * * 1-5",
    createdAt: "2026-01-15T08:00:00Z", updatedAt: "2026-06-01T12:00:00Z",
  },
  {
    id: "suite_geo", name: "Geo & Locale Validation",
    description: "Tests for geographic routing, locale splitting, and multi-region behavior.",
    parentId: null,
    testIds: BASE_TEST_CASES.filter(t => t.category === "geo-match" || t.category === "locale-split").slice(0, 8).map(t => t.id),
    config: { target: "Prod", environment: "Production", parallelism: 4, retries: 1, failFast: false, timeoutMinutes: 30 },
    tags: ["geo", "locale"], schedule: "0 */4 * * *",
    createdAt: "2026-02-10T09:00:00Z", updatedAt: "2026-05-28T16:00:00Z",
  },
  {
    id: "suite_perf", name: "Performance & Caching",
    description: "Performance benchmarks, cache hit ratio validation, and compression checks.",
    parentId: null,
    testIds: BASE_TEST_CASES.filter(t => t.category === "performance" || t.category === "caching").slice(0, 6).map(t => t.id),
    config: { target: "Prod", environment: "Staging", parallelism: 6, retries: 2, failFast: true, timeoutMinutes: 45 },
    tags: ["performance"], schedule: "0 */2 * * *",
    createdAt: "2026-03-05T10:00:00Z", updatedAt: "2026-06-02T08:00:00Z",
  },
  {
    id: "suite_security", name: "Security & DDoS",
    description: "WAF rule validation, rate limiting, DDoS mitigation, and TLS negotiation tests.",
    parentId: null,
    testIds: BASE_TEST_CASES.filter(t => t.category === "security" || t.category === "tls" || t.category === "ddos").slice(0, 5).map(t => t.id),
    config: { target: "UAT", environment: "Production", parallelism: 3, retries: 0, failFast: true, timeoutMinutes: 20 },
    tags: ["security"], schedule: null,
    createdAt: "2026-03-20T11:00:00Z", updatedAt: "2026-05-15T09:00:00Z",
  },
  {
    id: "suite_smoke", name: "Smoke Tests",
    description: "Quick health check suite for rapid deploy verification. Runs on every PR merge.",
    parentId: "suite_full",
    testIds: BASE_TEST_CASES.slice(0, 5).filter(t => t.status === "active").map(t => t.id),
    config: { target: "Prod", environment: "Production", parallelism: 2, retries: 0, failFast: true, timeoutMinutes: 10 },
    tags: ["smoke"], schedule: null,
    createdAt: "2026-04-01T07:00:00Z", updatedAt: "2026-06-05T10:00:00Z",
  },
  {
    id: "suite_uat", name: "UAT Regression",
    description: "Pre-release validation suite run against UAT staging before production promotion.",
    parentId: "suite_full",
    testIds: BASE_TEST_CASES.filter(t => t.status === "active" && t.severity === "critical").slice(0, 8).map(t => t.id),
    config: { target: "UAT", environment: "Staging", parallelism: 5, retries: 1, failFast: false, timeoutMinutes: 40 },
    tags: ["regression"], schedule: "0 22 * * 0-4",
    createdAt: "2026-04-15T12:00:00Z", updatedAt: "2026-06-03T14:00:00Z",
  },
  {
    id: "suite_edge", name: "Edge & CDN Config",
    description: "Edge-specific tests for CDN purge, redirect rules, custom error pages, and signed URLs.",
    parentId: null,
    testIds: BASE_TEST_CASES.filter(t => t.category === "routing").slice(0, 4).map(t => t.id),
    config: { target: "Prod", environment: "Staging", parallelism: 3, retries: 1, failFast: false, timeoutMinutes: 25 },
    tags: ["e2e"], schedule: "0 0 * * 6",
    createdAt: "2026-05-01T13:00:00Z", updatedAt: "2026-06-04T11:00:00Z",
  },
  {
    id: "suite_mobile", name: "Mobile & WebSocket",
    description: "Mobile redirect, WebSocket upgrade, and responsive delivery tests.",
    parentId: null,
    testIds: BASE_TEST_CASES.filter(t => t.tags.includes("tag_health")).slice(0, 3).map(t => t.id),
    config: { target: "Prod", environment: "Production", parallelism: 2, retries: 1, failFast: false, timeoutMinutes: 15 },
    tags: ["health", "e2e"], schedule: null,
    createdAt: "2026-05-10T15:00:00Z", updatedAt: "2026-06-05T09:00:00Z",
  },
];

// ── localStorage persistence ───────────────────────────────

const LS_TC_KEY = "aware_test_cases_v2";
const LS_SUITE_KEY = "aware_test_suites_v2";
const LS_DECISIONS_KEY = "aware_promotion_decisions";

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [...fallback];
  } catch {
    return [...fallback];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

// ── In-memory CRUD store with subscriptions ───────────────

let testCasesStore: TestCase[] = loadFromStorage<TestCase>(LS_TC_KEY, BASE_TEST_CASES);
let testSuitesStore: TestSuite[] = loadFromStorage<TestSuite>(LS_SUITE_KEY, BASE_TEST_SUITES);
let promotionDecisions: PromotionDecision[] = loadFromStorage<PromotionDecision>(LS_DECISIONS_KEY, []);
let nextTcId = Math.max(testCasesStore.length, 25);

const _tcListeners = new Set<() => void>();
const _tsListeners = new Set<() => void>();

function _notify() {
  _tcListeners.forEach(l => l());
  _tsListeners.forEach(l => l());
}

export function subscribeToTestCases(onChange: () => void): () => void {
  _tcListeners.add(onChange);
  return () => _tcListeners.delete(onChange);
}

export function subscribeToTestSuites(onChange: () => void): () => void {
  _tsListeners.add(onChange);
  return () => _tsListeners.delete(onChange);
}

// ── Test Case CRUD ────────────────────────────────────────

export function getTestCases(): TestCase[] { return [...testCasesStore]; }
export function getTestCaseById(id: string): TestCase | undefined { return testCasesStore.find(tc => tc.id === id); }

export function createTestCase(data: Omit<TestCase, "id" | "createdAt" | "updatedAt">): TestCase {
  const id = `tc_${nextTcId++}`;
  const now = new Date().toISOString();
  const tc: TestCase = {
    id, ...data,
    testType: data.testType ?? "web",
    config: data.config ?? {},
    assertions: data.assertions ?? [],
    requestHeaders: data.requestHeaders ?? {},
    cookies: data.cookies ?? {},
    expectedStatus: data.expectedStatus ?? 200,
    captureResponseHeaders: data.captureResponseHeaders ?? [],
    filmstrip: data.filmstrip ?? { enabled: false, threshold: 0.99 },
    predicates: data.predicates ?? [],
    version: 1,
    changelog: [{ version: 1, timestamp: now, author: data.owner || "system", summary: "Test case created", changes: ["Initial creation"] }],
    createdAt: now,
    updatedAt: now,
  };
  testCasesStore.push(tc);
  saveToStorage(LS_TC_KEY, testCasesStore);
  _notify();
  return tc;
}

export function updateTestCase(id: string, patch: Partial<Omit<TestCase, "id" | "createdAt">>): TestCase | undefined {
  const idx = testCasesStore.findIndex(tc => tc.id === id);
  if (idx === -1) return undefined;
  const prev = testCasesStore[idx];
  const changes: string[] = [];
  if (patch.name && patch.name !== prev.name) changes.push(`Name: "${prev.name}" → "${patch.name}"`);
  if (patch.status && patch.status !== prev.status) changes.push(`Status: ${prev.status} → ${patch.status}`);
  if (patch.priority && patch.priority !== prev.priority) changes.push(`Priority: ${prev.priority} → ${patch.priority}`);
  if (patch.category && patch.category !== prev.category) changes.push(`Category: ${prev.category} → ${patch.category}`);
  if (patch.owner && patch.owner !== prev.owner) changes.push(`Owner: ${prev.owner} → ${patch.owner}`);
  if (patch.description && patch.description !== prev.description) changes.push("Description updated");
  if (patch.tags && JSON.stringify(patch.tags) !== JSON.stringify(prev.tags)) changes.push("Tags updated");
  if ("expectedStatus" in patch && patch.expectedStatus !== prev.expectedStatus) changes.push(`Expected status: ${prev.expectedStatus} → ${patch.expectedStatus}`);
  if (patch.requestHeaders && JSON.stringify(patch.requestHeaders) !== JSON.stringify(prev.requestHeaders)) changes.push("Request headers updated");
  if (patch.predicates && JSON.stringify(patch.predicates) !== JSON.stringify(prev.predicates)) changes.push("Predicates updated");
  if (patch.filmstrip && JSON.stringify(patch.filmstrip) !== JSON.stringify(prev.filmstrip)) changes.push("Filmstrip config changed");
  const now = new Date().toISOString();
  const newVersion = prev.version + 1;
  const entry: TestChangeLogEntry = {
    version: newVersion, timestamp: now,
    author: patch.owner || prev.owner,
    summary: changes.length > 0 ? changes[0] : "Updated",
    changes: changes.length > 0 ? changes : ["Metadata updated"],
  };
  testCasesStore[idx] = {
    ...prev, ...patch,
    version: newVersion,
    changelog: [...prev.changelog, entry],
    updatedAt: now,
  };
  saveToStorage(LS_TC_KEY, testCasesStore);
  _notify();
  return testCasesStore[idx];
}

export function deleteTestCase(id: string): boolean {
  const before = testCasesStore.length;
  testCasesStore = testCasesStore.filter(tc => tc.id !== id);
  testSuitesStore.forEach(s => { s.testIds = s.testIds.filter(tid => tid !== id); });
  saveToStorage(LS_TC_KEY, testCasesStore);
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  _notify();
  return testCasesStore.length < before;
}

export function resetTestStore(): void {
  testCasesStore = [...BASE_TEST_CASES];
  testSuitesStore = [...BASE_TEST_SUITES];
  promotionDecisions = [];
  saveToStorage(LS_TC_KEY, testCasesStore);
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  saveToStorage(LS_DECISIONS_KEY, promotionDecisions);
  nextTcId = Math.max(testCasesStore.length, 25);
  _notify();
}

export function updateTestCaseDocumentation(id: string, documentation: string, author: string): TestCase | undefined {
  return updateTestCase(id, { documentation, owner: author });
}

export function getTestChangelog(id: string): TestChangeLogEntry[] {
  const tc = testCasesStore.find(t => t.id === id);
  return tc ? [...tc.changelog].reverse() : [];
}

// ── Test Suite CRUD ───────────────────────────────────────

export function getTestSuites(): TestSuite[] { return [...testSuitesStore]; }
export function getTestSuiteById(id: string): TestSuite | undefined { return testSuitesStore.find(s => s.id === id); }

export function createTestSuite(data: Omit<TestSuite, "id" | "createdAt" | "updatedAt">): TestSuite {
  const id = `suite_${Date.now()}`;
  const now = new Date().toISOString();
  const suite: TestSuite = { id, ...data, createdAt: now, updatedAt: now };
  testSuitesStore.push(suite);
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  _notify();
  return suite;
}

export function updateTestSuite(id: string, patch: Partial<Omit<TestSuite, "id" | "createdAt">>): TestSuite | undefined {
  const idx = testSuitesStore.findIndex(s => s.id === id);
  if (idx === -1) return undefined;
  testSuitesStore[idx] = { ...testSuitesStore[idx], ...patch, updatedAt: new Date().toISOString() };
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  _notify();
  return testSuitesStore[idx];
}

export function deleteTestSuite(id: string): boolean {
  const before = testSuitesStore.length;
  testSuitesStore = testSuitesStore.filter(s => s.id !== id);
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  _notify();
  return testSuitesStore.length < before;
}

export function addTestsToSuite(suiteId: string, testIds: string[]): TestSuite | undefined {
  const suite = testSuitesStore.find(s => s.id === suiteId);
  if (!suite) return undefined;
  const existing = new Set(suite.testIds);
  testIds.forEach(tid => { if (!existing.has(tid)) { suite.testIds.push(tid); existing.add(tid); } });
  suite.updatedAt = new Date().toISOString();
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  _notify();
  return suite;
}

export function removeTestsFromSuite(suiteId: string, testIds: string[]): TestSuite | undefined {
  const suite = testSuitesStore.find(s => s.id === suiteId);
  if (!suite) return undefined;
  const removeSet = new Set(testIds);
  suite.testIds = suite.testIds.filter(tid => !removeSet.has(tid));
  suite.updatedAt = new Date().toISOString();
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  _notify();
  return suite;
}

export function getTestCasesBySuiteId(suiteId: string): TestCase[] {
  const suite = testSuitesStore.find(s => s.id === suiteId);
  if (!suite) return [];
  return suite.testIds.map(tid => testCasesStore.find(tc => tc.id === tid)).filter((t): t is TestCase => !!t);
}

export function buildSuiteTree(): SuiteNode[] {
  const rootSuites = testSuitesStore.filter(s => s.parentId === null);
  return rootSuites.map(s => ({
    suite: s,
    children: testSuitesStore.filter(c => c.parentId === s.id).map(c => ({ suite: c, children: [], depth: 1 })),
    depth: 0,
  }));
}

export function getTestCasesByFilter(filter: TestCaseFilter): TestCase[] {
  return testCasesStore.filter(tc => {
    if (filter.search && !tc.name.toLowerCase().includes(filter.search.toLowerCase()) && !tc.description.toLowerCase().includes(filter.search.toLowerCase())) return false;
    if (filter.status && tc.status !== filter.status) return false;
    if (filter.priority && tc.priority !== filter.priority) return false;
    if (filter.category && tc.category !== filter.category) return false;
    if (filter.tags.length > 0 && !filter.tags.some(t => tc.tags.includes(t))) return false;
    if (filter.suiteId && !tc.suiteIds.includes(filter.suiteId)) return false;
    return true;
  });
}

// ── Import / Export ───────────────────────────────────────

export function importTestCases(data: TestCase[]): ImportResult {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  data.forEach((tc, line) => {
    if (!tc.name || !tc.category) {
      result.errors.push({ line, message: "Missing required fields (name, category)" });
      return;
    }
    const exists = testCasesStore.some(e => e.name === tc.name);
    if (exists) { result.skipped++; return; }
    const now = new Date().toISOString();
    const id = `tc_${nextTcId++}`;
    testCasesStore.push({
      ...tc, id,
      requestHeaders: tc.requestHeaders ?? {},
      cookies: tc.cookies ?? {},
      expectedStatus: tc.expectedStatus ?? 200,
      captureResponseHeaders: tc.captureResponseHeaders ?? [],
      filmstrip: tc.filmstrip ?? { enabled: false, threshold: 0.99 },
      predicates: tc.predicates ?? [],
      version: tc.version || 1,
      changelog: tc.changelog || [{ version: 1, timestamp: now, author: tc.owner || "import", summary: "Imported", changes: ["Imported from external source"] }],
      documentation: tc.documentation || "",
      createdAt: now, updatedAt: now,
    });
    result.imported++;
  });
  if (result.imported > 0) {
    saveToStorage(LS_TC_KEY, testCasesStore);
    _notify();
  }
  return result;
}

export function exportTestCases(format: "json" | "csv"): string {
  if (format === "csv") {
    const headers = "id,name,description,category,priority,severity,status,owner,automated,scriptPath,version,expectedStatus,predicateCount";
    const rows = testCasesStore.map(tc =>
      `"${tc.id}","${tc.name.replace(/"/g, '""')}","${tc.description.replace(/"/g, '""')}","${tc.category}",${tc.priority},${tc.severity},${tc.status},"${tc.owner}",${tc.automated},"${tc.scriptPath}",${tc.version},${tc.expectedStatus},${tc.predicates.length}`
    );
    return [headers, ...rows].join("\n");
  }
  return JSON.stringify(testCasesStore.map(tc => ({
    id: tc.id, name: tc.name, description: tc.description, category: tc.category,
    priority: tc.priority, severity: tc.severity, status: tc.status,
    owner: tc.owner, tags: tc.tags, automated: tc.automated, version: tc.version,
    scriptPath: tc.scriptPath, requestHeaders: tc.requestHeaders, cookies: tc.cookies,
    expectedStatus: tc.expectedStatus, captureResponseHeaders: tc.captureResponseHeaders,
    filmstrip: tc.filmstrip, predicates: tc.predicates,
  })), null, 2);
}

export function exportTestsAsJunitXml(suiteId?: string): string {
  const tests = suiteId
    ? testCasesStore.filter(tc => tc.suiteIds.includes(suiteId))
    : testCasesStore;
  const suite = suiteId ? testSuitesStore.find(s => s.id === suiteId) : null;
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<testsuites name="AWARE Tests" tests="${tests.length}">`);
  lines.push(`  <testsuite name="${suite?.name ?? "all"}" tests="${tests.length}">`);
  tests.forEach(tc => {
    lines.push(`    <testcase name="${tc.name}" classname="${tc.category}" time="0">`);
    lines.push(`      <properties>`);
    lines.push(`        <property name="priority" value="${tc.priority}"/>`);
    lines.push(`        <property name="severity" value="${tc.severity}"/>`);
    lines.push(`        <property name="owner" value="${tc.owner}"/>`);
    lines.push(`        <property name="expectedStatus" value="${tc.expectedStatus}"/>`);
    lines.push(`        <property name="predicateCount" value="${tc.predicates.length}"/>`);
    lines.push(`        <property name="filmstripEnabled" value="${tc.filmstrip.enabled}"/>`);
    lines.push(`      </properties>`);
    lines.push(`    </testcase>`);
  });
  lines.push(`  </testsuite>`);
  lines.push(`</testsuites>`);
  return lines.join("\n");
}

// ── Bulk Generation ────────────────────────────────────────

const GENERATION_TEMPLATES = [
  { verb: "Verify", field: "Geo match", path: "/api/v1/data", check: "resolves correct PoP" },
  { verb: "Check", field: "locale split", path: "/api/v2/content", check: "serves region-correct content" },
  { verb: "Validate", field: "URL health", path: "/api/v1/status", check: "returns 200 OK" },
  { verb: "Ensure", field: "edge redirect", path: "/api/v3/redirect", check: "preserves query params" },
  { verb: "Verify", field: "cache TTL", path: "/api/v2/assets", check: "matches origin max-age" },
  { verb: "Check", field: "compression", path: "/api/v1/static", check: "gzip enabled" },
  { verb: "Validate", field: "CORS headers", path: "/api/v2/config", check: "present on cross-origin" },
  { verb: "Ensure", field: "rate limiting", path: "/api/v1/auth", check: "triggers at threshold" },
  { verb: "Verify", field: "TLS version", path: "/api/v3/secure", check: "1.3 negotiated" },
  { verb: "Check", field: "WAF rules", path: "/api/v1/input", check: "block SQL injection" },
  { verb: "Validate", field: "auth token", path: "/api/v2/user", check: "expiry returns 401" },
  { verb: "Ensure", field: "CDN purge", path: "/api/v1/cache", check: "completes within 5s" },
  { verb: "Verify", field: "IPv6", path: "/api/v2/network", check: "preferred when available" },
  { verb: "Check", field: "HTTP/3 upgrade", path: "/api/v3/alt-svc", check: "from Alt-Svc header" },
  { verb: "Validate", field: "origin shield", path: "/api/v1/origin", check: "hit ratio > 80%" },
  { verb: "Ensure", field: "mobile redirect", path: "/api/v1/mobile", check: "applied correctly" },
  { verb: "Verify", field: "API key rotation", path: "/api/v2/keys", check: "propagates in 30s" },
  { verb: "Check", field: "websocket handshake", path: "/api/v2/ws", check: "upgrades successfully" },
  { verb: "Validate", field: "custom error page", path: "/api/v3/errors", check: "served on 5xx" },
  { verb: "Ensure", field: "signed URL expiry", path: "/api/v1/media", check: "enforced correctly" },
];

export function generateTestCases(params: GenerateParams): TestCase[] {
  const result: TestCase[] = [];
  const now = new Date();
  for (let i = 0; i < params.count; i++) {
    const template = GENERATION_TEMPLATES[i % GENERATION_TEMPLATES.length];
    const idx = nextTcId + result.length;
    const id = `tc_${idx}`;
    const name = `${template.verb} ${template.field} ${template.check}`;
    const cat = params.category;
    const ts = now.toISOString();
    const tc: TestCase = {
      id, name,
      description: `Generated test: ${template.verb} ${template.field} for ${template.path} — ${template.check}. Part of ${cat} suite.`,
      category: cat,
      priority: params.priority,
      severity: params.priority === "P0" ? "critical" : params.priority === "P1" ? "major" : params.priority === "P2" ? "minor" : "trivial",
      status: params.status,
      tags: [cat.replace(/[^a-z0-9]/g, "_"), ...(i % 2 === 0 ? ["automated"] : ["regression"])],
      owner: params.owner,
      suiteIds: [...params.suites],
      automated: true,
      scriptPath: `tests/generated/${cat}/tc_${idx}.spec.ts`,
      preconditions: `- ${cat} test environment ready\n- Mock data seeded for ${template.path}\n- EdgeGrid token valid`,
      expectedBehavior: `- Response ${template.check}\n- Response time < 500ms\n- Correct headers present`,
      documentation: `## ${name}\n\nGenerated test for ${cat} — ${template.path}.\n\n### Expected\n- ${template.check}`,
      relatedTestIds: [],
      requestHeaders: { "Accept": "application/json", "User-Agent": "AWARE-TestRunner/2.0" },
      cookies: {},
      expectedStatus: cat === "security" ? 403 : cat === "ddos" ? 429 : 200,
      testType: "web" as const,
      config: {},
      assertions: [],
      captureResponseHeaders: ["X-Cache", "X-Request-ID", "Age"],
      filmstrip: { enabled: false, threshold: 0.99 },
      predicates: [
        { id: `pred_gen_${idx}_0`, type: "statusCode", field: "", expected: "200", operator: "equals", description: "Status 200" },
        { id: `pred_gen_${idx}_1`, type: "responseTime", field: "duration", expected: "1000", operator: "lt", description: "Response < 1000ms" },
      ],
      version: 1,
      changelog: [{ version: 1, timestamp: ts, author: params.owner, summary: "Generated", changes: ["Bulk generated"] }],
      createdAt: ts,
      updatedAt: ts,
    };
    result.push(tc);
    testCasesStore.push(tc);
  }
  nextTcId += result.length;
  if (result.length > 0) {
    saveToStorage(LS_TC_KEY, testCasesStore);
    _notify();
  }
  return result;
}

// ── Stats ──────────────────────────────────────────────────

export function computeTestStats(): TestStats {
  const tcs = testCasesStore;
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byOwner: Record<string, number> = {};
  const byTag: Record<string, number> = {};
  let automated = 0;
  let totalVersion = 0;
  tcs.forEach(tc => {
    byStatus[tc.status] = (byStatus[tc.status] || 0) + 1;
    byPriority[tc.priority] = (byPriority[tc.priority] || 0) + 1;
    byCategory[tc.category] = (byCategory[tc.category] || 0) + 1;
    bySeverity[tc.severity] = (bySeverity[tc.severity] || 0) + 1;
    byOwner[tc.owner] = (byOwner[tc.owner] || 0) + 1;
    tc.tags.forEach(t => { byTag[t] = (byTag[t] || 0) + 1; });
    if (tc.automated) automated++;
    totalVersion += tc.version;
  });
  const categories = Object.keys(CATEGORIES.reduce((a, c) => ({ ...a, [c]: 1 }), {} as Record<string, number>));
  const coveredCategories = Object.keys(byCategory).length;
  return {
    total: tcs.length, byStatus, byPriority, byCategory, bySeverity, byOwner, byTag,
    automated, manual: tcs.length - automated,
    coverage: Math.round((coveredCategories / categories.length) * 100),
    avgVersion: tcs.length > 0 ? Math.round((totalVersion / tcs.length) * 10) / 10 : 0,
  };
}

// ── Test results per run ───────────────────────────────────

export function getTestResultsForRun(runId: string): TestResult[] {
  const runIdx = RUNS.findIndex(r => r.id === runId);
  if (runIdx < 0) return [];
  return Array.from({ length: 20 }).map((_, i) => {
    const base = (runIdx * 11 + i * 7) % 100;
    const status: "PASS" | "FAIL" = (runIdx === 2 && i < 6) || (runIdx === 7 && i < 12) ? "FAIL" : base < 78 ? "PASS" : "FAIL";
    return {
      id: `tr_${runIdx}_${i}`,
      name: TEST_NAMES[i % TEST_NAMES.length],
      status,
      duration: 80 + ((base * 2 + i * 3) % 350),
      category: CATEGORIES[i % CATEGORIES.length],
      suite: runIdx % 3 === 0 ? "full_suite" : "geo_gating",
    };
  });
}

// ── Promotion Decisions ───────────────────────────────────

export function getPromotionDecision(runId: string): PromotionDecision | undefined {
  return promotionDecisions.find(d => d.runId === runId);
}

export function setPromotionDecision(decision: PromotionDecision): void {
  const idx = promotionDecisions.findIndex(d => d.runId === decision.runId);
  if (idx >= 0) promotionDecisions[idx] = decision;
  else promotionDecisions.push(decision);
  saveToStorage(LS_DECISIONS_KEY, promotionDecisions);
}

export function getAllPromotionDecisions(): PromotionDecision[] {
  return [...promotionDecisions];
}

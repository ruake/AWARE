import type {
  Run, TestResult, TestDetail, TestRunPoint, DiffRow,
  TestCase, TestSuite, TestTag, TestChangeLogEntry, PromotionDecision
} from "./types";

export type { Run, TestResult, TestDetail, TestRunPoint, DiffRow, TestCase, TestSuite, TestTag, TestChangeLogEntry, PromotionDecision };

const ENVS = ["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"];

export const RUNS: Run[] = Array.from({ length: 12 }).map((_, i) => {
  const isFail = i === 2 || i === 7;
  const isPartial = i === 4;
  const status: Run["status"] = isFail ? "FAIL" : isPartial ? "PARTIAL" : "PASS";
  const failCount = status === "PASS" ? 0 : status === "FAIL" ? (i === 2 ? 6 : 12) : 3;
  const passPct = status === "PASS" ? 100 : 100 - Math.floor(failCount / 0.1 + 5);
  return {
    id: `run_892_2341.1.0_prod_${1000 + i}`,
    label: `PM 892 · EW 2341.1.${i}`,
    suite: i % 3 === 0 ? "full_suite" : i % 3 === 1 ? "geo_gating" : "smoke",
    target: i % 2 === 0 ? "Prod" : "UAT",
    status,
    passPct: Math.max(50, passPct),
    failures: failCount,
    duration: `${45 + (i % 15)}m`,
    durationMs: (45 + (i % 15)) * 60000,
    started: `2026-06-0${6 - Math.floor(i / 4)}T${String(14 - (i % 6)).padStart(2,"0")}:${String(30 - (i % 30)).padStart(2,"0")}Z`,
    pm: "v892",
    ew: `2341.1.${i}`,
    env: ENVS[i % ENVS.length],
  };
});

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
const PRIORITIES: TestCase["priority"][] = ["P0", "P1", "P2", "P3"];
const SEVERITIES: TestCase["severity"][] = ["critical", "major", "minor", "trivial"];
const OWNERS = ["alice@co.com", "bob@co.com", "carol@co.com", "dave@co.com", "eve@co.com"];

const BASE_TEST_CASES: TestCase[] = Array.from({ length: 25 }).map((_, i) => {
  const tagCount = 1 + (i % 3);
  const tags = TEST_TAGS.slice(i % TEST_TAGS.length).slice(0, tagCount).map(t => t.id);
  const priority = PRIORITIES[i % PRIORITIES.length];
  const cat = CATEGORIES[i % CATEGORIES.length];
  const now = `2026-0${1 + (i % 9)}-0${1 + (i % 7)}T10:00:00Z`;
  const updated = `2026-0${1 + (i % 9)}-0${1 + (i % 7)}T14:30:00Z`;
  return {
    id: `tc_${i}`,
    name: TEST_NAMES[i],
    description: `Automated test verifying ${cat} behavior for endpoint group ${i}. Ensures correct behavior across Akamai CDN edge network.`,
    category: cat,
    priority,
    severity: SEVERITIES[PRIORITIES.indexOf(priority)],
    status: (i < 22 ? "active" : i === 22 ? "disabled" : "deprecated") as TestCase["status"],
    tags,
    owner: OWNERS[i % OWNERS.length],
    suiteIds: i < 10 ? ["suite_full", "suite_geo"] : i < 18 ? ["suite_full", "suite_perf"] : i < 22 ? ["suite_full"] : [],
    automated: true,
    scriptPath: `tests/aware/${cat}/tc_${i}.spec.ts`,
    preconditions: `- Akamai EdgeGrid credentials configured\n- ${cat} test data seeded\n- Target environment reachable`,
    expectedBehavior: `- Response status 200\n- Correct ${cat} headers present\n- Response time < 500ms`,
    documentation: `## ${TEST_NAMES[i]}\n\nValidates ${cat} behavior for endpoint group ${i}.\n\n### Steps\n1. Send request to endpoint\n2. Validate response headers\n3. Check response time\n\n### Expected Results\n- Status 200 OK, response < 500ms`,
    relatedTestIds: [`tc_${(i + 1) % 25}`, `tc_${(i + 2) % 25}`],
    version: 1 + (i % 3),
    changelog: [{ version: 1, timestamp: now, author: OWNERS[i % OWNERS.length], summary: "Initial creation", changes: ["Test case created"] }],
    createdAt: now,
    updatedAt: updated,
  };
});

// ── localStorage-persisted CRUD store ──────────────────────

const LS_TC_KEY = "aware_test_cases";
const LS_SUITE_KEY = "aware_test_suites";
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

let testCasesStore: TestCase[] = loadFromStorage<TestCase>(LS_TC_KEY, BASE_TEST_CASES);

const BASE_TEST_SUITES: TestSuite[] = [
  {
    id: "suite_full", name: "Full Regression Suite",
    description: "Complete end-to-end regression covering all categories. Runs on every Akamai config deploy.",
    parentId: null,
    testIds: BASE_TEST_CASES.filter(t => t.status === "active").map(t => t.id),
    config: { target: "Prod", environment: "Production", parallelism: 8, retries: 2, failFast: false, timeoutMinutes: 60 },
    tags: ["regression", "e2e"], schedule: "0 6 * * 1-5",
    createdAt: "2026-01-15T08:00:00Z", updatedAt: "2026-06-01T12:00:00Z",
  },
  {
    id: "suite_geo", name: "Geo & Locale Validation",
    description: "Geographic routing, locale splitting, and multi-region behavior tests.",
    parentId: null,
    testIds: BASE_TEST_CASES.filter(t => ["geo-match","locale-split"].includes(t.category)).slice(0, 8).map(t => t.id),
    config: { target: "Prod", environment: "Production", parallelism: 4, retries: 1, failFast: false, timeoutMinutes: 30 },
    tags: ["geo"], schedule: "0 */4 * * *",
    createdAt: "2026-02-10T09:00:00Z", updatedAt: "2026-05-28T16:00:00Z",
  },
  {
    id: "suite_perf", name: "Performance & Caching",
    description: "Cache hit ratio, compression, and latency benchmarks.",
    parentId: null,
    testIds: BASE_TEST_CASES.filter(t => ["performance","caching"].includes(t.category)).slice(0, 6).map(t => t.id),
    config: { target: "Prod", environment: "Staging", parallelism: 6, retries: 2, failFast: true, timeoutMinutes: 45 },
    tags: ["performance"], schedule: "0 */2 * * *",
    createdAt: "2026-03-05T10:00:00Z", updatedAt: "2026-06-02T08:00:00Z",
  },
  {
    id: "suite_security", name: "Security & DDoS",
    description: "WAF rules, rate limiting, DDoS mitigation, TLS tests.",
    parentId: null,
    testIds: BASE_TEST_CASES.filter(t => ["security","tls","ddos"].includes(t.category)).slice(0, 5).map(t => t.id),
    config: { target: "UAT", environment: "Production", parallelism: 3, retries: 0, failFast: true, timeoutMinutes: 20 },
    tags: ["security"], schedule: null,
    createdAt: "2026-03-20T11:00:00Z", updatedAt: "2026-05-15T09:00:00Z",
  },
  {
    id: "suite_smoke", name: "Smoke Tests",
    description: "Quick health check for rapid deploy verification. Runs on every PR merge.",
    parentId: null,
    testIds: BASE_TEST_CASES.slice(0, 5).filter(t => t.status === "active").map(t => t.id),
    config: { target: "Prod", environment: "Production", parallelism: 2, retries: 0, failFast: true, timeoutMinutes: 10 },
    tags: ["smoke"], schedule: null,
    createdAt: "2026-04-01T07:00:00Z", updatedAt: "2026-06-05T10:00:00Z",
  },
];

let testSuitesStore: TestSuite[] = loadFromStorage<TestSuite>(LS_SUITE_KEY, BASE_TEST_SUITES);
let promotionDecisions: PromotionDecision[] = loadFromStorage<PromotionDecision>(LS_DECISIONS_KEY, []);
let nextTcId = testCasesStore.length;

// ── Test Case CRUD ────────────────────────────────────────
export function getTestCases(): TestCase[] { return [...testCasesStore]; }
export function getTestCaseById(id: string): TestCase | undefined { return testCasesStore.find(tc => tc.id === id); }

export function createTestCase(data: Partial<TestCase>): TestCase {
  const id = `tc_${nextTcId++}`;
  const now = new Date().toISOString();
  const tc: TestCase = {
    id, name: data.name ?? "New Test", description: data.description ?? "",
    category: data.category ?? "geo-match", priority: data.priority ?? "P2",
    severity: data.severity ?? "minor", status: data.status ?? "active",
    tags: data.tags ?? [], owner: data.owner ?? "unknown@co.com",
    suiteIds: data.suiteIds ?? [], automated: true,
    scriptPath: `tests/aware/${data.category ?? "geo-match"}/${id}.spec.ts`,
    preconditions: data.preconditions ?? "", expectedBehavior: data.expectedBehavior ?? "",
    documentation: data.documentation ?? `## ${data.name ?? "New Test"}`,
    relatedTestIds: [], version: 1,
    changelog: [{ version: 1, timestamp: now, author: data.owner ?? "system", summary: "Created", changes: ["Initial creation"] }],
    createdAt: now, updatedAt: now,
  };
  testCasesStore.push(tc);
  saveToStorage(LS_TC_KEY, testCasesStore);
  return tc;
}

export function updateTestCase(id: string, patch: Partial<TestCase>): TestCase | undefined {
  const idx = testCasesStore.findIndex(tc => tc.id === id);
  if (idx === -1) return undefined;
  const prev = testCasesStore[idx];
  const now = new Date().toISOString();
  const newVersion = prev.version + 1;
  const changes: string[] = [];
  if (patch.name && patch.name !== prev.name) changes.push(`Name updated`);
  if (patch.status && patch.status !== prev.status) changes.push(`Status: ${prev.status} → ${patch.status}`);
  if (patch.priority && patch.priority !== prev.priority) changes.push(`Priority: ${prev.priority} → ${patch.priority}`);
  const entry: TestChangeLogEntry = {
    version: newVersion, timestamp: now,
    author: patch.owner ?? prev.owner,
    summary: changes.length > 0 ? changes[0] : "Updated",
    changes: changes.length > 0 ? changes : ["Metadata updated"],
  };
  testCasesStore[idx] = {
    ...prev, ...patch, version: newVersion,
    changelog: [...prev.changelog, entry], updatedAt: now,
  };
  saveToStorage(LS_TC_KEY, testCasesStore);
  return testCasesStore[idx];
}

export function deleteTestCase(id: string): boolean {
  const before = testCasesStore.length;
  testCasesStore = testCasesStore.filter(tc => tc.id !== id);
  saveToStorage(LS_TC_KEY, testCasesStore);
  return testCasesStore.length < before;
}

export function resetTestStore(): void {
  testCasesStore = [...BASE_TEST_CASES];
  testSuitesStore = [...BASE_TEST_SUITES];
  promotionDecisions = [];
  saveToStorage(LS_TC_KEY, testCasesStore);
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  saveToStorage(LS_DECISIONS_KEY, promotionDecisions);
  nextTcId = testCasesStore.length;
}

// ── Suite CRUD ────────────────────────────────────────────
export function getTestSuites(): TestSuite[] { return [...testSuitesStore]; }
export function getTestSuiteById(id: string): TestSuite | undefined { return testSuitesStore.find(s => s.id === id); }

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

// ── Pass rate chart data ───────────────────────────────────
export const PASS_RATE_CHART = RUNS.map((run, i) => ({
  label: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue","Wed","Thu","Fri"][i],
  passRate: run.passPct,
  runId: run.id,
}));

export const ENV_PASS_RATE_CHART = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue","Wed"].map((day, d) => ({
  day,
  "Prod/Production": Math.max(70, 100 - d * 2 - (d === 4 ? 18 : 0)),
  "Prod/Staging": Math.max(70, 100 - d * 2 - (d === 4 ? 15 : 0)),
  "UAT/Production": Math.max(95, 100 - d * 1 - (d === 6 ? 5 : 0)),
  "UAT/Staging": Math.max(92, 100 - d * 1),
}));

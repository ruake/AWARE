// ⚠️ KEEP IN SYNC with scripts/generate-data.mjs
// This file is the in-memory mock used when VITE_USE_MOCK=true.
// The generate script produces the same data as JSON files for the API path.
// Update both when changing mock data shapes or values.

import type { Run, TestResult, TestRunPoint, TestDetail, DiffRow, TestCase, TestSuite, TestTag, ImportResult, TestChangeLogEntry, GenerateParams, TestStats, TestCaseFilter, SuiteNode } from "./types";

export type { Run, TestResult, TestRunPoint, TestDetail, DiffRow, TestCase, TestSuite, TestTag, ImportResult, TestChangeLogEntry, GenerateParams, TestStats, TestCaseFilter, SuiteNode };

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

export function getRunById(id: string): Run | undefined {
  return RUNS.find(r => r.id === id);
}

export function getRunIndex(id: string): number {
  return RUNS.findIndex(r => r.id === id);
}

export function generateTestHistory(testIndex: number): TestDetail {
  const history: TestRunPoint[] = RUNS.map((run, runIdx) => {
    const base = (testIndex * 7 + runIdx * 13) % 100;
    const status: "PASS" | "FAIL" = base < 70 ? "PASS" : "FAIL";
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

export const DIFF_ROWS: DiffRow[] = Array.from({ length: 15 }).map((_, i) => {
  let state: DiffRow["state"] = "unchanged";
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

export const TEST_DETAILS: TestDetail[] = Array.from({ length: DIFF_ROWS.length }).map((_, i) => generateTestHistory(i));

export const PASS_RATE_DATA: (string | number | Record<string, unknown>)[][] = [
  ["Day", "Pass Rate", { type: "string", role: "tooltip" }],
  ...RUNS.map((run, i) => [
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][i],
    run.passPct,
    `${run.id} — ${run.passPct}%`,
  ]),
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

type ColDef = { type: string; role: string; [k: string]: unknown };

export const ENV_PASS_RATE_DATA: (string | number | ColDef)[][] = [
  ["Day", "Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging",
    { type: "string", role: "tooltip", p: { html: true } }],
  ...DAYS.slice(0, 10).map((day, d) => {
    const prodProd = Math.max(70, 100 - d * 2 - (d === 4 ? 18 : 0));
    const prodStg = Math.max(70, 100 - d * 2 - (d === 4 ? 15 : 0));
    const uatProd = Math.max(95, 100 - d * 1 - (d === 6 ? 5 : 0));
    const uatStg = Math.max(92, 100 - d * 1);
    return [
      day,
      prodProd,
      prodStg,
      uatProd,
      uatStg,
      `<b>${day}</b><br>Prod/Prod: ${prodProd}%<br>Prod/Stg: ${prodStg}%<br>UAT/Prod: ${uatProd}%<br>UAT/Stg: ${uatStg}%`,
    ] as (string | number)[];
  }),
];

export const ENV_SUMMARY = [
  {
    label: "Prod/Production",
    passRate: 87,
    trend: -4,        // negative = regression
    failures: 14,
    color: "#d93025",  // red = regression
    alert: "PASS RATE DROPPED 4%",
  },
  {
    label: "Prod/Staging",
    passRate: 92,
    trend: -2,
    failures: 6,
    color: "#f9ab00",
    alert: null,
  },
  {
    label: "UAT/Production",
    passRate: 100,
    trend: 0,
    failures: 0,
    color: "#1e8e3e",
    alert: null,
  },
  {
    label: "UAT/Staging",
    passRate: 98,
    trend: -1,
    failures: 2,
    color: "#1e8e3e",
    alert: null,
  },
];

// ── Test Case Management Mock Data ─────────────────────────

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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

const PRIORITIES = ["P0", "P1", "P2", "P3"] as const;
const SEVERITIES = ["critical", "major", "minor", "trivial"] as const;
const OWNERS = ["alice@co.com", "bob@co.com", "carol@co.com", "dave@co.com", "eve@co.com"];

export const TEST_CASES: TestCase[] = Array.from({ length: 25 }).map((_, i) => {
  const tagCount = 1 + (i % 3);
  const shuffled = [...TEST_TAGS].sort(() => Math.random() - 0.5);
  const tags = shuffled.slice(0, tagCount).map(t => t.id);
  const priority = PRIORITIES[i % PRIORITIES.length];
  const cat = CATEGORIES[i % CATEGORIES.length];
  const now = new Date(`2026-0${1 + (i % 9)}-0${1 + (i % 7)}T10:00:00Z`);
  const updated = new Date(`2026-0${1 + (i % 9)}-0${1 + (i % 7)}T14:30:00Z`);
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
    documentation: `## ${TEST_NAMES[i]}\n\nValidates ${cat} behavior for endpoint group ${i}.\n\n### Test Steps\n1. Send request to endpoint\n2. Validate response headers\n3. Check response time\n4. Confirm cache behavior\n\n### Expected Results\n- Status: 200 OK\n- Response time < 500ms\n- Cache HIT ratio > 0.8\n\n### Notes\nThis test is part of the ${cat} validation suite.`,
    relatedTestIds: [`tc_${(i + 1) % 25}`, `tc_${(i + 2) % 25}`],
    version: 1 + (i % 3),
    changelog: [
      { version: 1, timestamp: now.toISOString(), author: OWNERS[i % OWNERS.length], summary: "Initial creation", changes: ["Test case created"] },
    ],
    createdAt: now.toISOString(),
    updatedAt: updated.toISOString(),
  };
});

export const TEST_SUITES: TestSuite[] = [
  {
    id: "suite_full",
    name: "Full Regression Suite",
    description: "Complete end-to-end regression covering all category groups. Runs on every production deploy.",
    parentId: null,
    testIds: TEST_CASES.filter(t => t.status === "active").map(t => t.id),
    config: { target: "Prod", environment: "Production", parallelism: 8, retries: 2, failFast: false, timeoutMinutes: 60 },
    tags: ["regression", "e2e"],
    schedule: "0 6 * * 1-5",
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-06-01T12:00:00Z",
  },
  {
    id: "suite_geo",
    name: "Geo & Locale Validation",
    description: "Tests for geographic routing, locale splitting, and multi-region behavior.",
    parentId: null,
    testIds: TEST_CASES.filter(t => t.category === "geo-match" || t.category === "locale-split").slice(0, 8).map(t => t.id),
    config: { target: "Prod", environment: "Production", parallelism: 4, retries: 1, failFast: false, timeoutMinutes: 30 },
    tags: ["geo", "locale"],
    schedule: "0 */4 * * *",
    createdAt: "2026-02-10T09:00:00Z",
    updatedAt: "2026-05-28T16:00:00Z",
  },
  {
    id: "suite_perf",
    name: "Performance & Caching",
    description: "Performance benchmarks, cache hit ratio validation, and compression checks.",
    parentId: null,
    testIds: TEST_CASES.filter(t => t.category === "performance" || t.category === "caching").slice(0, 6).map(t => t.id),
    config: { target: "Prod", environment: "Staging", parallelism: 6, retries: 2, failFast: true, timeoutMinutes: 45 },
    tags: ["performance"],
    schedule: "0 */2 * * *",
    createdAt: "2026-03-05T10:00:00Z",
    updatedAt: "2026-06-02T08:00:00Z",
  },
  {
    id: "suite_security",
    name: "Security & DDoS",
    description: "WAF rule validation, rate limiting, DDoS mitigation, and TLS negotiation tests.",
    parentId: null,
    testIds: TEST_CASES.filter(t => t.category === "security" || t.category === "tls" || t.category === "ddos").slice(0, 5).map(t => t.id),
    config: { target: "UAT", environment: "Production", parallelism: 3, retries: 0, failFast: true, timeoutMinutes: 20 },
    tags: ["security"],
    schedule: null,
    createdAt: "2026-03-20T11:00:00Z",
    updatedAt: "2026-05-15T09:00:00Z",
  },
  {
    id: "suite_smoke",
    name: "Smoke Tests",
    description: "Quick health check suite for rapid deploy verification. Runs on every PR merge.",
    parentId: null,
    testIds: TEST_CASES.slice(0, 5).filter(t => t.status === "active").map(t => t.id),
    config: { target: "Prod", environment: "Production", parallelism: 2, retries: 0, failFast: true, timeoutMinutes: 10 },
    tags: ["smoke"],
    schedule: null,
    createdAt: "2026-04-01T07:00:00Z",
    updatedAt: "2026-06-05T10:00:00Z",
  },
  {
    id: "suite_uat",
    name: "UAT Regression",
    description: "Pre-release validation suite run against UAT staging before production promotion.",
    parentId: null,
    testIds: TEST_CASES.filter(t => t.status === "active" && t.severity === "critical").slice(0, 8).map(t => t.id),
    config: { target: "UAT", environment: "Staging", parallelism: 5, retries: 1, failFast: false, timeoutMinutes: 40 },
    tags: ["regression"],
    schedule: "0 22 * * 0-4",
    createdAt: "2026-04-15T12:00:00Z",
    updatedAt: "2026-06-03T14:00:00Z",
  },
  {
    id: "suite_edge",
    name: "Edge & CDN Config",
    description: "Edge-specific tests for CDN purge, redirect rules, custom error pages, and signed URLs.",
    parentId: null,
    testIds: TEST_CASES.filter(t => t.category === "routing").slice(0, 4).map(t => t.id),
    config: { target: "Prod", environment: "Staging", parallelism: 3, retries: 1, failFast: false, timeoutMinutes: 25 },
    tags: ["e2e"],
    schedule: "0 0 * * 6",
    createdAt: "2026-05-01T13:00:00Z",
    updatedAt: "2026-06-04T11:00:00Z",
  },
  {
    id: "suite_mobile",
    name: "Mobile & WebSocket",
    description: "Mobile redirect, WebSocket upgrade, and responsive delivery tests.",
    parentId: null,
    testIds: TEST_CASES.filter(t => t.tags.includes("tag_health")).slice(0, 3).map(t => t.id),
    config: { target: "Prod", environment: "Production", parallelism: 2, retries: 1, failFast: false, timeoutMinutes: 15 },
    tags: ["health", "e2e"],
    schedule: null,
    createdAt: "2026-05-10T15:00:00Z",
    updatedAt: "2026-06-05T09:00:00Z",
  },
];

// ── In-Memory CRUD Store ──────────────────────────────────

let testCasesStore = [...TEST_CASES];
let testSuitesStore = [...TEST_SUITES];
let nextTcId = TEST_CASES.length;
let nextSuiteId = TEST_SUITES.length;

export function resetTestStore(): void {
  testCasesStore = [...TEST_CASES];
  testSuitesStore = [...TEST_SUITES];
  nextTcId = TEST_CASES.length;
  nextSuiteId = TEST_SUITES.length;
}

export function getAllTestCases(): TestCase[] {
  return [...testCasesStore];
}

export function getTestCaseById(id: string): TestCase | undefined {
  return testCasesStore.find(tc => tc.id === id);
}

export function createTestCase(data: Omit<TestCase, "id" | "createdAt" | "updatedAt">): TestCase {
  const id = `tc_${nextTcId++}`;
  const now = new Date().toISOString();
  const tc: TestCase = {
    id, ...data,
    version: 1,
    changelog: [{ version: 1, timestamp: now, author: data.owner || "system", summary: "Test case created", changes: ["Initial creation"] }],
    createdAt: now, updatedAt: now,
  };
  testCasesStore.push(tc);
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
  if (patch.suiteIds && JSON.stringify(patch.suiteIds) !== JSON.stringify(prev.suiteIds)) changes.push("Suite membership changed");

  const now = new Date().toISOString();
  const newVersion = prev.version + 1;
  const entry: TestChangeLogEntry = {
    version: newVersion,
    timestamp: now,
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
  return testCasesStore[idx];
}

export function deleteTestCase(id: string): boolean {
  const idx = testCasesStore.findIndex(tc => tc.id === id);
  if (idx === -1) return false;
  testCasesStore.splice(idx, 1);
  testSuitesStore.forEach(s => { s.testIds = s.testIds.filter(tid => tid !== id); });
  return true;
}

export function getAllTestSuites(): TestSuite[] {
  return [...testSuitesStore];
}

export function getTestSuiteById(id: string): TestSuite | undefined {
  return testSuitesStore.find(s => s.id === id);
}

export function createTestSuite(data: Omit<TestSuite, "id" | "createdAt" | "updatedAt">): TestSuite {
  const id = `suite_${nextSuiteId++}`;
  const now = new Date().toISOString();
  const suite: TestSuite = { id, ...data, createdAt: now, updatedAt: now };
  testSuitesStore.push(suite);
  return suite;
}

export function updateTestSuite(id: string, patch: Partial<Omit<TestSuite, "id" | "createdAt">>): TestSuite | undefined {
  const idx = testSuitesStore.findIndex(s => s.id === id);
  if (idx === -1) return undefined;
  testSuitesStore[idx] = { ...testSuitesStore[idx], ...patch, updatedAt: new Date().toISOString() };
  return testSuitesStore[idx];
}

export function deleteTestSuite(id: string): boolean {
  const idx = testSuitesStore.findIndex(s => s.id === id);
  if (idx === -1) return false;
  testSuitesStore.splice(idx, 1);
  return true;
}

export function addTestsToSuite(suiteId: string, testIds: string[]): TestSuite | undefined {
  const suite = testSuitesStore.find(s => s.id === suiteId);
  if (!suite) return undefined;
  const existing = new Set(suite.testIds);
  testIds.forEach(tid => { if (!existing.has(tid)) { suite.testIds.push(tid); existing.add(tid); } });
  suite.updatedAt = new Date().toISOString();
  return suite;
}

export function removeTestsFromSuite(suiteId: string, testIds: string[]): TestSuite | undefined {
  const suite = testSuitesStore.find(s => s.id === suiteId);
  if (!suite) return undefined;
  const removeSet = new Set(testIds);
  suite.testIds = suite.testIds.filter(tid => !removeSet.has(tid));
  suite.updatedAt = new Date().toISOString();
  return suite;
}

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
      version: tc.version || 1,
      changelog: tc.changelog || [{ version: 1, timestamp: now, author: tc.owner || "import", summary: "Imported", changes: ["Imported from external source"] }],
      documentation: tc.documentation || "",
      createdAt: now, updatedAt: now,
    });
    result.imported++;
  });
  return result;
}

export function exportTestCases(format: "json" | "csv"): string {
  if (format === "csv") {
    const headers = "id,name,description,category,priority,severity,status,owner,automated,scriptPath,version,tags";
    const rows = testCasesStore.map(tc =>
      `"${tc.id}","${tc.name.replace(/"/g, '""')}","${tc.description.replace(/"/g, '""')}","${tc.category}",${tc.priority},${tc.severity},${tc.status},"${tc.owner}",${tc.automated},"${tc.scriptPath}",${tc.version},"${tc.tags.join(";")}"`
    );
    return [headers, ...rows].join("\n");
  }
  return JSON.stringify(testCasesStore.map(tc => ({
    id: tc.id, name: tc.name, description: tc.description, category: tc.category,
    priority: tc.priority, severity: tc.severity, status: tc.status,
    owner: tc.owner, tags: tc.tags, automated: tc.automated, version: tc.version,
    scriptPath: tc.scriptPath,
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
    lines.push(`        <property name="tags" value="${tc.tags.join(",")}"/>`);
    lines.push(`      </properties>`);
    lines.push(`    </testcase>`);
  });
  lines.push(`  </testsuite>`);
  lines.push(`</testsuites>`);
  return lines.join("\n");
}

export function getTestCasesBySuiteId(suiteId: string): TestCase[] {
  const suite = testSuitesStore.find(s => s.id === suiteId);
  if (!suite) return [];
  return suite.testIds.map(tid => testCasesStore.find(tc => tc.id === tid)).filter((t): t is TestCase => !!t);
}

export function buildSuiteTree(): SuiteNode[] {
  const rootSuites = testSuitesStore.filter(s => s.parentId === null);
  return rootSuites.map(s => ({ suite: s, children: [], depth: 0 }));
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

export function getTestCases(): ReturnType<typeof getAllTestCases> {
  return getAllTestCases();
}

export function getTestSuites(): ReturnType<typeof getAllTestSuites> {
  return getAllTestSuites();
}

export function getTestTags(): TestTag[] {
  return [...TEST_TAGS];
}

// ── Bulk Generation Engine ────────────────────────────────

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

    const tc: TestCase = {
      id,
      name,
      description: `Generated test: ${template.verb} ${template.field} for ${template.path} — ${template.check}. Part of ${params.category} suite.`,
      category: params.category,
      priority: params.priority,
      severity: params.priority === "P0" ? "critical" : params.priority === "P1" ? "major" : params.priority === "P2" ? "minor" : "trivial",
      status: params.status,
      tags: [params.category.replace(/[^a-z0-9]/g, "_"), ...(i % 2 === 0 ? ["automated"] : ["regression"])],
      owner: params.owner,
      suiteIds: [...params.suites],
      automated: true,
      scriptPath: `tests/generated/${params.category}/tc_${idx}.spec.ts`,
      preconditions: `- ${params.category} test environment ready\n- Mock data seeded for ${template.path}\n- EdgeGrid token valid`,
      expectedBehavior: `- Status 200 for ${template.path}\n- ${template.check}\n- Response time < 1000ms`,
      documentation: `## ${name}\n\n**Category:** ${params.category}\n\n**Endpoint:** ${template.path}\n\n### Test Steps\n1. Send ${params.category === "security" ? "malicious" : "standard"} request to ${template.path}\n2. Validate response\n3. ${template.check}\n\n### Expected\n- ${template.check}\n- Response < 1000ms\n\n**Auto-generated** — review before production use.`,
      relatedTestIds: [],
      version: 1,
      changelog: [{ version: 1, timestamp: now.toISOString(), author: params.owner, summary: "Auto-generated", changes: ["Bulk generated via test manager"] }],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    result.push(tc);
  }

  return result;
}

export function generateAndPersistTestCases(params: GenerateParams): TestCase[] {
  const generated = generateTestCases(params);
  generated.forEach(tc => {
    testCasesStore.push(tc);
    nextTcId++;
  });
  return generated;
}

// ── Analysis / Stats ──────────────────────────────────────

export function computeTestStats(): TestStats {
  const store = getAllTestCases();
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byOwner: Record<string, number> = {};
  const byTag: Record<string, number> = {};
  let automated = 0;
  let totalVersion = 0;

  store.forEach(tc => {
    byStatus[tc.status] = (byStatus[tc.status] || 0) + 1;
    byPriority[tc.priority] = (byPriority[tc.priority] || 0) + 1;
    byCategory[tc.category] = (byCategory[tc.category] || 0) + 1;
    bySeverity[tc.severity] = (bySeverity[tc.severity] || 0) + 1;
    byOwner[tc.owner] = (byOwner[tc.owner] || 0) + 1;
    tc.tags.forEach(t => { byTag[t] = (byTag[t] || 0) + 1; });
    if (tc.automated) automated++;
    totalVersion += tc.version;
  });

  return {
    total: store.length,
    byStatus,
    byPriority,
    byCategory,
    bySeverity,
    byOwner,
    byTag,
    automated,
    manual: store.length - automated,
    coverage: store.length > 0 ? Math.round((Object.keys(byCategory).length / CATEGORIES.length) * 100) : 0,
    avgVersion: store.length > 0 ? Math.round(totalVersion / store.length) : 0,
  };
}

export function getTestChangelog(testId: string): TestChangeLogEntry[] {
  const tc = testCasesStore.find(t => t.id === testId);
  return tc ? [...tc.changelog].sort((a, b) => b.version - a.version) : [];
}

export function addChangelogEntry(
  testId: string,
  summary: string,
  changes: string[],
  author: string,
): TestCase | undefined {
  const tc = testCasesStore.find(t => t.id === testId);
  if (!tc) return undefined;
  const version = tc.version + 1;
  const entry: TestChangeLogEntry = {
    version,
    timestamp: new Date().toISOString(),
    author,
    summary,
    changes,
  };
  tc.version = version;
  tc.changelog.push(entry);
  tc.updatedAt = new Date().toISOString();
  return tc;
}

export function updateTestCaseDocumentation(id: string, documentation: string, author: string): TestCase | undefined {
  const tc = testCasesStore.find(t => t.id === id);
  if (!tc) return undefined;
  const version = tc.version + 1;
  tc.documentation = documentation;
  tc.version = version;
  tc.changelog.push({
    version,
    timestamp: new Date().toISOString(),
    author,
    summary: "Documentation updated",
    changes: ["Documentation revised"],
  });
  tc.updatedAt = new Date().toISOString();
  return tc;
}

export function getTestResultsForRun(runIndex: number): TestResult[] {
  return Array.from({ length: 20 }).map((_, i) => {
    const isFail = i === 3 || i === 8 || (runIndex > 0 && i === 3 + runIndex);
    return {
      id: `test_${i}`,
      name: `Check ${i % 2 === 0 ? "Geo" : "Locale"} match for /api/v${i % 3 + 1}/data`,
      status: isFail ? "FAIL" : "PASS",
      duration: 120 + i * 15 + runIndex * 5,
      category: i % 3 === 0 ? "geo-match" : i % 2 === 0 ? "locale-split" : "url-health",
      suite: "full_suite",
    };
  });
}

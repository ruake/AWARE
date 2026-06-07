import type { TestCase, TestCaseFilter, TestChangeLogEntry, TestStats, ImportResult, GenerateParams, Predicate, FilmstripConfig } from "./types";
import { CATEGORIES, TEST_TAGS, TEST_NAMES, GENERATION_TEMPLATES, OWNERS } from "./constants";
import { LS_TC_KEY, loadFromStorage, saveToStorage, _notify, subscribeToTestCases } from "./store";
import { removeTestCaseFromAllSuites } from "./testSuites";

export { subscribeToTestCases };

const BASE_TEST_CASES: TestCase[] = Array.from({ length: 25 }).map((_, i) => {
  const tagCount = 1 + (i % 3);
  const tags = TEST_TAGS.slice(i % TEST_TAGS.length).slice(0, tagCount).map(t => t.id);
  const priority = (["P0", "P1", "P2", "P3"] as TestCase["priority"][])[i % 4];
  const cat = CATEGORIES[i % CATEGORIES.length];
  const now = `2026-0${1 + (i % 9)}-0${1 + (i % 7)}T10:00:00Z`;
  const updated = `2026-0${1 + (i % 9)}-0${1 + (i % 7)}T14:30:00Z`;
  return {
    id: `tc_${i}`,
    name: TEST_NAMES[i],
    description: `Automated test verifying ${cat} behavior for endpoint group ${i}. Ensures correct behavior across Akamai CDN edge network with configurable thresholds and alerting.`,
    category: cat,
    priority,
    severity: (priority === "P0" ? "critical" : priority === "P1" ? "major" : priority === "P2" ? "minor" : "trivial") as TestCase["severity"],
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
    testType: "web" as const,
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

let testCasesStore: TestCase[] = loadFromStorage<TestCase>(LS_TC_KEY, BASE_TEST_CASES);
let nextTcId = Math.max(testCasesStore.length, 25);

export function getTestCasesStore(): TestCase[] {
  return testCasesStore;
}

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
  removeTestCaseFromAllSuites(id);
  saveToStorage(LS_TC_KEY, testCasesStore);
  _notify();
  return testCasesStore.length < before;
}

export function resetTestCasesStore(): void {
  testCasesStore = [...BASE_TEST_CASES];
  nextTcId = Math.max(testCasesStore.length, 25);
  saveToStorage(LS_TC_KEY, testCasesStore);
  _notify();
}

export function updateTestCaseDocumentation(id: string, documentation: string, author: string): TestCase | undefined {
  return updateTestCase(id, { documentation, owner: author });
}

export function getTestChangelog(id: string): TestChangeLogEntry[] {
  const tc = testCasesStore.find(t => t.id === id);
  return tc ? [...tc.changelog].reverse() : [];
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
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<testsuites name="AWARE Tests" tests="${tests.length}">`);
  lines.push(`  <testsuite name="${"tests"}" tests="${tests.length}">`);
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
  const categoryKeys = Object.keys(CATEGORIES.reduce((a, c) => ({ ...a, [c]: 1 }), {} as Record<string, number>));
  const coveredCategories = Object.keys(byCategory).length;
  return {
    total: tcs.length, byStatus, byPriority, byCategory, bySeverity, byOwner, byTag,
    automated, manual: tcs.length - automated,
    coverage: Math.round((coveredCategories / categoryKeys.length) * 100),
    avgVersion: tcs.length > 0 ? Math.round((totalVersion / tcs.length) * 10) / 10 : 0,
  };
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

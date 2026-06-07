import type { TestCase, TestCaseFilter, TestChangeLogEntry, TestStats, ImportResult, GenerateParams } from "./types";
import { CATEGORIES, GENERATION_TEMPLATES } from "./constants";
import { LS_TC_KEY, loadFromStorage, saveToStorage, _notifyTC, subscribeToTestCases } from "./store";
import { removeTestCaseFromAllSuites } from "./operations";
import testCasesSeed from "@/data/test-cases.json";

export { subscribeToTestCases };

const BASE_TEST_CASES = testCasesSeed as unknown as TestCase[];

let testCasesStore: TestCase[] = loadFromStorage<TestCase>(LS_TC_KEY, BASE_TEST_CASES);
let nextTcId = Math.max(testCasesStore.length, ...testCasesSeed.map(t => {
  const n = parseInt((t as unknown as TestCase).id.replace("tc_", ""));
  return isNaN(n) ? 0 : n + 1;
}));

let _tcSnapshot: TestCase[] = [];
function _dropTCSnapshot() { _tcSnapshot = []; }
export function getTestCasesStore(): TestCase[] { return testCasesStore; }
export function getTestCases(): TestCase[] {
  if (_tcSnapshot.length === 0) _tcSnapshot = [...testCasesStore];
  return _tcSnapshot;
}
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
  _dropTCSnapshot(); _notifyTC();
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
  _dropTCSnapshot(); _notifyTC();
  return testCasesStore[idx];
}

export function deleteTestCase(id: string): boolean {
  const before = testCasesStore.length;
  testCasesStore = testCasesStore.filter(tc => tc.id !== id);
  removeTestCaseFromAllSuites(id);
  saveToStorage(LS_TC_KEY, testCasesStore);
  _dropTCSnapshot(); _notifyTC();
  return testCasesStore.length < before;
}

export function resetTestCasesStore(): void {
  testCasesStore = [...BASE_TEST_CASES];
  nextTcId = Math.max(testCasesStore.length, 25);
  saveToStorage(LS_TC_KEY, testCasesStore);
  _dropTCSnapshot(); _notifyTC();
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
    _dropTCSnapshot();
    _notifyTC();
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
      scriptPath: `tests/generated/${cat}/tc_${idx}.yaml`,
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
    _dropTCSnapshot();
    _notifyTC();
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

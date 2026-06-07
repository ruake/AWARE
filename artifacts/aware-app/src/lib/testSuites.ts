import type { TestCase, TestSuite, SuiteNode } from "./types";
import { LS_SUITE_KEY, loadFromStorage, saveToStorage, _notify, subscribeToTestSuites } from "./store";
import { getTestCasesStore } from "./testCases";

export { subscribeToTestSuites };

const BASE_TEST_SUITES: TestSuite[] = [
  {
    id: "suite_full", name: "Full Regression Suite",
    description: "Complete end-to-end regression covering all category groups. Runs on every production deploy.",
    parentId: null,
    testIds: ["tc_0", "tc_1", "tc_2", "tc_3", "tc_4", "tc_5", "tc_6", "tc_7", "tc_8", "tc_9", "tc_10", "tc_11", "tc_12", "tc_13", "tc_14", "tc_15", "tc_16", "tc_17", "tc_18", "tc_19", "tc_20", "tc_21"],
    config: { target: "Prod", environment: "Production", parallelism: 8, retries: 2, failFast: false, timeoutMinutes: 60 },
    tags: ["regression", "e2e"], schedule: "0 6 * * 1-5",
    createdAt: "2026-01-15T08:00:00Z", updatedAt: "2026-06-01T12:00:00Z",
  },
  {
    id: "suite_geo", name: "Geo & Locale Validation",
    description: "Tests for geographic routing, locale splitting, and multi-region behavior.",
    parentId: null,
    testIds: ["tc_0", "tc_11", "tc_3", "tc_8", "tc_9", "tc_7", "tc_2", "tc_4"],
    config: { target: "Prod", environment: "Production", parallelism: 4, retries: 1, failFast: false, timeoutMinutes: 30 },
    tags: ["geo", "locale"], schedule: "0 */4 * * *",
    createdAt: "2026-02-10T09:00:00Z", updatedAt: "2026-05-28T16:00:00Z",
  },
  {
    id: "suite_perf", name: "Performance & Caching",
    description: "Performance benchmarks, cache hit ratio validation, and compression checks.",
    parentId: null,
    testIds: ["tc_4", "tc_5", "tc_12", "tc_13", "tc_14", "tc_16"],
    config: { target: "Prod", environment: "Staging", parallelism: 6, retries: 2, failFast: true, timeoutMinutes: 45 },
    tags: ["performance"], schedule: "0 */2 * * *",
    createdAt: "2026-03-05T10:00:00Z", updatedAt: "2026-06-02T08:00:00Z",
  },
  {
    id: "suite_security", name: "Security & DDoS",
    description: "WAF rule validation, rate limiting, DDoS mitigation, and TLS negotiation tests.",
    parentId: null,
    testIds: ["tc_6", "tc_7", "tc_8", "tc_10", "tc_11"],
    config: { target: "UAT", environment: "Production", parallelism: 3, retries: 0, failFast: true, timeoutMinutes: 20 },
    tags: ["security"], schedule: null,
    createdAt: "2026-03-20T11:00:00Z", updatedAt: "2026-05-15T09:00:00Z",
  },
  {
    id: "suite_smoke", name: "Smoke Tests",
    description: "Quick health check suite for rapid deploy verification. Runs on every PR merge.",
    parentId: "suite_full",
    testIds: ["tc_0", "tc_1", "tc_2", "tc_3", "tc_4"],
    config: { target: "Prod", environment: "Production", parallelism: 2, retries: 0, failFast: true, timeoutMinutes: 10 },
    tags: ["smoke"], schedule: null,
    createdAt: "2026-04-01T07:00:00Z", updatedAt: "2026-06-05T10:00:00Z",
  },
  {
    id: "suite_uat", name: "UAT Regression",
    description: "Pre-release validation suite run against UAT staging before production promotion.",
    parentId: "suite_full",
    testIds: ["tc_0", "tc_2", "tc_4", "tc_6", "tc_8", "tc_10", "tc_12", "tc_14"],
    config: { target: "UAT", environment: "Staging", parallelism: 5, retries: 1, failFast: false, timeoutMinutes: 40 },
    tags: ["regression"], schedule: "0 22 * * 0-4",
    createdAt: "2026-04-15T12:00:00Z", updatedAt: "2026-06-03T14:00:00Z",
  },
  {
    id: "suite_edge", name: "Edge & CDN Config",
    description: "Edge-specific tests for CDN purge, redirect rules, custom error pages, and signed URLs.",
    parentId: null,
    testIds: ["tc_3", "tc_12", "tc_13", "tc_14"],
    config: { target: "Prod", environment: "Staging", parallelism: 3, retries: 1, failFast: false, timeoutMinutes: 25 },
    tags: ["e2e"], schedule: "0 0 * * 6",
    createdAt: "2026-05-01T13:00:00Z", updatedAt: "2026-06-04T11:00:00Z",
  },
  {
    id: "suite_mobile", name: "Mobile & WebSocket",
    description: "Mobile redirect, WebSocket upgrade, and responsive delivery tests.",
    parentId: null,
    testIds: ["tc_1", "tc_5", "tc_6"],
    config: { target: "Prod", environment: "Production", parallelism: 2, retries: 1, failFast: false, timeoutMinutes: 15 },
    tags: ["health", "e2e"], schedule: null,
    createdAt: "2026-05-10T15:00:00Z", updatedAt: "2026-06-05T09:00:00Z",
  },
];

let testSuitesStore: TestSuite[] = loadFromStorage<TestSuite>(LS_SUITE_KEY, BASE_TEST_SUITES);

export function resetTestSuitesStore(): void {
  testSuitesStore = [...BASE_TEST_SUITES];
}

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

export function removeTestCaseFromAllSuites(tcId: string): void {
  testSuitesStore.forEach(s => { s.testIds = s.testIds.filter(tid => tid !== tcId); });
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
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
  const store = getTestCasesStore();
  return suite.testIds.map(tid => store.find(tc => tc.id === tid)).filter((t): t is TestCase => !!t);
}

export function buildSuiteTree(): SuiteNode[] {
  const rootSuites = testSuitesStore.filter(s => s.parentId === null);
  return rootSuites.map(s => ({
    suite: s,
    children: testSuitesStore.filter(c => c.parentId === s.id).map(c => ({ suite: c, children: [], depth: 1 })),
    depth: 0,
  }));
}

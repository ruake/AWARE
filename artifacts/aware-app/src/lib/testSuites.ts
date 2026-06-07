import type { TestSuite, SuiteNode } from "./types";
import { LS_SUITE_KEY, loadFromStorage, saveToStorage, _notifyTS, subscribeToTestSuites } from "./store";
import testSuitesSeed from "@/data/test-suites.json";

export { subscribeToTestSuites };

const BASE_TEST_SUITES = testSuitesSeed as unknown as TestSuite[];

let testSuitesStore: TestSuite[] = loadFromStorage<TestSuite>(LS_SUITE_KEY, BASE_TEST_SUITES);

let _tsSnapshot: TestSuite[] = [];
function _dropTSSnapshot() { _tsSnapshot = []; }
export function getTestSuitesStore(): TestSuite[] { return testSuitesStore; }
export function setTestSuitesStore(store: TestSuite[]) { testSuitesStore = store; }

export function resetTestSuitesStore(): void {
  testSuitesStore = [...BASE_TEST_SUITES];
}

export function getTestSuites(): TestSuite[] {
  if (_tsSnapshot.length === 0) _tsSnapshot = [...testSuitesStore];
  return _tsSnapshot;
}
export function getTestSuiteById(id: string): TestSuite | undefined { return testSuitesStore.find(s => s.id === id); }

export function createTestSuite(data: Omit<TestSuite, "id" | "createdAt" | "updatedAt">): TestSuite {
  const id = `suite_${Date.now()}`;
  const now = new Date().toISOString();
  const suite: TestSuite = { id, ...data, createdAt: now, updatedAt: now };
  testSuitesStore.push(suite);
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  _dropTSSnapshot(); _notifyTS();
  return suite;
}

export function updateTestSuite(id: string, patch: Partial<Omit<TestSuite, "id" | "createdAt">>): TestSuite | undefined {
  const idx = testSuitesStore.findIndex(s => s.id === id);
  if (idx === -1) return undefined;
  testSuitesStore[idx] = { ...testSuitesStore[idx], ...patch, updatedAt: new Date().toISOString() };
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  _dropTSSnapshot(); _notifyTS();
  return testSuitesStore[idx];
}

export function removeTestCaseFromAllSuites(tcId: string): void {
  testSuitesStore.forEach(s => { s.testIds = s.testIds.filter(tid => tid !== tcId); });
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  _dropTSSnapshot(); _notifyTS();
}

export function deleteTestSuite(id: string): boolean {
  const before = testSuitesStore.length;
  testSuitesStore = testSuitesStore.filter(s => s.id !== id);
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  _dropTSSnapshot(); _notifyTS();
  return testSuitesStore.length < before;
}

export function addTestsToSuite(suiteId: string, testIds: string[]): TestSuite | undefined {
  const suite = testSuitesStore.find(s => s.id === suiteId);
  if (!suite) return undefined;
  const existing = new Set(suite.testIds);
  testIds.forEach(tid => { if (!existing.has(tid)) { suite.testIds.push(tid); existing.add(tid); } });
  suite.updatedAt = new Date().toISOString();
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  _dropTSSnapshot(); _notifyTS();
  return suite;
}

export function removeTestsFromSuite(suiteId: string, testIds: string[]): TestSuite | undefined {
  const suite = testSuitesStore.find(s => s.id === suiteId);
  if (!suite) return undefined;
  const removeSet = new Set(testIds);
  suite.testIds = suite.testIds.filter(tid => !removeSet.has(tid));
  suite.updatedAt = new Date().toISOString();
  saveToStorage(LS_SUITE_KEY, testSuitesStore);
  _dropTSSnapshot(); _notifyTS();
  return suite;
}

export function buildSuiteTree(): SuiteNode[] {
  const rootSuites = testSuitesStore.filter(s => s.parentId === null);
  return rootSuites.map(s => ({
    suite: s,
    children: testSuitesStore.filter(c => c.parentId === s.id).map(c => ({ suite: c, children: [], depth: 1 })),
    depth: 0,
  }));
}

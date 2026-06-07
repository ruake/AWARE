import type { TestCase, TestSuite } from "./types";
import { LS_SUITE_KEY, LS_TC_KEY, saveToStorage, _notifyTS } from "./store";
import { getTestCasesStore } from "./testCases";

let _testSuitesStore: TestSuite[] = [];

export function getTestSuitesStore(): TestSuite[] { return _testSuitesStore; }
export function setTestSuitesStore(store: TestSuite[]) { _testSuitesStore = store; }

export function removeTestCaseFromAllSuites(tcId: string): void {
  const store = getTestSuitesStore().map(s => ({
    ...s,
    testIds: s.testIds.filter((tid: string) => tid !== tcId),
  }));
  setTestSuitesStore(store);
  saveToStorage(LS_SUITE_KEY, store);
  _notifyTS();
}

export function getTestCasesBySuiteId(suiteId: string): TestCase[] {
  const suites = getTestSuitesStore();
  const suite = suites.find(s => s.id === suiteId);
  if (!suite) return [];
  const tcStore = getTestCasesStore();
  return suite.testIds.map((tid: string) => tcStore.find((tc: TestCase) => tc.id === tid)).filter((t): t is TestCase => !!t);
}

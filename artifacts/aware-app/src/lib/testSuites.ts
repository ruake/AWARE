import type { TestSuite, SuiteNode } from "./types";
import { subscribeToTestSuites, _notifyTS } from "./store";
import { fetchJson } from "./dataFetcher";
import { SuiteTree } from "./suiteTree";

export { subscribeToTestSuites };

let _testSuitesStore: TestSuite[] = [];
let _tsSnapshot: TestSuite[] = [];
let _suitesLoaded = false;

export async function loadTestSuites(): Promise<void> {
  if (_suitesLoaded) return;
  _suitesLoaded = true;
  _testSuitesStore = await fetchJson<TestSuite[]>("test-suites.json");
  _tsSnapshot = [..._testSuitesStore];
  _notifyTS();
}

export function getTestSuitesStore(): TestSuite[] {
  return _testSuitesStore;
}

export function getTestSuites(): TestSuite[] {
  return _tsSnapshot;
}

export function getTestSuiteById(id: string): TestSuite | undefined {
  return _testSuitesStore.find((s) => s.id === id);
}

export function buildSuiteTree(): SuiteNode[] {
  const rootSuites = _testSuitesStore.filter((s) => s.parentId === null);
  return rootSuites.map((s) => ({
    suite: s,
    children: _testSuitesStore
      .filter((c) => c.parentId === s.id)
      .map((c) => ({ suite: c, children: [], depth: 1 })),
    depth: 0,
  }));
}

export function getSuiteTree(): SuiteTree {
  return SuiteTree.from(buildSuiteTree());
}

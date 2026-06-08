import type { TestSuite, SuiteNode } from "./types";
import { subscribeToTestSuites } from "./store";
import testSuitesSeed from "@/data/test-suites.json";

export { subscribeToTestSuites };

const BASE_TEST_SUITES = testSuitesSeed as unknown as TestSuite[];

let testSuitesStore: TestSuite[] = [...BASE_TEST_SUITES];

export function getTestSuitesStore(): TestSuite[] { return testSuitesStore; }

export function getTestSuites(): TestSuite[] {
  return [...testSuitesStore];
}

export function getTestSuiteById(id: string): TestSuite | undefined {
  return testSuitesStore.find(s => s.id === id);
}

export function buildSuiteTree(): SuiteNode[] {
  const rootSuites = testSuitesStore.filter(s => s.parentId === null);
  return rootSuites.map(s => ({
    suite: s,
    children: testSuitesStore.filter(c => c.parentId === s.id).map(c => ({ suite: c, children: [], depth: 1 })),
    depth: 0,
  }));
}

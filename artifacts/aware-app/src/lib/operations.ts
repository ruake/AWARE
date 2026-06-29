import type { TestCase } from "./types";
import { getTestSuitesStore } from "./testSuites";
import { getTestCasesStore } from "./testCases";

export function getTestCasesBySuiteId(suiteId: string): TestCase[] {
  const suites = getTestSuitesStore();
  const suite = suites.find((s) => s.id === suiteId);
  if (!suite) return [];
  const tcStore = getTestCasesStore();
  const tcMap = new Map(tcStore.map((tc: TestCase) => [tc.id, tc]));
  return suite.testIds.map((tid: string) => tcMap.get(tid)).filter((t): t is TestCase => !!t);
}

import type { TestCase, TestCaseFilter, TestChangeLogEntry, TestStats } from "./types";
import { CATEGORIES } from "./constants";
import { subscribeToTestCases } from "./store";
import { getAutoDiscoveredTests } from "./testDiscovery";

export { subscribeToTestCases };

const testCasesStore: TestCase[] = [...getAutoDiscoveredTests()];

let _tcSnapshot: TestCase[] = [];
function _dropTCSnapshot() {
  _tcSnapshot = [];
}
export function getTestCasesStore(): TestCase[] {
  return testCasesStore;
}
export function getTestCases(): TestCase[] {
  if (_tcSnapshot.length === 0) _tcSnapshot = [...testCasesStore];
  return _tcSnapshot;
}
export function getTestCaseById(id: string): TestCase | undefined {
  return testCasesStore.find((tc) => tc.id === id);
}

export function getTestChangelog(id: string): TestChangeLogEntry[] {
  const tc = testCasesStore.find((t) => t.id === id);
  return tc ? [...tc.changelog].reverse() : [];
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
  tcs.forEach((tc) => {
    byStatus[tc.status] = (byStatus[tc.status] || 0) + 1;
    byPriority[tc.priority] = (byPriority[tc.priority] || 0) + 1;
    byCategory[tc.category] = (byCategory[tc.category] || 0) + 1;
    bySeverity[tc.severity] = (bySeverity[tc.severity] || 0) + 1;
    byOwner[tc.owner] = (byOwner[tc.owner] || 0) + 1;
    tc.tags.forEach((t) => {
      byTag[t] = (byTag[t] || 0) + 1;
    });
    if (tc.automated) automated++;
    totalVersion += tc.version;
  });
  const categoryKeys = Object.keys(
    CATEGORIES.reduce((a, c) => ({ ...a, [c]: 1 }), {} as Record<string, number>),
  );
  const coveredCategories = Object.keys(byCategory).length;
  return {
    total: tcs.length,
    byStatus,
    byPriority,
    byCategory,
    bySeverity,
    byOwner,
    byTag,
    automated,
    manual: tcs.length - automated,
    coverage: Math.round((coveredCategories / categoryKeys.length) * 100),
    avgVersion: tcs.length > 0 ? Math.round((totalVersion / tcs.length) * 10) / 10 : 0,
  };
}

export function getTestCasesByFilter(filter: TestCaseFilter): TestCase[] {
  return testCasesStore.filter((tc) => {
    if (
      filter.search &&
      !tc.name.toLowerCase().includes(filter.search.toLowerCase()) &&
      !tc.description.toLowerCase().includes(filter.search.toLowerCase())
    )
      return false;
    if (filter.status && tc.status !== filter.status) return false;
    if (filter.priority && tc.priority !== filter.priority) return false;
    if (filter.category && tc.category !== filter.category) return false;
    if (filter.tags.length > 0 && !filter.tags.some((t) => tc.tags.includes(t))) return false;
    if (filter.suiteId && !tc.suiteIds.includes(filter.suiteId)) return false;
    return true;
  });
}

import type { TestCase, TestCaseFilter, TestStats, ChangeLogEntry } from '@/lib/types';
import { getAutoDiscoveredTests, loadTestDiscovery } from '@/lib/testDiscovery';
import { subscribeToTestCases, _notifyTC } from '@/lib/store';

let _loaded = false;

export async function loadTestCases(): Promise<void> {
  if (_loaded) return;
  await loadTestDiscovery().catch(() => {});
  _loaded = true;
  _notifyTC();
}

export function getTestCases(): Record<string, TestCase> {
  return getAutoDiscoveredTests();
}

export function subscribeToTestCasesStore(cb: () => void): () => void {
  return subscribeToTestCases(cb);
}

export function getTestCasesByFilter(filter: TestCaseFilter): TestCase[] {
  const all = Object.values(getAutoDiscoveredTests());
  return all.filter(tc => {
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const nameMatch = tc.name?.toLowerCase().includes(q) ?? false;
      const descMatch = (tc.description ?? '').toLowerCase().includes(q);
      if (!nameMatch && !descMatch) return false;
    }
    if (filter.status && tc.status !== filter.status) return false;
    if (filter.priority && tc.priority !== filter.priority) return false;
    if (filter.category && tc.category !== filter.category) return false;
    if (filter.tags.length > 0) {
      const tcTags = tc.tags ?? [];
      if (!filter.tags.some(t => tcTags.includes(t))) return false;
    }
    if (filter.suiteId) {
      const tcSuiteIds = tc.suiteIds ?? [];
      if (!tcSuiteIds.includes(filter.suiteId)) return false;
    }
    return true;
  });
}

export function getTestCaseById(id: string): TestCase | undefined {
  return getAutoDiscoveredTests()[id];
}

export function getTestChangelog(id: string): ChangeLogEntry[] {
  const tc = getTestCaseById(id);
  if (!tc?.changelog) return [];
  return [...tc.changelog].reverse();
}

export function computeTestStats(): TestStats {
  const all = Object.values(getAutoDiscoveredTests());
  const total = all.length;

  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let automated = 0;
  let manual = 0;
  let versionSum = 0;

  for (const tc of all) {
    byStatus[tc.status ?? 'unknown'] = (byStatus[tc.status ?? 'unknown'] ?? 0) + 1;
    byPriority[tc.priority ?? 'none'] = (byPriority[tc.priority ?? 'none'] ?? 0) + 1;
    byCategory[tc.category ?? 'Uncategorized'] = (byCategory[tc.category ?? 'Uncategorized'] ?? 0) + 1;
    if (tc.automated) automated++;
    else manual++;
    versionSum += tc.version ?? 0;
  }

  const categories = new Set(all.map(tc => tc.category).filter(Boolean));
  const coverage = categories.size > 0 ? Math.min(100, (categories.size / 5) * 100) : 0;

  return {
    total,
    byStatus,
    byPriority,
    byCategory,
    automated,
    manual,
    avgVersion: total > 0 ? versionSum / total : 0,
    coverage,
  };
}

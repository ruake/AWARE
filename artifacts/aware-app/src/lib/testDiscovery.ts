import type { TestCase } from "./types";
import autoTestsSeed from "@/data/auto-tests.json";

const BASE_AUTO_TESTS = autoTestsSeed as unknown as TestCase[];

let _autoSnapshot: TestCase[] = [];

export function getAutoDiscoveredTests(): TestCase[] {
  if (_autoSnapshot.length === 0) _autoSnapshot = [...BASE_AUTO_TESTS];
  return _autoSnapshot;
}

export function getAutoDiscoverySummary() {
  const tests = getAutoDiscoveredTests();
  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  tests.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
  });
  const sources = new Set(
    tests.map((t) => {
      const m = t.scriptPath.match(/^(.*?)(?:::)/);
      return m ? m[1] : t.scriptPath;
    }),
  );
  return {
    total: tests.length,
    byCategory,
    byPriority,
    sourceFiles: sources.size,
    lastUpdated: BASE_AUTO_TESTS.length > 0 ? BASE_AUTO_TESTS[0].updatedAt : null,
  };
}

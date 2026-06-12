import type { TestCase } from "./types";
import { fetchJson } from "./dataFetcher";

let _autoTests: TestCase[] = [];
let _testsLoaded = false;

export async function loadAutoDiscoveredTests(): Promise<void> {
  if (_testsLoaded) return;
  _testsLoaded = true;
  _autoTests = await fetchJson<TestCase[]>("auto-tests.json");
}

export function getAutoDiscoveredTests(): TestCase[] {
  return _autoTests;
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
    lastUpdated: _autoTests.length > 0 ? _autoTests[0].updatedAt : null,
  };
}

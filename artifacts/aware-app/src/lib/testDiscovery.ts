import type { TestCase } from "./types";
import { fetchJson } from "./dataFetcher";
import { _notifyTC, subscribeToTestCases } from "./store";

export { subscribeToTestCases as subscribeToAutoTests };

let _autoTests: TestCase[] = [];
let _testsLoaded = false;

export async function loadAutoDiscoveredTests(): Promise<void> {
  if (_testsLoaded) return;
  _testsLoaded = true;
  try {
    _autoTests = await fetchJson<TestCase[]>("auto-tests.json");
    _notifyTC();
  } catch (err) {
    console.warn("[AWARE] auto-tests.json unavailable — using empty list.", err);
  }
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

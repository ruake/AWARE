import type { Run, TestResult, TestCase, TestSuite } from "@/lib/types";
import { fetchJson } from "@/lib/dataFetcher";
import { getTestSuites as _getTestSuites } from "@/lib/testSuites";
import { getAutoDiscoveredTests } from "@/lib/testDiscovery";
import { subscribeToTestCases, subscribeToTestSuites } from "@/lib/store";

let runsCache: Run[] | null = null;
let resultsCache: Record<string, TestResult[]> | null = null;

export const RUNS: Run[] = [];

// --- _snapshot caching for stable useSyncExternalStore refs ---
let _testSuitesSnapshot: TestSuite[] = [];
let _testCasesSnapshot: TestCase[] = [];

subscribeToTestSuites(() => {
  _testSuitesSnapshot = [..._getTestSuites()];
});

subscribeToTestCases(() => {
  _testCasesSnapshot = Object.values(getAutoDiscoveredTests());
});

export async function loadRuns(): Promise<Run[]> {
  if (runsCache) return runsCache;
  runsCache = await fetchJson<Run[]>("runs.json");
  RUNS.length = 0;
  RUNS.push(...runsCache);
  return runsCache;
}

export async function loadResults(runId: string): Promise<TestResult[]> {
  const all = await loadAllResults();
  return all[runId] ?? [];
}

export async function loadAllResults(): Promise<Record<string, TestResult[]>> {
  if (resultsCache) return resultsCache;
  try {
    resultsCache = await fetchJson<Record<string, TestResult[]>>("test-results.json");
  } catch {
    resultsCache = {};
  }
  return resultsCache;
}

let testCasesCache: Record<string, TestCase> | null = null;

export async function loadTestCases(): Promise<Record<string, TestCase>> {
  if (testCasesCache) return testCasesCache;
  const existing = getAutoDiscoveredTests();
  if (Object.keys(existing).length > 0) {
    testCasesCache = existing;
    _testCasesSnapshot = Object.values(existing);
    return testCasesCache;
  }
  testCasesCache = await fetchJson<Record<string, TestCase>>("auto-tests.json");
  _testCasesSnapshot = Object.values(testCasesCache);
  return testCasesCache;
}

export function getTestCaseById(id: string): TestCase | undefined {
  if (testCasesCache) return testCasesCache[id];
  return getAutoDiscoveredTests()[id];
}

export function getTestSuites(): TestSuite[] {
  return _testSuitesSnapshot;
}

export function getTestCases(): TestCase[] {
  return _testCasesSnapshot;
}

export function resetDataCaches(): void {
  runsCache = null;
  resultsCache = null;
  testCasesCache = null;
  RUNS.length = 0;
  _testSuitesSnapshot = [];
  _testCasesSnapshot = [];
}

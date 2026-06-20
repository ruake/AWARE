import type { TestResult, TestDetail } from "./types";
import { computeTestDetailForName } from "./runs";
import { fetchJson } from "./dataFetcher";

const _resultsByRun = new Map<string, TestResult[]>();
let _allResultsLoaded = false;
let _allResultsLoading: Promise<void> | null = null;

async function ensureAllResultsLoaded(): Promise<void> {
  if (_allResultsLoaded) return;
  if (_allResultsLoading) return _allResultsLoading;
  _allResultsLoading = fetchJson<Record<string, TestResult[]>>("test-results.json")
    .then((dict) => {
      for (const [runId, results] of Object.entries(dict)) {
        _resultsByRun.set(runId, results);
      }
      _allResultsLoaded = true;
    })
    .catch(() => {
      _allResultsLoading = null;
      _allResultsLoaded = false;
    });
  return _allResultsLoading;
}

export function getCachedResults(runId: string): TestResult[] {
  return _resultsByRun.get(runId) ?? [];
}

export async function loadResultsForRun(runId: string): Promise<TestResult[]> {
  await ensureAllResultsLoaded();
  return _resultsByRun.get(runId) ?? [];
}

export async function loadAllResults(): Promise<void> {
  await ensureAllResultsLoaded();
}

let detailCache: TestDetail[] | null = null;

function rebuildDetailCache(): TestDetail[] {
  const allNames = new Set<string>();
  for (const results of _resultsByRun.values()) {
    for (const r of results) allNames.add(r.name);
  }
  return [...allNames].map((name) => computeTestDetailForName(name));
}

export async function getTestDetailsAsync(): Promise<TestDetail[]> {
  if (detailCache) return detailCache;
  await ensureAllResultsLoaded();
  detailCache = rebuildDetailCache();
  return detailCache;
}

export function getTestDetailsSync(): TestDetail[] {
  if (detailCache) return detailCache;
  if (_allResultsLoaded) {
    detailCache = rebuildDetailCache();
    return detailCache;
  }
  return [];
}

export function isAllLoaded(): boolean {
  return _allResultsLoaded;
}

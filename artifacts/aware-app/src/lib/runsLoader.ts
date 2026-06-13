import type { TestResult, TestDetail, TestRunPoint } from "./types";
import { RUNS } from "./runs";
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
    .catch((err) => {
      _allResultsLoading = null;
      throw err;
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

function computeTestDetailsFromCache(): TestDetail[] {
  const allNames = new Set<string>();
  for (const results of _resultsByRun.values()) {
    for (const r of results) allNames.add(r.name);
  }

  return [...allNames].map((name) => {
    const history: TestRunPoint[] = [];
    for (const run of RUNS) {
      const results = getCachedResults(run.id);
      const match = results.find((r) => r.name === name);
      if (match) {
        history.push({
          runId: run.id,
          status: match.status === "PASS" ? "PASS" : "FAIL",
          duration: match.duration,
          env: run.env,
        });
      }
    }
    history.sort((a, b) => {
      const ra = RUNS.find((r) => r.id === a.runId);
      const rb = RUNS.find((r) => r.id === b.runId);
      return new Date(ra?.started ?? 0).getTime() - new Date(rb?.started ?? 0).getTime();
    });
    const passCount = history.filter((h) => h.status === "PASS").length;
    const passRate = history.length > 0 ? Math.round((passCount / history.length) * 100) : 0;
    let flips = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i].status !== history[i - 1].status) flips++;
    }
    const flakinessScore =
      history.length > 1 ? Math.round((flips / (history.length - 1)) * 100) : 0;
    const avgDuration =
      history.length > 0
        ? Math.round(history.reduce((s, h) => s + h.duration, 0) / history.length)
        : 0;
    return { history, passRate, flakinessScore, avgDuration };
  });
}

export async function getTestDetailsAsync(): Promise<TestDetail[]> {
  if (detailCache) return detailCache;
  await ensureAllResultsLoaded();
  detailCache = computeTestDetailsFromCache();
  return detailCache;
}

export function getTestDetailsSync(): TestDetail[] {
  if (detailCache) return detailCache;
  if (_allResultsLoaded) {
    detailCache = computeTestDetailsFromCache();
    return detailCache;
  }
  return [];
}

export function isAllLoaded(): boolean {
  return _allResultsLoaded;
}

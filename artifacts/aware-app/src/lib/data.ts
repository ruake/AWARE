import type { Run, TestResult } from '@/lib/types';

let runsCache: Run[] | null = null;
let resultsCache: Record<string, TestResult[]> | null = null;

export async function loadRuns(): Promise<Run[]> {
  if (runsCache) return runsCache;
  const res = await fetch(`${import.meta.env.BASE_URL}data/runs.json`);
  runsCache = await res.json();
  return runsCache!;
}

export async function loadResults(runId: string): Promise<TestResult[]> {
  const all = await loadAllResults();
  return all[runId] ?? [];
}

export async function loadAllResults(): Promise<Record<string, TestResult[]>> {
  if (resultsCache) return resultsCache;
  const res = await fetch(`${import.meta.env.BASE_URL}data/test-results.json`);
  resultsCache = await res.json();
  return resultsCache!;
}

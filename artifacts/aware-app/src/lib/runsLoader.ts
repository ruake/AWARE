/**
 * runsLoader.ts — Loads test results from the monolithic test-results.json
 * keyed by runId: { "run_foo": [...TestResult], "run_bar": [...TestResult] }
 */
import { fetchJson } from "./dataFetcher";
import type { TestResult, TestDetail, TestRunPoint } from "./types";

const _cache = new Map<string, TestResult[]>();
let _bulkLoaded = false;

export function getCachedResults(runId: string): TestResult[] {
  return _cache.get(runId) ?? [];
}

export async function loadResultsForRun(runId: string): Promise<TestResult[]> {
  if (_cache.has(runId)) return _cache.get(runId)!;
  if (!_bulkLoaded) {
    await loadAllResults();
  }
  return _cache.get(runId) ?? [];
}

export async function loadAllResults(): Promise<void> {
  if (_bulkLoaded) return;
  _bulkLoaded = true;
  try {
    const data = await fetchJson<Record<string, TestResult[]>>("test-results.json");
    if (data && typeof data === "object" && !Array.isArray(data)) {
      for (const [runId, results] of Object.entries(data)) {
        if (Array.isArray(results)) {
          _cache.set(runId, results);
        }
      }
    }
  } catch (err) {
    _bulkLoaded = false;
    throw new Error(`Failed to load test results data: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Compute aggregated TestDetail[] across all loaded runs.
 * The `runId` param is ignored when passed as "" — it returns ALL test details.
 * When a specific runId is given, it returns results for just that run.
 */
export async function getTestDetailsAsync(runId: string): Promise<TestResult[] | TestDetail[]> {
  // If a specific run is requested, return its results
  if (runId && runId !== "") {
    return loadResultsForRun(runId);
  }

  // Otherwise load everything and compute per-test aggregated details
  await loadAllResults();

  // Collect all results across all runs
  const allResults: TestResult[] = [];
  for (const results of _cache.values()) {
    allResults.push(...results);
  }

  if (allResults.length === 0) return [];

  // Group by test name
  const byName = new Map<string, TestResult[]>();
  for (const r of allResults) {
    const key = r.name;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(r);
  }

  // Build TestDetail for each unique test
  const details: TestDetail[] = [];
  for (const [name, results] of byName.entries()) {
    const history: TestRunPoint[] = results.map((r) => ({
      runId: r.runId,
      status: r.status === "PASS" ? "PASS" : "FAIL",
      duration: r.duration,
      env: r.runId.split("_")[1] ?? "unknown",
    }));

    const passCount = history.filter((h) => h.status === "PASS").length;
    const passRate = history.length > 0 ? Math.round((passCount / history.length) * 100) : 0;

    let flips = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i].status !== history[i - 1].status) flips++;
    }
    const flakinessScore =
      history.length > 1 ? Math.round((flips / (history.length - 1)) * 100) : 0;

    const durations = results.map((r) => r.duration);
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    details.push({
      name,
      history,
      passRate,
      flakinessScore,
      avgDuration,
    } as TestDetail & { name: string; avgDuration: number });
  }

  return details;
}

export function getTestDetailsSync(runId: string): TestResult[] {
  return getCachedResults(runId);
}

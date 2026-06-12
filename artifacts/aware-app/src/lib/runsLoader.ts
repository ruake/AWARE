import type { TestResult, TestDetail, TestRunPoint } from "./types";
import { RUNS, DIFF_ROWS } from "./runs";

const cache = new Map<string, TestResult[]>();
const inflight = new Map<string, Promise<TestResult[]>>();

function dataUrl(runId: string): string {
  const b = import.meta.env.BASE_URL;
  return `${b}data/test-results/${runId}.json`;
}

export function getCachedResults(runId: string): TestResult[] {
  return cache.get(runId) ?? [];
}

export async function loadResultsForRun(runId: string): Promise<TestResult[]> {
  const existing = cache.get(runId);
  if (existing) return existing;

  const pending = inflight.get(runId);
  if (pending) return pending;

  const p = fetch(dataUrl(runId))
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load results for ${runId}: ${r.status}`);
      return r.json() as Promise<TestResult[]>;
    })
    .then((data) => {
      cache.set(runId, data);
      inflight.delete(runId);
      return data;
    })
    .catch((err) => {
      inflight.delete(runId);
      throw err;
    });

  inflight.set(runId, p);
  return p;
}

let allLoaded = false;
let allLoading: Promise<void> | null = null;

export async function loadAllResults(): Promise<void> {
  if (allLoaded) return;
  if (allLoading) return allLoading;
  allLoading = Promise.all(RUNS.map((r) => loadResultsForRun(r.id))).then(() => {
    allLoaded = true;
  });
  return allLoading;
}

let detailCache: TestDetail[] | null = null;

function computeTestDetailsFromCache(): TestDetail[] {
  return DIFF_ROWS.map((diff) => {
    const history: TestRunPoint[] = [];
    const diffSuffix = diff.id.replace("diff_", "");
    for (const run of RUNS) {
      const results = getCachedResults(run.id);
      const match = results.find((r) => {
        if (r.id === diffSuffix) return true;
        if (r.id === diffSuffix.replace(/^0+/, "")) return true;
        const rn = r.name.toLowerCase();
        const dn = diff.name.toLowerCase().replace(/_/g, " ");
        return rn === dn || rn.includes(dn) || dn.includes(rn);
      });
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
  await loadAllResults();
  detailCache = computeTestDetailsFromCache();
  return detailCache;
}

export function getTestDetailsSync(): TestDetail[] {
  if (detailCache) return detailCache;
  if (allLoaded) {
    detailCache = computeTestDetailsFromCache();
    return detailCache;
  }
  return [];
}

export function isAllLoaded(): boolean {
  return allLoaded;
}

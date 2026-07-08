import type { Run, TestResult, DiffRow } from "@/lib/types";
import type { Env } from "@/lib/types";
import { fetchJson } from "@/lib/dataFetcher";

const _resultsCache = new Map<string, TestResult[]>();

function getCachedResults(runId: string): TestResult[] {
  return _resultsCache.get(runId) ?? [];
}

export function setCachedResults(runId: string, results: TestResult[]): void {
  _resultsCache.set(runId, results);
}

export function clearResultsCache(): void {
  _resultsCache.clear();
}

export const RUNS: Run[] = [];

let _resultsLoaded = false;

export async function loadAllTestResults(): Promise<void> {
  if (_resultsLoaded) return;
  const all = await fetchJson<Record<string, TestResult[]>>("test-results.json");
  for (const [runId, results] of Object.entries(all)) {
    _resultsCache.set(runId, results);
  }
  _resultsLoaded = true;
}

export function areResultsLoaded(): boolean {
  return _resultsLoaded;
}

export async function loadRuns(): Promise<void> {
  if (RUNS.length > 0) return;
  const [runsData] = await Promise.all([fetchJson<Run[]>("runs.json"), loadAllTestResults()]);
  RUNS.length = 0;
  RUNS.push(...runsData);
  _snapshot = computeSnapshot();
}

export function getRunsByEnv(envIds?: string[]): Run[] {
  if (!envIds || envIds.length === 0) return [...RUNS];
  return RUNS.filter((r) => envIds.includes(r.envId));
}

export function getRunById(id: string): Run | undefined {
  return RUNS.find((r) => r.id === id);
}

export function getTestResultsForRun(runId: string): TestResult[] {
  return getCachedResults(runId);
}

export function computeDiffRows(baseRunId: string, candRunId: string): DiffRow[] {
  const baseResults = getCachedResults(baseRunId);
  const candResults = getCachedResults(candRunId);

  const byName = new Map<string, { base?: TestResult; cand?: TestResult }>();

  for (const r of baseResults) {
    if (!byName.has(r.name)) byName.set(r.name, {});
    byName.get(r.name)!.base = r;
  }
  for (const r of candResults) {
    if (!byName.has(r.name)) byName.set(r.name, {});
    byName.get(r.name)!.cand = r;
  }

  const rows: DiffRow[] = [];
  for (const [name, pair] of byName) {
    const base = pair.base;
    const cand = pair.cand;

    const baseStatus = base?.status ?? "FAIL";
    const candStatus = cand?.status ?? "FAIL";
    const baseDur = base?.duration ?? 0;
    const candDur = cand?.duration ?? 0;

    let state: DiffRow["state"] = "unchanged";
    if (baseStatus === "PASS" && candStatus === "FAIL") {
      state = "regression";
    } else if (baseStatus === "FAIL" && candStatus === "PASS") {
      state = "fixed";
    } else if (base && cand && Math.abs(candDur - baseDur) / Math.max(baseDur, 1) > 0.5) {
      state = "duration";
    }

    rows.push({
      id: base?.id ?? cand?.id ?? name,
      name,
      baseStatus,
      candStatus,
      durBase: baseDur,
      durCand: candDur,
      category: base?.category ?? cand?.category ?? "",
      state,
      baseResult: base,
      candResult: cand,
    });
  }

  return rows;
}

export interface PassRatePoint {
  date: string;
  passRate: number;
  label: string;
  runId: string;
}

export interface EnvSummary {
  env: Env;
  total: number;
  passed: number;
  failed: number;
  passRate: number;
}

export interface TestDetail {
  testId: string;
  name: string;
  runCount: number;
  passCount: number;
  failCount: number;
  passRate: number;
  flakiness: number;
  avgDuration: number;
  category: string;
  lastRun: string;
}

export interface RunFrequency {
  daily: number;
  weekly: number;
}

interface Snapshot {
  ENV_SUMMARY: EnvSummary[];
  PASS_RATE_CHART: PassRatePoint[];
  ENV_PASS_RATE_CHART: Record<string, PassRatePoint[]>;
  PER_ENV_PASS_RATE: Record<string, number>;
  TEST_DETAILS: TestDetail[];
}

let _snapshot: Snapshot | null = null;

function downsamplePoints<T>(points: T[], maxPoints: number): T[] {
  if (points.length <= maxPoints) return points;
  const step = points.length / maxPoints;
  const result: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(Math.floor(i * step), points.length - 1);
    result.push(points[idx]);
  }
  return result;
}

function computeSnapshot(): Snapshot {
  // Precompute timestamps to avoid repeated Date() calls in sort comparator
  const withTime = RUNS.map((r) => ({ run: r, time: new Date(r.started).getTime() }));
  withTime.sort((a, b) => a.time - b.time);

  // Single pass over all runs to build all aggregates
  const envStats = new Map<
    string,
    { total: number; passed: number; failed: number; passPctSum: number }
  >();
  const envChartData = new Map<string, PassRatePoint[]>();
  const testMap = new Map<
    string,
    { statuses: string[]; durations: number[]; category: string; lastRun: string; name: string }
  >();

  for (const { run } of withTime) {
    let stat = envStats.get(run.env);
    if (!stat) {
      stat = { total: 0, passed: 0, failed: 0, passPctSum: 0 };
      envStats.set(run.env, stat);
    }
    stat.total++;
    stat.passPctSum += run.passPct;
    if (run.status === "PASS") stat.passed++;
    else if (run.status === "FAIL") stat.failed++;

    let points = envChartData.get(run.env);
    if (!points) {
      points = [];
      envChartData.set(run.env, points);
    }
    points.push({
      date: run.started,
      passRate: run.passPct,
      label: run.label,
      runId: run.id,
    });

    const results = getCachedResults(run.id);
    for (const tr of results) {
      let entry = testMap.get(tr.testCaseId);
      if (!entry) {
        entry = { statuses: [], durations: [], category: tr.category, lastRun: "", name: tr.name };
        testMap.set(tr.testCaseId, entry);
      }
      entry.statuses.push(tr.status);
      entry.durations.push(tr.duration);
      if (!entry.lastRun || run.started > entry.lastRun) entry.lastRun = run.started;
    }
  }

  const ENV_SUMMARY: EnvSummary[] = [];
  const PER_ENV_PASS_RATE: Record<string, number> = {};
  for (const [env, stat] of envStats) {
    ENV_SUMMARY.push({
      env: env as Env,
      total: stat.total,
      passed: stat.passed,
      failed: stat.failed,
      passRate: stat.total > 0 ? (stat.passed / stat.total) * 100 : 0,
    });
    PER_ENV_PASS_RATE[env] = stat.total > 0 ? stat.passPctSum / stat.total : 0;
  }

  const PASS_RATE_CHART: PassRatePoint[] = withTime.map(({ run }) => ({
    date: run.started,
    passRate: run.passPct,
    label: run.label,
    runId: run.id,
  }));

  const ENV_PASS_RATE_CHART: Record<string, PassRatePoint[]> = {};
  for (const [env, points] of envChartData) {
    ENV_PASS_RATE_CHART[env] = downsamplePoints(points, 365);
  }

  const TEST_DETAILS: TestDetail[] = [];
  for (const [testId, entry] of testMap) {
    const total = entry.statuses.length;
    let passCount = 0;
    for (const s of entry.statuses) {
      if (s === "PASS") passCount++;
    }
    const failCount = total - passCount;
    const transitions = total - 1;
    let flips = 0;
    for (let i = 1; i < total; i++) {
      if (entry.statuses[i] !== entry.statuses[i - 1]) flips++;
    }
    const flakiness = transitions > 0 ? (flips / transitions) * 100 : 0;
    const avgDuration = total > 0 ? entry.durations.reduce((s, d) => s + d, 0) / total : 0;

    TEST_DETAILS.push({
      testId,
      name: entry.name,
      runCount: total,
      passCount,
      failCount,
      passRate: total > 0 ? (passCount / total) * 100 : 0,
      flakiness,
      avgDuration,
      category: entry.category,
      lastRun: entry.lastRun,
    });
  }

  return { ENV_SUMMARY, PASS_RATE_CHART, ENV_PASS_RATE_CHART, PER_ENV_PASS_RATE, TEST_DETAILS };
}

export function getSnapshot(): Snapshot | null {
  return _snapshot;
}

export async function loadRunsWithResults(): Promise<void> {
  await Promise.all([loadRuns(), loadAllTestResults()]);
  _snapshot = computeSnapshot();
}

export const ENV_SUMMARY = (): EnvSummary[] => _snapshot?.ENV_SUMMARY ?? [];
export const PASS_RATE_CHART = (): PassRatePoint[] => _snapshot?.PASS_RATE_CHART ?? [];
export const ENV_PASS_RATE_CHART = (): Record<string, PassRatePoint[]> =>
  _snapshot?.ENV_PASS_RATE_CHART ?? {};
export const PER_ENV_PASS_RATE = (): Record<string, number> => _snapshot?.PER_ENV_PASS_RATE ?? {};
export const TEST_DETAILS = (): TestDetail[] => _snapshot?.TEST_DETAILS ?? [];

export function computeRunFrequency(runs: Run[]): RunFrequency {
  if (runs.length === 0) return { daily: 0, weekly: 0 };

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const WEEK_MS = 7 * DAY_MS;

  let daily = 0;
  let weekly = 0;

  for (let i = 0; i < runs.length; i++) {
    const age = now - new Date(runs[i].started).getTime();
    if (age <= DAY_MS) daily++;
    if (age <= WEEK_MS) weekly++;
  }

  return { daily, weekly };
}

export function computeTestDetails(): TestDetail[] {
  return _snapshot?.TEST_DETAILS ?? [];
}

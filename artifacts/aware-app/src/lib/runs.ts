import type { Run, TestResult, TestDetail, TestRunPoint, DiffRow } from "./types";
import { fetchJson } from "./dataFetcher";
import { getCachedResults } from "./runsLoader";

// ── Runs store (pub/sub) ─────────────────────────────────────────────
const _runs: Run[] = [];
let _runsSnapshot: Run[] = [];
const _runsListeners = new Set<() => void>();

function notifyRuns(): void {
  _runsListeners.forEach((cb) => cb());
}

function updateRunsSnapshot(): void {
  _runsSnapshot = [..._runs];
}

export function getRuns(): Run[] {
  return _runsSnapshot;
}

export function subscribeToRuns(cb: () => void): () => void {
  _runsListeners.add(cb);
  return () => _runsListeners.delete(cb);
}

// Backward-compat: direct access to the raw array (consumers that don't need reactivity)
export const RUNS: readonly Run[] = _runs;

// ── DIFF_ROWS store ──────────────────────────────────────────────────
const _diffRows: DiffRow[] = [];
let _diffRowsSnapshot: DiffRow[] = [];
const _diffRowsListeners = new Set<() => void>();

function notifyDiffRows(): void {
  _diffRowsListeners.forEach((cb) => cb());
}

function updateDiffRowsSnapshot(): void {
  _diffRowsSnapshot = [..._diffRows];
}

export function getDiffRows(): DiffRow[] {
  return _diffRowsSnapshot;
}

export function subscribeToDiffRows(cb: () => void): () => void {
  _diffRowsListeners.add(cb);
  return () => _diffRowsListeners.delete(cb);
}

// Backward-compat
export const DIFF_ROWS: readonly DiffRow[] = _diffRows;

let _runsLoaded = false;
export async function loadRuns(): Promise<void> {
  if (_runsLoaded) return;
  _runsLoaded = true;
  const data = await fetchJson<Run[]>("runs.json");
  _runs.length = 0;
  _runs.push(...data);
  updateRunsSnapshot();
}

export function getRunIndex(runId: string): number {
  return RUNS.findIndex((r) => r.id === runId);
}

export function getRunById(id: string): Run | undefined {
  return RUNS.find((r) => r.id === id);
}

// ── Dynamic diff computation ───────────────────────────────────────────────
// Computes a DiffRow array from two runs' test results.
// Used by the Compare page and as the default DIFF_ROWS source.
export function computeDiffRows(baseRunId: string, candRunId: string): DiffRow[] {
  const baseResults = getCachedResults(baseRunId);
  const candResults = getCachedResults(candRunId);
  if (baseResults.length === 0 && candResults.length === 0) return [];

  const baseMap = new Map<string, TestResult>(baseResults.map((r) => [r.name, r]));
  const candMap = new Map<string, TestResult>(candResults.map((r) => [r.name, r]));
  const allNames = new Set([...baseMap.keys(), ...candMap.keys()]);

  return [...allNames].map((name, i) => {
    const base = baseMap.get(name);
    const cand = candMap.get(name);
    const baseStatus: "PASS" | "FAIL" = base?.status === "PASS" ? "PASS" : "FAIL";
    const candStatus: "PASS" | "FAIL" = cand?.status === "PASS" ? "PASS" : "FAIL";
    const durBase = base?.duration ?? 0;
    const durCand = cand?.duration ?? 0;
    const durDiff = durBase > 0 ? Math.abs(durCand - durBase) / durBase : 0;

    let state: DiffRow["state"];
    if (baseStatus === "PASS" && candStatus === "FAIL") state = "regression";
    else if (baseStatus === "FAIL" && candStatus === "PASS") state = "fixed";
    else if (durDiff > 0.25 && baseStatus === candStatus) state = "duration";
    else state = "unchanged";

    return {
      id: `diff_${i}`,
      name,
      baseStatus,
      candStatus,
      durBase,
      durCand,
      category: base?.category ?? cand?.category ?? "Unknown",
      state,
    };
  });
}

export function computeTestDetailForName(name: string): TestDetail {
  const history: TestRunPoint[] = [];
  for (const run of RUNS) {
    const results = getTestResultsForRun(run.id);
    const match = results.find((r) => {
      const rn = r.name.toLowerCase();
      const dn = name.toLowerCase().replace(/_/g, " ");
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
  const flakinessScore = history.length > 1 ? Math.round((flips / (history.length - 1)) * 100) : 0;
  const avgDuration =
    history.length > 0
      ? Math.round(history.reduce((s, h) => s + h.duration, 0) / history.length)
      : 0;
  return { history, passRate, flakinessScore, avgDuration };
}

// ── ENV_SUMMARY ──────────────────────────────────────────────────────
export interface EnvSummaryEntry {
  label: string;
  passRate: number;
  trend: number;
  failures: number;
  color: string;
  alert: string | null;
}

const _envSummary: EnvSummaryEntry[] = [];
let _envSummarySnapshot: EnvSummaryEntry[] = [];

export function getEnvSummary(): EnvSummaryEntry[] {
  return _envSummarySnapshot;
}

// Backward-compat
export const ENV_SUMMARY: EnvSummaryEntry[] = _envSummary;

export function computeEnvSummary(): void {
  _envSummary.length = 0;
  const groups = new Map<string, Run[]>();
  for (const run of _runs) {
    const key = run.env;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(run);
  }
  for (const [label, runs] of groups) {
    const sorted = [...runs].sort(
      (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
    );
    const latest = sorted[0];
    const previous = sorted[1];
    const avgPassRate = Math.round(sorted.reduce((s, r) => s + r.passPct, 0) / sorted.length);
    const trend = previous ? Math.round(latest.passPct - previous.passPct) : 0;
    const color = avgPassRate >= 90 ? "#22c55e" : avgPassRate >= 70 ? "#f59e0b" : "#ef4444";
    const alert =
      latest.failures > 0
        ? `${latest.failures} failure${latest.failures !== 1 ? "s" : ""} in last run`
        : null;
    _envSummary.push({
      label,
      passRate: avgPassRate,
      trend,
      failures: latest.failures,
      color,
      alert,
    });
  }
  _envSummary.sort((a, b) => a.label.localeCompare(b.label));
  _envSummarySnapshot = [..._envSummary];
}

// ── PASS_RATE_CHART ──────────────────────────────────────────────────
const _passRateChart: { label: string; passRate: number; runId: string }[] = [];
let _passRateChartSnapshot: { label: string; passRate: number; runId: string }[] = [];

export function getPassRateChart(): { label: string; passRate: number; runId: string }[] {
  return _passRateChartSnapshot;
}

// Backward-compat
export const PASS_RATE_CHART: { label: string; passRate: number; runId: string }[] = _passRateChart;

export function computePassRateChart(): void {
  _passRateChart.length = 0;
  const sorted = [..._runs].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  for (const r of sorted) {
    _passRateChart.push({ label: r.started.slice(0, 10), passRate: r.passPct, runId: r.id });
  }
  _passRateChartSnapshot = [..._passRateChart];
}

// ── PER_ENV_PASS_RATE ────────────────────────────────────────────────
interface PerEnvPassRateEntry {
  env: string;
  color: string;
  data: { runId: string; label: string; passRate: number }[];
}

const _perEnvPassRate: PerEnvPassRateEntry[] = [];
let _perEnvPassRateSnapshot: PerEnvPassRateEntry[] = [];

export function getPerEnvPassRate(): PerEnvPassRateEntry[] {
  return _perEnvPassRateSnapshot;
}

// Backward-compat
export const PER_ENV_PASS_RATE: PerEnvPassRateEntry[] = _perEnvPassRate;

const ENV_COLOR_MAP: Record<string, string> = {
  QA: "#a855f7",
  UAT: "#f59e0b",
  PROD: "#22c55e",
  "QA / Staging": "#a855f7",
  "QA / Production": "#c084fc",
  "UAT / Staging": "#f59e0b",
  "UAT / Production": "#fbbf24",
  "PROD / Staging": "#22c55e",
  "PROD / Production": "#4ade80",
};
function envColor(label: string): string {
  return ENV_COLOR_MAP[label] ?? "#9aa0a6";
}

export function computePerEnvPassRate(): void {
  _perEnvPassRate.length = 0;
  const groups = new Map<string, { runId: string; label: string; passRate: number }[]>();
  const sorted = [..._runs].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  for (const run of sorted) {
    const key = run.env;
    if (!groups.has(key)) groups.set(key, []);
    groups
      .get(key)!
      .push({ runId: run.id, label: run.started.slice(0, 10), passRate: run.passPct });
  }
  const entries = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([env, data]) => ({ env, color: envColor(env), data }));
  _perEnvPassRate.push(...entries);
  _perEnvPassRateSnapshot = [..._perEnvPassRate];
}

// ── ENV_PASS_RATE_CHART ──────────────────────────────────────────────
const _envPassRateChart: Record<string, unknown>[] = [];
let _envPassRateChartSnapshot: Record<string, unknown>[] = [];

export function getEnvPassRateChart(): Record<string, unknown>[] {
  return _envPassRateChartSnapshot;
}

// Backward-compat
export const ENV_PASS_RATE_CHART: Record<string, unknown>[] = _envPassRateChart;

export function computeEnvPassRateChart(): void {
  _envPassRateChart.length = 0;
  const envLabels = [...new Set(_runs.map((r) => r.env))].sort();
  const dayMap = new Map<string, Record<string, unknown>>();
  const sorted = [..._runs].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  for (const run of sorted) {
    const day = run.started.slice(0, 10);
    const key = run.env;
    if (!dayMap.has(day)) {
      const entry: Record<string, unknown> = { day, runId: run.id };
      for (const l of envLabels) entry[l] = 0;
      dayMap.set(day, entry);
    }
    const entry = dayMap.get(day)!;
    entry[key] = run.passPct;
    entry.runId = run.id;
  }
  const entries = [...dayMap.values()].sort((a, b) => String(a.day).localeCompare(String(b.day)));
  _envPassRateChart.push(...entries);
  _envPassRateChartSnapshot = [..._envPassRateChart];
}

export function recomputeAll(): void {
  computeEnvSummary();
  computePassRateChart();
  computePerEnvPassRate();
  computeEnvPassRateChart();
  // Compute default DIFF_ROWS from the two most recent runs in the same env
  const byEnv = new Map<string, Run[]>();
  for (const run of _runs) {
    const k = run.envId;
    if (!byEnv.has(k)) byEnv.set(k, []);
    byEnv.get(k)!.push(run);
  }
  _diffRows.length = 0;
  for (const runs of byEnv.values()) {
    const sorted = [...runs].sort(
      (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
    );
    if (sorted.length >= 2) {
      const rows = computeDiffRows(sorted[1].id, sorted[0].id);
      rows.forEach((r) => _diffRows.push(r));
      continue;
    }
  }
  updateDiffRowsSnapshot();
  notifyRuns();
  notifyDiffRows();
}

export interface RunFrequency {
  totalRuns: number;
  daysCovered: number;
  runsPerDay: number;
  byDay: { date: string; count: number; envs: Record<string, number> }[];
  byEnv: Record<string, number>;
  byHour: Record<string, number>;
  avgIntervalHours: number;
  gaps: { date: string; gapDays: number }[];
}

export function computeRunFrequency(): RunFrequency {
  const sorted = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  const byDay: Map<string, { count: number; envs: Record<string, number> }> = new Map();
  const byEnv: Record<string, number> = {};
  const byHour: Record<string, number> = {};

  for (const run of sorted) {
    const d = new Date(run.started);
    const day = d.toISOString().slice(0, 10);
    const hour = String(d.getUTCHours());
    const entry = byDay.get(day) ?? { count: 0, envs: {} };
    entry.count++;
    entry.envs[run.env] = (entry.envs[run.env] || 0) + 1;
    byDay.set(day, entry);
    byEnv[run.env] = (byEnv[run.env] || 0) + 1;
    byHour[hour] = (byHour[hour] || 0) + 1;
  }

  const dayKeys = [...byDay.keys()].sort();
  const daysCovered = dayKeys.length;
  const runsPerDay = daysCovered > 0 ? Math.round((sorted.length / daysCovered) * 10) / 10 : 0;

  let totalIntervalMs = 0;
  let intervals = 0;
  for (let i = 1; i < sorted.length; i++) {
    totalIntervalMs +=
      new Date(sorted[i].started).getTime() - new Date(sorted[i - 1].started).getTime();
    intervals++;
  }
  const avgIntervalHours =
    intervals > 0 ? Math.round((totalIntervalMs / intervals / 3600000) * 10) / 10 : 0;

  const gaps: { date: string; gapDays: number }[] = [];
  for (let i = 1; i < dayKeys.length; i++) {
    const prev = new Date(dayKeys[i - 1]);
    const curr = new Date(dayKeys[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays > 1) gaps.push({ date: dayKeys[i], gapDays: diffDays - 1 });
  }

  return {
    totalRuns: sorted.length,
    daysCovered,
    runsPerDay,
    byDay: dayKeys.map((d) => ({
      date: d,
      count: byDay.get(d)!.count,
      envs: byDay.get(d)!.envs,
    })),
    byEnv,
    byHour,
    avgIntervalHours,
    gaps,
  };
}

export function getRunsByEnv(envIds?: string[]): readonly Run[] {
  if (!envIds || envIds.length === 0) return RUNS;
  return RUNS.filter((r) => envIds.includes(r.envId));
}

export function getTestResultsForRun(runId: string): TestResult[] {
  return getCachedResults(runId);
}

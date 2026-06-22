import type { Run, TestResult, TestDetail, TestRunPoint, DiffRow } from "./types";
import { fetchJson } from "./dataFetcher";
import { getCachedResults } from "./runsLoader";
import { bus } from "./eventBus";
import { memoize } from "./memo";

// ── Notification stores (Zustand vanilla — same interface as pub/sub but managed by Zustand) ────
import { createStore } from "zustand/vanilla";
const _runsNotify = createStore(() => ({}));
const _diffRowsNotify = createStore(() => ({}));
const _derivedNotify = createStore(() => ({}));

// ── Runs store ─────────────────────────────────────────────────────────
const _runs: Run[] = [];
let _runsSnapshot: Run[] = [];

function updateRunsSnapshot(): void {
  _runsSnapshot = [..._runs];
}

export function getRuns(): Run[] {
  return _runsSnapshot;
}

export function subscribeToRuns(cb: () => void): () => void {
  return _runsNotify.subscribe(cb);
}

// Backward-compat: direct access to the raw array (consumers that don't need reactivity)
export const RUNS: readonly Run[] = _runs;

// ── DIFF_ROWS store ──────────────────────────────────────────────────
const _diffRows: DiffRow[] = [];
let _diffRowsSnapshot: DiffRow[] = [];

function updateDiffRowsSnapshot(): void {
  _diffRowsSnapshot = [..._diffRows];
}

export function getDiffRows(): DiffRow[] {
  return _diffRowsSnapshot;
}

export function subscribeToDiffRows(cb: () => void): () => void {
  return _diffRowsNotify.subscribe(cb);
}

// Backward-compat
export const DIFF_ROWS: readonly DiffRow[] = _diffRows;

let _runsPromise: Promise<void> | null = null;
export async function loadRuns(): Promise<void> {
  if (_runsPromise) return _runsPromise;
  _runsPromise = (async () => {
    try {
      const data = await fetchJson<Run[]>("runs.json");
      _runs.length = 0;
      if (data) {
        _runs.push(...data);
      }
      updateRunsSnapshot();
      _runsNotify.setState({});
      bus.emit("runs:loaded", { count: data?.length ?? 0 });
    } catch (err) {
      _runsPromise = null;
      throw err;
    }
  })();
  return _runsPromise;
}

let _diffRowsPromise: Promise<void> | null = null;
export async function loadDiffRows(): Promise<void> {
  if (_diffRowsPromise) return _diffRowsPromise;
  _diffRowsPromise = (async () => {
    try {
      const data = await fetchJson<DiffRow[]>("diff-rows.json");
      _diffRows.length = 0;
      if (data) {
        _diffRows.push(...data);
      }
      updateDiffRowsSnapshot();
      _diffRowsNotify.setState({});
      bus.emit("diffrows:loaded", { count: data?.length ?? 0 });
    } catch (err) {
      _diffRowsPromise = null;
      throw err;
    }
  })();
  return _diffRowsPromise;
}

export function getRunIndex(runId: string): number {
  return RUNS.findIndex((r) => r.id === runId);
}

export function getRunById(id: string): Run | undefined {
  return RUNS.find((r) => r.id === id);
}

// ── Dynamic diff computation ───────────────────────────────────────────────
// Note: not memoized — getCachedResults is lazily populated (and mockable in
// tests), so a per-call-site cache would return stale empty results.
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

export const computeTestDetailForName = memoize(
  (name: string): TestDetail => {
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
  },
  (name) => name,
);

_runsNotify.subscribe(() => {
  computeTestDetailForName.clear();
});

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
    const color = avgPassRate >= 90 ? "var(--proof-emerald)" : avgPassRate >= 70 ? "#f59e0b" : "var(--proof-red)";
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

export const PER_ENV_PASS_RATE: PerEnvPassRateEntry[] = _perEnvPassRate;

const ENV_COLOR_MAP: Record<string, string> = {
  QA: "var(--proof-blue)",
  UAT: "#f59e0b",
  PROD: "var(--proof-emerald)",
  "QA / Staging": "var(--proof-blue)",
  "QA / Production": "#c084fc",
  "UAT / Staging": "#f59e0b",
  "UAT / Production": "#fbbf24",
  "PROD / Staging": "var(--proof-emerald)",
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
  for (const [env, data] of groups) {
    _perEnvPassRate.push({ env, color: envColor(env), data });
  }
  _perEnvPassRate.sort((a, b) => a.env.localeCompare(b.env));
  _perEnvPassRateSnapshot = [..._perEnvPassRate];
}

// ── ENV_PASS_RATE_CHART ──────────────────────────────────────────────
export interface EnvPassRateChartEntry {
  label: string;
  [env: string]: string | number;
}

const _envPassRateChart: EnvPassRateChartEntry[] = [];
let _envPassRateChartSnapshot: EnvPassRateChartEntry[] = [];

export function getEnvPassRateChart(): EnvPassRateChartEntry[] {
  return _envPassRateChartSnapshot;
}

export const ENV_PASS_RATE_CHART: EnvPassRateChartEntry[] = _envPassRateChart;

export function computeEnvPassRateChart(): void {
  _envPassRateChart.length = 0;
  const byDate = new Map<string, EnvPassRateChartEntry>();
  const sorted = [..._runs].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  for (const run of sorted) {
    const label = run.started.slice(0, 10);
    if (!byDate.has(label)) byDate.set(label, { label });
    byDate.get(label)![run.env] = run.passPct;
  }
  _envPassRateChart.push(...byDate.values());
  _envPassRateChartSnapshot = [..._envPassRateChart];
}

// ── Per-run test results ──────────────────────────────────────────────
export function getTestResultsForRun(runId: string): TestResult[] {
  return getCachedResults(runId);
}

export function getRunsByEnv(envIds?: string | string[]): Run[] {
  if (envIds === undefined || (Array.isArray(envIds) && envIds.length === 0)) {
    return [..._runs];
  }
  const ids = Array.isArray(envIds) ? envIds : [envIds];
  return _runs.filter((r) => ids.includes(r.envId));
}

// ── Run frequency analysis ────────────────────────────────────────────
export interface RunFrequency {
  totalRuns: number;
  daysCovered: number;
  runsPerDay: number;
  hourly: number;
  daily: number;
  weekly: number;
}

export function computeRunFrequency(): RunFrequency {
  if (_runs.length < 2) {
    return {
      totalRuns: _runs.length,
      daysCovered: 0,
      runsPerDay: 0,
      hourly: 0,
      daily: 0,
      weekly: 0,
    };
  }
  const sorted = [..._runs].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  const first = new Date(sorted[0].started).getTime();
  const last = new Date(sorted[sorted.length - 1].started).getTime();
  const totalHours = (last - first) / (1000 * 60 * 60);
  const daysCovered = Math.max(1, Math.ceil(totalHours / 24));
  if (totalHours === 0) {
    return { totalRuns: _runs.length, daysCovered, runsPerDay: 0, hourly: 0, daily: 0, weekly: 0 };
  }
  const hourly = _runs.length / totalHours;
  return {
    totalRuns: _runs.length,
    daysCovered,
    runsPerDay: Math.round(hourly * 24 * 100) / 100,
    hourly: Math.round(hourly * 100) / 100,
    daily: Math.round(hourly * 24 * 100) / 100,
    weekly: Math.round(hourly * 24 * 7 * 100) / 100,
  };
}

// ── Master recompute ──────────────────────────────────────────────────
export function recomputeAll(): void {
  updateRunsSnapshot();
  updateDiffRowsSnapshot();
  computeEnvSummary();
  computePassRateChart();
  computePerEnvPassRate();
  computeEnvPassRateChart();
  _derivedNotify.setState({});
  _runsNotify.setState({});
  _diffRowsNotify.setState({});
}

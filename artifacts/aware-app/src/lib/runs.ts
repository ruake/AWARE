import type { Run, TestResult, TestDetail, TestRunPoint, DiffRow } from "./types";
import { fetchJson } from "./dataFetcher";
import { getCachedResults } from "./runsLoader";

export let RUNS: Run[] = [];
export let DIFF_ROWS: DiffRow[] = [];

let _runsLoaded = false;
export async function loadRuns(): Promise<void> {
  if (_runsLoaded) return;
  _runsLoaded = true;
  RUNS = await fetchJson<Run[]>("runs.json");
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
export const ENV_SUMMARY: {
  label: string;
  passRate: number;
  trend: number;
  failures: number;
  color: string;
  alert: string | null;
}[] = [];

export function computeEnvSummary(): void {
  ENV_SUMMARY.length = 0;
  const groups = new Map<string, Run[]>();
  for (const run of RUNS) {
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
    ENV_SUMMARY.push({
      label,
      passRate: avgPassRate,
      trend,
      failures: latest.failures,
      color,
      alert,
    });
  }
  ENV_SUMMARY.sort((a, b) => a.label.localeCompare(b.label));
}

// ── PASS_RATE_CHART ──────────────────────────────────────────────────
export const PASS_RATE_CHART: { label: string; passRate: number; runId: string }[] = [];

export function computePassRateChart(): void {
  PASS_RATE_CHART.length = 0;
  const sorted = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  for (const r of sorted) {
    PASS_RATE_CHART.push({ label: r.started.slice(0, 10), passRate: r.passPct, runId: r.id });
  }
}

// ── PER_ENV_PASS_RATE ────────────────────────────────────────────────
export const PER_ENV_PASS_RATE: {
  env: string;
  color: string;
  data: { runId: string; label: string; passRate: number }[];
}[] = [];

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
  PER_ENV_PASS_RATE.length = 0;
  const groups = new Map<string, { runId: string; label: string; passRate: number }[]>();
  const sorted = [...RUNS].sort(
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
  PER_ENV_PASS_RATE.push(...entries);
}

// ── ENV_PASS_RATE_CHART ──────────────────────────────────────────────
export const ENV_PASS_RATE_CHART: Record<string, unknown>[] = [];

export function computeEnvPassRateChart(): void {
  ENV_PASS_RATE_CHART.length = 0;
  const envLabels = [...new Set(RUNS.map((r) => r.env))].sort();
  const dayMap = new Map<string, Record<string, unknown>>();
  const sorted = [...RUNS].sort(
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
  ENV_PASS_RATE_CHART.push(...entries);
}

export function recomputeAll(): void {
  computeEnvSummary();
  computePassRateChart();
  computePerEnvPassRate();
  computeEnvPassRateChart();
  // Compute default DIFF_ROWS from the two most recent runs in the same env
  const byEnv = new Map<string, Run[]>();
  for (const run of RUNS) {
    const k = run.envId;
    if (!byEnv.has(k)) byEnv.set(k, []);
    byEnv.get(k)!.push(run);
  }
  DIFF_ROWS.length = 0;
  for (const runs of byEnv.values()) {
    const sorted = [...runs].sort(
      (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
    );
    if (sorted.length >= 2) {
      const rows = computeDiffRows(sorted[1].id, sorted[0].id);
      rows.forEach((r) => DIFF_ROWS.push(r));
      break;
    }
  }
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

export function getTestResultsForRun(runId: string): TestResult[] {
  return getCachedResults(runId);
}

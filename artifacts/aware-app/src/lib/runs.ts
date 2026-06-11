import type { Run, TestResult, TestDetail, TestRunPoint, DiffRow } from "./types";
import runsSeed from "@/data/runs.json";
import diffRowsSeed from "@/data/diff-rows.json";
import testResultsSeed from "@/data/test-results.json";

export const RUNS: Run[] = runsSeed as unknown as Run[];
export const DIFF_ROWS: DiffRow[] = diffRowsSeed as unknown as DiffRow[];
const TEST_RESULTS_BY_RUN: Record<string, TestResult[]> = testResultsSeed as unknown as Record<
  string,
  TestResult[]
>;

export function getRunIndex(runId: string): number {
  return RUNS.findIndex((r) => r.id === runId);
}

export function getRunById(id: string): Run | undefined {
  return RUNS.find((r) => r.id === id);
}

function computeTestDetails(): TestDetail[] {
  return DIFF_ROWS.map((diff) => {
    const history: TestRunPoint[] = [];
    const diffSuffix = diff.id.replace("diff_", ""); // e.g. "pw_00" from "diff_pw_00"
    for (const run of RUNS) {
      const results = getTestResultsForRun(run.id);
      const match = results.find((r) => {
        if (r.id === diffSuffix) return true; // direct ID match: "pw_00" vs "pw_0"
        if (r.id === diffSuffix.replace(/^0+/, "")) return true; // "pw_00" vs "pw_0" after stripping leading zeros
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

export const TEST_DETAILS: TestDetail[] = computeTestDetails();

// ── Env label helper ──────────────────────────────────────────────────
function envLabel(run: Run): string {
  return run.env ?? run.target ?? "QA";
}

const ENV_COLOR_MAP: Record<string, string> = {
  "QA / Staging": "#a855f7",
  "QA / Production": "#c084fc",
  "UAT / Staging": "#f59e0b",
  "UAT / Production": "#fbbf24",
  "PROD / Staging": "#22c55e",
  "PROD / Production": "#4ade80",
  // Short forms (target only)
  QA: "#a855f7",
  UAT: "#f59e0b",
  PROD: "#22c55e",
  // Legacy
  "Prod/Production": "#5b8af5",
  "Prod/Staging": "#f59e0b",
  "UAT/Production": "#22c55e",
  "UAT/Staging": "#a855f7",
};
function envColor(label: string): string {
  return ENV_COLOR_MAP[label] ?? "#9aa0a6";
}

// ── ENV_SUMMARY ──────────────────────────────────────────────────────
export const ENV_SUMMARY: {
  label: string;
  passRate: number;
  trend: number;
  failures: number;
  color: string;
  alert: string | null;
}[] = (() => {
  const groups = new Map<string, Run[]>();
  for (const run of RUNS) {
    const key = envLabel(run);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(run);
  }
  const result: typeof ENV_SUMMARY = [];
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
    result.push({ label, passRate: avgPassRate, trend, failures: latest.failures, color, alert });
  }
  // stable order: Prod/Production first
  result.sort((a, b) => a.label.localeCompare(b.label));
  return result;
})();

// ── PASS_RATE_CHART ──────────────────────────────────────────────────
export const PASS_RATE_CHART: { label: string; passRate: number; runId: string }[] = [...RUNS]
  .sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime())
  .map((r) => ({ label: r.started.slice(0, 10), passRate: r.passPct, runId: r.id }));

// ── PER_ENV_PASS_RATE ────────────────────────────────────────────────
export const PER_ENV_PASS_RATE: {
  env: string;
  color: string;
  data: { runId: string; label: string; passRate: number }[];
}[] = (() => {
  const groups = new Map<string, { runId: string; label: string; passRate: number }[]>();
  const sorted = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  for (const run of sorted) {
    const key = envLabel(run);
    if (!groups.has(key)) groups.set(key, []);
    groups
      .get(key)!
      .push({ runId: run.id, label: run.started.slice(0, 10), passRate: run.passPct });
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([env, data]) => ({ env, color: envColor(env), data }));
})();

// ── ENV_PASS_RATE_CHART ──────────────────────────────────────────────
// Per-day record keyed by env label. Used by the area chart on the dashboard.
export const ENV_PASS_RATE_CHART: Record<string, unknown>[] = (() => {
  const envLabels = [...new Set(RUNS.map(envLabel))].sort();
  const dayMap = new Map<string, Record<string, unknown>>();

  const sorted = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );

  for (const run of sorted) {
    const day = run.started.slice(0, 10);
    const key = envLabel(run);
    if (!dayMap.has(day)) {
      const entry: Record<string, unknown> = { day, runId: run.id };
      for (const l of envLabels) entry[l] = 0;
      dayMap.set(day, entry);
    }
    const entry = dayMap.get(day)!;
    entry[key] = run.passPct;
    entry.runId = run.id; // last run of the day wins for click-through
  }

  return [...dayMap.values()].sort((a, b) => String(a.day).localeCompare(String(b.day)));
})();

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
    byDay: dayKeys.map((d) => ({ date: d, count: byDay.get(d)!.count, envs: byDay.get(d)!.envs })),
    byEnv,
    byHour,
    avgIntervalHours,
    gaps,
  };
}

export function getTestResultsForRun(runId: string): TestResult[] {
  return TEST_RESULTS_BY_RUN[runId] ?? [];
}

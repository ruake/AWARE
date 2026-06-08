import type { Run, TestResult, TestRunPoint, TestDetail, DiffRow } from "./types";
import runsSeed from "@/data/runs.json";
import diffRowsSeed from "@/data/diff-rows.json";

export const RUNS: Run[] = runsSeed as unknown as Run[];
export const DIFF_ROWS: DiffRow[] = diffRowsSeed as unknown as DiffRow[];

export function getRunIndex(runId: string): number {
  return RUNS.findIndex(r => r.id === runId);
}

export function getRunById(id: string): Run | undefined {
  return RUNS.find(r => r.id === id);
}

export function generateTestHistory(_testIndex: number): TestDetail {
  const history: TestRunPoint[] = RUNS.map((run) => ({
    runId: run.id,
    status: "PASS",
    duration: 0,
    env: run.env,
  }));
  const passCount = history.filter(h => h.status === "PASS").length;
  const passRate = history.length > 0 ? Math.round((passCount / history.length) * 100) : 0;
  const flips = 0;
  const flakinessScore = 0;
  const avgDuration = history.length > 0 ? Math.round(history.reduce((s, h) => s + h.duration, 0) / history.length) : 0;
  return { history, passRate, flakinessScore, avgDuration };
}

export function detectAnomaly(detail: TestDetail): boolean {
  const { passRate, flakinessScore, history } = detail;
  if (history.length < 3) return false;
  if (flakinessScore > 30) return true;
  if (passRate < 70) return true;
  const recent = history.slice(-3);
  const old = history.slice(0, -3);
  if (old.length >= 3) {
    const recentRate = recent.filter(h => h.status === "PASS").length / recent.length;
    const oldRate = old.filter(h => h.status === "PASS").length / old.length;
    if (oldRate - recentRate > 0.25) return true;
  }
  return false;
}

export const TEST_DETAILS: TestDetail[] = DIFF_ROWS.map((_, i) => generateTestHistory(i));

export const ENV_SUMMARY: { label: string; passRate: number; trend: number; failures: number; color: string; alert: string | null }[] = [];

export const PASS_RATE_CHART: { label: string; passRate: number; runId: string }[] = [];

export const PER_ENV_PASS_RATE: { env: string; color: string; data: { runId: string; label: string; passRate: number }[] }[] = [];

export const ENV_PASS_RATE_CHART: { day: string; runId: string; "Prod/Production": number; "Prod/Staging": number; "UAT/Production": number; "UAT/Staging": number }[] = [];

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
  const sorted = [...RUNS].sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime());
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
    totalIntervalMs += new Date(sorted[i].started).getTime() - new Date(sorted[i - 1].started).getTime();
    intervals++;
  }
  const avgIntervalHours = intervals > 0 ? Math.round((totalIntervalMs / intervals / 3600000) * 10) / 10 : 0;

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
    byDay: dayKeys.map(d => ({ date: d, count: byDay.get(d)!.count, envs: byDay.get(d)!.envs })),
    byEnv,
    byHour,
    avgIntervalHours,
    gaps,
  };
}

export function getTestResultsForRun(_runId: string): TestResult[] {
  return [];
}

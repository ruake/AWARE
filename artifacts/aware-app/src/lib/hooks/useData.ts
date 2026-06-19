/**
 * Clean React hook layer over the existing data stores.
 *
 * Design goals
 * ────────────
 * 1. Single import path  — consumers use `@/lib/hooks/useData` instead of
 *    wiring useSyncExternalStore manually in every component.
 * 2. Derived state computed once via useMemo — no duplicate work per component.
 * 3. React Query for async/side-effect data (run results, per-run fetches).
 * 4. URL params for filter state — shareable, bookmarkable, no localStorage
 *    gymnastics needed in components.
 *
 * The underlying stores (runs.ts, filters.ts, …) are left untouched so
 * existing pages keep working. New pages / redesigns import from here.
 */

import React from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

/* ── Existing stores (pub/sub + snapshots) ─────────────────────────── */
import {
  getRuns,
  subscribeToRuns,
  getEnvSummary,
  getDiffRows,
  subscribeToDiffRows,
  getPassRateChart,
  getPerEnvPassRate,
  getRunById,
  getRunsByEnv,
  computeDiffRows,
  computeTestDetailForName,
  getTestResultsForRun,
  getSelectedEnvSnapshot,
  subscribeToSelectedEnv,
  setSelectedEnvIds,
  toggleSelectedEnvId,
  getSelectedSuiteSnapshot,
  subscribeToSelectedSuites,
  setSelectedSuiteIds,
  getLayoutSnapshot,
  getLayoutSettings,
  setLayoutSettings,
  subscribeToLayout,
  loadResultsForRun,
  getCachedResults,
  getEnvConfigs,
  getEnvConfigById,
  loadAllData,
  getDataInitState,
  subscribeToDataInit,
} from "@/lib/data";
import type { Run, TestResult, DiffRow } from "@/lib/types";

/* ─────────────────────────────────────────────────────────────────────
   Query keys — centralised so cache invalidation is consistent
───────────────────────────────────────────────────────────────────── */
export const QUERY_KEYS = {
  runResults: (runId: string) => ["run-results", runId] as const,
  runDiff: (baseId: string, candId: string) => ["run-diff", baseId, candId] as const,
} as const;

/* ─────────────────────────────────────────────────────────────────────
   App init hook — replaces manual useSyncExternalStore wiring in consumers
───────────────────────────────────────────────────────────────────── */

/** Reactive app data loading state (loaded / loading / error). */
export function useDataInit() {
  return React.useSyncExternalStore(subscribeToDataInit, getDataInitState);
}

/* ─────────────────────────────────────────────────────────────────────
   Core data hooks
───────────────────────────────────────────────────────────────────── */

/** All runs, reactive to store updates. */
export function useRuns(): Run[] {
  return React.useSyncExternalStore(subscribeToRuns, getRuns);
}

/** Filtered runs based on the current env selection. */
export function useFilteredRuns(): Run[] {
  const runs = useRuns();
  const envSnap = React.useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  return React.useMemo(
    () => (envSnap.envIds.length === 0 ? runs : getRunsByEnv(envSnap.envIds) as Run[]),
    [runs, envSnap.envIds],
  );
}

/** Diff rows for the default (most-recent-per-env) comparison. */
export function useDiffRows(): DiffRow[] {
  return React.useSyncExternalStore(subscribeToDiffRows, getDiffRows);
}

/** Environment health summary, derived from filtered runs. */
export function useEnvHealth() {
  const filteredRuns = useFilteredRuns();
  const envSnap = React.useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  return React.useMemo(() => {
    const configs = envSnap.envIds.length > 0
      ? getEnvConfigs().filter((c) => envSnap.envIds.includes(c.id))
      : getEnvConfigs();

    const groups = new Map<string, Run[]>();
    for (const run of filteredRuns) {
      if (!groups.has(run.envId)) groups.set(run.envId, []);
      groups.get(run.envId)!.push(run);
    }

    return configs.map((cfg) => {
      const runs = [...(groups.get(cfg.id) ?? [])].sort(
        (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
      );
      const latest = runs[0];
      const previous = runs[1];
      const avgPassRate =
        runs.length > 0 ? Math.round(runs.reduce((s, r) => s + r.passPct, 0) / runs.length) : 0;
      const trend = latest && previous ? Math.round(latest.passPct - previous.passPct) : 0;
      const status: "healthy" | "degraded" | "critical" =
        avgPassRate >= 95 ? "healthy" : avgPassRate >= 80 ? "degraded" : "critical";
      return {
        id: cfg.id,
        label: cfg.label,
        tier: cfg.target,
        network: cfg.network,
        passRate: avgPassRate,
        trend,
        failures: latest?.failures ?? 0,
        runCount: runs.length,
        lastRun: latest?.started,
        status,
        latestRunId: latest?.id,
      };
    });
  }, [filteredRuns, envSnap.envIds]);
}

/** Overall KPI summary (total runs, pass rate, failures, regressions). */
export function useDashboardKPIs() {
  const filteredRuns = useFilteredRuns();
  const diffRows = useDiffRows();

  return React.useMemo(() => {
    const total = filteredRuns.length;
    const passRate =
      total > 0 ? Math.round(filteredRuns.reduce((s, r) => s + r.passPct, 0) / total) : 0;
    const failedRuns = filteredRuns.filter((r) => (r.failures ?? 0) > 0).length;
    const regressions = diffRows.filter((d) => d.state === "regression").length;
    const latestRun = filteredRuns[0] ?? null;
    const prevRun = filteredRuns[1] ?? null;
    const passTrend = latestRun && prevRun ? Math.round(latestRun.passPct - prevRun.passPct) : 0;

    return { total, passRate, passTrend, failedRuns, regressions, latestRun };
  }, [filteredRuns, diffRows]);
}

/** Pass rate chart data for the area chart. */
export function usePassRateChart() {
  const filteredRuns = useFilteredRuns();
  const envSnap = React.useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);

  return React.useMemo(() => {
    if (envSnap.envIds.length === 0) return getPassRateChart();
    const sorted = [...filteredRuns].sort(
      (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
    );
    return sorted.map((r) => ({ label: r.started.slice(0, 10), passRate: r.passPct, runId: r.id }));
  }, [filteredRuns, envSnap.envIds]);
}

/** Per-env pass rate data for multi-line chart. */
export function usePerEnvPassRate() {
  return getPerEnvPassRate();
}

/* ─────────────────────────────────────────────────────────────────────
   Filter / selection hooks
───────────────────────────────────────────────────────────────────── */

export function useSelectedEnv() {
  const snap = React.useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  return {
    envIds: snap.envIds,
    setEnvIds: setSelectedEnvIds,
    toggleEnvId: toggleSelectedEnvId,
    isAll: snap.envIds.length === 0,
  };
}

export function useSelectedSuites() {
  const snap = React.useSyncExternalStore(subscribeToSelectedSuites, getSelectedSuiteSnapshot);
  return {
    suiteIds: snap.suiteIds,
    setSuiteIds: setSelectedSuiteIds,
    isAll: snap.suiteIds.length === 0,
  };
}

export function useLayout() {
  const snap = React.useSyncExternalStore(subscribeToLayout, getLayoutSnapshot);
  return {
    ...snap,
    update: setLayoutSettings,
  };
}

/* ─────────────────────────────────────────────────────────────────────
   Async / React Query hooks
───────────────────────────────────────────────────────────────────── */

/** Lazy-loads test results for a specific run via React Query. */
export function useRunResults(runId: string | undefined): UseQueryResult<TestResult[]> {
  return useQuery({
    queryKey: QUERY_KEYS.runResults(runId ?? "__none__"),
    queryFn: () => loadResultsForRun(runId!),
    enabled: !!runId,
    staleTime: 15 * 60 * 1000, // results are immutable once written
    gcTime: 60 * 60 * 1000,
    retry: 2,
  });
}

/** Computes a diff between two runs, using cached results where possible. */
export function useRunDiff(
  baseRunId: string | undefined,
  candRunId: string | undefined,
): UseQueryResult<DiffRow[]> {
  return useQuery({
    queryKey: QUERY_KEYS.runDiff(baseRunId ?? "", candRunId ?? ""),
    queryFn: async () => {
      if (!baseRunId || !candRunId) return [];
      await Promise.all([loadResultsForRun(baseRunId), loadResultsForRun(candRunId)]);
      return computeDiffRows(baseRunId, candRunId);
    },
    enabled: !!baseRunId && !!candRunId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

/* ─────────────────────────────────────────────────────────────────────
   Utility hooks
───────────────────────────────────────────────────────────────────── */

/** Returns a single run by ID. */
export function useRun(runId: string | undefined): Run | undefined {
  const _runs = useRuns();
  return React.useMemo(
    () => (runId ? _runs.find((r) => r.id === runId) : undefined),
    [_runs, runId],
  );
}

/** Formats a timestamp relative to now (e.g. "3 min ago", "2 days ago"). */
export function useRelativeTime(iso: string | undefined): string {
  return React.useMemo(() => {
    if (!iso) return "—";
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }, [iso]);
}

export { getRunById, getEnvConfigs, getEnvConfigById };

import React from "react";
import type { Run, TestResult, DiffRow, TestDetail, EnvSummary } from "./types";
import { classifyError, type ServiceError } from "./types";
import { getServices } from "./services";

export type { ServiceError };

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: ServiceError | null;
}

function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[],
  initial: T,
): AsyncState<T> & { refetch: () => void } {
  const [data, setData] = React.useState<T>(initial);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<ServiceError | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fn().then(
      result => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      },
      err => {
        if (!cancelled) {
          setError(classifyError(err));
          setLoading(false);
        }
      },
    );

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const refetch = React.useCallback(() => setTick(t => t + 1), []);

  return { data, loading, error, refetch };
}

// ── Async Hooks ────────────────────────────────────────────

export function useRuns(): { runs: Run[]; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().runs;
  const { data, loading, error, refetch } = useAsync(() => svc.getAll(), [], []);
  return { runs: data, loading, error, refetch };
}

export function useRunById(id: string | null): { run: Run | null; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().runs;
  const { data, loading, error, refetch } = useAsync(() => id ? svc.getById(id).then(r => r ?? null) : Promise.resolve(null), [id], null as Run | null);
  return { run: data ?? null, loading, error, refetch };
}

export function useRunIndex(id: string): number {
  const svc = getServices().runs;
  const [index, setIndex] = React.useState<number>(0);
  React.useEffect(() => { Promise.resolve(svc.getIndex(id)).then(i => setIndex(i)); }, [id]);
  return index;
}

export function useTestResults(runIndex: number): { tests: TestResult[]; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().runs;
  const { data, loading, error, refetch } = useAsync(() => svc.getTestResults(runIndex), [runIndex], []);
  return { tests: data, loading, error, refetch };
}

export function useDiffs(): { diffs: DiffRow[]; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().diffs;
  const { data, loading, error, refetch } = useAsync(() => svc.getRows(), [], []);
  return { diffs: data, loading, error, refetch };
}

export function useTestDetails(): { details: TestDetail[]; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().diffs;
  const { data, loading, error, refetch } = useAsync(() => svc.getTestDetails(), [], []);
  return { details: data, loading, error, refetch };
}

export function useEnvSummary(): { summary: EnvSummary[]; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().dashboard;
  const { data, loading, error, refetch } = useAsync(() => svc.getEnvSummary(), [], []);
  return { summary: data, loading, error, refetch };
}

export function useTestHistory(testIndex: number): { detail: TestDetail | null; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().tests;
  const { data, loading, error, refetch } = useAsync(() => svc.getHistory(testIndex).then(d => d as TestDetail | null), [testIndex], null);
  return { detail: data, loading, error, refetch };
}

export function usePassRateData(): { data: unknown[]; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().dashboard;
  const result = useAsync(() => svc.getPassRateData() as Promise<unknown[]>, [], []);
  return result;
}

export function useEnvPassRateData(): { data: unknown[]; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().dashboard;
  const result = useAsync(() => svc.getEnvPassRateData() as Promise<unknown[]>, [], []);
  return result;
}

// ── Sync hooks (immediate fill from first resolution) ──────

export function useSyncRuns(): Run[] {
  const svc = getServices().runs;
  const [runs, setRuns] = React.useState<Run[]>([]);
  React.useEffect(() => { svc.getAll().then(setRuns); }, []);
  return runs;
}

export function useSyncDiffs(): DiffRow[] {
  const svc = getServices().diffs;
  const [diffs, setDiffs] = React.useState<DiffRow[]>([]);
  React.useEffect(() => { svc.getRows().then(setDiffs); }, []);
  return diffs;
}

export function useSyncEnvSummary(): EnvSummary[] {
  const svc = getServices().dashboard;
  const [data, setData] = React.useState<EnvSummary[]>([]);
  React.useEffect(() => { svc.getEnvSummary().then(setData); }, []);
  return data;
}

export function useSyncTestDetails(): TestDetail[] {
  const svc = getServices().diffs;
  const [data, setData] = React.useState<TestDetail[]>([]);
  React.useEffect(() => { svc.getTestDetails().then(setData); }, []);
  return data;
}

import React from "react";
import type { Run, TestResult, DiffRow, TestDetail, EnvSummary, TestCase, TestSuite, TestTag, TestCaseFilter, ImportResult, ImportExportFormat, GenerateParams, TestStats, TestChangeLogEntry, SuiteNode } from "./types";
import { classifyError, type ServiceError } from "./types";
import { getServices } from "./services";

export type { ServiceError, TestCase, TestSuite, TestTag, TestCaseFilter, ImportResult, ImportExportFormat, GenerateParams, TestStats, TestChangeLogEntry, SuiteNode };

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

// ── Test Case & Suite Hooks ────────────────────────────────

export function useTestCases(): { testCases: TestCase[]; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().testCases;
  const { data, loading, error, refetch } = useAsync(() => svc.getAll(), [], []);
  return { testCases: data, loading, error, refetch };
}

export function useTestCaseById(id: string | null): { testCase: TestCase | null; loading: boolean; error: ServiceError | null } {
  const svc = getServices().testCases;
  const { data, loading, error } = useAsync(() => id ? svc.getById(id).then(r => r ?? null) : Promise.resolve(null), [id], null as TestCase | null);
  return { testCase: data ?? null, loading, error };
}

export function useTestSuites(): { suites: TestSuite[]; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().testSuites;
  const { data, loading, error, refetch } = useAsync(() => svc.getAll(), [], []);
  return { suites: data, loading, error, refetch };
}

export function useTestSuiteTree(): { tree: SuiteNode[]; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().testSuites;
  const { data, loading, error, refetch } = useAsync(() => svc.buildTree(), [], [] as SuiteNode[]);
  return { tree: data, loading, error, refetch };
}

export function useTestTags(): { tags: TestTag[]; loading: boolean; error: ServiceError | null } {
  const svc = getServices().testCases;
  const { data, loading, error } = useAsync(() => svc.getAllTags(), [], []);
  return { tags: data, loading, error };
}

export function useFilteredTestCases(filter: TestCaseFilter): { testCases: TestCase[]; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().testCases;
  const { data, loading, error, refetch } = useAsync(() => svc.getFiltered(filter), [filter], []);
  return { testCases: data, loading, error, refetch };
}

export function useCreateTestCase(): (data: Omit<TestCase, "id" | "createdAt" | "updatedAt">) => Promise<TestCase> {
  const svc = getServices().testCases;
  return React.useCallback((data) => svc.create(data), []);
}

export function useUpdateTestCase(): (id: string, patch: Partial<Omit<TestCase, "id" | "createdAt">>) => Promise<TestCase | undefined> {
  const svc = getServices().testCases;
  return React.useCallback((id, patch) => svc.update(id, patch), []);
}

export function useDeleteTestCase(): (id: string) => Promise<boolean> {
  const svc = getServices().testCases;
  return React.useCallback((id) => svc.delete(id), []);
}

export function useImportTestCases(): (data: TestCase[]) => Promise<ImportResult> {
  const svc = getServices().testCases;
  return React.useCallback((data) => svc.importCases(data), []);
}

export function useExportTestCases(): (format: ImportExportFormat, suiteId?: string) => Promise<string> {
  const svc = getServices().testCases;
  return React.useCallback((format, suiteId) => svc.exportCases(format, suiteId), []);
}

export function useSyncTestCases(): TestCase[] {
  const svc = getServices().testCases;
  const [data, setData] = React.useState<TestCase[]>([]);
  React.useEffect(() => { svc.getAll().then(setData); }, []);
  return data;
}

export function useSyncTestSuites(): TestSuite[] {
  const svc = getServices().testSuites;
  const [data, setData] = React.useState<TestSuite[]>([]);
  React.useEffect(() => { svc.getAll().then(setData); }, []);
  return data;
}

// ── Generate & Stats Hooks ────────────────────────────────

export function useGenerateTestCases(): (params: GenerateParams) => Promise<TestCase[]> {
  const svc = getServices().testCases;
  return React.useCallback((params) => svc.generate(params), []);
}

export function useTestStats(): { stats: TestStats | null; loading: boolean; error: ServiceError | null; refetch: () => void } {
  const svc = getServices().testCases;
  const { data, loading, error, refetch } = useAsync(() => svc.getStats(), [], null as TestStats | null);
  return { stats: data, loading, error, refetch };
}

export function useTestChangelog(testId: string | null): { entries: TestChangeLogEntry[]; loading: boolean } {
  const svc = getServices().testCases;
  const [entries, setEntries] = React.useState<TestChangeLogEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!testId) return;
    setLoading(true);
    svc.getChangelog(testId).then(setEntries).finally(() => setLoading(false));
  }, [testId]);
  return { entries, loading };
}

export function useUpdateDocumentation(): (id: string, documentation: string, author: string) => Promise<TestCase | undefined> {
  const svc = getServices().testCases;
  return React.useCallback((id, doc, author) => svc.updateDocumentation(id, doc, author), []);
}

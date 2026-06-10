import type { DataQuery } from "./types";
import { RUNS, DIFF_ROWS, getRunById, getTestResultsForRun } from "@/lib/runs";
import { getTestCases, getTestCaseById } from "@/lib/testCases";
import { getTestSuites } from "@/lib/testSuites";
import { getAllPromotionDecisions } from "@/lib/promotions";
import type { Run } from "@/lib/types";

export const DATA_QUERIES: DataQuery[] = [
  {
    id: "get_all_runs",
    name: "Get All Runs",
    description: "Returns all test runs with their metadata",
    query: async () => RUNS,
    exampleParams: {},
  },
  {
    id: "get_run_by_id",
    name: "Get Run By ID",
    description: "Returns a specific run by its ID",
    query: async (params) => {
      const run = getRunById(params.id as string);
      if (!run) throw new Error(`Run not found: ${params.id}`);
      return run;
    },
    exampleParams: { id: "run_20260610_xxxx" },
  },
  {
    id: "get_test_results_for_run",
    name: "Get Test Results for Run",
    description: "Returns all test results for a specific run",
    query: async (params) => getTestResultsForRun(params.runId as string),
    exampleParams: { runId: "run_20260610_xxxx" },
  },
  {
    id: "get_all_test_cases",
    name: "Get All Test Cases",
    description: "Returns all test cases with their metadata",
    query: async () => getTestCases(),
    exampleParams: {},
  },
  {
    id: "get_test_case_by_id",
    name: "Get Test Case By ID",
    description: "Returns a specific test case by its ID",
    query: async (params) => {
      const tc = getTestCaseById(params.id as string);
      if (!tc) throw new Error(`Test case not found: ${params.id}`);
      return tc;
    },
    exampleParams: { id: "ad_0" },
  },
  {
    id: "get_all_suites",
    name: "Get All Test Suites",
    description: "Returns all test suites with their config",
    query: async () => getTestSuites(),
    exampleParams: {},
  },
  {
    id: "get_diff_rows",
    name: "Get Diff Rows",
    description: "Returns baseline vs candidate comparison data",
    query: async () => DIFF_ROWS,
    exampleParams: {},
  },
  {
    id: "get_promotion_decisions",
    name: "Get Promotion Decisions",
    description: "Returns all promotion decisions (promote/block/pending)",
    query: async () => getAllPromotionDecisions(),
    exampleParams: {},
  },
  {
    id: "get_runs_by_env",
    name: "Get Runs by Environment",
    description: "Returns runs filtered by environment (production/staging)",
    query: async (params) => RUNS.filter((r) => r.env === (params.env as string)),
    exampleParams: { env: "production" },
  },
  {
    id: "get_runs_by_date_range",
    name: "Get Runs by Date Range",
    description: "Returns runs within a date range",
    query: async (params) => {
      const start = new Date(params.start as string).getTime();
      const end = new Date(params.end as string).getTime();
      return RUNS.filter((r) => {
        const t = new Date(r.started).getTime();
        return t >= start && t <= end;
      });
    },
    exampleParams: { start: "2026-06-08", end: "2026-06-10" },
  },
  {
    id: "compute_failure_rate_by_category",
    name: "Failure Rate by Category",
    description: "Computes failure rate grouped by test category for a run",
    query: async (params) => {
      const results = getTestResultsForRun(params.runId as string);
      const byCategory: Record<string, { total: number; failed: number }> = {};
      for (const r of results) {
        const cat = r.category || "unknown";
        if (!byCategory[cat]) byCategory[cat] = { total: 0, failed: 0 };
        byCategory[cat].total++;
        if (r.status === "FAIL") byCategory[cat].failed++;
      }
      return Object.entries(byCategory).map(([category, stats]) => ({
        category,
        total: stats.total,
        failed: stats.failed,
        failureRate: stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0,
      }));
    },
    exampleParams: { runId: "run_20260610_xxxx" },
  },
  {
    id: "find_flaky_tests",
    name: "Find Flaky Tests",
    description: "Identifies tests that flip between PASS and FAIL across recent runs",
    query: async (params) => {
      const lookback = (params.lookbackRuns as number) || 5;
      const recentRuns = [...RUNS]
        .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
        .slice(0, lookback);
      const testHistory: Record<string, { statuses: string[]; runIds: string[] }> = {};
      for (const run of recentRuns) {
        const results = getTestResultsForRun(run.id);
        for (const r of results) {
          if (!testHistory[r.id]) testHistory[r.id] = { statuses: [], runIds: [] };
          testHistory[r.id].statuses.push(r.status);
          testHistory[r.id].runIds.push(run.id);
        }
      }
      return Object.entries(testHistory)
        .filter(([, h]) => {
          if (h.statuses.length < 2) return false;
          let flips = 0;
          for (let i = 1; i < h.statuses.length; i++) {
            if (h.statuses[i] !== h.statuses[i - 1]) flips++;
          }
          return flips > 0;
        })
        .map(([id, h]) => ({
          testId: id,
          flips: h.statuses.filter((s, i) => i > 0 && s !== h.statuses[i - 1]).length,
          totalRuns: h.statuses.length,
          statusSequence: h.statuses.join(" → "),
          flakinessScore: Math.round(
            (h.statuses.filter((s, i) => i > 0 && s !== h.statuses[i - 1]).length /
              (h.statuses.length - 1)) *
              100,
          ),
          runIds: h.runIds,
        }))
        .sort((a, b) => b.flakinessScore - a.flakinessScore);
    },
    exampleParams: { lookbackRuns: 5 },
  },
  {
    id: "compute_pass_rate_trend",
    name: "Pass Rate Trend",
    description: "Computes pass rate trend over recent runs",
    query: async (params) => {
      const lookback = (params.lookbackRuns as number) || 10;
      const recentRuns = [...RUNS]
        .sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime())
        .slice(-lookback);
      return recentRuns.map((r) => ({
        runId: r.id,
        label: r.started.slice(0, 16),
        passRate: r.passPct,
        env: r.env,
        build: r.build,
      }));
    },
    exampleParams: { lookbackRuns: 10 },
  },
  {
    id: "get_env_summary",
    name: "Environment Summary",
    description: "Returns pass rates, trends, and alerts per environment",
    query: async () => {
      const groups: Record<string, Run[]> = {};
      for (const run of RUNS) {
        const key = `${run.target}/${run.env}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(run);
      }
      return Object.entries(groups).map(([label, runs]) => {
        const sorted = [...runs].sort(
          (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
        );
        const latest = sorted[0];
        const avgPassRate = Math.round(sorted.reduce((s, r) => s + r.passPct, 0) / sorted.length);
        const trend = sorted.length > 1 ? latest.passPct - sorted[1].passPct : 0;
        return { label, avgPassRate, trend, latestRun: latest.label, failures: latest.failures };
      });
    },
    exampleParams: {},
  },
  {
    id: "get_test_detail_history",
    name: "Test Detail History",
    description: "Returns history of a specific test across all runs",
    query: async (params) => {
      const testId = params.testId as string;
      const history: {
        runId: string;
        status: string;
        duration: number;
        env: string;
        started: string;
      }[] = [];
      for (const run of RUNS) {
        const results = getTestResultsForRun(run.id);
        const match = results.find((r) => r.id === testId);
        if (match) {
          history.push({
            runId: run.id,
            status: match.status,
            duration: match.duration,
            env: run.env,
            started: run.started,
          });
        }
      }
      history.sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime());
      const passes = history.filter((h) => h.status === "PASS").length;
      return {
        testId,
        totalRuns: history.length,
        passRate: history.length > 0 ? Math.round((passes / history.length) * 100) : 0,
        avgDuration:
          history.length > 0
            ? Math.round(history.reduce((s, h) => s + h.duration, 0) / history.length)
            : 0,
        history,
      };
    },
    exampleParams: { testId: "ad_0" },
  },
];

export async function executeDataQuery(
  queryId: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const q = DATA_QUERIES.find((dq) => dq.id === queryId);
  if (!q) throw new Error(`Unknown data query: ${queryId}`);
  return q.query(params);
}

export function getDataQueryById(id: string): DataQuery | undefined {
  return DATA_QUERIES.find((q) => q.id === id);
}

import type { ToolDefinition, ToolResult, ChartData } from "./types";
import { RUNS, getTestResultsForRun } from "@/lib/runs";
import { getAllPromotionDecisions } from "@/lib/promotions";

const PALETTE = ["#5b8af5", "#f59e0b", "#22c55e", "#a855f7", "#ef4444", "#06b6d4"];

// ── Tool: query_runs ─────────────────────────────────────────────────────────
const queryRuns: ToolDefinition = {
  name: "query_runs",
  description:
    "Get recent test runs with pass rates, failure counts, environments, and timeline. Use for questions about run history, trends, overall health, or 'what's the latest pass rate'.",
  parameters: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Max runs to return (default 10)" },
      env: {
        type: "string",
        description: "Filter by environment tier",
        enum: ["QA", "UAT", "PROD"],
      },
    },
  },
  async execute(args): Promise<ToolResult> {
    const limit = (args.limit as number) || 10;
    const envFilter = args.env as string | undefined;

    let runs = [...RUNS].sort(
      (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
    );
    if (envFilter) runs = runs.filter((r) => r.env === envFilter);
    runs = runs.slice(0, limit);

    const rows = runs.map((r) => ({
      run: r.label || r.id,
      env: r.env,
      passRate: r.passPct,
      failures: r.failures ?? 0,
      date: r.started.slice(0, 10),
    }));

    const chartData: ChartData = {
      type: "line",
      title: `Pass Rate — Last ${runs.length} Runs${envFilter ? ` (${envFilter})` : ""}`,
      xKey: "run",
      yKeys: ["passRate"],
      rows: [...rows].reverse(),
      colors: [PALETTE[0]],
    };

    return { data: rows, chartData };
  },
};

// ── Tool: get_flaky_tests ────────────────────────────────────────────────────
const getFlakyTests: ToolDefinition = {
  name: "get_flaky_tests",
  description:
    "Find tests that flip between PASS and FAIL across recent runs. Use for flakiness, unstable tests, reliability, or 'which tests keep breaking'.",
  parameters: {
    type: "object",
    properties: {
      lookback: { type: "number", description: "Number of recent runs to analyze (default 5)" },
    },
  },
  async execute(args): Promise<ToolResult> {
    const lookback = (args.lookback as number) || 5;
    const recent = [...RUNS]
      .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
      .slice(0, lookback);

    const history: Record<string, string[]> = {};
    for (const run of recent) {
      for (const r of getTestResultsForRun(run.id)) {
        if (!history[r.id]) history[r.id] = [];
        history[r.id].push(r.status);
      }
    }

    const flaky = Object.entries(history)
      .map(([id, statuses]) => {
        const flips = statuses.filter((s, i) => i > 0 && s !== statuses[i - 1]).length;
        const score =
          statuses.length > 1 ? Math.round((flips / (statuses.length - 1)) * 100) : 0;
        return { id, flips, score, sequence: statuses.join("→"), runs: statuses.length };
      })
      .filter((t) => t.flips > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    const chartData: ChartData = {
      type: "bar",
      title: `Flaky Tests — Top ${Math.min(flaky.length, 10)} by Score`,
      xKey: "id",
      yKeys: ["score"],
      rows: flaky.slice(0, 10).map((t) => ({ id: t.id.slice(0, 16), score: t.score })),
      colors: [PALETTE[4]],
    };

    return { data: flaky, chartData };
  },
};

// ── Tool: compare_environments ───────────────────────────────────────────────
const compareEnvironments: ToolDefinition = {
  name: "compare_environments",
  description:
    "Compare avg pass rates and failure counts across QA, UAT, and PROD. Use for environment health, 'which env is struggling', or env comparison questions.",
  parameters: { type: "object", properties: {} },
  async execute(): Promise<ToolResult> {
    const byEnv: Record<string, { runs: number; totalPass: number; failures: number }> = {};

    for (const run of RUNS) {
      if (!byEnv[run.env]) byEnv[run.env] = { runs: 0, totalPass: 0, failures: 0 };
      byEnv[run.env].runs++;
      byEnv[run.env].totalPass += run.passPct;
      byEnv[run.env].failures += run.failures ?? 0;
    }

    const order = ["QA", "UAT", "PROD"];
    const rows = order
      .filter((e) => byEnv[e])
      .map((env) => {
        const s = byEnv[env];
        return {
          env,
          avgPassRate: s.runs > 0 ? Math.round(s.totalPass / s.runs) : 0,
          totalFailures: s.failures,
          runs: s.runs,
        };
      });

    const chartData: ChartData = {
      type: "column",
      title: "Avg Pass Rate by Environment",
      xKey: "env",
      yKeys: ["avgPassRate"],
      rows,
      colors: [PALETTE[2]],
    };

    return { data: rows, chartData };
  },
};

// ── Tool: get_promotion_status ───────────────────────────────────────────────
const getPromotionStatus: ToolDefinition = {
  name: "get_promotion_status",
  description:
    "Check UAT→PROD promotion gate decisions (promote / block / pending). Use for deployment readiness, 'can we go to PROD', or promotion gate questions.",
  parameters: { type: "object", properties: {} },
  async execute(): Promise<ToolResult> {
    const decisions = getAllPromotionDecisions();
    const promoted = decisions.filter((d) => d.decision === "promote").length;
    const blocked = decisions.filter((d) => d.decision === "block").length;
    const pending = decisions.filter((d) => d.decision === "pending").length;

    const chartData: ChartData = {
      type: "pie",
      title: "Promotion Gate Outcomes",
      xKey: "status",
      yKeys: ["count"],
      rows: [
        { status: "Promoted", count: promoted },
        { status: "Blocked", count: blocked },
        { status: "Pending", count: pending },
      ].filter((r) => r.count > 0),
      colors: [PALETTE[2], PALETTE[4], PALETTE[1]],
    };

    return {
      data: {
        total: decisions.length,
        promoted,
        blocked,
        pending,
        recent: decisions.slice(0, 5),
      },
      chartData,
    };
  },
};

// ── Tool: get_failure_breakdown ──────────────────────────────────────────────
const getFailureBreakdown: ToolDefinition = {
  name: "get_failure_breakdown",
  description:
    "Break down test failures by category for a specific run (or the latest run). Use for 'why did tests fail', 'what categories are failing', or root cause analysis.",
  parameters: {
    type: "object",
    properties: {
      runId: {
        type: "string",
        description: "Specific run ID. Omit to use the latest run.",
      },
    },
  },
  async execute(args): Promise<ToolResult> {
    const runId = args.runId as string | undefined;
    const targetRun = runId
      ? RUNS.find((r) => r.id === runId)
      : [...RUNS].sort(
          (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
        )[0];

    if (!targetRun) return { data: { error: "No runs found" } };

    const results = getTestResultsForRun(targetRun.id);
    const byCategory: Record<string, { total: number; failed: number }> = {};

    for (const r of results) {
      const cat = r.category || "other";
      if (!byCategory[cat]) byCategory[cat] = { total: 0, failed: 0 };
      byCategory[cat].total++;
      if (r.status === "FAIL") byCategory[cat].failed++;
    }

    const rows = Object.entries(byCategory)
      .map(([category, s]) => ({
        category,
        failed: s.failed,
        total: s.total,
        passRate: s.total > 0 ? Math.round(((s.total - s.failed) / s.total) * 100) : 100,
      }))
      .sort((a, b) => b.failed - a.failed);

    const chartData: ChartData = {
      type: "bar",
      title: `Failures by Category — ${targetRun.label || targetRun.id}`,
      xKey: "category",
      yKeys: ["failed"],
      rows: rows.slice(0, 10).map((r) => ({ ...r, category: r.category.slice(0, 18) })),
      colors: [PALETTE[4]],
    };

    return {
      data: { runId: targetRun.id, label: targetRun.label, passPct: targetRun.passPct, rows },
      chartData,
    };
  },
};

export const TOOLS: ToolDefinition[] = [
  queryRuns,
  getFlakyTests,
  compareEnvironments,
  getPromotionStatus,
  getFailureBreakdown,
];

export function getToolByName(name: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.name === name);
}

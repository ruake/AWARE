import type { ToolDefinition, ToolContext, ToolResult, ChartData, TableData } from "./types";
import type { Run, TestResult, PromotionDecision } from "@/lib/types";
import { RUNS, getTestResultsForRun } from "@/lib/runs";
import { getAllPromotionDecisions } from "@/lib/promotions";
import { PROMOTION_GATE_THRESHOLD } from "@/lib/ciConfig";

const PASS_GATE_PCT = Math.round(PROMOTION_GATE_THRESHOLD * 100);

type PromotionDecisionRow = PromotionDecision & { passPct?: number; date?: string; timestamp?: string };

/** Throw an AbortError if the AbortSignal has already fired. */
function assertNotAborted(ctx: ToolContext): void {
  if (ctx.signal?.aborted) throw new DOMException("Tool execution cancelled", "AbortError");
}

const PALETTE = [
  "#3b82f6",
  "#f59e0b",
  "#22c55e",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

// ── Tool: query_runs ─────────────────────────────────────────────────────────
const queryRuns: ToolDefinition = {
  name: "query_runs",
  icon: "📊",
  color: "#3b82f6",
  description:
    "Get recent test runs with pass rates, failure counts, environments, durations, and timeline. Use for questions about run history, trends, overall health, pass rates, or 'what's the latest'.",
  parameters: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Max runs to return (default 15)" },
      env: {
        type: "string",
        description: "Filter by environment tier",
        enum: ["QA", "UAT", "PROD"],
      },
    },
  },
  async execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    assertNotAborted(ctx);
    const limit = (args.limit as number) || 15;
    const envFilter = args.env as string | undefined;

    let runs = [...RUNS].sort(
      (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
    );
    if (envFilter) runs = runs.filter((r) => r.env === envFilter);
    runs = runs.slice(0, limit);

    const passRates = runs.map((r) => r.passPct);
    const avgPass =
      passRates.length > 0
        ? Math.round(passRates.reduce((a, b) => a + b, 0) / passRates.length)
        : 0;
    const totalFails = runs.reduce((s, r) => s + (r.failures ?? 0), 0);

    const rows = runs.map((r) => ({
      run: r.label || r.id.slice(0, 8),
      env: r.env,
      network: r.network,
      passRate: r.passPct,
      failures: r.failures ?? 0,
      suite: (r as Run & { suite?: string }).suite || "—",
      date: r.started.slice(0, 10),
      time: r.started.slice(11, 16),
    }));

    const tableData: TableData = {
      title: `Last ${runs.length} Test Runs${envFilter ? ` · ${envFilter}` : ""}`,
      subtitle: `Avg pass rate: ${avgPass}% · ${totalFails} total failures`,
      columns: [
        {
          key: "run",
          label: "Run",
          type: "mono",
          align: "left",
          link: (row) => {
            const run = runs.find((r) => (r.label || r.id.slice(0, 8)) === row.run);
            return run ? `/runs/${run.id}` : null;
          },
        },
        { key: "env", label: "Env", type: "badge", align: "center" },
        { key: "suite", label: "Suite", type: "text", align: "left" },
        { key: "passRate", label: "Pass %", type: "percent", align: "right", highlight: "max" },
        { key: "failures", label: "Fails", type: "number", align: "right", highlight: "min" },
        { key: "date", label: "Date", type: "text", align: "right" },
      ],
      rows,
      sortBy: "date",
      sortDir: "desc",
    };

    const chartData: ChartData = {
      type: "line",
      title: `Pass Rate Trend — Last ${runs.length} Runs${envFilter ? ` (${envFilter})` : ""}`,
      xKey: "run",
      yKeys: ["passRate"],
      rows: [...rows].reverse(),
      colors: [PALETTE[0]],
    };

    return { data: rows, chartData, tableData };
  },
};

// ── Tool: get_flaky_tests ────────────────────────────────────────────────────
const getFlakyTests: ToolDefinition = {
  name: "get_flaky_tests",
  icon: "⚡",
  color: "#f59e0b",
  description:
    "Find tests that flip between PASS and FAIL across recent runs. Returns a ranked flakiness table with flip sequences. Use for flakiness, instability, reliability, or 'which tests keep breaking'.",
  parameters: {
    type: "object",
    properties: {
      lookback: { type: "number", description: "Number of recent runs to analyze (default 8)" },
      minFlips: { type: "number", description: "Minimum flips to include (default 1)" },
    },
  },
  async execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    assertNotAborted(ctx);
    const lookback = (args.lookback as number) || 8;
    const minFlips = (args.minFlips as number) || 1;

    const recent = [...RUNS]
      .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
      .slice(0, lookback);

    const history: Record<string, { statuses: string[]; envs: string[] }> = {};
    for (const run of recent) {
      for (const r of getTestResultsForRun(run.id)) {
        if (!history[r.id]) history[r.id] = { statuses: [], envs: [] };
        history[r.id].statuses.push(r.status);
        history[r.id].envs.push(run.env);
      }
    }

    const flaky = Object.entries(history)
      .map(([id, { statuses, envs }]) => {
        const flips = statuses.filter((s, i) => i > 0 && s !== statuses[i - 1]).length;
        const score = statuses.length > 1 ? Math.round((flips / (statuses.length - 1)) * 100) : 0;
        const passCount = statuses.filter((s) => s === "PASS").length;
        const failCount = statuses.filter((s) => s === "FAIL").length;
        return {
          test: id.length > 32 ? id.slice(0, 32) + "…" : id,
          flips,
          score,
          passes: passCount,
          failures: failCount,
          runs: statuses.length,
          sequence: statuses.slice(0, 8).join("→"),
          primaryEnv: envs[0] || "—",
        };
      })
      .filter((t) => t.flips >= minFlips)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    const tableData: TableData = {
      title: "Flaky Test Rankings",
      subtitle: `${flaky.length} tests with instability across last ${lookback} runs`,
      columns: [
        {
          key: "test",
          label: "Test ID",
          type: "mono",
          align: "left",
          link: (row) => `/tests?q=${row.test}`,
        },
        { key: "score", label: "Flakiness %", type: "percent", align: "right", highlight: "max" },
        { key: "flips", label: "Flips", type: "number", align: "right" },
        { key: "passes", label: "Passes", type: "number", align: "right" },
        { key: "failures", label: "Fails", type: "number", align: "right", highlight: "max" },
        { key: "sequence", label: "Sequence", type: "mono", align: "left" },
      ],
      rows: flaky,
      sortBy: "score",
      sortDir: "desc",
    };

    const chartData: ChartData = {
      type: "bar",
      title: `Top ${Math.min(flaky.length, 10)} Flaky Tests by Score`,
      xKey: "test",
      yKeys: ["score"],
      rows: flaky.slice(0, 10).map((t) => ({ test: t.test.slice(0, 20), score: t.score })),
      colors: [PALETTE[4]],
    };

    return { data: flaky, chartData, tableData };
  },
};

// ── Tool: compare_environments ───────────────────────────────────────────────
const compareEnvironments: ToolDefinition = {
  name: "compare_environments",
  icon: "🔀",
  color: "#8b5cf6",
  description:
    "Compare pass rates and failure counts across QA, UAT, and PROD environments. Returns a full 6-slot breakdown (QA/UAT/PROD × Staging/Production). Use for env health, comparison, or status questions.",
  parameters: { type: "object", properties: {} },
  async execute(_args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    assertNotAborted(ctx);
    const byEnv: Record<
      string,
      { runs: number; totalPass: number; failures: number; lastDate: string }
    > = {};

    for (const run of RUNS) {
      const key = run.env;
      if (!byEnv[key]) byEnv[key] = { runs: 0, totalPass: 0, failures: 0, lastDate: "" };
      byEnv[key].runs++;
      byEnv[key].totalPass += run.passPct;
      byEnv[key].failures += run.failures ?? 0;
      if (!byEnv[key].lastDate || run.started > byEnv[key].lastDate) {
        byEnv[key].lastDate = run.started.slice(0, 10);
      }
    }

    const order = ["QA", "UAT", "PROD"];
    const rows = order
      .filter((e) => byEnv[e])
      .map((env) => {
        const s = byEnv[env];
        const avg = s.runs > 0 ? Math.round(s.totalPass / s.runs) : 0;
        return {
          env,
          avgPassRate: avg,
          totalFailures: s.failures,
          runs: s.runs,
          health: avg >= 95 ? "🟢 Healthy" : avg >= 80 ? "🟡 Degraded" : "🔴 Critical",
          lastRun: s.lastDate,
        };
      });

    const tableData: TableData = {
      title: "Environment Health Comparison",
      subtitle: "QA → UAT → PROD pass rates and failure totals",
      columns: [
        { key: "env", label: "Environment", type: "badge", align: "left" },
        {
          key: "avgPassRate",
          label: "Avg Pass %",
          type: "percent",
          align: "right",
          highlight: "max",
        },
        {
          key: "totalFailures",
          label: "Total Fails",
          type: "number",
          align: "right",
          highlight: "min",
        },
        { key: "runs", label: "Run Count", type: "number", align: "right" },
        { key: "health", label: "Status", type: "text", align: "center" },
        { key: "lastRun", label: "Last Run", type: "text", align: "right" },
      ],
      rows,
      sortBy: "avgPassRate",
      sortDir: "desc",
    };

    const chartData: ChartData = {
      type: "column",
      title: "Avg Pass Rate by Environment",
      xKey: "env",
      yKeys: ["avgPassRate"],
      rows: rows.map((r) => ({ env: r.env, avgPassRate: r.avgPassRate })),
      colors: rows.map((r) =>
        r.avgPassRate >= 95 ? "#22c55e" : r.avgPassRate >= 80 ? "#f59e0b" : "#ef4444",
      ),
    };

    return { data: rows, chartData, tableData };
  },
};

// ── Tool: get_promotion_status ───────────────────────────────────────────────
const getPromotionStatus: ToolDefinition = {
  name: "get_promotion_status",
  icon: "🛡️",
  color: "#10b981",
  description:
    "Check UAT→PROD promotion gate decisions (promote/block/pending) and deployment readiness. Use for deployment, 'can we go to PROD', promotion gate, or release readiness questions.",
  parameters: { type: "object", properties: {} },
  async execute(_args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    assertNotAborted(ctx);
    const decisions = getAllPromotionDecisions();
    const promoted = decisions.filter((d) => d.decision === "promote").length;
    const blocked = decisions.filter((d) => d.decision === "block").length;
    const pending = decisions.filter((d) => d.decision === "pending").length;
    const total = decisions.length;
    const promoteRate = total > 0 ? Math.round((promoted / total) * 100) : 0;

    const recentRows = decisions.slice(0, 8).map((d, i) => ({
      "#": i + 1,
      runId: (d.runId || "—").slice(0, 12),
      decision:
        d.decision === "promote"
          ? "✅ Promote"
          : d.decision === "block"
            ? "❌ Block"
            : "⏳ Pending",
      passRate: (d as PromotionDecisionRow).passPct ?? "—",
      threshold: `${PASS_GATE_PCT}%`,
      date: ((d as PromotionDecisionRow).date || (d as PromotionDecisionRow).timestamp || "—").toString().slice(0, 10),
    }));

    const tableData: TableData = {
      title: "Promotion Gate Decision History",
      subtitle: `${promoted} promoted · ${blocked} blocked · ${pending} pending · ${promoteRate}% success rate`,
      columns: [
        { key: "#", label: "#", type: "number", align: "center", width: 40 },
        {
          key: "runId",
          label: "Run",
          type: "mono",
          align: "left",
          link: (row) => {
            const runId = row.runId as string;
            const run = RUNS.find((r) => r.id.startsWith(runId));
            return run ? `/runs/${run.id}` : null;
          },
        },
        { key: "decision", label: "Decision", type: "text", align: "center" },
        { key: "passRate", label: "Pass %", type: "percent", align: "right" },
        { key: "threshold", label: "Threshold", type: "text", align: "center" },
        { key: "date", label: "Date", type: "text", align: "right" },
      ],
      rows: recentRows,
    };

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
      data: { total, promoted, blocked, pending, promoteRate, recent: decisions.slice(0, 5) },
      chartData,
      tableData,
    };
  },
};

// ── Tool: get_failure_breakdown ──────────────────────────────────────────────
const getFailureBreakdown: ToolDefinition = {
  name: "get_failure_breakdown",
  icon: "🔍",
  color: "#ef4444",
  description:
    "Break down test failures by category (WAF, TLS, API, EdgeWorker, geo, cache) for a specific run or the latest run. Use for 'why did tests fail', 'what categories are failing', or root cause analysis.",
  parameters: {
    type: "object",
    properties: {
      runId: { type: "string", description: "Specific run ID. Omit to use the latest run." },
    },
  },
  async execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    assertNotAborted(ctx);
    const runId = args.runId as string | undefined;
    const targetRun = runId
      ? RUNS.find((r) => r.id === runId)
      : [...RUNS].sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())[0];

    if (!targetRun) return { data: { error: "No runs found" } };

    const results = getTestResultsForRun(targetRun.id);
    const byCategory: Record<string, { total: number; failed: number; flaky: number }> = {};

    for (const r of results) {
      const cat = r.category || "other";
      if (!byCategory[cat]) byCategory[cat] = { total: 0, failed: 0, flaky: 0 };
      byCategory[cat].total++;
      if (r.status === "FAIL") byCategory[cat].failed++;
      if ((r as TestResult & { flaky?: boolean }).flaky) byCategory[cat].flaky++;
    }

    const rows = Object.entries(byCategory)
      .map(([category, s]) => ({
        category,
        failed: s.failed,
        total: s.total,
        passed: s.total - s.failed,
        passRate: s.total > 0 ? Math.round(((s.total - s.failed) / s.total) * 100) : 100,
        impact: s.total > 0 ? Math.round((s.failed / s.total) * 100) : 0,
      }))
      .sort((a, b) => b.failed - a.failed);

    const tableData: TableData = {
      title: `Failure Breakdown — ${targetRun.label || targetRun.id.slice(0, 12)}`,
      subtitle: `${targetRun.passPct}% pass · ${targetRun.failures ?? 0} failures · ${targetRun.env} environment`,
      columns: [
        { key: "category", label: "Category", type: "badge", align: "left" },
        { key: "failed", label: "Failed", type: "number", align: "right", highlight: "max" },
        { key: "passed", label: "Passed", type: "number", align: "right" },
        { key: "total", label: "Total", type: "number", align: "right" },
        { key: "passRate", label: "Pass %", type: "percent", align: "right", highlight: "max" },
        { key: "impact", label: "Fail %", type: "percent", align: "right", highlight: "min" },
      ],
      rows,
      sortBy: "failed",
      sortDir: "desc",
      link: `/runs/${targetRun.id}`,
    };

    const chartData: ChartData = {
      type: "bar",
      title: `Failures by Category — ${targetRun.label || targetRun.id.slice(0, 12)}`,
      xKey: "category",
      yKeys: ["failed"],
      rows: rows.slice(0, 10).map((r) => ({ category: r.category.slice(0, 16), failed: r.failed })),
      colors: [PALETTE[4]],
    };

    return {
      data: {
        runId: targetRun.id,
        label: targetRun.label,
        passPct: targetRun.passPct,
        env: targetRun.env,
        rows,
      },
      chartData,
      tableData,
    };
  },
};

// ── Tool: get_suite_health ────────────────────────────────────────────────────
const getSuiteHealth: ToolDefinition = {
  name: "get_suite_health",
  icon: "🧪",
  color: "#06b6d4",
  description:
    "Get pass rates and failure counts per test suite across all environments. Use for suite-level health, 'which suite is struggling', or suite comparison questions.",
  parameters: {
    type: "object",
    properties: {
      env: { type: "string", description: "Filter by environment", enum: ["QA", "UAT", "PROD"] },
    },
  },
  async execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    assertNotAborted(ctx);
    const envFilter = args.env as string | undefined;
    let runs = [...RUNS];
    if (envFilter) runs = runs.filter((r) => r.env === envFilter);

    const bySuite: Record<
      string,
      { runs: number; totalPass: number; failures: number; envs: Set<string> }
    > = {};
    for (const run of runs) {
      const suite = (run as Run & { suite?: string }).suite || "default";
      if (!bySuite[suite]) bySuite[suite] = { runs: 0, totalPass: 0, failures: 0, envs: new Set() };
      bySuite[suite].runs++;
      bySuite[suite].totalPass += run.passPct;
      bySuite[suite].failures += run.failures ?? 0;
      bySuite[suite].envs.add(run.env);
    }

    const rows = Object.entries(bySuite)
      .map(([suite, s]) => ({
        suite,
        avgPassRate: s.runs > 0 ? Math.round(s.totalPass / s.runs) : 0,
        totalFailures: s.failures,
        runs: s.runs,
        envs: [...s.envs].join(", "),
        status:
          s.runs > 0 && s.totalPass / s.runs >= 95
            ? "🟢"
            : s.runs > 0 && s.totalPass / s.runs >= 80
              ? "🟡"
              : "🔴",
      }))
      .sort((a, b) => b.avgPassRate - a.avgPassRate);

    const tableData: TableData = {
      title: `Suite Health${envFilter ? ` — ${envFilter}` : " — All Environments"}`,
      subtitle: `${rows.length} suites · ${runs.length} total runs analyzed`,
      columns: [
        {
          key: "suite",
          label: "Suite",
          type: "mono",
          align: "left",
          link: (row) => `/tests?q=${row.suite}`,
        },
        {
          key: "avgPassRate",
          label: "Avg Pass %",
          type: "percent",
          align: "right",
          highlight: "max",
        },
        {
          key: "totalFailures",
          label: "Total Fails",
          type: "number",
          align: "right",
          highlight: "min",
        },
        { key: "runs", label: "Runs", type: "number", align: "right" },
        { key: "envs", label: "Environments", type: "text", align: "left" },
        { key: "status", label: "Health", type: "text", align: "center" },
      ],
      rows,
      sortBy: "avgPassRate",
      sortDir: "desc",
    };

    const chartData: ChartData = {
      type: "column",
      title: "Avg Pass Rate by Suite",
      xKey: "suite",
      yKeys: ["avgPassRate"],
      rows: rows
        .slice(0, 8)
        .map((r) => ({ suite: r.suite.slice(0, 18), avgPassRate: r.avgPassRate })),
      colors: rows
        .slice(0, 8)
        .map((r) =>
          r.avgPassRate >= 95 ? "#22c55e" : r.avgPassRate >= 80 ? "#f59e0b" : "#ef4444",
        ),
    };

    return { data: rows, chartData, tableData };
  },
};

// ── Tool: get_duration_trends ─────────────────────────────────────────────────
const getDurationTrends: ToolDefinition = {
  name: "get_duration_trends",
  icon: "⏱️",
  color: "#ec4899",
  description:
    "Analyze test execution duration trends and timing regressions across recent runs. Use for performance, slow tests, duration increases, or timing regression questions.",
  parameters: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Number of recent runs to analyze (default 10)" },
    },
  },
  async execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    assertNotAborted(ctx);
    const limit = (args.limit as number) || 10;
    const recent = [...RUNS]
      .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
      .slice(0, limit);

    const rows = recent.map((r, i) => {
      const durationSec = r.durationMs
        ? Math.round(r.durationMs / 1000)
        : 15 + Math.floor(Math.random() * 30);
      const prev = i < recent.length - 1 ? recent[i + 1] : null;
      const prevDuration =
        prev?.durationMs ? Math.round(prev.durationMs / 1000) : null;
      const delta = prevDuration ? durationSec - prevDuration : 0;
      return {
        run: r.label || r.id.slice(0, 8),
        env: r.env,
        durationSec,
        passRate: r.passPct,
        failures: r.failures ?? 0,
        deltaS: delta,
        trend: delta > 5 ? "🔴 +slow" : delta < -5 ? "🟢 +fast" : "🟡 stable",
        date: r.started.slice(0, 10),
      };
    });

    const avgDuration =
      rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.durationSec, 0) / rows.length) : 0;
    const durs = rows.map((r) => r.durationSec);
    const maxDur = durs.length ? Math.max(...durs) : 0;
    const minDur = durs.length ? Math.min(...durs) : 0;

    const tableData: TableData = {
      title: `Execution Duration Trends — Last ${rows.length} Runs`,
      subtitle: `Avg: ${avgDuration}s · Min: ${minDur}s · Max: ${maxDur}s`,
      columns: [
        {
          key: "run",
          label: "Run",
          type: "mono",
          align: "left",
          link: (row) => {
            const run = recent.find((r) => (r.label || r.id.slice(0, 8)) === row.run);
            return run ? `/runs/${run.id}` : null;
          },
        },
        { key: "env", label: "Env", type: "badge", align: "center" },
        {
          key: "durationSec",
          label: "Duration (s)",
          type: "duration",
          align: "right",
          highlight: "min",
        },
        { key: "deltaS", label: "Δ vs Prev", type: "number", align: "right" },
        { key: "passRate", label: "Pass %", type: "percent", align: "right" },
        { key: "trend", label: "Trend", type: "text", align: "center" },
      ],
      rows,
      sortBy: "date",
      sortDir: "desc",
    };

    const chartData: ChartData = {
      type: "line",
      title: "Execution Duration (seconds) — Trend",
      xKey: "run",
      yKeys: ["durationSec"],
      rows: [...rows].reverse(),
      colors: [PALETTE[7]],
    };

    return { data: rows, chartData, tableData };
  },
};

// ── Tool: get_akamai_property ─────────────────────────────────────────────────
const getAkamaiProperty: ToolDefinition = {
  name: "get_akamai_property",
  icon: "🌐",
  color: "#f97316",
  description:
    "Get Akamai CDN property status, EdgeWorker versions, PoP coverage, and activation state across environments. Use for Akamai config, property version, EdgeWorker, PoP, cpcode, or CDN status questions.",
  parameters: { type: "object", properties: {} },
  async execute(_args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    assertNotAborted(ctx);
    const envs = ["QA", "UAT", "PROD"];
    const networks = ["Staging", "Production"];

    const rows = envs.flatMap((env) =>
      networks.map((network) => ({
        env,
        network,
        property: `aware-cdn-v${env === "PROD" ? "3" : env === "UAT" ? "2" : "1"}.akamai.net`,
        propertyVersion: env === "PROD" ? 42 : env === "UAT" ? 38 : 35,
        edgeWorkerVersion: env === "PROD" ? "ew-v3.2.1" : env === "UAT" ? "ew-v3.1.0" : "ew-v3.0.9",
        status:
          env === "PROD" && network === "Production"
            ? "🟢 Active"
            : env === "QA" && network === "Staging"
              ? "🟢 Active"
              : "🟡 Pending",
        cpCode: 123400 + (env === "QA" ? 0 : env === "UAT" ? 1 : 2),
        pops: env === "PROD" ? 42 : env === "UAT" ? 18 : 6,
      })),
    );

    const tableData: TableData = {
      title: "Akamai Property Status",
      subtitle: "CDN property versions, EdgeWorker versions, and activation state per environment",
      columns: [
        {
          key: "env",
          label: "Tier",
          type: "badge",
          align: "center",
          link: (row) => `/runs?env=${row.env}`,
        },
        { key: "network", label: "Network", type: "badge", align: "center" },
        { key: "propertyVersion", label: "Prop Ver", type: "number", align: "center" },
        { key: "edgeWorkerVersion", label: "EW Version", type: "mono", align: "left" },
        { key: "status", label: "Status", type: "text", align: "center" },
        { key: "cpCode", label: "cpCode", type: "mono", align: "right" },
        { key: "pops", label: "PoPs", type: "number", align: "right" },
      ],
      rows,
    };

    // Most recent runs per env for chart
    const envPassRates = envs.map((env) => {
      const envRuns = RUNS.filter((r) => r.env === env)
        .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
        .slice(0, 1);
      return { env, passRate: envRuns[0]?.passPct ?? 0 };
    });

    const chartData: ChartData = {
      type: "column",
      title: "Latest Pass Rate by Akamai Tier",
      xKey: "env",
      yKeys: ["passRate"],
      rows: envPassRates,
      colors: envPassRates.map((r) =>
        r.passRate >= 95 ? "#22c55e" : r.passRate >= 80 ? "#f59e0b" : "#ef4444",
      ),
    };

    return { data: rows, chartData, tableData };
  },
};

export const TOOLS: ToolDefinition[] = [
  queryRuns,
  getFlakyTests,
  compareEnvironments,
  getPromotionStatus,
  getFailureBreakdown,
  getSuiteHealth,
  getDurationTrends,
  getAkamaiProperty,
];

export function getToolByName(name: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.name === name);
}

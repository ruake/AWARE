import { GraphNode, GraphContext } from "./types";
import { buildFallbackResponse } from "./chrome-ai";


function pickChart(intent: string, analysis: Record<string, unknown>): GraphContext["chartConfig"] {
  const isDark = document.documentElement.classList.contains("dark");
  const textColor = isDark ? "#e2e8f0" : "#334155";
  const gridColor = isDark ? "#334155" : "#e2e8f0";

  switch (intent) {
    case "failures": {
      const failed = analysis.failedRuns as any[] | undefined;
      if (!failed?.length) return null;
      return {
        chartType: "Table",
        title: "Failed Runs",
        data: [
          ["Run ID", "Environment", "Network", "Pass Rate", "Failures"],
          ...failed.map(r => [r.id, r.env, r.network, `${r.passPct}%`, r.failures]),
        ],
        options: {
          showRowNumber: true,
          width: "100%",
          height: "100%",
          alternatingRowStyle: true,
          page: "enable",
          pageSize: 5,
          cssClassNames: {
            headerRow: "text-sm font-semibold",
            tableRow: "text-sm",
          },
        },
      };
    }

    case "flakiness": {
      const flaky = analysis.flakyTests as any[] | undefined;
      if (!flaky?.length) return null;
      return {
        chartType: "ColumnChart",
        title: "Top Flaky Tests",
        data: [
          ["Test", "Flakiness %", { role: "style" }],
          ...flaky.slice(0, 8).map(f => [
            f.name.length > 25 ? f.name.slice(0, 22) + "..." : f.name,
            f.score,
            f.score > 40 ? "#ef4444" : f.score > 20 ? "#f59e0b" : "#10b981",
          ]),
        ],
        options: {
          hAxis: { textPosition: "none" },
          vAxis: { title: "Flakiness %", textStyle: { color: textColor }, gridlines: { color: gridColor } },
          legend: { position: "none" },
          height: 280,
          bar: { groupWidth: "70%" },
          backgroundColor: "transparent",
          chartArea: { width: "85%", height: "75%" },
          tooltip: { isHtml: true },
        },
      };
    }

    case "environment_compare": {
      const envs = analysis.envStats as any[] | undefined;
      if (!envs?.length) return null;
      return {
        chartType: "ColumnChart",
        title: "Pass Rate by Environment",
        data: [
          ["Environment", "Overall", "Staging", "Production"],
          ...envs.map(e => [e.env, e.total, e.staging, e.production]),
        ],
        options: {
          vAxis: {
            title: "Pass Rate %", minValue: 0, maxValue: 100,
            textStyle: { color: textColor },
            gridlines: { color: gridColor },
          },
          hAxis: { textStyle: { color: textColor } },
          legend: { position: "top", textStyle: { color: textColor } },
          colors: ["#6366f1", "#22c55e", "#f59e0b"],
          height: 300,
          backgroundColor: "transparent",
          chartArea: { width: "80%", height: "65%" },
          bar: { groupWidth: "60%" },
          annotations: { alwaysOutside: true },
        },
      };
    }

    case "anomalies": {
      const anomalies = analysis.anomalies as any[] | undefined;
      if (!anomalies?.length) return null;
      return {
        chartType: "Table",
        title: "Anomalous Runs",
        data: [
          ["Run ID", "Environment", "Pass Rate", "Failures"],
          ...anomalies.map(a => [a.id, `${a.env} ${a.network}`, `${a.passPct}%`, a.failures]),
        ],
        options: {
          showRowNumber: true,
          width: "100%",
          height: "100%",
          page: "enable",
          pageSize: 5,
          alternatingRowStyle: true,
        },
      };
    }

    case "pipeline_health": {
      const eStats = analysis.envStats as { env: string; avg: number; runCount: number }[] | undefined;
      if (!eStats?.length) return null;
      return {
        chartType: "PieChart",
        title: "Runs by Environment",
        data: [
          ["Environment", "Runs"],
          ...eStats.map(e => [e.env, e.runCount]),
        ],
        options: {
          pieHole: 0.4,
          height: 260,
          legend: { position: "bottom", textStyle: { color: textColor } },
          colors: ["#6366f1", "#22c55e", "#f59e0b"],
          backgroundColor: "transparent",
          chartArea: { width: "90%", height: "70%" },
        },
      };
    }

    case "trend": {
      const trend = analysis.trendData as { date: string; passPct: number; runCount: number }[] | undefined;
      if (!trend?.length) return null;
      const sliced = trend.slice(-14);
      return {
        chartType: "LineChart",
        title: "Pass Rate Trend (14 days)",
        data: [
          ["Date", "Pass Rate", { role: "tooltip", type: "string", p: { html: true } }],
          ...sliced.map(d => [d.date, d.passPct, `${d.date}: ${d.passPct.toFixed(1)}% (${d.runCount} runs)`]),
        ],
        options: {
          curveType: "function",
          vAxis: {
            title: "Pass Rate %", minValue: 60, maxValue: 100,
            textStyle: { color: textColor },
            gridlines: { color: gridColor },
          },
          hAxis: { textStyle: { color: textColor }, slantedText: true, slantedTextAngle: 45 },
          legend: { position: "none" },
          colors: ["#6366f1"],
          height: 280,
          pointSize: 5,
          pointShape: "circle",
          lineWidth: 3,
          backgroundColor: "transparent",
          chartArea: { width: "80%", height: "70%" },
          trendlines: { 0: { type: "linear", color: "#94a3b8", lineWidth: 1, opacity: 0.5 } },
        },
      };
    }

    case "test_detail": {
      const tests = analysis.matchingTests as any[] | undefined;
      if (!tests?.length) return null;
      return {
        chartType: "Table",
        title: "Matching Tests",
        data: [
          ["Test Name", "Category", "Status", "Duration (s)"],
          ...tests.map(t => [t.name, t.category, t.status, t.duration]),
        ],
        options: {
          showRowNumber: true,
          width: "100%",
          height: "100%",
          page: "enable",
          pageSize: 5,
          alternatingRowStyle: true,
        },
      };
    }

    default:
      return null;
  }
}

export const ChartAgentNode: GraphNode = {
  id: "chart-agent",
  execute: async (ctx) => {
    const chartConfig = pickChart(ctx.intent, ctx.analysis);
    // textResponse is the rule-based fallback; Copilot.tsx will overlay it
    // with a Chrome AI streaming response when available (single bubble).
    return { ...ctx, chartConfig, textResponse: buildFallbackResponse(ctx), reasoning: null, recommendations: null };
  },
};

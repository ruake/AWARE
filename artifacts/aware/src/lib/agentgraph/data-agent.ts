import { GraphNode, GraphContext } from "./types";
import { computeFlakiness, computePassRateTrend, computeCategoryHeatmap } from "@/lib/analytics";

export const DataAgentNode: GraphNode = {
  id: "data-agent",
  execute: async (ctx) => {
    const { runs, testResults, intent } = ctx;
    const analysis: Record<string, unknown> = {};

    switch (intent) {
      case "failures": {
        const failed = runs.filter(r => r.status === "FAIL").slice(0, 10);
        const totalFailures = runs.filter(r => r.status === "FAIL").length;
        analysis.intent = "failures";
        analysis.totalRuns = runs.length;
        analysis.totalFailures = totalFailures;
        analysis.failureRate = runs.length ? Math.round((totalFailures / runs.length) * 100) : 0;
        analysis.failedRuns = failed.map(r => ({
          id: r.id, env: r.env, network: r.network, passPct: r.passPct,
          failures: r.failures, duration: r.duration, started: r.started,
        }));
        break;
      }

      case "flakiness": {
        const flaky = computeFlakiness(runs, testResults).slice(0, 10);
        analysis.intent = "flakiness";
        analysis.flakyTests = flaky.map(f => ({
          name: f.testName, category: f.category,
          score: Number((f.score * 100).toFixed(0)),
          runCount: f.runCount,
        }));
        analysis.totalFlaky = flaky.length;
        break;
      }

      case "environment_compare": {
        const envStats = ["QA", "UAT", "PROD"].map(env => {
          const envRuns = runs.filter(r => r.env === env);
          const staging = envRuns.filter(r => r.network === "staging");
          const prod = envRuns.filter(r => r.network === "production");
          const avg = (arr: typeof runs) =>
            arr.length ? Math.round(arr.reduce((s, r) => s + r.passPct, 0) / arr.length) : 0;
          return {
            env, total: avg(envRuns), staging: avg(staging),
            production: avg(prod), runCount: envRuns.length,
          };
        });
        analysis.intent = "environment_compare";
        analysis.envStats = envStats;
        analysis.heatmap = computeCategoryHeatmap(runs, testResults);
        break;
      }

      case "anomalies": {
        const anomalies = runs.filter(r => r.passPct < 85 && r.status === "FAIL");
        analysis.intent = "anomalies";
        analysis.anomalies = anomalies.map(r => ({
          id: r.id, env: r.env, network: r.network,
          passPct: r.passPct, failures: r.failures, started: r.started,
        }));
        analysis.totalAnomalies = anomalies.length;
        analysis.avgPassRate = runs.length
          ? Math.round(runs.reduce((s, r) => s + r.passPct, 0) / runs.length)
          : 0;
        break;
      }

      case "pipeline_health": {
        const total = runs.length;
        const failedCount = runs.filter(r => r.status === "FAIL").length;
        const passRate = total
          ? Math.round(runs.reduce((s, r) => s + r.passPct, 0) / total)
          : 0;
        analysis.intent = "pipeline_health";
        analysis.totalRuns = total;
        analysis.passRate = passRate;
        analysis.failedCount = failedCount;
        analysis.failureRate = total ? Math.round((failedCount / total) * 100) : 0;
        analysis.envStats = ["QA", "UAT", "PROD"].map(env => {
          const envRuns = runs.filter(r => r.env === env);
          const avg = envRuns.length
            ? Math.round(envRuns.reduce((s, r) => s + r.passPct, 0) / envRuns.length)
            : 0;
          return { env, avg, runCount: envRuns.length };
        });
        break;
      }

      case "trend": {
        analysis.intent = "trend";
        analysis.trendData = computePassRateTrend(runs, 30);
        break;
      }

      case "test_detail": {
        const query = ctx.query.toLowerCase();
        const match = testResults.filter(r =>
          r.name.toLowerCase().includes(query) ||
          r.testCaseId.toLowerCase().includes(query) ||
          (r.tags && r.tags.some(t => t.toLowerCase().includes(query)))
        ).slice(0, 10);
        analysis.intent = "test_detail";
        analysis.matchingTests = match.map(r => ({
          id: r.id, name: r.name, category: r.category, status: r.status,
          duration: r.duration, tags: r.tags, error: r.error,
        }));
        break;
      }

      default: {
        const passRate = runs.length
          ? Math.round(runs.reduce((s, r) => s + r.passPct, 0) / runs.length)
          : 0;
        analysis.intent = "unknown";
        analysis.totalRuns = runs.length;
        analysis.passRate = passRate;
        analysis.failedCount = runs.filter(r => r.status === "FAIL").length;
        break;
      }
    }

    return { ...ctx, analysis };
  },
};

import type { AIAnalysisRequest, AIAnalysisResult, AIInsight } from "./types";
import { AI_USE_CASES, getUseCaseById } from "./useCases";
import { buildAIContext, buildSystemPrompt } from "./context";
import { getSystemPromptForUseCase } from "./prompts";
import { getProvider, getLLMConfig, truncateMessagesToFit } from "@/lib/llm";
import type { LLMMessage } from "@/lib/types";
import { RUNS, DIFF_ROWS, getTestResultsForRun } from "@/lib/runs";
import { getTestCases, computeTestStats } from "@/lib/testCases";
import { getTestSuites } from "@/lib/testSuites";
import { LangGraph, buildDefaultGraph } from "./langGraph";
import type { LangGraphNode, ChartOutput, LangGraphExecutionState } from "./langGraphTypes";
import {
  buildTable,
  buildColumnChart,
  buildBarChart,
  buildPieChart,
  buildLineChart,
  buildAreaChart,
} from "./chartBuilder";
import { logInfo, logDebug, logError, startTiming, endTiming } from "./debugLogger";
import { getSkillDefinition } from "./skillRegistry";
import { enforceChartStandards, enforceChartPresence } from "./chartStandards";
import { serializeCharts } from "./chartBuilder";

export async function runAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
  const useCase = getUseCaseById(request.useCaseId);
  if (!useCase) {
    return {
      useCaseId: request.useCaseId,
      summary: "Unknown analysis type",
      details: `No analysis use case found for "${request.useCaseId}". Available: ${AI_USE_CASES.map((u) => u.id).join(", ")}`,
      data: null,
      confidence: 0,
      recommendations: [],
      generatedAt: new Date().toISOString(),
    };
  }

  try {
    const context = buildAIContext();
    const systemPrompt = buildSystemPrompt(context);
    const useCasePrompt = getSystemPromptForUseCase(request.useCaseId);

    const provider = getProvider();
    const fullPrompt = `${systemPrompt}\n\n${useCasePrompt}\n\nUser request: ${JSON.stringify(request.parameters)}\n\nData context:\n${JSON.stringify(context, null, 2)}`;

    let result: AIAnalysisResult;
    try {
      const completion = await provider.complete({
        messages: [
          { role: "system", content: fullPrompt },
          {
            role: "user",
            content: `Run ${request.useCaseId} analysis with these parameters: ${JSON.stringify(request.parameters)}`,
          },
        ],
        temperature: 0.3,
        maxTokens: 2048,
      });
      result = {
        useCaseId: request.useCaseId,
        summary: completion.content.slice(0, 200),
        details: completion.content,
        data: null,
        confidence: 0.7,
        recommendations: extractRecommendations(completion.content),
        generatedAt: new Date().toISOString(),
      };
    } catch {
      result = runFallbackAnalysis(request);
    }
    return result;
  } catch (err) {
    return {
      useCaseId: request.useCaseId,
      summary: "Analysis failed",
      details: `Error running analysis: ${err instanceof Error ? err.message : "Unknown error"}`,
      data: null,
      confidence: 0,
      recommendations: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function runLangGraphAnalysis(
  request: AIAnalysisRequest,
  onNodeChange?: (state: LangGraphExecutionState) => void,
): Promise<AIAnalysisResult> {
  const analysisNode = buildAnalysisNode(request.useCaseId);
  const graph = buildDefaultGraph(analysisNode);
  const result = await graph.execute(request, onNodeChange);

  // Enforce chart & response standards on the result
  if (result.details) {
    result.details = enforceChartStandards(result.details);
    result.details = enforceChartPresence(result.details, () => {
      const ctx = buildAIContext();
      return buildTable(
        "Run Summary",
        ["Run", "Rate", "Status"],
        RUNS.slice(-5).map((r) => [r.id.slice(0, 7), `${r.passPct}%`, r.status]),
      );
    });
  }

  return result;
}

/**
 * Run a free-text LLM chat through the LangGraph pipeline.
 * Wraps the provider call with context building, debug logging, and
 * chart extraction so that every interaction produces logs + charts.
 */
export async function runLangGraphChat(
  messages: LLMMessage[],
  onNodeChange?: (state: LangGraphExecutionState) => void,
): Promise<{ response: string; charts: ChartOutput[] }> {
  const graph = new LangGraph();

  graph.addNode({
    id: "data_fetch",
    label: "Data Fetch",
    description: "Loading current test data",
    execute: async (ctx) => {
      logInfo("data_fetch", "Fetching store data for context");
      return { status: "completed", dataUpdate: { timestamp: Date.now() } };
    },
  });

  graph.addNode({
    id: "context_build",
    label: "Context Build",
    description: "Building system prompt from live data",
    execute: async (ctx) => {
      const context = buildAIContext();
      const systemPrompt = buildSystemPrompt(context);
      logInfo(
        "context_build",
        "Context built",
        `${context.stats.totalRuns} runs, ${context.stats.totalTests} tests`,
      );
      return { status: "completed", dataUpdate: { systemPrompt } };
    },
  });

  graph.addNode({
    id: "llm_chat",
    label: "LLM Chat",
    description: "Sending conversation to LLM provider",
    execute: async (ctx) => {
      const systemPrompt = ctx.data.systemPrompt as string;
      const provider = getProvider();
      const config = getLLMConfig();

      const chatMessages: LLMMessage[] = [
        { role: "system", content: systemPrompt },
        ...messages.filter((m) => m.role !== "system"),
      ];

      logInfo(
        "llm_chat",
        `Sending ${chatMessages.length} messages to ${config.model || config.provider}`,
      );
      startTiming("llm_chat");

      // Truncate to fit context window before sending
      const truncated = truncateMessagesToFit(chatMessages);
      if (truncated.length < chatMessages.length) {
        logInfo(
          "llm_chat",
          `Truncated ${chatMessages.length - truncated.length} messages to fit context window`,
        );
      }

      const completion = await provider.complete({
        messages: truncated,
        temperature: 0.3,
        maxTokens: config.maxTokens || 2048,
      });

      const duration = endTiming("llm_chat");
      logDebug("llm_chat", `Response received in ${duration}ms`);

      if (completion.finishReason === "error") {
        const isContextError = /context window|context_window|prompt tokens exceed/i.test(
          completion.content,
        );
        if (isContextError) {
          logError("llm_chat", "Context window exceeded — retrying with stricter truncation");
          // Retry with aggressive truncation: keep only system prompt + current user message
          const retryMessages: LLMMessage[] = [
            { role: "system", content: systemPrompt },
            ...messages.filter((m) => m.role !== "system").slice(-2),
          ];
          const retryResult = await provider.complete({
            messages: retryMessages,
            temperature: 0.3,
            maxTokens: config.maxTokens || 2048,
          });
          if (retryResult.finishReason !== "error") {
            const charts = extractChartBlocksFromText(retryResult.content);
            return {
              status: "completed",
              dataUpdate: { details: retryResult.content, response: retryResult.content },
              charts,
            };
          }
        }
        return { status: "error", error: completion.content };
      }

      const charts = extractChartBlocksFromText(completion.content);
      if (charts.length > 0) {
        logDebug("llm_chat", `Extracted ${charts.length} chart(s) from LLM response`);
      }

      return {
        status: "completed",
        dataUpdate: { details: completion.content, response: completion.content },
        charts,
      };
    },
  });

  graph.addNode({
    id: "chart_render",
    label: "Chart Render",
    description: "Preparing chart data for output",
    execute: async (ctx) => {
      logInfo("chart_render", `${ctx.charts.length} chart(s) in response`);
      return { status: "completed" };
    },
  });

  graph.addNode({
    id: "response",
    label: "Response",
    description: "Finalizing output",
    execute: async (ctx) => {
      logInfo("response", "LLM chat response ready");
      return { status: "completed" };
    },
  });

  graph.addEdge({ from: "data_fetch", to: "context_build" });
  graph.addEdge({ from: "context_build", to: "llm_chat" });
  graph.addEdge({ from: "llm_chat", to: "chart_render" });
  graph.addEdge({ from: "chart_render", to: "response" });

  const result = await graph.execute({ useCaseId: "llm_chat", parameters: {} }, onNodeChange);

  // Enforce chart & response standards
  let detail = result.details || result.summary;
  detail = enforceChartStandards(detail);
  detail = enforceChartPresence(detail, () =>
    buildTable("Run Summary", ["Run", "Rate", "Status"], []),
  );

  return {
    response: detail,
    charts: ((result.data as Record<string, unknown>)?.["charts"] as ChartOutput[]) || [],
  };
}

const CHART_PATTERN = /```chart\s*\n?([\s\S]*?)```/g;

function extractChartBlocksFromText(text: string): ChartOutput[] {
  const charts: ChartOutput[] = [];
  let match: RegExpExecArray | null;
  while ((match = CHART_PATTERN.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.type && parsed.headers && parsed.rows) {
        charts.push({
          type: parsed.type,
          title: parsed.title || "",
          headers: parsed.headers,
          rows: parsed.rows,
          colors: parsed.colors,
          options: parsed.options,
        });
      }
    } catch {
      // skip malformed chart blocks
    }
  }
  CHART_PATTERN.lastIndex = 0;
  return charts;
}

function buildAnalysisNode(useCaseId: string): LangGraphNode {
  return {
    id: "analysis",
    label: "Analysis",
    description: `Running ${useCaseId} analysis`,
    execute: async (ctx) => {
      const skillDef = getSkillDefinition(useCaseId);
      logInfo("analysis", `Starting ${useCaseId}`, skillDef?.name || useCaseId);
      startTiming("analysis_execution");

      let result: AIAnalysisResult;
      try {
        result = runFallbackAnalysis({ useCaseId, parameters: ctx.request.parameters || {} });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logError("analysis", "Fallback analysis failed", msg);
        return { status: "error", error: msg };
      }

      const analysisDuration = endTiming("analysis_execution");
      logDebug("analysis", `Analysis completed in ${analysisDuration}ms`);

      const charts = extractChartBlocksFromText(result.details || "");

      logDebug("chart_render", `Extracted ${charts.length} charts from result`);

      return {
        status: "completed",
        dataUpdate: {
          summary: result.summary,
          details: result.details,
          confidence: result.confidence,
          recommendations: result.recommendations,
          rawResult: result,
        },
        charts,
      };
    },
  };
}

export function runFallbackAnalysis(request: AIAnalysisRequest): AIAnalysisResult {
  startTiming(`fallback_${request.useCaseId}`);
  let result: AIAnalysisResult;

  switch (request.useCaseId) {
    case "failure-analysis":
      result = fallbackFailureAnalysis(request);
      break;
    case "flaky-detection":
      result = fallbackFlakyDetection(request);
      break;
    case "anomaly-detection":
      result = fallbackAnomalyDetection();
      break;
    case "risk-scoring":
      result = fallbackRiskScoring(request);
      break;
    case "env-comparison":
      result = fallbackEnvComparison();
      break;
    case "category-health":
      result = fallbackCategoryHealth();
      break;
    case "coverage-gap":
      result = fallbackCoverageGap();
      break;
    case "smart-alerting":
      result = fallbackSmartAlerting();
      break;
    case "run-frequency":
      result = fallbackRunFrequency();
      break;
    case "suite-health":
      result = fallbackSuiteHealth();
      break;
    case "quality-gate":
      result = fallbackQualityGate();
      break;
    case "duration-budget":
      result = fallbackDurationBudget();
      break;
    case "test-redundancy":
      result = fallbackRedundancyDetection();
      break;
    case "regression-prediction":
      result = fallbackRegressionPrediction();
      break;
    case "performance-trends":
      result = fallbackPerformanceTrends();
      break;
    case "root-cause-analysis":
      result = fallbackRootCauseAnalysis();
      break;
    case "failure-clustering":
      result = fallbackFailureClustering();
      break;
    case "cross-category-correlation":
      result = fallbackCrossCategoryCorrelation();
      break;
    case "trend-forecasting":
      result = fallbackTrendForecasting();
      break;
    case "failure-impact":
      result = fallbackFailureImpact();
      break;
    case "env-drift":
      result = fallbackEnvDrift();
      break;
    case "build-risk-assessment":
      result = fallbackBuildRiskAssessment(request);
      break;
    case "promotion-decision-support":
      result = fallbackPromotionDecisionSupport();
      break;
    case "test-doc-gen":
      result = fallbackTestDocGen();
      break;
    case "release-readiness":
      result = fallbackReleaseReadiness();
      break;
    case "env-health-summary":
      result = fallbackEnvHealthSummary();
      break;
    case "regression-report":
      result = fallbackRegressionReport();
      break;
    case "setup-guide":
      result = fallbackSetupGuide();
      break;
    default:
      result = genericFallback(request);
  }

  const duration = endTiming(`fallback_${request.useCaseId}`);
  logDebug("analysis", `Fallback ${request.useCaseId} completed in ${duration}ms`);
  return result;
}

function fallbackFailureAnalysis(request: AIAnalysisRequest): AIAnalysisResult {
  const runId = (request.parameters.runId as string) || RUNS[RUNS.length - 1]?.id;
  const results = runId ? getTestResultsForRun(runId) : [];
  const failuresArr = results.filter((r) => r.status === "FAIL");
  const byCategory: Record<string, { total: number; failed: number; tests: string[] }> = {};
  for (const r of results) {
    const cat = r.category || "Unknown";
    if (!byCategory[cat]) byCategory[cat] = { total: 0, failed: 0, tests: [] };
    byCategory[cat].total++;
    if (r.status === "FAIL") {
      byCategory[cat].failed++;
      byCategory[cat].tests.push(r.name);
    }
  }
  const categoryBreakdown = Object.entries(byCategory)
    .filter(([, s]) => s.failed > 0)
    .sort(([, a], [, b]) => b.failed - a.failed);
  const topFailures = failuresArr.slice(0, 5).map((r) => r.name);

  const failChart = buildBarChart(
    "Failures by Category",
    ["Category", "Failures"],
    categoryBreakdown.map(([cat, s]) => [cat, s.failed]),
    ["#ef4444"],
    { legend: { position: "none" } },
  );

  const failTable = buildTable(
    "Failure Details",
    ["Category", "Failed/Total", "Failure Rate", "Tests"],
    categoryBreakdown.map(([cat, s]) => [
      cat,
      `${s.failed}/${s.total}`,
      `${Math.round((s.failed / s.total) * 100)}%`,
      s.tests.slice(0, 3).join(", ") + (s.tests.length > 3 ? "..." : ""),
    ]),
  );

  const summary =
    failuresArr.length === 0
      ? `No failures in run ${runId}. All ${results.length} tests passed.`
      : `Found ${failuresArr.length} failures in ${results.length} tests (${Math.round((failuresArr.length / results.length) * 100)}% failure rate). Top categories: ${categoryBreakdown
          .slice(0, 3)
          .map(([c, s]) => `${c} (${s.failed}/${s.total})`)
          .join("; ")}.`;

  const total = results.length;
  const passRate = total > 0 ? Math.round(((total - failuresArr.length) / total) * 100) : 0;

  const summaryTable = buildTable(
    "Summary",
    ["Metric", "Value"],
    [
      ["Total tests", total],
      ["Failures", failuresArr.length],
      ["Pass rate", `${passRate}%`],
      ["Categories with failures", categoryBreakdown.length],
    ],
  );

  const charts = [summaryTable, failChart, failTable];
  const chartBlock = charts
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  return {
    useCaseId: "failure-analysis",
    summary,
    details: `## Failure Analysis — ${runId}\n\n${chartBlock}\n\n### Top Failing Tests\n${topFailures.map((n, i) => `${i + 1}. \`${n}\``).join("\n")}`,
    data: { runId, totalTests: total, failures: failuresArr.length, byCategory },
    confidence: 1,
    recommendations:
      failuresArr.length > 0
        ? [
            `Investigate ${Object.values(byCategory).find((s) => s.failed > 0)?.tests[0] || "failures"}`,
            categoryBreakdown.length > 0 ? `Focus on ${categoryBreakdown[0]?.[0]} category` : "",
            failuresArr.length > 5
              ? "Consider rolling back the last build change"
              : "Review individual failures for patterns",
          ].filter(Boolean)
        : ["No action needed", "Monitor next run for regressions"],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackFlakyDetection(request: AIAnalysisRequest): AIAnalysisResult {
  const lookback = (request.parameters.lookbackRuns as number) || 5;
  const recentRuns = [...RUNS]
    .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
    .slice(0, lookback);
  const testHistory: Record<string, string[]> = {};
  for (const run of recentRuns) {
    const results = getTestResultsForRun(run.id);
    for (const r of results) {
      if (!testHistory[r.id]) testHistory[r.id] = [];
      testHistory[r.id].push(r.status);
    }
  }
  const flaky = Object.entries(testHistory)
    .filter(([, statuses]) => statuses.length >= 2)
    .map(([id, statuses]) => {
      let flips = 0;
      for (let i = 1; i < statuses.length; i++) if (statuses[i] !== statuses[i - 1]) flips++;
      return {
        id,
        flips,
        score: Math.round((flips / (statuses.length - 1)) * 100),
        sequence: statuses.join(" → "),
      };
    })
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score);

  const flakyChart = buildBarChart(
    "Flakiness Scores",
    ["Test", "Flakiness %"],
    flaky.slice(0, 10).map((f) => [f.id, f.score]),
    ["#f59e0b"],
    { legend: { position: "none" }, vAxis: { minValue: 0, maxValue: 100 } },
  );

  const flakyTable = buildTable(
    "Flaky Tests Detail",
    ["Test ID", "Flakiness", "Status Sequence"],
    flaky.slice(0, 15).map((f) => [f.id, `${f.score}%`, f.sequence]),
  );

  const summary =
    flaky.length === 0
      ? `No flaky tests detected across the last ${lookback} runs.`
      : `Found ${flaky.length} flaky tests across ${lookback} runs. Top: ${flaky
          .slice(0, 3)
          .map((f) => `${f.id} (${f.score}% flakiness)`)
          .join(", ")}.`;

  const chartBlock = [flakyChart, flakyTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  return {
    useCaseId: "flaky-detection",
    summary,
    details: `## Flaky Test Detection (last ${lookback} runs)\n\nTests with status flips: **${flaky.length}**\n\n${chartBlock}`,
    data: { flakyTests: flaky, lookbackRuns: lookback },
    confidence: 1,
    recommendations: flaky
      .filter((f) => f.score > 20)
      .map((f) => `Quarantine ${f.id} (${f.score}% flakiness)`),
    generatedAt: new Date().toISOString(),
  };
}

function fallbackAnomalyDetection(): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  const anomalies: { runId: string; passPct: number; zScore: number; flag: string }[] = [];
  if (sortedRuns.length >= 3) {
    const rates = sortedRuns.map((r) => r.passPct);
    const mean = rates.reduce((s, v) => s + v, 0) / rates.length;
    const variance = rates.reduce((s, v) => s + (v - mean) ** 2, 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    for (const run of sortedRuns) {
      const z = stdDev > 0 ? (run.passPct - mean) / stdDev : 0;
      if (Math.abs(z) > 1.5) {
        anomalies.push({
          runId: run.id,
          passPct: run.passPct,
          zScore: Math.round(z * 100) / 100,
          flag: z < 0 ? "below average" : "above average",
        });
      }
    }
  }

  const passRateChart = buildColumnChart(
    "Pass Rate Trend with Anomaly Detection",
    ["Run", "Pass Rate"],
    sortedRuns.map((r) => [r.id.slice(-8), r.passPct]),
    ["#5b8af5"],
    { vAxis: { minValue: 0, maxValue: 100 }, hAxis: { slantedText: true, slantedTextAngle: 45 } },
  );

  const anomalyTable = buildTable(
    "Detected Anomalies",
    ["Run ID", "Pass Rate", "Z-Score", "Flag"],
    anomalies.map((a) => [a.runId, `${a.passPct}%`, a.zScore, a.flag]),
  );

  const summaryChart = buildTable(
    "Analysis Summary",
    ["Metric", "Value"],
    [
      ["Runs analyzed", sortedRuns.length],
      ["Anomalies found", anomalies.length],
      ["Below average", anomalies.filter((a) => a.flag === "below average").length],
      ["Above average", anomalies.filter((a) => a.flag === "above average").length],
    ],
  );

  const chartBlock = [summaryChart, passRateChart, anomalyTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    anomalies.length === 0
      ? "No significant anomalies detected in pass rate trends."
      : `Detected ${anomalies.length} anomalous runs. ${anomalies.filter((a) => a.flag === "below average").length} below-average runs need investigation.`;

  return {
    useCaseId: "anomaly-detection",
    summary,
    details: `## Anomaly Detection\n\n${chartBlock}`,
    data: { anomalies, totalRuns: sortedRuns.length },
    confidence: 1,
    recommendations: anomalies
      .filter((a) => a.flag === "below average")
      .map(
        (a) => `Investigate run ${a.runId} (${a.passPct}% pass rate — significantly below mean)`,
      ),
    generatedAt: new Date().toISOString(),
  };
}

function fallbackRiskScoring(request: AIAnalysisRequest): AIAnalysisResult {
  const runId = (request.parameters.runId as string) || RUNS[RUNS.length - 1]?.id;
  const run = RUNS.find((r) => r.id === runId);
  if (!run) return genericFallback(request);
  const passRateScore = Math.max(0, 100 - run.passPct) * 0.4;
  const failureScore = Math.min(100, run.failures * 5) * 0.2;
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
  );
  const prevRun = sortedRuns.find((r) => r.id !== runId);
  const trendScore = prevRun ? (run.passPct < prevRun.passPct ? 20 : 0) : 10;
  const envScore = run.failures > 0 && run.env === "PROD" ? 20 : 5;
  const totalScore = Math.round(passRateScore + failureScore + trendScore + envScore);
  const level =
    totalScore <= 20 ? "LOW" : totalScore <= 50 ? "MEDIUM" : totalScore <= 80 ? "HIGH" : "CRITICAL";

  const scoreChart = buildColumnChart(
    "Risk Score Breakdown",
    ["Component", "Score"],
    [
      ["Pass Rate", Math.round(passRateScore)],
      ["Failures", Math.round(failureScore)],
      ["Trend", trendScore],
      ["Environment", envScore],
      ["Total", totalScore],
    ],
    ["#5b8af5", "#f59e0b", "#22c55e", "#a855f7", "#ef4444"],
    { legend: { position: "none" } },
  );

  const scoreTable = buildTable(
    "Risk Score Breakdown",
    ["Component", "Weight", "Score", "Detail"],
    [
      [
        `Pass rate (${run.passPct}%)`,
        "40%",
        `${Math.round(passRateScore)} pts`,
        `${run.passPct}% pass rate`,
      ],
      [
        `Failures (${run.failures})`,
        "20%",
        `${Math.round(failureScore)} pts`,
        `${run.failures} failures`,
      ],
      [
        "Trend",
        "20%",
        `${trendScore} pts`,
        prevRun ? `${prevRun.passPct}% → ${run.passPct}%` : "No previous run",
      ],
      [`Environment (${run.env})`, "20%", `${envScore} pts`, run.env],
    ],
  );

  const verdictTable = buildTable(
    "Assessment Verdict",
    ["Category", "Value"],
    [
      ["Build", run.build],
      ["Risk Score", `${totalScore}/100`],
      ["Risk Level", level],
      ["Pass Rate", `${run.passPct}%`],
      ["Failures", run.failures],
    ],
  );

  const chartBlock = [verdictTable, scoreChart, scoreTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  return {
    useCaseId: "risk-scoring",
    summary: `Build ${run.build}: Risk score ${totalScore}/100 (${level}). Pass rate: ${run.passPct}%, Failures: ${run.failures}.`,
    details: `## Risk Assessment — ${runId} (\`${run.build}\`)\n\n**Overall Risk: ${totalScore}/100 — ${level}**\n\n${chartBlock}\n\n**Recommendation:** ${level === "LOW" ? "✅ Safe to deploy" : level === "MEDIUM" ? "⚠️ Investigate before deploying" : "❌ Do not deploy — blocking issues"}`,
    data: { runId, riskScore: totalScore, riskLevel: level, build: run.build },
    confidence: 1,
    recommendations:
      level === "LOW"
        ? ["Safe to deploy", "Monitor next run"]
        : level === "MEDIUM"
          ? [
              `Investigate ${run.failures} failures before deploy`,
              "Check if failures are env-specific",
            ]
          : [
              "BLOCKING: Do not deploy",
              `Critical: ${run.failures} failures at ${run.passPct}% pass rate`,
              "Roll back to previous build",
            ],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackEnvComparison(): AIAnalysisResult {
  const envGroups: Record<string, { runs: number; avgPass: number; failures: number }> = {};
  for (const run of RUNS) {
    const key = run.envId;
    if (!envGroups[key]) envGroups[key] = { runs: 0, avgPass: 0, failures: 0 };
    envGroups[key].runs++;
    envGroups[key].avgPass += run.passPct;
    envGroups[key].failures += run.failures;
  }
  for (const key of Object.keys(envGroups)) {
    envGroups[key].avgPass = Math.round(envGroups[key].avgPass / envGroups[key].runs);
  }
  const envLabels = Object.keys(envGroups).sort();

  const envChart = buildColumnChart(
    "Environment Comparison",
    ["Environment", "Avg Pass Rate", "Failures"],
    envLabels.map((l) => [l, envGroups[l].avgPass, envGroups[l].failures]),
    ["#a855f7", "#f59e0b", "#22c55e"],
    { legend: { position: "bottom" } },
  );

  const envTable = buildTable(
    "Environment Details",
    ["Environment", "Runs", "Avg Pass Rate", "Total Failures"],
    envLabels.map((l) => [l, envGroups[l].runs, `${envGroups[l].avgPass}%`, envGroups[l].failures]),
  );

  const chartBlock = [envChart, envTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    envLabels.length >= 2
      ? `${envLabels.join(" vs ")}: ${envLabels.map((l) => `${l}=${envGroups[l].avgPass}% avg pass rate`).join(", ")}.`
      : `Only ${envLabels.length} environment(s) with data.`;

  return {
    useCaseId: "env-comparison",
    summary,
    details: `## Environment Comparison\n\n${chartBlock}`,
    data: envGroups,
    confidence: 1,
    recommendations:
      envLabels.length >= 2 && envGroups[envLabels[0]]?.avgPass !== envGroups[envLabels[1]]?.avgPass
        ? [
            "Investigate environment-specific failures",
            "Check configuration parity between environments",
          ]
        : ["Environments are consistent", "Continue monitoring for drift"],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackCategoryHealth(): AIAnalysisResult {
  const allResults: Record<string, { total: number; passed: number; duration: number }> = {};
  for (const run of RUNS) {
    const results = getTestResultsForRun(run.id);
    for (const r of results) {
      const cat = r.category || "Unknown";
      if (!allResults[cat]) allResults[cat] = { total: 0, passed: 0, duration: 0 };
      allResults[cat].total++;
      if (r.status === "PASS") allResults[cat].passed++;
      allResults[cat].duration += r.duration;
    }
  }
  const healthScores = Object.entries(allResults)
    .map(([cat, s]) => ({
      category: cat,
      passRate: Math.round((s.passed / s.total) * 100),
      avgDuration: Math.round(s.duration / s.total),
      testCount: s.total,
      health:
        s.passed / s.total >= 0.95 ? "healthy" : s.passed / s.total >= 0.85 ? "fair" : "unhealthy",
    }))
    .sort((a, b) => a.passRate - b.passRate);
  const unhealthy = healthScores.filter((h) => h.health === "unhealthy");

  const healthChart = buildBarChart(
    "Category Health (Pass Rate %)",
    ["Category", "Pass Rate %"],
    healthScores.map((h) => [h.category, h.passRate]),
    ["#22c55e", "#f59e0b", "#ef4444"],
    { legend: { position: "none" }, vAxis: { minValue: 0, maxValue: 100 } },
  );

  const healthTable = buildTable(
    "Category Health Details",
    ["Category", "Pass Rate", "Tests", "Avg Duration", "Health"],
    healthScores.map((h) => [
      h.category,
      `${h.passRate}%`,
      h.testCount,
      `${h.avgDuration}ms`,
      h.health,
    ]),
  );

  const summaryTable = buildTable(
    "Summary",
    ["Metric", "Value"],
    [
      ["Total categories", healthScores.length],
      ["Healthy (≥95%)", healthScores.filter((h) => h.health === "healthy").length],
      ["Fair (85-94%)", healthScores.filter((h) => h.health === "fair").length],
      ["Unhealthy (<85%)", unhealthy.length],
    ],
  );

  const chartBlock = [summaryTable, healthChart, healthTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    healthScores.length === 0
      ? "No category data available."
      : `Category health across ${healthScores.length} categories. ${unhealthy.length} unhealthy: ${unhealthy.map((h) => `${h.category} (${h.passRate}%)`).join(", ")}.`;

  return {
    useCaseId: "category-health",
    summary,
    details: `## Category Health Report\n\n${chartBlock}`,
    data: { categories: healthScores },
    confidence: 1,
    recommendations: [
      ...unhealthy.map((h) => `Investigate ${h.category} (${h.passRate}% pass rate)`),
      ...(unhealthy.length > 0
        ? ["Schedule focused review for unhealthy categories"]
        : ["All categories healthy — continue monitoring"]),
    ],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackCoverageGap(): AIAnalysisResult {
  const testStats = computeTestStats();
  const gaps: string[] = [];
  if (!testStats.byPriority?.P0) gaps.push("No P0 (critical priority) tests");
  if (!testStats.bySeverity?.critical) gaps.push("No critical severity tests");
  if (testStats.coverage < 80) gaps.push(`Low category coverage: ${testStats.coverage}%`);
  if (testStats.manual > testStats.automated) gaps.push("More manual tests than automated");

  const coverageTable = buildTable(
    "Coverage Metrics",
    ["Metric", "Value"],
    [
      ["Total tests", testStats.total],
      ["Categories covered", Object.keys(testStats.byCategory || {}).length],
      ["Coverage score", `${testStats.coverage}%`],
      ["Automated", testStats.automated],
      ["Manual", testStats.manual],
    ],
  );

  const gapTable = buildTable(
    "Detected Gaps",
    ["Gap", "Severity"],
    gaps.length > 0 ? gaps.map((g) => [g, "⚠️ Action needed"]) : [["None detected", "✅ OK"]],
  );

  const priorityTable = buildTable(
    "By Priority",
    ["Priority", "Count"],
    Object.entries(testStats.byPriority || {}).map(([k, v]) => [k, v]),
  );

  const severityTable = buildTable(
    "By Severity",
    ["Severity", "Count"],
    Object.entries(testStats.bySeverity || {}).map(([k, v]) => [k, v]),
  );

  const chartBlock = [coverageTable, gapTable, priorityTable, severityTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    gaps.length === 0
      ? "Good coverage across all dimensions."
      : `Found ${gaps.length} gaps: ${gaps.join("; ")}.`;

  return {
    useCaseId: "coverage-gap",
    summary,
    details: `## Coverage Gap Analysis\n\n${chartBlock}`,
    data: { testStats, gaps },
    confidence: 1,
    recommendations:
      gaps.length > 0
        ? gaps.map((g) => `Address: ${g}`)
        : ["Coverage is adequate", "Focus on maintaining current coverage levels"],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackSmartAlerting(): AIAnalysisResult {
  const alerts: { severity: string; title: string; description: string }[] = [];
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  const latest = sortedRuns[sortedRuns.length - 1];
  const prev = sortedRuns[sortedRuns.length - 2];
  if (latest && latest.failures > 0)
    alerts.push({
      severity: latest.failures > 10 ? "critical" : "warning",
      title: `${latest.failures} failures in latest run`,
      description: `Run ${latest.id} (${latest.build}) has ${latest.failures} failures at ${latest.passPct}% pass rate.`,
    });
  if (latest && prev && latest.passPct < prev.passPct - 10)
    alerts.push({
      severity: "critical",
      title: "Significant pass rate drop",
      description: `Pass rate dropped from ${prev.passPct}% to ${latest.passPct}%`,
    });
  if (latest && prev && latest.durationMs > prev.durationMs * 1.5)
    alerts.push({
      severity: "warning",
      title: "Duration spike detected",
      description: `Run duration increased from ${prev.durationMs}ms to ${latest.durationMs}ms.`,
    });
  const lowScoreRuns = sortedRuns.filter((r) => r.passPct < 80);
  if (lowScoreRuns.length > 1)
    alerts.push({
      severity: "warning",
      title: `${lowScoreRuns.length} runs below 80% pass rate`,
      description: lowScoreRuns.map((r) => `Run ${r.id}: ${r.passPct}%`).join(", "),
    });

  const alertTable = buildTable(
    "Active Alerts",
    ["Severity", "Title", "Description"],
    alerts.length > 0
      ? alerts.map((a) => [a.severity.toUpperCase(), a.title, a.description])
      : [["INFO", "No active alerts", "All systems nominal"]],
  );

  const summaryTable = buildTable(
    "Alert Summary",
    ["Category", "Count"],
    [
      ["Total alerts", alerts.length],
      ["Critical", alerts.filter((a) => a.severity === "critical").length],
      ["Warning", alerts.filter((a) => a.severity === "warning").length],
    ],
  );

  const chartBlock = [summaryTable, alertTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    alerts.length === 0
      ? "No active alerts. All systems nominal."
      : `${alerts.length} active alert(s): ${alerts.filter((a) => a.severity === "critical").length} critical, ${alerts.filter((a) => a.severity === "warning").length} warnings.`;

  return {
    useCaseId: "smart-alerting",
    summary,
    details: `## Smart Alerts\n\n${chartBlock}`,
    data: { alerts, totalRuns: sortedRuns.length },
    confidence: 1,
    recommendations: alerts.filter((a) => a.severity === "critical").map((a) => a.title),
    generatedAt: new Date().toISOString(),
  };
}

function fallbackRunFrequency(): AIAnalysisResult {
  const byDay: Record<string, number> = {};
  for (const run of RUNS) {
    const day = run.started.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  }
  const days = Object.keys(byDay).sort();
  const runsPerDay = days.length > 0 ? Math.round((RUNS.length / days.length) * 10) / 10 : 0;
  const gaps: { date: string; gapDays: number }[] = [];
  for (let i = 1; i < days.length; i++) {
    const prevDate = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = Math.round((curr.getTime() - prevDate.getTime()) / 86400000);
    if (diff > 1) gaps.push({ date: days[i], gapDays: diff - 1 });
  }

  const freqChart = buildColumnChart(
    "Runs by Day",
    ["Date", "Runs"],
    days.map((d) => [d, byDay[d]]),
    ["#5b8af5"],
    { hAxis: { slantedText: true, slantedTextAngle: 45 } },
  );

  const freqTable = buildTable(
    "Run Frequency Details",
    ["Date", "Runs"],
    days.map((d) => [d, byDay[d]]),
  );

  const summaryTable = buildTable(
    "Summary",
    ["Metric", "Value"],
    [
      ["Total runs", RUNS.length],
      ["Days covered", days.length],
      ["Avg runs/day", runsPerDay],
      ["Gaps found", gaps.length],
    ],
  );

  const gapTable = buildTable(
    "Coverage Gaps",
    ["Date", "Gap (days)"],
    gaps.length > 0 ? gaps.map((g) => [g.date, g.gapDays]) : [["No gaps", "—"]],
  );

  const chartBlock = [summaryTable, freqChart, freqTable, gapTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary = `${RUNS.length} runs across ${days.length} days (${runsPerDay} runs/day).`;

  return {
    useCaseId: "run-frequency",
    summary,
    details: `## Run Frequency Analysis\n\n${chartBlock}`,
    data: { totalRuns: RUNS.length, daysCovered: days.length, runsPerDay, gaps },
    confidence: 1,
    recommendations:
      gaps.length > 0
        ? ["Fill coverage gaps with additional runs", "Consider scheduled runs on missed days"]
        : ["Good run frequency", "Maintain current schedule"],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackSuiteHealth(): AIAnalysisResult {
  const suites = getTestSuites();
  const suiteHealth = suites
    .map((suite) => {
      let totalTests = 0;
      let passedTests = 0;
      for (const run of RUNS) {
        const results = getTestResultsForRun(run.id);
        for (const r of results) {
          if (suite.testIds.includes(r.id)) {
            totalTests++;
            if (r.status === "PASS") passedTests++;
          }
        }
      }
      return {
        id: suite.id,
        name: suite.name,
        passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
        totalExecutions: totalTests,
        config: suite.config,
      };
    })
    .sort((a, b) => a.passRate - b.passRate);

  const healthChart = buildBarChart(
    "Suite Pass Rates",
    ["Suite", "Pass Rate %"],
    suiteHealth.map((s) => [s.name, s.passRate]),
    ["#22c55e", "#f59e0b", "#ef4444"],
    { vAxis: { minValue: 0, maxValue: 100 } },
  );

  const healthTable = buildTable(
    "Suite Health Details",
    ["Suite", "Pass Rate", "Executions", "Parallelism"],
    suiteHealth.map((s) => [s.name, `${s.passRate}%`, s.totalExecutions, s.config.parallelism]),
  );

  const chartBlock = [healthChart, healthTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    suiteHealth.length === 0
      ? "No suite data available."
      : `Suite health across ${suiteHealth.length} suites. Unhealthiest: ${suiteHealth[0]?.name} (${suiteHealth[0]?.passRate}%).`;

  return {
    useCaseId: "suite-health",
    summary,
    details: `## Suite Health\n\n${chartBlock}`,
    data: { suites: suiteHealth },
    confidence: 1,
    recommendations: suiteHealth
      .filter((s) => s.passRate < 85)
      .map((s) => `Investigate ${s.name} (${s.passRate}% pass rate)`),
    generatedAt: new Date().toISOString(),
  };
}

function fallbackQualityGate(): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
  );
  const latest = sortedRuns[0];
  if (!latest) return genericFallback({ useCaseId: "quality-gate", parameters: {} });
  const checks = [
    { name: "Pass rate >= 90%", passed: latest.passPct >= 90, actual: `${latest.passPct}%` },
    { name: "Failures < 5", passed: latest.failures < 5, actual: `${latest.failures} failures` },
    { name: "Not FAIL status", passed: latest.status !== "FAIL", actual: latest.status },
  ];
  const allPassed = checks.every((c) => c.passed);

  const gateTable = buildTable(
    "Quality Gate Checks",
    ["Check", "Status", "Actual"],
    checks.map((c) => [c.name, c.passed ? "✅ Pass" : "❌ Fail", c.actual]),
  );

  const summaryTable = buildTable(
    "Gate Summary",
    ["Metric", "Value"],
    [
      ["Build", latest.build],
      ["Run ID", latest.id],
      ["Result", allPassed ? "✅ PASSED" : "❌ FAILED"],
      ["Pass rate", `${latest.passPct}%`],
    ],
  );

  const chartBlock = [summaryTable, gateTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary = allPassed
    ? "Quality gate PASSED — all checks met."
    : `Quality gate FAILED — ${checks.filter((c) => !c.passed).length}/${checks.length} checks failed.`;

  return {
    useCaseId: "quality-gate",
    summary,
    details: `## Quality Gate — ${latest.id} (\`${latest.build}\`)\n\n**Result: ${allPassed ? "✅ PASSED" : "❌ FAILED"}**\n\n${chartBlock}`,
    data: { passed: allPassed, checks, build: latest.build, runId: latest.id },
    confidence: 1,
    recommendations: allPassed
      ? ["Gate passed — proceed with deployment"]
      : [
          `Fix: ${checks
            .filter((c) => !c.passed)
            .map((c) => c.name)
            .join(", ")}`,
          "Re-run after fixes",
        ],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackDurationBudget(): AIAnalysisResult {
  const allResults: Record<string, number[]> = {};
  for (const run of RUNS) {
    const results = getTestResultsForRun(run.id);
    for (const r of results) {
      if (!allResults[r.id]) allResults[r.id] = [];
      allResults[r.id].push(r.duration);
    }
  }
  const slowTests = Object.entries(allResults)
    .map(([id, durations]) => {
      const avg = Math.round(durations.reduce((s, d) => s + d, 0) / durations.length);
      return { id, avg, max: Math.max(...durations), count: durations.length };
    })
    .filter((t) => t.avg > 1000)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  const slowChart = buildBarChart(
    "Slowest Tests (avg ms)",
    ["Test", "Avg Duration"],
    slowTests.map((t) => [t.id, t.avg]),
    ["#ef4444"],
    { legend: { position: "none" } },
  );

  const slowTable = buildTable(
    "Duration Budget Exceedances",
    ["Test ID", "Avg (ms)", "Max (ms)", "Runs"],
    slowTests.map((t) => [t.id, t.avg, t.max, t.count]),
  );

  const chartBlock = [slowChart, slowTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    slowTests.length === 0
      ? "No tests exceed duration budgets."
      : `${slowTests.length} tests exceed 1000ms average duration. Slowest: ${slowTests[0]?.id} (avg ${slowTests[0]?.avg}ms).`;

  return {
    useCaseId: "duration-budget",
    summary,
    details: `## Duration Budget Tracking\n\nTests exceeding **1000ms** average:\n\n${chartBlock}`,
    data: { slowTests },
    confidence: 1,
    recommendations: slowTests.slice(0, 3).map((t) => `Optimize ${t.id} (avg ${t.avg}ms)`),
    generatedAt: new Date().toISOString(),
  };
}

function fallbackRedundancyDetection(): AIAnalysisResult {
  const testCases = getTestCases();
  const byCategory: Record<string, { id: string; name: string }[]> = {};
  for (const tc of testCases) {
    const cat = tc.category || "Unknown";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ id: tc.id, name: tc.name });
  }
  const redundancies: { category: string; tests: { id: string; name: string }[] }[] = [];
  for (const [cat, tests] of Object.entries(byCategory)) {
    const prefixes: Record<string, { id: string; name: string }[]> = {};
    for (const t of tests) {
      const base = t.name.replace(/[_#\d]+$/, "").trim();
      if (!prefixes[base]) prefixes[base] = [];
      prefixes[base].push(t);
    }
    for (const [, group] of Object.entries(prefixes)) {
      if (group.length > 1) redundancies.push({ category: cat, tests: group });
    }
  }
  redundancies.sort((a, b) => b.tests.length - a.tests.length);

  const redunTable = buildTable(
    "Potential Redundancies",
    ["Category", "Similar Tests", "Candidate IDs"],
    redundancies.map((r) => [r.category, r.tests.length, r.tests.map((t) => t.id).join(", ")]),
  );

  const chartBlock = [redunTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    redundancies.length === 0
      ? "No potentially redundant tests detected."
      : `Found ${redundancies.length} potential redundancy groups across ${new Set(redundancies.map((r) => r.category)).size} categories.`;

  return {
    useCaseId: "test-redundancy",
    summary,
    details: `## Redundancy Detection\n\n${chartBlock}`,
    data: { redundancyGroups: redundancies },
    confidence: 1,
    recommendations: redundancies
      .slice(0, 3)
      .map((r) => `Review ${r.tests.length} tests in ${r.category} for consolidation`),
    generatedAt: new Date().toISOString(),
  };
}

function fallbackRegressionPrediction(): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  const recent = sortedRuns.slice(-10);
  const categoryTrends: Record<string, { rates: number[]; decline: boolean; declinePct: number }> =
    {};
  for (const run of recent) {
    const results = getTestResultsForRun(run.id);
    const byCat: Record<string, { total: number; passed: number }> = {};
    for (const r of results) {
      const cat = r.category || "Unknown";
      if (!byCat[cat]) byCat[cat] = { total: 0, passed: 0 };
      byCat[cat].total++;
      if (r.status === "PASS") byCat[cat].passed++;
    }
    for (const [cat, s] of Object.entries(byCat)) {
      if (!categoryTrends[cat]) categoryTrends[cat] = { rates: [], decline: false, declinePct: 0 };
      categoryTrends[cat].rates.push(Math.round((s.passed / s.total) * 100));
    }
  }
  for (const [, t] of Object.entries(categoryTrends)) {
    if (t.rates.length >= 2) {
      const first = t.rates[0];
      const last = t.rates[t.rates.length - 1];
      t.decline = last < first;
      t.declinePct = first > 0 ? Math.round(((first - last) / first) * 100) : 0;
    }
  }
  const atRisk = Object.entries(categoryTrends)
    .filter(([, t]) => t.decline && t.declinePct > 5)
    .sort(([, a], [, b]) => b.declinePct - a.declinePct);

  const riskChart = buildBarChart(
    "Categories at Regression Risk",
    ["Category", "Decline %"],
    atRisk.map(([c, t]) => [c, t.declinePct]),
    ["#ef4444"],
    { legend: { position: "none" } },
  );

  const riskTable = buildTable(
    "At-Risk Categories",
    ["Category", "Trend", "Decline"],
    atRisk.map(([c, t]) => [
      c,
      `${t.rates[0]}% → ${t.rates[t.rates.length - 1]}%`,
      `${t.declinePct}%`,
    ]),
  );

  const chartBlock = [riskChart, riskTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    atRisk.length === 0
      ? "No categories showing regression risk."
      : `${atRisk.length} category(s) at risk of regression.`;

  return {
    useCaseId: "regression-prediction",
    summary,
    details: `## Regression Prediction\n\n**At-Risk Categories:** ${atRisk.length}\n\n${chartBlock}\n\n**Based on last ${recent.length} runs.**`,
    data: {
      atRisk: atRisk.map(([c, t]) => ({ category: c, declinePct: t.declinePct })),
      totalCategories: Object.keys(categoryTrends).length,
    },
    confidence: 1,
    recommendations:
      atRisk.length > 0
        ? atRisk.map(([c]) => `Investigate declining pass rate in ${c}`)
        : ["No regression risk detected — continue monitoring"],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackPerformanceTrends(): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  const testDurations: Record<string, { durations: number[]; runs: string[] }> = {};
  for (const run of sortedRuns) {
    const results = getTestResultsForRun(run.id);
    for (const r of results) {
      if (!testDurations[r.id]) testDurations[r.id] = { durations: [], runs: [] };
      testDurations[r.id].durations.push(r.duration);
      testDurations[r.id].runs.push(run.build || run.id.slice(-8));
    }
  }
  const trending = Object.entries(testDurations)
    .map(([id, d]) => {
      const avg =
        d.durations.length > 0
          ? Math.round(d.durations.reduce((s, v) => s + v, 0) / d.durations.length)
          : 0;
      const first = d.durations[0] || 0;
      const last = d.durations[d.durations.length - 1] || 0;
      const change = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
      return { id, avg, first, last, change, count: d.durations.length };
    })
    .filter((t) => t.count >= 2)
    .sort((a, b) => b.change - a.change);
  const slowing = trending.filter((t) => t.change > 20);

  const perfChart = buildBarChart(
    "Duration Change % (slowing tests)",
    ["Test", "Change %"],
    slowing.slice(0, 8).map((t) => [t.id, t.change]),
    ["#ef4444"],
    { legend: { position: "none" } },
  );

  const perfTable = buildTable(
    "Performance Trends Detail",
    ["Test ID", "Avg (ms)", "First", "Last", "Change"],
    slowing.map((t) => [t.id, t.avg, `${t.first}ms`, `${t.last}ms`, `+${t.change}%`]),
  );

  const chartBlock = [perfChart, perfTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    slowing.length === 0
      ? "No performance regressions detected."
      : `${slowing.length} test(s) slowing down. Worst: ${slowing[0]?.id} (+${slowing[0]?.change}%).`;

  return {
    useCaseId: "performance-trends",
    summary,
    details: `## Performance Trend Analysis\n\n${chartBlock}\n\n**Total tests tracked: ${trending.length}**`,
    data: { slowingTests: slowing, totalTracked: trending.length },
    confidence: 1,
    recommendations: slowing
      .slice(0, 3)
      .map((t) => `Investigate duration increase in ${t.id} (+${t.change}%)`),
    generatedAt: new Date().toISOString(),
  };
}

function fallbackRootCauseAnalysis(): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  const latestRun = sortedRuns[sortedRuns.length - 1];
  if (!latestRun) return genericFallback({ useCaseId: "root-cause-analysis", parameters: {} });
  const latestResults = getTestResultsForRun(latestRun.id);
  const failures = latestResults.filter((r) => r.status === "FAIL");
  const byFirstSeen: Record<
    string,
    { test: string; category: string; firstRun: string; firstBuild: string; reappearances: number }
  > = {};
  for (const f of failures) {
    for (const run of sortedRuns) {
      const results = getTestResultsForRun(run.id);
      const match = results.find((r) => r.id === f.id);
      if (match && match.status === "FAIL") {
        if (!byFirstSeen[f.id]) {
          byFirstSeen[f.id] = {
            test: f.id,
            category: f.category || "Unknown",
            firstRun: run.id,
            firstBuild: run.build || "",
            reappearances: 0,
          };
        } else {
          byFirstSeen[f.id].reappearances++;
        }
      }
    }
  }
  const systemic = Object.values(byFirstSeen)
    .filter((b) => b.reappearances > 1)
    .sort((a, b) => b.reappearances - a.reappearances);
  const recentFailures = Object.values(byFirstSeen).filter((b) => b.reappearances <= 1);

  const rootTable = buildTable(
    "Systemic Issues (Recurring)",
    ["Test", "Category", "First Seen", "Build", "Reappearances"],
    systemic.map((s) => [s.test, s.category, s.firstRun, s.firstBuild, s.reappearances]),
  );

  const newTable = buildTable(
    "New/Recent Failures",
    ["Test", "Category"],
    recentFailures.map((r) => [r.test, r.category]),
  );

  const summaryTable = buildTable(
    "Analysis Summary",
    ["Metric", "Value"],
    [
      ["Latest run", latestRun.id],
      ["Total failures", failures.length],
      ["Systemic issues", systemic.length],
      ["New failures", recentFailures.length],
    ],
  );

  const chartBlock = [summaryTable, rootTable, newTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    failures.length === 0
      ? `No failures in latest run (${latestRun.id}).`
      : `${failures.length} failures in latest run. ${systemic.length} systemic, ${recentFailures.length} new.`;

  return {
    useCaseId: "root-cause-analysis",
    summary,
    details: `## Root Cause Analysis — ${latestRun.id} (\`${latestRun.build}\`)\n\n${chartBlock}`,
    data: {
      systemic,
      newFailures: recentFailures,
      totalFailures: failures.length,
      latestBuild: latestRun.build,
    },
    confidence: 1,
    recommendations: [
      ...systemic
        .slice(0, 3)
        .map(
          (s) => `Root-cause recurring failure in ${s.test} (seen ${s.reappearances + 1} times)`,
        ),
      ...(failures.length === 0 ? ["No action needed"] : []),
    ],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackFailureClustering(): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
  );
  const latestRun = sortedRuns[0];
  if (!latestRun) return genericFallback({ useCaseId: "failure-clustering", parameters: {} });
  const results = getTestResultsForRun(latestRun.id);
  const failures = results.filter((r) => r.status === "FAIL");
  const clusters: Record<
    string,
    { category: string; tests: string[]; count: number; pct: number }
  > = {};
  for (const f of failures) {
    const key = `${f.category || "Unknown"}::${f.suite || "none"}`;
    if (!clusters[key])
      clusters[key] = { category: f.category || "Unknown", tests: [], count: 0, pct: 0 };
    clusters[key].tests.push(f.name);
    clusters[key].count++;
  }
  const total = failures.length;
  for (const c of Object.values(clusters))
    c.pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
  const sortedClusters = Object.values(clusters).sort((a, b) => b.count - a.count);

  const clusterPie = buildPieChart(
    "Failure Clusters",
    ["Cluster", "Failures"],
    sortedClusters.map((c) => [c.category, c.count]),
    ["#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981"],
  );

  const clusterTable = buildTable(
    "Cluster Details",
    ["Category/Suite", "Count", "% of Failures", "Tests"],
    sortedClusters.map((c) => [c.category, c.count, `${c.pct}%`, c.tests.join(", ")]),
  );

  const chartBlock = [clusterPie, clusterTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    failures.length === 0
      ? "No failures to cluster."
      : `${sortedClusters.length} cluster(s) across ${failures.length} failures.`;

  return {
    useCaseId: "failure-clustering",
    summary,
    details: `## Failure Clustering — ${latestRun.id}\n\n${chartBlock}`,
    data: { clusters: sortedClusters, totalFailures: failures.length, latestRun: latestRun.id },
    confidence: 1,
    recommendations: sortedClusters
      .slice(0, 3)
      .map((c) => `Investigate ${c.category} cluster (${c.count} failures)`),
    generatedAt: new Date().toISOString(),
  };
}

function fallbackCrossCategoryCorrelation(): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  const catRates: Record<string, number[]> = {};
  for (const run of sortedRuns) {
    const results = getTestResultsForRun(run.id);
    const byCat: Record<string, { total: number; passed: number }> = {};
    for (const r of results) {
      const cat = r.category || "Unknown";
      if (!byCat[cat]) byCat[cat] = { total: 0, passed: 0 };
      byCat[cat].total++;
      if (r.status === "PASS") byCat[cat].passed++;
    }
    for (const [cat, s] of Object.entries(byCat)) {
      if (!catRates[cat]) catRates[cat] = [];
      catRates[cat].push(Math.round((s.passed / s.total) * 100));
    }
  }
  const cats = Object.keys(catRates).filter((c) => catRates[c].length >= 3);
  const correlations: { a: string; b: string; moveTogether: boolean; strength: number }[] = [];
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const a = catRates[cats[i]];
      const b = catRates[cats[j]];
      const minLen = Math.min(a.length, b.length);
      const aTrim = a.slice(-minLen);
      const bTrim = b.slice(-minLen);
      const diffs = aTrim.map(
        (v, idx) =>
          Math.sign(v - (aTrim[idx - 1] || v)) ===
          Math.sign(bTrim[idx] - (bTrim[idx - 1] || bTrim[0])),
      );
      const sameDirection = diffs.filter(Boolean).length;
      const strength = Math.round((sameDirection / diffs.length) * 100);
      if (strength > 60)
        correlations.push({ a: cats[i], b: cats[j], moveTogether: strength > 75, strength });
    }
  }
  correlations.sort((a, b) => b.strength - a.strength);

  const corrTable = buildTable(
    "Category Correlations",
    ["Category A", "Category B", "Direction", "Strength"],
    correlations.map((c) => [
      c.a,
      c.b,
      c.moveTogether ? "✅ Same direction" : "⚠️ Partial",
      `${c.strength}%`,
    ]),
  );

  const chartBlock = [corrTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    correlations.length === 0
      ? "No significant correlations found."
      : `Found ${correlations.length} correlated pair(s). Strongest: ${correlations[0]?.a} ↔ ${correlations[0]?.b} (${correlations[0]?.strength}%).`;

  return {
    useCaseId: "cross-category-correlation",
    summary,
    details: `## Cross-Category Correlation\n\n${chartBlock}`,
    data: { correlations, categoriesAnalyzed: cats.length },
    confidence: 1,
    recommendations:
      correlations.length > 0
        ? [`Monitor ${correlations[0]?.a} as leading indicator for ${correlations[0]?.b}`]
        : ["Add more runs to detect correlation patterns"],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackTrendForecasting(): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  if (sortedRuns.length < 3) {
    const minTable = buildTable(
      "Forecast Status",
      ["Metric", "Value"],
      [
        ["Runs available", sortedRuns.length],
        ["Minimum required", 3],
      ],
    );
    const j = JSON.stringify({
      type: minTable.type,
      title: minTable.title,
      headers: minTable.headers,
      rows: minTable.rows,
      colors: minTable.colors,
      options: minTable.options,
    });
    return {
      useCaseId: "trend-forecasting",
      summary: "Need at least 3 runs for forecasting.",
      details: `## Trend Forecasting\n\n\`\`\`chart\n${j}\n\`\`\`\n\nInsufficient data — add more runs to enable trend forecasting.`,
      data: { runCount: sortedRuns.length, minRequired: 3 },
      confidence: 0.5,
      recommendations: ["Add more test runs for trend analysis"],
      generatedAt: new Date().toISOString(),
    };
  }
  const rates = sortedRuns.map((r) => r.passPct);
  const n = rates.length;
  const xMean = (n - 1) / 2;
  const yMean = rates.reduce((s, v) => s + v, 0) / n;
  let num = 0,
    den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (rates[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den > 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;
  const forecast = (x: number) => Math.round(Math.max(0, Math.min(100, intercept + slope * x)));
  const next5 = Array.from({ length: 5 }, (_, i) => forecast(n + i));

  const forecastChart = buildLineChart(
    "Pass Rate Forecast (next 5 runs)",
    ["Run", "Pass Rate"],
    [...rates.map((r, i) => [`#${i + 1}`, r]), ...next5.map((r, i) => [`#${n + i + 1} (f)`, r])],
    ["#5b8af5"],
    {
      vAxis: { minValue: 0, maxValue: 100 },
      trendline: { type: "linear", color: "#ef4444", lineWidth: 2 },
    },
  );

  const forecastTable = buildTable(
    "Forecast Details",
    ["Metric", "Value"],
    [
      [
        "Trend",
        `${slope > 0 ? "improving" : slope < 0 ? "declining" : "stable"} (slope: ${slope.toFixed(2)})`,
      ],
      ["Current pass rate", `${rates[n - 1]}%`],
      ["Forecast (next run)", `${next5[0]}%`],
      ["Forecast (5 runs)", `${next5[4]}%`],
    ],
  );

  const chartBlock = [forecastTable, forecastChart]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const trend = slope > 0 ? "improving" : slope < 0 ? "declining" : "stable";
  const summary = `Forecast: rates are ${trend}. Predicted pass rate in 5 runs: ${next5[4]}%.`;

  return {
    useCaseId: "trend-forecasting",
    summary,
    details: `## Trend Forecasting\n\n${chartBlock}`,
    data: {
      trend,
      slope: Math.round(slope * 100) / 100,
      currentRate: rates[n - 1],
      forecast: next5,
    },
    confidence: 1,
    recommendations:
      trend === "declining"
        ? [
            "Investigate declining pass rate trend",
            "Review recent build changes",
            "Increase test frequency",
          ]
        : trend === "improving"
          ? ["Continue current practices", "Monitor for trend reversal"]
          : ["No action needed — rates stable"],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackFailureImpact(): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
  );
  const latestRun = sortedRuns[0];
  if (!latestRun) return genericFallback({ useCaseId: "failure-impact", parameters: {} });
  const results = getTestResultsForRun(latestRun.id);
  const failures = results.filter((r) => r.status === "FAIL");
  const suites = getTestSuites();
  const impactedSuites: { id: string; name: string; failedTests: string[] }[] = [];
  for (const suite of suites) {
    const failed = failures.filter((f) => suite.testIds.includes(f.id));
    if (failed.length > 0)
      impactedSuites.push({
        id: suite.id,
        name: suite.name,
        failedTests: failed.map((f) => f.name),
      });
  }
  const byCategory: Record<string, number> = {};
  for (const f of failures) {
    const cat = f.category || "Unknown";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  const impactTable = buildTable(
    "Failure Impact",
    ["Impact Dimension", "Value"],
    [
      ["Total failures", failures.length],
      ["Impacted suites", `${impactedSuites.length}/${suites.length}`],
      ["Impacted categories", Object.keys(byCategory).length],
    ],
  );

  const impactCatTable = buildTable(
    "By Category",
    ["Category", "Failures"],
    Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => [c, n]),
  );

  const impactSuiteTable = buildTable(
    "Impacted Suites",
    ["Suite", "Failed Tests"],
    impactedSuites.map((s) => [s.name, s.failedTests.join(", ")]),
  );

  const chartBlock = [impactTable, impactCatTable, impactSuiteTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    failures.length === 0
      ? "No failures in latest run."
      : `${failures.length} failure(s) impacting ${impactedSuites.length} suite(s) and ${Object.keys(byCategory).length} categories.`;

  return {
    useCaseId: "failure-impact",
    summary,
    details: `## Failure Impact Analysis — ${latestRun.id}\n\n${chartBlock}`,
    data: { totalFailures: failures.length, impactedSuites: impactedSuites.length, byCategory },
    confidence: 1,
    recommendations:
      failures.length > 0
        ? [
            ...impactedSuites.slice(0, 2).map((s) => `Review failures blocking suite: ${s.name}`),
            ...(failures.length > 5 ? ["Blast radius is significant — consider rollback"] : []),
          ]
        : ["No impact detected"],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackEnvDrift(): AIAnalysisResult {
  const envGroups: Record<
    string,
    {
      runs: number;
      avgPass: number;
      failures: number;
      categories: Record<string, { total: number; passed: number }>;
    }
  > = {};
  for (const run of RUNS) {
    const key = run.envId;
    if (!envGroups[key]) envGroups[key] = { runs: 0, avgPass: 0, failures: 0, categories: {} };
    envGroups[key].runs++;
    envGroups[key].avgPass += run.passPct;
    envGroups[key].failures += run.failures;
    const results = getTestResultsForRun(run.id);
    for (const r of results) {
      const cat = r.category || "Unknown";
      if (!envGroups[key].categories[cat]) envGroups[key].categories[cat] = { total: 0, passed: 0 };
      envGroups[key].categories[cat].total++;
      if (r.status === "PASS") envGroups[key].categories[cat].passed++;
    }
  }
  for (const key of Object.keys(envGroups)) {
    envGroups[key].avgPass = Math.round(envGroups[key].avgPass / envGroups[key].runs);
    for (const cat of Object.keys(envGroups[key].categories)) {
      const c = envGroups[key].categories[cat];
      c.passed = Math.round((c.passed / c.total) * 100);
    }
  }
  const envKeys = Object.keys(envGroups).sort();
  const driftPairs: {
    a: string;
    b: string;
    passDiff: number;
    categories: { cat: string; aRate: number; bRate: number; diff: number }[];
  }[] = [];
  for (let i = 0; i < envKeys.length; i++) {
    for (let j = i + 1; j < envKeys.length; j++) {
      const a = envGroups[envKeys[i]];
      const b = envGroups[envKeys[j]];
      const catDiffs = Object.keys({ ...a.categories, ...b.categories })
        .map((cat) => {
          const aRate = a.categories[cat]?.passed ?? 0;
          const bRate = b.categories[cat]?.passed ?? 0;
          return { cat, aRate, bRate, diff: Math.abs(aRate - bRate) };
        })
        .filter((c) => c.diff > 10)
        .sort((x, y) => y.diff - x.diff);
      driftPairs.push({
        a: envKeys[i],
        b: envKeys[j],
        passDiff: Math.abs(a.avgPass - b.avgPass),
        categories: catDiffs,
      });
    }
  }
  const significantDrift = driftPairs.filter((d) => d.passDiff > 5 || d.categories.length > 0);
  const driftTable = buildTable(
    "Environment Drift Analysis",
    ["Pair", "Pass Rate Diff", "Drifted Categories"],
    significantDrift.map((d) => [`${d.a} vs ${d.b}`, `${d.passDiff}%`, d.categories.length]),
  );

  const catDriftTables = significantDrift.flatMap((d) =>
    d.categories.length > 0
      ? [
          buildTable(
            `${d.a} vs ${d.b} — Category Drift`,
            ["Category", `${d.a}`, `${d.b}`, "Diff"],
            d.categories.map((c) => [c.cat, `${c.aRate}%`, `${c.bRate}%`, `${c.diff}%`]),
          ),
        ]
      : [],
  );

  const chartBlock = [driftTable, ...catDriftTables]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary =
    significantDrift.length === 0
      ? "No significant environment drift detected."
      : `${significantDrift.length} drift pair(s) detected.`;

  return {
    useCaseId: "env-drift",
    summary,
    details: `## Environment Drift Detection\n\n${chartBlock}`,
    data: { driftPairs: significantDrift, environments: envKeys },
    confidence: 1,
    recommendations: significantDrift
      .flatMap((d) => [
        ...d.categories
          .slice(0, 2)
          .map((c) => `Check config parity for ${c.cat} between ${d.a} and ${d.b}`),
        d.passDiff > 10 ? `Large drift (${d.passDiff}%) between ${d.a} and ${d.b}` : "",
      ])
      .filter(Boolean),
    generatedAt: new Date().toISOString(),
  };
}

function fallbackBuildRiskAssessment(request: AIAnalysisRequest): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
  );
  const latest = sortedRuns[0];
  if (!latest) return genericFallback({ useCaseId: "build-risk-assessment", parameters: {} });
  const prevRun = sortedRuns[1];
  const passRateScore = Math.max(0, 100 - latest.passPct) * 0.35;
  const failureScore = Math.min(100, latest.failures * 5) * 0.25;
  const trendScore = prevRun ? (latest.passPct < prevRun.passPct ? 25 : 0) : 12;
  const envScore = latest.failures > 10 && latest.env === "PROD" ? 15 : latest.failures > 0 ? 5 : 0;
  const totalScore = Math.round(passRateScore + failureScore + trendScore + envScore);
  const level =
    totalScore <= 20 ? "LOW" : totalScore <= 50 ? "MEDIUM" : totalScore <= 80 ? "HIGH" : "CRITICAL";
  const verdict =
    level === "LOW"
      ? "✅ Safe to deploy"
      : level === "MEDIUM"
        ? "⚠️ Proceed with caution"
        : "❌ Do not deploy";

  const buildChart = buildColumnChart(
    "Build Risk Score Breakdown",
    ["Factor", "Score"],
    [
      ["Pass Rate", Math.round(passRateScore)],
      ["Failures", Math.round(failureScore)],
      ["Trend", trendScore],
      ["Environment", envScore],
      ["Total", totalScore],
    ],
    ["#5b8af5", "#f59e0b", "#22c55e", "#a855f7", "#ef4444"],
  );

  const buildTable_ = buildTable(
    "Build Risk Assessment",
    ["Factor", "Weight", "Score", "Detail"],
    [
      ["Pass rate", "35%", `${Math.round(passRateScore)} pts`, `${latest.passPct}% pass rate`],
      ["Failures", "25%", `${Math.round(failureScore)} pts`, `${latest.failures} failures`],
      [
        "Trend",
        "25%",
        `${trendScore} pts`,
        prevRun ? `${prevRun.passPct}% → ${latest.passPct}%` : "No previous run",
      ],
      ["Environment", "15%", `${envScore} pts`, latest.env],
    ],
  );

  const chartBlock = [buildChart, buildTable_]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  return {
    useCaseId: "build-risk-assessment",
    summary: `Build assessment for \`${latest.build}\`: Risk score ${totalScore}/100 (${level}). ${verdict}.`,
    details: `## Build Risk Assessment — \`${latest.build}\`\n\n**Overall Risk: ${totalScore}/100 — ${level}**\n**Verdict: ${verdict}**\n\n${chartBlock}\n\n**Supports:** Promotion gate requires ≥95% pass rate for UAT → PROD.`,
    data: {
      build: latest.build,
      riskScore: totalScore,
      riskLevel: level,
      verdict,
      passPct: latest.passPct,
      failures: latest.failures,
    },
    confidence: 1,
    recommendations:
      level === "LOW"
        ? [`Build ${latest.build} approved for deployment`]
        : level === "MEDIUM"
          ? [`Review ${latest.failures} failures before deploying`, "Run additional smoke tests"]
          : [
              `BLOCK: Do not deploy ${latest.build}`,
              `Critical: ${latest.failures} failures at ${latest.passPct}% pass rate`,
              "Roll back to previous stable build",
            ],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackPromotionDecisionSupport(): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
  );
  const uatRuns = sortedRuns.filter((r) => r.env === "UAT");
  const prodRuns = sortedRuns.filter((r) => r.env === "PROD");
  const latestUat = uatRuns[0];
  const latestProd = prodRuns[0];
  if (!latestUat) {
    const noDataTable = buildTable(
      "Promotion Status",
      ["Check", "Value"],
      [
        ["UAT runs", "0"],
        ["Status", "No UAT data — cannot evaluate"],
      ],
    );
    const j = JSON.stringify({
      type: noDataTable.type,
      title: noDataTable.title,
      headers: noDataTable.headers,
      rows: noDataTable.rows,
      colors: noDataTable.colors,
      options: noDataTable.options,
    });
    return {
      useCaseId: "promotion-decision-support",
      summary: "No UAT runs found.",
      details: `\`\`\`chart\n${j}\n\`\`\`\n\nPromotion gate requires UAT test results. Run the UAT regression suite first.`,
      data: { uatRunCount: uatRuns.length, prodRunCount: prodRuns.length },
      confidence: 0.5,
      recommendations: ["Run UAT regression suite", "Ensure UAT pass rate ≥ 95%"],
      generatedAt: new Date().toISOString(),
    };
  }
  const gateMet = latestUat.passPct >= 95;
  const prodParity = latestProd ? Math.abs(latestUat.passPct - latestProd.passPct) < 5 : true;
  const checks = [
    { name: "UAT pass rate ≥ 95%", passed: gateMet, actual: `${latestUat.passPct}%` },
    {
      name: "UAT failures < 5",
      passed: latestUat.failures < 5,
      actual: `${latestUat.failures} failures`,
    },
    {
      name: "UAT/PROD parity (≤5% diff)",
      passed: prodParity,
      actual: latestProd
        ? `${Math.abs(latestUat.passPct - latestProd.passPct)}% diff`
        : "No PROD data",
    },
  ];
  const allPassed = checks.every((c) => c.passed);
  const decision = allPassed ? "PROMOTE" : gateMet ? "PENDING" : "BLOCK";

  const promoTable = buildTable(
    "Promotion Decision",
    ["Check", "Result", "Actual"],
    checks.map((c) => [c.name, c.passed ? "✅ Pass" : "❌ Fail", c.actual]),
  );

  const statusTable = buildTable(
    "Latest UAT Run",
    ["Metric", "Value"],
    [
      ["Run", latestUat.id],
      ["Build", latestUat.build],
      ["Pass rate", `${latestUat.passPct}%`],
      ["Failures", latestUat.failures],
    ],
  );

  const chartBlock = [statusTable, promoTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  return {
    useCaseId: "promotion-decision-support",
    summary: `Promotion decision: **${decision}**.`,
    details: `## Promotion Decision Support — UAT → PROD\n\n**Decision: ${decision === "PROMOTE" ? "✅ PROMOTE" : decision === "PENDING" ? "⚠️ PENDING" : "❌ BLOCK"}**\n\n${chartBlock}\n\n**Gate:** UAT regression suite must pass ≥95% before PROD property activation.`,
    data: {
      decision,
      checks,
      latestUat: latestUat.id,
      uatPassPct: latestUat.passPct,
      uatBuild: latestUat.build,
    },
    confidence: 1,
    recommendations:
      decision === "PROMOTE"
        ? ["Promote to PROD — all checks pass", "Monitor first PROD run after promotion"]
        : decision === "PENDING"
          ? ["Review failing checks and retry", "Check env-specific configuration differences"]
          : [
              "BLOCKED: UAT pass rate below 95% threshold",
              "Fix UAT failures before promotion attempt",
            ],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackTestDocGen(): AIAnalysisResult {
  const testCases = getTestCases();
  const suites = getTestSuites();
  const byCategory: Record<
    string,
    { count: number; automated: number; manual: number; priorities: string[] }
  > = {};
  for (const tc of testCases) {
    const cat = tc.category || "Unknown";
    if (!byCategory[cat]) byCategory[cat] = { count: 0, automated: 0, manual: 0, priorities: [] };
    byCategory[cat].count++;
    if (tc.automated) byCategory[cat].automated++;
    else byCategory[cat].manual++;
    if (tc.priority && !byCategory[cat].priorities.includes(tc.priority))
      byCategory[cat].priorities.push(tc.priority);
  }
  const testInventory = Object.entries(byCategory)
    .map(([cat, s]) => ({
      category: cat,
      total: s.count,
      automated: s.automated,
      manual: s.manual,
      coverage: s.count > 0 ? Math.round((s.automated / s.count) * 100) : 0,
      priorities: s.priorities.sort().join(", "),
    }))
    .sort((a, b) => b.total - a.total);

  const docTable = buildTable(
    "Test Inventory by Category",
    ["Category", "Total", "Automated", "Manual", "Coverage", "Priorities"],
    testInventory.map((c) => [
      c.category,
      c.total,
      c.automated,
      c.manual,
      `${c.coverage}%`,
      c.priorities,
    ]),
  );

  const overviewTable = buildTable(
    "Overview",
    ["Metric", "Value"],
    [
      ["Total tests", testCases.length],
      ["Categories", testInventory.length],
      ["Suites", suites.length],
      ["Automated", testCases.filter((t) => t.automated).length],
      ["Manual", testCases.filter((t) => !t.automated).length],
    ],
  );

  const suiteTable = buildTable(
    "Test Suites",
    ["Suite", "Tests", "Environments", "Parallelism"],
    suites.map((s) => [s.name, s.testIds.length, s.envIds.join(", "), s.config.parallelism]),
  );

  const chartBlock = [overviewTable, docTable, suiteTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  const summary = `Documentation generated: ${testCases.length} tests across ${testInventory.length} categories in ${suites.length} suites.`;

  return {
    useCaseId: "test-doc-gen",
    summary,
    details: `## Test Documentation\n\n${chartBlock}\n\n*Generated from ${testCases.length} test cases and ${suites.length} suites.*`,
    data: { totalTests: testCases.length, totalSuites: suites.length, categories: testInventory },
    confidence: 1,
    recommendations: testInventory
      .filter((c) => c.coverage < 50)
      .map((c) => `Increase automation in ${c.category} (${c.coverage}% coverage)`),
    generatedAt: new Date().toISOString(),
  };
}

function fallbackReleaseReadiness(): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
  );
  const latest = sortedRuns[0];
  if (!latest) return genericFallback({ useCaseId: "release-readiness", parameters: {} });
  const envGroups: Record<string, { passPct: number; failures: number; status: string }> = {};
  for (const run of RUNS) {
    const key = run.envId;
    if (
      !envGroups[key] ||
      new Date(run.started).getTime() > new Date(envGroups[key].status).getTime()
    ) {
      envGroups[key] = { passPct: run.passPct, failures: run.failures, status: run.status };
    }
  }
  const envCount = Object.keys(envGroups).length;
  const healthyEnvs = Object.values(envGroups).filter((e) => e.passPct >= 90).length;
  const overallScore = Math.round(
    latest.passPct * 0.4 +
      (healthyEnvs / Math.max(envCount, 1)) * 100 * 0.3 +
      Math.max(0, 100 - latest.failures * 5) * 0.3,
  );
  const verdict =
    overallScore >= 80 ? "✅ RELEASE READY" : overallScore >= 50 ? "⚠️ CAUTION" : "❌ BLOCKED";

  const releaseTable = buildTable(
    "Release Readiness Score",
    ["Category", "Weight", "Value"],
    [
      ["Pass rate", "40%", `${latest.passPct}%`],
      ["Env health", "30%", `${healthyEnvs}/${envCount} healthy`],
      ["Failure impact", "30%", `${latest.failures} failures`],
      ["Overall", "100%", `${overallScore}/100 — ${verdict}`],
    ],
  );

  const envTable = buildTable(
    "Environment Health",
    ["Environment", "Pass Rate", "Failures"],
    Object.entries(envGroups).map(([k, v]) => [k, `${v.passPct}%`, v.failures]),
  );

  const chartBlock = [releaseTable, envTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  return {
    useCaseId: "release-readiness",
    summary: `Release readiness: ${overallScore}/100. ${verdict}.`,
    details: `## Release Readiness Check\n\n**Overall Score: ${overallScore}/100 — ${verdict}**\n\n### Latest Build: \`${latest.build}\`\n\n${chartBlock}\n\n**Gate:** UAT must pass ≥95% before PROD promotion.`,
    data: { score: overallScore, verdict, healthyEnvs, totalEnvs: envCount, build: latest.build },
    confidence: 1,
    recommendations:
      verdict === "✅ RELEASE READY"
        ? [`Build ${latest.build} approved for release`]
        : verdict === "⚠️ CAUTION"
          ? [`Review environments with failures`, `Check latest run: ${latest.failures} failures`]
          : [
              `RELEASE BLOCKED: ${latest.failures} failures at ${latest.passPct}% pass rate`,
              "Fix blocking issues before release attempt",
            ],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackEnvHealthSummary(): AIAnalysisResult {
  const envMap: Record<
    string,
    { runs: number; passRates: number[]; failures: number; duration: number }
  > = {};
  for (const run of RUNS) {
    const key = run.envId;
    if (!envMap[key]) envMap[key] = { runs: 0, passRates: [], failures: 0, duration: 0 };
    envMap[key].runs++;
    envMap[key].passRates.push(run.passPct);
    envMap[key].failures += run.failures;
    envMap[key].duration += run.durationMs || 0;
  }
  const health = Object.entries(envMap)
    .map(([key, v]) => {
      const avgPass = Math.round(v.passRates.reduce((s, p) => s + p, 0) / v.passRates.length);
      const status = avgPass >= 90 ? "✅" : avgPass >= 75 ? "⚠️" : "❌";
      return {
        env: key,
        avgPass,
        failures: v.failures,
        runs: v.runs,
        avgDuration: Math.round(v.duration / v.runs),
        status,
      };
    })
    .sort((a, b) => b.avgPass - a.avgPass);
  const healthy = health.filter((h) => h.status === "✅").length;

  const healthChart = buildColumnChart(
    "Environment Health (Avg Pass Rate %)",
    ["Environment", "Avg Pass Rate"],
    health.map((h) => [h.env, h.avgPass]),
    ["#22c55e", "#f59e0b", "#ef4444"],
    { vAxis: { minValue: 0, maxValue: 100 } },
  );

  const healthTable = buildTable(
    "Environment Health Details",
    ["Environment", "Avg Pass Rate", "Total Failures", "Runs", "Avg Duration"],
    health.map((h) => [h.env, `${h.avgPass}%`, h.failures, h.runs, `${h.avgDuration}ms`]),
  );

  const chartBlock = [healthChart, healthTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  return {
    useCaseId: "env-health-summary",
    summary: `Environment health: ${healthy}/${health.length} healthy.`,
    details: `## Environment Health Snapshot\n\n${chartBlock}\n\n**Summary:** ${healthy}/${health.length} environments healthy.`,
    data: { environments: health, totalEnvs: health.length, healthyEnvs: healthy },
    confidence: 1,
    recommendations: health
      .filter((h) => h.status !== "✅")
      .map((h) => `Investigate ${h.env} (${h.avgPass}% avg pass rate)`),
    generatedAt: new Date().toISOString(),
  };
}

function fallbackRegressionReport(): AIAnalysisResult {
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
  );
  const latest = sortedRuns[0];
  const prev = sortedRuns[1];
  if (!latest || !prev) {
    const noDataTable = buildTable(
      "Regression Status",
      ["Metric", "Value"],
      [
        ["Runs available", RUNS.length],
        ["Minimum required", 2],
      ],
    );
    const j = JSON.stringify({
      type: noDataTable.type,
      title: noDataTable.title,
      headers: noDataTable.headers,
      rows: noDataTable.rows,
      colors: noDataTable.colors,
      options: noDataTable.options,
    });
    return {
      useCaseId: "regression-report",
      summary: "Need at least 2 runs to compare.",
      details: `\`\`\`chart\n${j}\n\`\`\`\n\nInsufficient run data for regression comparison.`,
      data: { runCount: RUNS.length, minRequired: 2 },
      confidence: 0.5,
      recommendations: ["Add more test runs for regression analysis"],
      generatedAt: new Date().toISOString(),
    };
  }
  const latestResults = getTestResultsForRun(latest.id);
  const prevResults = getTestResultsForRun(prev.id);
  const latestMap = new Map(latestResults.map((r) => [r.id, r]));
  const prevMap = new Map(prevResults.map((r) => [r.id, r]));
  let regressed = 0,
    improved = 0,
    same = 0;
  const regressedTests: { id: string; name: string; from: string; to: string }[] = [];
  const improvedTests: { id: string; name: string; from: string; to: string }[] = [];
  for (const [id, lr] of latestMap) {
    const pr = prevMap.get(id);
    if (!pr) continue;
    if (pr.status === "PASS" && lr.status === "FAIL") {
      regressed++;
      regressedTests.push({ id, name: lr.name, from: pr.status, to: lr.status });
    } else if (pr.status === "FAIL" && lr.status === "PASS") {
      improved++;
      improvedTests.push({ id, name: lr.name, from: pr.status, to: lr.status });
    } else {
      same++;
    }
  }

  const regSummaryTable = buildTable(
    "Quick Regression Report",
    ["Metric", "Value"],
    [
      ["Previous build", `${prev.build} (${prev.passPct}%)`],
      ["Latest build", `${latest.build} (${latest.passPct}%)`],
      [
        "Change",
        `${latest.passPct - prev.passPct >= 0 ? "+" : ""}${(latest.passPct - prev.passPct).toFixed(1)}%`,
      ],
      ["Regressed", regressed],
      ["Improved", improved],
      ["Unchanged", same],
    ],
  );

  const regTable = buildTable(
    "Regressed Tests (PASS → FAIL)",
    ["Test ID", "Name"],
    regressedTests.map((t) => [t.id, t.name]),
  );

  const impTable = buildTable(
    "Improved Tests (FAIL → PASS)",
    ["Test ID", "Name"],
    improvedTests.map((t) => [t.id, t.name]),
  );

  const chartBlock = [regSummaryTable, regTable, impTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  return {
    useCaseId: "regression-report",
    summary: `Regression report: ${regressed} regressed, ${improved} improved, ${same} unchanged.`,
    details: `## Quick Regression Report\n\n${chartBlock}`,
    data: {
      regressed,
      improved,
      same,
      prevBuild: prev.build,
      latestBuild: latest.build,
      prevPassPct: prev.passPct,
      latestPassPct: latest.passPct,
    },
    confidence: 1,
    recommendations:
      regressed > 0
        ? [
            `Investigate ${regressed} regressed test(s)`,
            `Run diff between ${prev.build} and ${latest.build}`,
          ]
        : ["No regressions — good to proceed"],
    generatedAt: new Date().toISOString(),
  };
}

function genericFallback(request: AIAnalysisRequest): AIAnalysisResult {
  const useCase = getUseCaseById(request.useCaseId);
  const genericTable = buildTable(
    "Generic Analysis",
    ["Data Source", "Count"],
    [
      ["Runs", RUNS.length],
      ["Test cases", getTestCases().length],
      ["Diff rows", DIFF_ROWS.length],
    ],
  );
  const j = JSON.stringify({
    type: genericTable.type,
    title: genericTable.title,
    headers: genericTable.headers,
    rows: genericTable.rows,
    colors: genericTable.colors,
    options: genericTable.options,
  });
  return {
    useCaseId: request.useCaseId,
    summary: `Analysis for "${request.useCaseId}" completed (offline mode).`,
    details: `Analysis type: ${useCase?.name || request.useCaseId}\n\n\`\`\`chart\n${j}\n\`\`\`\n\nParameters: ${JSON.stringify(request.parameters)}\n\nSystem is running in fallback mode. Configure an LLM provider for enriched analysis.`,
    data: { runCount: RUNS.length, testCount: getTestCases().length, diffCount: DIFF_ROWS.length },
    confidence: 0.5,
    recommendations: [
      "Configure OpenAI or Chrome AI for full analysis",
      "Use specific analysis types (failure-analysis, flaky-detection, etc.)",
      "Data is available for all standard queries",
    ],
    generatedAt: new Date().toISOString(),
  };
}

function extractRecommendations(text: string): string[] {
  const lines = text.split("\n");
  const recommendations: string[] = [];
  let inRecs = false;
  for (const line of lines) {
    if (line.toLowerCase().includes("recommendation")) inRecs = true;
    else if (inRecs && line.trim().startsWith("-"))
      recommendations.push(line.trim().replace(/^-\s*/, ""));
    else if (inRecs && line.trim().startsWith("•"))
      recommendations.push(line.trim().replace(/^•\s*/, ""));
    else if (inRecs && line.trim().startsWith("1."))
      recommendations.push(line.trim().replace(/^\d+\.\s*/, ""));
    else if (inRecs && line.trim() === "") inRecs = false;
  }
  return recommendations.slice(0, 5);
}

export async function generateInsights(): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  const latest = sortedRuns[sortedRuns.length - 1];
  if (!latest) return insights;

  if (latest.failures > 0) {
    insights.push({
      id: `insight_fail_${latest.id}`,
      type: latest.failures > 10 ? "critical" : "warning",
      title: `${latest.failures} failure(s) in latest run`,
      description: `Build ${latest.build} (${latest.env}) has ${latest.failures} failures at ${latest.passPct}% pass rate.`,
      category: "failure",
      severity: latest.failures > 10 ? 90 : 50,
      relatedData: { runId: latest.id, failures: latest.failures, passPct: latest.passPct },
      timestamp: new Date().toISOString(),
    });
  }

  if (sortedRuns.length >= 2) {
    const prev = sortedRuns[sortedRuns.length - 2];
    if (prev && latest.passPct < prev.passPct - 10) {
      insights.push({
        id: `insight_drop_${latest.id}`,
        type: "critical",
        title: "Significant pass rate drop detected",
        description: `Pass rate dropped ${prev.passPct}% → ${latest.passPct}% between ${prev.build} and ${latest.build}.`,
        category: "trend",
        severity: 85,
        relatedData: {
          from: prev.passPct,
          to: latest.passPct,
          fromBuild: prev.build,
          toBuild: latest.build,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  const testStats = computeTestStats();
  if (testStats.coverage < 60) {
    insights.push({
      id: "insight_coverage",
      type: "warning",
      title: "Low test coverage",
      description: `Test category coverage is at ${testStats.coverage}%. Consider adding tests for uncovered categories.`,
      category: "coverage",
      severity: 40,
      relatedData: { coverage: testStats.coverage },
      timestamp: new Date().toISOString(),
    });
  }

  const envGroups: Record<string, number> = {};
  for (const run of RUNS) {
    const key = `${run.envId}`;
    if (!envGroups[key]) envGroups[key] = 0;
    envGroups[key] += run.failures;
  }
  const envEntries = Object.entries(envGroups);
  if (envEntries.length >= 2 && Math.abs(envEntries[0][1] - envEntries[1][1]) > 10) {
    insights.push({
      id: "insight_env_drift",
      type: "warning",
      title: "Potential environment drift",
      description: `Failure counts differ significantly between environments: ${envEntries.map(([k, v]) => `${k}=${v}`).join(", ")}.`,
      category: "env",
      severity: 50,
      relatedData: { envFailures: envGroups },
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
}

function fallbackSetupGuide(): AIAnalysisResult {
  const topics = [
    "Fork the repo on GitHub",
    "Edit config/akamai-config.yml — add your property name, contractId, groupId, cpcode",
    "Edit config/environments.yml — set QA/UAT/PROD base URLs (must be https://)",
    "Edit config/test-suites.yml — configure suite IDs, cron schedules, runners, tags",
    "Validate locally: node scripts/validate-config.mjs",
    "Enable GitHub Pages: Settings → Pages → Source: GitHub Actions",
    "Push — CI validates config, builds, and deploys",
  ];
  const secretsList = [
    ["AKAMAI_CLIENT_TOKEN", "Akamai EdgeGrid client token"],
    ["AKAMAI_ACCESS_TOKEN", "Akamai EdgeGrid access token"],
    ["AKAMAI_CLIENT_SECRET", "Akamai EdgeGrid client secret"],
    ["AKAMAI_HOST", "EdgeGrid host (akab-xxxx.luna.akamaiapis.net)"],
  ];
  const errors = [
    ["contractId must start with ctr_", "Update contractId in akamai-config.yml"],
    ["groupId must start with grp_", "Update groupId in akamai-config.yml"],
    ["baseUrl must start with https://", "Use https:// in environments.yml baseUrl"],
    ["Unknown environment X in suite Y", "Env label must match environments.yml exactly"],
    ["Invalid cron expression", "Use 5-field cron, e.g. 0 6 * * *"],
  ];

  const stepsTable = buildTable(
    "Quick Start",
    ["#", "Step"],
    topics.map((t, i) => [i + 1, t]),
  );
  const secretsTable = buildTable("Required GitHub Secrets", ["Secret", "Purpose"], secretsList);
  const errorsTable = buildTable("Common Validation Errors", ["Error", "Fix"], errors);

  const chartBlock = [stepsTable, secretsTable, errorsTable]
    .map((c) => {
      const j = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${j}\n\`\`\``;
    })
    .join("\n\n");

  return {
    useCaseId: "setup-guide",
    summary: "AWARE Setup & Configuration Guide",
    details: `## AWARE Setup & Configuration\n\n### Quick Start (7 Steps)\n\n${chartBlock}\n\n### Trigger a manual test run\n\`\`\`bash\ngh workflow run run-tests.yml \\\n  --field suite=suite_smoke \\\n  --field environment="QA / Staging"\n\`\`\`\n\nFor more detail see **SETUP.md** in the repo root.`,
    data: null,
    confidence: 100,
    recommendations: [
      "Run `node scripts/validate-config.mjs` to check your config before pushing",
      "Enable GitHub Pages (Settings → Pages → Source: GitHub Actions) before first push",
      "Add all four Akamai secrets to GitHub before running tests",
    ],
    generatedAt: new Date().toISOString(),
  };
}

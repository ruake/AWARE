import type { AIAnalysisRequest, AIAnalysisResult, AIInsight } from "./types";
import { AI_USE_CASES, getUseCaseById } from "./useCases";
import { buildAIContext, buildSystemPrompt } from "./context";
import { getSystemPromptForUseCase } from "./prompts";
import { getProvider } from "@/lib/llm";
import { RUNS, DIFF_ROWS, getTestResultsForRun } from "@/lib/runs";
import { getTestCases, computeTestStats } from "@/lib/testCases";
import { getTestSuites } from "@/lib/testSuites";

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

export function runFallbackAnalysis(request: AIAnalysisRequest): AIAnalysisResult {
  switch (request.useCaseId) {
    case "failure-analysis":
      return fallbackFailureAnalysis(request);
    case "flaky-detection":
      return fallbackFlakyDetection(request);
    case "anomaly-detection":
      return fallbackAnomalyDetection();
    case "risk-scoring":
      return fallbackRiskScoring(request);
    case "env-comparison":
      return fallbackEnvComparison();
    case "category-health":
      return fallbackCategoryHealth();
    case "coverage-gap":
      return fallbackCoverageGap();
    case "smart-alerting":
      return fallbackSmartAlerting();
    case "run-frequency":
      return fallbackRunFrequency();
    case "suite-health":
      return fallbackSuiteHealth();
    case "quality-gate":
      return fallbackQualityGate();
    case "duration-budget":
      return fallbackDurationBudget();
    case "test-redundancy":
      return fallbackRedundancyDetection();
    default:
      return genericFallback(request);
  }
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
    .sort(([, a], [, b]) => b.failed - a.failed)
    .map(
      ([cat, s]) =>
        `${cat}: ${s.failed}/${s.total} failed (${Math.round((s.failed / s.total) * 100)}%)`,
    );
  const topFailures = failuresArr.slice(0, 5).map((r) => r.name);
  const failCatChart = JSON.stringify({
    type: "BarChart",
    title: "Failures by Category",
    headers: ["Category", "Failures"],
    rows: Object.entries(byCategory)
      .filter(([, s]) => s.failed > 0)
      .map(([cat, s]) => [cat, s.failed]),
    colors: ["#ef4444"],
    options: {
      legend: { position: "none" },
      hAxis: { textStyle: { fontSize: 10 } },
      vAxis: { textStyle: { fontSize: 9 } },
    },
  });
  const summary =
    failuresArr.length === 0
      ? `No failures in run ${runId}. All ${results.length} tests passed.`
      : `Found ${failuresArr.length} failures in ${results.length} tests (${Math.round((failuresArr.length / results.length) * 100)}% failure rate). Top categories: ${categoryBreakdown.slice(0, 3).join("; ")}. Most common failing tests: ${topFailures.join(", ")}.`;
  return {
    useCaseId: "failure-analysis",
    summary,
    details: `## Failure Analysis — ${runId}\n\n| Metric | Value |\n|--------|-------|\n| Total tests | ${results.length} |\n| Failures | **${failuresArr.length}** |\n| Pass rate | ${results.length > 0 ? Math.round(((results.length - failuresArr.length) / results.length) * 100) : 0}% |\n\n\`\`\`chart\n${failCatChart}\n\`\`\`\n\n### By Category\n${categoryBreakdown.map((c) => `\n- ${c}`).join("")}\n\n### Top Failing Tests\n${topFailures.map((n, i) => `${i + 1}. \`${n}\``).join("\n")}`,
    data: { runId, totalTests: results.length, failures: failuresArr.length, byCategory },
    confidence: 1,
    recommendations:
      failuresArr.length > 0
        ? [
            `Investigate ${byCategory[Object.keys(byCategory).find((k) => byCategory[k].failed > 0) || ""]?.tests[0] || "failures"}`,
            categoryBreakdown.length > 0
              ? `Focus on ${categoryBreakdown[0]?.split(":")[0] || "failing"} category`
              : "",
            failuresArr.length > 5
              ? "Consider rolling back the last build change"
              : "Review individual failures for patterns",
          ]
        : ["No action needed", "Monitor next run for regressions"],
    generatedAt: new Date().toISOString(),
  };
}

function fallbackFlakyDetection(request: AIAnalysisRequest): AIAnalysisResult {
  const lookback = (request.parameters.lookbackRuns as number) || 5;
  const recentRuns = [...RUNS]
    .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
    .slice(0, lookback);
  const flakyTests: { id: string; flips: number; score: number; sequence: string }[] = [];
  for (const run of recentRuns) {
    const results = getTestResultsForRun(run.id);
    for (const r of results) {
      let entry = flakyTests.find((f) => f.id === r.id);
      if (!entry) {
        entry = { id: r.id, flips: 0, score: 0, sequence: "" };
        flakyTests.push(entry);
      }
    }
  }
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
  const flakyChart = JSON.stringify({
    type: "BarChart",
    title: "Flakiness Scores",
    headers: ["Test", "Flakiness %"],
    rows: flaky.slice(0, 10).map((f) => [f.id, f.score]),
    colors: ["#f59e0b"],
    options: {
      legend: { position: "none" },
      hAxis: { textStyle: { fontSize: 10 } },
      vAxis: { textStyle: { fontSize: 9 }, minValue: 0, maxValue: 100 },
    },
  });
  const summary =
    flaky.length === 0
      ? `No flaky tests detected across the last ${lookback} runs.`
      : `Found ${flaky.length} flaky tests across ${lookback} runs. Top: ${flaky
          .slice(0, 3)
          .map((f) => `${f.id} (${f.score}% flakiness)`)
          .join(", ")}.`;
  return {
    useCaseId: "flaky-detection",
    summary,
    details: `## Flaky Test Detection (last ${lookback} runs)\n\nTests with status flips: **${flaky.length}**\n\n\`\`\`chart\n${flakyChart}\n\`\`\`\n\n| Test ID | Flakiness | Status Sequence |\n|---------|-----------|----------------|\n${flaky.map((f) => `| \`${f.id}\` | ${f.score}% | ${f.sequence} |`).join("\n")}`,
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
  const passRateChart = JSON.stringify({
    type: "ColumnChart",
    title: "Pass Rate Trend",
    headers: ["Run", "Pass Rate"],
    rows: sortedRuns.map((r) => [r.id.slice(-8), r.passPct]),
    colors: ["#5b8af5"],
    options: {
      vAxis: { minValue: 0, maxValue: 100, textStyle: { fontSize: 10 } },
      hAxis: { textStyle: { fontSize: 8 }, slantedText: true, slantedTextAngle: 45 },
      legend: { position: "none" },
    },
  });
  const summary =
    anomalies.length === 0
      ? "No significant anomalies detected in pass rate trends."
      : `Detected ${anomalies.length} anomalous runs. ${anomalies.filter((a) => a.flag === "below average").length} below-average runs need investigation.`;
  return {
    useCaseId: "anomaly-detection",
    summary,
    details: `## Anomaly Detection\n\n| Metric | Value |\n|--------|-------|\n| Runs analyzed | ${sortedRuns.length} |\n| Anomalies found | **${anomalies.length}** |\n\n\`\`\`chart\n${passRateChart}\n\`\`\`\n\n### Anomalous Runs\n\n| Run ID | Pass Rate | Z-Score | Flag |\n|--------|-----------|---------|------|\n${anomalies.map((a) => `| \`${a.runId}\` | ${a.passPct}% | ${a.zScore} | ${a.flag} |`).join("\n")}`,
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
  return {
    useCaseId: "risk-scoring",
    summary: `Build ${run.build}: Risk score ${totalScore}/100 (${level}). Pass rate: ${run.passPct}%, Failures: ${run.failures}.`,
    details: `## Risk Assessment — ${runId} (\`${run.build}\`)\n\n**Overall Risk: ${totalScore}/100 — ${level}**\n\n| Component | Weight | Score |\n|-----------|--------|-------|\n| Pass rate (${run.passPct}%) | 40% | ${Math.round(passRateScore)} pts |\n| Failures (${run.failures}) | 20% | ${Math.round(failureScore)} pts |\n| Trend | 20% | ${trendScore} pts |\n| Environment (${run.env}) | 20% | ${envScore} pts |\n\n**Recommendation:** ${level === "LOW" ? "✅ Safe to deploy" : level === "MEDIUM" ? "⚠️ Investigate before deploying" : "❌ Do not deploy — blocking issues"}`,
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
    const key = `${run.target}/${run.env}`;
    if (!envGroups[key]) envGroups[key] = { runs: 0, avgPass: 0, failures: 0 };
    envGroups[key].runs++;
    envGroups[key].avgPass += run.passPct;
    envGroups[key].failures += run.failures;
  }
  for (const key of Object.keys(envGroups)) {
    envGroups[key].avgPass = Math.round(envGroups[key].avgPass / envGroups[key].runs);
  }
  const envLabels = Object.keys(envGroups).sort();
  const summary =
    envLabels.length >= 2
      ? `${envLabels.join(" vs ")}: ${envLabels.map((l) => `${l}=${envGroups[l].avgPass}% avg pass rate`).join(", ")}. ${envGroups[envLabels[0]]?.avgPass !== envGroups[envLabels[1]]?.avgPass ? "Scores differ — potential env drift." : "Scores are consistent across environments."}`
      : `Only ${envLabels.length} environment(s) with data.`;
  return {
    useCaseId: "env-comparison",
    summary,
    details: `## Environment Comparison\n\n| Environment | Runs | Avg Pass Rate | Total Failures |\n|-------------|------|---------------|----------------|\n${envLabels.map((l) => `| ${l} | ${envGroups[l].runs} | ${envGroups[l].avgPass}% | ${envGroups[l].failures} |`).join("\n")}`,
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
  const summary =
    healthScores.length === 0
      ? "No category data available."
      : `Category health across ${healthScores.length} categories. ${unhealthy.length} unhealthy: ${unhealthy.map((h) => `${h.category} (${h.passRate}%)`).join(", ")}. Healthiest: ${healthScores
          .filter((h) => h.health === "healthy")
          .slice(0, 2)
          .map((h) => `${h.category} (${h.passRate}%)`)
          .join(", ")}.`;
  return {
    useCaseId: "category-health",
    summary,
    details: `## Category Health Report\n\n| Category | Pass Rate | Tests | Avg Duration | Health |\n|----------|-----------|-------|-------------|--------|\n${healthScores.map((h) => `| ${h.category} | ${h.passRate}% | ${h.testCount} | ${h.avgDuration}ms | ${h.health === "healthy" ? "✅ healthy" : h.health === "fair" ? "⚠️ fair" : "❌ unhealthy"} |`).join("\n")}`,
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
  const summary =
    gaps.length === 0
      ? "Good coverage across all dimensions."
      : `Found ${gaps.length} gaps: ${gaps.join("; ")}.`;
  return {
    useCaseId: "coverage-gap",
    summary,
    details: `## Coverage Gap Analysis\n\n| Metric | Value |\n|--------|-------|\n| Total tests | ${testStats.total} |\n| Categories covered | ${Object.keys(testStats.byCategory || {}).length} |\n| Coverage score | ${testStats.coverage}% |\n| Automated | ${testStats.automated} |\n| Manual | ${testStats.manual} |\n\n### Gaps\n${gaps.map((g) => `- ❌ ${g}`).join("\n") || "- ✅ None detected"}\n\n### By Priority\n| Priority | Count |\n|----------|-------|\n${Object.entries(
      testStats.byPriority || {},
    )
      .map(([k, v]) => `| ${k} | ${v} |`)
      .join("\n")}\n\n### By Severity\n| Severity | Count |\n|----------|-------|\n${Object.entries(
      testStats.bySeverity || {},
    )
      .map(([k, v]) => `| ${k} | ${v} |`)
      .join("\n")}`,
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
      description: `Pass rate dropped from ${prev.passPct}% to ${latest.passPct}% between builds ${prev.build} and ${latest.build}.`,
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
      description: `${lowScoreRuns.map((r) => `Run ${r.id}: ${r.passPct}%`).join(", ")}`,
    });
  const summary =
    alerts.length === 0
      ? "No active alerts. All systems nominal."
      : `${alerts.length} active alert(s): ${alerts.filter((a) => a.severity === "critical").length} critical, ${alerts.filter((a) => a.severity === "warning").length} warnings.`;
  return {
    useCaseId: "smart-alerting",
    summary,
    details: `## Smart Alerts\n\n| Severity | Title | Description |\n|----------|-------|-------------|\n${alerts.map((a) => `| **${a.severity.toUpperCase()}** | ${a.title} | ${a.description} |`).join("\n") || "| — | No alerts | All systems nominal |"}`,
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
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff > 1) gaps.push({ date: days[i], gapDays: diff - 1 });
  }
  const summary = `${RUNS.length} runs across ${days.length} days (${runsPerDay} runs/day). ${gaps.length > 0 ? `${gaps.length} gap(s) found: ${gaps.map((g) => `${g.gapDays}d before ${g.date}`).join(", ")}.` : "No gaps in coverage."}`;
  return {
    useCaseId: "run-frequency",
    summary,
    details: `## Run Frequency Analysis\n\n| Metric | Value |\n|--------|-------|\n| Total runs | ${RUNS.length} |\n| Days covered | ${days.length} |\n| Avg runs/day | ${runsPerDay} |\n\n### Runs by Day\n\n| Date | Runs |\n|------|------|\n${days.map((d) => `| ${d} | ${byDay[d]} |`).join("\n")}\n\n### Gaps\n${gaps.map((g) => `- ⚠️ ${g.gapDays} day(s) before ${g.date}`).join("\n") || "- ✅ None"}`,
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
  const summary =
    suiteHealth.length === 0
      ? "No suite data available."
      : `Suite health across ${suiteHealth.length} suites. Unhealthiest: ${suiteHealth[0]?.name} (${suiteHealth[0]?.passRate}%). Healthiest: ${suiteHealth[suiteHealth.length - 1]?.name} (${suiteHealth[suiteHealth.length - 1]?.passRate}%).`;
  return {
    useCaseId: "suite-health",
    summary,
    details: `## Suite Health\n\n| Suite | Pass Rate | Executions | Parallelism |\n|-------|-----------|------------|-------------|\n${suiteHealth.map((s) => `| ${s.name} (\`${s.id}\`) | ${s.passRate}% | ${s.totalExecutions} | ${s.config.parallelism} |`).join("\n")}`,
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
  ].filter(Boolean);
  const allPassed = checks.every((c) => c.passed);
  const summary = allPassed
    ? "Quality gate PASSED — all checks met."
    : `Quality gate FAILED — ${checks.filter((c) => !c.passed).length}/${checks.length} checks failed.`;
  return {
    useCaseId: "quality-gate",
    summary,
    details: `## Quality Gate — ${latest.id} (\`${latest.build}\`)\n\n**Result: ${allPassed ? "✅ PASSED" : "❌ FAILED"}**\n\n| Check | Status | Actual |\n|-------|--------|--------|\n${checks.map((c) => `| ${c.name} | ${c.passed ? "✅ Pass" : "❌ Fail"} | ${c.actual} |`).join("\n")}`,
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
      const max = Math.max(...durations);
      return { id, avg, max, count: durations.length };
    })
    .filter((t) => t.avg > 1000)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);
  const slowChart = JSON.stringify({
    type: "BarChart",
    title: "Slowest Tests (avg ms)",
    headers: ["Test", "Avg Duration"],
    rows: slowTests.map((t) => [t.id, t.avg]),
    colors: ["#ef4444"],
    isHorizontal: true,
    options: {
      legend: { position: "none" },
      hAxis: { textStyle: { fontSize: 10 } },
      vAxis: { textStyle: { fontSize: 9 } },
    },
  });
  const summary =
    slowTests.length === 0
      ? "No tests exceed duration budgets."
      : `${slowTests.length} tests exceed 1000ms average duration. Slowest: ${slowTests[0]?.id} (avg ${slowTests[0]?.avg}ms).`;
  return {
    useCaseId: "duration-budget",
    summary,
    details: `## Duration Budget Tracking\n\nTests exceeding **1000ms** average:\n\n\`\`\`chart\n${slowChart}\n\`\`\`\n\n| Test ID | Avg (ms) | Max (ms) | Runs |\n|---------|----------|----------|------|\n${slowTests.map((t) => `| \`${t.id}\` | **${t.avg}** | ${t.max} | ${t.count} |`).join("\n")}`,
    data: { slowTests },
    confidence: 1,
    recommendations: slowTests.slice(0, 3).map((t) => `Optimize ${t.id} (avg ${t.avg}ms)`),
    generatedAt: new Date().toISOString(),
  };
}

function fallbackRedundancyDetection(): AIAnalysisResult {
  const testCases = getTestCases();
  // Group by category and find tests sharing the same base name prefix
  const byCategory: Record<string, { id: string; name: string }[]> = {};
  for (const tc of testCases) {
    const cat = tc.category || "Unknown";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ id: tc.id, name: tc.name });
  }
  const redundancies: { category: string; tests: { id: string; name: string }[] }[] = [];
  for (const [cat, tests] of Object.entries(byCategory)) {
    // Build prefix groups: share first 20+ chars of name
    const prefixes: Record<string, { id: string; name: string }[]> = {};
    for (const t of tests) {
      // Remove trailing digits/suffix to get base pattern
      const base = t.name.replace(/[_#\d]+$/, "").trim();
      if (!prefixes[base]) prefixes[base] = [];
      prefixes[base].push(t);
    }
    for (const [, group] of Object.entries(prefixes)) {
      if (group.length > 1) redundancies.push({ category: cat, tests: group });
    }
  }
  redundancies.sort((a, b) => b.tests.length - a.tests.length);
  const summary =
    redundancies.length === 0
      ? "No potentially redundant tests detected."
      : `Found ${redundancies.length} potential redundancy groups across ${new Set(redundancies.map((r) => r.category)).size} categories. Largest: ${redundancies[0]?.category} (${redundancies[0]?.tests.length} tests).`;
  return {
    useCaseId: "test-redundancy",
    summary,
    details: `## Redundancy Detection\n\n| Category | Similar Tests | Candidates |\n|----------|---------------|------------|\n${redundancies.map((r) => `| ${r.category} | **${r.tests.length}** | ${r.tests.map((t) => t.id).join(", ")} |`).join("\n") || "| — | No redundancies found | — |"}`,
    data: { redundancyGroups: redundancies },
    confidence: 1,
    recommendations: redundancies
      .slice(0, 3)
      .map(
        (r) =>
          `Review ${r.tests.length} tests in ${r.category} for consolidation: ${r.tests.map((t) => t.id).join(", ")}`,
      ),
    generatedAt: new Date().toISOString(),
  };
}

function genericFallback(request: AIAnalysisRequest): AIAnalysisResult {
  const useCase = getUseCaseById(request.useCaseId);
  return {
    useCaseId: request.useCaseId,
    summary: `Analysis for "${request.useCaseId}" completed (offline mode). Available data: ${RUNS.length} runs, ${getTestCases().length} tests.`,
    details: `Analysis type: ${useCase?.name || request.useCaseId}\nParameters: ${JSON.stringify(request.parameters)}\n\nData summary:\n- ${RUNS.length} runs in data store\n- ${getTestCases().length} test cases\n- ${DIFF_ROWS.length} diff rows\n- System is running in fallback mode. Configure an LLM provider for enriched analysis.`,
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
    const key = `${run.target}/${run.env}`;
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

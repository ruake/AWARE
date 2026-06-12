import { RUNS, ENV_SUMMARY, computeRunFrequency, getTestResultsForRun } from "@/lib/runs";
import { computeTestStats } from "@/lib/testCases";
import { getTestSuites } from "@/lib/testSuites";
import { getAllPromotionDecisions } from "@/lib/promotions";

export interface AIContext {
  summary: string;
  stats: {
    totalRuns: number;
    totalTests: number;
    totalSuites: number;
    envs: string[];
    dateRange: { start: string; end: string };
    avgPassRate: number;
    totalFailures: number;
  };
  envSummary: typeof ENV_SUMMARY;
  runFrequency: ReturnType<typeof computeRunFrequency>;
  recentRuns: string;
  testCoverage: string;
  promotionStatus: string;
}

export function buildAIContext(): AIContext {
  const testStats = computeTestStats();
  const runFrequency = computeRunFrequency();
  const sortedRuns = [...RUNS].sort(
    (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
  );
  const totalFailures = RUNS.reduce((s, r) => s + r.failures, 0);
  const avgPassRate =
    RUNS.length > 0 ? Math.round(RUNS.reduce((s, r) => s + r.passPct, 0) / RUNS.length) : 0;
  const promotions = getAllPromotionDecisions();
  const promoted = promotions.filter((p) => p.decision === "promote").length;
  const blocked = promotions.filter((p) => p.decision === "block").length;

  const envs = [...new Set(RUNS.map((r) => r.env))];
  const recentRunLabels = sortedRuns
    .slice(-3)
    .map((r) => `${r.build} (${r.passPct}% ${r.env})`)
    .join(", ");

  return {
    summary: `AWARE test observability dashboard: ${RUNS.length} runs across ${runFrequency.daysCovered} days. ${testStats.total} tests across ${testStats.byCategory ? Object.keys(testStats.byCategory).length : 0} categories. ${getTestSuites().length} suites. Avg pass rate ${avgPassRate}%.`,
    stats: {
      totalRuns: RUNS.length,
      totalTests: testStats.total,
      totalSuites: getTestSuites().length,
      envs,
      dateRange: {
        start: sortedRuns[0]?.started.slice(0, 10) || "N/A",
        end: sortedRuns[sortedRuns.length - 1]?.started.slice(0, 10) || "N/A",
      },
      avgPassRate,
      totalFailures,
    },
    envSummary: ENV_SUMMARY,
    runFrequency,
    recentRuns: recentRunLabels,
    testCoverage: `${testStats.automated} automated / ${testStats.manual} manual tests. Coverage: ${testStats.coverage}%. By priority: ${Object.entries(
      testStats.byPriority || {},
    )
      .map(([k, v]) => `${k}:${v}`)
      .join(", ")}`,
    promotionStatus: `Promotions: ${promoted} promoted, ${blocked} blocked, ${promotions.length - promoted - blocked} pending.`,
  };
}

function computeTestLevelStats() {
  // Track per-test status AND duration across ALL runs
  const testHistory: Record<
    string,
    { passes: number; failures: number; statuses: string[]; durations: number[] }
  > = {};
  const testMeta: Record<string, { name: string; category: string }> = {};

  for (const run of RUNS) {
    const results = getTestResultsForRun(run.id);
    for (const r of results) {
      if (!testHistory[r.id])
        testHistory[r.id] = { passes: 0, failures: 0, statuses: [], durations: [] };
      testHistory[r.id].statuses.push(r.status);
      testHistory[r.id].durations.push(r.duration);
      if (r.status === "PASS") testHistory[r.id].passes++;
      else testHistory[r.id].failures++;
      testMeta[r.id] = { name: r.name, category: r.category || "Unknown" };
    }
  }

  // Compute flakiness + duration for each test
  const testFlakiness = Object.entries(testHistory).map(([id, h]) => {
    let flips = 0;
    for (let i = 1; i < h.statuses.length; i++) {
      if (h.statuses[i] !== h.statuses[i - 1]) flips++;
    }
    const totalEntries = h.statuses.length;
    const flakinessScore = totalEntries > 1 ? Math.round((flips / (totalEntries - 1)) * 100) : 0;
    const passRate = totalEntries > 0 ? Math.round((h.passes / totalEntries) * 100) : 0;
    const avgDuration =
      h.durations.length > 0
        ? Math.round(h.durations.reduce((s, d) => s + d, 0) / h.durations.length)
        : 0;
    const maxDuration = h.durations.length > 0 ? Math.max(...h.durations) : 0;
    return {
      id,
      name: testMeta[id]?.name || id,
      category: testMeta[id]?.category || "Unknown",
      passRate,
      flakinessScore,
      flips,
      totalRuns: totalEntries,
      passes: h.passes,
      failures: h.failures,
      avgDuration,
      maxDuration,
    };
  });

  // Top flaky (by flakiness score, descending, that have actually flipped)
  const topFlaky = testFlakiness
    .filter((t) => t.flips > 0)
    .sort((a, b) => b.flakinessScore - a.flakinessScore)
    .slice(0, 10);

  // Top failing (by failure count, descending)
  const topFailing = testFlakiness
    .filter((t) => t.failures > 0)
    .sort((a, b) => b.failures - a.failures)
    .slice(0, 10);

  // Top slowest (by avg duration, descending)
  const topSlowest = [...testFlakiness].sort((a, b) => b.avgDuration - a.avgDuration).slice(0, 10);

  // Category failure summary
  const catFailures: Record<string, { total: number; failed: number }> = {};
  for (const t of testFlakiness) {
    if (!catFailures[t.category]) catFailures[t.category] = { total: 0, failed: 0 };
    catFailures[t.category].total += t.totalRuns;
    catFailures[t.category].failed += t.failures;
  }
  const catSummary = Object.entries(catFailures)
    .sort(([, a], [, b]) => b.failed - a.failed)
    .map(([cat, s]) => `${cat}: ${s.failed}/${s.total} failed`);

  // Test execution summary
  const neverFailed = testFlakiness.filter((t) => t.failures === 0).length;
  const everFailed = testFlakiness.filter((t) => t.failures > 0).length;

  return {
    totalUniqueTests: testFlakiness.length,
    neverFailed,
    everFailed,
    topFlaky,
    topFailing,
    topSlowest,
    catSummary,
    allFlaky: testFlakiness,
  };
}

export function buildSystemPrompt(context: AIContext): string {
  const lastRuns = [...RUNS]
    .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
    .slice(0, 5)
    .map(
      (r) =>
        `- ${r.id}: "${r.label}" | env=${r.env} | target=${r.target} | status=${r.status} | passRate=${r.passPct}% | failures=${r.failures} | duration=${r.duration} | build=${r.build} | started=${r.started.slice(0, 16)}`,
    )
    .join("\n");

  const testLevel = computeTestLevelStats();

  const flakyRows = testLevel.topFlaky
    .map(
      (t) =>
        `| ${t.id} | ${t.flakinessScore}% | ${t.flips} | ${t.passes}/${t.failures} | ${t.passRate}% | ${t.category} |`,
    )
    .join("\n");

  const failRows = testLevel.topFailing
    .map((t) => `| ${t.id} | ${t.failures} | ${t.passes} | ${t.passRate}% | ${t.category} |`)
    .join("\n");

  const slowRows = testLevel.topSlowest
    .map(
      (t) =>
        `| ${t.id} | ${t.avgDuration}ms | ${t.maxDuration}ms | ${t.passRate}% | ${t.category} |`,
    )
    .join("\n");

  return `You are PROOF Copilot — an AI assistant embedded in PROOF, a "Bring Your Own Testing Tool" analytics platform. Teams connect their test runners (pytest, Jest, Playwright, Cypress, k6, etc.) and PROOF collects every result. You analyze that collected test data and answer questions about test health, failures, flakiness, and build risk.

CURRENT DATA CONTEXT:
- ${context.stats.totalRuns} test runs (${context.stats.dateRange.start} to ${context.stats.dateRange.end})
- ${context.stats.totalTests} total tests across ${context.stats.totalSuites} suites
- Environments: ${context.stats.envs.join(", ")}
- Average pass rate: ${context.stats.avgPassRate}%
- Total failures: ${context.stats.totalFailures}
- ${context.testCoverage}
- ${context.promotionStatus}
- Recent runs: ${context.recentRuns}

LAST 5 RUNS (full details):
${lastRuns}

TEST-LEVEL STATISTICS (across all ${context.stats.totalRuns} runs):
- ${testLevel.totalUniqueTests} unique tests tracked
- ${testLevel.neverFailed} tests have NEVER failed
- ${testLevel.everFailed} tests have failed at least once
- ${testLevel.topFlaky.length} tests have flaky behavior (status flips between runs)

TOP 10 FLAKY TESTS (sorted by flakiness score):
| Test ID | Flakiness | Flips | Pass/Fail | Pass Rate | Category |
|---------|-----------|-------|-----------|-----------|----------|
${flakyRows || "| — | No flaky tests detected | — | — | — | — |"}

TOP 10 MOST-FAILING TESTS (sorted by failure count):
| Test ID | Failures | Passes | Pass Rate | Category |
|---------|----------|--------|-----------|----------|
${failRows || "| — | No failures recorded | — | — | — |"}

TOP 10 SLOWEST TESTS (sorted by avg duration):
| Test ID | Avg Duration | Max Duration | Pass Rate | Category |
|---------|-------------|-------------|-----------|----------|
${slowRows || "| — | No duration data | — | — | — |"}

FAILURES BY CATEGORY:
${testLevel.catSummary.join("\n") || "No failures recorded."}

Run IDs: ${RUNS.slice(-5)
    .map((r) => r.id)
    .join(", ")}.

STRICT RULES — YOU MUST FOLLOW THESE:
- You are PROOF Copilot. NEVER identify yourself as ChatGPT, GPT, Claude, Gemini, or any other AI system.
- NEVER list generic AI capabilities (NLP, machine learning, translation, creative writing, etc.). Those are not your capabilities.
- Answer ONLY about this dashboard's test data. If asked something unrelated, say: "I can only help with test data from this dashboard. Try asking about run failures, flaky tests, pass rate trends, or build risk."
- Do NOT add intro paragraphs like "Here's an analysis" or "Based on the data"
- Just present the facts as a short sentence or table — be extremely concise
- When referencing a run ID like ember, format it as [id](/runs/id)
- When referencing a test ID like ad_32, format it as [id](/analytics?testId=id)
- Use **markdown** for emphasis, tables for structured results, \`code\` for test IDs
- You can include inline charts using fenced code blocks with \`chart\` language:
  \`\`\`chart
  {"type":"BarChart","title":"Chart Title","headers":["X","Y"],"rows":[["A",10],["B",20]],"colors":["#5b8af5"]}
  \`\`\`
  Supported types: "ColumnChart", "BarChart", "LineChart", "PieChart". Add "pieHole":0.4 for donut, "curveType":"function" for smooth lines, "pointSize":4 for data points.
- If the data doesn't contain the answer, say "I don't have that data available"`;
}

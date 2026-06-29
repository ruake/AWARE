import { GraphContext } from "./types";

/* ─── Chrome Built-in AI (Gemini Nano) helpers ─── */

let _session: any = null;
let _sessionPromise: Promise<any> | null = null;

export interface ChromeAiCapabilities {
  available: "readily" | "after-download" | "no";
  defaultTopK?: number;
  defaultTemperature?: number;
  maxTopK?: number;
}

export async function getChromeAiCapabilities(): Promise<ChromeAiCapabilities | null> {
  const ai = (window as any).ai;
  if (!ai) return null;
  try {
    if (ai.languageModel?.capabilities) {
      return await ai.languageModel.capabilities();
    }
  } catch {}
  return null;
}

export async function isChromeAiAvailable(): Promise<boolean> {
  const c = await getChromeAiCapabilities();
  return c !== null && c.available !== "no";
}

async function createSession() {
  const ai = (window as any).ai;
  if (!ai) throw new Error("Chrome AI not available");

  if (ai.languageModel?.create) {
    return ai.languageModel.create({
      systemPrompt: `You are A.W.A.R.E. Copilot, an expert test-observability analyst for a CDN regression-testing platform. You analyze test runs, failures, flakiness, and pipeline health. Be concise, technical, and actionable. Use markdown formatting.`,
    });
  }
  if (ai.createTextSession) {
    return ai.createTextSession();
  }
  throw new Error("No Chrome AI API found");
}

async function getSession(): Promise<any> {
  if (_session) return _session;
  if (_sessionPromise) return _sessionPromise;
  _sessionPromise = createSession().then(s => {
    _session = s;
    _sessionPromise = null;
    return s;
  });
  return _sessionPromise;
}

export function destroySession() {
  if (_session?.destroy) {
    try { _session.destroy(); } catch {}
  }
  _session = null;
  _sessionPromise = null;
}

export async function classifyIntent(query: string): Promise<string | null> {
  const session = await getSession().catch(() => null);
  if (!session) return null;

  const prompt = `Classify this test-monitoring query into exactly one of these categories. Reply with ONLY the category word, nothing else.

Categories:
- failures — failed runs, failing tests, errors, assertion failures
- flakiness — flaky tests, intermittent failures, tests that flip between pass/fail
- environment_compare — comparing QA/UAT/PROD, staging vs production
- anomalies — unusual behavior, outliers, low pass rate, unexpected drops
- pipeline_health — overall health, summary, pipeline status, pass rate overview
- trend — trends over time, history, pass rate over days/weeks
- test_detail — specific test details, test info, looking up a test
- unknown — doesn't match any above

Query: "${query}"
Category:`;

  try {
    const result = await session.prompt(prompt);
    const trimmed = result.trim().toLowerCase().replace(/[.!\s]+$/g, "");
    const valid = [
      "failures", "flakiness", "environment_compare", "anomalies",
      "pipeline_health", "trend", "test_detail", "unknown",
    ];
    return valid.includes(trimmed) ? trimmed : "unknown";
  } catch {
    return null;
  }
}

export async function* generateResponseStream(
  ctx: GraphContext,
): AsyncGenerator<string, string, unknown> {
  const session = await getSession().catch(() => null);
  if (!session) {
    return buildFallbackResponse(ctx);
  }

  const prompt = buildRichPrompt(ctx);

  try {
    if (session.promptStreaming) {
      const stream = await session.promptStreaming(prompt);
      let full = "";
      for await (const chunk of stream) {
        full = chunk;
        yield full;
      }
      return full;
    }

    const result = await session.prompt(prompt);
    yield result;
    return result;
  } catch (e) {
    console.error("[ChromeAI] generate failed:", e);
    const fallback = buildFallbackResponse(ctx);
    yield fallback;
    return fallback;
  }
}

export async function generateResponse(ctx: GraphContext): Promise<string> {
  const gen = generateResponseStream(ctx);
  let last = "";
  for await (const chunk of gen) {
    last = chunk;
  }
  return last;
}

export async function generateReasoning(ctx: GraphContext): Promise<string | null> {
  const session = await getSession().catch(() => null);
  if (!session) return null;

  const prompt = `You are analyzing CDN regression test data. Based on the following data summary, write 1-2 sentences of technical reasoning explaining WHY the data looks this way (root cause hypothesis, not just description). Be specific and actionable.

${buildDataSummary(ctx)}

Reasoning (1-2 sentences, technical):`;

  try {
    return await session.prompt(prompt);
  } catch {
    return null;
  }
}

export async function generateRecommendations(ctx: GraphContext): Promise<string | null> {
  const session = await getSession().catch(() => null);
  if (!session) return null;

  const prompt = `You are a senior SRE reviewing CDN regression test data. Based on the following summary, provide exactly 2-3 specific, actionable recommendations to improve pipeline health. Number them. Each should be 1 sentence.

${buildDataSummary(ctx)}

Recommendations:`;

  try {
    return await session.prompt(prompt);
  } catch {
    return null;
  }
}

/* ─── Prompt builders ─── */

function buildRichPrompt(ctx: GraphContext): string {
  const { intent, query, analysis } = ctx;
  const a = analysis as Record<string, any>;

  const summary = buildDataSummary(ctx);

  let specificInstruction = "";
  switch (intent) {
    case "failures":
      specificInstruction = `Summarize the failure situation. Mention which environment is most affected, the failure rate, and the most critical failed run. Keep it under 80 words.`;
      break;
    case "flakiness":
      specificInstruction = `Summarize the flakiness findings. Mention the top flaky test by name, its flakiness score, and suggest a mitigation. Keep it under 80 words.`;
      break;
    case "environment_compare":
      specificInstruction = `Compare QA, UAT, and PROD. Identify the worst-performing environment and explain why it might be lagging. Keep it under 80 words.`;
      break;
    case "anomalies":
      specificInstruction = `Describe the anomalous runs found. Explain what makes them unusual and suggest what to investigate. Keep it under 80 words.`;
      break;
    case "pipeline_health":
      specificInstruction = `Give a concise pipeline health summary with pass rate, failure count, and a verdict (GOOD / DEGRADED / CRITICAL). Keep it under 60 words.`;
      break;
    case "trend":
      specificInstruction = `Describe the pass-rate trend over the last 14 days. Say whether it's improving or declining and by how much. Keep it under 60 words.`;
      break;
    case "test_detail":
      specificInstruction = `Summarize the matching tests found. Include their status distribution and any errors. Keep it under 80 words.`;
      break;
    default:
      specificInstruction = `Give a brief overview of the pipeline. Mention total runs, pass rate, and any notable issues. Keep it under 60 words.`;
  }

  return `User query: "${query}"
Intent: ${intent}

Data Summary:
${summary}

${specificInstruction}

Response:`;
}

function buildDataSummary(ctx: GraphContext): string {
  const { runs, testResults, intent, analysis } = ctx;
  const a = analysis as Record<string, any>;

  const totalRuns = runs.length;
  const failCount = runs.filter(r => r.status === "FAIL").length;
  const passCount = runs.filter(r => r.status === "PASS").length;
  const runningCount = runs.filter(r => r.status === "RUNNING").length;
  const avgPass = totalRuns
    ? Math.round(runs.reduce((s, r) => s + r.passPct, 0) / totalRuns)
    : 0;

  const envBreakdown = ["QA", "UAT", "PROD"].map(env => {
    const eRuns = runs.filter(r => r.env === env);
    const eAvg = eRuns.length
      ? Math.round(eRuns.reduce((s, r) => s + r.passPct, 0) / eRuns.length)
      : 0;
    const eFail = eRuns.filter(r => r.status === "FAIL").length;
    return `  ${env}: ${eRuns.length} runs, ${eAvg}% avg pass, ${eFail} failed`;
  }).join("\n");

  let analysisBlock = "";
  if (a.totalFailures !== undefined) {
    analysisBlock += `\nFailures: ${a.totalFailures} failed runs (${a.failureRate}% rate)`;
  }
  if (a.totalFlaky !== undefined) {
    const topFlaky = (a.flakyTests as any[])?.slice(0, 3).map((f: any) => `${f.name} (${f.score}%)`).join(", ") ?? "";
    analysisBlock += `\nFlaky tests: ${a.totalFlaky} total. Top: ${topFlaky}`;
  }
  if (a.totalAnomalies !== undefined) {
    analysisBlock += `\nAnomalies: ${a.totalAnomalies} runs with pass rate < 85%`;
  }
  if (a.envStats) {
    const es = a.envStats as { env: string; total: number }[];
    const worst = es.reduce((a, b) => a.total < b.total ? a : b);
    analysisBlock += `\nWorst env: ${worst.env} at ${worst.total}% avg pass`;
  }

  return `Total runs: ${totalRuns} (${passCount} pass, ${failCount} fail, ${runningCount} running)
Overall pass rate: ${avgPass}%
Environment breakdown:
${envBreakdown}${analysisBlock}
Intent: ${intent}`;
}

/* ─── Fallback text responses (rule-based, no AI) ─── */

function buildFallbackResponse(ctx: GraphContext): string {
  const { analysis, intent } = ctx;
  const a = analysis as Record<string, any>;

  switch (intent) {
    case "failures": {
      const failed = a.failedRuns as any[] | undefined;
      if (!failed?.length) return "No failures found. All runs are passing.";
      return `**${a.totalFailures} failed run${a.totalFailures !== 1 ? "s" : ""}** out of ${a.totalRuns} total (${a.failureRate}% failure rate).`;
    }
    case "flakiness": {
      const flaky = a.flakyTests as any[] | undefined;
      if (!flaky?.length) return "No flaky tests detected.";
      const high = flaky.filter((f: any) => f.score > 40).length;
      return `**${a.totalFlaky} flaky tests identified**${high > 0 ? `, ${high} with high flakiness (>40%)` : ""}.`;
    }
    case "environment_compare": {
      const envs = a.envStats as { env: string; total: number }[] | undefined;
      if (!envs?.length) return "No environment data.";
      const worst = envs.reduce((a, b) => a.total < b.total ? a : b);
      return `**Environment Comparison** — ${worst.env} has the lowest pass rate at ${worst.total}%.`;
    }
    case "anomalies": {
      const anomalies = a.anomalies as any[] | undefined;
      if (!anomalies?.length) return "No anomalies detected.";
      return `**${a.totalAnomalies} anomalous run${a.totalAnomalies > 1 ? "s" : ""}** (pass rate < 85%). Avg pipeline pass rate: ${a.avgPassRate}%.`;
    }
    case "pipeline_health": {
      const healthy = a.passRate >= 95;
      return `**Pipeline Health**: ${a.passRate}% avg pass across ${a.totalRuns} runs. ${a.failedCount} failed (${a.failureRate}% rate). Status: **${healthy ? "GOOD" : "DEGRADED"}**.`;
    }
    case "trend": {
      const trend = a.trendData as { passPct: number }[] | undefined;
      if (!trend?.length) return "Not enough trend data.";
      const recent = trend.slice(-3);
      const dir = recent.length >= 2 && recent[recent.length - 1].passPct > recent[0].passPct ? "improving" : "declining";
      return `**30-Day Trend**: Pass rate is ${dir}. Last 3: ${recent.map(d => `${d.passPct.toFixed(1)}%`).join(" → ")}.`;
    }
    case "test_detail": {
      const tests = a.matchingTests as any[] | undefined;
      if (!tests?.length) return "No matching tests found.";
      return `**${tests.length} matching test${tests.length > 1 ? "s" : ""} found**.`;
    }
    default:
      return `Analyzed ${a.totalRuns || 0} runs. Overall pass rate: ${a.passRate || "N/A"}%.`;
  }
}

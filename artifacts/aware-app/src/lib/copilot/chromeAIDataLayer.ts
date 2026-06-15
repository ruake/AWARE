import type { StreamDelta } from "./types";

// ── Chrome AI Session API types (browser built-in AI) ────────────────────
interface ChromeAISession {
  promptStreaming(prompt: string): ReadableStream;
  destroy(): void;
}
interface OldChromeAISession {
  promptStreaming(prompt: string): ReadableStream;
  destroy(): void;
}

function hasNewAPI(): boolean {
  return typeof (window as any).LanguageModel?.create === "function";
}
function hasOldAPI(): boolean {
  return typeof (window as any).ai?.languageModel?.create === "function";
}

// ── Streaming helper ─────────────────────────────────────────────────────
async function streamFromChromeAI(
  systemPrompt: string,
  userPrompt: string,
  signal: AbortSignal,
  onDelta: (delta: StreamDelta) => void,
): Promise<void> {
  let session: ChromeAISession | OldChromeAISession;

  try {
    if (hasNewAPI()) {
      session = await (window as any).LanguageModel.create({ systemPrompt, signal });
    } else if (hasOldAPI()) {
      session = await (window as any).ai.languageModel.create({ systemPrompt, signal });
    } else {
      onDelta({ content: "Chrome AI is not available in this browser.", done: true });
      return;
    }
  } catch (err: unknown) {
    if (signal.aborted) {
      onDelta({ done: true });
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    onDelta({ content: `Chrome AI error: ${msg}`, done: true });
    return;
  }

  if (signal.aborted) {
    session.destroy();
    onDelta({ done: true });
    return;
  }

  const stream = session.promptStreaming(userPrompt);
  const reader = stream.getReader();
  let lastLen = 0;

  try {
    while (true) {
      if (signal.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      const text = typeof value === "string" ? value : new TextDecoder().decode(value);
      if (text.length > lastLen) {
        onDelta({ content: text.slice(lastLen), done: false });
        lastLen = text.length;
      }
    }
  } finally {
    reader.releaseLock();
    session.destroy();
  }

  onDelta({ done: true });
}

/** Collect full Chrome AI response, returns null on failure or gibberish. */
async function callChromeAI(
  systemPrompt: string,
  userPrompt: string,
  signal: AbortSignal,
): Promise<string | null> {
  try {
    return await new Promise<string | null>((resolve) => {
      const chunks: string[] = [];
      streamFromChromeAI(systemPrompt, userPrompt, signal, (delta) => {
        if (delta.content) chunks.push(delta.content);
        if (delta.done) {
          const text = chunks.join("").trim();
          resolve(isGibberish(text) ? null : text);
        }
      }).catch(() => resolve(null));
    });
  } catch {
    return null;
  }
}

// ── Gibberish detection ─────────────────────────────────────────────────
function isGibberish(text: string): boolean {
  const t = text.trim();
  if (t.length < 15) return true;
  if (!/\s/.test(t)) return true;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 2) return true;
  if (/^[.,!?;\s\-_#*+=\[\](){}<>'"`~@#$%^&|\\\/]+$/.test(t)) return true;
  if (!/[aeiouAEIOU]/.test(t)) return true;
  return false;
}

// ── Intent detection ────────────────────────────────────────────────────
type QueryIntent = "summary" | "chart" | "list";

function detectIntent(query: string): QueryIntent {
  if (
    /\b(summary|health|overview|trend|status|overall|how.*doing|performing|condition|integrity)\b/i.test(
      query,
    )
  )
    return "summary";
  if (
    /\b(chart|graph|plot|visual|better|improve|different|redraw|redesign|new.*chart|fix.*chart|change.*chart)\b/i.test(
      query,
    )
  )
    return "chart";
  return "list";
}

// ── Phase 1: Tool data formatting (JSON → clean text with computed insights) ─
function formatToolData(
  toolName: string,
  rawData: unknown,
  intent: QueryIntent,
): string | null {
  switch (toolName) {
    case "query_runs": {
      const runs: any[] = Array.isArray(rawData) ? rawData : [];
      if (!runs.length) return null;

      const passRates = runs.map((r) => r.passRate ?? r.passPct ?? 0);
      const avgPass =
        passRates.length > 0
          ? Math.round(passRates.reduce((a, b) => a + b, 0) / passRates.length)
          : 0;
      const totalFailures = runs.reduce(
        (sum, r) => sum + (r.failures ?? 0),
        0,
      );
      const envs = [...new Set(runs.map((r: any) => r.env).filter(Boolean))];

      const insights: string[] = [];
      if (intent === "summary" || intent === "chart") {
        insights.push(`Average pass rate: ${avgPass}%`);
        insights.push(`Total failures: ${totalFailures} across ${runs.length} runs`);
        insights.push(`Environments: ${envs.join(", ")}`);
        if (passRates.length >= 2) {
          const first = passRates[0];
          const last = passRates[passRates.length - 1];
          const diff = first - last;
          insights.push(
            `Trend: ${diff > 0 ? "\u2191" : diff < 0 ? "\u2193" : "\u2192"} ${Math.abs(diff).toFixed(0)}%`,
          );
        }
        insights.push("");
      }

      const items = runs.map(
        (r: any) =>
          `\u2022 ${r.run} (${r.env}): ${r.passRate ?? r.passPct ?? "?"}% pass, ${r.failures ?? 0} failure${(r.failures ?? 0) !== 1 ? "s" : ""} \u2014 ${r.date ?? ""}`,
      );
      return [...insights, ...items].join("\n");
    }
    case "get_flaky_tests": {
      const tests: any[] = Array.isArray(rawData) ? rawData : [];
      if (!tests.length) return null;
      const lines: string[] = [];
      if (intent === "summary") {
        lines.push(
          `Flakiness: ${tests.length} flaky test${tests.length !== 1 ? "s" : ""} detected`,
        );
        const avgFlips =
          tests.reduce((s, t) => s + t.flips, 0) / tests.length;
        lines.push(
          `Average flips: ${avgFlips.toFixed(1)} per test across ${tests[0]?.runs ?? "?"} runs`,
        );
        lines.push("");
      }
      for (const t of tests) {
        lines.push(
          `\u2022 ${t.id}: flakiness ${t.score}% (${t.flips} flip${t.flips !== 1 ? "s" : ""} in ${t.runs} runs)`,
        );
      }
      return lines.join("\n");
    }
    case "compare_environments": {
      const rows: any[] = Array.isArray(rawData) ? rawData : [];
      if (!rows.length) return null;
      return rows
        .map(
          (r: any) =>
            `\u2022 ${r.env}: avg ${r.avgPassRate}% pass, ${r.totalFailures} failures, ${r.runs} runs`,
        )
        .join("\n");
    }
    case "get_promotion_status": {
      const d = (rawData as any) || {};
      const total = d.total ?? 0;
      const promoted = d.promoted ?? 0;
      const blocked = d.blocked ?? 0;
      const pending = d.pending ?? 0;
      return `\u2022 ${promoted} promoted, ${blocked} blocked, ${pending} pending (${total} total)`;
    }
    case "get_failure_breakdown": {
      const d = (rawData as any) || {};
      const label = d.label || "Latest Run";
      const rows: any[] = Array.isArray(d.rows) ? d.rows : [];
      const parts: string[] = [];
      if (intent === "summary") {
        const totalFailed = rows.reduce((s, r) => s + r.failed, 0);
        const totalTests = rows.reduce((s, r) => s + r.total, 0);
        const pct =
          totalTests > 0
            ? Math.round(((totalTests - totalFailed) / totalTests) * 100)
            : d.passPct ?? "?";
        parts.push(
          `Run: ${label} \u2014 ${pct}% pass (${totalFailed} failed / ${totalTests} total)`,
        );
        parts.push("");
      }
      parts.push(`\u2022 Run: ${label} (${d.passPct ?? "?"}% pass)`);
      if (!rows.length) {
        parts.push("\u2022 No failures");
      } else {
        for (const r of rows) {
          parts.push(
            `\u2022 ${r.category}: ${r.failed}/${r.total} failed (${r.passRate}% pass)`,
          );
        }
      }
      return parts.join("\n");
    }
    default:
      return null;
  }
}

// ── Phase 2: Template synthesis (fallback when LLM fails) ───────────────
function buildTemplateSynthesis(
  toolName: string,
  toolDataJson: string,
  userQuery: string,
): string {
  const intent = detectIntent(userQuery);

  try {
    const data = JSON.parse(toolDataJson);

    switch (toolName) {
      case "query_runs": {
        const runs: any[] = Array.isArray(data) ? data : [];
        if (!runs.length) return "No test runs found in the dataset.";

        const envs = [...new Set(runs.map((r: any) => r.env).filter(Boolean))];
        const passRates = runs.map(
          (r: any) => r.passRate ?? r.passPct ?? 0,
        );
        const avgPass =
          passRates.length > 0
            ? Math.round(
                passRates.reduce((a: number, b: number) => a + b, 0) /
                  passRates.length,
              )
            : 0;
        const totalFailures = runs.reduce(
          (sum: number, r: any) => sum + (r.failures ?? 0),
          0,
        );

        if (intent === "summary") {
          const first = passRates[0];
          const last = passRates[passRates.length - 1];
          const diff = first - last;
          const arrow =
            diff > 0 ? "\u2191 up" : diff < 0 ? "\u2193 down" : "\u2192 flat";
          return (
            `**Health Summary** \u2014 Last ${runs.length} Run${runs.length !== 1 ? "s" : ""}\n\n` +
            `- Average pass rate: **${avgPass}%**\n` +
            `- Trend: ${arrow} **${Math.abs(diff)}%**\n` +
            `- Total failures: **${totalFailures}**\n` +
            `- Environments: ${envs.join(", ")}\n\n` +
            `The **Pass Rate** chart above shows the trend across runs. ` +
            `Ask me for a detailed breakdown by environment or specific test categories.`
          );
        }

        if (intent === "chart") {
          return (
            `The **Pass Rate** chart above shows the last **${runs.length} run${runs.length !== 1 ? "s" : ""}** ` +
            `across ${envs.join(", ")}. ` +
            `Average pass rate is **${avgPass}%** (${totalFailures} failure${totalFailures !== 1 ? "s" : ""} total). ` +
            `I can also show a flakiness breakdown, environment comparison, or failure-by-category chart.`
          );
        }

        const envLabel = envs.length === 1 ? ` (${envs[0]})` : "";
        const header = `Here are the **last ${Math.min(runs.length, 10)} test runs**${envLabel}:\n\n`;
        const rows = runs
          .slice(0, 10)
          .map(
            (r: any) =>
              `- **${r.run ?? r.label ?? r.id ?? "Run"}** \u00B7 ${r.env} \u00B7 **${r.passRate ?? r.passPct ?? "?"}%** pass \u00B7 ${r.failures ?? 0} failure${(r.failures ?? 0) !== 1 ? "s" : ""} \u00B7 ${r.date ?? ""}`,
          )
          .join("\n");
        return header + rows;
      }

      case "get_flaky_tests": {
        const tests: any[] = Array.isArray(data) ? data : [];
        if (!tests.length)
          return "No flaky tests detected in recent runs \u2014 all tests are stable.";

        if (intent === "summary") {
          const avgFlips =
            tests.reduce((s: number, t: any) => s + t.flips, 0) /
            tests.length;
          return (
            `**Flakiness Summary** \u2014 ${tests.length} flaky test${tests.length !== 1 ? "s" : ""}\n\n` +
            `- Average flips per test: **${avgFlips.toFixed(1)}**\n` +
            `- Worst: **${tests[0].id}** (${tests[0].score}% flakiness)\n\n` +
            `The **Flaky Tests** chart above ranks tests by instability. ` +
            `Consider quarantining the top flaky tests to improve CI reliability.`
          );
        }

        const header = `Found **${tests.length} flaky test${tests.length !== 1 ? "s" : ""}** (flipping between PASS and FAIL):\n\n`;
        const rows = tests
          .slice(0, 10)
          .map(
            (t: any) =>
              `- **${t.id}** \u00B7 score **${t.score}%** \u00B7 ${t.flips} flip${t.flips !== 1 ? "s" : ""} in ${t.runs} runs`,
          )
          .join("\n");
        return header + rows;
      }

      case "compare_environments": {
        const rows: any[] = Array.isArray(data) ? data : [];
        if (!rows.length) return "No environment data available.";

        if (intent === "summary") {
          const best = [...rows].sort(
            (a, b) => b.avgPassRate - a.avgPassRate,
          )[0];
          return (
            `**Environment Health**\n\n` +
            rows
              .map(
                (r: any) =>
                  `- **${r.env}**: avg **${r.avgPassRate}%** pass rate \u00B7 ${r.totalFailures} failures \u00B7 ${r.runs} runs`,
              )
              .join("\n") +
            `\n\n**${best.env}** has the highest pass rate (**${best.avgPassRate}%**). ` +
            `The **Avg Pass Rate by Environment** chart above visualizes the comparison.`
          );
        }

        const header =
          "**Environment Comparison** (QA \u2192 UAT \u2192 PROD):\n\n";
        const items = rows
          .map(
            (r: any) =>
              `- **${r.env}**: avg **${r.avgPassRate}%** pass rate \u00B7 ${r.totalFailures} failures \u00B7 ${r.runs} runs`,
          )
          .join("\n");
        return header + items;
      }

      case "get_promotion_status": {
        const {
          total = 0,
          promoted = 0,
          blocked = 0,
          pending = 0,
        } = data as any;
        const pct = total > 0 ? Math.round((promoted / total) * 100) : 0;

        if (intent === "summary") {
          return (
            `**Promotion Gate Summary**\n\n` +
            `- **${promoted}** promoted to PROD (${pct}%)\n` +
            `- **${blocked}** blocked (UAT regressions below 95% threshold)\n` +
            `- **${pending}** pending review\n\n` +
            `The **Promotion Gate Outcomes** chart shows the full breakdown.`
          );
        }

        return (
          `**Promotion Gate** (${total} decision${total !== 1 ? "s" : ""} total):\n\n` +
          `- Promoted to PROD: **${promoted}** (${pct}%)\n` +
          `- Blocked: **${blocked}**\n` +
          `- Pending: **${pending}**`
        );
      }

      case "get_failure_breakdown": {
        const { label, passPct, rows = [] } = data as any;

        if (intent === "summary") {
          const totalFailed = rows.reduce(
            (s: number, r: any) => s + r.failed,
            0,
          );
          const totalTests = rows.reduce(
            (s: number, r: any) => s + r.total,
            0,
          );
          const top =
            rows.length > 0 ? [...rows].sort((a, b) => b.failed - a.failed)[0] : null;
          if (top) {
            return (
              `**Failure Summary** \u2014 ${label || "Latest Run"} (**${passPct}%** pass)\n\n` +
              `- **${totalFailed}** failures out of **${totalTests}** tests\n` +
              `- Worst category: **${top.category}** (${top.failed}/${top.total} failed)\n\n` +
              `The **Failures by Category** chart above breaks down each area.`
            );
          }
        }

        const header = `**Failure Breakdown** \u2014 ${label || "Latest Run"} (**${passPct}%** pass rate):\n\n`;
        if (!rows.length) return header + "No failures in this run.";
        const items = (rows as any[])
          .slice(0, 8)
          .map(
            (r: any) =>
              `- **${r.category}**: ${r.failed} failed / ${r.total} total (**${r.passRate}%** pass)`,
          )
          .join("\n");
        return header + items;
      }

      default:
        return `**${toolName}** results:\n\`\`\`\n${toolDataJson.slice(0, 300)}\n\`\`\``;
    }
  } catch {
    const names: Record<string, string> = {
      query_runs: "Run History",
      get_flaky_tests: "Flaky Test Analysis",
      compare_environments: "Environment Comparison",
      get_promotion_status: "Promotion Gate",
      get_failure_breakdown: "Failure Breakdown",
    };
    const label = names[toolName] ?? toolName;
    return `**${label}** data retrieved. The chart above shows the results.`;
  }
}

// ── Emit a string as streaming deltas ───────────────────────────────────
function emitAsStream(text: string, onDelta: (delta: StreamDelta) => void): void {
  const CHUNK = 10;
  for (let i = 0; i < text.length; i += CHUNK) {
    onDelta({ content: text.slice(i, i + CHUNK), done: false });
  }
  onDelta({ done: true });
}

// Canned responses for casual queries (reliable, no LLM needed)
const CASUAL_PATTERNS: Array<{ pattern: RegExp; response: string }> = [
  {
    pattern: /^\s*(hi|hello|hey|howdy|sup|yo)\s*[!?.]*\s*$/i,
    response:
      "Hi! I'm the **AWARE Copilot**. I can analyze your test runs, find flaky tests, compare environments, and check your promotion gate. Try a **Quick Action** on the left, or ask me anything about your CDN test data!",
  },
  {
    pattern: /how are you|how.*doing|how.*going/i,
    response:
      "Ready to help! I can surface pass rates, flakiness trends, environment comparisons, and promotion gate decisions. What would you like to know?",
  },
  {
    pattern:
      /what.*(can|do) you|what you (can|do)|what.*(help|know|support)|your (capabilities|features)|who are you/i,
    response:
      "I can help with:\n- **Latest Runs** \u2014 pass rates & failure counts\n- **Flaky Tests** \u2014 tests flipping PASS\u2194FAIL\n- **Compare Envs** \u2014 QA vs UAT vs PROD\n- **Promotion Gate** \u2014 UAT\u2192PROD readiness\n- **Failure Breakdown** \u2014 categories failing\n\nTry a Quick Action or just ask!",
  },
  {
    pattern: /thank|thanks|great|awesome|nice|cool|perfect/i,
    response: "Glad to help! Let me know if you need anything else about your test data.",
  },
];

function getCannedResponse(query: string): string | null {
  for (const { pattern, response } of CASUAL_PATTERNS) {
    if (pattern.test(query)) return response;
  }
  return null;
}

const FALLBACK =
  "I'm the **AWARE Copilot**. I can analyze test runs, flakiness, environment health, and promotion gate status. Try a Quick Action or ask me about your test data!";

// ── Public API ──────────────────────────────────────────────────────────

export interface SynthesisInput {
  toolName: string;
  rawData: unknown;
  userQuery: string;
  signal: AbortSignal;
  onDelta: (delta: StreamDelta) => void;
}

export interface DirectInput {
  userQuery: string;
  signal: AbortSignal;
  onDelta: (delta: StreamDelta) => void;
}

/**
 * Synthesis mode: tool was called and returned data.
 * Data flow: JSON → formatted text → Gemini Nano prompt → quality check → template fallback.
 */
export async function synthesizeWithChromeAI(input: SynthesisInput): Promise<void> {
  const { toolName, rawData, userQuery, signal, onDelta } = input;
  const intent = detectIntent(userQuery);

  // Phase 1: Format tool data from JSON to clean text for Gemini Nano
  const formatted = formatToolData(toolName, rawData, intent);
  if (!formatted) {
    emitAsStream(buildTemplateSynthesis(toolName, JSON.stringify(rawData), userQuery), onDelta);
    return;
  }

  // Phase 2: Try Gemini Nano with micro-prompt
  const prompt = `You are a test analytics assistant. Answer briefly using only the data below.\n\nData:\n${formatted}\n\nUser asked: ${userQuery}\n\nAnswer:`;
  const llmResult = await callChromeAI("You are AWARE Copilot. Answer concisely.", prompt, signal);

  if (llmResult) {
    emitAsStream(llmResult, onDelta);
    return;
  }

  // Phase 3: Fallback to template
  const template = buildTemplateSynthesis(toolName, JSON.stringify(rawData), userQuery);
  emitAsStream(template, onDelta);
}

/**
 * Direct mode: no tool was called.
 * Data flow: canned check → Gemini Nano → quality check → generic fallback.
 */
export async function answerDirectWithChromeAI(input: DirectInput): Promise<void> {
  const { userQuery, signal, onDelta } = input;

  // Level 1: Canned patterns (instant, no LLM cost)
  const canned = getCannedResponse(userQuery);
  if (canned) {
    emitAsStream(canned, onDelta);
    return;
  }

  // Level 2: Try Gemini Nano with micro-prompt
  const prompt = `Answer briefly: ${userQuery}`;
  const llmResult = await callChromeAI(
    "You are AWARE Copilot, a helpful test analytics assistant. Keep answers short.",
    prompt,
    signal,
  );

  if (llmResult) {
    emitAsStream(llmResult, onDelta);
    return;
  }

  // Level 3: Generic fallback
  emitAsStream(FALLBACK, onDelta);
}

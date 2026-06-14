import type {
  IProvider,
  ProviderStatus,
  ProviderType,
  ApiMessage,
  ToolDefinition,
  StreamDelta,
} from "./types";
import { loadOpenAIConfig } from "./storage";

// ── WebLLM Provider ──────────────────────────────────────────────────────────
const WEBLLM_MODEL = "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC";

export class WebLLMProvider implements IProvider {
  readonly type: ProviderType = "webllm";
  readonly supportsToolCalling = true;
  onLoadProgress?: (progress: number, text: string) => void;

  private engine: unknown = null;
  private loadPromise: Promise<unknown> | null = null;

  async checkAvailability(): Promise<ProviderStatus> {
    try {
      if (typeof navigator === "undefined" || !("gpu" in navigator)) return "unavailable";
      const adapter = await (navigator as any).gpu?.requestAdapter?.();
      if (!adapter) return "unavailable";
      return "available";
    } catch {
      return "unavailable";
    }
  }

  private async ensureEngine(): Promise<any> {
    if (this.engine) return this.engine;
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        const mod = await import("@mlc-ai/web-llm");
        const engine = await mod.CreateMLCEngine(WEBLLM_MODEL, {
          initProgressCallback: (report: any) => {
            this.onLoadProgress?.(report.progress ?? 0, report.text ?? "Loading…");
          },
        });
        this.engine = engine;
        return engine;
      })();
    }
    return this.loadPromise;
  }

  async stream(
    messages: ApiMessage[],
    tools: ToolDefinition[],
    signal: AbortSignal,
    onDelta: (delta: StreamDelta) => void,
  ): Promise<void> {
    const engine = await this.ensureEngine();
    if (signal.aborted) return;

    const toolDefs =
      tools.length > 0
        ? tools.map((t) => ({
            type: "function" as const,
            function: { name: t.name, description: t.description, parameters: t.parameters },
          }))
        : undefined;

    const msgs = toolDefs ? mergeSystemIntoUser(messages) : messages;

    const streamResp = await engine.chat.completions.create({
      messages: msgs,
      tools: toolDefs,
      tool_choice: toolDefs ? "auto" : undefined,
      stream: true,
      temperature: 0.3,
      max_tokens: 1024,
    });

    const accum: Record<number, { id: string; name: string; args: string }> = {};

    for await (const chunk of streamResp) {
      if (signal.aborted) break;
      const choice = chunk.choices?.[0];
      if (!choice) continue;
      const delta = choice.delta;

      if (delta?.content) onDelta({ content: delta.content, done: false });

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!accum[idx]) accum[idx] = { id: "", name: "", args: "" };
          if (tc.id) accum[idx].id = tc.id;
          if (tc.function?.name) accum[idx].name = tc.function.name;
          if (tc.function?.arguments) accum[idx].args += tc.function.arguments;
        }
      }

      const reason = choice.finish_reason;
      if (reason === "tool_calls") {
        for (const a of Object.values(accum)) {
          onDelta({
            toolCallId: a.id,
            toolCallName: a.name,
            toolCallArgsChunk: a.args,
            done: false,
          });
        }
        onDelta({ done: true });
      } else if (reason && reason !== "null") {
        onDelta({ done: true });
      }
    }
  }
}

// ── OpenAI Provider ──────────────────────────────────────────────────────────
export class OpenAIProvider implements IProvider {
  readonly type: ProviderType = "openai";
  readonly supportsToolCalling = true;

  async checkAvailability(): Promise<ProviderStatus> {
    return "available";
  }

  async stream(
    messages: ApiMessage[],
    tools: ToolDefinition[],
    signal: AbortSignal,
    onDelta: (delta: StreamDelta) => void,
  ): Promise<void> {
    const { apiKey, apiUrl, model } = loadOpenAIConfig();
    const base = apiUrl || "https://api.openai.com/v1";

    if (!apiKey) {
      onDelta({
        content: "⚠️ No OpenAI API key — open **Settings** (top right) to add one.",
        done: true,
      });
      return;
    }

    const toolDefs =
      tools.length > 0
        ? tools.map((t) => ({
            type: "function" as const,
            function: { name: t.name, description: t.description, parameters: t.parameters },
          }))
        : undefined;

    const msgs = toolDefs ? mergeSystemIntoUser(messages) : messages;

    const resp = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        messages: msgs,
        tools: toolDefs,
        tool_choice: toolDefs ? "auto" : undefined,
        stream: true,
        temperature: 0.3,
        max_tokens: 1024,
      }),
      signal,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`OpenAI ${resp.status}: ${text}`);
    }

    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    const accum: Record<number, { id: string; name: string; args: string }> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done || signal.aborted) break;

      for (const line of decoder.decode(value, { stream: true }).split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          onDelta({ done: true });
          return;
        }
        try {
          const chunk = JSON.parse(json);
          const choice = chunk.choices?.[0];
          const delta = choice?.delta;
          if (delta?.content) onDelta({ content: delta.content, done: false });
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!accum[idx]) accum[idx] = { id: "", name: "", args: "" };
              if (tc.id) accum[idx].id = tc.id;
              if (tc.function?.name) accum[idx].name = tc.function.name;
              if (tc.function?.arguments) accum[idx].args += tc.function.arguments;
            }
          }
          const reason = choice?.finish_reason;
          if (reason === "tool_calls") {
            for (const a of Object.values(accum)) {
              onDelta({
                toolCallId: a.id,
                toolCallName: a.name,
                toolCallArgsChunk: a.args,
                done: false,
              });
            }
            onDelta({ done: true });
          } else if (reason === "stop" || (reason && reason !== "null")) {
            onDelta({ done: true });
          }
        } catch {
          /* skip malformed SSE */
        }
      }
    }
  }
}

// ── Chrome AI Provider ───────────────────────────────────────────────────────
// Gemini Nano via window.LanguageModel (Chrome 148+) or window.ai.languageModel
// (Chrome 128-147). On-device, no API key required.
//
// ARCHITECTURE: Chrome AI (Gemini Nano, ~1.5B params, ~1024 token context) is
// NOT capable of reliable tool-calling via JSON instructions — the system prompt
// + tool descriptions alone already saturates its context. Instead we use:
//
//   PLANNING:  keyword routing (zero LLM cost, deterministic)
//              → emit tool call delta for the graph to execute
//   SYNTHESIS: compact prompt (tool name + result summary + user query, ~150 tokens)
//              → Chrome AI generates a brief human-readable answer
//   DIRECT:    for non-data questions, tiny prompt → Chrome AI answers from context
//
// supportsToolCalling = false signals the graph to use the keyword router instead
// of prompting Chrome AI to decide which tool to call.

interface ChromeLanguageModel {
  availability(): Promise<"unavailable" | "downloadable" | "downloading" | "available">;
  create(options?: {
    systemPrompt?: string;
    signal?: AbortSignal;
    temperature?: number;
    topK?: number;
  }): Promise<ChromeAISession>;
}

interface ChromeAISession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

interface OldChromeAI {
  capabilities(): Promise<{ available: string }>;
  create(opts?: { systemPrompt?: string; signal?: AbortSignal }): Promise<OldChromeAISession>;
}

interface OldChromeAISession {
  promptStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

declare global {
  interface Window {
    ai?: { languageModel?: OldChromeAI };
    LanguageModel?: ChromeLanguageModel;
  }
}

function hasNewAPI(): boolean {
  return typeof (window as any).LanguageModel?.create === "function";
}

function hasOldAPI(): boolean {
  return typeof (window as any).ai?.languageModel?.create === "function";
}

// ── Keyword routing ───────────────────────────────────────────────────────────
// Deterministic tool selection — no LLM needed. Ordered from most-specific to
// least-specific so "flaky run history" → get_flaky_tests, not query_runs.

// Routing table — evaluated top-to-bottom, first match wins.
// More-specific patterns must appear BEFORE general catch-alls.
// Each action message in QuickActions.tsx is designed to hit exactly one route.
const KEYWORD_ROUTES: Array<{
  tool: string;
  args: Record<string, unknown>;
  patterns: RegExp[];
}> = [
  // ── Flakiness ──────────────────────────────────────────────────────────────
  {
    tool: "get_flaky_tests",
    args: {},
    patterns: [
      /flak/i,
      /unstable/i,
      /\bflip\b/i,
      /PASS.*FAIL|FAIL.*PASS/i,
      /reliab/i, // "most stable and reliable" → stable tests
      /inconsist/i,
      /never.*fail/i, // "tests that never fail"
      /high.risk.*test/i, // "high-risk flaky tests"
      /\bstable\b/i, // "which are most stable envs / tests"
    ],
  },

  // ── Promotion gate ─────────────────────────────────────────────────────────
  {
    tool: "get_promotion_status",
    args: {},
    patterns: [
      /promot/i,
      /\bdeploy\b/i,
      /release.?ready/i,
      /go.to.prod/i,
      /can we.*(deploy|ship|release)/i,
      /prod.*(ready|block|gate)/i,
      /\bgate\b/i,
      /block.*rate|percent.*block/i, // "block rate / % blocked"
      /uat.*threshold|above.*95/i, // "UAT above 95%"
      /last.*block/i, // "last block decision"
      /successful.*promot/i, // "successful promotions"
      /gate.*trend|block.*often/i, // "gate trend"
    ],
  },

  // ── Failure breakdown ──────────────────────────────────────────────────────
  // (before compare_environments so specific keywords win)
  {
    tool: "get_failure_breakdown",
    args: {},
    patterns: [
      /breakdown/i,
      /\bcategor/i, // "categories" → category heatmap, top categories, etc.
      /why.*fail/i,
      /what.*failing/i,
      /root.cause/i,
      /failing most/i,
      /\bwaf\b/i, // "WAF tests"
      /security.*fail|security.*test/i, // "security failures"
      /bot.*manager|bot.*protect/i, // "bot manager"
      /\btls\b|certificate.*valid/i, // "TLS / certificate"
      /performance.*fail|timing.*fail/i, // "performance failures"
      /api.*fail|http.*fail/i, // "API / HTTP failures"
      /regression.*alert|newly.*fail/i, // "regression alert"
      /zero.*pass.*rate|zero.*pass\b/i, // "zero pass rate"
      /\bedgeworker\b|edge.*worker/i, // "EdgeWorker tests"
      /cache.*behav|cdn.*cache.*test/i, // "cache behavior tests"
      /suite.*fail|fail.*suite/i, // "suite failures"
      /\bheatmap\b/i, // "category heatmap"
    ],
  },

  // ── Compare environments ───────────────────────────────────────────────────
  // (before env-specific query_runs so prod.*status wins over prod.*run)
  {
    tool: "compare_environments",
    args: {},
    patterns: [
      /compare.*(env|qa|uat|prod)/i,
      /env.*(compar|health|summar|status|across)/i,
      /qa.*uat|uat.*prod/i,
      /all.*(env|environment)/i,
      /across.*(env|environment)/i,
      /qa.*health|qa.*deep.dive/i, // "QA deep dive / health"
      /uat.*status|uat.*health/i, // "UAT status / health"
      /prod.*status|prod.*health/i, // "PROD status / health" (before prod.*run)
      /qa.*vs.*prod|quality.*gap/i, // "QA vs PROD gap"
      /worst.*env|env.*worst/i, // "worst env / env worst pass rate"
      /\bdegrading\b|env.*trend/i, // "degrading / env trend"
      /staging.*network/i, // "staging network"
      /production.*network/i, // "production network"
      /cdn.*health|cdn.*summar/i, // "CDN health summary"
      /cdn.*report|full.*cdn.*report/i, // "full CDN report"
      /playwright.*vs.*pytest|web.*vs.*api/i, // "Web vs API"
      /akamai.*health|akamai.*property/i, // "Akamai property health"
    ],
  },

  // ── QA-specific runs (before general query_runs) ──────────────────────────
  {
    tool: "query_runs",
    args: { limit: 10, env: "QA" },
    patterns: [/\bqa\b.*run|run.*\bqa\b/i],
  },

  // ── UAT-specific runs ─────────────────────────────────────────────────────
  {
    tool: "query_runs",
    args: { limit: 10, env: "UAT" },
    patterns: [/\buat\b.*run|run.*\buat\b/i],
  },

  // ── PROD-specific runs (prod.*status already claimed by compare_environments) ──
  {
    tool: "query_runs",
    args: { limit: 10, env: "PROD" },
    patterns: [/\bprod\b.*run|run.*\bprod\b/i],
  },

  // ── General runs (catch-all) ───────────────────────────────────────────────
  {
    tool: "query_runs",
    args: { limit: 10 },
    patterns: [
      /\brun\b/i,
      /pass.?rate/i,
      /latest.*(run|result|test)/i,
      /last \d+/i,
      /\bhistory\b/i,
      /\btrend\b/i,
      /failure.count/i,
      /test.result/i,
      /recent.*(run|test)/i,
      /playwright.*pass|playwright.*rate/i, // "Playwright pass rate"
      /pytest.*pass|pytest.*rate|pytest.*result/i, // "pytest pass rate"
      /\bsuite\b/i, // "suite overview / all suites"
      /test.*volume|test.*count|how.many.*test/i, // "test count / volume"
    ],
  },

  // ── Environment health fallback ────────────────────────────────────────────
  {
    tool: "compare_environments",
    args: {},
    patterns: [/\bhealth\b/i, /\boverall\b/i, /\bsummary\b/i, /status.*env/i],
  },
];

export function routeByKeyword(
  query: string,
): { tool: string; args: Record<string, unknown> } | null {
  for (const { tool, args, patterns } of KEYWORD_ROUTES) {
    if (patterns.some((p) => p.test(query))) return { tool, args };
  }
  return null;
}

// ── Template synthesis (Chrome AI path) ──────────────────────────────────────
// Chrome AI (Gemini Nano) generates gibberish when asked to synthesize tool
// results even with compact prompts. Instead, we build the response directly
// from the structured tool data — fast, accurate, zero hallucination.

function buildTemplateSynthesis(
  toolName: string,
  toolDataJson: string,
  _userQuery: string,
): string {
  try {
    const data = JSON.parse(toolDataJson);

    switch (toolName) {
      case "query_runs": {
        const runs: any[] = Array.isArray(data) ? data : [];
        if (!runs.length) return "No test runs found in the dataset.";
        // Tool returns { run, env, passRate, failures, date } — not the raw run fields
        const envs = [...new Set(runs.map((r: any) => r.env).filter(Boolean))];
        const envLabel = envs.length === 1 ? ` (${envs[0]})` : "";
        const header = `Here are the **last ${Math.min(runs.length, 10)} test runs**${envLabel}:\n\n`;
        const rows = runs
          .slice(0, 10)
          .map(
            (r: any) =>
              `- **${r.run ?? r.label ?? r.id ?? "Run"}** · ${r.env} · **${r.passRate ?? r.passPct ?? "?"}%** pass · ${r.failures ?? 0} failure${(r.failures ?? 0) !== 1 ? "s" : ""} · ${r.date ?? ""}`,
          )
          .join("\n");
        return header + rows;
      }

      case "get_flaky_tests": {
        const tests: any[] = Array.isArray(data) ? data : [];
        if (!tests.length)
          return "✅ No flaky tests detected in recent runs — all tests are stable.";
        const header = `Found **${tests.length} flaky test${tests.length !== 1 ? "s" : ""}** (flipping between PASS and FAIL):\n\n`;
        const rows = tests
          .slice(0, 10)
          .map(
            (t: any) =>
              `- **${t.id}** · score **${t.score}%** · ${t.flips} flip${t.flips !== 1 ? "s" : ""} in ${t.runs} runs`,
          )
          .join("\n");
        return header + rows;
      }

      case "compare_environments": {
        const rows: any[] = Array.isArray(data) ? data : [];
        if (!rows.length) return "No environment data available.";
        const header = "**Environment Comparison** (QA → UAT → PROD):\n\n";
        const items = rows
          .map(
            (r: any) =>
              `- **${r.env}**: avg **${r.avgPassRate}%** pass rate · ${r.totalFailures} failures · ${r.runs} runs`,
          )
          .join("\n");
        return header + items;
      }

      case "get_promotion_status": {
        const { total = 0, promoted = 0, blocked = 0, pending = 0 } = data as any;
        const pct = total > 0 ? Math.round((promoted / total) * 100) : 0;
        return (
          `**Promotion Gate** (${total} decision${total !== 1 ? "s" : ""} total):\n\n` +
          `- ✅ Promoted to PROD: **${promoted}** (${pct}%)\n` +
          `- 🚫 Blocked: **${blocked}**\n` +
          `- ⏳ Pending: **${pending}**`
        );
      }

      case "get_failure_breakdown": {
        const { label, passPct, rows = [] } = data as any;
        const header = `**Failure Breakdown** — ${label || "Latest Run"} (**${passPct}%** pass rate):\n\n`;
        if (!rows.length) return header + "No failures in this run. ✅";
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
    // JSON.parse failed or template crashed — show something useful
    // This can happen if toolDataJson is empty or malformed.
    const names: Record<string, string> = {
      query_runs: "Run History",
      get_flaky_tests: "Flaky Test Analysis",
      compare_environments: "Environment Comparison",
      get_promotion_status: "Promotion Gate",
      get_failure_breakdown: "Failure Breakdown",
    };
    const label = names[toolName] ?? toolName;
    return `**${label}** data retrieved. The chart above shows the results — expand the tool card to see the raw data.`;
  }
}

// Emit a pre-built string as streaming deltas (simulates typing feel)
function emitAsStream(text: string, onDelta: (delta: StreamDelta) => void): void {
  const CHUNK = 10;
  for (let i = 0; i < text.length; i += CHUNK) {
    onDelta({ content: text.slice(i, i + CHUNK), done: false });
  }
  onDelta({ done: true });
}

// Canned responses for casual queries that don't need data tools.
// Chrome AI is unreliable even for simple chat — use canned responses instead.
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
    pattern: /what.*(can|do) you|what.*(help|know|support)|your (capabilities|features)/i,
    response:
      "I can help with:\n- **Latest Runs** — pass rates & failure counts\n- **Flaky Tests** — tests flipping PASS↔FAIL\n- **Compare Envs** — QA vs UAT vs PROD\n- **Promotion Gate** — UAT→PROD readiness\n- **Failure Breakdown** — categories failing\n\nTry a Quick Action or just ask!",
  },
  {
    pattern: /thank|thanks|great|awesome|nice|cool|perfect/i,
    response: "Glad to help! Let me know if you need anything else about your test data.",
  },
];

function getCasualResponse(query: string): string | null {
  for (const { pattern, response } of CASUAL_PATTERNS) {
    if (pattern.test(query)) return response;
  }
  return null;
}

// ── Chrome AI streaming helper ─────────────────────────────────────────────────
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
      onDelta({ content: "⚠️ Chrome AI is not available in this browser.", done: true });
      return;
    }
  } catch (err: unknown) {
    if ((signal as AbortSignal).aborted) {
      onDelta({ done: true });
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    onDelta({ content: `⚠️ Chrome AI error: ${msg}`, done: true });
    return;
  }

  if (signal.aborted) {
    session.destroy();
    onDelta({ done: true });
    return;
  }

  // Stream — Chrome AI yields cumulative text, compute true deltas
  const stream = session.promptStreaming(userPrompt);
  const reader = stream.getReader();
  let fullText: string;
  let lastLen = 0;

  try {
    while (true) {
      if (signal.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      fullText = typeof value === "string" ? value : new TextDecoder().decode(value);
      if (fullText.length > lastLen) {
        onDelta({ content: fullText.slice(lastLen), done: false });
        lastLen = fullText.length;
      }
    }
  } finally {
    reader.releaseLock();
    session.destroy();
  }

  onDelta({ done: true });
}

// ── ChromeProvider ────────────────────────────────────────────────────────────
export class ChromeProvider implements IProvider {
  readonly type: ProviderType = "chrome";

  // Signal to the graph agent that Chrome AI should NOT be used for tool selection.
  // The graph will use routeByKeyword() instead and only call stream() for synthesis.
  readonly supportsToolCalling = false;

  async checkAvailability(): Promise<ProviderStatus> {
    try {
      if (hasNewAPI()) {
        const r = await (window as any).LanguageModel.availability();
        if (r === "available") return "available";
        if (r === "downloadable" || r === "downloading") return "downloading";
        return "unavailable";
      }
      if (hasOldAPI()) {
        const api = (window as any).ai.languageModel as OldChromeAI;
        const r = await api.capabilities();
        const avail = typeof r === "object" ? r.available : r;
        if (avail === "readily") return "available";
        if (avail === "after-download" || avail === "downloadable") return "downloading";
        return "unavailable";
      }
      return "unavailable";
    } catch {
      return "unavailable";
    }
  }

  // stream() is called by the graph for synthesis (after tools have run)
  // or for direct answers (no tool matched the query).
  //
  // Two modes detected by message shape:
  //   Synthesis:  messages contains { role: "tool", ... }
  //   Direct:     no tool messages
  //
  // Chrome AI (Gemini Nano) generates gibberish when asked to synthesize or
  // follow complex instructions, so we bypass it entirely:
  //   • Synthesis → template-built response from structured tool data (no LLM)
  //   • Direct    → canned response for common patterns; Chrome AI for the rest
  async stream(
    messages: ApiMessage[],
    _tools: ToolDefinition[],
    signal: AbortSignal,
    onDelta: (delta: StreamDelta) => void,
  ): Promise<void> {
    const userQuery = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const query = typeof userQuery === "string" ? userQuery : JSON.stringify(userQuery);
    const toolMessages = messages.filter((m) => m.role === "tool");

    if (toolMessages.length > 0) {
      // ── SYNTHESIS MODE ──────────────────────────────────────────────────────
      // Gemini Nano can't reliably follow synthesis instructions — use templates.
      const assistantMsg = [...messages]
        .reverse()
        .find((m) => m.role === "assistant" && m.tool_calls);
      const toolName = assistantMsg?.tool_calls?.[0]?.function?.name ?? "tool";

      // Use only the LAST tool message — joining multiple (from conversation
      // history) produces invalid multi-JSON that crashes JSON.parse().
      const lastToolMsg = toolMessages[toolMessages.length - 1];
      const toolDataJson = (lastToolMsg?.content ?? "").slice(0, 4000);

      const response = buildTemplateSynthesis(toolName, toolDataJson, query);
      emitAsStream(response, onDelta);
      return;
    }

    // ── DIRECT MODE ──────────────────────────────────────────────────────────
    // No tool was called. Try canned patterns first (instant, reliable).
    const canned = getCasualResponse(query);
    if (canned) {
      emitAsStream(canned, onDelta);
      return;
    }

    // For non-casual questions that still don't need data tools, try Chrome AI
    // with a minimal prompt. If unavailable, show a helpful fallback.
    if (!hasNewAPI() && !hasOldAPI()) {
      emitAsStream(
        "I'm the **AWARE Copilot**. I can analyze test runs, flakiness, environment health, and promotion gate status. Try a Quick Action on the left!",
        onDelta,
      );
      return;
    }

    // Ultra-minimal Chrome AI call — system + user query only (~30 tokens total)
    await streamFromChromeAI("Reply in 1-2 sentences.", query, signal, onDelta);
  }
}

// ── System Prompt Compatibility Helper ───────────────────────────────────────
function mergeSystemIntoUser(messages: ApiMessage[]): ApiMessage[] {
  const sysIdx = messages.findIndex((m) => m.role === "system");
  if (sysIdx === -1) return messages;
  const sysMsg = messages[sysIdx];
  const rest = messages.filter((_, i) => i !== sysIdx);
  const userIdx = rest.findIndex((m) => m.role === "user" || m.role === "assistant");
  if (userIdx === -1) return [{ role: "user", content: sysMsg.content }, ...rest];
  const merged: ApiMessage = {
    ...rest[userIdx],
    content: `${sysMsg.content}\n\n${rest[userIdx].content ?? ""}`,
  };
  const out = [...rest];
  out[userIdx] = merged;
  return out;
}

// ── Provider Registry ─────────────────────────────────────────────────────────
export function createProvider(type: ProviderType): IProvider {
  switch (type) {
    case "webllm":
      return new WebLLMProvider();
    case "openai":
      return new OpenAIProvider();
    case "chrome":
      return new ChromeProvider();
  }
}

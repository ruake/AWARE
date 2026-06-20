import type {
  IProvider,
  ProviderStatus,
  ProviderType,
  ApiMessage,
  ToolDefinition,
  StreamDelta,
} from "./types";
import { loadOpenAIConfig } from "./storage";
import { synthesizeWithChromeAI, answerDirectWithChromeAI } from "./chromeAIDataLayer";
import { checkAIRateLimit } from "@/lib/rateLimit";

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
    if (!checkAIRateLimit()) {
      onDelta({
        content:
          "⚠️ Rate limit reached (10 requests/min). Please wait a moment before sending another message.",
        done: true,
      });
      return;
    }

    const { apiKey, apiUrl, model } = loadOpenAIConfig();
    const base = apiUrl || "https://api.openai.com/v1";

    const useServerProxy = import.meta.env.DEV || import.meta.env.VITE_USE_AI_PROXY === "true";

    if (!useServerProxy && !apiKey) {
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

    const endpoint = useServerProxy ? "/api/ai/chat" : `${base}/chat/completions`;
    const authHeaders: Record<string, string> = useServerProxy
      ? {}
      : { Authorization: `Bearer ${apiKey}` };

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
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
      /\bfail/i, // broad: any "fail/failing/failed/failure" not caught above
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

  // ── Health / summary / overview (BEFORE general runs to prevent \blast \d+\b steal) ──
  {
    tool: "query_runs",
    args: { limit: 10 },
    patterns: [
      /\bsummary\b/i,
      /\bhealth\b/i,
      /\boverview\b/i,
      /\btrend\b/i,
      /overall.*(status|health|pass)/i,
    ],
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
      /failure.count/i,
      /test.result/i,
      /recent.*(run|test)/i,
      /playwright.*pass|playwright.*rate/i,
      /pytest.*pass|pytest.*rate|pytest.*result/i,
      /\bsuite\b/i,
      /test.*volume|test.*count|how.many.*test/i,
      // Natural language phrasings that clearly mean "show me test data"
      /last test|latest test|most recent test/i,
      /tell me about.*(test|run|result)/i,
      /what.*happen|what.*went|how.*did/i,
      /show me.*(test|run|result|data)/i,
      /give me.*(test|run|result|data)/i,
      /\btest status\b|\brun status\b|\bcurrent status\b/i,
      /how.*test|test.*today|test.*this week/i,
      /any.*fail|did.*fail|are.*fail/i,
      /\bresult\b/i,
      /\blatest\b/i,
      /\brecent\b/i,
      /\bci\b/i,
      // Scope / data availability questions
      /how.much.data/i,
      /what.data.do.you/i,
      /how.many.run|how.many.test/i,
      /what.do.you.have|what.do.you.know/i,
      /data.*available|available.*data/i,
      /data.*coverage|coverage.*data/i,
      /\bscope\b/i,
    ],
  },

  // ── Environment comparison ─────────────────────────────────────────────────
  {
    tool: "compare_environments",
    args: {},
    patterns: [/\bcompare\b.*env/i, /env.*comparison/i, /qa.*vs.*uat|qa.*vs.*prod|uat.*vs.*prod/i],
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
export class ChromeProvider implements IProvider {
  readonly type: ProviderType = "chrome";

  readonly supportsToolCalling = false;

  async checkAvailability(): Promise<ProviderStatus> {
    try {
      if (typeof (window as any).LanguageModel?.availability === "function") {
        const r = await (window as any).LanguageModel.availability();
        if (r === "available") return "available";
        if (r === "downloading" || r === "downloadable") return "downloading";
        return "unavailable";
      }
      if (typeof (window as any).ai?.languageModel?.capabilities === "function") {
        const api = (window as any).ai.languageModel;
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

  async stream(
    messages: ApiMessage[],
    _tools: ToolDefinition[],
    signal: AbortSignal,
    onDelta: (delta: StreamDelta) => void,
  ): Promise<void> {
    const userQuery = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const query = typeof userQuery === "string" ? userQuery : JSON.stringify(userQuery);

    // Only look for tool results from the CURRENT turn (after the last user message).
    // Without this guard, the synthesizer picks up tool results from *previous* turns
    // and re-renders the same data for every follow-up conversational question.
    const lastUserIdx = messages.reduce((idx, m, i) => (m.role === "user" ? i : idx), -1);
    const currentTurnMessages = lastUserIdx >= 0 ? messages.slice(lastUserIdx) : [];
    const toolMessages = currentTurnMessages.filter((m) => m.role === "tool");

    // Collect prior assistant text responses (not tool-call messages) for context
    const priorResponses = messages
      .slice(0, lastUserIdx)
      .filter((m) => m.role === "assistant" && typeof m.content === "string" && m.content)
      .map((m) => (typeof m.content === "string" ? m.content : ""))
      .filter(Boolean)
      .slice(-2);

    if (toolMessages.length > 0) {
      const assistantMsg = [...currentTurnMessages]
        .reverse()
        .find((m) => m.role === "assistant" && m.tool_calls);
      const toolName = assistantMsg?.tool_calls?.[0]?.function?.name ?? "tool";

      const lastToolMsg = toolMessages[toolMessages.length - 1];
      let rawData: unknown;
      try {
        rawData = JSON.parse(lastToolMsg?.content ?? "null");
      } catch {
        rawData = lastToolMsg?.content ?? null;
      }

      await synthesizeWithChromeAI({ toolName, rawData, userQuery: query, signal, onDelta });
      return;
    }

    await answerDirectWithChromeAI({ userQuery: query, priorResponses, signal, onDelta });
  }
}

// ── System Prompt Compatibility Helper ───────────────────────────────────────
function mergeSystemIntoUser(messages: ApiMessage[]): ApiMessage[] {
  const sysIdx = messages.findIndex((m) => m.role === "system");
  if (sysIdx === -1) return messages;
  const sysMsg = messages[sysIdx];
  const rest = messages.filter((_, i) => i !== sysIdx);
  const userIdx = rest.findIndex((m) => m.role === "user");
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

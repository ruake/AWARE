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
          onDelta({ toolCallId: a.id, toolCallName: a.name, toolCallArgsChunk: a.args, done: false });
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
        if (json === "[DONE]") { onDelta({ done: true }); return; }
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
              onDelta({ toolCallId: a.id, toolCallName: a.name, toolCallArgsChunk: a.args, done: false });
            }
            onDelta({ done: true });
          } else if (reason === "stop" || (reason && reason !== "null")) {
            onDelta({ done: true });
          }
        } catch { /* skip malformed SSE */ }
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

const KEYWORD_ROUTES: Array<{
  tool: string;
  args: Record<string, unknown>;
  patterns: RegExp[];
}> = [
  {
    tool: "get_flaky_tests",
    args: {},
    patterns: [/flak/i, /unstable/i, /flip/i, /PASS.*FAIL|FAIL.*PASS/i, /reliab/i, /inconsist/i],
  },
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
      /gate/i,
    ],
  },
  {
    tool: "get_failure_breakdown",
    args: {},
    patterns: [
      /breakdown/i,
      /\bcategor/i,
      /why.*fail/i,
      /what.*failing/i,
      /root.cause/i,
      /failing most/i,
    ],
  },
  {
    tool: "compare_environments",
    args: {},
    patterns: [
      /compare.*(env|qa|uat|prod)/i,
      /env.*(compar|health|summar|status|across)/i,
      /qa.*uat|uat.*prod/i,
      /all.*(env|environment)/i,
      /across.*(env|environment)/i,
    ],
  },
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
    ],
  },
  {
    tool: "compare_environments",
    args: {},
    patterns: [/health/i, /overall/i, /summary/i, /status.*env/i],
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

// ── Compact prompts for Chrome AI synthesis ───────────────────────────────────

function buildSynthesisPrompt(
  userQuery: string,
  toolName: string,
  toolResultJson: string,
): string {
  // Target: ~150 tokens total — well within Gemini Nano's context
  const summary = toolResultJson.slice(0, 600);
  return `You are a CDN test analytics assistant. Be concise (2-4 sentences, use numbers).

Data (${toolName}): ${summary}

Question: ${userQuery}

Answer:`;
}

function buildDirectPrompt(userQuery: string): string {
  return `You are an assistant for AWARE, an Akamai CDN test dashboard.
Key facts: QA → UAT → PROD environments. Promotion gate needs ≥95% pass rate.
Answer in 1-3 sentences.

Question: ${userQuery}
Answer:`;
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
    if ((signal as AbortSignal).aborted) { onDelta({ done: true }); return; }
    const msg = err instanceof Error ? err.message : String(err);
    onDelta({ content: `⚠️ Chrome AI error: ${msg}`, done: true });
    return;
  }

  if (signal.aborted) { session.destroy(); onDelta({ done: true }); return; }

  // Stream — Chrome AI yields cumulative text, compute true deltas
  const stream = session.promptStreaming(userPrompt);
  const reader = stream.getReader();
  let fullText = "";
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
    } catch { return "unavailable"; }
  }

  // stream() is called by the graph ONLY for synthesis (after tools have run),
  // or for direct answers (when the graph determines no tool is needed).
  //
  // Two modes detected by message shape:
  //   Synthesis:  messages contains a { role: "tool", ... } message
  //   Direct:     no tool messages — Chrome AI answers from context
  async stream(
    messages: ApiMessage[],
    _tools: ToolDefinition[],
    signal: AbortSignal,
    onDelta: (delta: StreamDelta) => void,
  ): Promise<void> {
    if (!hasNewAPI() && !hasOldAPI()) {
      onDelta({ content: "⚠️ Chrome AI is not available in this browser.", done: true });
      return;
    }

    const userQuery =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? "Hello";

    const toolMessages = messages.filter((m) => m.role === "tool");

    if (toolMessages.length > 0) {
      // ── SYNTHESIS MODE ──────────────────────────────────────────────────────
      // We have tool results. Build a compact synthesis prompt.
      const assistantMsg = [...messages].reverse().find(
        (m) => m.role === "assistant" && m.tool_calls,
      );
      const toolName = assistantMsg?.tool_calls?.[0]?.function?.name ?? "tool";
      const toolResultJson = toolMessages.map((m) => m.content).join("\n").slice(0, 600);

      const systemPrompt = `You are a concise CDN test analytics assistant. Use numbers from the data.`;
      const userPrompt = buildSynthesisPrompt(
        typeof userQuery === "string" ? userQuery : JSON.stringify(userQuery),
        toolName,
        toolResultJson,
      );

      await streamFromChromeAI(systemPrompt, userPrompt, signal, onDelta);
    } else {
      // ── DIRECT MODE ────────────────────────────────────────────────────────
      // No tool results — Chrome AI answers a general question directly.
      const query = typeof userQuery === "string" ? userQuery : JSON.stringify(userQuery);
      const systemPrompt = `You are a concise assistant for AWARE, an Akamai CDN test dashboard.`;
      const userPrompt = buildDirectPrompt(query);

      await streamFromChromeAI(systemPrompt, userPrompt, signal, onDelta);
    }
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
    case "webllm": return new WebLLMProvider();
    case "openai": return new OpenAIProvider();
    case "chrome": return new ChromeProvider();
  }
}

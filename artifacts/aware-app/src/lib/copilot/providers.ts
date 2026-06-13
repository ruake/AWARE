import type {
  IProvider,
  ProviderStatus,
  ProviderType,
  ApiMessage,
  ToolDefinition,
  StreamDelta,
} from "./types";
import { loadOpenAIConfig } from "./storage";

// ── WebLLM Provider (PRIMARY) ────────────────────────────────────────────────
// Hermes-2-Pro-Mistral-7B running locally via WebGPU.
// Downloads ~4 GB on first use, cached in IndexedDB thereafter.
// Smallest WebLLM model with native tool-calling support (q4f16 quantization).

const WEBLLM_MODEL = "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC";

export class WebLLMProvider implements IProvider {
  readonly type: ProviderType = "webllm";
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

    // Some models (Hermes-2-Pro) reject system + tools together.
    // Merge system prompt into first user message when tools are present.
    const msgs = toolDefs ? mergeSystemIntoUser(messages) : messages;

    const streamResp = await engine.chat.completions.create({
      messages: msgs,
      tools: toolDefs,
      tool_choice: toolDefs ? "auto" : undefined,
      stream: true,
      temperature: 0.3,
      max_tokens: 1024,
    });

    // Accumulate tool calls across chunks (args arrive as JSON fragments)
    const accum: Record<number, { id: string; name: string; args: string }> = {};

    for await (const chunk of streamResp) {
      if (signal.aborted) break;
      const choice = chunk.choices?.[0];
      if (!choice) continue;
      const delta = choice.delta;

      if (delta?.content) {
        onDelta({ content: delta.content, done: false });
      }

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

// ── OpenAI Provider (TERTIARY) ───────────────────────────────────────────────
// Any OpenAI-compatible endpoint. Requires API key in settings.
// Full tool calling + SSE streaming.

export class OpenAIProvider implements IProvider {
  readonly type: ProviderType = "openai";

  async checkAvailability(): Promise<ProviderStatus> {
    return "available"; // always reachable; errors surface at runtime
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

    // Some models (Hermes-2-Pro) reject system + tools together.
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
          } else if (reason && reason !== "null" && reason !== "stop") {
            onDelta({ done: true });
          } else if (reason === "stop") {
            onDelta({ done: true });
          }
        } catch {
          /* skip malformed SSE chunks */
        }
      }
    }
  }
}

// ── Chrome AI Provider (SECONDARY) ──────────────────────────────────────────
// Gemini Nano via window.LanguageModel (Chrome 148+, shipped May 2026).
// Falls back to window.ai.languageModel (Chrome 128-147 experimental).
// On-device, no API key needed. No native tool calling — we describe
// tools in the prompt and parse JSON.

// New Chrome 148+ API: window.LanguageModel
interface ChromeLanguageModel {
  availability(options?: {
    expectedInputs?: Array<{ type: string; languages?: string[] }>;
    expectedOutputs?: Array<{ type: string; languages?: string[] }>;
  }): Promise<"unavailable" | "downloadable" | "downloading" | "available">;
  create(options?: {
    systemPrompt?: string;
    initialPrompts?: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>;
    signal?: AbortSignal;
    monitor?(m: EventTarget): void;
    temperature?: number;
    topK?: number;
  }): Promise<ChromeAISession>;
}

interface ChromeAISession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): ReadableStream<string>;
  destroy(): void;
  clone(): Promise<ChromeAISession>;
}

// Old Chrome 128-147 API: window.ai.languageModel
interface OldChromeAI {
  capabilities(): Promise<{ available: string }>;
  create(opts?: { systemPrompt?: string; signal?: AbortSignal }): Promise<OldChromeAISession>;
}

interface OldChromeAISession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

declare global {
  interface Window {
    ai?: {
      languageModel?: OldChromeAI;
    };
    LanguageModel?: ChromeLanguageModel;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Check if the new Chrome 148+ API is available */
function hasNewAPI(): boolean {
  return typeof (window as any).LanguageModel?.create === "function";
}

/** Check if the old Chrome 128-147 API is available */
function hasOldAPI(): boolean {
  const lm = (window as any).ai?.languageModel;
  return typeof lm?.create === "function";
}

// ── Availability ─────────────────────────────────────────────────────────────

export class ChromeProvider implements IProvider {
  readonly type: ProviderType = "chrome";

  async checkAvailability(): Promise<ProviderStatus> {
    try {
      // New API (Chrome 148+)
      if (hasNewAPI()) {
        const result = await (window as any).LanguageModel.availability();
        if (result === "available") return "available";
        if (result === "downloadable") return "available";
        if (result === "downloading") return "downloading";
        return "unavailable";
      }

      // Old API (Chrome 128-147)
      if (hasOldAPI()) {
        const api = (window as any).ai.languageModel as OldChromeAI;
        const result = await api.capabilities();
        const avail =
          typeof result === "object" ? (result as { available: string }).available : result;
        if (avail === "readily") return "available";
        if (avail === "after-download") return "downloading";
        if (avail === "downloadable") return "available";
        return "unavailable";
      }

      return "unavailable";
    } catch {
      return "unavailable";
    }
  }

  async stream(
    messages: ApiMessage[],
    tools: ToolDefinition[],
    signal: AbortSignal,
    onDelta: (delta: StreamDelta) => void,
  ): Promise<void> {
    const sys = messages.find((m) => m.role === "system")?.content ?? "";
    const chatMessages = messages.filter((m) => m.role !== "system");

    // Describe tools in the system prompt (Chrome AI has no native tool calling)
    const toolDesc =
      tools.length > 0
        ? `\n\nAvailable tools (respond with JSON {tool, args} to call one):\n` +
          tools.map((t) => `- ${t.name}: ${t.description}`).join("\n")
        : "";

    // ── Build the full prompt with conversation history ─────────────────────
    const historyText = chatMessages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content ?? ""}`)
      .join("\n\n");

    try {
      let session: ChromeAISession | OldChromeAISession;

      if (hasNewAPI()) {
        // Chrome 148+ API — use initialPrompts for system prompt + history
        const initialPrompts: Array<{
          role: "system" | "user" | "assistant";
          content: string;
        }> = [];
        if (sys || toolDesc) {
          initialPrompts.push({
            role: "system",
            content: sys + toolDesc,
          });
        }
        session = await (window as any).LanguageModel.create({
          initialPrompts,
          signal,
        });
      } else if (hasOldAPI()) {
        const api = (window as any).ai.languageModel as OldChromeAI;
        session = await api.create({
          systemPrompt: sys ? sys + toolDesc : toolDesc || undefined,
          signal,
        });
      } else {
        onDelta({ content: "⚠️ Chrome AI not available in this browser.", done: true });
        return;
      }

      const stream = session.promptStreaming(historyText);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      // Buffer full output — Chrome AI has no native tool calling, so we
      // must accumulate the full text and check for JSON tool call at the end
      let fullText = "";

      try {
        while (true) {
          if (signal.aborted) break;
          const { done, value } = await reader.read();
          if (done) break;
          const text = typeof value === "string" ? value : decoder.decode(value, { stream: true });
          fullText = text;
        }
      } finally {
        reader.releaseLock();
        session.destroy();
      }

      // Check if the output is a JSON tool call from the non-native
      // tool-calling prompt (respond with JSON {tool, args})
      if (tools.length > 0) {
        const trimmed = fullText.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed.tool === "string" && parsed.args && typeof parsed.args === "object") {
              onDelta({
                toolCallId: `chrome-${Date.now()}`,
                toolCallName: parsed.tool,
                toolCallArgsChunk: JSON.stringify(parsed.args),
                done: false,
              });
              onDelta({ done: true });
              return;
            }
          } catch {
            /* not valid JSON — treat as regular text */
          }
        }
      }

      // Not a tool call — emit buffered text as a single content block
      if (fullText) onDelta({ content: fullText, done: false });
      onDelta({ done: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      onDelta({ content: `⚠️ Chrome AI error: ${msg}`, done: true });
    }
  }
}

// ── System Prompt Compatibility Helper ───────────────────────────────────────
// Some models (e.g. Hermes-2-Pro) reject requests that include both a system
// role message and the `tools` parameter. This merges the system prompt into
// the first user message as a prefix.
function mergeSystemIntoUser(messages: ApiMessage[]): ApiMessage[] {
  const sysIdx = messages.findIndex((m) => m.role === "system");
  if (sysIdx === -1) return messages;
  const sysMsg = messages[sysIdx];
  const rest = messages.filter((_, i) => i !== sysIdx);
  const userIdx = rest.findIndex((m) => m.role === "user" || m.role === "assistant");
  if (userIdx === -1) {
    return [{ role: "user", content: sysMsg.content }, ...rest];
  }
  const merged: ApiMessage = {
    ...rest[userIdx],
    content: `${sysMsg.content}\n\n${rest[userIdx].content ?? ""}`,
  };
  const out = [...rest];
  out[userIdx] = merged;
  return out;
}

// ── Provider Registry ────────────────────────────────────────────────────────
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

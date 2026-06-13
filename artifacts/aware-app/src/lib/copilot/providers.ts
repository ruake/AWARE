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
          } else if (reason === "stop" || (reason && reason !== "null")) {
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
//
// CRITICAL QUIRKS:
// 1. promptStreaming yields CUMULATIVE text (full response so far) per chunk,
//    not incremental deltas. Track last-emitted length to emit true deltas.
// 2. initialPrompts requires alternating user/assistant turns — NEVER pass
//    an assistant-first history. Always use systemPrompt for all context.
// 3. LanguageModel.create() can hang if called with an invalid initialPrompts
//    pattern. Use systemPrompt + history-as-text to avoid this entirely.

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

/**
 * Extract a JSON tool call from Chrome AI output.
 * Handles raw JSON, markdown code blocks, and JSON embedded in prose.
 * Returns null if no valid {tool, args} object is found.
 */
function extractJsonToolCall(
  text: string,
): { tool: string; args: Record<string, unknown> } | null {
  const trimmed = text.trim();

  const tryParse = (s: string): { tool: string; args: Record<string, unknown> } | null => {
    try {
      const parsed = JSON.parse(s.trim());
      if (
        parsed &&
        typeof parsed.tool === "string" &&
        parsed.args &&
        typeof parsed.args === "object" &&
        !Array.isArray(parsed.args)
      ) {
        return parsed as { tool: string; args: Record<string, unknown> };
      }
    } catch {
      /* not valid JSON */
    }
    return null;
  };

  // 1. Direct JSON object at top level
  if (trimmed.startsWith("{")) {
    const result = tryParse(trimmed);
    if (result) return result;
  }

  // 2. Markdown code block (```json ... ``` or ``` ... ```)
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    const result = tryParse(codeBlock[1]);
    if (result) return result;
  }

  // 3. Inline JSON — find the first { that contains "tool" and parse greedily
  const jsonStart = trimmed.indexOf("{");
  if (jsonStart !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = jsonStart; i < trimmed.length; i++) {
      if (trimmed[i] === "{") depth++;
      else if (trimmed[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== -1) {
      const result = tryParse(trimmed.slice(jsonStart, end + 1));
      if (result) return result;
    }
  }

  return null;
}

/**
 * Format conversation history as plain text for inclusion in the system prompt.
 * Skips tool messages and empty content. Used by Chrome AI since it has no
 * native multi-turn history API that handles assistant-first or tool messages.
 */
function formatHistoryAsText(historyMessages: ApiMessage[]): string {
  const lines: string[] = [];
  for (const m of historyMessages) {
    if (!m.content) continue;
    if (m.role === "user") lines.push(`User: ${m.content}`);
    else if (m.role === "assistant") lines.push(`Assistant: ${m.content}`);
    // skip system/tool roles — they don't format nicely as chat history
  }
  return lines.join("\n\n");
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
        if (result === "downloadable" || result === "downloading") return "downloading";
        return "unavailable";
      }

      // Old API (Chrome 128-147)
      if (hasOldAPI()) {
        const api = (window as any).ai.languageModel as OldChromeAI;
        const result = await api.capabilities();
        const avail =
          typeof result === "object" ? (result as { available: string }).available : result;
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
    tools: ToolDefinition[],
    signal: AbortSignal,
    onDelta: (delta: StreamDelta) => void,
  ): Promise<void> {
    // ── Build system prompt ──────────────────────────────────────────────────
    // Chrome AI has no native tool calling and no reliable multi-turn history
    // support. We bake EVERYTHING — system context, tool descriptions, and
    // prior conversation history — into a single systemPrompt string.
    //
    // DO NOT use initialPrompts for history: Chrome AI requires alternating
    // user/assistant turns and will hang or throw if the pattern is invalid
    // (e.g. assistant-first, which happens when the welcome message is the
    // only prior message). systemPrompt is safe for any content.

    const sys = messages.find((m) => m.role === "system")?.content ?? "";
    const chatMessages = messages.filter((m) => m.role !== "system");

    // Tool descriptions injected into system prompt
    const toolDesc =
      tools.length > 0
        ? `\n\nAvailable tools — when you need data, respond ONLY with a JSON object:\n` +
          `Format: {"tool": "<name>", "args": {<arguments>}}\n` +
          tools.map((t) => `- ${t.name}: ${t.description}`).join("\n") +
          `\n\nIf no tool is needed, respond in plain text. Never mix JSON and prose.`
        : "";

    // Prior conversation history as formatted text
    const historyMessages = chatMessages.slice(0, -1);
    const historyText = formatHistoryAsText(historyMessages);

    const systemPrompt = [
      sys + toolDesc,
      historyText ? `\n\nConversation so far:\n${historyText}` : "",
    ]
      .filter(Boolean)
      .join("");

    // Current user query (the last message)
    const latestMsg = chatMessages[chatMessages.length - 1];
    const currentUserContent =
      latestMsg?.role === "user" && latestMsg.content ? (latestMsg.content as string) : "Hello";

    if (!hasNewAPI() && !hasOldAPI()) {
      onDelta({ content: "⚠️ Chrome AI is not available in this browser.", done: true });
      return;
    }

    try {
      let session: ChromeAISession | OldChromeAISession;

      if (hasNewAPI()) {
        // Chrome 148+ — use systemPrompt only (never initialPrompts for history)
        session = await (window as any).LanguageModel.create({
          systemPrompt: systemPrompt || undefined,
          signal,
        });
      } else {
        // Chrome 128-147 old API
        const api = (window as any).ai.languageModel as OldChromeAI;
        session = await api.create({
          systemPrompt: systemPrompt || undefined,
          signal,
        });
      }

      if (signal.aborted) {
        session.destroy();
        onDelta({ done: true });
        return;
      }

      // ── Stream response ────────────────────────────────────────────────────
      // Chrome AI's promptStreaming yields CUMULATIVE text on each chunk
      // (the full response built so far), not incremental deltas.
      // We compute true deltas by tracking how much we've already emitted.
      const stream = session.promptStreaming(currentUserContent);
      const reader = stream.getReader();

      let fullText = "";
      let lastEmittedLen = 0;

      try {
        while (true) {
          if (signal.aborted) break;
          const { done, value } = await reader.read();
          if (done) break;

          // Cumulative text so far
          fullText = typeof value === "string" ? value : new TextDecoder().decode(value);

          // When not waiting for a potential tool call JSON, emit incremental
          // deltas in real time so the user sees streaming progress.
          // For tool-capable calls we buffer until the stream ends, then
          // decide whether it's a JSON tool call or plain text.
          if (tools.length === 0 && fullText.length > lastEmittedLen) {
            const increment = fullText.slice(lastEmittedLen);
            onDelta({ content: increment, done: false });
            lastEmittedLen = fullText.length;
          }
        }
      } finally {
        reader.releaseLock();
        session.destroy();
      }

      if (signal.aborted) {
        onDelta({ done: true });
        return;
      }

      // ── Dispatch result ────────────────────────────────────────────────────
      if (tools.length > 0) {
        // Check if output is a JSON tool call
        const toolCall = extractJsonToolCall(fullText);
        if (toolCall) {
          onDelta({
            toolCallId: `chrome-${Date.now()}`,
            toolCallName: toolCall.tool,
            toolCallArgsChunk: JSON.stringify(toolCall.args),
            done: false,
          });
          onDelta({ done: true });
          return;
        }

        // Not a tool call — emit as plain text content
        if (fullText) onDelta({ content: fullText, done: false });
      } else {
        // No tools — any remaining content not yet emitted (shouldn't normally happen)
        if (fullText.length > lastEmittedLen) {
          onDelta({ content: fullText.slice(lastEmittedLen), done: false });
        }
      }

      onDelta({ done: true });
    } catch (err: unknown) {
      if (signal.aborted) {
        onDelta({ done: true });
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
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

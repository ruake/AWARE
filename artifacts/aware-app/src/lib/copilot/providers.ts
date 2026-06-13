import type { IProvider, ProviderStatus, ProviderType, ApiMessage, ToolDefinition, StreamDelta } from "./types";
import { loadOpenAIConfig } from "./storage";

// ── WebLLM Provider (PRIMARY) ────────────────────────────────────────────────
// Llama-3.2-3B-Instruct running locally via WebGPU.
// Downloads ~2 GB on first use, cached in IndexedDB thereafter.
// Supports full OpenAI-compatible tool calling + streaming.

const WEBLLM_MODEL = "Llama-3.2-3B-Instruct-q4f32_1-MLC";

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

    const streamResp = await engine.chat.completions.create({
      messages,
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
          onDelta({ toolCallId: a.id, toolCallName: a.name, toolCallArgsChunk: a.args, done: false });
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
      onDelta({ content: "⚠️ No OpenAI API key — open **Settings** (top right) to add one.", done: true });
      return;
    }

    const toolDefs =
      tools.length > 0
        ? tools.map((t) => ({
            type: "function" as const,
            function: { name: t.name, description: t.description, parameters: t.parameters },
          }))
        : undefined;

    const resp = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        messages,
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
          } else if (reason && reason !== "null" && reason !== "stop") {
            onDelta({ done: true });
          } else if (reason === "stop") {
            onDelta({ done: true });
          }
        } catch { /* skip malformed SSE chunks */ }
      }
    }
  }
}

// ── Chrome AI Provider (SECONDARY) ──────────────────────────────────────────
// Gemini Nano via window.LanguageModel (Chrome 148+, on-device, no key).
// No native tool calling — we describe tools in the prompt and parse JSON.

declare global {
  interface Window {
    ai?: { languageModel?: ChromeAIInterface };
    LanguageModel?: ChromeAIInterface;
  }
}

interface ChromeAIInterface {
  availability?(): Promise<string>;
  create(opts: { systemPrompt?: string }): Promise<{
    promptStreaming(prompt: string): ReadableStream<string>;
    destroy(): void;
  }>;
}

function getChromeAI(): ChromeAIInterface | null {
  return window.LanguageModel ?? window.ai?.languageModel ?? null;
}

export class ChromeProvider implements IProvider {
  readonly type: ProviderType = "chrome";

  async checkAvailability(): Promise<ProviderStatus> {
    const api = getChromeAI();
    if (!api) return "unavailable";
    try {
      const avail = await api.availability?.();
      if (avail === "readily") return "available";
      if (avail === "after-download") return "downloading";
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
    const api = getChromeAI();
    if (!api) throw new Error("Chrome AI (window.LanguageModel) not available in this browser");

    const sys = messages.find((m) => m.role === "system")?.content ?? "";
    const history = messages.filter((m) => m.role !== "system");
    const userMsg = history[history.length - 1]?.content ?? "";

    // Describe tools in the system prompt (Chrome AI has no native tool calling)
    const toolDesc =
      tools.length > 0
        ? `\n\nAvailable tools (respond with JSON {tool, args} to call one):\n` +
          tools.map((t) => `- ${t.name}: ${t.description}`).join("\n")
        : "";

    const session = await api.create({ systemPrompt: sys + toolDesc });
    const stream = session.promptStreaming(userMsg);
    const reader = stream.getReader();
    let prev = "";

    try {
      while (true) {
        if (signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;
        // Chrome AI returns cumulative text — compute the delta
        const newText = (value ?? "").slice(prev.length);
        if (newText) onDelta({ content: newText, done: false });
        prev = value ?? "";
      }
    } finally {
      reader.releaseLock();
      session.destroy();
    }
    onDelta({ done: true });
  }
}

// ── Provider Registry ────────────────────────────────────────────────────────
export function createProvider(type: ProviderType): IProvider {
  switch (type) {
    case "webllm": return new WebLLMProvider();
    case "openai": return new OpenAIProvider();
    case "chrome": return new ChromeProvider();
  }
}

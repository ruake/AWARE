import type {
  LLMConfig,
  LLMProviderType,
  LLMMessage,
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMSkillDefinition,
} from "./types";
import { DEFAULT_LLM_CONFIG } from "./types";

// ── Provider Interface ───────────────────────────────────────────────

export interface ILLMProvider {
  readonly type: LLMProviderType;
  complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse>;
  stream?(
    req: LLMCompletionRequest,
    onChunk: (text: string) => void,
  ): Promise<LLMCompletionResponse>;
  testConnection(): Promise<boolean>;
}

// ── Custom Endpoint Provider (any OpenAI-compatible server) ─────────
// Works with Ollama, LM Studio, Mistral, vLLM, llama.cpp, etc.
// Requires apiUrl to be set; apiKey is optional (some servers don't need it).

class CustomEndpointLLMProvider implements ILLMProvider {
  readonly type: LLMProviderType = "custom";

  constructor(private config: LLMConfig) {}

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (!this.config.apiUrl) {
      return {
        content:
          "No endpoint configured. Click **⚙ Configure** above to set your API URL.\n\nWorks with any OpenAI-compatible server: Ollama, LM Studio, Mistral, vLLM, etc.",
        finishReason: "error",
      };
    }
    try {
      const url = `${this.config.apiUrl.replace(/\/$/, "")}/chat/completions`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (this.config.apiKey) headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: this.config.model || undefined,
          messages: req.messages,
          temperature: req.temperature ?? this.config.temperature,
          max_tokens: req.maxTokens ?? this.config.maxTokens,
          stream: false,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        return {
          content: `Endpoint error ${res.status}: ${text}\n\nCheck your API URL and model name in **⚙ Configure**.`,
          finishReason: "error",
        };
      }
      const data = await res.json();
      const choice = data.choices?.[0];
      return {
        content: choice?.message?.content ?? "",
        finishReason: choice?.finish_reason === "stop" ? "stop" : "length",
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        content: `Network error: ${msg}\n\nCheck your API URL in **⚙ Configure**.`,
        finishReason: "error",
      };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config.apiUrl) return false;
    try {
      const result = await this.complete({
        messages: [{ role: "user", content: "ping" }],
        maxTokens: 1,
      });
      return result.finishReason !== "error";
    } catch {
      return false;
    }
  }
}

// ── WebLLM Provider (requires @mlc-ai/web-llm package + WebGPU) ─────

const _webLlmProgressCallback: ((progress: number, text: string) => void) | null = null;

export async function checkWebLLM(): Promise<boolean> {
  try {
    const nav = navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown | null> } };
    if (!nav.gpu) return false;
    const adapter = await nav.gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

class WebLLMProvider implements ILLMProvider {
  readonly type: LLMProviderType = "webllm";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private engine: any = null;
  private _initPromise: Promise<void> | null = null;

  constructor(private config: LLMConfig) {}

  // WebLLM uses its own model catalog — the shared config.model is for OpenAI/Chrome
  private get _webllmModel(): string {
    const m = this.config.model || "";
    // Only use config.model if it looks like a WebLLM model ID (contains "-MLC" or "MLC-")
    if (m.includes("-MLC") || m.includes("MLC-")) return m;
    return "Llama-3.2-1B-Instruct-q4f32_1-MLC";
  }

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const avail = await checkWebLLM();
    if (!avail) {
      return {
        content:
          "WebLLM requires WebGPU support (Chrome 113+). Your browser doesn't support it.\n\nClick **⚙ Configure** above to use a Custom Endpoint instead.",
        finishReason: "error",
      };
    }
    try {
      if (!this.engine) {
        if (!this._initPromise) this._initPromise = this._init();
        await this._initPromise;
      }
      const res = await this.engine.chat.completions.create({
        messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: req.temperature ?? this.config.temperature,
        max_tokens: req.maxTokens ?? this.config.maxTokens,
      });
      const choice = res.choices?.[0];
      return {
        content: choice?.message?.content ?? "",
        finishReason: choice?.finish_reason === "stop" ? "stop" : "length",
      };
    } catch (err) {
      this.engine = null;
      this._initPromise = null;
      const msg = err instanceof Error ? err.message : String(err);
      return {
        content: `WebLLM failed to load model "${this._webllmModel}": ${msg}\n\nClick **⚙ Configure** above to use a Custom Endpoint instead.`,
        finishReason: "error",
      };
    }
  }

  private async _init() {
    const mod = await import("@mlc-ai/web-llm");
    this.engine = await mod.CreateMLCEngine(this._webllmModel, {
      initProgressCallback: (report: { progress: number; text: string }) => {
        if (_webLlmProgressCallback) {
          _webLlmProgressCallback(report.progress, report.text);
        }
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const avail = await checkWebLLM();
      if (!avail) return false;
      if (!this.engine) await this._init();
      return this.engine !== null;
    } catch {
      this.engine = null;
      this._initPromise = null;
      return false;
    }
  }
}

// ── Chrome Built-in AI Provider (LanguageModel API, Chrome 148+) ────

const _chromeAIProgressCallback: ((progress: number, text: string) => void) | null = null;

export async function checkChromeAI(): Promise<boolean> {
  try {
    if (!("LanguageModel" in self)) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const availability: string = await (self as any).LanguageModel.availability();
    return availability !== "unavailable";
  } catch {
    return false;
  }
}

export async function getChromeAIStatus(): Promise<"available" | "downloading" | "unavailable"> {
  try {
    if (!("LanguageModel" in self)) return "unavailable";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const availability: string = await (self as any).LanguageModel.availability();
    if (availability === "available") return "available";
    if (availability === "downloading" || availability === "after-download") return "downloading";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

class ChromeBuiltinLLMProvider implements ILLMProvider {
  readonly type: LLMProviderType = "chrome";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private session: any = null;
  private _initPromise: Promise<void> | null = null;

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const avail = await checkChromeAI();
    if (!avail) {
      return {
        content:
          "Chrome Built-in AI is not available. This requires Chrome 148+ on desktop with Gemini Nano enabled.\n\nTo enable:\n1. Go to chrome://flags/#optimization-guide-on-device-model → Enabled\n2. Go to chrome://flags/#prompt-api-for-gemini-nano → Enabled\n3. Restart Chrome\n4. Visit chrome://on-device-internals to check model download status",
        finishReason: "error",
      };
    }
    if (!this.session) {
      if (!this._initPromise) this._initPromise = this._init();
      await this._initPromise;
    }

    const systemMsg = req.messages.find((m) => m.role === "system");
    const nonSystem = req.messages.filter((m) => m.role !== "system");
    const userMessages = nonSystem.map((m) => m.content).join("\n");
    const fullPrompt = systemMsg
      ? `[System Instructions]\n${systemMsg.content}\n\n[Conversation]\n${userMessages}`
      : userMessages;

    try {
      const result = await this.session.prompt(fullPrompt);
      return {
        content: result,
        finishReason: "stop",
      };
    } catch (err) {
      return {
        content: `Chrome AI error: ${err instanceof Error ? err.message : "Unknown error"}`,
        finishReason: "error",
      };
    }
  }

  private async _init() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.session = await (self as any).LanguageModel.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      monitor: (m: any) => {
        if (_chromeAIProgressCallback) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          m.addEventListener("downloadprogress", (e: any) => {
            _chromeAIProgressCallback!(e.loaded, `Downloading Gemini Nano model...`);
          });
        }
      },
    });
  }

  async testConnection(): Promise<boolean> {
    return checkChromeAI();
  }
}

// ── Singleton Service ───────────────────────────────────────────────

const LS_LLM_CONFIG_KEY = "aware_llm_config_v1";

function _loadStoredConfig(): Partial<LLMConfig> {
  try {
    const raw = localStorage.getItem(LS_LLM_CONFIG_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<LLMConfig>;
  } catch {
    return {};
  }
}

function _saveConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(LS_LLM_CONFIG_KEY, JSON.stringify(config));
  } catch {
    /* storage full or unavailable */
  }
}

function _resolveInitialConfig(): LLMConfig {
  const stored = _loadStoredConfig();
  return {
    provider:
      (import.meta.env.VITE_LLM_PROVIDER as LLMProviderType) ||
      stored.provider ||
      DEFAULT_LLM_CONFIG.provider,
    apiKey: import.meta.env.VITE_LLM_API_KEY || stored.apiKey || "",
    apiUrl: import.meta.env.VITE_LLM_API_URL || stored.apiUrl || "",
    model: import.meta.env.VITE_LLM_MODEL || stored.model || DEFAULT_LLM_CONFIG.model,
    temperature: stored.temperature ?? DEFAULT_LLM_CONFIG.temperature,
    maxTokens: stored.maxTokens ?? DEFAULT_LLM_CONFIG.maxTokens,
  };
}

let _config: LLMConfig = _resolveInitialConfig();
let _provider: ILLMProvider = _buildProvider(_config);
let _chatHistory: { role: "system" | "user" | "assistant"; content: string }[] = [];
let _skills: LLMSkillDefinition[] = [];

export function registerSkills(skills: LLMSkillDefinition[]): void {
  _skills = skills;
}

export function getRegisteredSkills(): LLMSkillDefinition[] {
  return _skills;
}

export function getLLMConfig(): LLMConfig {
  return { ..._config };
}

export function setLLMConfig(config: Partial<LLMConfig>): LLMConfig {
  _config = { ..._config, ...config };
  _provider = _buildProvider(_config);
  _saveConfig(_config);
  return getLLMConfig();
}

function _buildProvider(config: LLMConfig): ILLMProvider {
  switch (config.provider) {
    case "custom":
      return new CustomEndpointLLMProvider(config);
    case "webllm":
      return new WebLLMProvider(config);
    case "chrome":
      return new ChromeBuiltinLLMProvider();
    default:
      return new CustomEndpointLLMProvider(config);
  }
}

export function getProvider(): ILLMProvider {
  return _provider;
}

export async function llmComplete(
  messages: LLMMessage[],
  opts?: { temperature?: number; maxTokens?: number },
): Promise<LLMCompletionResponse> {
  return _provider.complete({
    messages,
    temperature: opts?.temperature ?? _config.temperature,
    maxTokens: opts?.maxTokens ?? _config.maxTokens,
  });
}

export async function llmChat(
  message: string,
  skillSystemPrompt?: string,
): Promise<LLMCompletionResponse> {
  const messages: LLMMessage[] = [];
  if (skillSystemPrompt) {
    messages.push({ role: "system", content: skillSystemPrompt });
  }
  messages.push(..._chatHistory.slice(-10));
  messages.push({ role: "user", content: message });
  const res = await _provider.complete({
    messages,
    temperature: _config.temperature,
    maxTokens: _config.maxTokens,
  });
  _chatHistory.push({ role: "user", content: message });
  _chatHistory.push({ role: "assistant", content: res.content });
  if (_chatHistory.length > 50) {
    _chatHistory = _chatHistory.slice(-50);
  }
  return res;
}

export function clearChatHistory(): void {
  _chatHistory = [];
}

// ── Context Window Helpers ──────────────────────────────────────────

/** Rough token estimate: ~4 chars per token for English text */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Context window sizes per provider type */
export function getContextWindow(providerType?: LLMProviderType): number {
  switch (providerType || _config.provider) {
    case "webllm":
      return 4096;
    case "chrome":
      return 8192;
    case "custom":
    default:
      return 128000;
  }
}

/**
 * Truncate conversation messages to fit within the model's context window.
 * Keeps system message(s) and the newest user/assistant exchanges, dropping
 * the oldest non-system messages first. Returns a new array (does not mutate).
 */
export function truncateMessagesToFit(
  messages: LLMMessage[],
  maxContextTokens?: number,
  safetyMargin: number = 600,
): LLMMessage[] {
  const maxTokens = maxContextTokens ?? getContextWindow();
  const maxPrompt = maxTokens - safetyMargin;

  // Estimate total — fast path: already fits
  const total = messages.reduce((s, m) => s + estimateTokenCount(m.content), 0);
  if (total <= maxPrompt) return messages;

  // Separate system vs non-system
  const systemMsgs = messages.filter((m) => m.role === "system");
  const nonSystem = messages.filter((m) => m.role !== "system");

  const systemTokens = systemMsgs.reduce((s, m) => s + estimateTokenCount(m.content), 0);
  let available = maxPrompt - systemTokens;
  if (available <= 0) {
    // System prompt alone exceeds budget — return system messages only
    return systemMsgs;
  }

  // Keep newest messages first (iterate from end, keep dropping oldest)
  const kept: LLMMessage[] = [];
  for (let i = nonSystem.length - 1; i >= 0; i--) {
    const mt = estimateTokenCount(nonSystem[i].content);
    if (available - mt >= 0) {
      kept.unshift(nonSystem[i]);
      available -= mt;
    }
  }

  return [...systemMsgs, ...kept];
}

export function syncChatHistory(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): void {
  _chatHistory = messages.slice(-50);
}

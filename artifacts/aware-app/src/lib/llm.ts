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

// ── OpenAI-Compatible Provider ──────────────────────────────────────

class OpenAILLMProvider implements ILLMProvider {
  readonly type: LLMProviderType = "openai";

  constructor(private config: LLMConfig) {}

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (!this.config.apiKey) {
      return {
        content:
          "No API key configured. Click **⚙ Configure** above to enter your OpenAI API key.",
        finishReason: "error",
      };
    }
    try {
      const url = this.config.apiUrl ?? "https://api.openai.com/v1/chat/completions";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: req.messages,
          temperature: req.temperature ?? this.config.temperature,
          max_tokens: req.maxTokens ?? this.config.maxTokens,
          stream: false,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        return {
          content: `API error ${res.status}: ${text}\n\nCheck your API key and model name in **⚙ Configure**.`,
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
    if (!this.config.apiKey) return false;
    try {
      const result = await this.complete({ messages: [{ role: "user", content: "ping" }], maxTokens: 1 });
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
          "WebLLM requires WebGPU support (Chrome 113+). Your browser doesn't support it.\n\nClick **⚙ Configure** above to use OpenAI or another API instead.",
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
        content: `WebLLM failed to load model "${this._webllmModel}": ${msg}\n\nClick **⚙ Configure** above to use OpenAI or another API instead.`,
        finishReason: "error",
      };
    }
  }

  private async _init() {
    const mod = await import("@mlc-ai/web-llm");
    this.engine = await mod.CreateMLCEngine(
      this._webllmModel,
      {
        initProgressCallback: (report: { progress: number; text: string }) => {
          if (_webLlmProgressCallback) {
            _webLlmProgressCallback(report.progress, report.text);
          }
        },
      },
    );
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
    provider: (import.meta.env.VITE_LLM_PROVIDER as LLMProviderType) || stored.provider || DEFAULT_LLM_CONFIG.provider,
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
    case "openai":
      return new OpenAILLMProvider(config);
    case "webllm":
      return new WebLLMProvider(config);
    case "chrome":
      return new ChromeBuiltinLLMProvider();
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
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

export function syncChatHistory(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): void {
  _chatHistory = messages.slice(-50);
}

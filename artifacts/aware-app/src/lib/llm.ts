import type { LLMConfig } from "@/lib/types";
import type { ProviderConfig } from "@/lib/providers";

const DEFAULT_CONFIG: LLMConfig = {
  provider: "chrome",
  model: "gemini-nano",
  temperature: 0.7,
  maxTokens: 2048,
};

let _config: LLMConfig = { ...DEFAULT_CONFIG };

export function getLLMConfig(): LLMConfig {
  return _config;
}

export function setLLMConfig(partial: Partial<LLMConfig>): LLMConfig {
  _config = { ..._config, ...partial };
  return _config;
}

export function resetLLMConfig(): void {
  _config = { ...DEFAULT_CONFIG };
}

function getEndpoint(provider: string, config: ProviderConfig): string {
  switch (provider) {
    case "openai":
      return config.endpoint || "https://api.openai.com/v1/chat/completions";
    case "webllm":
      return "webllm://local";
    case "chrome":
      return "chrome-ai://local";
    default:
      return "https://api.openai.com/v1/chat/completions";
  }
}

async function callOpenAI(
  prompt: string,
  config: LLMConfig,
  providerConfig: ProviderConfig,
): Promise<string> {
  if (!providerConfig.apiKey) {
    return "OpenAI API key not configured. Please set your API key in settings.";
  }
  return `[OpenAI ${config.model}]: ${prompt}`;
}

async function callWebLLM(prompt: string, config: LLMConfig): Promise<string> {
  return `[WebLLM ${config.model}]: ${prompt}`;
}

async function callChromeAI(prompt: string, config: LLMConfig): Promise<string> {
  return `[Chrome AI ${config.model}]: ${prompt}`;
}

export function getProvider(config?: LLMConfig): { complete: (prompt: string) => Promise<string> } {
  const cfg = config || _config;
  const provider = cfg.provider;

  return {
    complete: async (prompt: string): Promise<string> => {
      switch (provider) {
        case "openai": {
          const { getProviderConfig } = await import("@/lib/providers");
          return callOpenAI(prompt, cfg, getProviderConfig());
        }
        case "webllm":
          return callWebLLM(prompt, cfg);
        case "chrome":
          return callChromeAI(prompt, cfg);
        default:
          return `Echo: ${prompt}`;
      }
    },
  };
}

export function clearChatHistory(): void {
  localStorage.removeItem("aware-chat-history");
}

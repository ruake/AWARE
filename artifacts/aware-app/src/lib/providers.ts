export type LLMProvider = 'openai' | 'webllm' | 'chrome';

export interface ProviderConfig {
  provider: LLMProvider;
  apiKey?: string;
  model?: string;
  endpoint?: string;
}

const STORAGE_KEY = 'aware-llm-config';

export function getProviderConfig(): ProviderConfig {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return { provider: 'openai', model: 'gpt-4o-mini' };
  }
}

export function saveProviderConfig(config: ProviderConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

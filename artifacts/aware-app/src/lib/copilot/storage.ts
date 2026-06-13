import type { Message, ProviderType } from "./types";

const STORAGE_KEY = "aware_copilot_v4";
const MAX_STORED = 100;

interface StoredSession {
  messages: Message[];
  providerType: ProviderType;
  savedAt: number;
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(messages: Message[], providerType: ProviderType): void {
  try {
    const trimmed = messages.slice(-MAX_STORED);
    const session: StoredSession = { messages: trimmed, providerType, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* quota exceeded — silently skip */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* empty */
  }
}

export function loadProviderType(): ProviderType {
  try {
    const raw = localStorage.getItem("aware_copilot_provider_v1");
    if (raw === "webllm" || raw === "openai" || raw === "chrome") return raw;
  } catch {
    /* empty */
  }
  return "chrome";
}

export function saveProviderType(type: ProviderType): void {
  try {
    localStorage.setItem("aware_copilot_provider_v1", type);
  } catch {
    /* empty */
  }
}

export function loadOpenAIConfig(): { apiKey: string; apiUrl: string; model: string } {
  try {
    const raw = localStorage.getItem("aware_openai_config_v1");
    if (raw) return JSON.parse(raw);
  } catch {
    /* empty */
  }
  return { apiKey: "", apiUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" };
}

export function saveOpenAIConfig(cfg: { apiKey: string; apiUrl: string; model: string }): void {
  try {
    localStorage.setItem("aware_openai_config_v1", JSON.stringify(cfg));
  } catch {
    /* empty */
  }
}

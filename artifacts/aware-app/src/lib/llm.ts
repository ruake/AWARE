// Legacy layer — Chrome AI helpers + backward-compat stubs for old imports
import type { LLMConfig, LLMProviderType, LLMMessage, LLMSkillDefinition } from "./types";
import { DEFAULT_LLM_CONFIG } from "./types";
import { ChromeProvider } from "./copilot/providers";

// ── Chrome AI availability ────────────────────────────────────────────────────
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

// ── Backward-compat provider stubs ────────────────────────────────────────────
// These are called by legacy ai/analyzer.ts and ai/langGraph.ts imports.

let _provider: ChromeProvider | null = null;

export interface ILLMProvider {
  complete(req: { messages: LLMMessage[]; temperature?: number; maxTokens?: number }): Promise<{ content: string; finishReason: string }>;
}

/** Returns a Chrome-AI-backed provider with the legacy complete() interface. */
export function getProvider(): ILLMProvider {
  if (!_provider) _provider = new ChromeProvider();
  return {
    async complete(req) {
      // Use Chrome AI via promptStreaming to gather the full response
      const msgs = req.messages;
      const lastUser = [...msgs].reverse().find((m) => m.role === "user");
      const systemMsg = msgs.find((m) => m.role === "system");
      const userText = typeof lastUser?.content === "string" ? lastUser.content : "";
      const sysText = typeof systemMsg?.content === "string" ? systemMsg.content : "";

      try {
        const api = (window as { LanguageModel?: { create: (o: unknown) => Promise<{ promptStreaming: (p: string) => ReadableStream }> } }).LanguageModel;
        if (!api) return { content: "Chrome AI is not available in this browser.", finishReason: "error" };
        const session = await api.create({ systemPrompt: sysText });
        const stream = session.promptStreaming(userText);
        const reader = stream.getReader();
        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = typeof value === "string" ? value : "";
          fullText = text; // Chrome AI streams cumulative text
        }
        reader.releaseLock();
        return { content: fullText.trim(), finishReason: "stop" };
      } catch (err) {
        return { content: `Chrome AI error: ${String(err)}`, finishReason: "error" };
      }
    },
  };
}

/** Returns the active LLM config (Chrome AI only). */
export function getLLMConfig(): LLMConfig {
  return { ...DEFAULT_LLM_CONFIG };
}

/** Rough token estimator: 1 token ≈ 4 chars. */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncates messages to fit within the Chrome AI context window.
 * Chrome AI (Gemini Nano) has ~4096 token context; we budget ~2796 for history.
 */
export function truncateMessagesToFit(messages: LLMMessage[]): LLMMessage[] {
  const MAX_CHARS = 10_000; // ~2500 tokens, conservative for Gemini Nano
  let total = 0;
  const result: LLMMessage[] = [];
  // Always include the most recent messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const len = JSON.stringify(messages[i]).length;
    if (total + len > MAX_CHARS && result.length > 0) break;
    result.unshift(messages[i]);
    total += len;
  }
  return result;
}

// ── Skill registry stub ───────────────────────────────────────────────────────
const _skills: LLMSkillDefinition[] = [];

export function registerSkills(skills: LLMSkillDefinition[]): void {
  for (const s of skills) {
    if (!_skills.find((x) => x.id === s.id)) _skills.push(s);
  }
}

export function getRegisteredSkills(): LLMSkillDefinition[] {
  return _skills;
}

// ── Re-export types for legacy imports ────────────────────────────────────────
export type { LLMConfig, LLMProviderType, LLMMessage, LLMSkillDefinition };

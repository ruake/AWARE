import type { LLMChatMessage } from "./types";

const STORAGE_KEY = "aware_copilot_chat";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function saveChatMessages(messages: LLMChatMessage[]): void {
  try {
    const now = Date.now();
    const pruned = messages.filter(m => now - (m.timestamp ?? now) < MAX_AGE_MS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch { /* storage full or unavailable */ }
}

export function loadChatMessages(): LLMChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const messages: LLMChatMessage[] = JSON.parse(raw);
    const now = Date.now();
    return messages.filter(m => now - (m.timestamp ?? now) < MAX_AGE_MS);
  } catch {
    return [];
  }
}

export function clearChatMessages(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "aware-chat-threads";

export function getThreads(): ChatThread[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveThread(thread: ChatThread): void {
  const threads = getThreads().filter((t) => t.id !== thread.id);
  threads.push({ ...thread, updatedAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function deleteThread(id: string): void {
  const threads = getThreads().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function createThread(title?: string): ChatThread {
  return {
    id: crypto.randomUUID(),
    title: title || "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

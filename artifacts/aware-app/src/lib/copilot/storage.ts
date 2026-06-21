import type {
  Message,
  ProviderType,
  Thread,
  PromptTemplate,
  Bookmark,
  CopilotSettings,
} from "./types";

// ── Session (current active thread) ─────────────────────────────────────────
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
    if (raw === "webllm" || raw === "chrome" || raw === "custom") return raw;
    if (raw === "openai") return "custom";
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

export function loadCustomEndpointConfig(): { apiKey: string; apiUrl: string; model: string } {
  try {
    const raw =
      localStorage.getItem("aware_custom_endpoint_v1") ||
      localStorage.getItem("aware_openai_config_v1");
    if (raw) {
      const parsed = JSON.parse(raw) as { apiKey?: string; apiUrl?: string; model?: string };
      return {
        apiKey: parsed.apiKey ?? "",
        apiUrl: parsed.apiUrl && parsed.apiUrl !== "https://api.openai.com/v1" ? parsed.apiUrl : "",
        model: parsed.model ?? "",
      };
    }
  } catch {
    /* empty */
  }
  return { apiKey: "", apiUrl: "", model: "" };
}

export function saveCustomEndpointConfig(cfg: {
  apiKey: string;
  apiUrl: string;
  model: string;
}): void {
  try {
    localStorage.setItem("aware_custom_endpoint_v1", JSON.stringify(cfg));
  } catch {
    /* empty */
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPGRADE: Threads, Templates, Bookmarks, Settings
// ═══════════════════════════════════════════════════════════════════════════════

// ── Thread Manager ───────────────────────────────────────────────────────────
const THREADS_KEY = "aware_copilot_threads_v1";
const ACTIVE_THREAD_KEY = "aware_copilot_active_thread_v1";

export function loadThreads(): Thread[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Thread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveThreads(threads: Thread[]): void {
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  } catch {
    /* quota exceeded */
  }
}

export function getActiveThreadId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_THREAD_KEY);
  } catch {
    return null;
  }
}

export function setActiveThreadId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_THREAD_KEY, id);
    else localStorage.removeItem(ACTIVE_THREAD_KEY);
  } catch {
    /* empty */
  }
}

export function createThread(
  title: string,
  messages?: Message[],
  providerType?: ProviderType,
): Thread {
  const now = Date.now();
  return {
    id: `thread_${now}_${crypto.randomUUID().slice(0, 8)}`,
    title,
    messages: messages ?? [],
    createdAt: now,
    updatedAt: now,
    messageCount: messages?.length ?? 0,
    providerType,
  };
}

export function updateThreadInList(
  threads: Thread[],
  threadId: string,
  patch: Partial<Thread>,
): Thread[] {
  return threads.map((t) => (t.id === threadId ? { ...t, ...patch, updatedAt: Date.now() } : t));
}

export function deleteThreadFromList(threads: Thread[], threadId: string): Thread[] {
  return threads.filter((t) => t.id !== threadId);
}

// ── Prompt Templates ─────────────────────────────────────────────────────────
const TEMPLATES_KEY = "aware_copilot_templates_v1";

const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: "tmpl_failure_analysis",
    name: "Failure Analysis",
    content:
      "Analyze the test failures in the latest run. Group by category, identify patterns, and suggest root causes.",
    category: "analysis",
    icon: "🔍",
    description: "Deep dive into test failures with category grouping and root cause analysis",
    pinned: true,
    createdAt: Date.now(),
  },
  {
    id: "tmpl_flaky_detection",
    name: "Flaky Test Detection",
    content:
      "Find tests that flip between PASS and FAIL across recent runs. Rank by flakiness score and show flip sequences.",
    category: "analysis",
    icon: "⚡",
    description: "Identify unstable tests with flakiness scoring",
    pinned: true,
    createdAt: Date.now(),
  },
  {
    id: "tmpl_env_compare",
    name: "Environment Comparison",
    content:
      "Compare QA, UAT, and PROD environments. Show avg pass rates, total failures, and health status for each.",
    category: "analysis",
    icon: "🔀",
    description: "Cross-environment health comparison",
    pinned: true,
    createdAt: Date.now(),
  },
  {
    id: "tmpl_promotion_gate",
    name: "Promotion Gate Check",
    content:
      "Show UAT→PROD promotion gate status. How many decisions promoted, blocked, or pending? What's the block rate?",
    category: "deployment",
    icon: "🛡️",
    description: "Check deployment readiness and promotion history",
    pinned: true,
    createdAt: Date.now(),
  },
  {
    id: "tmpl_suite_health",
    name: "Suite Health Report",
    content:
      "Show pass rates and failure counts for all test suites. Which suites are below the 95% threshold?",
    category: "report",
    icon: "🧪",
    description: "Per-suite pass rate analysis",
    createdAt: Date.now(),
  },
  {
    id: "tmpl_duration_trends",
    name: "Duration Trends",
    content:
      "Show execution duration trends across the last 10 runs. Are there any timing regressions or slow tests?",
    category: "performance",
    icon: "⏱️",
    description: "Execution timing and regression analysis",
    createdAt: Date.now(),
  },
];

export function loadTemplates(): PromptTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) {
      saveTemplates(DEFAULT_TEMPLATES);
      return DEFAULT_TEMPLATES;
    }
    const parsed = JSON.parse(raw) as PromptTemplate[];
    return Array.isArray(parsed) ? parsed : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveTemplates(templates: PromptTemplate[]): void {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    /* empty */
  }
}

export function addTemplate(template: PromptTemplate): void {
  const existing = loadTemplates();
  saveTemplates([...existing, template]);
}

export function deleteTemplate(templateId: string): void {
  const existing = loadTemplates();
  saveTemplates(existing.filter((t) => t.id !== templateId));
}

// ── Bookmarks ───────────────────────────────────────────────────────────────
const BOOKMARKS_KEY = "aware_copilot_bookmarks_v1";

export function loadBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Bookmark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch {
    /* empty */
  }
}

export function addBookmark(bookmark: Bookmark): void {
  const existing = loadBookmarks();
  saveBookmarks([...existing, bookmark]);
}

export function removeBookmark(bookmarkId: string): void {
  const existing = loadBookmarks();
  saveBookmarks(existing.filter((b) => b.id !== bookmarkId));
}

// ── Settings ─────────────────────────────────────────────────────────────────
const SETTINGS_KEY = "aware_copilot_settings_v1";

export const DEFAULT_COPILOT_SETTINGS: CopilotSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: "",
  tone: "professional",
  contextWindow: 128000,
};

export function loadCopilotSettings(): CopilotSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_COPILOT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<CopilotSettings>;
    return { ...DEFAULT_COPILOT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_COPILOT_SETTINGS };
  }
}

export function saveCopilotSettings(settings: CopilotSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* empty */
  }
}

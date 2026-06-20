// ============================================================================
// Copilot Type System — State-of-the-Art LangGraph Edition
// ============================================================================

export type ProviderType = "webllm" | "openai" | "chrome";
export type ProviderStatus = "available" | "downloading" | "unavailable";

// ── Message (what appears in the feed) ──────────────────────────────────────
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  streaming?: boolean;
  toolCalls?: ToolCall[];
  graphNodes?: GraphNodeState[];
  error?: string;
}

// ── Tool Call (a single invocation within a message) ────────────────────────
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: "pending" | "running" | "done" | "error";
  result?: ToolResult;
  startedAt: number;
  completedAt?: number;
}

export interface ToolResult {
  data: unknown;
  chartData?: ChartData;
  tableData?: TableData;
}

// ── Chart Data ───────────────────────────────────────────────────────────────
export interface ChartData {
  type: "line" | "bar" | "column" | "pie";
  title: string;
  xKey: string;
  yKeys: string[];
  rows: Array<Record<string, string | number>>;
  colors?: string[];
}

// ── Table Data (AI-built structured tables rendered in chat) ─────────────────
export type TableColumnType = "text" | "number" | "percent" | "badge" | "duration" | "mono";
export type TableHighlight = "max" | "min" | "none";

export interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  type?: TableColumnType;
  highlight?: TableHighlight;
  width?: number;
  link?: (row: Record<string, string | number | null>) => string | null;
}

export interface TableData {
  title?: string;
  subtitle?: string;
  columns: TableColumn[];
  rows: Array<Record<string, string | number | null>>;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  maxHighlight?: string;
  minHighlight?: string;
  link?: string;
}

// ── LangGraph Node State (for live graph visualization) ──────────────────────
export type GraphNodeId = "classify" | "plan" | "execute" | "synthesize" | "done";
export type GraphNodeStatus = "pending" | "running" | "completed" | "error" | "skipped";

export interface GraphNodeState {
  id: GraphNodeId;
  label: string;
  status: GraphNodeStatus;
  detail?: string;
  startedAt?: number;
  completedAt?: number;
  toolNames?: string[];
}

// ── Tool Definition ──────────────────────────────────────────────────────────
export interface ToolDefinition {
  name: string;
  description: string;
  icon: string;
  color: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
  execute(args: Record<string, unknown>): Promise<ToolResult>;
}

// ── Streaming Delta ──────────────────────────────────────────────────────────
export interface StreamDelta {
  content?: string;
  toolCallId?: string;
  toolCallName?: string;
  toolCallArgsChunk?: string;
  done: boolean;
}

// ── API Message format (OpenAI-compatible) ───────────────────────────────────
export interface ApiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
}

// ── Provider Interface ───────────────────────────────────────────────────────
export interface IProvider {
  readonly type: ProviderType;
  readonly supportsToolCalling?: boolean;
  onLoadProgress?: (progress: number, text: string) => void;
  checkAvailability(): Promise<ProviderStatus>;
  stream(
    messages: ApiMessage[],
    tools: ToolDefinition[],
    signal: AbortSignal,
    onDelta: (delta: StreamDelta) => void,
  ): Promise<void>;
}

// ── Sub-Agent Step (for UI progress display) ─────────────────────────────────
export interface SubAgentStep {
  id: string;
  label: string;
  status: "running" | "completed" | "error" | "pending";
  detail?: string;
  duration?: number;
}

// ── Agent Events (emitted during a run) ──────────────────────────────────────
export type AgentEvent =
  | { type: "delta"; content: string }
  | { type: "tool_start"; toolCall: ToolCall }
  | { type: "tool_done"; toolCall: ToolCall }
  | { type: "step"; step: SubAgentStep }
  | { type: "graph_node"; node: GraphNodeState }
  | { type: "error"; error: string }
  | { type: "done" };

// ═══════════════════════════════════════════════════════════════════════════════
// UPGRADE: Threads, Templates, Bookmarks, Settings
// ═══════════════════════════════════════════════════════════════════════════════

// ── Thread ───────────────────────────────────────────────────────────────────
export interface Thread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  providerType?: ProviderType;
  settings?: Partial<CopilotSettings>;
  pinned?: boolean;
}

// ── Copilot Settings ─────────────────────────────────────────────────────────
export interface CopilotSettings {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tone: ToneOption;
  contextWindow: number;
}

export type ToneOption = "professional" | "concise" | "detailed" | "friendly" | "technical";

export const TONE_LABELS: Record<ToneOption, string> = {
  professional: "Professional",
  concise: "Concise",
  detailed: "Detailed",
  friendly: "Friendly",
  technical: "Technical",
};

export const TONE_DESCRIPTIONS: Record<ToneOption, string> = {
  professional: "Balanced, business-appropriate language",
  concise: "Short, direct answers with minimal context",
  detailed: "Thorough, comprehensive explanations",
  friendly: "Warm, conversational tone",
  technical: "Precise, jargon-rich responses",
};

// ── Prompt Template ──────────────────────────────────────────────────────────
export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  icon: string;
  description: string;
  pinned?: boolean;
  createdAt: number;
}

// ── Bookmark ─────────────────────────────────────────────────────────────────
export interface Bookmark {
  id: string;
  threadId: string;
  messageId: string;
  label: string;
  createdAt: number;
  contentPreview: string;
}

// ── Search Result ────────────────────────────────────────────────────────────
export interface SearchResult {
  messageId: string;
  threadId: string;
  threadTitle: string;
  content: string;
  matchPreview: string;
  role: "user" | "assistant";
  timestamp: number;
}

// ── Attachment ───────────────────────────────────────────────────────────────
export interface Attachment {
  id: string;
  name: string;
  type: "image" | "file" | "screenshot";
  data: string;
  mimeType: string;
  size: number;
}

// ── Export ───────────────────────────────────────────────────────────────────
export type ExportFormat = "json" | "markdown" | "text";

// ── Keyboard Shortcut ────────────────────────────────────────────────────────
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: string;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: "k", meta: true, description: "Command palette", action: "command-palette" },
  { key: "Enter", description: "Send message", action: "send" },
  { key: "Enter", shift: true, description: "New line", action: "newline" },
  { key: "n", meta: true, description: "New chat", action: "new-chat" },
  { key: "f", meta: true, description: "Search messages", action: "search" },
  { key: "Escape", description: "Close panel / cancel", action: "close" },
  { key: "s", meta: true, shift: true, description: "Save / export", action: "export" },
  { key: "ArrowUp", description: "Edit last message", action: "edit-last" },
  { key: "i", meta: true, description: "Toggle sidebar", action: "toggle-sidebar" },
];

// ============================================================================
// Copilot Type System
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
}

// ── Chart Data (structured, NOT LLM-generated JSON strings) ─────────────────
export interface ChartData {
  type: "line" | "bar" | "column" | "pie";
  title: string;
  xKey: string;
  yKeys: string[];
  rows: Array<Record<string, string | number>>;
  colors?: string[];
}

// ── Tool Definition ──────────────────────────────────────────────────────────
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
  execute(args: Record<string, unknown>): Promise<ToolResult>;
}

// ── Streaming Delta (emitted by providers token by token) ───────────────────
export interface StreamDelta {
  content?: string;
  toolCallId?: string;
  toolCallName?: string;
  toolCallArgsChunk?: string;
  done: boolean;
}

// ── API Message format (OpenAI-compatible, sent to all providers) ────────────
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
  onLoadProgress?: (progress: number, text: string) => void;
  checkAvailability(): Promise<ProviderStatus>;
  stream(
    messages: ApiMessage[],
    tools: ToolDefinition[],
    signal: AbortSignal,
    onDelta: (delta: StreamDelta) => void,
  ): Promise<void>;
}

// ── Sub-Agent Step (for UI progress display in LangGraph-style execution) ──
export interface SubAgentStep {
  id: string;
  label: string;
  status: "running" | "completed" | "error" | "pending";
  detail?: string;
  duration?: number;
}

// ── Agent Events (emitted by agent.ts during a run) ─────────────────────────
export type AgentEvent =
  | { type: "delta"; content: string }
  | { type: "tool_start"; toolCall: ToolCall }
  | { type: "tool_done"; toolCall: ToolCall }
  | { type: "step"; step: SubAgentStep }
  | { type: "error"; error: string }
  | { type: "done" };

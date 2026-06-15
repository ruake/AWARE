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

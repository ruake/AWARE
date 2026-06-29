import type {
  AgentEvent,
  ApiMessage,
  ChartData,
  GraphNodeState,
  IProvider,
  Message,
  SubAgentStep,
  TableData,
  ToolDefinition,
  ToolResult,
} from "./types";

// ── Graph Node ───────────────────────────────────────────────────────────────
export interface AgentNode {
  id: string;
  label: string;
  description: string;
  execute(ctx: AgentGraphContext): Promise<AgentNodeResult>;
}

// ── Graph Context (passed through all nodes) ─────────────────────────────────
export interface AgentGraphContext {
  query: string;
  history: Message[];
  provider: IProvider;
  tools: ToolDefinition[];
  signal: AbortSignal;
  onEvent: (event: AgentEvent) => void;

  // Accumulated during graph execution
  apiMessages: ApiMessage[];
  plan: string;
  pendingToolCalls: Array<{ id: string; name: string; args: Record<string, unknown> }>;
  toolResults: Map<string, ToolResult>;
  charts: ChartData[];
  tables: TableData[];
  finalContent: string;
  steps: SubAgentStep[];
  graphNodes: GraphNodeState[];
}

export interface AgentNodeResult {
  status: "completed" | "error";
  error?: string;
  steps?: SubAgentStep[];
}

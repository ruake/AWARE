export type LangGraphNodeId =
  | "data_fetch"
  | "context_build"
  | "skill_dispatch"
  | "analysis"
  | "chart_render"
  | "response"
  | string;

export interface LangGraphNode {
  id: LangGraphNodeId;
  label: string;
  description: string;
  execute: (ctx: LangGraphExecutionContext) => Promise<LangGraphNodeResult>;
}

export interface LangGraphEdge {
  from: LangGraphNodeId;
  to: LangGraphNodeId;
  condition?: (ctx: LangGraphExecutionContext) => boolean;
}

export interface LangGraphExecutionContext {
  request: import("./types").AIAnalysisRequest;
  data: Record<string, unknown>;
  charts: ChartOutput[];
  currentNode: LangGraphNodeId;
  startedAt: number;
  error?: string;
  logs: DebugLogEntry[];
}

export interface LangGraphNodeResult {
  status: "completed" | "error" | "skip";
  dataUpdate?: Record<string, unknown>;
  charts?: ChartOutput[];
  error?: string;
}

export interface LangGraphExecutionState {
  nodeId: LangGraphNodeId;
  label: string;
  description: string;
  status: "pending" | "running" | "completed" | "error";
  startedAt: number;
  completedAt?: number;
  duration?: number;
  error?: string;
}

export interface DebugLogEntry {
  timestamp: string;
  node: LangGraphNodeId;
  event: string;
  duration?: number;
  details?: string;
  level: "info" | "warn" | "error" | "debug";
}

export type GoogleChartType =
  | "Table"
  | "ColumnChart"
  | "BarChart"
  | "PieChart"
  | "AreaChart"
  | "LineChart"
  | "Gauge"
  | "Sankey";

export interface ChartOutput {
  type: GoogleChartType;
  title: string;
  headers: string[];
  rows: unknown[][];
  colors?: string[];
  options?: Record<string, unknown>;
}

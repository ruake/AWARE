import type { AIAnalysisRequest } from "./types";

export type LangGraphNodeId =
  | "dispatcher"
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
  request: AIAnalysisRequest;
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
  steps?: SubAgentStep[];
}

export interface LangGraphExecutionState {
  nodeId: LangGraphNodeId;
  label: string;
  description: string;
  status: "pending" | "running" | "completed" | "error" | "skip";
  startedAt: number;
  completedAt?: number;
  duration?: number;
  error?: string;
  steps?: SubAgentStep[];
}

export interface DebugLogEntry {
  timestamp: string;
  node: LangGraphNodeId;
  event: string;
  duration?: number;
  details?: string;
  level: "info" | "warn" | "error" | "debug";
}

export type ChartType =
  | "Table"
  | "ColumnChart"
  | "BarChart"
  | "PieChart"
  | "AreaChart"
  | "LineChart"
  | "Gauge"
  | "Sankey";

export interface ChartOutput {
  type: ChartType;
  title: string;
  headers: string[];
  rows: unknown[][];
  colors?: string[];
  options?: Record<string, unknown>;
}

export interface SubAgentStep {
  label: string;
  status: "running" | "completed" | "error";
  detail?: string;
  duration?: number;
}

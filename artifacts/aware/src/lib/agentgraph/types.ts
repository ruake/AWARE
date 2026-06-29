import { Run, TestResult, TestCase, TestSuite, SchedulerStatus } from "@/lib/types";

export type Intent =
  | "failures"
  | "flakiness"
  | "environment_compare"
  | "anomalies"
  | "pipeline_health"
  | "trend"
  | "test_detail"
  | "unknown";

export type ChartType =
  | "Table"
  | "ColumnChart"
  | "BarChart"
  | "PieChart"
  | "LineChart"
  | "ComboChart"
  | "BubbleChart";

export interface ChartConfig {
  chartType: ChartType;
  data: unknown[][];
  options: Record<string, unknown>;
  title: string;
}

export interface GraphContext {
  query: string;
  intent: Intent;
  runs: Run[];
  testResults: TestResult[];
  testCases: TestCase[];
  suites: TestSuite[];
  schedulerStatus: SchedulerStatus | null;
  analysis: Record<string, unknown>;
  chartConfig: ChartConfig | null;
  textResponse: string;
  reasoning: string | null;
  recommendations: string | null;
  error: string | null;
}

export interface GraphNode<T = unknown> {
  id: string;
  execute: (ctx: GraphContext) => Promise<GraphContext>;
}

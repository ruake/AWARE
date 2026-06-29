export interface AIUseCase {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  systemPrompt: string;
  tools: string[];
  exampleQueries: string[];
}

export interface AIAnalysisRequest {
  useCaseId: string;
  parameters: Record<string, unknown>;
  context?: string;
}

export interface AIAnalysisResult {
  useCaseId: string;
  summary: string;
  details: string;
  data: unknown;
  confidence: number;
  recommendations: string[];
  generatedAt: string;
}

export interface AIInsight {
  id: string;
  type: "improvement" | "warning" | "info" | "critical";
  title: string;
  description: string;
  category: string;
  severity: number;
  relatedData: Record<string, unknown>;
  timestamp: string;
}

export interface DataQuery {
  id: string;
  name: string;
  description: string;
  query: (params: Record<string, unknown>) => Promise<unknown>;
  exampleParams: Record<string, unknown>;
}

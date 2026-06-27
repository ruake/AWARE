export interface Run {
  id: string; label: string; suiteId: string; envId: string;
  env: "QA" | "UAT" | "PROD"; network: "staging" | "production";
  status: "PASS" | "FAIL" | "RUNNING" | "PENDING" | "ERROR";
  passPct: number; failures: number; duration: string; durationMs: number;
  started: string; build: string; rev: string;
}
export interface TestResult {
  id: string; testCaseId: string; runId: string; name: string;
  status: "PASS" | "FAIL" | "SKIPPED" | "FLAKY" | "TIMEOUT" | "ERROR";
  duration: number; category: string; assertions?: Assertion[];
  tags?: string[]; error?: string; flaky?: boolean;
}
export interface Assertion { assertion: string; expected: string; actual: string; passed: boolean; }
export interface TestCase {
  id: string; name: string; description: string; category: string;
  priority: "P0" | "P1" | "P2" | "P3"; severity: string; status: string;
  owner: string; scriptPath: string; testType: "playwright" | "pytest" | "puppeteer" | "http";
  tags: string[]; changelog: string[]; updatedAt: string;
}
export interface TestSuite {
  id: string; name: string; description: string; parentId?: string; testIds: string[];
  metadata?: { schedule?: string; parallelism?: number; environments?: string[]; };
}
export interface DiffRow {
  id: string; name: string; status: "regression" | "fixed" | "unchanged" | "new" | "missing";
  baseResult: TestResult | null; candidateResult: TestResult | null; changed: boolean;
}
export interface PromotionDecision {
  runId: string; suiteId: string; decision: "promoted" | "blocked" | "pending";
  decidedBy: string; decidedAt: string; score: number;
}
export interface SchedulerStatus {
  lastRun: string; status: "healthy" | "degraded" | "error";
  suites: SuiteStatus[]; recentDispatches: DispatchLogEntry[];
  summary: { totalSuites: number; activeRuns: number; pendingDispatches: number; lastGC: string | null };
}
export interface SuiteStatus { suiteId: string; schedule: string; lastRun: string | null; lastConclusion: string | null; activeRuns: number; }
export interface DispatchLogEntry { suiteId: string; environment: string; dispatchedAt: string; status: "success" | "failed"; workflowRunId: number; }

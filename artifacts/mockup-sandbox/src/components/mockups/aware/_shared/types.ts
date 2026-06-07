export interface Run {
  id: string;
  label: string;
  suite: string;
  target: string;
  status: "PASS" | "FAIL" | "PARTIAL" | "FLAKY";
  passPct: number;
  failures: number;
  duration: string;
  durationMs: number;
  started: string;
  pm: string;
  ew: string;
  env: string;
}

export interface TestResult {
  id: string;
  name: string;
  status: "PASS" | "FAIL";
  duration: number;
  category: string;
  suite: string;
}

export interface TestRunPoint {
  runId: string;
  status: "PASS" | "FAIL";
  duration: number;
  env: string;
}

export interface TestDetail {
  history: TestRunPoint[];
  passRate: number;
  flakinessScore: number;
  avgDuration: number;
}

export interface DiffRow {
  id: string;
  name: string;
  baseStatus: "PASS" | "FAIL";
  candStatus: "PASS" | "FAIL";
  durBase: number;
  durCand: number;
  category: string;
  state: "regression" | "fixed" | "duration" | "unchanged";
}

export interface EnvSummary {
  label: string;
  passRate: number;
  trend: number;
  failures: number;
  color: string;
  alert: string | null;
}

export interface StatusUpdate {
  type: "success" | "warning" | "info";
  message: string;
}

export interface Config {
  apiBaseUrl: string;
  useMock: boolean;
  pollingIntervalMs: number;
  requestTimeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  cacheBust: boolean;
  mode: "development" | "production" | "test";
}

export interface ServiceError {
  code: "TIMEOUT" | "NETWORK" | "HTTP" | "VALIDATION" | "PARSE" | "UNKNOWN";
  message: string;
  url?: string;
  status?: number;
  retryable: boolean;
}

// ── Test Case Management Types ─────────────────────────────

export type TestPriority = "P0" | "P1" | "P2" | "P3";
export type TestSeverity = "critical" | "major" | "minor" | "trivial";
export type TestStatus = "active" | "disabled" | "deprecated";

export interface TestTag {
  id: string;
  name: string;
  color: string;
}

export interface TestChangeLogEntry {
  version: number;
  timestamp: string;
  author: string;
  summary: string;
  changes: string[];
}

export type PredicateOperator = "equals" | "contains" | "gt" | "lt" | "exists";

export interface Predicate {
  id: string;
  type: "statusCode" | "headerEquals" | "headerContains" | "responseTime" | "cookieEquals";
  field: string;
  expected: string;
  operator: PredicateOperator;
  description: string;
}

export interface FilmstripConfig {
  enabled: boolean;
  threshold: number;
  region?: string;
  ignoreAreas?: string[];
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: TestPriority;
  severity: TestSeverity;
  status: TestStatus;
  tags: string[];
  owner: string;
  suiteIds: string[];
  automated: boolean;
  scriptPath: string;
  preconditions: string;
  expectedBehavior: string;
  documentation: string;
  relatedTestIds: string[];
  requestHeaders: Record<string, string>;
  cookies: Record<string, string>;
  expectedStatus: number;
  captureResponseHeaders: string[];
  filmstrip: FilmstripConfig;
  predicates: Predicate[];
  version: number;
  changelog: TestChangeLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface TestSuiteIntegration {
  slackChannel?: string;
  slackWebhookUrl?: string;
  notifyOn: ("pass" | "fail" | "deploy" | "approval")[];
  githubCommentPr: boolean;
  githubDeploymentStatus: boolean;
  requireApproval: boolean;
  approvers: string[];
  webhookUrl?: string;
}

export interface TestSuiteConfig {
  target: string;
  environment: string;
  parallelism: number;
  retries: number;
  failFast: boolean;
  timeoutMinutes: number;
  integration?: TestSuiteIntegration;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  testIds: string[];
  config: TestSuiteConfig;
  tags: string[];
  schedule: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuiteNode {
  suite: TestSuite;
  children: SuiteNode[];
  depth: number;
}

export type ImportExportFormat = "json" | "junit_xml" | "csv";

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { line: number; message: string }[];
}

export interface GenerateParams {
  count: number;
  category: string;
  status: TestStatus;
  priority: TestPriority;
  owner: string;
  suites: string[];
}

export interface TestStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byOwner: Record<string, number>;
  byTag: Record<string, number>;
  automated: number;
  manual: number;
  coverage: number;
  avgVersion: number;
}

export interface TestCaseFilter {
  search: string;
  status: TestStatus | "";
  priority: TestPriority | "";
  category: string;
  tags: string[];
  suiteId: string;
}

export function classifyError(err: unknown): ServiceError {
  if (err instanceof TimeoutError) {
    return { code: "TIMEOUT", message: err.message, url: err.url, retryable: true };
  }
  if (err instanceof FetchError) {
    return {
      code: "HTTP", message: err.message, url: err.url,
      status: err.status,
      retryable: err.status >= 500 || err.status === 429,
    };
  }
  if (err instanceof ValidationError) {
    return { code: "VALIDATION", message: err.message, url: err.url, retryable: false };
  }
  if (err instanceof TypeError && err.message.includes("fetch")) {
    return { code: "NETWORK", message: "Network request failed", retryable: true };
  }
  const msg = err instanceof Error ? err.message : String(err);
  return { code: "UNKNOWN", message: msg, retryable: false };
}

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

export class TimeoutError extends Error {
  constructor(public readonly url: string, public readonly timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms: ${url}`);
    this.name = "TimeoutError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly url: string, public readonly data: unknown) {
    super(message);
    this.name = "ValidationError";
  }
}

// ── Akamai-specific environment types ──────────────────────────────────────
// Canonical environment identifiers — 3 tiers × 2 networks = 6 slots.
// These are the only valid envId values in the system.
export type AkamaiTier = "QA" | "UAT" | "PROD";
export type AkamaiNetwork = "staging" | "production";
export type AkamaiEnvId =
  | "qa_staging"
  | "qa_prod"
  | "uat_staging"
  | "uat_prod"
  | "prod_staging"
  | "prod_prod";

export type RunStatus = "PASS" | "FAIL" | "PARTIAL" | "FLAKY" | "RUNNING" | "PENDING" | "ERROR";

export interface RunCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  reason: string;
  message: string;
  lastTransitionTime: string;
}

export interface Run {
  id: string;
  label: string;
  suiteId: string;
  envId: AkamaiEnvId;
  env: AkamaiTier;
  network: AkamaiNetwork;
  status: RunStatus;
  passPct: number;
  failures: number;
  duration: string;
  durationMs: number;
  started: string;
  build: string;
  rev: string;
  /** Optional K8s-style conditions for granular status tracking */
  conditions?: RunCondition[];
  /** GitHub Actions workflow run ID for status polling */
  workflowRunId?: number;
  /** Last status update timestamp */
  updatedAt?: string;
}

// ── Data Contract: TestResult ──────────────────────────────────────────
// All test results MUST conform to this interface exactly.
// Fields marked REQUIRED are always present (null never allowed).
// Fields marked OPTIONAL may be absent or undefined.
export interface TestResult {
  /** REQUIRED — Unique result ID (e.g. geo_01, pw_0) */
  id: string;
  /** REQUIRED — Links to TestCase.id */
  testCaseId: string;
  /** REQUIRED — Links to Run.id */
  runId: string;
  /** REQUIRED — Human-readable test name */
  name: string;
  /** REQUIRED — Test outcome */
  status: "PASS" | "FAIL";
  /** REQUIRED — Duration in milliseconds */
  duration: number;
  /** REQUIRED — Category grouping (e.g. Security, Functional, Performance) */
  category: string;
  /** REQUIRED — Suite/spec file name */
  suite: string;
  /** OPTIONAL — Error message from a failing test */
  error?: string;
  /** REQUIRED in generated data — Assertion results (empty array if none) */
  assertions?: TestAssertionResult[];
  /** REQUIRED — HTTP request/response evidence */
  evidence: TestEvidence;
  /** REQUIRED — Screenshot filmstrip frames from Playwright */
  filmstrip: FilmstripFrame[];
}

export interface TestAssertionResult {
  assertion: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface TestCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface FilmstripFrame {
  id: string;
  label: string;
  dataUri: string;
  /** OPTIONAL — External URL to the image (for file-based storage) */
  imageUrl?: string;
  timestamp?: number;
}

export interface HttpTimings {
  dnsLookup: number;
  tcpConnect: number;
  tlsHandshake: number;
  ttfb: number;
  download: number;
  total: number;
}

export interface TestEvidence {
  request: { method: string; url: string; headers: Record<string, string>; body?: string };
  response: {
    status: number;
    headers: Record<string, string>;
    body?: string;
    cookies?: TestCookie[];
    timings: HttpTimings;
  };
  assertions: TestAssertionResult[];
}

export interface TestRunPoint {
  runId: string;
  status: "PASS" | "FAIL";
  duration: number;
  env: string;
  date?: string;
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
  state: "regression" | "fixed" | "duration" | "unchanged" | "fishy";
}

export interface EnvironmentConfig {
  id: AkamaiEnvId;
  label: string;
  target: AkamaiTier;
  stage: string;
  baseUrl: string;
  ips: string[];
  network: AkamaiNetwork;
  property?: string;
  propertyVersion?: number;
  propertyStatus?: "active" | "inactive" | "pending";
  cpcode?: string;
  edgeHostname?: string;
}

export interface EnvSummary {
  label: string;
  passRate: number;
  trend: number;
  failures: number;
  color: string;
  alert: string | null;
}

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

export type FilmstripMode = "screenshot" | "dom-snapshot" | "visual-diff";

export interface FilmstripConfig {
  enabled: boolean;
  mode: FilmstripMode;
  threshold: number;
  region?: string;
  ignoreAreas?: string[];
  diffBaselineId?: string;
  captureOnFailure: boolean;
  maxFrames: number;
}

export interface TestAssertion {
  id: string;
  type: "statusCode" | "header" | "body" | "responseTime" | "cookie" | "jsonPath";
  field: string;
  expected: string;
  operator: "equals" | "contains" | "regex" | "gt" | "lt" | "exists" | "notExists";
  description?: string;
}

export interface TransactionStep {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: string;
  assertions: TestAssertion[];
}

export interface TestConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  screenshotOnFailure?: boolean;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  testType: "web" | "api" | "http" | "edgeworker" | "transaction" | "pytest" | "puppeteer" | "selenium";
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
  config: TestConfig;
  assertions: TestAssertion[];
  version: number;
  changelog: TestChangeLogEntry[];
  assertionsPassed?: number;
  assertionsFailed?: number;
  createdAt: string;
  updatedAt: string;
  githubPath?: string;
  githubUrl?: string;
  repoStatus?: "not_checked" | "synced" | "modified" | "missing";
  lastSyncedAt?: string;
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
  envIds: AkamaiEnvId[];
  runners: ("playwright" | "pytest")[];
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

export interface PromotionDecision {
  runId: string;
  decision: "promote" | "block" | "pending";
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
}

// ── Job Runner Types ──────────────────────────────────────────────

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type JobType = "test-run" | "discovery" | "sync" | "build" | "custom";

export interface Job {
  id: string;
  type: JobType;
  label: string;
  description?: string;
  status: JobStatus;
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  result?: string;
  error?: string;
  runnerId: string;
  metadata?: Record<string, unknown>;
}

export interface JobRunnerDef {
  id: string;
  name: string;
  type: JobType;
  description: string;
  icon: string;
  defaultSuiteId?: string;
}

export interface JobSummary {
  total: number;
  byStatus: Record<JobStatus, number>;
  byType: Record<JobType, number>;
  lastRun: Job | null;
  avgDuration: number;
  passRate: number;
}

// ── Anomaly Detection Types ────────────────────────────────────────

export interface AnomalyScore {
  runId: string;
  passRateZ: number;
  durationZ: number;
  overallAnomaly: number;
  flags: string[];
}

// ── LLM / AI Copilot Types ──────────────────────────────────────────

export type LLMProviderType = "custom" | "webllm" | "chrome";

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export interface LLMConfig {
  provider: LLMProviderType;
  apiKey?: string;
  apiUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: "custom",
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 2048,
};

export interface LLMSkillDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  responseFormat: "text" | "json" | "code";
  userPromptHint: string;
}

export interface GenerateWithLLMParams {
  count: number;
  category: string;
  description: string;
  suites: string[];
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMCompletionResponse {
  content: string;
  finishReason: "stop" | "length" | "error";
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMChatMessage {
  id: string;
  role: LLMRole;
  content: string;
  timestamp: number;
  skill?: string;
  parentId?: string;
  threadId?: string;
  metadata?: Record<string, unknown>;
}

// ── Status & Config ──────────────────────────────────────────────────

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

export function classifyError(err: unknown): ServiceError {
  if (err instanceof TimeoutError) {
    return { code: "TIMEOUT", message: err.message, url: err.url, retryable: true };
  }
  if (err instanceof FetchError) {
    return {
      code: "HTTP",
      message: err.message,
      url: err.url,
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
  constructor(
    public readonly url: string,
    public readonly timeoutMs: number,
  ) {
    super(`Request timed out after ${timeoutMs}ms: ${url}`);
    this.name = "TimeoutError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly data: unknown,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// ── Scheduler Types ────────────────────────────────────────────────────

export interface SchedulerSuiteStatus {
  id: string;
  name: string;
  schedule: string | null;
  scheduleDesc: string | null;
  due: boolean;
  lastDispatched: string | null;
  lastConclusion: string | null;
  lastRunUrl: string | null;
  activeRuns: number;
  status: string;
  nextDue: string | null;
  environments: string[];
  runners: string[];
}

export interface SchedulerDispatch {
  timestamp: string;
  suite: string;
  environments: string[];
  dispatched: number;
  failed: number;
  errors?: string[];
  workflow: string;
}

export interface SchedulerSummary {
  total: number;
  scheduled: number;
  due: number;
  dispatched: number;
  running: number;
}

export interface SchedulerStatus {
  lastRun: string | null;
  lastRunBy: string | null;
  status: "healthy" | "degraded" | "error";
  suites: SchedulerSuiteStatus[];
  recentDispatches: SchedulerDispatch[];
  summary: SchedulerSummary;
}

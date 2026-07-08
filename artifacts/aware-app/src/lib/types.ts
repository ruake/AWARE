export type RunStatus = 'PASS' | 'FAIL' | 'PARTIAL' | 'RUNNING' | 'PENDING' | 'ERROR';
export type Env = 'QA' | 'UAT' | 'PROD';

export interface Run {
  id: string;
  label: string;
  suiteId: string;
  envId: string;
  env: Env;
  network: string;
  status: RunStatus;
  passPct: number;
  failures: number;
  duration: string;
  durationMs: number;
  started: string;
  build: string;
  rev: string;
}

export interface TestResult {
  id: string;
  testCaseId: string;
  runId: string;
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  category: string;
  suite: string;
  assertions: unknown[];
  evidence: {
    request: { method: string; url: string; headers: Record<string, string> };
    response: { status: number; headers: Record<string, string>; timings?: Record<string, number> };
    assertions: Array<{ label: string; pass: boolean; actual?: string; expected?: string }>;
  };
}

export interface TestCase {
  id: string;
  name: string;
  suite?: string;
  category?: string;
  scriptPath?: string;
  githubPath?: string;
  docstring?: string;
  markers?: string[];
  fileType?: 'pytest' | 'playwright';
  description?: string;
  status?: string;
  priority?: string;
  severity?: string;
  tags?: string[];
  suiteIds?: string[];
  automated?: boolean;
  owner?: string;
  testType?: string;
  version?: number;
  changelog?: ChangeLogEntry[];
}

export interface ChangeLogEntry {
  version: number;
  date: string;
  author: string;
  message: string;
}

export interface DiffRow {
  id: string;
  name: string;
  baseStatus: 'PASS' | 'FAIL';
  candStatus: 'PASS' | 'FAIL';
  durBase: number;
  durCand: number;
  category: string;
  state: 'regression' | 'fixed' | 'duration' | 'unchanged' | 'fishy';
  baseResult?: TestResult;
  candResult?: TestResult;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  testIds: string[];
  envIds: string[];
  runners?: string[];
  config?: Record<string, unknown>;
  tags: string[];
  schedule: string | null;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SuiteTreeNode {
  suite: TestSuite;
  children: SuiteTreeNode[];
  depth: number;
}

export interface PromotionDecision {
  id: string;
  fromEnv: string;
  toEnv: string;
  passRate: number;
  threshold: number;
  approved: boolean;
  timestamp: string;
  triggeredBy: string;
}

export interface EnvConfig {
  id: string;
  label: string;
  target: string;
  network: string;
  baseUrl: string;
  ips: string[];
  property: string;
  propertyVersion: number;
  edgeHostname: string;
  color: string;
}

export interface AnomalyScore {
  runId: string;
  passRateZ: number;
  durationZ: number;
  overallAnomaly: number;
  flags: string[];
}

export interface TestStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  automated: number;
  manual: number;
  coverage: number;
  avgVersion: number;
}

export interface TestCaseFilter {
  search: string;
  status: string;
  priority: string;
  category: string;
  tags: string[];
  suiteId: string;
}

export interface AnomalyResult {
  testId: string;
  metric: string;
  zScore: number;
  severity: string;
  message: string;
  latestValue: number;
  mean: number;
  stdDev: number;
  runId: string;
}

export interface AnomalyBanner {
  testId: string;
  metric: string;
  message: string;
  severity: string;
}

export interface CiConfigOutput {
  version: string;
  project: string;
  suites: Array<{
    name: string;
    testCount: number;
    runners: string[];
    categories: string[];
  }>;
  environments: Array<{
    id: string;
    label: string;
    target: string;
    network: string;
    ips?: string[];
  }>;
  workflow: {
    file: string;
    path: string;
  };
  runners: {
    playwright: { browser: string };
    pytest: { markers: string[] };
  };
  instructions: string;
}

export interface LLMConfig {
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

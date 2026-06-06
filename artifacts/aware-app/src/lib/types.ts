export interface Run {
  id: string;
  label: string;
  suite: string;
  target: string;
  status: "PASS" | "FAIL" | "PARTIAL" | "FLAKY" | "RUNNING";
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

export type TestPriority = "P0" | "P1" | "P2" | "P3";
export type TestSeverity = "critical" | "major" | "minor" | "trivial";
export type TestStatus = "active" | "disabled" | "deprecated";

export type CatchpointTestType =
  | "web"
  | "transaction"
  | "api"
  | "dns"
  | "ping"
  | "traceroute"
  | "ftp"
  | "smtp"
  | "tcp"
  | "ssl"
  | "websocket"
  | "bgp"
  | "streaming"
  | "cdn"
  | "playwright"
  | "network";

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

export interface TransactionStep {
  id: string;
  action: "navigate" | "click" | "type" | "wait" | "assert" | "screenshot" | "scroll";
  selector?: string;
  value?: string;
  description?: string;
}

export interface TestAssertion {
  id: string;
  field: string;
  operator: "=" | "!=" | "<" | "<=" | ">" | ">=" | "contains" | "not_contains" | "exists" | "not_exists" | "matches";
  value: string;
  unit?: string;
}

export interface TestConfig {
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  headers?: { key: string; value: string }[];
  body?: string;
  bodyType?: "none" | "json" | "xml" | "form" | "text";
  expectedStatusCode?: number;
  followRedirects?: boolean;
  hostname?: string;
  recordType?: "A" | "AAAA" | "CNAME" | "MX" | "NS" | "TXT" | "SOA" | "PTR";
  expectedValue?: string;
  nameserver?: string;
  host?: string;
  packetCount?: number;
  packetSize?: number;
  maxHops?: number;
  protocol?: "ICMP" | "TCP" | "UDP" | "HLS" | "DASH" | "RTMP" | "RTSP";
  port?: number;
  username?: string;
  remotePath?: string;
  ftpOperation?: "connect" | "list" | "download" | "upload";
  smtpFrom?: string;
  smtpTo?: string;
  useSSL?: boolean;
  warnDaysBeforeExpiry?: number;
  criticalDaysBeforeExpiry?: number;
  wsMessage?: string;
  wsExpectedResponse?: string;
  prefix?: string;
  asn?: string;
  bgpCommunity?: string;
  expectedBitrate?: number;
  bufferingThreshold?: number;
  expectedEdgeLocation?: string;
  expectedCacheHeader?: string;
  cdnProvider?: string;
  timeoutMs?: number;
  thresholds?: {
    responseTimeMs?: number;
    availabilityPct?: number;
    errorRatePct?: number;
  };
  steps?: TransactionStep[];
  playwrightScript?: string;
  browser?: "chromium" | "firefox" | "webkit";
  bandwidth?: number;
  jitterThreshold?: number;
  packetLossThreshold?: number;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  testType: CatchpointTestType;
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
  config: TestConfig;
  assertions: TestAssertion[];
  version: number;
  changelog: TestChangeLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface TestSuiteConfig {
  target: string;
  environment: string;
  parallelism: number;
  retries: number;
  failFast: boolean;
  timeoutMinutes: number;
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

export interface PromotionDecision {
  runId: string;
  decision: "promote" | "block" | "pending";
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
}

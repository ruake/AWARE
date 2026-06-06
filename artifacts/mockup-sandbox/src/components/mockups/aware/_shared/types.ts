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

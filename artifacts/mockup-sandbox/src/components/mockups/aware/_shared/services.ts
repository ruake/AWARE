import type { Run, TestResult, DiffRow, TestDetail, EnvSummary, Config, ServiceError } from "./types";
import { classifyError, FetchError, TimeoutError, ValidationError } from "./types";
import { RUNS as MOCK_RUNS, getRunById as mockGetRunById, getRunIndex as mockGetRunIndex, DIFF_ROWS as MOCK_DIFF_ROWS, TEST_DETAILS as MOCK_TEST_DETAILS, ENV_SUMMARY as MOCK_ENV_SUMMARY, PASS_RATE_DATA as MOCK_PASS_RATE_DATA, ENV_PASS_RATE_DATA as MOCK_ENV_PASS_RATE_DATA, getTestResultsForRun as mockGetTestResultsForRun, generateTestHistory as mockGenerateTestHistory } from "./data";

export type { Run, TestResult, DiffRow, TestDetail, EnvSummary, ServiceError };

// ── Config ──────────────────────────────────────────────────

export function getConfig(): Config {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "");
  const mode: Config["mode"] = import.meta.env.DEV
    ? "development"
    : import.meta.env.PROD
    ? "production"
    : "test";

  const rawPoll = Number(import.meta.env.VITE_POLLING_INTERVAL_MS);
  const rawTimeout = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS);
  const rawRetries = Number(import.meta.env.VITE_MAX_RETRIES);
  const rawBackoff = Number(import.meta.env.VITE_RETRY_BASE_DELAY_MS);
  const rawCacheBust = import.meta.env.VITE_CACHE_BUST;

  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? `${base}/data`,
    useMock: import.meta.env.VITE_USE_MOCK !== "false",
    pollingIntervalMs: clamp(rawPoll || 30000, 5000, 300000),
    requestTimeoutMs: clamp(rawTimeout || 10000, 2000, 60000),
    maxRetries: clamp(rawRetries || 3, 0, 10),
    retryBaseDelayMs: clamp(rawBackoff || 1000, 200, 30000),
    cacheBust: rawCacheBust === "true" || (rawCacheBust !== "false" && mode === "development"),
    mode,
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ── HTTP Client ─────────────────────────────────────────────

function buildUrl(path: string): string {
  const { apiBaseUrl, cacheBust } = getConfig();
  const sep = path.startsWith("/") ? "" : "/";
  let url = `${apiBaseUrl}${sep}${path}`;
  if (cacheBust) {
    const qs = url.includes("?") ? "&" : "?";
    url = `${url}${qs}_t=${Date.now()}`;
  }
  return url;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: "omit",
    });
  } finally {
    clearTimeout(timer);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function jitter(ms: number): number {
  return ms * (0.75 + Math.random() * 0.5);
}

async function apiFetch<T>(path: string): Promise<T> {
  const { requestTimeoutMs, maxRetries, retryBaseDelayMs } = getConfig();
  const url = buildUrl(path);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {}, requestTimeoutMs);

      if (!response.ok) {
        throw new FetchError(
          `${response.status} ${response.statusText}`,
          response.status,
          url,
        );
      }

      const text = await response.text();
      if (!text.trim()) {
        throw new ValidationError("Empty response body", url, null);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new ValidationError("Invalid JSON response", url, text);
      }

      return parsed as T;

    } catch (err) {
      // AbortError from timeout
      if (err instanceof DOMException && err.name === "AbortError") {
        lastError = new TimeoutError(url, requestTimeoutMs);
        if (attempt < maxRetries) {
          const backoff = jitter(retryBaseDelayMs * Math.pow(2, attempt));
          await delay(backoff);
          continue;
        }
        break;
      }

      if (err instanceof FetchError) {
        lastError = err;
        // 4xx client errors — no retry (except 429 rate-limit)
        if (err.status >= 400 && err.status < 500 && err.status !== 429) break;
        if (attempt < maxRetries) {
          const backoff = jitter(retryBaseDelayMs * Math.pow(2, attempt));
          await delay(backoff);
          continue;
        }
        break;
      }

      if (err instanceof ValidationError) {
        lastError = err;
        break;
      }

      // Network / TypeError
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const backoff = jitter(retryBaseDelayMs * Math.pow(2, attempt));
        await delay(backoff);
        continue;
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

// ── Service Interfaces ─────────────────────────────────────

export interface RunService {
  getAll(): Promise<Run[]>;
  getById(id: string): Promise<Run | undefined>;
  getIndex(id: string): Promise<number>;
  getTestResults(runIndex: number): Promise<TestResult[]>;
}

export interface DiffService {
  getRows(): Promise<DiffRow[]>;
  getTestDetails(): Promise<TestDetail[]>;
}

export interface DashboardService {
  getEnvSummary(): Promise<EnvSummary[]>;
  getPassRateData(): Promise<unknown>;
  getEnvPassRateData(): Promise<unknown>;
}

export interface TestService {
  getHistory(testIndex: number): Promise<TestDetail>;
}

// ── Mock Implementations ───────────────────────────────────

export const mockRunService: RunService = {
  getAll: () => Promise.resolve(MOCK_RUNS),
  getById: (id) => Promise.resolve(mockGetRunById(id)),
  getIndex: (id) => Promise.resolve(mockGetRunIndex(id)),
  getTestResults: (runIndex) => Promise.resolve(mockGetTestResultsForRun(runIndex)),
};

export const mockDiffService: DiffService = {
  getRows: () => Promise.resolve(MOCK_DIFF_ROWS),
  getTestDetails: () => Promise.resolve(MOCK_TEST_DETAILS),
};

export const mockDashboardService: DashboardService = {
  getEnvSummary: () => Promise.resolve(MOCK_ENV_SUMMARY),
  getPassRateData: () => Promise.resolve(MOCK_PASS_RATE_DATA),
  getEnvPassRateData: () => Promise.resolve(MOCK_ENV_PASS_RATE_DATA),
};

export const mockTestService: TestService = {
  getHistory: (testIndex) => Promise.resolve(mockGenerateTestHistory(testIndex)),
};

// ── API Implementations ────────────────────────────────────

export const apiRunService: RunService = {
  getAll: () => apiFetch<Run[]>("/runs"),
  getById: (id) => apiFetch<Run | undefined>(`/runs/${encodeURIComponent(id)}`),
  getIndex: (id) => apiFetch<number>(`/runs/${encodeURIComponent(id)}/index`),
  getTestResults: (runIndex) => apiFetch<TestResult[]>(`/runs/${runIndex}/tests`),
};

export const apiDiffService: DiffService = {
  getRows: () => apiFetch<DiffRow[]>("/diff"),
  getTestDetails: () => apiFetch<TestDetail[]>("/diff/details"),
};

export const apiDashboardService: DashboardService = {
  getEnvSummary: () => apiFetch<EnvSummary[]>("/dashboard/env-summary"),
  getPassRateData: () => apiFetch<unknown>("/dashboard/pass-rate"),
  getEnvPassRateData: () => apiFetch<unknown>("/dashboard/env-pass-rate"),
};

export const apiTestService: TestService = {
  getHistory: (testIndex) => apiFetch<TestDetail>(`/tests/${testIndex}/history`),
};

// ── Fallback Service ───────────────────────────────────────
// Wraps API service: on failure, falls back to mock data gracefully.

function fallback<F extends (...args: never[]) => Promise<unknown>>(
  apiFn: F,
  mockFn: F,
  label: string,
): F {
  return ((...args: Parameters<F>) => {
    return apiFn(...args).catch((err: unknown) => {
      const classified = classifyError(err);
      if (import.meta.env.DEV) {
        console.warn(`[aware] ${label} failed (${classified.code}), using mock:`, classified.message);
      }
      return mockFn(...args);
    });
  }) as F;
}

// ── Service Provider ───────────────────────────────────────

export interface Services {
  runs: RunService;
  diffs: DiffService;
  dashboard: DashboardService;
  tests: TestService;
}

let cachedServices: Services | null = null;

export function getServices(): Services {
  if (cachedServices) return cachedServices;
  const { useMock } = getConfig();

  if (useMock) {
    cachedServices = {
      runs: mockRunService,
      diffs: mockDiffService,
      dashboard: mockDashboardService,
      tests: mockTestService,
    };
  } else {
    cachedServices = {
      runs: {
        getAll: fallback(apiRunService.getAll, mockRunService.getAll, "runs.getAll"),
        getById: fallback(apiRunService.getById, mockRunService.getById, "runs.getById"),
        getIndex: fallback(apiRunService.getIndex, mockRunService.getIndex, "runs.getIndex"),
        getTestResults: fallback(apiRunService.getTestResults, mockRunService.getTestResults, "runs.getTestResults"),
      },
      diffs: {
        getRows: fallback(apiDiffService.getRows, mockDiffService.getRows, "diffs.getRows"),
        getTestDetails: fallback(apiDiffService.getTestDetails, mockDiffService.getTestDetails, "diffs.getTestDetails"),
      },
      dashboard: {
        getEnvSummary: fallback(apiDashboardService.getEnvSummary, mockDashboardService.getEnvSummary, "dashboard.getEnvSummary"),
        getPassRateData: fallback(apiDashboardService.getPassRateData, mockDashboardService.getPassRateData, "dashboard.getPassRateData"),
        getEnvPassRateData: fallback(apiDashboardService.getEnvPassRateData, mockDashboardService.getEnvPassRateData, "dashboard.getEnvPassRateData"),
      },
      tests: {
        getHistory: fallback(apiTestService.getHistory, mockTestService.getHistory, "tests.getHistory"),
      },
    };
  }
  return cachedServices;
}

export function resetServices(): void {
  cachedServices = null;
}

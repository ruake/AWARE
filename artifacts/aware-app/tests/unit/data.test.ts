import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/testSuites", () => ({
  getTestSuites: vi.fn(() => []),
}));

vi.mock("@/lib/testDiscovery", () => ({
  getAutoDiscoveredTests: vi.fn(() => []),
}));

import { clearCache } from "@/lib/dataFetcher";
import { loadRuns, loadResults, loadAllResults, loadTestCases, getTestCaseById, RUNS, resetDataCaches } from "@/lib/data";
import type { Run, TestResult, TestCase } from "@/lib/types";

const mockRuns: Run[] = [
  { id: "run_1", label: "Run 1", suiteId: "suite_a", envId: "qa_staging", env: "QA", network: "staging", status: "PASS", passPct: 98, failures: 1, duration: "5m", durationMs: 300000, started: "2026-06-01T10:00:00Z", build: "b1", rev: "abc" },
  { id: "run_2", label: "Run 2", suiteId: "suite_b", envId: "qa_prod", env: "QA", network: "production", status: "FAIL", passPct: 72, failures: 5, duration: "8m", durationMs: 480000, started: "2026-06-02T10:00:00Z", build: "b2", rev: "def" },
];

const mockResults: Record<string, TestResult[]> = {
  run_1: [
    { id: "r1_t1", testCaseId: "tc1", runId: "run_1", name: "test_alpha", status: "PASS", duration: 100, category: "Security", suite: "suite_a", assertions: [], evidence: { request: { method: "GET", url: "https://example.com", headers: {} }, response: { status: 200, headers: {} }, assertions: [] } },
  ],
};

const mockTestCases: Record<string, TestCase> = {
  tc1: { id: "tc1", name: "Test One", suite: "suite_a", category: "Security", scriptPath: "tests/tc1.spec.ts", description: "First test", status: "active", version: 1 },
  tc2: { id: "tc2", name: "Test Two", suite: "suite_b", category: "Performance", scriptPath: "tests/tc2.spec.ts", description: "Second test", status: "active", version: 2 },
};

beforeEach(() => {
  resetDataCaches();
  clearCache();
  vi.restoreAllMocks();
});

describe("loadRuns", () => {
  it("fetches runs and populates RUNS array", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(mockRuns) });
    vi.stubGlobal("fetch", mockFetch);

    const result = await loadRuns();
    expect(result).toEqual(mockRuns);
    expect(RUNS).toEqual(mockRuns);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("returns cached runs on second call without fetch", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(mockRuns) });
    vi.stubGlobal("fetch", mockFetch);

    await loadRuns();
    const result2 = await loadRuns();
    expect(result2).toEqual(mockRuns);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("loadResults", () => {
  it("fetches all results and returns by runId", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(mockResults) });
    vi.stubGlobal("fetch", mockFetch);

    const result = await loadResults("run_1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("test_alpha");
  });

  it("returns empty array for unknown runId", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(mockResults) });
    vi.stubGlobal("fetch", mockFetch);

    const result = await loadResults("unknown_run");
    expect(result).toEqual([]);
  });
});

describe("loadAllResults", () => {
  it("fetches and caches all results", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(mockResults) });
    vi.stubGlobal("fetch", mockFetch);

    const result = await loadAllResults();
    expect(result).toEqual(mockResults);

    const result2 = await loadAllResults();
    expect(result2).toEqual(mockResults);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("loadTestCases", () => {
  it("fetches and caches test cases", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(mockTestCases) });
    vi.stubGlobal("fetch", mockFetch);

    const result = await loadTestCases();
    expect(result).toEqual(mockTestCases);

    const result2 = await loadTestCases();
    expect(result2).toEqual(mockTestCases);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("getTestCaseById", () => {
  it("returns undefined when cache is empty", () => {
    expect(getTestCaseById("tc1")).toBeUndefined();
  });

  it("returns correct test case after loading", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(mockTestCases) });
    vi.stubGlobal("fetch", mockFetch);

    await loadTestCases();
    const tc = getTestCaseById("tc1");
    expect(tc).toBeDefined();
    expect(tc!.name).toBe("Test One");
  });

  it("returns undefined for unknown id", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(mockTestCases) });
    vi.stubGlobal("fetch", mockFetch);

    await loadTestCases();
    expect(getTestCaseById("nonexistent")).toBeUndefined();
  });
});

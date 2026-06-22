import { describe, it, expect, beforeEach, vi } from "vitest";
import { RUNS, getRunsByEnv, getRunById, computeDiffRows } from "@/lib/runs";
import type { Run, TestResult } from "@/lib/types";

vi.mock("@/lib/runsLoader", () => ({
  getCachedResults: vi.fn(),
}));

import { getCachedResults } from "@/lib/runsLoader";

const mockRun1: Run = {
  id: "run_001", label: "Run 1", suiteId: "suite_a", envId: "qa_staging",
  env: "QA", network: "staging", status: "PASS", passPct: 95, failures: 1,
  duration: "10m", durationMs: 600000, started: "2026-01-10T08:00:00Z",
  build: "b1", rev: "abc123",
};

const mockRun2: Run = {
  id: "run_002", label: "Run 2", suiteId: "suite_a", envId: "qa_prod",
  env: "QA", network: "production", status: "PASS", passPct: 90, failures: 2,
  duration: "12m", durationMs: 720000, started: "2026-01-11T08:00:00Z",
  build: "b2", rev: "def456",
};

const mockRun3: Run = {
  id: "run_003", label: "Run 3", suiteId: "suite_b", envId: "uat_staging",
  env: "UAT", network: "staging", status: "FAIL", passPct: 60, failures: 8,
  duration: "15m", durationMs: 900000, started: "2026-01-12T08:00:00Z",
  build: "b3", rev: "ghi789",
};

beforeEach(() => {
  RUNS.length = 0;
  RUNS.push(mockRun1, mockRun2, mockRun3);
});

describe("getRunsByEnv", () => {
  it("returns all runs when envIds is undefined", () => {
    const result = getRunsByEnv();
    expect(result).toHaveLength(3);
  });

  it("returns all runs when envIds is empty array", () => {
    const result = getRunsByEnv([]);
    expect(result).toHaveLength(3);
  });

  it("filters runs by a single envId", () => {
    const result = getRunsByEnv(["qa_staging"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("run_001");
  });

  it("filters runs by multiple envIds", () => {
    const result = getRunsByEnv(["qa_staging", "uat_staging"]);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no runs match", () => {
    const result = getRunsByEnv(["prod_prod"]);
    expect(result).toHaveLength(0);
  });
});

describe("getRunById", () => {
  it("returns the correct run", () => {
    const run = getRunById("run_002");
    expect(run).toBeDefined();
    expect(run!.id).toBe("run_002");
    expect(run!.env).toBe("QA");
  });

  it("returns undefined for nonexistent id", () => {
    const run = getRunById("nonexistent");
    expect(run).toBeUndefined();
  });
});

describe("computeDiffRows", () => {
  beforeEach(() => {
    // Clear memoize cache so each test gets a fresh computation
    (computeDiffRows as unknown as { clear: () => void }).clear?.();
  });

  const baseResultPass: TestResult = {
    id: "t1", testCaseId: "tc1", runId: "run_001", name: "test_alpha",
    status: "PASS", duration: 100, category: "Security", suite: "suite_a",
    evidence: { request: { method: "GET", url: "https://example.com", headers: {} }, response: { status: 200, headers: {} }, assertions: [] },
  };
  const baseResultFail: TestResult = {
    id: "t2", testCaseId: "tc2", runId: "run_001", name: "test_beta",
    status: "FAIL", duration: 200, category: "Performance", suite: "suite_a",
    evidence: { request: { method: "GET", url: "https://example.com", headers: {} }, response: { status: 500, headers: {} }, assertions: [] },
  };
  const candResultPass: TestResult = {
    id: "t3", testCaseId: "tc1", runId: "run_002", name: "test_alpha",
    status: "PASS", duration: 100, category: "Security", suite: "suite_b",
    evidence: { request: { method: "GET", url: "https://example.com", headers: {} }, response: { status: 200, headers: {} }, assertions: [] },
  };
  const candResultFail: TestResult = {
    id: "t4", testCaseId: "tc2", runId: "run_002", name: "test_beta",
    status: "PASS", duration: 300, category: "Performance", suite: "suite_b",
    evidence: { request: { method: "GET", url: "https://example.com", headers: {} }, response: { status: 200, headers: {} }, assertions: [] },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when both result sets are empty", () => {
    vi.mocked(getCachedResults).mockReturnValueOnce([]);
    vi.mocked(getCachedResults).mockReturnValueOnce([]);
    const rows = computeDiffRows("run_001", "run_002");
    expect(rows).toEqual([]);
  });

  it("marks PASS→FAIL as regression", () => {
    vi.mocked(getCachedResults).mockReturnValueOnce([baseResultPass]);
    vi.mocked(getCachedResults).mockReturnValueOnce([{ ...candResultPass, status: "FAIL" }]);
    const rows = computeDiffRows("run_001", "run_002");
    expect(rows).toHaveLength(1);
    expect(rows[0].state).toBe("regression");
    expect(rows[0].baseStatus).toBe("PASS");
    expect(rows[0].candStatus).toBe("FAIL");
  });

  it("marks FAIL→PASS as fixed", () => {
    vi.mocked(getCachedResults).mockReturnValueOnce([baseResultFail]);
    vi.mocked(getCachedResults).mockReturnValueOnce([{ ...candResultFail, status: "PASS" }]);
    const rows = computeDiffRows("run_001", "run_002");
    expect(rows).toHaveLength(1);
    expect(rows[0].state).toBe("fixed");
    expect(rows[0].baseStatus).toBe("FAIL");
    expect(rows[0].candStatus).toBe("PASS");
  });

  it("marks same status with large duration diff as duration", () => {
    vi.mocked(getCachedResults).mockReturnValueOnce([{ ...baseResultPass, duration: 100 }]);
    vi.mocked(getCachedResults).mockReturnValueOnce([{ ...candResultPass, duration: 200 }]);
    const rows = computeDiffRows("run_001", "run_002");
    expect(rows).toHaveLength(1);
    expect(rows[0].state).toBe("duration");
  });

  it("marks same status with small duration diff as unchanged", () => {
    vi.mocked(getCachedResults).mockReturnValueOnce([{ ...baseResultPass, duration: 100 }]);
    vi.mocked(getCachedResults).mockReturnValueOnce([{ ...candResultPass, duration: 105 }]);
    const rows = computeDiffRows("run_001", "run_002");
    expect(rows).toHaveLength(1);
    expect(rows[0].state).toBe("unchanged");
  });

  it("handles test present in base but missing in candidate", () => {
    vi.mocked(getCachedResults).mockReturnValueOnce([baseResultPass]);
    vi.mocked(getCachedResults).mockReturnValueOnce([]);
    const rows = computeDiffRows("run_001", "run_002");
    expect(rows).toHaveLength(1);
    expect(rows[0].baseStatus).toBe("PASS");
    expect(rows[0].candStatus).toBe("FAIL");
    expect(rows[0].state).toBe("regression");
  });

  it("handles test present in candidate but missing in base", () => {
    vi.mocked(getCachedResults).mockReturnValueOnce([]);
    vi.mocked(getCachedResults).mockReturnValueOnce([candResultPass]);
    const rows = computeDiffRows("run_001", "run_002");
    expect(rows).toHaveLength(1);
    expect(rows[0].baseStatus).toBe("FAIL");
    expect(rows[0].candStatus).toBe("PASS");
    expect(rows[0].state).toBe("fixed");
  });

  it("merges results from both runs by name", () => {
    vi.mocked(getCachedResults).mockReturnValueOnce([baseResultPass, baseResultFail]);
    vi.mocked(getCachedResults).mockReturnValueOnce([candResultPass, { ...candResultFail, status: "FAIL" }]);
    const rows = computeDiffRows("run_001", "run_002");
    expect(rows).toHaveLength(2);
  });
});

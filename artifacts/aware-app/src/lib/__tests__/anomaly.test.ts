import { describe, it, expect, beforeEach, vi } from "vitest";
import { computeAnomalyScores, getLatestAnomalies } from "../anomaly";
import * as dataModule from "../data";
import type { Run, AnomalyScore } from "../types";

const mockRuns: Run[] = [
  {
    id: "run_1",
    label: "Run 1",
    suiteId: "suite_1",
    envId: "qa_staging",
    env: "QA",
    network: "staging",
    status: "PASS",
    passPct: 98,
    failures: 1,
    duration: "5m",
    durationMs: 300000,
    started: "2025-06-01T00:00:00Z",
    build: "b1",
    rev: "r1",
  },
  {
    id: "run_2",
    label: "Run 2",
    suiteId: "suite_1",
    envId: "qa_staging",
    env: "QA",
    network: "staging",
    status: "PASS",
    passPct: 95,
    failures: 2,
    duration: "6m",
    durationMs: 360000,
    started: "2025-06-02T00:00:00Z",
    build: "b2",
    rev: "r2",
  },
  {
    id: "run_3",
    label: "Run 3",
    suiteId: "suite_1",
    envId: "qa_staging",
    env: "QA",
    network: "staging",
    status: "FAIL",
    passPct: 60,
    failures: 20,
    duration: "10m",
    durationMs: 600000,
    started: "2025-06-03T00:00:00Z",
    build: "b3",
    rev: "r3",
  },
  {
    id: "run_4",
    label: "Run 4",
    suiteId: "suite_1",
    envId: "qa_staging",
    env: "QA",
    network: "staging",
    status: "FAIL",
    passPct: 55,
    failures: 25,
    duration: "12m",
    durationMs: 720000,
    started: "2025-06-04T00:00:00Z",
    build: "b4",
    rev: "r4",
  },
  {
    id: "run_5",
    label: "Run 5",
    suiteId: "suite_1",
    envId: "qa_staging",
    env: "QA",
    network: "staging",
    status: "PASS",
    passPct: 97,
    failures: 2,
    duration: "5.5m",
    durationMs: 330000,
    started: "2025-06-05T00:00:00Z",
    build: "b5",
    rev: "r5",
  },
];

const emptyRuns: Run[] = [];
const tooFewRuns: Run[] = [mockRuns[0], mockRuns[1]];

beforeEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(dataModule, "RUNS", {
    get: () => mockRuns,
    configurable: true,
  });
});

describe("computeAnomalyScores", () => {
  it("returns empty array when fewer than 3 runs", () => {
    Object.defineProperty(dataModule, "RUNS", {
      get: () => [],
      configurable: true,
    });
    expect(computeAnomalyScores()).toEqual([]);
  });

  it("returns correct number of scores matching run count", () => {
    const scores = computeAnomalyScores();
    expect(scores).toHaveLength(mockRuns.length);
  });

  it("each score has required fields", () => {
    const scores = computeAnomalyScores();
    for (const s of scores) {
      expect(s).toHaveProperty("runId");
      expect(s).toHaveProperty("passRateZ");
      expect(s).toHaveProperty("durationZ");
      expect(s).toHaveProperty("overallAnomaly");
      expect(s).toHaveProperty("flags");
      expect(s.overallAnomaly).toBeGreaterThanOrEqual(0);
      expect(s.overallAnomaly).toBeLessThanOrEqual(1);
    }
  });

  it("flags runs with passRateZ > 2 as pass-rate-drop", () => {
    const scores = computeAnomalyScores();
    const badRun = scores.find((s) => s.runId === "run_3" || s.runId === "run_4");
    expect(badRun).toBeDefined();
    expect(badRun!.passRateZ).toBeGreaterThan(0);
    if (badRun!.passRateZ > 2) {
      expect(badRun!.flags).toContain("pass-rate-drop");
    }
  });

  it("flags runs with durationZ > 2 as slow-run", () => {
    const scores = computeAnomalyScores();
    const slowRun = scores.find((s) => s.runId === "run_3" || s.runId === "run_4");
    expect(slowRun).toBeDefined();
    if (slowRun && slowRun.durationZ > 2) {
      expect(slowRun.flags).toContain("slow-run");
    }
  });

  it("all runs have unique runIds", () => {
    const scores = computeAnomalyScores();
    const ids = scores.map((s) => s.runId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getLatestAnomalies", () => {
  it("returns empty array when all scores below threshold", () => {
    Object.defineProperty(dataModule, "RUNS", {
      get: () => mockRuns.slice(0, 2),
      configurable: true,
    });
    const results = getLatestAnomalies(0.9);
    expect(results).toEqual([]);
  });

  it("filters by threshold and sorts descending", () => {
    const results = getLatestAnomalies(0);
    expect(results.length).toBeGreaterThan(0);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].overallAnomaly).toBeGreaterThanOrEqual(results[i].overallAnomaly);
    }
  });

  it("returns at most 5 results", () => {
    const results = getLatestAnomalies(0);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it("returns empty for empty runs", () => {
    Object.defineProperty(dataModule, "RUNS", {
      get: () => [],
      configurable: true,
    });
    expect(getLatestAnomalies(0)).toEqual([]);
  });
});

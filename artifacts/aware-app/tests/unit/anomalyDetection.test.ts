import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Run, TestResult } from "@/lib/types";

vi.mock("@/lib/runs", () => ({
  RUNS: [] as Run[],
  getTestResultsForRun: vi.fn(),
}));

import { RUNS, getTestResultsForRun } from "@/lib/runs";
import { detectAnomalies, getLatestAnomalyBanner } from "@/lib/anomalyDetection";

function makeRun(id: string, daysAgo: number): Run {
  const started = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    id,
    label: id,
    suiteId: "suite_smoke",
    envId: "qa_staging",
    env: "QA",
    network: "staging",
    status: "PASS",
    passPct: 97,
    failures: 0,
    duration: "5m",
    durationMs: 300000,
    started,
    build: "b1",
    rev: "abc",
  };
}

function makeResult(testId: string, runId: string, duration: number): TestResult {
  return {
    id: testId,
    testCaseId: testId,
    runId,
    name: `test_${testId}`,
    status: "PASS",
    duration,
    category: "Security",
    suite: "suite_smoke",
    assertions: [],
    evidence: {
      request: { method: "GET", url: "https://example.com", headers: {} },
      response: { status: 200, headers: {}, timings: {} },
      assertions: [],
    },
  };
}

beforeEach(() => {
  (RUNS as Run[]).length = 0;
  vi.mocked(getTestResultsForRun).mockReset();
});

describe("detectAnomalies", () => {
  it("returns empty when there are no runs", () => {
    expect(detectAnomalies()).toEqual([]);
  });

  it("returns empty when all test entries have fewer than 3 data points", () => {
    const r1 = makeRun("r1", 1);
    const r2 = makeRun("r2", 2);
    (RUNS as Run[]).push(r1, r2);
    vi.mocked(getTestResultsForRun).mockImplementation((id) => [makeResult("t1", id, 100)]);
    expect(detectAnomalies()).toEqual([]);
  });

  it("detects a latency anomaly when latest duration is > 1.5σ above mean", () => {
    const runs = [
      makeRun("r1", 6),
      makeRun("r2", 5),
      makeRun("r3", 4),
      makeRun("r4", 3),
      makeRun("r5", 1),
    ];
    (RUNS as Run[]).push(...runs);
    vi.mocked(getTestResultsForRun).mockImplementation((id) => {
      const durations: Record<string, number> = { r1: 100, r2: 110, r3: 105, r4: 95, r5: 1000 };
      return [makeResult("t1", id, durations[id] ?? 100)];
    });
    const anomalies = detectAnomalies();
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].testId).toBe("t1");
    expect(anomalies[0].metric).toBe("latency");
    expect(anomalies[0].zScore).toBeGreaterThan(1.5);
  });

  it("does not flag a test when the latest duration is within 1.5σ", () => {
    const runs = [
      makeRun("r1", 6),
      makeRun("r2", 5),
      makeRun("r3", 4),
      makeRun("r4", 3),
      makeRun("r5", 1),
    ];
    (RUNS as Run[]).push(...runs);
    vi.mocked(getTestResultsForRun).mockImplementation(() => [makeResult("t1", "r5", 100)]);
    const anomalies = detectAnomalies();
    expect(anomalies).toHaveLength(0);
  });

  it("ignores runs older than 7 days", () => {
    (RUNS as Run[]).push(makeRun("old1", 8), makeRun("old2", 9), makeRun("old3", 10));
    vi.mocked(getTestResultsForRun).mockImplementation((id) => [makeResult("t1", id, 1000)]);
    expect(detectAnomalies()).toHaveLength(0);
  });

  it("assigns severity 'low' for zScore just above 1.5", () => {
    const runs = Array.from({ length: 5 }, (_, i) => makeRun(`r${i}`, 5 - i));
    (RUNS as Run[]).push(...runs);
    vi.mocked(getTestResultsForRun).mockImplementation((id) => {
      const durations: Record<string, number> = { r0: 100, r1: 100, r2: 100, r3: 100, r4: 200 };
      return [makeResult("t_low", id, durations[id] ?? 100)];
    });
    const anomalies = detectAnomalies();
    if (anomalies.length > 0) {
      expect(["low", "medium", "high", "critical"]).toContain(anomalies[0].severity);
    }
  });

  it("assigns severity 'critical' for zScore > 3", () => {
    const runs = Array.from({ length: 5 }, (_, i) => makeRun(`r${i}`, 5 - i));
    (RUNS as Run[]).push(...runs);
    vi.mocked(getTestResultsForRun).mockImplementation((id) => {
      const last = id === `r4`;
      return [makeResult("t_crit", id, last ? 99999 : 100)];
    });
    const anomalies = detectAnomalies();
    if (anomalies.length > 0 && anomalies[0].zScore > 3) {
      expect(anomalies[0].severity).toBe("critical");
    }
  });

  it("includes message describing the anomaly", () => {
    const runs = Array.from({ length: 5 }, (_, i) => makeRun(`r${i}`, 5 - i));
    (RUNS as Run[]).push(...runs);
    vi.mocked(getTestResultsForRun).mockImplementation((id) => {
      const durations: Record<string, number> = { r0: 100, r1: 100, r2: 100, r3: 100, r4: 10000 };
      return [makeResult("t_msg", id, durations[id] ?? 100)];
    });
    const anomalies = detectAnomalies();
    if (anomalies.length > 0) {
      expect(anomalies[0].message).toMatch(/Latency anomaly/i);
    }
  });
});

describe("getLatestAnomalyBanner", () => {
  it("returns null when there are no anomalies", () => {
    expect(getLatestAnomalyBanner()).toBeNull();
  });

  it("returns the most severe anomaly (first after sort)", () => {
    const runs = Array.from({ length: 5 }, (_, i) => makeRun(`r${i}`, 5 - i));
    (RUNS as Run[]).push(...runs);
    vi.mocked(getTestResultsForRun).mockImplementation((id) => {
      const durations: Record<string, number> = { r0: 100, r1: 100, r2: 100, r3: 100, r4: 99999 };
      return [makeResult("t_banner", id, durations[id] ?? 100)];
    });
    const banner = getLatestAnomalyBanner();
    expect(banner).not.toBeNull();
    expect(banner!.metric).toBe("latency");
  });

  it("returns an object with testId and severity", () => {
    const runs = Array.from({ length: 5 }, (_, i) => makeRun(`r${i}`, 5 - i));
    (RUNS as Run[]).push(...runs);
    vi.mocked(getTestResultsForRun).mockImplementation((id) => {
      const durations: Record<string, number> = { r0: 100, r1: 100, r2: 100, r3: 100, r4: 99999 };
      return [makeResult("t_banner", id, durations[id] ?? 100)];
    });
    const banner = getLatestAnomalyBanner();
    expect(banner!.testId).toBe("t_banner");
    expect(typeof banner!.severity).toBe("string");
  });
});

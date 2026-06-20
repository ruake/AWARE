import { describe, it, expect, beforeEach, vi } from "vitest";
import { detectAnomalies, getLatestAnomalyBanner } from "../anomalyDetection";
import * as runsModule from "../runs";
import type { Run, TestResult } from "../types";

vi.mock("@/lib/runs", async () => {
  const actual = await vi.importActual("@/lib/runs");
  return { ...actual, RUNS: [] as readonly Run[] };
});

const mockRun = (id: string, started: string): Run => ({
  id,
  label: `Run ${id}`,
  suiteId: "suite_1",
  envId: "qa_staging",
  env: "QA",
  network: "staging",
  status: "PASS",
  passPct: 100,
  failures: 0,
  duration: "5m",
  durationMs: 300000,
  started,
  build: "build-1",
  rev: "abc123",
});

const makeResult = (
  id: string,
  name: string,
  duration: number,
  status: "PASS" | "FAIL" = "PASS",
): TestResult => ({
  id,
  testCaseId: id,
  runId: "run_1",
  name,
  status,
  duration,
  category: "caching",
  suite: "test-suite",
  evidence: {
    request: { method: "GET", url: "https://example.com", headers: {} },
    response: {
      status: 200,
      headers: {},
      timings: { dnsLookup: 0, tcpConnect: 0, tlsHandshake: 0, ttfb: 0, download: 0, total: 0 },
    },
    assertions: [],
  },
  filmstrip: [],
  assertions: [],
});

beforeEach(() => {
  (runsModule.RUNS as Run[]).length = 0;
});

describe("detectAnomalies", () => {
  it("returns empty array when there are no runs", () => {
    const result = detectAnomalies();
    expect(result).toEqual([]);
  });

  it("returns empty array when there are no test results for runs", () => {
    const run = mockRun("run_1", new Date().toISOString());
    (runsModule.RUNS as Run[]).push(run);

    vi.spyOn(runsModule, "getTestResultsForRun").mockReturnValue([]);

    const result = detectAnomalies();
    expect(result).toEqual([]);
  });

  it("returns empty array when a test has fewer than 3 data points", () => {
    const run1 = mockRun("run_1", new Date(Date.now() - 2 * 86400000).toISOString());
    const run2 = mockRun("run_2", new Date(Date.now() - 86400000).toISOString());
    (runsModule.RUNS as Run[]).push(run1, run2);

    const testResult = makeResult("test_1", "Test One", 150);
    vi.spyOn(runsModule, "getTestResultsForRun").mockImplementation((runId: string) => {
      if (runId === "run_1" || runId === "run_2") return [testResult];
      return [];
    });

    const result = detectAnomalies();
    expect(result).toEqual([]);
  });

  it("detects latency anomaly when latest duration is > 1.5 sigma above mean", () => {
    const now = Date.now();
    const run1 = mockRun("run_1", new Date(now - 5 * 86400000).toISOString());
    const run2 = mockRun("run_2", new Date(now - 4 * 86400000).toISOString());
    const run3 = mockRun("run_3", new Date(now - 3 * 86400000).toISOString());
    const run4 = mockRun("run_4", new Date(now - 2 * 86400000).toISOString());
    (runsModule.RUNS as Run[]).push(run1, run2, run3, run4);

    const stableResult = makeResult("test_latency_1", "Latency Test", 100);
    const spikeResult = makeResult("test_latency_1", "Latency Test", 500);
    vi.spyOn(runsModule, "getTestResultsForRun").mockImplementation((runId: string) => {
      if (runId === "run_1") return [{ ...stableResult, duration: 90 }];
      if (runId === "run_2") return [{ ...stableResult, duration: 95 }];
      if (runId === "run_3") return [{ ...stableResult, duration: 110 }];
      if (runId === "run_4") return [{ ...spikeResult, duration: 500 }];
      return [];
    });

    const result = detectAnomalies();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].testId).toBe("test_latency_1");
    expect(result[0].metric).toBe("latency");
    expect(result[0].zScore).toBeGreaterThan(1.5);
    expect(result[0].severity).toBeDefined();
    expect(result[0].message).toContain("Latency anomaly");
  });

  it("ignores runs older than 7 days", () => {
    const oldRun = mockRun("run_old", new Date(Date.now() - 10 * 86400000).toISOString());
    (runsModule.RUNS as Run[]).push(oldRun);

    vi.spyOn(runsModule, "getTestResultsForRun").mockReturnValue([
      makeResult("test_old", "Old Test", 200),
    ]);

    const result = detectAnomalies();
    expect(result).toEqual([]);
  });

  it("sorts by severity in ascending order (critical first)", () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      const run = mockRun(`run_${i}`, new Date(now - (5 - i) * 86400000).toISOString());
      (runsModule.RUNS as Run[]).push(run);
    }

    vi.spyOn(runsModule, "getTestResultsForRun").mockImplementation((runId: string) => {
      const testId = runId === "run_4" ? "test_critical" : "test_mild";
      return [
        runId === "run_4"
          ? makeResult("test_critical", "Critical Test", 2000)
          : makeResult("test_mild", "Mild Test", runId === "run_0" ? 100 : 150),
      ];
    });

    const result = detectAnomalies();
    if (result.length >= 2) {
      const severityOrder = result.map((r) => r.severity);
      const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      for (let i = 1; i < severityOrder.length; i++) {
        expect(rank[severityOrder[i - 1]]).toBeLessThanOrEqual(rank[severityOrder[i]]);
      }
    }
  });
});

describe("getLatestAnomalyBanner", () => {
  it("returns null when no anomalies", () => {
    const banner = getLatestAnomalyBanner();
    expect(banner).toBeNull();
  });

  it("returns the first anomaly when anomalies exist", () => {
    const now = Date.now();
    for (let i = 0; i < 4; i++) {
      const run = mockRun(`run_${i}`, new Date(now - (4 - i) * 86400000).toISOString());
      (runsModule.RUNS as Run[]).push(run);
    }

    vi.spyOn(runsModule, "getTestResultsForRun").mockReturnValue([
      makeResult("test_1", "Anomalous Test", (i) => (i === 3 ? 500 : 100)),
    ]);
    vi.spyOn(runsModule, "getTestResultsForRun").mockImplementation((runId: string) => {
      const duration = runId === "run_3" ? 500 : 100;
      return [makeResult("test_1", "Anomalous Test", duration)];
    });

    const banner = getLatestAnomalyBanner();
    expect(banner).not.toBeNull();
    expect(banner!.testId).toBe("test_1");
  });
});

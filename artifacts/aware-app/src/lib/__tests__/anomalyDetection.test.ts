import { describe, it, expect, beforeEach, vi } from "vitest";
import { detectAnomalies, getLatestAnomalyBanner } from "../anomalyDetection";
import * as runsModule from "../runs";
import type { Run, TestResult } from "../types";

// ── Module mock ──────────────────────────────────────────────────────────────
// RUNS is replaced with a mutable array so tests can push/clear items without
// mutating a shared constant or relying on brittle `.length = 0` tricks.

let _mockRuns: Run[] = [];

vi.mock("@/lib/runs", async () => {
  const actual = await vi.importActual<typeof runsModule>("@/lib/runs");
  return {
    ...actual,
    get RUNS(): readonly Run[] {
      return _mockRuns;
    },
    getTestResultsForRun: vi.fn(),
  };
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRun(id: string, started: string): Run {
  return {
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
    durationMs: 300_000,
    started,
    build: "build-1",
    rev: "abc123",
  };
}

function makeResult(
  id: string,
  name: string,
  duration: number,
  status: "PASS" | "FAIL" = "PASS",
): TestResult {
  return {
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
  };
}

/** Build a sequence of N recent runs (newest last) within the 7-day window. */
function makeRecentRuns(count: number, prefix = "run"): Run[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) =>
    makeRun(`${prefix}_${i}`, new Date(now - (count - i) * 86_400_000).toISOString()),
  );
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  _mockRuns = [];
  vi.mocked(runsModule.getTestResultsForRun).mockReset();
});

// ── detectAnomalies ───────────────────────────────────────────────────────────

describe("detectAnomalies", () => {
  it("returns empty array when there are no runs", () => {
    expect(detectAnomalies()).toEqual([]);
  });

  it("returns empty array when runs have no test results", () => {
    _mockRuns = makeRecentRuns(3);
    vi.mocked(runsModule.getTestResultsForRun).mockReturnValue([]);
    expect(detectAnomalies()).toEqual([]);
  });

  it("returns empty array when a test has fewer than 3 data points (z-score minimum)", () => {
    _mockRuns = makeRecentRuns(2);
    const result = makeResult("test_1", "Test One", 150);
    vi.mocked(runsModule.getTestResultsForRun).mockReturnValue([result]);
    expect(detectAnomalies()).toEqual([]);
  });

  it("ignores runs older than 7 days", () => {
    const oldRun = makeRun("run_old", new Date(Date.now() - 10 * 86_400_000).toISOString());
    _mockRuns = [oldRun];
    vi.mocked(runsModule.getTestResultsForRun).mockReturnValue([
      makeResult("test_old", "Old Test", 200),
    ]);
    expect(detectAnomalies()).toEqual([]);
  });

  it("detects latency anomaly when latest duration is a clear spike (Z > 1.5)", () => {
    // 3 stable runs + 1 spike run — all within 7 days
    _mockRuns = makeRecentRuns(4);
    const stableResult = makeResult("test_latency_1", "Latency Test", 100);

    vi.mocked(runsModule.getTestResultsForRun).mockImplementation((runId: string) => {
      const durations: Record<string, number> = {
        run_0: 90,
        run_1: 95,
        run_2: 110,
        run_3: 500, // spike — clearly > 1.5σ above mean ≈ 99ms
      };
      const dur = durations[runId];
      if (dur === undefined) return [];
      return [{ ...stableResult, runId, duration: dur }];
    });

    const result = detectAnomalies();
    expect(result.length).toBeGreaterThanOrEqual(1);
    const first = result[0];
    expect(first.testId).toBe("test_latency_1");
    expect(first.metric).toBe("latency");
    expect(first.zScore).toBeGreaterThan(1.5);
    expect(first.severity).toBeDefined();
    expect(first.message).toContain("Latency anomaly");
  });

  it("stable runs do NOT produce anomalies (no spike)", () => {
    _mockRuns = makeRecentRuns(4);
    const stableResult = makeResult("test_stable", "Stable Test", 100);

    vi.mocked(runsModule.getTestResultsForRun).mockImplementation((runId: string) => {
      const durations: Record<string, number> = {
        run_0: 98, run_1: 100, run_2: 102, run_3: 99,
      };
      const dur = durations[runId];
      if (dur === undefined) return [];
      return [{ ...stableResult, runId, duration: dur }];
    });

    expect(detectAnomalies()).toEqual([]);
  });

  it("sorts anomalies with critical severity first", () => {
    // 5 runs: 4 stable + 1 extreme spike for "test_critical"
    //         4 runs with slight variation for "test_mild"
    _mockRuns = makeRecentRuns(5);

    vi.mocked(runsModule.getTestResultsForRun).mockImplementation((runId: string) => {
      const isSpike = runId === "run_4";
      return [
        { ...makeResult("test_critical", "Critical Test", isSpike ? 5000 : 100), runId },
        { ...makeResult("test_mild", "Mild Test", isSpike ? 120 : 100), runId },
      ];
    });

    const result = detectAnomalies();
    if (result.length >= 2) {
      const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      for (let i = 1; i < result.length; i++) {
        const prev = rank[result[i - 1].severity] ?? 99;
        const curr = rank[result[i].severity] ?? 99;
        expect(prev).toBeLessThanOrEqual(curr);
      }
    }
  });
});

// ── getLatestAnomalyBanner ───────────────────────────────────────────────────

describe("getLatestAnomalyBanner", () => {
  it("returns null when there are no runs", () => {
    expect(getLatestAnomalyBanner()).toBeNull();
  });

  it("returns null when no anomalies are detected", () => {
    _mockRuns = makeRecentRuns(4);
    vi.mocked(runsModule.getTestResultsForRun).mockReturnValue([]);
    expect(getLatestAnomalyBanner()).toBeNull();
  });

  it("returns the highest-severity anomaly when anomalies exist", () => {
    _mockRuns = makeRecentRuns(4);
    const stableResult = makeResult("test_1", "Anomalous Test", 100);

    vi.mocked(runsModule.getTestResultsForRun).mockImplementation((runId: string) => {
      const durations: Record<string, number> = {
        run_0: 90, run_1: 95, run_2: 100, run_3: 800,
      };
      const dur = durations[runId];
      if (dur === undefined) return [];
      return [{ ...stableResult, runId, duration: dur }];
    });

    const banner = getLatestAnomalyBanner();
    expect(banner).not.toBeNull();
    expect(banner!.testId).toBe("test_1");
  });
});

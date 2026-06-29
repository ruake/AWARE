import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/data", () => ({
  RUNS: [],
}));

import { RUNS } from "@/lib/data";
import { computeAnomalyScores, getLatestAnomalies } from "@/lib/anomaly";
import type { Run } from "@/lib/types";

function makeRun(overrides: Partial<Run> & { id: string }): Run {
  return {
    label: overrides.id,
    suiteId: "suite_smoke",
    envId: "qa_staging",
    env: "QA",
    network: "staging",
    status: "PASS",
    passPct: 97,
    failures: 0,
    duration: "5m",
    durationMs: 300000,
    started: "2026-06-01T10:00:00Z",
    build: "b1",
    rev: "abc",
    ...overrides,
  };
}

beforeEach(() => {
  (RUNS as Run[]).length = 0;
});

describe("computeAnomalyScores", () => {
  it("returns empty array when there are fewer than 3 runs", () => {
    (RUNS as Run[]).push(makeRun({ id: "r1" }), makeRun({ id: "r2" }));
    expect(computeAnomalyScores()).toEqual([]);
  });

  it("returns a score per run when there are 3+ runs", () => {
    (RUNS as Run[]).push(
      makeRun({ id: "r1" }),
      makeRun({ id: "r2" }),
      makeRun({ id: "r3" }),
    );
    const scores = computeAnomalyScores();
    expect(scores).toHaveLength(3);
    scores.forEach((s) => expect(s).toHaveProperty("runId"));
  });

  it("produces overallAnomaly in [0, 1]", () => {
    (RUNS as Run[]).push(
      makeRun({ id: "r1", passPct: 100, durationMs: 100000, failures: 0 }),
      makeRun({ id: "r2", passPct: 90, durationMs: 200000, failures: 1 }),
      makeRun({ id: "r3", passPct: 50, durationMs: 900000, failures: 10 }),
    );
    const scores = computeAnomalyScores();
    scores.forEach((s) => {
      expect(s.overallAnomaly).toBeGreaterThanOrEqual(0);
      expect(s.overallAnomaly).toBeLessThanOrEqual(1);
    });
  });

  it("flags 'pass-rate-drop' when passRateZ > 2", () => {
    // Need enough runs so z-score of the outlier exceeds 2:
    // 5 runs @ 100 + 1 run @ 40 → z ≈ 2.24
    (RUNS as Run[]).push(
      makeRun({ id: "r1", passPct: 100 }),
      makeRun({ id: "r2", passPct: 100 }),
      makeRun({ id: "r3", passPct: 100 }),
      makeRun({ id: "r4", passPct: 100 }),
      makeRun({ id: "r5", passPct: 100 }),
      makeRun({ id: "r6", passPct: 40 }),
    );
    const scores = computeAnomalyScores();
    const low = scores.find((s) => s.runId === "r6")!;
    expect(low.flags).toContain("pass-rate-drop");
  });

  it("flags 'slow-run' when durationZ > 2", () => {
    // 5 runs @ 100000ms + 1 run @ 500000ms → z ≈ 2.24
    (RUNS as Run[]).push(
      makeRun({ id: "r1", durationMs: 100000 }),
      makeRun({ id: "r2", durationMs: 100000 }),
      makeRun({ id: "r3", durationMs: 100000 }),
      makeRun({ id: "r4", durationMs: 100000 }),
      makeRun({ id: "r5", durationMs: 100000 }),
      makeRun({ id: "r6", durationMs: 500000 }),
    );
    const scores = computeAnomalyScores();
    const slow = scores.find((s) => s.runId === "r6")!;
    expect(slow.flags).toContain("slow-run");
  });

  it("flags 'high-failures' when failures are > 2× average", () => {
    (RUNS as Run[]).push(
      makeRun({ id: "r1", failures: 1 }),
      makeRun({ id: "r2", failures: 1 }),
      makeRun({ id: "r3", failures: 10 }),
    );
    const scores = computeAnomalyScores();
    const bad = scores.find((s) => s.runId === "r3")!;
    expect(bad.flags).toContain("high-failures");
  });

  it("produces passRateZ > 0 for below-average pass rate", () => {
    (RUNS as Run[]).push(
      makeRun({ id: "r1", passPct: 100 }),
      makeRun({ id: "r2", passPct: 100 }),
      makeRun({ id: "r3", passPct: 70 }),
    );
    const scores = computeAnomalyScores();
    const below = scores.find((s) => s.runId === "r3")!;
    expect(below.passRateZ).toBeGreaterThan(0);
  });

  it("produces durationZ > 0 for above-average duration", () => {
    (RUNS as Run[]).push(
      makeRun({ id: "r1", durationMs: 100000 }),
      makeRun({ id: "r2", durationMs: 100000 }),
      makeRun({ id: "r3", durationMs: 500000 }),
    );
    const scores = computeAnomalyScores();
    const slow = scores.find((s) => s.runId === "r3")!;
    expect(slow.durationZ).toBeGreaterThan(0);
  });

  it("returns no flags for uniform runs", () => {
    (RUNS as Run[]).push(
      makeRun({ id: "r1", passPct: 97, durationMs: 300000, failures: 1 }),
      makeRun({ id: "r2", passPct: 97, durationMs: 300000, failures: 1 }),
      makeRun({ id: "r3", passPct: 97, durationMs: 300000, failures: 1 }),
    );
    const scores = computeAnomalyScores();
    scores.forEach((s) => expect(s.flags).toHaveLength(0));
  });
});

describe("getLatestAnomalies", () => {
  it("returns empty array when fewer than 3 runs", () => {
    (RUNS as Run[]).push(makeRun({ id: "r1" }), makeRun({ id: "r2" }));
    expect(getLatestAnomalies()).toEqual([]);
  });

  it("filters results below the threshold", () => {
    (RUNS as Run[]).push(
      makeRun({ id: "r1", passPct: 97, durationMs: 300000, failures: 0 }),
      makeRun({ id: "r2", passPct: 97, durationMs: 300000, failures: 0 }),
      makeRun({ id: "r3", passPct: 97, durationMs: 300000, failures: 0 }),
    );
    const result = getLatestAnomalies(0.5);
    result.forEach((s) => expect(s.overallAnomaly).toBeGreaterThan(0.5));
  });

  it("sorts results by overallAnomaly descending", () => {
    (RUNS as Run[]).push(
      makeRun({ id: "r1", passPct: 100, durationMs: 100000, failures: 0 }),
      makeRun({ id: "r2", passPct: 100, durationMs: 100000, failures: 0 }),
      makeRun({ id: "r3", passPct: 30, durationMs: 3000000, failures: 20 }),
      makeRun({ id: "r4", passPct: 70, durationMs: 800000, failures: 5 }),
      makeRun({ id: "r5", passPct: 60, durationMs: 1200000, failures: 8 }),
    );
    const result = getLatestAnomalies(0);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].overallAnomaly).toBeGreaterThanOrEqual(result[i].overallAnomaly);
    }
  });

  it("considers only the last 5 scored runs", () => {
    for (let i = 0; i < 8; i++) {
      (RUNS as Run[]).push(makeRun({ id: `r${i}`, passPct: 97, durationMs: 300000, failures: 0 }));
    }
    const result = getLatestAnomalies(0);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

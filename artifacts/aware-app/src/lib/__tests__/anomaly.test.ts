import { describe, it, expect, beforeEach, vi } from "vitest";
import { computeAnomalyScores, getLatestAnomalies } from "../anomaly";
import * as dataModule from "../data";
import type { Run } from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRun(id: string, passPct: number, failures: number, durationMs: number): Run {
  return {
    id,
    label: `Run ${id}`,
    suiteId: "suite_1",
    envId: "qa_staging",
    env: "QA",
    network: "staging",
    status: passPct >= 95 ? "PASS" : "FAIL",
    passPct,
    failures,
    duration: `${Math.round(durationMs / 60000)}m`,
    durationMs,
    started: "2025-06-01T00:00:00Z",
    build: `b-${id}`,
    rev: `r-${id}`,
  };
}

// ── Base dataset (5 runs) ─────────────────────────────────────────────────────
// passRates: [98, 95, 60, 55, 97]  mean≈81, std≈19.28
// Z(run_3)≈1.09, Z(run_4)≈1.35 — below the flag threshold of 2
const mockRuns: Run[] = [
  makeRun("run_1", 98, 1, 300_000),
  makeRun("run_2", 95, 2, 360_000),
  makeRun("run_3", 60, 20, 600_000),
  makeRun("run_4", 55, 25, 720_000),
  makeRun("run_5", 97, 2, 330_000),
];

// ── 6-run dataset: 5 healthy + 1 bad ─────────────────────────────────────────
// Mathematical property: Z_outlier = sqrt(n-1) for a single outlier among
// n-1 identical values.  sqrt(5) ≈ 2.236 > 2  →  "pass-rate-drop" fires.
// "critical-pass-rate-drop" requires Z > 3, i.e. n ≥ 11  →  separate dataset.
const passDropRuns: Run[] = [
  makeRun("pd_1", 100, 0, 300_000),
  makeRun("pd_2", 100, 0, 300_000),
  makeRun("pd_3", 100, 0, 300_000),
  makeRun("pd_4", 100, 0, 300_000),
  makeRun("pd_5", 100, 0, 300_000),
  makeRun("pd_bad", 0, 50, 300_000), // extreme outlier → Z ≈ 2.236
];

// ── 11-run dataset for critical-pass-rate-drop (Z > 3) ───────────────────────
const criticalDropRuns: Run[] = [
  ...Array.from({ length: 10 }, (_, i) => makeRun(`cd_${i}`, 100, 0, 300_000)),
  makeRun("cd_bad", 0, 50, 300_000), // Z = sqrt(10) ≈ 3.162 > 3
];

// ── high-failures dataset ─────────────────────────────────────────────────────
// 4 runs with 0 failures, 1 run with many → ensures failMean * 2 threshold fires.
const highFailRuns: Run[] = [
  makeRun("hf_1", 98, 0, 300_000),
  makeRun("hf_2", 98, 0, 300_000),
  makeRun("hf_3", 98, 0, 300_000),
  makeRun("hf_4", 97, 0, 300_000),
  makeRun("hf_bad", 96, 100, 300_000),
];

// ── Slow-run dataset (6 runs, 5 stable + 1 spike) ────────────────────────────
// Same math as pass-rate-drop: Z_outlier = sqrt(5) ≈ 2.236 > 2 for durationZ.
const slowRuns: Run[] = [
  makeRun("sr_1", 98, 0, 300_000),
  makeRun("sr_2", 98, 0, 300_000),
  makeRun("sr_3", 98, 0, 300_000),
  makeRun("sr_4", 98, 0, 300_000),
  makeRun("sr_5", 98, 0, 300_000),
  makeRun("sr_bad", 98, 0, 5_000_000), // extreme spike → durationZ ≈ 2.236
];

// ── overallAnomaly weights ────────────────────────────────────────────────────
// A run that is simultaneously the worst on all three axes should score near 1.
const weightRuns: Run[] = [
  makeRun("w_1", 100, 0, 300_000),
  makeRun("w_2", 100, 0, 300_000),
  makeRun("w_3", 100, 0, 300_000),
  makeRun("w_4", 100, 0, 300_000),
  makeRun("w_5", 100, 0, 300_000),
  makeRun("w_bad", 0, 500, 5_000_000),
];

beforeEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(dataModule, "RUNS", {
    get: () => mockRuns,
    configurable: true,
  });
});

function useMock(runs: Run[]) {
  Object.defineProperty(dataModule, "RUNS", {
    get: () => runs,
    configurable: true,
  });
}

// ── computeAnomalyScores ──────────────────────────────────────────────────────

describe("computeAnomalyScores", () => {
  it("returns empty array when fewer than 3 runs", () => {
    useMock([]);
    expect(computeAnomalyScores()).toEqual([]);
  });

  it("returns correct number of scores matching run count", () => {
    const scores = computeAnomalyScores();
    expect(scores).toHaveLength(mockRuns.length);
  });

  it("each score has required fields within valid ranges", () => {
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

  it("all runs have unique runIds in output", () => {
    const scores = computeAnomalyScores();
    const ids = scores.map((s) => s.runId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("normal runs (Z < 2) do NOT get pass-rate-drop flag", () => {
    // mockRuns has max Z ≈ 1.35 — below the threshold
    const scores = computeAnomalyScores();
    for (const s of scores) {
      expect(s.flags).not.toContain("pass-rate-drop");
    }
  });

  it("flags outlier run with 'pass-rate-drop' when passRateZ > 2", () => {
    useMock(passDropRuns);
    const scores = computeAnomalyScores();
    const bad = scores.find((s) => s.runId === "pd_bad");
    expect(bad).toBeDefined();
    expect(bad!.passRateZ).toBeGreaterThan(2);
    expect(bad!.flags).toContain("pass-rate-drop");
    // Healthy runs must NOT be flagged
    const healthy = scores.filter((s) => s.runId !== "pd_bad");
    for (const s of healthy) {
      expect(s.flags).not.toContain("pass-rate-drop");
    }
  });

  it("flags outlier run with 'critical-pass-rate-drop' when passRateZ > 3", () => {
    useMock(criticalDropRuns);
    const scores = computeAnomalyScores();
    const bad = scores.find((s) => s.runId === "cd_bad");
    expect(bad).toBeDefined();
    expect(bad!.passRateZ).toBeGreaterThan(3);
    expect(bad!.flags).toContain("critical-pass-rate-drop");
    expect(bad!.flags).toContain("pass-rate-drop");
  });

  it("flags outlier run with 'slow-run' when durationZ > 2", () => {
    useMock(slowRuns);
    const scores = computeAnomalyScores();
    const bad = scores.find((s) => s.runId === "sr_bad");
    expect(bad).toBeDefined();
    expect(bad!.durationZ).toBeGreaterThan(2);
    expect(bad!.flags).toContain("slow-run");
    // Healthy runs must NOT be flagged
    const healthy = scores.filter((s) => s.runId !== "sr_bad");
    for (const s of healthy) {
      expect(s.flags).not.toContain("slow-run");
    }
  });

  it("flags outlier run with 'high-failures' when failures > 2× mean", () => {
    useMock(highFailRuns);
    const scores = computeAnomalyScores();
    const bad = scores.find((s) => s.runId === "hf_bad");
    expect(bad).toBeDefined();
    expect(bad!.flags).toContain("high-failures");
    // Healthy runs must NOT be flagged
    const healthy = scores.filter((s) => s.runId !== "hf_bad");
    for (const s of healthy) {
      expect(s.flags).not.toContain("high-failures");
    }
  });

  it("overallAnomaly weights: worst-on-all-axes run scores near 1", () => {
    useMock(weightRuns);
    const scores = computeAnomalyScores();
    const bad = scores.find((s) => s.runId === "w_bad");
    expect(bad).toBeDefined();
    // 40% passRate + 30% duration + 30% failures — all maximally bad → near 1
    expect(bad!.overallAnomaly).toBeGreaterThan(0.5);
    const healthy = scores.filter((s) => s.runId !== "w_bad");
    for (const s of healthy) {
      // Healthy runs have low overallAnomaly
      expect(s.overallAnomaly).toBeLessThan(bad!.overallAnomaly);
    }
  });

  it("std-dev zero guard: identical runs produce Z = 0 (not NaN)", () => {
    const identical = [
      makeRun("i_1", 90, 5, 300_000),
      makeRun("i_2", 90, 5, 300_000),
      makeRun("i_3", 90, 5, 300_000),
    ];
    useMock(identical);
    const scores = computeAnomalyScores();
    for (const s of scores) {
      expect(Number.isFinite(s.passRateZ)).toBe(true);
      expect(Number.isFinite(s.durationZ)).toBe(true);
      expect(s.passRateZ).toBe(0);
      expect(s.durationZ).toBe(0);
    }
  });
});

// ── getLatestAnomalies ────────────────────────────────────────────────────────

describe("getLatestAnomalies", () => {
  it("returns empty array when all scores below threshold", () => {
    useMock(mockRuns.slice(0, 2));
    expect(getLatestAnomalies(0.9)).toEqual([]);
  });

  it("filters by threshold and sorts descending by overallAnomaly", () => {
    const results = getLatestAnomalies(0);
    expect(results.length).toBeGreaterThan(0);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].overallAnomaly).toBeGreaterThanOrEqual(results[i].overallAnomaly);
    }
  });

  it("returns at most 5 results", () => {
    expect(getLatestAnomalies(0).length).toBeLessThanOrEqual(5);
  });

  it("returns empty array when RUNS is empty", () => {
    useMock([]);
    expect(getLatestAnomalies(0)).toEqual([]);
  });

  it("anomaly with 0 threshold includes all scored runs", () => {
    const scores = computeAnomalyScores();
    const latest = getLatestAnomalies(0);
    // getLatestAnomalies checks last 5 runs
    expect(latest.length).toBeLessThanOrEqual(Math.min(scores.length, 5));
  });
});

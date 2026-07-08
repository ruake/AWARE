import type { Run, AnomalyScore } from "@/lib/types";
import { RUNS } from "@/lib/data";

export function computeAnomalyScores(): AnomalyScore[] {
  const runs = [...RUNS];
  if (runs.length < 3) return [];

  const passPcts = runs.map((r) => r.passPct);
  const durations = runs.map((r) => r.durationMs);
  const failures = runs.map((r) => r.failures);

  const meanPass = passPcts.reduce((a, b) => a + b, 0) / passPcts.length;
  const stdPass =
    Math.sqrt(passPcts.reduce((s, v) => s + (v - meanPass) ** 2, 0) / passPcts.length) || 1;

  const meanDur = durations.reduce((a, b) => a + b, 0) / durations.length;
  const stdDur =
    Math.sqrt(durations.reduce((s, v) => s + (v - meanDur) ** 2, 0) / durations.length) || 1;

  const meanFail = failures.reduce((a, b) => a + b, 0) / failures.length;

  return runs.map((r) => {
    const passRateZ = stdPass > 0 ? (meanPass - r.passPct) / stdPass : 0;
    const durationZ = stdDur > 0 ? (r.durationMs - meanDur) / stdDur : 0;
    const flags: string[] = [];
    if (passRateZ > 2) flags.push("pass-rate-drop");
    if (durationZ > 2) flags.push("slow-run");
    if (r.failures > meanFail * 2) flags.push("high-failures");

    const overallAnomaly = Math.min(1, Math.max(0, (passRateZ + durationZ) / 6));

    return { runId: r.id, passRateZ, durationZ, overallAnomaly, flags };
  });
}

export function getLatestAnomalies(threshold = 0): AnomalyScore[] {
  const scores = computeAnomalyScores();
  return scores
    .filter((s) => s.overallAnomaly >= threshold)
    .sort((a, b) => b.overallAnomaly - a.overallAnomaly)
    .slice(0, 5);
}

export interface RunAnomaly {
  runId: string;
  passPct: number;
  zScore: number;
  anomalous: boolean;
}

export function detectRunAnomalies(runs: Run[], threshold: number = 2): RunAnomaly[] {
  const passPcts = runs.map((r) => r.passPct);
  const mean = passPcts.reduce((s, v) => s + v, 0) / passPcts.length;
  const std = Math.sqrt(passPcts.reduce((s, v) => s + (v - mean) ** 2, 0) / passPcts.length);
  if (std === 0)
    return runs.map((r) => ({ runId: r.id, passPct: r.passPct, zScore: 0, anomalous: false }));
  return runs.map((r) => {
    const zScore = (r.passPct - mean) / std;
    return { runId: r.id, passPct: r.passPct, zScore, anomalous: Math.abs(zScore) > threshold };
  });
}

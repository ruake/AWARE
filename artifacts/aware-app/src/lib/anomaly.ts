import { RUNS } from "@/lib/data";
import type { AnomalyScore } from "./types";

/**
 * Compute z-scores for each run based on pass rate and duration.
 * Positive z-score means worse than average (lower pass rate, longer duration).
 */
export function computeAnomalyScores(): AnomalyScore[] {
  if (RUNS.length < 3) return [];

  const passRates = RUNS.map(r => r.passPct);
  const durations = RUNS.map(r => r.durationMs);
  const n = RUNS.length;

  const passMean = passRates.reduce((s, v) => s + v, 0) / n;
  const passStd = Math.sqrt(passRates.reduce((s, v) => s + (v - passMean) ** 2, 0) / n) || 1;

  const durMean = durations.reduce((s, v) => s + v, 0) / n;
  const durStd = Math.sqrt(durations.reduce((s, v) => s + (v - durMean) ** 2, 0) / n) || 1;

  return RUNS.map((run, i) => {
    const passRateZ = (passMean - run.passPct) / passStd;
    const durationZ = (run.durationMs - durMean) / durStd;

    const flags: string[] = [];
    if (passRateZ > 2) flags.push("pass-rate-drop");
    if (passRateZ > 3) flags.push("critical-pass-rate-drop");
    if (durationZ > 2) flags.push("slow-run");
    if (run.failures > RUNS.reduce((s, r) => s + r.failures, 0) / n * 2) flags.push("high-failures");

    const overallAnomaly = Math.min(1, Math.max(0,
      (passRateZ * 0.4 + durationZ * 0.3 + (run.failures / (Math.max(...RUNS.map(r => r.failures)) || 1)) * 0.3) / 3
    ));

    return { runId: run.id, passRateZ, durationZ, overallAnomaly, flags };
  });
}

export function getLatestAnomalies(threshold = 0.5): AnomalyScore[] {
  const scores = computeAnomalyScores();
  const latest = scores.slice(-5).filter(s => s.overallAnomaly > threshold);
  return latest.sort((a, b) => b.overallAnomaly - a.overallAnomaly);
}

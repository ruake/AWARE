import type { Run, TestResult, AnomalyBanner } from "@/lib/types";
import { RUNS, getTestResultsForRun } from "@/lib/runs";

export interface AnomalyResult {
  testId: string;
  testName: string;
  zScore: number;
  passRate: number;
  avgPassRate: number;
  anomalous: boolean;
  direction: "up" | "down" | null;
}

export interface DurationAnomaly {
  testId: string;
  metric: string;
  zScore: number;
  severity: string;
  message: string;
  latestValue: number;
  mean: number;
  stdDev: number;
  runId: string;
}

export function detectPassRateAnomaly(
  currentPassRate: number,
  history: number[],
  threshold: number = 2,
): { zScore: number; anomalous: boolean } {
  if (history.length < 3) return { zScore: 0, anomalous: false };
  const mean = history.reduce((s, v) => s + v, 0) / history.length;
  const std = Math.sqrt(history.reduce((s, v) => s + (v - mean) ** 2, 0) / history.length);
  if (std === 0) return { zScore: 0, anomalous: false };
  const zScore = (currentPassRate - mean) / std;
  return { zScore, anomalous: Math.abs(zScore) > threshold };
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function detectAnomalies(): DurationAnomaly[] {
  const recentRuns = [...RUNS].filter(
    (r) => Date.now() - new Date(r.started).getTime() < SEVEN_DAYS_MS,
  );
  if (recentRuns.length < 3) return [];

  const testDurations = new Map<string, number[]>();

  for (const run of recentRuns) {
    const testResults = getTestResultsForRun(run.id);
    for (const tr of testResults) {
      if (!testDurations.has(tr.testCaseId)) testDurations.set(tr.testCaseId, []);
      testDurations.get(tr.testCaseId)!.push(tr.duration);
    }
  }

  const results: DurationAnomaly[] = [];

  for (const [testId, durations] of testDurations) {
    if (durations.length < 3) continue;
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const stdDev =
      Math.sqrt(durations.reduce((s, v) => s + (v - mean) ** 2, 0) / durations.length) || 1;
    const latest = durations[durations.length - 1];
    const zScore = (latest - mean) / stdDev;

    if (zScore > 1.5) {
      let severity = "low";
      if (zScore > 3) severity = "critical";
      else if (zScore > 2.5) severity = "high";
      else if (zScore > 2) severity = "medium";

      results.push({
        testId,
        metric: "latency",
        zScore,
        severity,
        message: `Latency anomaly detected for test ${testId} (z=${zScore.toFixed(2)})`,
        latestValue: latest,
        mean,
        stdDev,
        runId: recentRuns[recentRuns.length - 1].id,
      });
    }
  }

  const severityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  results.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return results;
}

export function getLatestAnomalyBanner(): AnomalyBanner | null {
  const anomalies = detectAnomalies();
  if (anomalies.length === 0) return null;
  const top = anomalies[0];
  return {
    testId: top.testId,
    metric: top.metric,
    message: top.message,
    severity: top.severity,
  };
}

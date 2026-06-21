import { RUNS, getTestResultsForRun } from "@/lib/runs";
import { AnomalyDetector, ZScoreStrategy } from "./anomaly/index";
import type { AnomalyEntry, AnomalyResult } from "./anomaly/index";

export type AnomalyDetectionResult = AnomalyResult;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function detectAnomalies(): AnomalyDetectionResult[] {
  const now = Date.now();
  const cutoff = now - SEVEN_DAYS_MS;

  const testEntries = new Map<string, AnomalyEntry[]>();

  for (const run of RUNS) {
    const runTime = new Date(run.started).getTime();
    if (runTime < cutoff) continue;

    const results = getTestResultsForRun(run.id);
    for (const result of results) {
      if (!testEntries.has(result.id)) {
        testEntries.set(result.id, []);
      }
      testEntries.get(result.id)!.push({
        name: result.name,
        duration: result.duration,
        started: run.started,
      });
    }
  }

  // Sort entries by time before detection
  for (const entries of testEntries.values()) {
    entries.sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime());
  }

  const detector = new AnomalyDetector([new ZScoreStrategy(1.5)]);
  return detector.detectAll(testEntries);
}

export function getLatestAnomalyBanner(): AnomalyDetectionResult | null {
  const anomalies = detectAnomalies();
  return anomalies.length > 0 ? anomalies[0] : null;
}

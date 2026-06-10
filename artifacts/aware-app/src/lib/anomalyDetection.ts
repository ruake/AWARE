import { RUNS, getTestResultsForRun } from "@/lib/runs";

export interface AnomalyDetectionResult {
  testId: string;
  testName: string;
  metric: "latency" | "pass-rate";
  zScore: number;
  severity: "low" | "medium" | "high" | "critical";
  lastValue: number;
  avgValue: number;
  stdDev: number;
  message: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function computeSeverity(zScore: number): AnomalyDetectionResult["severity"] {
  if (zScore > 3) return "critical";
  if (zScore > 2.5) return "high";
  if (zScore > 2) return "medium";
  if (zScore > 1.5) return "low";
  return "low";
}

export function detectAnomalies(): AnomalyDetectionResult[] {
  const now = Date.now();
  const cutoff = now - SEVEN_DAYS_MS;

  const testEntries = new Map<string, { name: string; duration: number; started: string }[]>();

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

  const anomalies: AnomalyDetectionResult[] = [];

  for (const [testId, entries] of testEntries) {
    if (entries.length < 3) continue;

    entries.sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime());

    const durations = entries.map((e) => e.duration);
    const n = durations.length;
    const mean = durations.reduce((s, v) => s + v, 0) / n;
    const variance = durations.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance) || 1;

    const latest = entries[entries.length - 1];
    const zScore = (latest.duration - mean) / stdDev;

    if (zScore > 1.5) {
      anomalies.push({
        testId,
        testName: latest.name,
        metric: "latency",
        zScore,
        severity: computeSeverity(zScore),
        lastValue: latest.duration,
        avgValue: Math.round(mean),
        stdDev: Math.round(stdDev),
        message: `Latency anomaly: ${latest.name} is ${zScore.toFixed(1)}σ above average`,
      });
    }
  }

  const severityRank: Record<AnomalyDetectionResult["severity"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return anomalies.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

export function getLatestAnomalyBanner(): AnomalyDetectionResult | null {
  const anomalies = detectAnomalies();
  return anomalies.length > 0 ? anomalies[0] : null;
}

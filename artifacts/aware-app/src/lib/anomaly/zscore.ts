import { AnomalyEntry, AnomalyResult, AnomalyStrategy } from "./types";

export class ZScoreStrategy implements AnomalyStrategy {
  readonly name = "Z-Score Strategy";
  readonly description = "Detects anomalies based on standard deviation from the mean.";

  constructor(private threshold: number = 1.5) {}

  private computeSeverity(zScore: number): AnomalyResult["severity"] {
    if (zScore > 3) return "critical";
    if (zScore > 2.5) return "high";
    if (zScore > 2) return "medium";
    return "low";
  }

  detect(testId: string, entries: AnomalyEntry[]): AnomalyResult | null {
    if (entries.length < 3) return null;

    const durations = entries.map((e) => e.duration);
    const n = durations.length;
    const mean = durations.reduce((s, v) => s + v, 0) / n;
    const variance = durations.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance) || 1;

    const latest = entries[entries.length - 1];
    const zScore = (latest.duration - mean) / stdDev;

    if (zScore > this.threshold) {
      return {
        testId,
        testName: latest.name,
        metric: "latency",
        zScore,
        severity: this.computeSeverity(zScore),
        lastValue: latest.duration,
        avgValue: Math.round(mean),
        stdDev: Math.round(stdDev),
        message: `Latency anomaly: ${latest.name} is ${zScore.toFixed(1)}σ above average`,
      };
    }

    return null;
  }
}

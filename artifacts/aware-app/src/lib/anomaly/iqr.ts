import type { AnomalyEntry, AnomalyResult, AnomalyStrategy } from "./types";

export class IQRStrategy implements AnomalyStrategy {
  readonly name = "IQR Strategy";
  readonly description = "Detects outliers using the Interquartile Range method.";

  constructor(private factor: number = 1.5) {}

  detect(testId: string, entries: AnomalyEntry[]): AnomalyResult | null {
    if (entries.length < 4) return null; // IQR usually needs at least 4 points

    const durations = [...entries.map((e) => e.duration)].sort((a, b) => a - b);
    const n = durations.length;

    const q1 = durations[Math.floor(n * 0.25)];
    const q3 = durations[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const upperLimit = q3 + this.factor * iqr;

    const latest = entries[entries.length - 1];
    
    if (latest.duration > upperLimit) {
      // For compatibility with AnomalyResult, we calculate a pseudo z-score
      // or just use a value that indicates it's above the threshold.
      // Since AnomalyResult requires a zScore, we'll estimate one or just use 2.0 as a baseline for "medium" severity if it's an outlier.
      const mean = durations.reduce((s, v) => s + v, 0) / n;
      const variance = durations.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
      const stdDev = Math.sqrt(variance) || 1;
      const zScore = (latest.duration - mean) / stdDev;

      return {
        testId,
        testName: latest.name,
        metric: "latency",
        zScore,
        severity: zScore > 3 ? "critical" : (zScore > 2.5 ? "high" : "medium"),
        lastValue: latest.duration,
        avgValue: Math.round(mean),
        stdDev: Math.round(stdDev),
        message: `Latency anomaly (IQR): ${latest.name} is above the upper bound of ${Math.round(upperLimit)}ms`,
      };
    }

    return null;
  }
}

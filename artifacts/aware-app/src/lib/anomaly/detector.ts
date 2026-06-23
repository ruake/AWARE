import type { AnomalyEntry, AnomalyResult, AnomalyStrategy } from "./types";

export class AnomalyDetector {
  private strategies: AnomalyStrategy[];

  constructor(strategies: AnomalyStrategy[]) {
    this.strategies = strategies;
  }

  detect(testId: string, entries: AnomalyEntry[]): AnomalyResult | null {
    const results: AnomalyResult[] = [];

    for (const strategy of this.strategies) {
      const result = strategy.detect(testId, entries);
      if (result) {
        results.push(result);
      }
    }

    if (results.length === 0) return null;

    // Deduplicate by testId (highest severity wins)
    const severityRank: Record<AnomalyResult["severity"], number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    results.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

    return results[0];
  }

  detectAll(testEntries: Map<string, AnomalyEntry[]>): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];

    for (const [testId, entries] of testEntries) {
      const result = this.detect(testId, entries);
      if (result) {
        anomalies.push(result);
      }
    }

    const severityRank: Record<AnomalyResult["severity"], number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return anomalies.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  }
}

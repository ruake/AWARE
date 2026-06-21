export interface AnomalyEntry {
  name: string;
  duration: number;
  started: string;
}

export interface AnomalyResult {
  testId: string;
  testName: string;
  metric: 'latency' | 'pass-rate';
  zScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastValue: number;
  avgValue: number;
  stdDev: number;
  message: string;
}

export interface AnomalyStrategy {
  readonly name: string;
  readonly description: string;
  detect(testId: string, entries: AnomalyEntry[]): AnomalyResult | null;
}

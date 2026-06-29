---
name: AWARE Anomaly Detection
description: Two independent anomaly modules (run-level and test-level), Z-score math, severity thresholds, and the 7-day window.
---

# AWARE Anomaly Detection

## Two Independent Modules

### 1. Run-Level (`src/lib/anomaly.ts`)
Detects anomalies at the run granularity:
- Inputs: `passRateZ` and `durationZ` for each run
- Computes Z-scores against the historical distribution of all runs
- Output: `AnomalyScore[]` with `overallAnomaly` composite score and `flags[]`

### 2. Test-Level (`src/lib/anomalyDetection.ts`)
Detects per-test latency regressions:
- **Window**: last 7 days only (`SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000`)
- **Minimum samples**: skips tests with < 3 data points (not enough to be statistically meaningful)
- **Metric**: `"latency"` only (pass-rate detection is in the run-level module)
- Computes population mean and standard deviation of durations
- Z-score = `(latest_duration - mean) / stdDev`

## Severity Thresholds
| Z-Score | Severity |
|---------|----------|
| > 3.0σ | `critical` |
| > 2.5σ | `high` |
| > 2.0σ | `medium` |
| > 1.5σ | `low` |
| ≤ 1.5σ | (not flagged) |

## Key Exports
- `detectAnomalies()` — returns `AnomalyDetectionResult[]` sorted by severity (critical first)
- `getLatestAnomalyBanner()` — returns the single highest-severity anomaly for the Dashboard banner, or null

## AnomalyDetectionResult Shape
```ts
{ testId, testName, metric, zScore, severity, lastValue, avgValue, stdDev, message }
```
`message` is human-readable: `"Latency anomaly: <name> is <N>σ above average"`

## Dashboard Integration
`getLatestAnomalyBanner()` is called on the Dashboard page to conditionally render an anomaly warning banner above the KPI cards. The PropertyStatusBar is always visible regardless.

## How to Apply
- The 7-day window is hardcoded — if extending to a configurable window, update `SEVEN_DAYS_MS`
- Population variance (not sample variance) is used — divide by `n`, not `n-1`
- stdDev floor of 1 prevents division-by-zero when all samples are identical
- Only latency anomalies are implemented in the test-level module; pass-rate anomalies belong to the run-level module

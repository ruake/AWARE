---
name: aware-analytics-expert
description: Expert in pass-rate trends, category heatmaps, flakiness scoring, run-level and test-level anomaly detection (Z-score), run frequency analysis, and recharts chart data pipelines. Use when building or modifying analytics charts, adding new metrics, implementing anomaly detection, or fixing chart data shape mismatches.
---

# AWARE Analytics Expert

## Role
You are the analytics and observability expert for the AWARE project. You own pass-rate trend analysis, category heatmaps, flakiness scoring, anomaly detection, run frequency analysis, and all chart data pipelines.

## Analytics Pages
| Page | Route | What it Shows |
|------|-------|--------------|
| Dashboard | `/` | KPI cards, area chart (per-env pass rate over time), heatmap, anomaly banner |
| Analytics | `/analytics` | Trend charts, category breakdowns, flakiness leaderboard |
| Compare | `/compare` | Side-by-side diff of two runs (regression/fixed/duration/unchanged) |
| Pulse | `/pulse` | Live status feed, real-time run updates |
| Run Detail | `/runs/:runId` | Per-run test result table with evidence viewer |

## Chart Data Sources (all from `src/lib/runs.ts`)

### Area Chart (Dashboard)
```ts
ENV_PASS_RATE_CHART: { day: string, runId: string, [envLabel]: number }[]
```
One row per day; env label columns (QA, UAT, PROD). Used with recharts `AreaChart`.

### Line Chart (per-env trends)
```ts
PER_ENV_PASS_RATE: { env: string, color: string, data: { runId, label, passRate }[] }[]
```

### KPI Summary Cards
```ts
ENV_SUMMARY: { label, passRate, trend, failures, color, alert }[]
```
- `trend` = latest passPct − previous passPct
- `alert` = e.g. "3 failures in last run" or null
- `color`: ≥90% → #22c55e, ≥70% → #f59e0b, else #ef4444

### Simple Pass Rate Line
```ts
PASS_RATE_CHART: { label: string, passRate: number, runId: string }[]
```
Sorted by `started` date ascending.

## Heatmaps
- `HeatmapCalendar.tsx` — calendar-style pass-rate by day
- `PassRateHeatmap.tsx` — category × time grid

## Anomaly Detection Modules

### Run-Level (`src/lib/anomaly.ts`)
```ts
AnomalyScore { runId, passRateZ, durationZ, overallAnomaly, flags[] }
```
Z-scores across all runs. Dashboard banner triggered when `overallAnomaly` exceeds threshold.

### Test-Level (`src/lib/anomalyDetection.ts`)
- 7-day rolling window
- Per-test latency Z-score
- Thresholds: low (>1.5σ), medium (>2σ), high (>2.5σ), critical (>3σ)
- Population variance (n denominator, not n-1)
- stdDev floor of 1 prevents division-by-zero
- `getLatestAnomalyBanner()` → single worst anomaly for Dashboard

## Flakiness Analysis
```ts
TestDetail { history: TestRunPoint[], passRate, flakinessScore, avgDuration }
```
- `TEST_DETAILS[]` — pre-computed for all diff rows at module load
- `computeTestDetailForName(name)` — on-demand for any test name
- Flakiness > 20 = flagged on Analytics page
- Formula: `(status_flips / (total_runs - 1)) * 100`

## Compare / Diff Logic

### DiffRow States
| State | Meaning |
|-------|---------|
| `regression` | PASS in base → FAIL in candidate |
| `fixed` | FAIL in base → PASS in candidate |
| `duration` | Same status but duration changed significantly |
| `unchanged` | Same status, similar duration |
| `fishy` | PASS→PASS but suspicious duration spike |

`DIFF_ROWS` in `data/diff-rows.json` — seeded between two most recent runs.

## Run Frequency Analytics
```ts
RunFrequency {
  totalRuns, daysCovered, runsPerDay,
  byDay: { date, count, envs }[],
  byEnv: Record<string, number>,
  byHour: Record<string, number>,
  avgIntervalHours,
  gaps: { date, gapDays }[]
}
```
`computeRunFrequency()` in `runs.ts` — used on Analytics page for cadence view.

## TestStats Shape (from testCases.ts)
```ts
TestStats {
  total, byStatus, byPriority, byCategory, bySeverity, byOwner, byTag,
  automated, manual, coverage, avgVersion
}
```

## ENV Color Map
| Env | Color |
|-----|-------|
| QA (any variant) | #a855f7 (purple) |
| UAT (any variant) | #f59e0b (amber) |
| PROD (any variant) | #22c55e (green) |

## AI Risk Score Weights
The Copilot `risk-scoring` skill uses:
- pass rate: 40%
- failure count: 20%
- trend direction: 20%
- flakiness: 10%
- env parity (staging vs production divergence): 10%

## When to Use This Skill
- Building or modifying analytics charts
- Adding new metrics or KPI calculations
- Working with anomaly detection thresholds
- Implementing heatmap visualizations
- Adding run frequency or trend analyses
- Fixing chart data shape mismatches

## Files to Read First
1. `artifacts/aware-app/src/lib/runs.ts` — all chart data exports
2. `artifacts/aware-app/src/lib/anomalyDetection.ts` — test-level anomaly
3. `artifacts/aware-app/src/lib/anomaly.ts` — run-level anomaly
4. `artifacts/aware-app/src/pages/TestAnalytics.tsx` — analytics page
5. `artifacts/aware-app/src/components/aware/HeatmapCalendar.tsx` — heatmap component

---
name: AWARE Data Layer
description: Static-first data strategy, seed JSON files, in-memory stores, localStorage persistence, and subscription model for reactivity.
---

# AWARE Data Layer

## Strategy: Static-First
The app ships with all data as JSON seed files in `src/data/`. There is no backend database in production. Data is loaded at module import time and kept in memory.

## Seed Data Files
| File | Contents |
|------|----------|
| `src/data/runs.json` | All CI run records (Run[]) |
| `src/data/test-results.json` | TestResult[] keyed by runId: `Record<string, TestResult[]>` |
| `src/data/test-suites.json` | TestSuite[] definitions |
| `src/data/auto-tests.json` | TestCase[] — auto-discovered test cases |
| `src/data/diff-rows.json` | DiffRow[] — pre-computed compare data |
| `src/data/promotions.json` | PromotionDecision[] |
| `src/data/schemas/test-results.schema.json` | JSON Schema for validation |

## Core Data Modules

### `src/lib/runs.ts`
- Exports `RUNS`, `DIFF_ROWS`, `TEST_DETAILS` (computed at module load)
- `getRunById(id)`, `getRunIndex(id)`, `getTestResultsForRun(runId)`
- `ENV_SUMMARY` — per-env aggregated pass rates with trend
- `PASS_RATE_CHART`, `PER_ENV_PASS_RATE`, `ENV_PASS_RATE_CHART` — chart-ready data shapes
- `computeRunFrequency()` — run cadence analytics (by-day, by-env, by-hour, gaps)
- `computeTestDetailForName(name)` — cross-run history for a single test

### `src/lib/data.ts`
- `getTestCases()` / `saveTestCases()` — in-memory store + localStorage persistence
- `getTestSuites()` / `saveTestSuites()` — same pattern
- Subscription model: `subscribeToTestCases(cb)`, `subscribeToTestSuites(cb)`
- Returns `() => unsubscribe` from subscribe calls

### `src/lib/store.ts`
- App-wide shared state (runs filter state, selected runs for compare, etc.)

### `src/lib/testCases.ts` / `src/lib/testSuites.ts`
- Higher-level helpers: filter, sort, stats aggregation, import/export
- `computeTestStats()` — aggregates by status, priority, category, severity, owner, tag

### `src/lib/promotions.ts`
- Promotion decision CRUD over seed data + localStorage

## Flakiness Formula
```
flakinessScore = (status_flips / (total_runs - 1)) * 100
```
A test with score > 20 is flagged as flaky.

## Z-Score Anomaly (runs.ts / anomalyDetection.ts)
Both modules compute Z-scores independently:
- **Run-level** (`anomaly.ts`): flags runs where `passRateZ` or `durationZ` > threshold
- **Test-level** (`anomalyDetection.ts`): 7-day window, per-test latency Z-score

## Data Validation
`scripts/validate-data.mjs` runs as a prebuild step and validates `test-results.json` against `schemas/test-results.schema.json`. Build fails if validation fails.

**Why:** The static data is the production dataset. Any corruption must be caught before shipping.

## How to Apply
- When adding new seed data, always update the corresponding schema and run `validate-data.mjs`
- When writing new data accessor functions, follow the `getX() / saveX() / subscribeToX()` pattern from `data.ts`
- Never store secrets or real user data in seed JSON — it ships with the app

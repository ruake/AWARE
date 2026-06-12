# AWARE Data Expert

## Role
You are the AWARE data layer expert. You own all data access patterns, seed JSON files, TypeScript data types, in-memory stores, localStorage persistence, and the subscription/reactivity model.

## Project Context
- **Types**: `src/lib/types.ts` — all interfaces (Run, TestResult, TestCase, TestSuite, DiffRow, PromotionDecision, Job, AnomalyScore, LLM types, etc.)
- **Runs data**: `src/lib/runs.ts` — RUNS[], DIFF_ROWS[], TEST_DETAILS[], chart data exports, flakiness computation
- **CRUD data**: `src/lib/data.ts` — getTestCases/saveTestCases, getTestSuites/saveTestSuites, subscription model
- **Seed JSON**: `src/data/runs.json`, `test-results.json`, `test-suites.json`, `auto-tests.json`, `diff-rows.json`, `promotions.json`
- **Validation**: `src/data/schemas/test-results.schema.json`, `scripts/validate-data.mjs`

## Static-First Data Strategy
All data ships as JSON seed files. There is no backend in production. At module load time, data is imported and kept in memory. Changes are persisted via localStorage for user-created/modified entities.

## Key Data Access Patterns

### Read-Only Run Data (runs.ts)
```ts
import { RUNS, getRunById, getTestResultsForRun, ENV_SUMMARY, PASS_RATE_CHART } from "@/lib/runs"
```
- `RUNS` — full list of CI runs
- `getRunById(id)` — single run lookup
- `getTestResultsForRun(runId)` — TestResult[] for a run
- `ENV_SUMMARY` — per-env aggregated stats
- `ENV_PASS_RATE_CHART` — area chart data (keyed by day, env columns)
- `computeRunFrequency()` — cadence analytics

### Mutable Stores (data.ts)
```ts
import { getTestCases, saveTestCases, subscribeToTestCases } from "@/lib/data"

// Subscribe to changes:
const unsub = subscribeToTestCases(() => setTests(getTestCases()))
return unsub  // call in useEffect cleanup
```

## Critical Type Rules
- `Run.env` field = `"QA"` | `"UAT"` | `"PROD"` — not "production"/"staging" (those are legacy)
- `TestResult.evidence` is REQUIRED — never omit it in generated/seed data
- `TestResult.assertions` should be an empty array if no assertions, not undefined
- `DiffRow.state` options: `"regression"` | `"fixed"` | `"duration"` | `"unchanged"` | `"fishy"`

## Flakiness Formula
```
flakinessScore = (status_flips / (total_runs - 1)) * 100
```
Score > 20 = concerning; computed in `computeTestDetails()` and `computeTestDetailForName(name)`

## ENV_COLOR_MAP Colors
| Env | Color |
|-----|-------|
| QA | #a855f7 (purple) |
| UAT | #f59e0b (amber) |
| PROD | #22c55e (green) |
Both short forms (`"QA"`) and long forms (`"QA / Staging"`) are in the map.

## Data Validation Workflow
```bash
node scripts/validate-data.mjs   # validates test-results.json against schema
node scripts/generate-data.mjs   # regenerates seed data from templates
node scripts/discover-all.mjs    # discovers tests and updates auto-tests.json
```
`validate-data.mjs` runs automatically as a prebuild step — the build fails on schema violations.

## When to Use This Skill
- Adding or modifying seed JSON data
- Changing TypeScript data types/interfaces
- Implementing new data access functions or stores
- Fixing data shape mismatches between components and stores
- Working with run history, flakiness scores, or diff computation
- Implementing import/export features (testImportExport.ts)

## Files to Read First
1. `artifacts/aware-app/src/lib/types.ts` — all type definitions
2. `artifacts/aware-app/src/lib/runs.ts` — run data module
3. `artifacts/aware-app/src/lib/data.ts` — mutable store pattern
4. `artifacts/aware-app/src/data/runs.json` — sample of seed data shape

# AWARE CI/CD Expert

## Role
You are the CI/CD pipeline expert for the AWARE project. You own the GitHub Actions workflow, suite scheduling, config-driven CI execution, the promotion gate, and the CiConfig generation logic.

## CI Stack
- **CI Platform**: GitHub Actions
- **Workflow file**: `.github/workflows/run-tests.yml`
- **Test runners**: Playwright 1.60 (browser) + pytest 8.0 (API/EdgeWorker)
- **Trigger**: manual dispatch + automated schedules (cron)
- **Config source**: `config/environments.yml`, `config/test-suites.yml`, `config/akamai-config.yml`

## Dispatching Runs
```bash
gh workflow run run-tests.yml \
  --field suite=suite_smoke \
  --field environment=QA \
  --field parallelism=4
```

## Suite Schedules
| Suite ID | Schedule | Networks |
|----------|---------|---------|
| `suite_smoke` | On every deployment | All 6 envs |
| `suite_regression_qa` | `0 */2 * * *` (every 2h) | QA Staging + QA Production |
| `suite_regression_uat` | `0 6 * * *` (06:00 UTC) | UAT Staging + UAT Production |
| `suite_nightly_prod` | `0 2 * * *` (02:00 UTC) | PROD Staging + PROD Production |
| `suite_edgeworker` | On EdgeWorker deploy | QA + UAT Staging only |
| `suite_performance` | `0 4 * * 1` (Mon 04:00 UTC) | QA/UAT/PROD Production only |

## Parallelism Settings
| Suite | Workers |
|-------|---------|
| `suite_smoke` | 4 |
| `suite_regression_qa` | 8 |
| `suite_regression_uat` | 6 |
| `suite_nightly_prod` | 4 |
| `suite_edgeworker` | 4 |
| `suite_performance` | 2 |

## Promotion Gate Logic
```yaml
promotionGate:
  minPassRate: 95
  requiredSuites: [suite_smoke, suite_regression_uat]
```
- UAT regression (both networks) must hit ≥ 95% pass rate
- `PromotionDecision.decision` = `"promote"` | `"block"` | `"pending"`
- Implemented in `src/lib/promotions.ts`
- Shown on the CI Pipeline page and Dashboard

## CiConfig Generation (`src/lib/ciConfig.ts`)
`generateCiConfig()` reads live app state and produces a `CiConfig` object:
- Reads `getTestSuites()`, `getTestCases()`, `getEnvConfigs()`
- Maps test types to runners (pytest or playwright)
- `generateCiConfigYaml()` serializes to YAML with embedded instructions
- `downloadCiConfig()` triggers browser download as `aware-test-config-<date>.yml`

## Notifications
```yaml
notifications:
  slack:
    channel: "#cdn-alerts"
    notifyOn: [fail, regression]
  githubChecks:
    requiredForMerge: true
  pagerduty:
    triggerOn: [prod_prod_fail, pass_rate_below_80]
```

## Test Runner Configs
```yaml
playwright:
  version: "^1.60.0"
  browser: chromium
  headless: true
  baseTimeout: 30000
  retries: 2
  workers: 4

pytest:
  version: "^8.0"
  markers: [smoke, regression, edgeworker, performance]
  timeout: 60
  workers: 4
```

## CI Pipeline Page (`/ci-pipeline`)
- Component: `src/pages/Status.tsx`
- Shows: current run status, suite list, environment health
- Download button calls `downloadCiConfig()` to get the auto-generated YAML
- `CiConfigBanner.tsx` shows setup instructions for first-time users

## When to Use This Skill
- Modifying the GitHub Actions workflow
- Adding or changing suite schedules
- Implementing or modifying the promotion gate
- Working on the CI Pipeline page or CiConfig generation
- Debugging CI failures or misconfigured suites
- Adding new test runner support

## Files to Read First
1. `.github/workflows/run-tests.yml` — the actual workflow
2. `config/test-suites.yml` — suite definitions and schedules
3. `artifacts/aware-app/src/lib/ciConfig.ts` — config generation logic
4. `artifacts/aware-app/src/pages/Status.tsx` — CI Pipeline UI page

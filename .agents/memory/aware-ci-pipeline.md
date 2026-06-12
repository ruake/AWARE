---
name: AWARE CI Pipeline
description: GitHub Actions workflow structure, Playwright + pytest parallel jobs, config-driven suite execution, dispatch patterns, and nightly schedules.
---

# AWARE CI Pipeline

## Workflow File
`.github/workflows/run-tests.yml`

## Dispatch
```bash
gh workflow run run-tests.yml \
  --field suite=<suite_id> \
  --field environment=<QA|UAT|PROD> \
  --field parallelism=4
```

## Suite IDs (from `config/test-suites.yml`)
| ID | Name | Schedule |
|----|------|---------|
| `suite_smoke` | Smoke — All Environments | On every deployment |
| `suite_regression_qa` | Full Regression — QA | Every 2 hours (`0 */2 * * *`) |
| `suite_regression_uat` | Full Regression — UAT | Nightly 06:00 UTC |
| `suite_nightly_prod` | Nightly Regression — PROD | Nightly 02:00 UTC |
| `suite_edgeworker` | EdgeWorker Unit Tests | On EW deploy |
| `suite_performance` | Performance Benchmarks | Monday 04:00 UTC |

## Runner Parallel Jobs
Both Playwright and pytest run in parallel jobs on the same CI run:
- `playwright`: chromium, `^1.60.0`, browser-based (web tests)
- `pytest`: `^8.0`, markers: smoke, regression, edgeworker, performance (API/EdgeWorker tests)

## Config Consumption
The CI workflow reads directly from:
- `config/environments.yml` — environment IPs, property versions, networks
- `config/test-suites.yml` — suite definitions, parallelism, retries, failFast
- `config/akamai-config.yml` — property metadata, EdgeWorker IDs, notification settings

**Why:** Config-as-code means the CI behavior is versioned alongside the property config. No out-of-band configuration needed.

## Promotion Gate
- UAT regression (`suite_regression_uat`) must achieve ≥ 95% pass rate
- Required suites: `suite_smoke` + `suite_regression_uat`
- Gate defined in `config/akamai-config.yml` under `properties[].promotionGate`
- Enforced in app via `PromotionDecision` workflow (UAT → PROD property activation)

## CI Config Generation
`src/lib/ciConfig.ts` generates a downloadable `aware-test-config.yml` from the current app state (suites + test cases + env configs). Available on the CI Pipeline page.

## Notifications
| Channel | Trigger |
|---------|---------|
| Slack (#cdn-alerts) | fail, regression |
| GitHub Checks | All runs (required for merge) |
| PagerDuty | `prod_prod_fail`, pass rate below 80% |

## How to Apply
- To add a new suite, add it to both `config/test-suites.yml` and update `data/test-suites.json`
- Suite IDs must be consistent between YAML (for CI) and JSON (for the app)
- `failFast: true` on smoke suite — any failure stops the suite immediately
- Performance suite runs on production network only (needs real traffic characteristics)

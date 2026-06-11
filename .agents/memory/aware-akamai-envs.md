---
name: AWARE Akamai environment model
description: Three-environment QA/UAT/PROD model with Akamai property status, replacing the old four-env Prod/Staging matrix.
---

## The rule
Always use exactly three environments: **QA**, **UAT**, **PROD**.
- `envConfig.ts` defines them with Akamai property fields (property, propertyVersion, propertyStatus, cpcode, edgeHostname).
- `runs.json` `env` field uses `"QA"`, `"UAT"`, or `"PROD"` (never the old "production"/"staging" strings).
- `ENV_COLOR_MAP` in `runs.ts` maps QA→purple, UAT→amber, PROD→green.
- `PropertyStatusBar` component reads `getEnvConfigs()` and must always render all three cards on the Dashboard.

**Why:** User requirement — QA/UAT/PROD is the standard Akamai deployment pipeline for property promotion. Old four-env model was confusing.

**How to apply:**
- When adding new runs or test data, always set `env` to one of `"QA"`, `"UAT"`, `"PROD"`.
- When adding new env-related UI, import from `envConfig.ts` and use `getEnvConfigs()`.
- Promotion gate: UAT suite must pass ≥ 95% before activating property on PROD.

## Config-as-code files
- `config/environments.yml` — source of truth for CI (GitHub Actions reads this)
- `config/test-suites.yml` — suite → environment mapping + schedules
- `config/akamai-config.yml` — property definitions, EdgeWorker versions, notification settings
- `.github/workflows/run-tests.yml` — full Playwright + pytest CI workflow with manual dispatch inputs (suite, environment, parallelism)

## Test runner types
- `"web"` → Playwright (browser tests)
- `"pytest"` → pytest (API / EdgeWorker / geo tests)
- Both are valid `TestCase.testType` values and both have dedicated CI jobs in the workflow.

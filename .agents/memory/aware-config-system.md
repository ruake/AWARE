---
name: AWARE Config System
description: Config-as-code YAML files, envConfig.ts runtime source of truth, localStorage override key, and the relationship between config/ and src/data/.
---

# AWARE Config System

## Two Config Layers

### 1. Repo Config (CI source of truth)
YAML files committed to `config/` — read by GitHub Actions:

| File | Purpose |
|------|---------|
| `config/environments.yml` | All 6 environment definitions (QA/UAT/PROD × staging/production) |
| `config/test-suites.yml` | Suite definitions, schedules, parallelism, env assignments |
| `config/akamai-config.yml` | Property metadata, EdgeWorker IDs, runner settings, notifications |
| `config/aware-test-config.yml` | Auto-generated combined config (not hand-edited) |

### 2. App Runtime Config (`src/lib/envConfig.ts`)
TypeScript module — the app's live source of truth:
- `DEFAULT_ENVIRONMENTS`: hardcoded array of 6 `EnvironmentConfig` objects
- Override mechanism: `localStorage.getItem("aware-env-configs-v3")`
- **If localStorage has valid data, it takes precedence over DEFAULT_ENVIRONMENTS**

## Key API
```ts
getEnvConfigs()          // returns override or default
saveEnvConfigs(configs)  // persists to localStorage + notifies subscribers
resetEnvConfigs()        // clears localStorage, reverts to defaults
getEnvConfig(label)      // find by label string e.g. "QA / Staging"
getEnvConfigById(id)     // find by id e.g. "qa_staging"
subscribeToEnvConfigs(cb) // reactive updates; returns unsubscribe fn
```

## localStorage Keys
| Key | Contents |
|-----|---------|
| `aware-env-configs-v3` | `EnvironmentConfig[]` — user-customized environments |

**Breaking change note:** Previous key was `aware-env-configs-v2`. Any data in v2 is silently ignored.

## EnvironmentConfig Shape
```ts
{ id, label, target, stage, baseUrl, ips[], network, property?, propertyVersion?, propertyStatus?, cpcode?, edgeHostname? }
```
- `network`: `"staging"` | `"production"` — the Akamai network tier
- `propertyStatus`: `"active"` | `"inactive"` | `"pending"` — shown in PropertyStatusBar

## Environment IDs Convention
Pattern: `{tier}_{network}` e.g. `qa_staging`, `qa_prod`, `uat_staging`, `uat_prod`, `prod_staging`, `prod_prod`

## Relationship: YAML ↔ JSON ↔ TypeScript
```
config/environments.yml  →  consumed by GitHub Actions CI
src/lib/envConfig.ts     →  runtime app state (override of hardcoded defaults)
src/data/runs.json       →  historical run records (env field = QA/UAT/PROD only)
```
These are SEPARATE. Changes to config/environments.yml do NOT automatically update the app's envConfig.ts defaults — that must be done manually.

## CiConfig Generation
`src/lib/ciConfig.ts:generateCiConfig()` reads live `getEnvConfigs()` + `getTestSuites()` + `getTestCases()` and produces a downloadable YAML. This is the bridge between the app state and CI config.

## How to Apply
- When a user customizes environments in the UI, changes are written to localStorage v3
- The PropertyStatusBar reads from `getEnvConfigs()` which respects overrides
- When adding new Akamai properties, update both `config/akamai-config.yml` AND `DEFAULT_ENVIRONMENTS` in `envConfig.ts`
- The promotion gate minimum pass rate (95%) is defined in `config/akamai-config.yml` under `promotionGate.minPassRate`

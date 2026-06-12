# AWARE Config Expert

## Role
You are the configuration management expert for the AWARE project. You own the config-as-code YAML files, the `envConfig.ts` runtime configuration, localStorage override system, and the generated CI config output.

## Two Config Layers

### Layer 1: Repo YAML (CI source of truth)
Committed to `config/` — read directly by GitHub Actions:

| File | Owner | Purpose |
|------|-------|---------|
| `config/akamai-config.yml` | Platform engineering | Property metadata, EW IDs, runner settings, notifications |
| `config/environments.yml` | Platform engineering | All 6 env definitions (IPs, networks, property versions) |
| `config/test-suites.yml` | QA team | Suite definitions, schedules, parallelism, env assignments |
| `config/aware-test-config.yml` | Auto-generated | Combined config; output of `generateCiConfigYaml()` |

### Layer 2: App Runtime TypeScript (`src/lib/envConfig.ts`)
In-memory config with localStorage persistence:
```ts
getEnvConfigs()                    // current config (override or default)
saveEnvConfigs(configs)            // save to localStorage "aware-env-configs-v3"
resetEnvConfigs()                  // clear override, revert to defaults
subscribeToEnvConfigs(cb)          // reactive; returns unsubscribe fn
getEnvConfig(label)                // lookup by "QA / Staging"
getEnvConfigById(id)               // lookup by "qa_staging"
```

**localStorage key**: `aware-env-configs-v3` (breaking change from v2 — old data is silently ignored)

## Environment Schema
```yaml
id: qa_staging
label: "QA / Staging"     # exact string used as lookup key throughout the app
target: QA                # tier: QA | UAT | PROD
stage: Staging            # network tier label
network: staging          # "staging" | "production"
baseUrl: https://www.akamai.com
ips: [23.32.1.10, 23.32.1.11]
property: www.akamai.com
propertyVersion: 52       # active Akamai property version
propertyStatus: active    # "active" | "inactive" | "pending"
cpcode: "1234567"
edgeHostname: www.akamai.com.edgekey.net
```

## Akamai Config Schema (key sections)
```yaml
properties:
  - name: www.akamai.com
    contractId: ctr_XXXXXXXX
    groupId: grp_XXXXXXXX
    cpcode: "1234567"
    activeVersions: { qa: 52, uat: 51, prod: 50 }
    promotionGate:
      minPassRate: 95
      requiredSuites: [suite_smoke, suite_regression_uat]

edgeworkers:
  - id: "12345"
    name: locale-splitter
    activeVersions: { qa: "3.2.1", uat: "3.2.0", prod: "3.1.4" }

runners:
  playwright: { version: "^1.60.0", browser: chromium, retries: 2, workers: 4 }
  pytest: { version: "^8.0", markers: [smoke, regression, edgeworker, performance] }
```

## Suite Config Schema (key fields)
```yaml
- id: suite_smoke
  environments: ["QA / Staging", "QA / Production", ...]  # must match envConfig labels exactly
  parallelism: 4
  retries: 1
  failFast: true
  timeoutMinutes: 5
  runners: [playwright, pytest]
  schedule: null  # cron string or null
```

## Generated Config (`src/lib/ciConfig.ts`)
`generateCiConfig()` bridges app state → CI YAML:
1. Reads `getTestSuites()` for suite list
2. Reads `getTestCases()` for test-to-runner mapping
3. Reads `getEnvConfigs()` for current environment state
4. Produces `CiConfig` object with version, suites, environments, workflow ref, runner specs

`generateCiConfigYaml()` wraps output in YAML with embedded instructions.
`downloadCiConfig()` triggers a browser download of `aware-test-config-<date>.yml`.

## Critical Consistency Rules
1. **Suite IDs must match** between `config/test-suites.yml` (for CI) and `src/data/test-suites.json` (for the app)
2. **Environment labels must match exactly** — `"QA / Staging"` not `"qa-staging"` or `"QA/Staging"`
3. **Updating `config/environments.yml` does NOT auto-update `envConfig.ts`** — they are separate and must be kept in sync manually
4. **`config/aware-test-config.yml` is auto-generated** — never hand-edit it

## When to Use This Skill
- Modifying environment definitions (IPs, property versions, status)
- Adding or renaming test suites
- Changing the promotion gate threshold
- Adding new Akamai properties or EdgeWorkers
- Debugging config mismatches between CI and the app
- Working on the CiConfig download feature

## Files to Read First
1. `config/environments.yml` — canonical environment definitions
2. `config/test-suites.yml` — suite schedule and env assignments
3. `artifacts/aware-app/src/lib/envConfig.ts` — runtime env config
4. `artifacts/aware-app/src/lib/ciConfig.ts` — CI config generation

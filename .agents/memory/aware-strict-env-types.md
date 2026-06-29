---
name: AWARE strict env types
description: AkamaiTier/Network/EnvId union types enforce the 6-slot environment model; envConfig.ts is now read-only.
---

## Rule
`AkamaiEnvId`, `AkamaiTier`, `AkamaiNetwork` are the canonical types for all environment references in the app. These are defined at the top of `types.ts` and used throughout.

```
AkamaiTier   = "QA" | "UAT" | "PROD"
AkamaiNetwork = "staging" | "production"
AkamaiEnvId  = "qa_staging" | "qa_prod" | "uat_staging" | "uat_prod" | "prod_staging" | "prod_prod"
```

`Run.envId: AkamaiEnvId`, `Run.env: AkamaiTier`, `Run.network: AkamaiNetwork`.
`EnvironmentConfig.id: AkamaiEnvId`, `.target: AkamaiTier`.
`TestSuite.envIds: AkamaiEnvId[]`, `.runners: ("playwright" | "pytest")[]`.

## envConfig.ts is read-only
`saveEnvConfigs`, `resetEnvConfigs`, `subscribeToEnvConfigs` were removed. The module now exports only:
- `getEnvConfigs()` — all 6 EnvironmentConfig objects
- `getEnvConfig(id)` — by AkamaiEnvId
- `getEnvConfigById(id)` — alias
- `getEnvByTierAndNetwork(tier, network)` — lookup by tier × network
- `envIdToLabel(id)` — "QA / Staging" etc.
- `labelToEnvId(label)` — reverse lookup

**Why:** Static GitHub Pages site — no user editing of environments; mutable config functions had no place on a read-only site and caused confusion.

**How to apply:** If a new component needs env data, call `getEnvConfigs()` or `getEnvByTierAndNetwork()`. Never add mutable helpers back.

## Dynamic DIFF_ROWS
`diff-rows.json` was deleted. `DIFF_ROWS` in `runs.ts` is now an in-memory array populated by `recomputeAll()` (from the two most recent runs in the same envId). The Compare page calls `computeDiffRows(baselineId, candidateId)` dynamically after loading both runs' results via `loadResultsForRun()`.

**Why:** Static diff-rows.json became stale immediately after any data update; dynamic computation is always accurate and removes a build step.

---
name: aware-fork-env-setup
description: Expert in forking the AWARE repo and configuring it for a different Akamai CDN property or organization. Covers the full architectural coupling map — config layers, type system, data branch, CI workflows, and branding.
---

# AWARE Fork & Environment Setup (Architectural Deep-Dive)

## Role
You are the onboarding and templating architect. Forking AWARE is not a simple config change — the 3-tier × 2-network model is embedded across config files, TypeScript types, runtime stores, CI workflows, chart computations, and seed data. This document maps every coupling point in order of reach.

---

## Stage 0: The Architectural Coupling Map

Before changing anything, understand the dependency chain:

```
config/environments.yml          # CI source of truth (yq-parsed by GHA)
        ↕  MUST MATCH manually   # NO automated sync between these
config/test-suites.yml           # references environment LABELS
        ↕
artifacts/aware-app/src/lib/envConfig.ts   # runtime equivalent (TypeScript)
artifacts/aware-app/src/lib/types.ts       # AkamaiEnvId literal union (compile-time gate)
        ↓
PropertyStatusBar.tsx            # hardcodes TIER_META + ["QA","UAT","PROD"]
runs.ts                          # ENV_COLOR_MAP hardcodes every label
constants.ts                     # ENVS = ["QA","UAT","PROD"]
data/*.json                      # seed data references env IDs — all must match
.github/workflows/run-tests.yml  # choice dropdowns hardcode labels
.github/workflows/scheduler.yml  # reads suite config, dispatches by label
scripts/*.mjs                    # git bot identity
```

Every file in this chain must be touched. Missing any one causes a build failure, runtime empty state, or CI misdispatch.

---

## Stage 1: Fork & Repo Metadata

```bash
gh repo fork ruake/AWARE --clone --remote=true
cd AWARE
```

### All hardcoded references to `ruake/AWARE`:

| File | Line | What to change |
|------|------|----------------|
| `artifacts/aware-app/src/lib/dataFetcher.ts` | 1-2 | `REPO_OWNER`, `REPO_NAME` |
| `artifacts/aware-app/src/lib/nav.ts` | 28 | `repo` URL |
| `artifacts/aware-app/src/lib/utils.ts` | 13 | GitHub blob base URL |
| `artifacts/aware-app/src/lib/ai/context.ts` | 207 | System prompt data source URL |
| `artifacts/aware-app/src/pages/About.tsx` | 526 | GitHub repo link |
| `artifacts/aware-app/src/pages/RunDetail.tsx` | 327 | Actions run link |
| `artifacts/aware-app/src/pages/Dashboard.tsx` | 1001 | Actions link |
| `artifacts/aware-app/src/pages/StartRun.tsx` | 55 | Actions link |
| `artifacts/aware-app/src/pages/TestSuiteManager.tsx` | 1079 | GitHub file URL fallback |
| `artifacts/aware-app/index.html` | 12-13 | `og:url`, `og:image` |

**Change each to `<your-org>/<your-repo>`**.

**⚠️ The `index.html` `og:image` URL** references `ruake.github.io/PROOF/og-image.png` — replace with your GitHub Pages URL.

---

## Stage 2: Environment Model (Highest Coupling)

AWARE's default model is **3 tiers × 2 networks = 6 environments**: QA, UAT, PROD each with staging + production networks. This is the deepest coupling point.

### 2a. Decide your tier model

Options:
- **Keep 3 tiers** (rename QA/UAT/PROD → DEV/STAGING/PROD)
- **Fewer tiers** (e.g., just STAGING + PROD)
- **Same tiers, different IPs/versions** (simplest — just update IPs)

Each option determines how many files you must change.

### 2b. `artifacts/aware-app/src/lib/types.ts` — The compile-time gate

```typescript
// 👇 THIS union is checked at compile time everywhere
export type AkamaiTier = "QA" | "UAT" | "PROD";   // ← change if renaming tiers
export type AkamaiNetwork = "staging" | "production";
export type AkamaiEnvId =
  | "qa_staging" | "qa_prod"
  | "uat_staging" | "uat_prod"
  | "prod_staging" | "prod_prod";
```

- `AkamaiEnvId` is consumed in `ENV_CONFIGS`, `run.envId`, `TestSuite.envIds`, `EnvironmentConfig.id`
- Every value in `envConfig.ts` must match this union
- Adding/dropping a tier requires updating the union

### 2c. `config/environments.yml` + `artifacts/aware-app/src/lib/envConfig.ts` — The dual source of truth

**These two files must be identical in content** — there is NO automated sync. CI reads the YAML; the SPA reads the TypeScript. A mismatch means the dashboard shows different environments than tests run against.

Fields per environment:
```yaml
id: qa_staging               # must match AkamaiEnvId
label: "QA / Staging"        # must match every reference in suites.yml + workflow choice options
target: QA                   # must match AkamaiTier
network: staging             # must match AkamaiNetwork
ips: [...]
propertyVersion: N
propertyStatus: active|inactive|pending
```

### 2d. `config/test-suites.yml` — Suite → Environment mapping

Suites reference environments by **label string**:
```yaml
environments:
  - "QA / Staging"           # ← exact match with environments.yml label
  - "QA / Production"
```

These labels must also match the `type: choice` options list in `.github/workflows/run-tests.yml`.

### 2e. The five labeling touchpoints

Every environment has a **label** (`"QA / Staging"`), an **id** (`"qa_staging"`), a **tier** (`"QA"`), and a **network** (`"staging"`). All four forms are used:

| Form | Where it's used | Example |
|------|----------------|---------|
| `label` | Suite env lists, GHA choice dropdown, PropertyStatusBar, filter UI | `"QA / Staging"` |
| `id` | Runs seed data, `AkamaiEnvId` type, envConfig IDs, test-suites.json | `"qa_staging"` |
| `target` | `run.env` field, ENV_COLOR_MAP, ENVS constant, tier grouping | `"QA"` |
| `network` | `run.network` field, CI routing | `"staging"` |

---

## Stage 3: The Baked-In References (Hardest to Find)

### 3a. `PropertyStatusBar.tsx` — Tier order + colors (line 7-11, 242)

```typescript
const TIER_META: Record<string, { accent: string; ... }> = {
  QA: { accent: "#a855f7", ... },
  UAT: { accent: "#f59e0b", ... },
  PROD: { accent: "#22c55e", ... },
};
// ...
return ["QA", "UAT", "PROD"]   // ← hardcoded iteration order
  .filter((t) => map[t]?.staging && map[t]?.production)
```

If you rename or reorder tiers, this component breaks visually.

### 3b. `runs.ts` — `ENV_COLOR_MAP` (line 163-173)

```typescript
const ENV_COLOR_MAP: Record<string, string> = {
  QA: "#a855f7",
  UAT: "#f59e0b",
  PROD: "#22c55e",
  "QA / Staging": "#a855f7",
  "QA / Production": "#c084fc",
  "UAT / Staging": "#f59e0b",
  "UAT / Production": "#fbbf24",
  "PROD / Staging": "#22c55e",
  "PROD / Production": "#4ade80",
};
```

Every env label + every tier short name is here. Used by `computePerEnvPassRate()` for chart coloring.

### 3c. `constants.ts` — `ENVS` array (line 1)

```typescript
export const ENVS = ["QA", "UAT", "PROD"];
```

Used by the runs page filter and env selector dropdowns. Must match your tiers.

### 3d. `.github/workflows/run-tests.yml` — Choice dropdowns (lines 29-47)

```yaml
suite:
  options:
    - suite_smoke              # ← must match test-suites.yml suite IDs
    - suite_regression_qa
    ...
environment:
  options:
    - "QA / Staging"           # ← must match environments.yml labels exactly
    - "QA / Production"
    ...
```

Workflow dispatch breaks if these don't match. No validation — GitHub just shows wrong options.

### 3e. Seed data (`data/*.json`)

Every record in `runs.json` references:
- `envId` — must match `AkamaiEnvId` (e.g., `"qa_staging"`)
- `env` — must match `AkamaiTier` (e.g., `"QA"`)
- `network` — must match `AkamaiNetwork` (e.g., `"staging"`)

Changing tiers invalidates all seed data. Either update every record or clear to `[]`.

`test-suites.json` (if populated) references `envIds: ["qa_staging", ...]` — same constraint.

---

## Stage 4: Data Branch (Production-Readiness Gate)

The SPA fetches seed data at runtime from `raw.githubusercontent.com/<owner>/<repo>/data/<file>.json`. The `data` branch is an **orphan branch** containing only data files at root.

```bash
node scripts/init-data-branch.mjs
```

This script:
1. Creates an orphan `data` branch
2. Copies all files from `artifacts/aware-app/data/` to branch root
3. Commits and pushes

**Without this branch, the app renders empty/error state in production.** The seed data on `main` at `artifacts/aware-app/data/` is only used for `pnpm dev` (Vite static serve).

---

## Stage 5: GitHub Actions Bot Identity

| File | What to change |
|------|----------------|
| `scripts/init-data-branch.mjs` | `git config user.name "AWARE Bot"` → your bot name |
| `scripts/init-data-branch.mjs` | `git config user.email "bot@aware.dev"` → your bot email |
| `.github/workflows/deploy.yml` | `git config user.name "AWARE Bot"` |
| `.github/workflows/deploy.yml` | `git config user.email "bot@aware.dev"` |
| `.github/workflows/run-tests.yml` | `git config user.name "AWARE Bot"` |
| `.github/workflows/run-tests.yml` | `git config user.email "bot@aware.dev"` |
| `.github/workflows/sync-data-branches.yml` | `git config user.name` + `user.email` (4 occurrences, 2 different emails) |
| `.github/workflows/scheduler.yml` | uses GITHUB_TOKEN (no explicit bot name) |

Some workflows use `"AWARE Bot"` / `"bot@aware.dev"` and others use `"PROOF Bot"` / `"bot@proof-test.dev"`. **Standardize to one identity.**

---

## Stage 6: Deployment Pipeline

### `vite.config.ts` — `base` path (implicit via `BASE_PATH` env)

```
# In deploy.yml:
BASE_PATH: /${{ github.event.repository.name }}
```

If your GitHub pages URL is `your-org.github.io/your-repo/`, this auto-resolves. For a custom domain or non-standard path, set `BASE_PATH` explicitly.

### `deploy.yml` — artifact paths + Pages URL

The deploy workflow:
1. Builds to `artifacts/aware-app/dist/public/`
2. Copies `index.html` as `404.html` (SPA fallback)
3. Uploads as Pages artifact
4. `init-data-branch` job calls `scripts/init-data-branch.mjs`

No changes needed unless your project structure differs.

---

## Stage 7: Promotion Gate (Assumes UAT → PROD)

The promotion gate in `config/akamai-config.yml`:
```yaml
promotionGate:
  minPassRate: 95
  requiredSuites: [suite_smoke, suite_regression_uat]
```

And in `run-tests.yml` (line 317):
```bash
if [[ "$AWARE_ENV" != *UAT* || "$AWARE_SUITE" != "suite_regression_uat" ]]; then
  echo "Skipping promotion gate"
```

If your tier model doesn't have UAT→PROD promotion, disable or rewrite this gate.

---

## Stage 8: Branding

| File | What to change |
|------|----------------|
| `package.json` (root) | `name`, `description`, `repository.url` |
| `artifacts/aware-app/package.json` | `name`, `description` |
| `artifacts/aware-app/index.html` | `<title>`, meta description |
| `artifacts/aware-app/src/index.css` | `--proof-*` CSS custom properties |
| `artifacts/aware-app/src/components/aware/PropertyStatusBar.tsx` | Bar header text (line 271) |

---

## Stage 9: Verification Flow

```bash
# 1. Validate YAML configs
node scripts/validate-config.mjs

# 2. TypeScript compile check (catches AkamaiEnvId mismatches)
cd artifacts/aware-app
pnpm install
pnpm run typecheck

# 3. Data contract validation (catches seed data mismatches)
pnpm run validate:data

# 4. Unit tests
pnpm test

# 5. Test discovery
pnpm discover:tests

# 6. Production build
pnpm build

# 7. Full pre-commit check
pnpm run verify
```

---

## Complete File Touchpoint Map (36 files)

### MUST CHANGE (12 files)
| # | File | What |
|---|------|------|
| 1 | `config/environments.yml` | IPs, URLs, versions, tiers |
| 2 | `config/test-suites.yml` | Suite env labels, parallelism, schedules |
| 3 | `config/akamai-config.yml` | Property metadata, EdgeWorker IDs, promotions |
| 4 | `artifacts/aware-app/src/lib/types.ts` | `AkamaiEnvId`, `AkamaiTier` unions |
| 5 | `artifacts/aware-app/src/lib/envConfig.ts` | Runtime mirror of environments.yml |
| 6 | `artifacts/aware-app/src/lib/dataFetcher.ts` | `REPO_OWNER`, `REPO_NAME` |
| 7 | `artifacts/aware-app/index.html` | Title, og:url, og:image |
| 8 | `.github/workflows/run-tests.yml` | Suite + env choice options |
| 9 | `.github/workflows/deploy.yml` | Bot identity |
| 10 | `.github/workflows/sync-data-branches.yml` | Bot identity |
| 11 | `.github/workflows/scheduler.yml` | (usually fine — reads config at runtime) |
| 12 | `scripts/init-data-branch.mjs` | Bot identity |

### MUST CHANGE (env-specific coloring & labeling — 4 files)
| # | File | What |
|---|------|------|
| 13 | `artifacts/aware-app/src/lib/runs.ts` | `ENV_COLOR_MAP` (every label + tier) |
| 14 | `artifacts/aware-app/src/lib/constants.ts` | `ENVS` array |
| 15 | `artifacts/aware-app/src/components/aware/PropertyStatusBar.tsx` | `TIER_META` colors, tier iteration order |
| 16 | `.github/workflows/run-tests.yml` | Promotion gate tier check |

### SHOULD CHANGE (hardcoded URLs — 8 files)
| # | File | What |
|---|------|------|
| 17 | `artifacts/aware-app/src/lib/nav.ts` | `repo` URL |
| 18 | `artifacts/aware-app/src/lib/utils.ts` | `github.com/ruake/AWARE/blob/main/...` |
| 19 | `artifacts/aware-app/src/lib/ai/context.ts` | Data source mention in system prompt |
| 20 | `artifacts/aware-app/src/pages/About.tsx` | GitHub link |
| 21 | `artifacts/aware-app/src/pages/RunDetail.tsx` | Actions run link |
| 22 | `artifacts/aware-app/src/pages/Dashboard.tsx` | Actions link |
| 23 | `artifacts/aware-app/src/pages/StartRun.tsx` | Actions link |
| 24 | `artifacts/aware-app/src/pages/TestSuiteManager.tsx` | GitHub file URL fallback |

### SHOULD CHANGE (branding — 4 files)
| # | File | What |
|---|------|------|
| 25 | `package.json` (root) | name, description, repo url |
| 26 | `artifacts/aware-app/package.json` | name, description |
| 27 | `artifacts/aware-app/src/index.css` | `--proof-*` tokens |
| 28 | `artifacts/aware-app/src/components/aware/PropertyStatusBar.tsx` | Bar header label |

### SHOULD CHANGE (seed data — 6 files)
| # | File | What |
|---|------|------|
| 29 | `artifacts/aware-app/data/runs.json` | All `env`, `envId`, `network` fields |
| 30 | `artifacts/aware-app/data/test-results.json` | keys by runId (must match runs.json) |
| 31 | `artifacts/aware-app/data/diff-rows.json` | (usually empty — computed at runtime) |
| 32 | `artifacts/aware-app/data/promotions.json` | References run IDs |
| 33 | `artifacts/aware-app/data/test-suites.json` | `envIds` arrays |
| 34 | `artifacts/aware-app/data/auto-tests.json` | Regenerate with `pnpm discover:tests` |

### NICE TO CHANGE (2 files)
| # | File | What |
|---|------|------|
| 35 | `config/akamai-config.yml` | Slack channel, notification settings |
| 36 | `.github/workflows/validate-config.yml` | PR comment link to SETUP.md |

---

## Decision Tree: Which Tier Model Fits?

```
Is your Akamai setup 3 tiers (dev/qa → staging → prod)?
  ├─ YES, and you keep QA/UAT/PROD naming → Update IPs + versions only (smallest change)
  ├─ YES, but rename tiers (DEV/STAGING/PROD) → Update types.ts + all 5 labeling touchpoints (medium change)
  └─ NO, fewer tiers (e.g., just staging + production)
      → Update types.ts (remove tiers from union)
      → Update envConfig.ts + environments.yml (fewer objects)
      → Update PropertyStatusBar (remove TierGroups)
      → Update ENV_COLOR_MAP + ENVS
      → Remove promotion gate
      → Regenerate seed data
```

---

## Common Pitfalls (in order of frequency)

1. **Data branch doesn't exist** — app loads empty. Run `node scripts/init-data-branch.mjs`
2. **AkamaiEnvId missing from union** — TypeScript build error on `envConfig.ts`
3. **envConfig.ts out of sync with environments.yml** — CI reads one, SPA reads other; shows different environments
4. **Label string mismatch** — `"QA / Staging"` ≠ `"QA/Staging"` ≠ `"qa-staging"`. A single space breaks GHA dispatch parsing
5. **Seed data references old env IDs** — runs.json has `envId: "qa_staging"` but types.ts removed it → build fails
6. **ENV_COLOR_MAP missing new env label** — chart renders grey (`#9aa0a6` fallback) instead of proper color
7. **Bot identity mismatch** — git commit fails in CI because `user.email` is not configured
8. **BASE_PATH mismatch** — built assets 404 on GitHub Pages if the subpath doesn't match the repo name

---

## Prerequisites

- `gh` CLI authenticated
- GitHub Pages enabled (Settings → Pages → Source: GitHub Actions)
- Repository secrets: `GITHUB_TOKEN` (auto), optionally Akamai API tokens

# A.W.A.R.E. — Akamai Web Analytics Regression Engine

A.W.A.R.E. is a CDN test observability dashboard for Playwright + pytest suites running via GitHub Actions across **QA**, **UAT**, and **PROD** Akamai edge environments. It surfaces pass-rate trends, regression comparisons, and Akamai property activation status in a single always-visible view.

## Run & Operate

- `pnpm --filter @workspace/aware-app run dev` — run the app (dev server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19 + Vite 7 + Tailwind CSS 4
- Routing: wouter
- Charts: react-google-charts + recharts
- AI Copilot: WebLLM / OpenAI-compatible

## Where things live

- `artifacts/aware-app/src/` — main React app source
- `artifacts/aware-app/src/pages/` — Dashboard, Runs, Compare, Analytics, Suites, Copilot, CI Pipeline, About
- `artifacts/aware-app/src/lib/` — data layer (runs, testCases, envConfig, ciConfig, types, constants)
- `artifacts/aware-app/data/` — seed JSON (runs, test-results, test-suites, auto-tests)
- `artifacts/aware-app/src/components/aware/` — domain components (AppLayout, PropertyStatusBar, …)
- `config/` — repo-committed YAML config (akamai-config.yml, environments.yml, test-suites.yml)
- `.github/workflows/run-tests.yml` — GitHub Actions CDN test workflow

## Architecture decisions

- **Three environments: QA → UAT → PROD** — replacing the old four-env Prod/Staging matrix. Promotion gate enforces ≥ 95% pass rate before UAT → PROD.
- **PropertyStatusBar always visible on Dashboard** — shows active Akamai property name, version, and status for all three envs at a glance.
- **Config-as-code** — `config/environments.yml`, `config/test-suites.yml`, and `config/akamai-config.yml` are the single source of truth; CI reads them directly.
- **Playwright + pytest both supported** — TestCase.testType includes `"pytest"` and `"web"` (Playwright); the CI workflow runs both in parallel jobs.
- **All data in repo** — seed JSON in `data/` and YAML in `config/` live alongside code; no external database required.

## Product

- **Dashboard** — pass-rate KPIs, always-visible Akamai property status (QA/UAT/PROD), anomaly banners, env health cards, heatmap
- **Runs** — full history of Playwright + pytest CI runs with env/suite filtering
- **Compare** — side-by-side diff of two runs; surfaces regressions and fixes
- **Analytics** — pass-rate trends, category heatmaps, flakiness scores
- **Suites** — hierarchical test suite manager; maps to `config/test-suites.yml`
- **CI Pipeline** — GitHub Actions status and downloadable AWARE config YAML
- **Copilot** — AI-assisted test analysis and generation

## User preferences

- Always show QA, UAT, and PROD environments — never fewer than three
- Use Akamai-specific terminology: property, property version, PoP, EdgeWorker, cpcode
- Test runner language: Playwright (browser) and pytest (API / EdgeWorker)
- GitHub Actions is the CI platform; workflow file lives at `.github/workflows/run-tests.yml`
- Config is in the repo (`config/`) — highly configurable and scalable

## Gotchas

- `envConfig.ts` is the source of truth for environment definitions in the app; `config/environments.yml` is the repo-committed version for CI.
- runs.json `env` field now uses `"QA"`, `"UAT"`, or `"PROD"` (not old "production"/"staging" strings).
- `ENV_COLOR_MAP` in `runs.ts` has both new and legacy labels for backward compat.
- The PropertyStatusBar reads from `getEnvConfigs()` which supports localStorage override (for user customization).

## Pointers

- See `config/akamai-config.yml` for property + EdgeWorker definitions
- See `config/test-suites.yml` for suite-to-environment mapping and schedules
- See `.github/workflows/run-tests.yml` for the full CI workflow

# A.W.A.R.E. — Akamai Web Analytics Regression Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy](https://github.com/ruake/AWARE/actions/workflows/deploy.yml/badge.svg)](https://github.com/ruake/AWARE/actions/workflows/deploy.yml)
[![Scheduler](https://github.com/ruake/AWARE/actions/workflows/scheduler.yml/badge.svg)](https://github.com/ruake/AWARE/actions/workflows/scheduler.yml)

**A.W.A.R.E.** is a CDN test observability dashboard for Playwright + pytest suites running via GitHub Actions across **QA**, **UAT**, and **PROD** Akamai edge environments. Fork it, edit three config files, push — and your static dashboard is live with automated test runs, data recording, and a promotion gate.

**Live demo:** https://ruake.github.io/AWARE

---

## Quick Start

```bash
git clone https://github.com/ruake/AWARE.git
cd AWARE/artifacts/aware-app
pnpm install
pnpm dev
```

Open http://localhost:5173

### One-time fork configuration

1. **Fork** this repo
2. Edit `config/akamai-config.yml` — property name, contract/group IDs, CP code
3. Edit `config/environments.yml` — your 6 environments (QA/UAT/PROD × staging/production)
4. Edit `config/test-suites.yml` — suites, schedules, runners
5. Enable GitHub Pages (Settings → Pages → Source: GitHub Actions)
6. Push — everything else is automated

---

## Architecture

AWARE combines a static React SPA (GitHub Pages) with a CI/CD engine (GitHub Actions) that runs CDN property tests on a schedule and records results to an orphan `data` branch:

```
config/*.yml ──► GitHub Actions ──► Playwright + pytest ──► data/ branch ──► SPA (runtime fetch)
```

| Component | Role |
|-----------|------|
| **config/** | YAML source of truth for environments, suites, Akamai property metadata |
| **GitHub Actions** | Scheduler (cron), test runner, data recording, deploy, data sync |
| **tests/** | Playwright E2E specs and pytest HTTP validators |
| **artifacts/aware-app/** | React 19 SPA — static dashboard deployed to GitHub Pages |
| **data/** (branch) | Orphan branch holding `runs.json`, `test-results.json`, `auto-tests.json`, etc. |

### Environment Model (3 tiers × 2 networks = 6 envs)

| ID | Label | Target | Network |
|----|-------|--------|---------|
| `qa_staging` | QA / Staging | QA | staging |
| `qa_prod` | QA / Production | QA | production |
| `uat_staging` | UAT / Staging | UAT | staging |
| `uat_prod` | UAT / Production | UAT | production |
| `prod_staging` | PROD / Staging | PROD | staging |
| `prod_prod` | PROD / Production | PROD | production |

A promotion gate enforces ≥95% UAT pass rate before PROD property activation.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.9 (strict) |
| Frontend | React 19, Vite 7, Tailwind CSS 4 |
| Charts | Recharts (primary), react-google-charts (legacy) |
| Routing | wouter |
| Testing | Vitest (unit), Playwright (E2E), pytest (CDN validation) |
| LLM | Mock · OpenAI-compatible · WebLLM (WebGPU) · window.ai |
| Package manager | pnpm 10.26.1 |
| CI/CD | GitHub Actions → GitHub Pages |
| 3D Visualization | Three.js (PoPGlobe) |

---

## Available Scripts

Run from `artifacts/aware-app/`:

| Script | Description |
|--------|-------------|
| `pnpm dev` | Dev server at :5173 (host 0.0.0.0) |
| `pnpm build` | Validate data → Vite build → `dist/public/` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright browser tests |
| `pnpm discover:tests` | Python AST + Playwright discovery → `auto-tests.json` |
| `pnpm validate:data` | JSON Schema validation for all data files |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier check |
| `pnpm verify` | typecheck + lint + format + test (pre-commit hook) |

---

## Dashboard Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Pass-rate KPIs, property status bar (6 envs), anomaly alerts, heatmap |
| Runs | `/runs` | Filterable run history with detail side panel |
| Run Detail | `/runs/:runId` | Test results + HTTP evidence viewer |
| Compare | `/compare` | Baseline vs candidate diff (regressions and fixes) |
| Test Analytics | `/analytics` | Pass-rate trends, category heatmaps, flakiness leaderboard |
| Test Manager | `/tests` | Test case CRUD, bulk actions, import/export |
| Test Suite Manager | `/suites` | Hierarchical suite tree + YAML preview |
| AI Copilot | `/copilot` | AI-assisted analysis (OpenAI / WebLLM / Chrome AI) |
| Pulse | `/pulse` | Live status feed |
| CI Pipeline | `/ci` | Workflow status + YAML config download |
| Test Documentation | `/docs/:testId` | Per-test doc viewer |
| Search | `/search` | Fuse.js full-text search |

---

## GitHub Actions Workflows

| Workflow | File | Schedule | Purpose |
|----------|------|----------|---------|
| Deploy | `deploy.yml` | Push to `main` | Typecheck → test → build → Pages deploy |
| Scheduler | `scheduler.yml` | Every 15 min | Cron eval + suite dispatch via `scripts/scheduler.mjs` |
| Run Tests | `run-tests.yml` | Dispatched | Playwright + pytest across all 6 envs |
| Sync Data | `sync-data-branches.yml` | Push to `main` | Push seed data to orphan `data` branch |
| Validate Config | `validate-config.yml` | Push/PR | Validate YAML config files |
| Code Quality | `code-quality.yml` | Push/PR | Lint, typecheck, audit, CodeQL |

---

## Project Structure

```
config/                          ← edit these three files to configure AWARE
├── akamai-config.yml
├── environments.yml
└── test-suites.yml

.github/workflows/
├── deploy.yml                   Build + deploy to GitHub Pages
├── scheduler.yml                Every-15-min orchestrator
├── run-tests.yml                Playwright + pytest execution engine
├── sync-data-branches.yml       Seed data sync
├── validate-config.yml          Config validation
└── code-quality.yml             Lint + typecheck + audit

scripts/
├── scheduler.mjs                Cron-based suite dispatcher
├── record-run.mjs               Write run results to data branch
├── init-data-branch.mjs         One-time data branch bootstrap
├── reconcile-runs.mjs           K8s-style run status reconciler
├── discover-all.mjs             Test discovery orchestrator
├── discover-tests.py            Python AST parser
├── discover-playwright.mjs      Playwright spec parser
└── lib/                         Reconciler, runStatus, ghApi utilities

artifacts/aware-app/
├── src/
│   ├── pages/                   12+ pages (React.lazy)
│   ├── components/
│   │   ├── aware/               Domain components (inline style + --proof-* CSS vars)
│   │   └── ui/                  shadcn/radix primitives (Tailwind CSS 4)
│   ├── lib/                     Types, store, data fetcher, AI, charts, CI config
│   ├── hooks/                   useTestData, useSimpleToast, etc.
│   └── data/                    Seed JSON + JSON Schemas
├── vite.config.ts
└── package.json
```

---

## Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `BASE_PATH` | `/` | No | Set to `/AWARE/` for GitHub Pages |
| `PORT` | `5173` | No | Dev server port |
| `OPENAI_API_KEY` | — | No | Server-side OpenAI proxy for Copilot |
| `GITHUB_TOKEN` | — | Yes (CI) | For scheduler and data branch operations |

---

## Links

- **Live dashboard:** https://ruake.github.io/AWARE
- **Repository:** https://github.com/ruake/AWARE
- **Issue tracker:** https://github.com/ruake/AWARE/issues

## License

MIT

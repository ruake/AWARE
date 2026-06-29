# A.W.A.R.E. — Akamai Web Analytics Regression Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Config Validation](https://github.com/your-org/aware/actions/workflows/validate-config.yml/badge.svg)](https://github.com/your-org/aware/actions/workflows/validate-config.yml)
[![Deploy](https://github.com/your-org/aware/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-org/aware/actions/workflows/deploy.yml)

**A.W.A.R.E.** is a CDN test observability dashboard for Playwright + pytest suites running via GitHub Actions across **QA**, **UAT**, and **PROD** Akamai edge environments. Fork it, edit three config files, push — and your static dashboard is live with automated test runs, data recording, and a promotion gate.

**Live demo:** https://ruake.github.io/AWARE

---

## Fork & Configure in 5 minutes

> **See [SETUP.md](SETUP.md) for the complete guide.**

1. **Fork** this repo
2. Edit `config/akamai-config.yml` — your property name, contract/group IDs, CP code
3. Edit `config/environments.yml` — your 6 environments (QA/UAT/PROD × staging/production)
4. Edit `config/test-suites.yml` — your suites, schedules, and runners
5. Enable GitHub Pages (Settings → Pages → Source: GitHub Actions)
6. Push — everything else is automated

---

## What you get automatically

| Capability | How |
|------------|-----|
| Static dashboard on GitHub Pages | `deploy.yml` — builds + deploys on every push to `main` |
| Config validation on every push | `validate-config.yml` — blocks merges on invalid config |
| Scheduled test runs | `scheduler.yml` — every 15 min, dispatches suites per cron schedule |
| Run data recording | `record-run.mjs` — writes JSON to the `data` branch after each run |
| Promotion gate | `run-tests.yml` — blocks UAT → PROD if pass rate < 95% |
| Code quality checks | `code-quality.yml` — lint, typecheck, audit, CodeQL |

---

## Dashboard pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Pass-rate KPIs, Akamai property status (all 6 envs), anomaly banners, heatmap |
| Runs | `/runs` | Full run history with env/suite filtering and side panel |
| Run Detail | `/runs/:runId` | Test results + HTTP evidence viewer |
| Compare | `/compare` | Side-by-side diff; surfaces regressions and fixes |
| Analytics | `/analytics` | Pass-rate trends, category heatmaps, flakiness scores |
| Suites | `/suites` | Suite hierarchy manager; maps to `config/test-suites.yml` |
| AI Copilot | `/copilot` | AI-assisted test analysis and generation (OpenAI / WebLLM / mock) |
| CI Pipeline | `/ci` | GitHub Actions status and AWARE config YAML download |
| Tests | `/tests` | Test case CRUD, bulk actions, import/export |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.9 (strict) |
| Frontend | React 19, Vite 7, Tailwind CSS 4 |
| Charts | Google Charts + Recharts |
| Routing | wouter |
| LLM | Mock · OpenAI-compatible · WebLLM (WebGPU) |
| Package manager | pnpm workspaces |
| CI/CD | GitHub Actions → GitHub Pages |

---

## Local development

```bash
pnpm install
pnpm --filter @workspace/aware-app run dev
```

Open http://localhost:5000

### Validate your config locally

```bash
node scripts/validate-config.mjs
```

### Build for production

```bash
BASE_PATH=/aware pnpm --filter @workspace/aware-app run build
```

---

## Config files

| File | Purpose |
|------|---------|
| `config/akamai-config.yml` | Property metadata, EdgeWorker versions, promotion gate thresholds |
| `config/environments.yml` | 6 Akamai environments (QA/UAT/PROD × staging/production networks) |
| `config/test-suites.yml` | Suite definitions, cron schedules, runners, parallelism |

These files are the **single source of truth** — both GitHub Actions and the dashboard read them directly.

---

## Environment variables

Copy `.env.example` for local development. For GitHub Actions, add secrets at Settings → Secrets → Actions.

| Variable | Default | Required |
|----------|---------|----------|
| `BASE_PATH` | `/` | No — set to `/aware` for GitHub Pages |
| `PORT` | `5000` | No |
| `VITE_LLM_PROVIDER` | `mock` | No — set to `openai` for AI Copilot |
| `VITE_LLM_API_KEY` | — | No — OpenAI key for Copilot |
| `SLACK_WEBHOOK_URL` | — | No — failure notifications |
| `PAGERDUTY_ROUTING_KEY` | — | No — PROD alerts |

---

## Project structure

```
config/                          ← edit these three files to configure AWARE
├── akamai-config.yml            property + EdgeWorker + promotion gate
├── environments.yml             6 target environments
└── test-suites.yml              suites, schedules, runners

scripts/
├── validate-config.mjs          config validator (CI + local)
├── init-data-branch.mjs         one-time data branch bootstrap
├── scheduler.mjs                cron-based suite dispatcher
└── record-run.mjs               writes run results to data branch

.github/workflows/
├── validate-config.yml          blocks on invalid config (push/PR)
├── deploy.yml                   build + deploy to GitHub Pages
├── run-tests.yml                Playwright + pytest execution engine
├── scheduler.yml                every-15-min orchestrator
└── code-quality.yml             lint, typecheck, audit, CodeQL

artifacts/aware-app/
├── src/                         React 19 + Vite 7 SPA
│   ├── pages/                   Dashboard, Runs, Compare, Analytics, …
│   ├── components/              aware/ domain + ui/ shadcn components
│   └── lib/                     data layer, types, LLM, CI config
├── data/                        seed JSON (runs, test-results, suites)
└── scripts/                     validate-data.mjs, record-run.mjs, …
```

---

## License

MIT

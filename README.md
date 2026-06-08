# PROOF — Test Observability Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-blue)](https://ruake.github.io/AWARE)

**PROOF** is a configurable web application testing observability dashboard. It visualizes pass-rate trends across multiple environments, surfaces regressions via side-by-side run comparison, and provides per-test analytics — all as a static SPA served via GitHub Pages.

**Live demo:** https://ruake.github.io/AWARE

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Multi-environment pass-rate charts, per-env health cards, regression alerts, promotion banner |
| Runs | `/runs` | Filterable run table with column filters, status/target quick filters, side panel with CTAs |
| Run Detail | `/runs/:runId` | Test results table + HTTP evidence viewer with syntax-highlighted request/response |
| Compare | `/compare` | Baseline vs. candidate diff with column filters, regression/fixed/duration CTAs, side panel |
| Tests | `/tests` | Test case CRUD, multi-select bulk actions, batch status/priority/suite, multi-format import (JSON/YAML/JUnit), stats dashboard, template/AI generation |
| Suites | `/suites` | Suite tree hierarchy, editor modal, YAML export, Recharts pie/bar charts |
| Analytics | `/analytics` | Per-test analytics (supports both `testId=tc_N` and `diffId=diff_N`), pass-rate trend, duration history, flakiness score |
| AI Copilot | `/copilot` | AI chat with skill selector, 3 providers (Mock/OpenAI/WebLLM), WebLLM availability check + user-friendly unavailable message |
| Test Doc | `/testdoc` | Per-test deep-dive with docstring, predicates, changelog timeline |
| Start Run | `/start` | Full-page workflow dispatcher: suite, target, env, parallelism, command preview |
| Search | `/search` | Full-page keyboard-navigable search wired to real testCasesStore, RUNS, and DIFF_ROWS |
| Sharing | `/share` | Permalink/share with entity tabs, export formats, badge embed |
| Status | `/status` | System status dashboard |
| About | `/about` | Project info, feature cards, tech stack |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript 5.9 (strict) |
| **Frontend** | React 19, Vite 7, Tailwind CSS 4 |
| **Charts** | Google Charts |
| **LLM** | Mock (offline), OpenAI-compatible, WebLLM (WebGPU) |
| **Icons** | lucide-react |
| **Package Manager** | pnpm |
| **CI/CD** | GitHub Actions (build + deploy to GitHub Pages) |

## Getting Started

```bash
cd artifacts/aware-app
pnpm install
pnpm dev
```

Open http://localhost:5173

### Build for GitHub Pages

```bash
cd artifacts/aware-app
pnpm build
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5173` | Dev server port |
| `BASE_PATH` | `/` | Path prefix (use `/PROOF` for GitHub Pages) |

## Project Structure

```
artifacts/aware-app/src/
├── lib/               # Data layer (store, runs, testCases, testSuites, promotions, llm, skills, types)
├── components/
│   ├── aware/         # AppLayout, ColumnFilter, CTAStatCard, FilterBar, GenerateWizard, etc.
│   └── ui/            # shadcn/ui components
├── pages/             # 15 page components (Dashboard, Runs, Compare, TestManager, Copilot, etc.)
├── hooks/             # useSimpleToast, useTestData, useSyncedUrlState
├── App.tsx            # wouter Router with all routes
├── main.tsx           # Entry point
├── _group.css         # GCP theme CSS variables
└── index.css          # Tailwind imports
```

## Features

- **Multi-environment pass-rate charts** — Composite line chart with all environments overlaid
- **Column-header filtering** — Every table column supports text search + multi-select checkboxes
- **Regression alerts** — Dashboard highlights pass-rate drops; Compare shows regression/fixed/duration delta
- **AI Copilot** — Chat interface with 5 skills for test generation, script creation (YAML), result analysis, diff explanation, suite config generation
- **LLM providers** — Mock (offline), OpenAI-compatible, WebLLM (WebGPU) — configurable per session
- **Stat-to-filter CTAs** — Clickable summary cards toggle column filters across Compare, Analytics, Runs, Dashboard
- **Bulk generation** — Template-based or AI-powered test case generation with suite assignment
- **Import/Export** — JSON, CSV, JUnit XML
- **Dark mode** — GCP-inspired light/dark theme toggle
- **SPA routing** — wouter with 404 fallback for GitHub Pages

## GitHub Actions

Push to `main` triggers the [deploy workflow](.github/workflows/deploy.yml) which:
1. Installs dependencies with pnpm
2. Builds with `BASE_PATH=/AWARE`
3. Copies `index.html` as `404.html` for SPA routing
4. Uploads and deploys to GitHub Pages

> **Note:** The deploy workflow still uses `AWARE` for backwards compatibility until the domain is migrated.

The [run-tests workflow](.github/workflows/run-tests.yml) accepts `workflow_dispatch` inputs (branch, suite, target, environment) for triggerable test runs.

## License

MIT

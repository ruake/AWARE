# A.W.A.K.E. — Akamai Web Analyser & Kit for Evaluations

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-blue)](https://ruake.github.io/AWARE)

**A.W.A.K.E.** is a cross-target test observability mockup for Akamai CDN configurations. It visualizes pass-rate trends across multiple environments, surfaces regressions via side-by-side run comparison, and provides per-test analytics — all as a static SPA served via GitHub Pages.

**Live demo:** https://ruake.github.io/AWARE

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/preview/aware/Dashboard` | Multi-environment pass-rate line charts, per-target health cards, regression alerts, version drift detection |
| Runs | `/preview/aware/Runs` | Filterable run table with column-header filters (text + checkboxes), status/target/env quick filters, inline permalink & Slack sharing, pagination |
| Run Detail | `/preview/aware/RunDetail?runId=...` | Split-panel: filterable test results table (left) + HTTP evidence viewer (right) with syntax-highlighted request/response/PM variables |
| Compare | `/preview/aware/Compare?baseline=...&candidate=...` | Baseline vs. candidate diff table with column filters, regression/fixed/duration-change detection, side panel with per-test analytics link |
| New Run | `/preview/aware/StartRun` | Full-page workflow dispatcher: suite selector, target/environment picker, PM/EW version inputs, parallelism/retries/fail-fast controls, live gh/curl/Python command previews, one-click GitHub Actions launch |
| Search | `/preview/aware/SearchDemo` | Full-page global search with keyboard navigation, facet filters (Tests/Runs/Compare), recent items, quick actions |
| Test Analytics | `/preview/aware/TestAnalytics?testId=...` | Per-test analytics dashboard with pass-rate trend, duration history, flakiness score, and run history table |
| Test Doc | `/preview/aware/TestDoc` | Per-test deep-dive with docstring, tags, preconditions, git change history |
| About | `/preview/aware/About` | Project info, live stats, feature cards, tech stack |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript 5.9 (strict) |
| **Frontend** | React 19, Vite 7, Tailwind CSS 4 |
| **Charts** | react-google-charts (Gauge, Line, Bar, Column) |
| **Icons** | lucide-react |
| **Package Manager** | pnpm workspaces |
| **CI/CD** | GitHub Actions (build + deploy to GitHub Pages) |

## Getting Started

```bash
pnpm install
pnpm run typecheck
pnpm --filter @workspace/mockup-sandbox run dev
```

Open http://localhost:5173/preview/aware/Dashboard

### Build for GitHub Pages

```bash
cd artifacts/mockup-sandbox
BASE_PATH=/AWARE PORT=1 pnpm build
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5173` | Dev server port |
| `BASE_PATH` | `/` | Path prefix (use `/AWARE` for GitHub Pages) |

## Project Structure

```
├── artifacts/
│   └── mockup-sandbox/          # React UI sandbox
│       ├── src/
│       │   ├── components/
│       │   │   └── mockups/
│       │   │       └── aware/   # All page components
│       │   │           ├── _shared/  # Shared data, nav, ColumnFilter, AppLayout
│       │   │           ├── Dashboard.tsx
│       │   │           ├── Runs.tsx
│       │   │           ├── RunDetail.tsx
│       │   │           ├── Compare.tsx
│       │   │           ├── StartRun.tsx
│       │   │           ├── SearchDemo.tsx
│       │   │           ├── TestAnalytics.tsx
│       │   │           ├── TestDoc.tsx
│       │   │           ├── Sharing.tsx
│       │   │           └── About.tsx
│       │   └── App.tsx          # Preview dispatcher
│       └── .github/workflows/   # Deploy workflow
├── .github/workflows/           # CI workflows (root)
└── docs/screenshots/            # Project screenshots
```

## Features

- **Multi-environment pass-rate charts** — Composite line chart with all 4 environments overlaid + time-slice selector (7d/14d/30d/All)
- **Column-header filtering** — Every table column supports text search + multi-select checkboxes; toolbar has quick filters for status/suite/target/env
- **Regression alerts** — Dashboard highlights environments with pass-rate drops; Compare page shows regression/fixed/duration-change delta
- **Full-page workflow dispatcher** — Dedicated Start Run page with suite selector, version inputs, parallelism/retries controls, and live gh/curl/Python command preview with one-click GitHub Actions launch
- **Global search** — Full-page keyboard-navigable search across tests, runs, and comparisons with facet filters; Enter navigates to the result
- **Side-by-side comparison** — Syncable URL with baseline/candidate run selectors, side panel for per-test detail, one-click GitHub issue filing
- **Clipboard integration** — Every shareable entity has copy-to-clipboard with visual feedback (permalink, Slack snippet, GitHub issue template)
- **Dark mode** — GCP-inspired light/dark theme toggle
- **SPA 404 fallback** — `404.html` copies `index.html` for client-side routing on GitHub Pages

## GitHub Actions

Push to `main` triggers the [deploy workflow](.github/workflows/deploy.yml) which:
1. Installs dependencies with pnpm
2. Builds with `BASE_PATH=/AWARE`
3. Copies `index.html` as `404.html` for SPA routing
4. Uploads and deploys to GitHub Pages

The [run-tests workflow](.github/workflows/run-tests.yml) accepts `workflow_dispatch` inputs (branch, suite, target, environment) for triggerable test runs.

## License

MIT

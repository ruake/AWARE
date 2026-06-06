# A.W.A.K.E. — Akamai Web Analyser & Kit for Evaluations

A cross-target test observability mockup for Akamai CDN configurations. Browse test runs, inspect failing HTTP evidence, compare any two runs side-by-side, drill into per-test analytics, and dispatch new runs — all as a static SPA with zero backend.

## Live Demo

**https://ruake.github.io/AWARE**

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/preview/aware/Dashboard` | Multi-environment composite line chart, per-target health cards, regression alerts, outcome mix bar, version drift, time-slice selector |
| Runs | `/preview/aware/Runs` | Filterable run table with column-header filters (text + checkboxes), status/suite/target/env toolbar filters, pagination, inline share links |
| Run Detail | `/preview/aware/RunDetail?runId=...` | Split-panel: test results table (left) with column filters + time slice + evidence viewer (right) showing request/response/PM variables |
| Compare | `/preview/aware/Compare?baseline=...&candidate=...` | URL-synced run diff with per-column filters, regression-only toggle, side panel with per-test analytics link |
| New Run | `/preview/aware/StartRun` | Full-page workflow dispatcher: suite selector, target/env inputs, parallelism/retries, live gh/curl/Python command previews, one-click GitHub Actions launch |
| Search | `/preview/aware/SearchDemo` | Full-page keyboard-navigable search across tests, runs, and comparisons with facet filter chips |
| Test Analytics | `/preview/aware/TestAnalytics?testId=...` | Per-test dashboard: pass-rate trend, duration history, flakiness score, run history table |
| Test Doc | `/preview/aware/TestDoc` | Per-test deep-dive with docstring, tags, preconditions, git change history |
| About | `/preview/aware/About` | Project info, live stats, feature cards, tech stack table |

## Tech Stack

- **React 19** + **TypeScript 5.9** (strict)
- **Vite 7** (dev server + build)
- **react-google-charts** (Gauge, Line, Bar, Column charts)
- **lucide-react** (icons)
- **Tailwind CSS v4**
- **pnpm** (package manager)

## Development

```bash
cd artifacts/mockup-sandbox
pnpm install
PORT=5173 BASE_PATH=/ pnpm dev
```

Open http://localhost:5173/preview/aware/Dashboard

## Build for Production

```bash
cd artifacts/mockup-sandbox
BASE_PATH=/AWARE PORT=1 pnpm build
```

Output goes to `dist/`.

## GitHub Pages

Push to `main` — the [deploy workflow](.github/workflows/deploy.yml) builds with `BASE_PATH=/AWARE` and deploys automatically via `actions/deploy-pages@v5`. The workflow also copies `dist/index.html` to `dist/404.html` for SPA client-side routing fallback.

Manual deploy:
1. Repo **Settings → Pages**
2. Set source to **GitHub Actions**
3. The workflow handles the rest

## Features

- **Column-header filtering** — Every table column has inline text search + checkbox dropdown; toolbar filters for status/suite/target/env
- **Time-slice selectors** — `7d` / `14d` / `30d` / `All` on all chart pages
- **One-click navigation** — Chart points → RunDetail, compare CTA → Compare, row click → side panel, search results → page
- **Full-page New Run** — Dedicated page with suite selector, version inputs, parallelism/retries controls, live gh/curl/Python command preview tabs
- **SPA 404 fallback** — `404.html` copied from `index.html` for client-side routing on GitHub Pages

## License

MIT

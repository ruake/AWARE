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

## Using Your Own Data

There are two ways to plug your own data into the portal.

### Option 1: Replace mock data (easiest — no networking)

Edit `src/components/mockups/aware/_shared/data.ts`. This file exports all the mock data
the portal uses. Each export maps to a TypeScript interface in `types.ts`.

```ts
// Example — replace RUNS with your own:
export const RUNS: Run[] = [
  {
    id: "my_run_001",
    label: "My Suite · PM 1.0 · EW 2.0",
    suite: "regression",
    target: "Prod",
    status: "PASS",
    passPct: 100,
    failures: 0,
    duration: "12m",
    durationMs: 720000,
    started: "2026-06-06T10:00:00Z",
    pm: "1.0",
    ew: "2.0",
    env: "Production",
  },
  // ...
];
```

Set `VITE_USE_MOCK=true` (default) — no server or fetch calls needed.

### Option 2: Static JSON files (GitHub Actions → deploy)

Your CI pipeline generates JSON files and the portal fetches them at runtime.

#### Data contracts

Place JSON files at `{VITE_API_BASE_URL}/{path}`. The default path is `{BASE_URL}/data`
(e.g. `/AWARE/data` on GitHub Pages, `/data` in local dev).

| Endpoint | JSON file | Type |
|----------|-----------|------|
| `GET /runs` | `runs.json` | `Run[]` |
| `GET /diff` | `diff.json` | `DiffRow[]` |
| `GET /diff/details` | `diff/details.json` | `TestDetail[]` |
| `GET /dashboard/env-summary` | `dashboard/env-summary.json` | `EnvSummary[]` |
| `GET /dashboard/pass-rate` | `dashboard/pass-rate.json` | Google Charts 2D array |
| `GET /dashboard/env-pass-rate` | `dashboard/env-pass-rate.json` | Google Charts 2D array |

Endpoints like `GET /runs/{id}` and `GET /tests/{index}/history` are expected if
you wire a full REST API. When using static files they will 404 and gracefully
fall back to bundled mock data.

#### TypeScript interfaces (JSON shape reference)

```ts
interface Run {
  id: string;            // unique identifier, e.g. "run_001"
  label: string;         // human-readable label
  suite: string;         // "full_suite", "regression", etc.
  target: string;        // "Prod", "UAT", etc.
  status: "PASS" | "FAIL" | "PARTIAL" | "FLAKY";
  passPct: number;       // 0–100
  failures: number;
  duration: string;      // e.g. "45m"
  durationMs: number;    // milliseconds
  started: string;       // ISO 8601
  pm: string;            // PM version
  ew: string;            // EdgeWorker version
  env: string;           // environment name
}

interface DiffRow {
  id: string;
  name: string;          // test name
  baseStatus: "PASS" | "FAIL";
  candStatus: "PASS" | "FAIL";
  durBase: number;       // baseline duration (ms)
  durCand: number;       // candidate duration (ms)
  category: string;      // e.g. "geo-match"
  state: "regression" | "fixed" | "duration" | "unchanged";
}

interface TestDetail {
  history: Array<{
    runId: string;
    status: "PASS" | "FAIL";
    duration: number;   // ms
    env: string;
  }>;
  passRate: number;       // 0–100
  flakinessScore: number; // 0–100
  avgDuration: number;    // ms
}

interface EnvSummary {
  label: string;
  passRate: number;       // 0–100
  trend: number;          // percentage change (+/-)
  failures: number;
  color: string;          // hex color
  alert: string | null;   // alert message or null
}

interface TestResult {
  id: string;
  name: string;
  status: "PASS" | "FAIL";
  duration: number;       // ms
  category: string;
  suite: string;
}
```

#### Sample GitHub Actions workflow

Create `.github/workflows/publish-status.yml` in your repo:

```yaml
name: publish-status
on:
  schedule:
    - cron: "*/15 * * * *"   # every 15 minutes
  workflow_dispatch:          # manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # ── Step 1: Run your tests and generate JSON files ──
      - name: Generate status data
        run: |
          mkdir -p data/dashboard
          # Replace these with your own data generation
          echo '[{"id":"run_001","label":"...",...}]' > data/runs.json
          echo '[{"id":"diff_0","name":"...",...}]' > data/diff.json
          # ... generate the remaining files

      # ── Step 2: Deploy to GitHub Pages ──
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./data
          destination_dir: data
          keep_files: false
```

#### Configuration

```bash
# .env (local development)
VITE_USE_MOCK=false
VITE_API_BASE_URL=/data

# For GitHub Pages, BASE_URL is /AWARE so data lives at /AWARE/data
# Leave VITE_API_BASE_URL unset — it auto-resolves to {BASE_URL}/data
```

When a fetch fails (network error, 404, timeout) the portal **gracefully falls back**
to its bundled mock data. No blank screens, no broken pages.

## Data Architecture

```
data.ts                — Pure mock data (replace or delete for production)
  ↕ imports types from
types.ts               — All TypeScript interfaces + error types
  ↕ wrapped by
services.ts            — Service interfaces (RunService, DiffService, etc.)
                       - Mock impl:  returns data.ts values wrapped in Promise
                       - API impl:   fetch with timeout, retry, fallback
                       - Provider:   switches via VITE_USE_MOCK
  ↕ wrapped by
hooks.ts               — React hooks (useRuns, useDiffs, useEnvSummary, etc.)
                       - Async hooks: { data, loading, error, refetch }
                       - Sync hooks:  returns array directly (fills on mount)
  ↕ consumed by
Components             — Dashboard, Runs, RunDetail, Compare, etc.
```

Any service method can be overridden independently — the `fallback()` wrapper
catches API errors and serves mock data transparently.

## License

MIT

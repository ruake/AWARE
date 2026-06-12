---
name: AWARE Project Overview
description: Full project map — stack, pages, scripts, monorepo layout, all route paths, key constraints and non-obvious facts.
---

# AWARE Project Overview

## What it is
A.W.A.R.E. (Akamai Web Analytics Regression Engine) — CDN test observability dashboard for Playwright + pytest suites running via GitHub Actions across QA, UAT, and PROD Akamai edge environments. Also branded "PROOF" internally in some components.

## Monorepo Layout
```
/home/runner/workspace/
├── artifacts/aware-app/         ← main React SPA (pnpm package @workspace/aware-app)
│   ├── src/
│   │   ├── App.tsx              ← wouter Router, lazy page imports, QueryClientProvider
│   │   ├── main.tsx             ← React 19 entry point
│   │   ├── index.css            ← CSS variables (--proof-* design tokens)
│   │   ├── pages/               ← 16 pages (see routes below)
│   │   ├── components/aware/    ← domain components
│   │   ├── components/ui/       ← shadcn/radix primitives
│   │   ├── lib/                 ← data layer, AI, types, utils
│   │   ├── hooks/               ← custom hooks
│   │   └── data/                ← seed JSON files
│   ├── e2e/                     ← Playwright + Puppeteer + HTTP e2e tests
│   ├── scripts/                 ← Node.js build/data scripts
│   ├── package.json
│   ├── vite.config.ts
│   ├── playwright.config.ts
│   └── tsconfig.json
├── config/
│   ├── akamai-config.yml        ← property, EdgeWorker, runner, notification config
│   ├── environments.yml         ← all 6 environment definitions for CI
│   ├── test-suites.yml          ← suite schedules, parallelism, env assignments
│   └── aware-test-config.yml    ← auto-generated combined config (downloadable)
├── lib/
│   ├── api-client-react/        ← generated OpenAPI client hooks
│   ├── api-spec/                ← OpenAPI spec + Orval codegen config
│   ├── api-zod/                 ← generated Zod schemas
│   └── db/                      ← Drizzle ORM schema (placeholder)
└── .github/workflows/run-tests.yml
```

## All Route Paths (App.tsx)
| Path | Page | Notes |
|------|------|-------|
| `/` | Dashboard | KPIs, PropertyStatusBar, heatmap |
| `/home` | Home | Landing/marketing page |
| `/start` | StartRun | Trigger a new test run |
| `/runs` | Runs | Filterable run history table |
| `/runs/:runId` | RunDetail | Per-run drill-down with test results |
| `/compare` | Compare | Side-by-side run diff |
| `/analytics` | TestAnalytics | Pass-rate trends, flakiness, category heatmaps |
| `/tests` | TestManager | CRUD for test cases |
| `/suites` | TestSuiteManager | Hierarchical suite manager |
| `/copilot` | Copilot | AI chat interface |
| `/pulse` | Pulse | Live status / real-time feed |
| `/ci-pipeline` | Status | GitHub Actions status + YAML download |
| `/about` | About | Project info |
| `/testdoc` | TestDoc | Test documentation viewer |
| `/search` | SearchDemo | Fuse.js search demo |
| `/share` | Sharing | Shareable run links |
| `/status` | Status | Same as /ci-pipeline |

## Stack
- **Runtime**: Node.js 20, pnpm workspaces
- **Frontend**: React 19, Vite 7, TypeScript 5.9
- **Styling**: Tailwind CSS 4 (shadcn components only); inline styles + CSS vars for main app components
- **Routing**: wouter 3.3
- **Charts**: recharts 2.15 (primary), react-google-charts (legacy GoogleCharts component)
- **AI**: @mlc-ai/web-llm 0.2, OpenAI-compatible API, Chrome Built-in AI
- **3D**: Three.js + @react-three/fiber + @react-three/drei (PoPGlobe component)
- **Data fetching**: @tanstack/react-query
- **Search**: Fuse.js 7
- **YAML**: js-yaml 4
- **Testing**: Vitest (unit), Playwright 1.60 (e2e), Puppeteer (network), custom HTTP runner

## Key Scripts
| Script | Command |
|--------|---------|
| Dev server | `pnpm --filter @workspace/aware-app run dev` |
| Typecheck | `pnpm run typecheck` |
| Build | `pnpm run build` (runs validate-data.mjs prebuild) |
| Unit tests | `pnpm --filter @workspace/aware-app test` |
| E2E tests | `pnpm --filter @workspace/aware-app test:e2e` |
| Validate data | `node scripts/validate-data.mjs` |
| Generate data | `node scripts/generate-data.mjs` |
| Discover tests | `node scripts/discover-all.mjs` |

## Non-obvious Constraints
- No Tailwind in main AWARE components — use inline styles + `var(--proof-*)` CSS tokens
- wouter `<Link>` renders as `<a>` — never nest `<a>` inside it
- localStorage key for env config is `aware-env-configs-v3` (breaking change from v2)
- `runs.json` env field uses `"QA"` | `"UAT"` | `"PROD"` (not old "production"/"staging")
- ENV_COLOR_MAP keeps legacy labels for backward compat
- `validate-data.mjs` runs as prebuild — data schema violations block the build
- The app is a static SPA deployed to GitHub Pages; no server-side logic

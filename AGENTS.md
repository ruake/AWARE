# A.W.A.R.E. — opencode Agent Instructions

## Project
- **Name**: A.W.A.R.E. — Akamai Web Analytics Regression Engine (also branded "PROOF")
- **Stack**: React 19 + TypeScript 5.9 + Vite 7 SPA
- **App root**: `artifacts/aware-app/` (pnpm package `@workspace/aware-app`)
- **Purpose**: CDN test observability dashboard for Playwright + pytest suites across Akamai QA/UAT/PROD edge environments
- **Live**: https://ruake.github.io/AWARE | **Repo**: https://github.com/ruake/AWARE

## Commands
```bash
cd artifacts/aware-app
pnpm install
pnpm dev                    # dev server at :5173 (host 0.0.0.0)
pnpm build                  # prebuild validates data → vite build → dist/public/
pnpm run typecheck          # tsc --noEmit (MUST pass before commit)
pnpm run validate:data      # schema contract validation for all JSON data files
pnpm discover:tests         # runs Python AST + Playwright spec discovery → auto-tests.json
pnpm test                   # vitest unit tests
pnpm test:e2e               # Playwright browser tests
pnpm verify                 # typecheck + lint + format + test (full pre-commit check)
```

> Pre-commit hook runs `pnpm verify` automatically via `simple-git-hooks`. Install hooks with `pnpm install` (runs `prepare` script) or manually with `npx simple-git-hooks`.

## Architecture

### Routing (wouter)
- `<Switch>` / `<Route>` / `<Link>` with `base={import.meta.env.BASE_URL.replace(/\/$/, "")}`
- Navigate: `const [, navigate] = useLocation()` — never use `window.location.href` for SPA nav
- `navTo()` in `src/lib/nav.ts` uses `window.location.href` (full-page nav only)
- `<Link>` renders as `<a>` — **never nest another `<a>` inside `<Link>`**

### Styling Rules (CRITICAL)
- **Main AWARE pages and domain components**: inline `style={{}}` with `var(--proof-*)` CSS variables
- CSS tokens defined in `src/index.css` with `--proof-*` prefix (`--proof-grey-bg`, `--proof-blue`, etc.)
- `src/_group.css` has group-level layout utilities
- **Tailwind CSS 4** is ONLY used inside `src/components/ui/` (shadcn/radix primitives)
- Never add Tailwind `className` to components in `src/components/aware/` or `src/pages/`

### Charts
- **Primary**: `recharts` — `LineChart`, `AreaChart`, `BarChart`, `ResponsiveContainer` etc.
- **Legacy**: `react-google-charts` — only in `GoogleCharts.tsx` wrapper; do not use for new work

### Data Layer (runtime-fetch)
- All seed data in `data/*.json` — **fetched at runtime** from `raw.githubusercontent.com/ruake/AWARE/data/`
- `src/lib/dataFetcher.ts` — `fetchJson<T>(path)` resolves URLs for dev (`/data/`) vs production (`raw.githubusercontent.com/.../data/`)
- Data init: `src/lib/initData.ts` — `loadAllData()` is called in `App.tsx` before rendering; shows loading state until complete
- Each data module (`runs.ts`, `testSuites.ts`, `promotions.ts`, `schedulerStatus.ts`, `testDiscovery.ts`) exposes both:
  - A synchronous getter (`getXxx()`) that returns the current (possibly empty) state
  - An async `loadXxx()` that fetches from the `data` GitHub branch and populates the store
- `RUNS` and `DIFF_ROWS` in `runs.ts` are `let` bindings reassigned after fetch
- Env config: `getEnvConfigs()` / `saveEnvConfigs()` with localStorage key `aware-env-configs-v3`
- `_snapshot` caching in stores for stable `useSyncExternalStore` references

### State
- No Redux/Zustand — custom pub/sub model in `src/lib/data.ts`
- `@tanstack/react-query` for async patterns
- URL state: `src/lib/urlState.ts` (`useSyncedUrlState` — setter supports function updaters)
- localStorage keys: `aware-env-configs-v3` (envs), `aware_test_cases_v2` (test cases)

### AI Copilot (fully implemented)
- Three LLM providers: `"openai"` (any OpenAI-compatible API), `"webllm"` (@mlc-ai/web-llm, WebGPU), `"chrome"` (window.ai)
- `src/lib/ai/context.ts` — builds full system prompt from app state
- `src/lib/ai/useCases.ts` — 20+ analysis skill definitions
- `src/lib/ai/dataQueries.ts` — the ONLY sanctioned way for AI code to read app data
- `src/lib/chatStorage.ts` — localStorage-backed threaded chat history

## Environment Model (3 tiers × 2 networks = 6 envs)
| ID | Label | Target | Network |
|----|-------|--------|---------|
| `qa_staging` | QA / Staging | QA | staging |
| `qa_prod` | QA / Production | QA | production |
| `uat_staging` | UAT / Staging | UAT | staging |
| `uat_prod` | UAT / Production | UAT | production |
| `prod_staging` | PROD / Staging | PROD | staging |
| `prod_prod` | PROD / Production | PROD | production |

- `Run.env` field = `"QA"` | `"UAT"` | `"PROD"` (NOT "production"/"staging" — those are legacy)
- Promotion gate: UAT regression ≥ 95% pass rate required before PROD property activation
- `PropertyStatusBar` is always visible on the Dashboard; reads from `getEnvConfigs()`

## File Layout
```
artifacts/aware-app/src/
├── lib/
│   ├── types.ts           # ALL type interfaces (Run, TestResult, TestCase, TestSuite, DiffRow, PromotionDecision, LLM types, error classes)
│   ├── runs.ts            # RUNS[], ENV_SUMMARY, chart data exports, flakiness computation
│   ├── data.ts            # barrel + mutable stores (testCases, testSuites) + subscriptions
│   ├── dataFetcher.ts     # Runtime fetch: raw.githubusercontent.com (prod) or /data/ (dev)
│   ├── initData.ts        # loadAllData() — orchestrates all async data loading before render
│   ├── envConfig.ts       # EnvironmentConfig store with localStorage override
│   ├── ciConfig.ts        # CI config generation (generateCiConfigYaml, downloadCiConfig)
│   ├── anomalyDetection.ts # test-level Z-score (7-day window, detectAnomalies)
│   ├── anomaly.ts         # run-level Z-score
│   ├── llm.ts             # LLM provider abstraction
│   ├── ai/                # context.ts, prompts.ts, useCases.ts, analyzer.ts, dataQueries.ts
│   ├── store.ts, nav.ts, urlState.ts, constants.ts, utils.ts
│   └── chatStorage.ts, notifications.ts, skills.ts, operations.ts, providers.ts
├── components/
│   ├── aware/             # Domain components — inline styles + var(--proof-*) CSS vars
│   │   └── AppLayout, PropertyStatusBar, FilterBar, CTAStatCard, StatusBadge, TestCard,
│   │       HeatmapCalendar, PassRateHeatmap, PoPGlobe (Three.js), CommandPalette,
│   │       TestManagerSidePanel, YamlPreview, Markdown, SectionHeader, ErrorBoundary, etc.
│   └── ui/                # shadcn/radix primitives — Tailwind OK here
├── pages/                 # 16 pages (all React.lazy)
│   ├── Dashboard.tsx      # KPIs, PropertyStatusBar, area chart, anomaly banner, heatmap
│   ├── Runs.tsx           # Filterable run history table
│   ├── RunDetail.tsx      # Per-run test results + HTTP evidence viewer
│   ├── Compare.tsx        # Baseline vs candidate diff (DiffRow states)
│   ├── TestAnalytics.tsx  # Trends, flakiness leaderboard, category heatmaps
│   ├── TestManager.tsx    # Test case CRUD with stats dashboard
│   ├── TestSuiteManager.tsx # Hierarchical suite tree + YAML preview
│   ├── Copilot.tsx        # AI chat (WebLLM / OpenAI / Chrome AI)
│   ├── Pulse.tsx          # Live status feed
│   ├── Status.tsx         # CI Pipeline status + YAML config download
│   ├── TestDoc.tsx        # Per-test documentation viewer
│   ├── SearchDemo.tsx     # Fuse.js full-text search
│   ├── StartRun.tsx, Sharing.tsx, About.tsx, Home.tsx, not-found.tsx
├── hooks/
│   ├── useSimpleToast.tsx # Toast notifications
│   ├── useTestData.ts     # Subscribes to test cases + suites
│   └── use-mobile.tsx, use-toast.ts
├── data/
│   ├── auto-tests.json    # Auto-discovered tests (ad_* pytest + pw_* Playwright)
│   ├── test-suites.json   # Suite definitions (referencing ad_* and pw_* IDs)
│   ├── runs.json          # Seed CI run records
│   ├── diff-rows.json     # Pre-computed compare diffs
│   ├── test-results.json  # TestResult[] keyed by runId
│   ├── promotions.json    # Promotion decision history
│   └── schemas/           # JSON Schema for validation
├── App.tsx                # wouter Router, QueryClientProvider, all route definitions
├── main.tsx               # React 19 entry point
├── index.css              # --proof-* CSS custom properties + Tailwind base
└── _group.css             # Group layout utilities
```

## Data Files & Counts
- `data/auto-tests.json` — auto-discovered tests (`ad_*` pytest + `pw_*` Playwright); no separate test-cases.json
- `data/test-suites.json` — suites referencing `ad_*` and `pw_*` IDs
- `data/runs.json` — seed CI runs (`env: "QA"|"UAT"|"PROD"`)
- `data/diff-rows.json` — seed diff rows
- `data/test-results.json` — `Record<runId, TestResult[]>`
- `data/promotions.json` — promotion history
- **No separate test-cases.json** — all test cases come from auto-discovery
- All fetched at runtime from `raw.githubusercontent.com/ruake/AWARE/data/<file>.json` (branch = `data`)

## Data Contract
- `TestResult.evidence` is **REQUIRED** — never omit in seed data or `record-run.mjs` output
- `TestResult.assertions` **REQUIRED** — use `[]` (empty array), never omit
- `validate-data.mjs` runs as prebuild — build fails on schema violations
- `Run.env` uses `"QA"` | `"UAT"` | `"PROD"` — never old "production"/"staging" strings

## Test Discovery
- **Orchestrator**: `scripts/discover-all.mjs` → merges pytest + Playwright → `auto-tests.json`
- **pytest** (`discover-tests.py`): Python AST parses `test_*.py` for function names, docstrings, markers
- **Playwright** (`discover-playwright.mjs`): parses `.spec.ts`/`.test.ts` for `test()` + `test.describe()`
- Filmstrip/screenshot config preserved across re-discovery runs (matched on `scriptPath`)
- **App integration**: `src/lib/testDiscovery.ts` — `getAutoDiscoveredTests()` + `getAutoDiscoverySummary()`

## GitHub Actions Workflows (`.github/workflows/`)
- `deploy.yml` — validate data → typecheck → unit tests → E2E → discover:tests → build → GitHub Pages; commits run data to `data` branch
- `run-tests.yml` — Akamai CDN regression: Playwright + pytest parallel jobs across all 6 envs; reads `config/*.yml`; commits results to `data` branch
- `scheduler.yml` — every 15 min cron evaluates suites and dispatches `run-tests.yml`; commits runs + status to `data` branch
- `sync-data-branches.yml` — pushes seed data to `data` branch + extracted data to dedicated branches

## Config-as-Code (`config/`)
- `config/akamai-config.yml` — property metadata, EdgeWorker IDs, runner settings, notifications
- `config/environments.yml` — all 6 environment definitions; read by `run-tests.yml`
- `config/test-suites.yml` — suite schedules, parallelism, env assignments; read by CI

## Gotchas
- Inline `style={{}}` ONLY for AWARE components — never Tailwind className on pages/domain components
- CSS vars use `--proof-*` prefix in `index.css` (NOT `--gcp-*` — that prefix is retired)
- `navTo()` is full-page nav; use `useLocation()` for SPA navigation
- `import.meta.env.BASE_URL` = `/` dev, `/AWARE/` production
- `"packageManager": "pnpm@10.26.1"` in `package.json` required for CI
- `getTestSuites()` and `getTestCases()` use `_snapshot` caching for stable external store refs
- TestAnalytics `tr_` ID resolution: `tr_{runIdx}_{resultIdx}` rewrites to matching test case ID
- localStorage key for env config is `aware-env-configs-v3` (v2 is silently ignored)
- `ENV_COLOR_MAP` in `runs.ts` has both new short forms (`QA`) and legacy long forms for backward compat
- `validate-data.mjs` must pass before any build — fix data schema before fixing code if both fail
- Data is fetched at runtime from `raw.githubusercontent.com/ruake/AWARE/data/<file>` (`data` branch) — never imported statically
- `src/lib/dataFetcher.ts` auto-detects dev vs prod: dev uses `/data/` (Vite static serve), prod uses raw GitHub URL
- `RUNS` and `DIFF_ROWS` are `let` bindings — mutated by `loadRuns()` before the app renders via `DataGate` in `App.tsx`
- The `data` branch is an orphan branch containing only data files at root (`runs.json`, `scheduler-status.json`, etc.)
- Scheduler and test workflows push run data to the `data` branch, not `main`
- Commits to `data` branch include `[skip ci]` to prevent recursive workflow triggers

## Fixes Applied (June 2026 Audit)

### CSS Variables Added to `index.css`
The following `--proof-*` CSS variables were missing (rendered as transparent):
- `--proof-surface-3` — layer between surface-2 and surface-hover
- `--proof-emerald`, `--proof-emerald-bg`, `--proof-emerald-border` — success/pass indicators
- `--proof-indigo`, `--proof-indigo-bg`, `--proof-indigo-border` — info/highlight
- `--proof-teal`, `--proof-teal-bg`, `--proof-teal-border` — accent/info
- `--proof-grey`, `--proof-grey-bg` — neutral border/text
- `--proof-blue-hover` — interactive element hover
- `--proof-sidebar-bg`, `--proof-editor-bg`, `--proof-title-bar-bg`, `--proof-activity-bar-bg`, `--proof-status-bar-bg` — console IDE theming
- `--proof-hover-light`, `--proof-text-tertiary`, `--proof-overlay`

### @keyframes Added
`blink`, `slide-down`, `copilotFadeIn`, `modelConfigFadeIn`, `progressPulse`, `page-enter`, `proof-slide-up`

### CSS Classes Added
`.proof-btn-sm`, `.proof-btn-xs`, `.proof-button-primary` (alias), `.proof-button-sm`, `.proof-button-xs`, `.proof-th`, `.proof-td`, `.proof-tr`, `.proof-progress-track`, `.proof-progress-bar`, `.proof-live-dot`, `.proof-live-dot-warning`, `.proof-live-dot-error`, `.proof-select`, `.proof-skeleton`, `.proof-badge-healthy`, `.proof-badge-critical`, `.proof-truncate`

### Dead Modules Removed
`src/lib/builders/`, `src/lib/jobs/`, `src/lib/loaders/`, `src/lib/machines/`, `src/lib/commands/` — all had zero external imports. Barrel exports from `data.ts` removed. Corresponding test file `commandBus.test.ts` deleted (tested dead code).

### Bug Fixes
1. **`lib/urlState.ts`** — `_location` added to `useMemo` deps so URL params reflect cross-component `navigate()` calls
2. **`lib/testSuites.ts`, `lib/schedulerStatus.ts`, `lib/promotions.ts`** — retry-block pattern: `_loaded = true` moved after `await fetchJson()` so network failures allow retry
3. **`pages/Compare.tsx`** — swap double-inversion removed (`swapped` state deleted; URL swap alone is correct); `window.location.href` replaced with wouter `navigate()`
4. **`pages/Copilot.tsx`** — `$\{...\}` → `${...}` in template literals (escaped backslashes prevented evaluation); `proof-button-primary` → `proof-btn-primary`
5. **`lib/linkify.ts`** — `run_\S+` → `run_[\w-]+` to prevent greedy match across punctuation
6. **`components/console/ConsoleShell.tsx`** — duplicate `RouteAnnouncer` removed (App.tsx already has one); `--proof-emerald` refs replaced with `--proof-blue`/`--proof-green`
7. **`components/console/EnvSelector.tsx`, `components/console/SuiteSelector.tsx`** — invalid `role="searchbox"` on `<input>` removed (implicit `type="search"` is correct)
8. **Outline accessibility** — `outline: "none"` removed from inline styles across 24 component files (CSS `*:focus-visible` rule in `index.css` provides proper focus rings)

## Git
- **Always run `gh auth setup-git` before `git push origin`** to configure GitHub token-based auth

## Controller / Reconciler Pattern (Kubernetes-inspired)

Run status management follows a K8s-style controller pattern:

- **`scripts/lib/reconciler.mjs`** — base `Reconciler` class with `start()`/`stop()`/`reconcile()` loop; `ResourceReconciler` for list-reconcile workloads.
- **`scripts/lib/runStatus.mjs`** — Run conditions (`Dispatched`, `WorkflowRunning`, `Completed`, `Passed`, `Reconciled`) with `True`/`False`/`Unknown` status. `deriveRunStatus()` computes the overall status from conditions. GC pass marks stale RUNNING entries as `ERROR`.
- **`scripts/lib/ghApi.mjs`** — Facade over `gh` CLI for `listWorkflowRuns()`, `getWorkflowRun()`, `dispatchWorkflow()`, `findLatestDispatch()`.
- **`scripts/scheduler.mjs`** — Main controller with phases: Reconcile (poll GH) → Dispatch (cron eval + dispatch) → GC (stale cleanup) → Persist → Commit.
- **`scripts/record-run.mjs`** — Updates or creates runs with full conditions. Called by CI via env vars (`AWARE_SUITE`, `AWARE_ENV`, `PASS_PCT`, etc.)
- **Run types** in `src/lib/types.ts` have `conditions?: RunCondition[]` and `workflowRunId?: number`.
- All runs use conditions (even non-scheduler runs) for consistent status tracking across CI and scheduler.

Flow: `scheduler.mjs` (reconciler) dispatches GH workflow → `run-tests.yml` runs tests → `record-run.mjs` records result with conditions → scheduler poll phase picks up completed status → GC cleans stale entries >24h.

## Skills (Specialist Agents)
Load a skill by reading its `SKILL.md` before starting work in that domain:

| Skill | Path | Domain |
|-------|------|--------|
| `aware-frontend-expert` | `.agents/skills/aware-frontend-expert/SKILL.md` | React/Vite/routing/styling/charts |
| `aware-data-expert` | `.agents/skills/aware-data-expert/SKILL.md` | Types, seed JSON, stores, flakiness |
| `aware-akamai-expert` | `.agents/skills/aware-akamai-expert/SKILL.md` | CDN properties, EdgeWorkers, PoPs, promotion gate |
| `aware-cicd-expert` | `.agents/skills/aware-cicd-expert/SKILL.md` | GitHub Actions, suite schedules, CiConfig |
| `aware-testing-expert` | `.agents/skills/aware-testing-expert/SKILL.md` | Playwright, pytest, Puppeteer, test discovery |
| `aware-ai-copilot-expert` | `.agents/skills/aware-ai-copilot-expert/SKILL.md` | LLM providers, skills, context building |
| `aware-analytics-expert` | `.agents/skills/aware-analytics-expert/SKILL.md` | Charts, heatmaps, anomaly detection, diffs |
| `aware-config-expert` | `.agents/skills/aware-config-expert/SKILL.md` | YAML config, envConfig.ts, localStorage keys |
| `aware-ui-components-expert` | `.agents/skills/aware-ui-components-expert/SKILL.md` | Domain components, shadcn, CSS tokens, Three.js |
| `aware-devops-expert` | `.agents/skills/aware-devops-expert/SKILL.md` | Vite, pnpm, scripts, build pipeline |
| `aware-security-expert` | `.agents/skills/aware-security-expert/SKILL.md` | WAF, TLS, security headers, bot manager |
| `validate-loop` | `.agents/skills/validate-loop/SKILL.md` | 7-step validation pipeline; use for "validate"/"verify" requests |
| `monitoring-expert` | `.agents/skills/monitoring-expert/SKILL.md` | Prometheus/Grafana, alerting, distributed tracing |

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

### Data Layer (static-first)
- All seed data in `src/data/*.json` — loaded at module import time, kept in memory
- Mutable stores: `getTestCases()` / `saveTestCases()`, `getTestSuites()` / `saveTestSuites()`
- Subscription: `subscribeToTestCases(cb)` — returns unsubscribe fn; use in `useEffect` cleanup
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
- `src/data/auto-tests.json` — auto-discovered tests (`ad_*` pytest + `pw_*` Playwright)
- `src/data/test-suites.json` — suites referencing `ad_*` and `pw_*` IDs
- `src/data/runs.json` — seed CI runs (`env: "QA"|"UAT"|"PROD"`)
- `src/data/diff-rows.json` — seed diff rows
- `src/data/test-results.json` — `Record<runId, TestResult[]>`
- `src/data/promotions.json` — promotion history
- **No separate test-cases.json** — all test cases come from auto-discovery

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
- `deploy.yml` — validate data → typecheck → unit tests → E2E → discover:tests → build → GitHub Pages
- `run-tests.yml` — Akamai CDN regression: Playwright + pytest parallel jobs across all 6 envs; reads `config/*.yml`
- `sync-data-branches.yml` — pushes extracted data to dedicated branches

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

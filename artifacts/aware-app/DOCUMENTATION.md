# A.W.A.R.E. — App Documentation

> **Akamai Web Analytics Regression Engine** (also branded "PROOF")
> CDN test observability dashboard for Playwright + pytest suites across Akamai QA/UAT/PROD edge environments.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Routing](#3-routing)
4. [Data Layer](#4-data-layer)
5. [State Management](#5-state-management)
6. [Components](#6-components)
7. [Pages](#7-pages)
8. [AI Copilot](#8-ai-copilot)
9. [Hooks](#9-hooks)
10. [Styling System](#10-styling-system)
11. [Types](#11-types)

---

## 1. Architecture Overview

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript 5.9 |
| Bundler | Vite 7 |
| Package Manager | pnpm 10.26 |
| Routing | wouter |
| Charts | recharts |
| CSS | Tailwind 4 (ui/) + `--proof-*` CSS vars (domain) |
| Testing | Vitest (unit), Playwright (e2e) |

### Design Principles

- **No Redux/Zustand** — custom pub/sub model in `src/lib/data.ts`
- **Runtime data fetching** — all data fetched from `raw.githubusercontent.com` at runtime
- **Lazy-loaded pages** — all routes use `React.lazy()`
- **Dark-first design** — default theme is dark, with light mode toggle via `.light` class
- **Dual styling system** — Tailwind only in `ui/` components; inline `style={{}}` with `var(--proof-*)` everywhere else

### Environment Model (3 tiers × 2 networks = 6 envs)

| ID | Label | Target | Network |
|----|-------|--------|---------|
| `qa_staging` | QA / Staging | QA | staging |
| `qa_prod` | QA / Production | QA | production |
| `uat_staging` | UAT / Staging | UAT | staging |
| `uat_prod` | UAT / Production | UAT | production |
| `prod_staging` | PROD / Staging | PROD | staging |
| `prod_prod` | PROD / Production | PROD | production |

---

## 2. Project Structure

```
src/
├── lib/                    # Core logic — types, stores, data fetching, AI, utilities
│   ├── types.ts            # All TypeScript interfaces (Run, TestResult, TestCase, etc.)
│   ├── data.ts             # Central barrel — mutable stores + subscriptions
│   ├── dataFetcher.ts      # Runtime JSON fetcher with retry + dev/prod URL resolution
│   ├── initData.ts         # loadAllData() — parallel data loading before render
│   ├── runs.ts             # Runs store with chart data, diffs, flakiness computation
│   ├── runsLoader.ts       # Lean runs loader for initial data load
│   ├── testSuites.ts       # Test suite store with tree-building
│   ├── testCases.ts        # Test case query layer — filtering, stats, changelog
│   ├── testDiscovery.ts    # Auto-discovered tests store (auto-tests.json)
│   ├── promotions.ts       # Promotion decisions store
│   ├── schedulerStatus.ts  # Scheduler status store
│   ├── envConfig.ts        # Environment config with localStorage persistence
│   ├── selectedEnv.ts      # Selected environment IDs filter
│   ├── filters.ts          # Combined filter state + layout settings
│   ├── ciConfig.ts         # CI config generation (YAML/JSON download)
│   ├── anomaly.ts          # Run-level Z-score anomaly detection
│   ├── anomalyDetection.ts # Test-level anomaly detection (7-day window)
│   ├── store.ts            # Minimal pub/sub notification system
│   ├── nav.ts              # Full-page navigation (navTo)
│   ├── utils.ts            # Utilities (cn, cleanScriptPath, getGitHubUrl)
│   ├── urlState.ts         # useSyncedUrlState — URL query param syncing
│   ├── constants.ts        # App-wide constants (APP_NAME, ENV_COLOR_MAP, etc.)
│   ├── linkify.ts          # URL/run ID → clickable HTML links
│   ├── images.ts           # Image/filmstrip utilities
│   ├── sortableTable.tsx   # Sortable table React components + hooks
│   ├── chatStorage.ts      # localStorage-backed chat threads
│   ├── skills.ts           # 12 AI analysis skills definitions
│   ├── operations.ts       # Local CRUD for test cases/suites (localStorage)
│   ├── notifications.ts    # In-memory notification system
│   ├── providers.ts        # LLM provider config (localStorage)
│   ├── llm.ts              # LLM abstraction layer (OpenAI/WebLLM/Chrome AI)
│   └── ai/
│       ├── context.ts      # System prompt builder from app state
│       ├── prompts.ts      # Specialized prompt builders (failure/flakiness)
│       ├── useCases.ts     # 5 recognized AI use cases + triggers
│       ├── analyzer.ts     # Core analysis engine + simulated streaming
│       └── dataQueries.ts  # Sanctioned AI data read queries
├── components/
│   ├── CTAStatCard.tsx     # KPI stat card with icon + trend
│   ├── EnvTile.tsx         # Environment health tile (links to /runs)
│   ├── ErrorBoundary.tsx   # React error boundary
│   ├── Layout.tsx          # App shell — nav bar + content area + theme toggle
│   ├── Markdown.tsx        # Markdown renderer (react-markdown + GFM)
│   ├── RunRow.tsx          # Run history table row
│   ├── SectionHeader.tsx   # Section heading with optional subtitle/action
│   ├── StatusBadge.tsx     # Colored status badge (PASS/FAIL/etc.)
│   ├── YamlPreview.tsx     # Read-only YAML display
│   └── ui/                 # (empty) — reserved for shadcn/radix primitives
├── pages/
│   ├── Dashboard.tsx       # Landing page — KPIs, env tiles, recent runs
│   ├── Runs.tsx            # Filterable/sortable run history
│   ├── RunDetail.tsx       # Per-run test results + HTTP evidence viewer
│   ├── Compare.tsx         # Baseline vs candidate diff
│   └── TestAnalytics.tsx   # Telemetry KPIs + trends + flakiness (unregistered)
├── hooks/
│   └── useTestData.ts      # React hooks for data store subscriptions
├── App.tsx                 # Router + lazy-loaded routes + layout
├── main.tsx                # Entry point
├── index.css               # Design tokens, themes, utilities, animations
├── _group.css              # Copilot UI + pipeline + supplementary styles
└── vite-env.d.ts           # Vite type declarations
```

---

## 3. Routing

Uses **wouter** with `base` derived from `import.meta.env.BASE_URL` (`/` dev, `/AWARE/` prod).

### Route Table (`App.tsx`)

| Path | Page | Description |
|------|------|-------------|
| `/` | `Dashboard` | Main landing — KPIs, environment tiles, recent runs table |
| `/runs` | `Runs` | Full run history with filtering, sorting, pagination |
| `/runs/:runId` | `RunDetail` | Single run detail with expandable test evidence |
| `/compare` | `Compare` | Baseline vs candidate diff comparison |
| (catch-all) | `NotFound` | 404 display |

All pages are `React.lazy()` loaded inside a `<Layout>` wrapper with `<React.Suspense>`.

### Unregistered Pages

`TestAnalytics.tsx` exists but is not imported by any route — it is dead code / inaccessible from navigation.

### Navigation Rules

- **SPA navigation**: `const [, navigate] = useLocation()` from wouter
- **Full-page navigation**: `navTo(url)` from `src/lib/nav.ts` (sets `window.location.href`)
- `<Link>` renders as `<a>` — never nest another `<a>` inside `<Link>`

---

## 4. Data Layer

### Runtime Fetch Architecture

All seed data is fetched at runtime — never imported statically.

```
GitHub (raw.githubusercontent.com/ruake/AWARE/data/)
  ↓
dataFetcher.ts (fetchJson<T>)   ← 60s in-memory cache, 2 retries, 8s timeout
  ↓
Init Data (initData.ts → loadAllData())
  ├── runsLoader.ts     → RUNS[]
  ├── testSuites.ts     → TestSuite[]
  ├── testCases.ts      → TestCase[] (from auto-tests.json)
  ├── promotions.ts     → PromotionDecision[]
  ├── schedulerStatus.ts → SchedulerStatus
  └── testDiscovery.ts  → auto-discovered TestCase[]
```

### Data Files

| File | Content | Loaded By |
|------|---------|-----------|
| `runs.json` | Seed CI runs with `env: "QA"\|"UAT"\|"PROD"` | `runs.ts`, `runsLoader.ts` |
| `test-results.json` | `Record<runId, TestResult[]>` | `runs.ts` |
| `auto-tests.json` | Auto-discovered pytest + Playwright tests | `testDiscovery.ts` |
| `test-suites.json` | Suite definitions with schedules | `testSuites.ts` |
| `diff-rows.json` | Seed diff rows | (legacy) |
| `promotions.json` | Promotion history | `promotions.ts` |
| `scheduler-status.json` | Scheduler state | `schedulerStatus.ts` |

### Data Contracts (Critical)

- `TestResult.evidence` — **REQUIRED**, never omit
- `TestResult.assertions` — **REQUIRED**, use `[]` if empty
- `Run.env` — `"QA"` | `"UAT"` | `"PROD"` only (never old `"production"`/`"staging"`)
- Validation via `validate-data.mjs` runs as prebuild

### Key Data Modules

| Module | Exports | Purpose |
|--------|---------|---------|
| `dataFetcher.ts` | `fetchJson<T>(path)`, `clearCache()` | Universal JSON fetcher with URL resolution |
| `initData.ts` | `loadAllData()` | Orchestrates parallel data loading before render |
| `data.ts` | `RUNS`, `loadRuns()`, `loadResults()`, `getTestSuites()`, `getTestCases()` | Central barrel — bridges all stores |
| `runs.ts` | `ENV_SUMMARY()`, `PASS_RATE_CHART()`, `computeDiffRows()`, `computeRunFrequency()`, `computeTestDetails()` | Runs store with computed snapshots + chart data |
| `envConfig.ts` | `getEnvConfigs()`, `saveEnvConfigs()`, `getEnvByTierAndNetwork()` | 6-env config with localStorage (`aware-env-configs-v3`) |

---

## 5. State Management

### Architecture

No Redux or Zustand. Custom pub/sub pattern:

- **`store.ts`** — minimal notification system with `subscribeToTestSuites` / `subscribeToTestCases` / `subscribeSnapshot`
- **`data.ts`** — mutable `let RUNS` and `let DIFF_ROWS` reassigned after fetch
- **`_snapshot` caching** — stable references for `useSyncExternalStore`

### localStorage Keys

| Key | Content | Managed By |
|-----|---------|------------|
| `aware-env-configs-v3` | Environment configurations | `envConfig.ts` |
| `aware-test-cases-v2` | Local test case overrides | `operations.ts` |
| `aware-test-suites-v2` | Local test suite overrides | `operations.ts` |
| `aware-layout-v1` | Sidebar/detail panel widths | `filters.ts` |
| `aware-chat-threads` | AI Copilot chat threads | `chatStorage.ts` |
| `aware-chat-history` | Chat message history | `llm.ts` |
| `aware-llm-config` | LLM provider config | `providers.ts` |
| `aware-theme` | Dark/light theme preference | `Layout.tsx` |

### URL State

- `useSyncedUrlState<T>(key, defaultValue)` in `urlState.ts` — syncs React state with URL query params via wouter's `navigate()`

---

## 6. Components

### Domain Components (`src/components/`)

Uses inline `style={{}}` with `var(--proof-*)` CSS variables (per convention).

| Component | Props | Description |
|-----------|-------|-------------|
| `CTAStatCard` | `icon, label, value, trend?, color` | KPI stat card with icon, value, optional trend arrow |
| `EnvTile` | `env, runs[]` | Clickable env health tile with pass rate, progress bar, run count |
| `ErrorBoundary` | `children, fallback?` | Class-based error boundary with custom fallback support |
| `Layout` | `children` | App shell with sticky header, 3 nav links, theme toggle |
| `Markdown` | `content` | Renders Markdown with GFM support |
| `RunRow` | `run` | Memoized table row for run history |
| `SectionHeader` | `title, subtitle?, action?` | Consistent section heading pattern |
| `StatusBadge` | `status, size?` | Colored badge (PASS/FAIL/PARTIAL/RUNNING/PENDING/ERROR) |
| `YamlPreview` | `content, title?` | Read-only YAML code block |

### UI Primitives (`src/components/ui/`)

Currently empty — reserved for shadcn/radix primitives with Tailwind CSS 4.

---

## 7. Pages

### Dashboard (`/`)

- **Purpose**: Main landing page
- **Data**: `loadRuns()` — fetches runs.json
- **Content**:
  - 4 KPI cards (Total Runs, Total Failures, Avg Pass Rate, Environments)
  - 3 environment health tiles (QA/UAT/PROD)
  - Sortable table of 15 most recent runs
- **Components**: `EnvTile`, `RunRow`, `SortHeader`, local `KpiCard`

### Runs (`/runs`)

- **Purpose**: Full run history browser
- **Data**: `loadRuns()` — fetches runs.json
- **Content**:
  - Environment toggle (ALL/QA/UAT/PROD)
  - Status toggle (ALL/PASS/FAIL/PARTIAL)
  - Free-text search (debounced 300ms)
  - Per-column inline filters
  - Sortable columns
  - Pagination (25 runs/page)
  - URL sync for env filter (`?env=QA`)
- **Components**: `RunRow`, `SortHeader`, `useSort`/`sortData`
- **Icons**: `Search`, `List` (lucide-react)

### RunDetail (`/runs/:runId`)

- **Purpose**: Per-run detail and test evidence viewer
- **Data**: `loadRuns()`, `loadResults(runId)`, `loadTestCases()`
- **Content**:
  - Run header with env badge, pass rate, suite, failures, duration, build, revision, start time
  - Filter bar (status toggles + text search)
  - Paginated test results table (50 rows/page)
  - **Expandable evidence panel** per test:
    - HTTP assertions (pass/fail with expected/actual)
    - Request method/URL/headers
    - Response status/headers/cookies
    - Timing waterfall bars
  - GitHub source links via `getGitHubUrl()`
- **Components**: `StatusBadge`, `SortHeader`, local `EvidencePanel`, `CollapsibleSection`

### Compare (`/compare`)

- **Purpose**: Baseline vs candidate run comparison
- **Data**: `loadRuns()`, `loadAllResults()`, `loadTestCases()`
- **Content**:
  - Two dropdown selectors (base + candidate run)
  - Swap button, Compare button
  - 4 summary filter cards (Regressions, Fixed, Unchanged, New/Removed)
  - Change-type filter bar
  - Paginated diff table (25 rows/page)
  - **Expandable side-by-side diff panel** with baseline/candidate assertions, request/response details
  - URL sync (`?base=...&cand=...`)
- **Components**: `StatusBadge`, `SortHeader`, local `CompositeSelect`, `DiffPanel`, `AssertionBlock`

### TestAnalytics (unregistered)

- **Purpose**: Telemetry and trends analytics (not accessible from UI)
- **Data**: `getRuns()` (runsLoader), `PASS_RATE_CHART()` (runs.ts)
- **Content**:
  - 3 KPI metric cards with sparklines (Global Pass Rate, Failure Rate, Run Velocity)
  - Environment distribution breakdown (QA/UAT/PROD)
  - Flakiness section (placeholder)
  - Run frequency bar chart
- **Components**: recharts (`AreaChart`, `BarChart`, `ResponsiveContainer`), local mini chart components
- **Note**: Uses `var(--proof-*)` inline styles — different styling convention from other pages

---

## 8. AI Copilot

### Provider Architecture

Three LLM providers, abstracted via `src/lib/llm.ts`:

| Provider | ID | Mechanism |
|----------|----|-----------|
| OpenAI-compatible | `openai` | Standard REST API |
| WebLLM | `webllm` | @mlc-ai/web-llm (WebGPU, in-browser) |
| Chrome AI | `chrome` | window.ai API |

Config persisted to localStorage key `aware-llm-config`.

### Module Breakdown

| File | Purpose |
|------|---------|
| `context.ts` | Builds system prompt from app state (runs, results, test cases) |
| `prompts.ts` | Specialized prompts for failure analysis + flakiness analysis |
| `useCases.ts` | 5 recognized use cases: `analyze-failures`, `flakiness`, `performance`, `coverage`, `promotion` |
| `analyzer.ts` | Core engine — matches messages to use cases via keyword triggers; simulated streaming |
| `dataQueries.ts` | Sanctioned read-only data access for AI (test failure rate, env runs, category breakdowns) |
| `skills.ts` | 12 specialist domain skills (anomaly, trend, compare, flakiness, regression, coverage, etc.) |
| `chatStorage.ts` | localStorage-backed threaded chat history |
| `providers.ts` | Provider config management + localStorage persistence |
| `llm.ts` | Abstraction layer — provider resolution, API calls |

---

## 9. Hooks

### `src/hooks/useTestData.ts`

Three hooks subscribing to pub/sub stores via `useSyncExternalStore`:

| Hook | Returns | Description |
|------|---------|-------------|
| `useTestCase(id)` | `TestCase \| undefined` | Subscribes to test cases store, returns specific test by ID |
| `useTestSuites()` | `TestSuite[]` | Subscribes to test suites store, returns all suites |
| `useAllTestCases()` | `Record<string, TestCase>` | Subscribes to test cases store, returns all as keyed map |

All hooks lazy-load data via `useEffect` on mount.

### Other Hooks (in lib/)

| Hook | Location | Description |
|------|----------|-------------|
| `useSyncedUrlState` | `urlState.ts` | Syncs state with URL query parameters |
| `useSort` | `sortableTable.tsx` | Sort state management (key, direction) |
| `sortData` | `sortableTable.tsx` | Memoized data sorting with accessor functions |

---

## 10. Styling System

### Dual Convention

| Area | Method | Location |
|------|--------|----------|
| Domain components + pages | Inline `style={{}}` with `var(--proof-*)` | All pages + aware/ components |
| UI primitives (planned) | Tailwind CSS 4 `className` | `src/components/ui/` |
| CSS definitions | `--proof-*` custom properties | `src/index.css` |

### Design Tokens (`src/index.css`)

**Prefix**: `--proof-*`

**Color tokens**:
- Status: `--proof-green`, `--proof-red`, `--proof-blue`, `--proof-yellow`, `--proof-purple`, `--proof-orange` (each with `-bright`, `-bg`, `-border`, `-glow` variants)
- Surfaces: `--proof-bg` (#1c1f26), `--proof-surface`, `--proof-surface-2`, `--proof-surface-3`, `--proof-surface-hover`, `--proof-surface-active`
- Borders: `--proof-border`, `--proof-border-light`, `--proof-border-strong`
- Text: `--proof-text`, `--proof-text-secondary`, `--proof-text-muted`, `--proof-text-tertiary`

**Theme**:
- Dark theme is the default (`:root`)
- Light theme via `.light` class — overrides all surface/text/border tokens
- Toggled via button in `Layout.tsx`, persisted to localStorage `aware-theme`

### Utility Classes

| Class | Purpose |
|-------|---------|
| `.glass-panel` | Frosted glass effect (backdrop-filter blur) |
| `.proof-card` | Surface card with border, shadow, padding |
| `.proof-btn` / `.proof-btn-primary` / `.proof-btn-ghost` | Button variants |
| `.proof-input` / `.proof-select` | Form controls |
| `.proof-badge` + status variants (`-pass`, `-fail`, etc.) | Status badges |
| `.proof-table` | Table styling |
| `.proof-grid-kpi` / `.proof-grid-2` / `.proof-grid-3` | Responsive grids |
| `.proof-skeleton` | Loading skeleton shimmer |
| `.proof-progress-track` / `.proof-progress-bar` | Progress bar |
| `.proof-live-dot` | Pulsing status indicator |

### Animations

11 `@keyframes` in `index.css` + 12 in `_group.css` (Copilot-specific)

Key animations: `fade-in`, `fade-in-up`, `slide-up`, `scale-in`, `spin`, `pulse-dot`, `badge-pulse`, `pulse-glow`, `shimmer`, `glow-pulse`, `copilotFadeIn`, `thinkingBounce`, `wordFadeIn`, `slideInRight`/`slideOutRight`

---

## 11. Types

All types defined in `src/lib/types.ts` (208 lines). Key interfaces:

| Type | Fields | Purpose |
|------|--------|---------|
| `RunStatus` | `'PASS'\|'FAIL'\|'PARTIAL'\|'RUNNING'\|'PENDING'\|'ERROR'` | Run status enum |
| `Env` | `'QA'\|'UAT'\|'PROD'` | Environment tier |
| `Run` | `id, label, suiteId, envId, env, network, status, passPct, failures, duration, ...` | Complete CI run |
| `TestResult` | `id, testId, name, status, duration, category, evidence, assertions, ...` | Per-test result (evidence + assertions REQUIRED) |
| `TestCase` | `id, name, scriptPath, docstring, markers, fileType, tags, suiteIds, changelog, ...` | Test definition |
| `TestSuite` | `id, name, parentId, testIds, envIds, schedule, runners, tags, ...` | Suite definition |
| `SuiteTreeNode` | `id, name, children[], tests[]` | Recursive suite tree node |
| `DiffRow` | `testId, testName, baseStatus, candStatus, state, ...` | Comparison diff row |
| `DiffState` | `'regression'\|'fixed'\|'duration'\|'unchanged'\|'fishy'` | Diff classification |
| `PromotionDecision` | `id, fromEnv, toEnv, passRate, required, approved, timestamp` | Promotion gate decision |
| `EnvConfig` | `id, label, target, network, baseUrl, ips, property, active` | Environment configuration |
| `AnomalyScore` | `runId, passRateZ, durationZ, overallAnomaly, flags` | Run-level anomaly |
| `AnomalyBanner` | `message, severity, runId` | Dashboard anomaly banner |
| `TestStats` | `total, passed, failed, passRate, byStatus, byPriority, byCategory, ...` | Computed test statistics |
| `LLMConfig` | `provider, apiKey, model, temperature, maxTokens` | LLM configuration |
| `CiConfigOutput` | `version, suites, tests, environments, runners` | CI config output |
| `ChangeLogEntry` | `date, author, description, version` | Test case changelog |

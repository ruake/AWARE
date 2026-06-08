# PROOF — opencode Agent Instructions

## Project
- React 19 + TypeScript 5.9 + Vite 7 SPA (Tailwind CSS 4 in index.css only, pages use inline `style={{}}`)
- Single app at `artifacts/aware-app/` — fully read-only, no CRUD, no localStorage writes
- Static-site test observability dashboard; all data from JSON seed files committed in repo
- Live: https://ruake.github.io/AWARE | Repo: https://github.com/ruake/AWARE

## Commands
```bash
cd artifacts/aware-app
pnpm install
pnpm dev                    # dev server at :5173
pnpm build                  # prod build → dist/public/
pnpm run typecheck          # TS check (MUST pass before commit)
pnpm discover:tests         # Run test discovery (pytest + Playwright → auto-tests.json)
pnpm test                   # Unit tests
pnpm test:e2e               # Playwright browser tests
```

## Architecture
- **Routing**: wouter (`<Switch>` / `<Route>` / `<Link>`) with `base` from `import.meta.env.BASE_URL`
- **Data layer**: `src/lib/` — all read-only. Seed JSON files loaded at import time; auto-discovered tests merged in. Modules: `store.ts`, `runs.ts`, `testCases.ts`, `testSuites.ts`, `promotions.ts`, `testDiscovery.ts`, `constants.ts`, `utils.ts`
- **Types**: `src/lib/types.ts` — all type interfaces (TestCase, TestSuite, Predicate, FilmstripConfig, LLM types, error classes, etc.)
- **Charts**: Google Charts via `react-google-charts` (wrappers in `GoogleCharts.tsx`)
- **Styling**: Inline `style={{}}` with `var(--gcp-*)` CSS variables from `src/_group.css`; shadcn/ui via `class-variance-authority` + `components.json`
- **Error handling**: `classifyError()`, `FetchError`, `TimeoutError`, `ValidationError` in `types.ts`; `ErrorBoundary` at `src/components/aware/ErrorBoundary.tsx`

## Test Discovery
- **Unified orchestrator**: `scripts/discover-all.mjs` — runs both Python AST-based pytest discovery (`discover-tests.py`) and Playwright spec discovery (`discover-playwright.mjs`), merges into single `src/data/auto-tests.json`
- **Preserves filmstrip/screenshot config** across re-discovery runs by matching on `scriptPath`
- **pytest discovery** (`scripts/discover-tests.py`): parses `test_*.py` files for function names, docstrings, decorators (category, priority markers), parametrize variants
- **Playwright discovery** (`scripts/discover-playwright.mjs`): parses `.spec.ts`/`.test.ts` files for `test()` names, `test.describe()` blocks, inline tags
- **40 pytest tests** from `tests/` (geo-match, security, performance, caching categories)
- **27 Playwright tests** from `e2e/` targeting `https://the-internet.herokuapp.com` (login, checkboxes, dropdowns, dynamic loading, alerts, frames/windows)
- **App integration**: `src/lib/testDiscovery.ts` loads `auto-tests.json`, provides `getAutoDiscoveredTests()` and `getAutoDiscoverySummary()` with stable snapshot caching; `testCases.ts` concatenates into `testCasesStore` (no seed `tc_*` tests — all data comes from discovery)

## File Layout
```
artifacts/aware-app/src/
├── lib/                   # data.ts (barrel), store, runs, testCases, testSuites, promotions, testDiscovery, constants, utils
├── components/
│   ├── aware/             # AppLayout, ColumnFilter, CTAStatCard, FilterBar, StatusBadge, SectionHeader, StatsDashboard, TestCard, TestManagerSidePanel, SuiteTreeItem, YamlPreview, TestDocTopBar, TestDocSidebar, TestDocChangelog, CommandPalette, ErrorBoundary, GoogleCharts
│   └── ui/                # shadcn/ui components (button, card, badge, dialog, etc.)
├── pages/
│   ├── Dashboard.tsx      # Multi-env Google Charts, alerts
│   ├── Runs.tsx           # Filterable run table + side panel CTAs
│   ├── RunDetail.tsx      # Test results + evidence viewer
│   ├── Compare.tsx        # Baseline vs candidate diff + CTA stat cards
│   ├── TestManager.tsx    # Test case browser with stats dashboard + auto-discovery badge
│   ├── TestSuiteManager.tsx # Suite tree + YAML preview + Google Charts
│   ├── TestAnalytics.tsx  # Per-test analytics (works with tr_N, diff_N, ad_N, pw_N IDs)
│   ├── TestDoc.tsx        # Per-test documentation + 3-column layout
│   ├── SearchDemo.tsx     # Full-page search wired to real testCasesStore, RUNS, DIFF_ROWS
│   ├── StartRun.tsx       # Placeholder
│   ├── Sharing.tsx        # Permalink/share page
│   ├── Status.tsx         # System status dashboard
│   ├── Copilot.tsx        # Placeholder
│   ├── About.tsx          # Project info + stat cards
│   └── not-found.tsx      # 404 handler
├── hooks/
│   ├── useSimpleToast.tsx # Shared toast
│   └── useTestData.ts     # Subscribes to test cases + suites
├── App.tsx                # wouter Router with all routes
├── main.tsx               # Entry point
├── _group.css             # GCP CSS variables
└── index.css              # Tailwind imports
```

## Data Files
- `src/data/auto-tests.json` — 67 auto-discovered tests (40 `ad_*` pytest + 27 `pw_*` Playwright)
- `src/data/test-suites.json` — 10 suites (referencing `ad_*` and `pw_*` IDs)
- `src/data/runs.json` — 12 seed runs
- `src/data/diff-rows.json` — 15 seed diff rows
- `src/data/promotions.json` — seed promotion history
- No seed `test-cases.json` — all test cases come from auto-discovery

## GitHub Actions
- `deploy.yml`: CI → E2E → `pnpm discover:tests` → build → deploy to Pages
- `sync-data-branches.yml`: pushes extracted data to `test-cases`, `test-runs`, `stats`, `discovered-tests` branches

## Gotchas
- All pages use inline `style={{}}` NOT Tailwind `className`
- Charts use Google Charts (`GoogleAreaChart`, `GoogleBarChart`, `GoogleFilterableTable`)
- `useSyncedUrlState` setter supports function updaters: `setState(prev => ({ ...prev, field: val }))`
- `navTo()` in `src/lib/nav.ts` uses `window.location.href` (full nav); use wouter's `useLocation()` for SPA navigation
- `import.meta.env.BASE_URL` = `/` dev, `/AWARE/` production
- `"packageManager": "pnpm@10.26.1"` in `package.json` for CI
- `getTestSuites()` and `getTestCases()` both use `_snapshot` caching for stable `useSyncExternalStore` references
- TestAnalytics `tr_` ID resolution: `tr_{runIdx}_{resultIdx}` rewrites to matching test case ID via IIFE
- Discovery scripts require Python 3 (pytest AST) and Node.js (Playwright spec parsing)
- Filmstrip/screenshot config is preserved across re-discovery runs by `discover-all.mjs`

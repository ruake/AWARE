# A.W.A.K.E. — opencode Agent Instructions

## Project
- React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4 SPA
- Monorepo with two apps: **mockup** (`artifacts/mockup-sandbox/`) and **main app** (`artifacts/aware-app/`)
- Mockup for Akamai CDN regression observability
- Live: https://ruake.github.io/AWARE | Repo: https://github.com/ruake/AWARE

## Commands

### Mockup (`artifacts/mockup-sandbox/`)
```bash
cd artifacts/mockup-sandbox
pnpm install
PORT=5173 BASE_PATH=/ pnpm dev              # dev → http://localhost:5173/preview/aware/Dashboard
BASE_PATH=/AWARE PORT=1 pnpm build          # prod build → dist/
pnpm run typecheck                          # strict TS check (MUST pass before commit)
```

### Main App (`artifacts/aware-app/`)
```bash
cd artifacts/aware-app
pnpm install
pnpm dev                                    # dev server
pnpm build                                  # prod build
pnpm run typecheck                          # TS check (MUST pass before commit)
```

## Architecture

### Mockup (`artifacts/mockup-sandbox/`)
- Each page in `src/components/mockups/aware/` exports a named function
- `App.tsx` resolves by function name via `_resolveComponent`
- All pages wrap `<AppLayout activeTab="...">`
- Shared mock data in `_shared/data.ts` — module-level store with subscription system (`_notify()`, `_tcListeners`, `_tsListeners`)
- Navigation: `navTo(path)` from `_shared/nav.ts` — uses `history.pushState` + dispatches `PopStateEvent`
- URL state: `useSyncedUrlState(key, default)` from `_shared/urlState.ts` — supports function updaters
- Tables: `ColumnFilter` for column headers; filter via `{ text, selected }` state
- Stat/summary cards across pages act as CTAs that toggle filters on click (active ring via `box-shadow`)

### Main App (`artifacts/aware-app/`)
- Standalone Vite + React SPA (separate from mockup)
- Shared data in `src/lib/data.ts` — localStorage-persisted CRUD store with subscription system for reactive updates
- Types in `src/lib/types.ts` — shared by all app components
- Uses `class-variance-authority` + Tailwind CSS (`components.json` present)
- Keep `types.ts` and `data.ts` in sync with mockup when adding new type fields or CRUD operations

## File Locations

### Mockup
```
artifacts/mockup-sandbox/src/components/mockups/aware/
├── _shared/data.ts           # All mock data, types, generators
├── _shared/nav.ts            # navTo(), copyToClipboard(), repo const
├── _shared/AppLayout.tsx     # Header, sidebar, ⌘K palette, live status, main content
├── _shared/ColumnFilter.tsx  # Reusable column filter component (aria/escape/focus)
├── _shared/CommandPalette.tsx # ⌘K overlay (guarded against race on diffs)
├── _shared/urlState.ts       # useSyncedUrlState hook
├── _shared/useLiveStatus.ts  # Simulated polling + toasts (interval clamped [5s, 300s])
├── _shared/hooks.ts          # useSync* hooks + useAsync with cancellation
├── _shared/services.ts       # Service abstraction layer (mock vs API)
├── _shared/types.ts          # Shared TypeScript types
├── _shared/ErrorBoundary.tsx # Error boundary wrapper
├── _shared/skeleton.tsx       # Loading skeleton components
├── _group.css                # GCP theme variables + component classes
├── Dashboard.tsx             # Multi-env charts, alerts, version drift
├── Runs.tsx                  # Filterable run table + side panel with CTA cards
├── RunDetail.tsx             # Test results + evidence viewer
├── Compare.tsx               # Baseline vs candidate diff + CTA stat cards
├── TestManager.tsx           # Test case CRUD, stats dashboard, generation wizard
├── TestSuiteManager.tsx      # Suite tree + detail with charts
├── TestAnalytics.tsx         # Per-test analytics with CTA stat cards
├── TestDoc.tsx               # Per-test documentation with test-jump selector
├── SearchDemo.tsx            # Full-page search
├── StartRun.tsx              # Full-page new run form + command preview
├── Sharing.tsx               # Permalink/share page
└── About.tsx                 # Project info + navigable stat cards
```

### Main App
```
artifacts/aware-app/src/
├── lib/
│   ├── data.ts               # TestCase/TestSuite CRUD with localStorage persistence, subscriptions, import/export, generation, stats
│   └── types.ts              # All types (must mirror mockup's types.ts additions)
├── components/               # App components
├── App.tsx                   # Root component
└── main.tsx                  # Entry point
```

## Gotchas
- `import.meta.env.BASE_URL` = `/` dev, `/AWARE/` production (mockup only)
- `useSyncedUrlState` setter: supports function updaters — use `setState(prev => ({ ...prev, field: val }))`
- Compare side panel uses `_SidePanel` helper (IIFE-in-JSX fails TS parser)
- `navTo()` uses `pushState` + dispatches `PopStateEvent` — App.tsx listens via `useCurrentPath()` hook
- GitHub Actions workflows must be at repo root `.github/workflows/`
- `"packageManager": "pnpm@10.26.1"` required in `package.json` for CI
- Build copies `index.html` → `404.html` for SPA routing fallback (mockup)
- Both apps share same type system — when adding types to mockup `_shared/types.ts`, also add to main app `src/lib/types.ts`
- When adding CRUD operations to either app's `data.ts`, mirror the subscription/notification pattern in the other
- Main app uses localStorage (`aware_test_cases_v2`, `aware_test_suites_v2`); mockup uses module-level arrays
- Both apps support subscription-based reactive updates (`_tcListeners`/`_tsListeners` + `_notify()`)

## CSS
- GCP theme: `--gcp-*` CSS variables in `_group.css` (mockup)
- Main app uses shadcn/ui-style class-variance-authority + Tailwind via `components.json`
- Classes: `gcp-card`, `gcp-button`/`gcp-button-primary`, `gcp-badge`/`gcp-badge-pass/fail/flaky`, `gcp-input`, `gcp-table`, `gcp-mono`
- Google Charts: always set `backgroundColor: "transparent"` for theme compat

## Run IDs
- `run_892_2341.1.0_prod_<1000-1011>` (12 entries)
- `DIFF_ROWS` = `diff_0` through `diff_14` (15 entries)
- Test IDs in RunDetail: `test_0`, `test_1`, etc.

## CTA Pattern (stat → filter)
Summary/stat cards on multiple pages act as clickable CTAs that toggle column filters:
- **Compare**: New Failures, Fixed, Still Failing, Duration Regressions → toggle `state`/`baseStatus`/`candStatus` column filters
- **TestAnalytics**: Pass Rate, Flakiness, Avg Duration → filter Run History table by PASS/FAIL/duration highlight
- **Runs side panel**: Failures → set `statusFilter=FAIL`; Target → set `quickTarget`
- **Dashboard env cards**: navigate to `Runs?env=<label>` with pre-applied env filter
- **About stats**: Total Runs → Runs, Tests Tracked → TestManager, Regressions → Compare
- Active state shown via `shadow-[inset_0_0_0_2px_<color>]` ring

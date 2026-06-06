# A.W.A.K.E. — CLAUDE.md

## Project Overview
A mockup SPA for Akamai CDN regression observability. Built with React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4. Deployed to GitHub Pages. All data is deterministic mock data in a single shared module.

**Live demo:** https://ruake.github.io/AWARE  
**Repo:** https://github.com/ruake/AWARE

## Directory Structure
```
artifacts/mockup-sandbox/
├── src/
│   ├── App.tsx                          # Preview dispatcher (routes to mockup pages)
│   └── components/mockups/aware/
│       ├── _shared/
│       │   ├── data.ts                  # All mock data + generator functions
│       │   ├── nav.ts                   # navTo(), copyToClipboard(), repo const
│       │   ├── AppLayout.tsx            # Global layout: header, sidebar, main
│       │   ├── ColumnFilter.tsx         # Reusable column header filter
│       │   ├── CommandPalette.tsx       # ⌘K global search overlay
│       │   ├── urlState.ts             # useSyncedUrlState hook
│       │   └── useLiveStatus.ts        # Simulated polling + toasts
│       ├── _group.css                   # GCP-themed CSS variables + components
│       ├── Dashboard.tsx
│       ├── Runs.tsx
│       ├── RunDetail.tsx
│       ├── Compare.tsx
│       ├── TestAnalytics.tsx
│       ├── TestDoc.tsx
│       ├── SearchDemo.tsx
│       ├── StartRun.tsx
│       ├── Sharing.tsx
│       └── About.tsx
├── .github/workflows/
│   ├── deploy.yml                       # Build + deploy to GitHub Pages
│   └── run-tests.yml                    # workflow_dispatch test runner
├── README.md
└── package.json
```

## Architecture Rules

### Every page is a standalone component
- Each page exports a named function (e.g. `export function Dashboard()`)
- `App.tsx` resolves by function name using `_resolveComponent` — it walks exports and picks the last function if no exact match
- Routes: `/AWARE/preview/aware/ComponentName` (production) or `/preview/aware/ComponentName` (dev)
- ALL components use `<AppLayout activeTab="...">` wrapper

### Shared data (`_shared/data.ts`)
- Central module consumed by ALL pages
- Run IDs follow pattern: `run_892_2341.1.0_prod_<1000-1011>` (12 entries)
- `DIFF_ROWS`: 15 entries with `diff_0` through `diff_14` IDs
- `TEST_DETAILS`: Generated parallel to DIFF_ROWS, accessed by index
- Key types: `Run`, `TestResult`, `DiffRow`, `TestDetail`, `TestRunPoint`
- Generator functions: `getRunById()`, `getRunIndex()`, `getTestResultsForRun()`, `generateTestHistory()`
- `ENV_SUMMARY`: 4 environments with pass rate, trend, failures
- `ENV_PASS_RATE_DATA`: 10-day time series for 4 environments (used in Dashboard chart)
- **Never import mock data in a child component** — always pass via props or use the shared module

### Navigation (`_shared/nav.ts`)
- `navTo(path)` — wraps `window.history.pushState` + `popstate` trigger; uses `import.meta.env.BASE_URL` so paths work in both dev (`/`) and GitHub Pages (`/AWARE/`)
- `copyToClipboard(text)` — async clipboard API with `document.execCommand` fallback
- `repo` — `"https://github.com/ruake/AWARE"`
- Always use `navTo()` for in-app navigation, never `window.location.href`

### Reusable Components
- **`AppLayout`** — provides header (logo, nav tabs, theme toggle, ⌘K button, live status bell, GitHub Actions link) + sidebar (expandable on hover) + main content area + global CommandPalette + live status toast
- **`ColumnFilter`** — renders inside `<th>`; shows filter icon badge count; dropdown with text input + checkbox list + clear button; emits `ColumnFilterState` with `{ text, selected }` via `onFilterChange`
- **`CommandPalette`** — full-screen overlay on ⌘K; searchable list of all tests/runs/compare with type chips, arrow nav, Enter to select
- **`TableHeaderFilter`** — wrapped version of ColumnFilter for table header use

### State Management
- No Redux/Zustand — each page manages its own state
- URL state persistence via `useSyncedUrlState<T>(key, defaultValue)` from `_shared/urlState.ts`
  - Serializes to URL search params (JSON for objects, raw for strings/booleans)
  - Returns `[value, setter]` — setter replaces value, does NOT support function updaters
  - **Do NOT use function updaters** with `useSyncedUrlState` — always use `setState({ ...state, [field]: newVal })`
- Local state for UI-only things (toasts, hover states, etc.)

### Layout Patterns
- **Split panel**: `<div className="flex gap-4 flex-1 overflow-hidden">` with `w-[60%]` + `w-[40%]` (RunDetail) or `flex-1` + `w-[35%]` (Runs, Compare)
- **Side panel**: appears on row click, has close button, URL-synced selected ID
- **Sticky header**: `shrink-0` element outside scroll area
- **Time slice selectors**: pill button group in header with 7d/14d/30d/All
- **Toast**: fixed bottom-center, auto-dismiss 2.5s

### CSS Convention
- GCP-inspired theme via CSS variables in `_group.css`:
  - `--gcp-surface`, `--gcp-grey-bg`, `--gcp-blue`, `--gcp-green`, `--gcp-red`, `--gcp-yellow`, `--gcp-text`, `--gcp-text-secondary`, etc.
- Component classes:
  - `.gcp-card` — white rounded card with shadow
  - `.gcp-button` — default button; `.gcp-button-primary` — blue primary
  - `.gcp-badge` — status pill; `.gcp-badge-pass` (green), `.gcp-badge-fail` (red), `.gcp-badge-flaky` (yellow)
  - `.gcp-input` — styled input/select
  - `.gcp-table` — full-width table with hover rows
  - `.gcp-mono` — monospace font
- Google Charts: `backgroundColor: "transparent"`, chartArea with padding

### Charting (react-google-charts)
- Import `Chart` from `react-google-charts`
- Props: `chartType`, `width`, `height`, `data`, `options`, `chartEvents`
- Data format: first row is headers, subsequent rows are values; tooltip column with `{ type: "string", role: "tooltip" }`
- Click events: `chartEvents={[{ eventName: "select", callback: ({ chartWrapper }) => { ... } }]}`
- Always set `backgroundColor: "transparent"` for theme compatibility

### GitHub Pages
- `BASE_PATH=/AWARE PORT=1` for production build
- `dist/index.html` is copied to `dist/404.html` for SPA fallback (client-side routing)
- Deploy workflow: `.github/workflows/deploy.yml`
- `package.json` must have `"packageManager": "pnpm@10.26.1"` for CI

### Key Patterns
- **Tables with column filters**: `colFilters` state + `TableHeaderFilter` in `<th>` + filter logic that checks `f.text` (case-insensitive includes) and `f.selected` (exact match array)
- **Keyboard shortcuts**: added via `useEffect` with `window.addEventListener("keydown", handler)`; check `e.target` to skip inputs
- **Search**: full-page layout (sticky search bar + scrollable results, no overlapping)
- **"New Run"**: full-page `StartRun` component (not a modal), with command preview tabs (gh/curl/python)

## Adding a New Page
1. Create file in `src/components/mockups/aware/`
2. Export a named function wrapping `<AppLayout activeTab="...">`
3. Import shared data from `./_shared/data` and navigation from `./_shared/nav`
4. The page is auto-discoverable via the preview URL pattern

## Common Commands
```bash
cd artifacts/mockup-sandbox
pnpm install
PORT=5173 BASE_PATH=/ pnpm dev              # dev server
BASE_PATH=/AWARE PORT=1 pnpm build          # production build
pnpm run typecheck                          # type check
```

## Deploy
Push to `main` — GitHub Actions builds and deploys automatically.  
Manual build: `BASE_PATH=/AWARE PORT=1 pnpm build` — output in `dist/`.

## Naming Conventions
- Files: PascalCase.tsx for components
- Exports: named function exports matching filename
- CSS classes: kebab-case with `gcp-` prefix
- IDs and keys: snake_case (e.g. `run_892_2341.1.0_prod_1000`, `diff_3`, `test_geo_match`)
- Types: PascalCase interfaces
- Event handlers: `handleX` or inline arrow functions

## Gotchas
- `import.meta.env.BASE_URL` is `/` in dev and `/AWARE/` in production
- `useSyncedUrlState` setter does NOT accept function updaters — spread manually
- `navTo()` uses `pushState` + manual `popstate` — components read URL on mount via `new URLSearchParams(window.location.search)`
- TestDoc reads `testId` from URL; falls back to DIFF_ROWS lookup or hardcoded default
- Compare side panel uses `_SidePanel` helper component to avoid IIFE-in-JSX parsing issues

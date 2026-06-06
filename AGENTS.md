# A.W.A.K.E. — opencode Agent Instructions

## Project
- React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4 SPA
- Mockup for Akamai CDN regression observability
- Live: https://ruake.github.io/AWARE | Repo: https://github.com/ruake/AWARE

## Commands
```bash
cd artifacts/mockup-sandbox
pnpm install
PORT=5173 BASE_PATH=/ pnpm dev              # dev → http://localhost:5173/preview/aware/Dashboard
BASE_PATH=/AWARE PORT=1 pnpm build          # prod build → dist/
pnpm run typecheck                          # strict TS check (MUST pass before commit)
```

## Architecture
- Each page in `src/components/mockups/aware/` exports a named function
- `App.tsx` resolves by function name via `_resolveComponent`
- All pages wrap `<AppLayout activeTab="...">`
- Shared data in `_shared/data.ts` — single source of truth, never import in children
- Navigation: `navTo(path)` from `_shared/nav.ts` — uses `import.meta.env.BASE_URL` for correct dev/prod paths
- URL state: `useSyncedUrlState(key, default)` from `_shared/urlState.ts` — setter does NOT support function updaters
- Tables: `ColumnFilter`/`TableHeaderFilter` for column headers; filter via `{ text, selected }` state

## File Locations
```
artifacts/mockup-sandbox/src/components/mockups/aware/
├── _shared/data.ts           # All mock data, types, generators
├── _shared/nav.ts            # navTo(), copyToClipboard(), repo const
├── _shared/AppLayout.tsx     # Header, sidebar, ⌘K palette, live status, main content
├── _shared/ColumnFilter.tsx  # Reusable column filter component
├── _shared/CommandPalette.tsx # ⌘K overlay
├── _shared/urlState.ts       # useSyncedUrlState hook
├── _shared/useLiveStatus.ts  # Simulated polling + toasts
├── _group.css                # GCP theme variables + component classes
├── Dashboard.tsx             # Multi-env charts, alerts, version drift
├── Runs.tsx                  # Filterable run table + side panel
├── RunDetail.tsx             # Test results + evidence viewer
├── Compare.tsx               # Baseline vs candidate diff + side panel
├── TestAnalytics.tsx         # Per-test analytics (charts + history)
├── TestDoc.tsx               # Per-test documentation with test-jump selector
├── SearchDemo.tsx            # Full-page search
├── StartRun.tsx              # Full-page new run form + command preview
├── Sharing.tsx               # Permalink/share page
└── About.tsx                 # Project info + stats
```

## Gotchas
- `import.meta.env.BASE_URL` = `/` dev, `/AWARE/` production
- `useSyncedUrlState` setter: NO function updaters — use `setState({ ...state, field: val })`
- Compare side panel uses `_SidePanel` helper (IIFE-in-JSX fails TS parser)
- `navTo()` uses `pushState` + manual `popstate` — read URL via `new URLSearchParams(window.location.search)`
- GitHub Actions workflows must be at repo root `.github/workflows/`
- `"packageManager": "pnpm@10.26.1"` required in `package.json` for CI
- Build copies `index.html` → `404.html` for SPA routing fallback

## CSS
- GCP theme: `--gcp-*` CSS variables in `_group.css`
- Classes: `gcp-card`, `gcp-button`/`gcp-button-primary`, `gcp-badge`/`gcp-badge-pass/fail/flaky`, `gcp-input`, `gcp-table`, `gcp-mono`
- Google Charts: always set `backgroundColor: "transparent"` for theme compat

## Run IDs
- `run_892_2341.1.0_prod_<1000-1011>` (12 entries)
- `DIFF_ROWS` = `diff_0` through `diff_14` (15 entries)
- Test IDs in RunDetail: `test_0`, `test_1`, etc.

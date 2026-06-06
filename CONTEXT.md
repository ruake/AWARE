# A.W.A.K.E. — Project Context for AI Coding Tools

A mockup SPA for Akamai CDN regression observability. React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4.

**Live:** https://ruake.github.io/AWARE  
**Repo:** https://github.com/ruake/AWARE

## Quick Start
```bash
cd artifacts/mockup-sandbox
pnpm install
PORT=5173 BASE_PATH=/ pnpm dev       # http://localhost:5173/preview/aware/Dashboard
BASE_PATH=/AWARE PORT=1 pnpm build   # production build
pnpm run typecheck                   # strict TS check
```

## Architecture
- **Pages**: `src/components/mockups/aware/` — each exports a named function, wrapped in `<AppLayout activeTab="...">`
- **Data**: `_shared/data.ts` — single source of truth for all mock data, types, and generators
- **Navigation**: `navTo(path)` from `_shared/nav.ts` — handles BASE_URL differences between dev and production
- **URL state**: `useSyncedUrlState(key, default)` from `_shared/urlState.ts` — **important: setter does NOT support function updaters**
- **Tables**: Reusable `ColumnFilter`/`TableHeaderFilter` components for column-header text search + checkbox filtering
- **Layout**: AppLayout provides header (nav, theme toggle, ⌘K, live status bell) + sidebar (expandable on hover) + main content

## Key Gotchas
| Rule | Why |
|------|-----|
| No function updaters with `useSyncedUrlState` | Setter replaces value directly |
| Compare side panel uses `_SidePanel` helper | IIFE-in-JSX breaks TSX parser |
| `navTo()` uses `pushState` + `popstate` | Read URL via `URLSearchParams(window.location.search)` |
| Google Charts: `backgroundColor: "transparent"` | Theme compatibility |
| `BASE_URL` = `/` dev, `/AWARE/` prod | Use `import.meta.env.BASE_URL` |
| `"packageManager": "pnpm@10.26.1"` in package.json | Required for GitHub Actions CI |
| Build copies `index.html` → `404.html` | SPA routing fallback on GitHub Pages |
| Workflows at repo root `.github/workflows/` | GitHub Actions requirement |

## Mock Data
- **Runs**: 12 entries (`run_892_2341.1.0_prod_1000` through `1011`) — include id, label, suite, target, status, passPct, failures, duration, started, pm, ew, env
- **Diff rows**: 15 entries (`diff_0` through `diff_14`) — name, baseStatus, candStatus, durBase, durCand, category, state (regression/fixed/duration/unchanged)
- **Test details**: 15 entries aligned with diff rows — each has `history` array of `{ runId, status, duration, env }` plus passRate, flakinessScore, avgDuration
- **Environments**: Prod/Production, Prod/Staging, UAT/Production, UAT/Staging

## Component Patterns
- **Split panel layout**: `flex gap-4 flex-1 overflow-hidden` with `w-[60%]` + `w-[40%]` or `flex-1` + `w-[35%]`
- **Sticky header**: `shrink-0` element outside scroll area
- **Time slice**: pill button group (7d/14d/30d/All) synced via useSyncedUrlState
- **Side panels**: appear on row click, have close button, URL-synced selected ID
- **Keyboard shortcuts**: registered via `useEffect` with `window.addEventListener("keydown", handler)`

## Files at a Glance
```
artifacts/mockup-sandbox/src/components/mockups/aware/
├── _shared/
│   ├── data.ts              # All mock data, types, generators
│   ├── nav.ts               # navTo(), copyToClipboard(), repo URL
│   ├── AppLayout.tsx        # Global layout wrapper
│   ├── ColumnFilter.tsx     # Table column header filter
│   ├── CommandPalette.tsx   # ⌘K global search
│   ├── urlState.ts          # URL-persisted state hook
│   └── useLiveStatus.ts     # Simulated polling + toasts
├── _group.css               # GCP theme CSS variables
├── Dashboard.tsx            # Multi-env line chart, alerts, version drift
├── Runs.tsx                 # Filterable run table + side panel
├── RunDetail.tsx            # Test results + evidence viewer
├── Compare.tsx              # Baseline vs candidate diff + side panel
├── TestAnalytics.tsx        # Per-test analytics (charts + history)
├── TestDoc.tsx              # Per-test documentation
├── SearchDemo.tsx           # Full-page search
├── StartRun.tsx             # New run form + command preview
├── Sharing.tsx              # Permalink/share page
└── About.tsx               # Project info + stats
```

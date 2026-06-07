# A.W.A.K.E. — Project Context for AI Coding Tools

CDN regression observability SPA. React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4.

**Live:** https://ruake.github.io/AWARE  
**Repo:** https://github.com/ruake/AWARE  
**App:** `artifacts/aware-app/`

## Quick Start
```bash
cd artifacts/aware-app
pnpm install
pnpm dev                # http://localhost:5173
pnpm build              # production build to dist/public/
pnpm run typecheck      # strict TS check (MUST pass before commit)
```

## Architecture
- **Pages**: `src/pages/` — 15 page components, routed via wouter `<Switch>`/`<Route>` in `App.tsx`
- **Data layer**: `src/lib/` — 15 focused modules. Barrel re-exported through `data.ts`. localStorage-persisted with subscription system (`_notify()`, `_tcListeners`, `_tsListeners`)
- **Routing**: wouter with `base` from `import.meta.env.BASE_URL`. Every page wrapped in `<AppLayout activeHref="...">`
- **Navigation**: `navTo(path)` from `@/lib/nav` for external nav; wouter's `useLocation()` for SPA nav
- **URL state**: `useSyncedUrlState(key, default)` from `@/lib/urlState` — supports function updaters
- **Styling**: Inline `style={{}}` with `var(--gcp-*)` CSS variables from `src/_group.css`
- **Charts**: Recharts (not Google Charts)
- **LLM**: `src/lib/llm.ts` — 3 providers (Mock, OpenAI, WebLLM) + skills registry at `src/lib/skills.ts`

## Key Gotchas
| Rule | Why |
|------|------|
| All pages use inline `style={{}}` | Tailwind `className` only in shadcn/ui components |
| `useSyncedUrlState` supports function updaters | `setState(prev => ({ ...prev, field: val }))` |
| `navTo()` uses `window.location.href` | Full page reload; use wouter's `useLocation()` for SPA nav |
| `_notify()` + `saveToStorage()` after mutations | Required for UI subscriptions + localStorage persistence |
| `createTestCase()` handles IDs/persistence | Don't push to `testCasesStore` directly — use public API |
| `"packageManager": "pnpm@10.26.1"` in package.json | Required for GitHub Actions CI |

## Data
- **Runs**: 12 entries (`run_892_2341.1.0_prod_1000`–`1011`), in `src/lib/runs.ts`
- **Diff rows**: 15 entries (`diff_0`–`diff_14`), in `src/lib/runs.ts`
- **Test cases**: in-memory store + localStorage (`aware_test_cases_v2`), managed by `src/lib/testCases.ts`
- **Test suites**: in-memory store + localStorage (`aware_test_suites_v2`), managed by `src/lib/testSuites.ts`
- **Environments**: Prod/Production, Prod/Staging, UAT/Production, UAT/Staging

## File Layout
```
artifacts/aware-app/src/
├── lib/               # store, runs, testCases, testSuites, promotions, constants, llm, skills, types, nav, urlState
├── components/
│   ├── aware/         # AppLayout, ColumnFilter, CTAStatCard, FilterBar, GenerateWizard, SuiteEditor, etc.
│   └── ui/            # shadcn/ui (button, card, badge, dialog, etc.)
├── pages/             # Dashboard, Runs, Compare, TestManager, Copilot, etc. (15 pages)
├── hooks/             # useSimpleToast, useTestData, useSyncedUrlState
├── App.tsx            # wouter Router
├── main.tsx           # Entry point
├── _group.css         # GCP CSS variables
└── index.css          # Tailwind imports
```

## Component Patterns
- **Split panel**: `flex-col lg:flex-row` with `w-full lg:w-[<percent>]` — stacks on mobile
- **Stat-to-filter CTAs**: CTAStatCard component with `active` state toggles column filters
- **Side panels**: appear on row click, close button, flex-col lg:flex-row for responsive stacking
- **Toast**: `useSimpleToast()` hook — returns `{ show, Toast }`
- **Data subscriptions**: `useTestData()` hook subscribes to test cases + suites

# A.W.A.K.E. — opencode Agent Instructions

## Project
- React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4 SPA
- Single app at `artifacts/aware-app/` (mockup removed; all pages fully ported)
- Akamai CDN regression observability tool
- Live: https://ruake.github.io/AWARE | Repo: https://github.com/ruake/AWARE

## Commands
```bash
cd artifacts/aware-app
pnpm install
pnpm dev                    # dev server
pnpm build                  # prod build
pnpm run typecheck          # TS check (MUST pass before commit)
```

## Architecture
- **Routing**: wouter (`<Switch>` / `<Route>` / `<Link>`) with `base` from `import.meta.env.BASE_URL`
- **Data**: `src/lib/data.ts` — localStorage-persisted CRUD store (`aware_test_cases_v2`, `aware_test_suites_v2`); subscription system (`_notify()`, `_tcListeners`, `_tsListeners`) for reactive updates
- **Types**: `src/lib/types.ts` — all type interfaces (TestCase, TestSuite, Predicate, GenerateParams, LLM types, etc.)
- **Charts**: Recharts (not Google Charts)
- **Styling**: Inline `style={{}` with `var(--gcp-*)` CSS variables from `src/_group.css`; shadcn/ui via `class-variance-authority` + `components.json`
- **LLM/AI**: `src/lib/llm.ts` — provider abstraction (Mock, OpenAI, WebLLM) + singleton service; `src/lib/skills.ts` — skills registry for code gen, test analysis, diff explanation
- **Error handling**: `classifyError()`, `FetchError`, `TimeoutError`, `ValidationError` in `types.ts`; `ErrorBoundary` at `src/components/aware/ErrorBoundary.tsx`

## File Layout
```
artifacts/aware-app/src/
├── lib/
│   ├── data.ts              # CRUD store, fixtures, generation, import/export, stats
│   ├── types.ts             # All TypeScript interfaces & classes
│   ├── llm.ts               # LLM provider system + singleton service
│   ├── skills.ts            # Skills registry for LLM actions
│   ├── nav.ts               # navTo(), copyToClipboard(), showToast(), repo
│   ├── urlState.ts          # useSyncedUrlState hook
│   └── useLiveStatus.ts     # Simulated polling with toast
├── components/
│   ├── aware/
│   │   ├── AppLayout.tsx    # Header, sidebar, ⌘K palette, live status
│   │   ├── ColumnFilter.tsx # Reusable column filter (aria/escape/focus)
│   │   ├── CommandPalette.tsx # ⌘K overlay
│   │   └── ErrorBoundary.tsx # Error boundary with retry/home
│   └── ui/                  # shadcn/ui components (button, card, badge, etc.)
├── pages/
│   ├── Dashboard.tsx        # Multi-env charts, alerts, version drift
│   ├── Runs.tsx             # Filterable run table + side panel CTAs
│   ├── RunDetail.tsx        # Test results + evidence viewer
│   ├── Compare.tsx          # Baseline vs candidate diff + CTA stat cards
│   ├── TestManager.tsx      # Test case CRUD, stats dashboard, generate wizard
│   ├── TestSuiteManager.tsx # Suite tree + editor + YAML export + recharts charts
│   ├── TestAnalytics.tsx    # Per-test analytics with CTA stat cards
│   ├── TestDoc.tsx          # Per-test documentation + 3-column layout
│   ├── SearchDemo.tsx       # Full-page search with keyboard navigation
│   ├── StartRun.tsx         # New run form + command preview
│   ├── Sharing.tsx          # Permalink/share page with export formats
│   ├── Status.tsx           # System status dashboard
│   ├── Copilot.tsx          # AI copilot page with chat + skill selector
│   ├── About.tsx            # Project info + navigable stat cards
│   └── not-found.tsx        # 404 handler
├── App.tsx                  # Root with QueryClientProvider + wouter Router
├── main.tsx                 # Entry point (imports _group.css + index.css)
├── _group.css               # GCP theme CSS variables + component classes
└── index.css                # Tailwind imports
```

## LLM / AI Copilot
- **Provider system** in `src/lib/llm.ts`: `MockLLMProvider` (works offline), `OpenAILLMProvider` (OpenAI-compatible APIs), `WebLLMProvider` (stub for `@mlc-ai/web-llm`)
- **Config**: `LLMConfig` in `types.ts` — `provider`, `apiKey`, `apiUrl`, `model`, `temperature`, `maxTokens`
- **Skills**: `src/lib/skills.ts` — 5 built-in skills: `generate-tests`, `generate-script`, `analyze-results`, `explain-diff`, `generate-suite`
- **Generate tests with LLM**: Call `generateTestsWithLLM(params)` which sends a prompt to the configured provider, parses JSON response, creates TestCase objects, persists to store
- **Chat**: `llmChat(message, skillSystemPrompt?)` maintains rolling history (last 50 messages)
- **Copilot page** at `/copilot`: Chat UI, skill selector dropdown, provider config panel

## CTA Pattern (stat → filter)
Summary/stat cards act as clickable CTAs that toggle column filters:
- **Compare**: New Failures, Fixed, Still Failing, Duration Regressions → toggle `state`/`baseStatus`/`candStatus` column filters
- **TestAnalytics**: Pass Rate, Flakiness, Avg Duration → filter Run History table by PASS/FAIL/duration highlight
- **Runs side panel**: Failures → `statusFilter=FAIL`; Target → `quickTarget`
- **Dashboard env cards**: navigate to `Runs?env=<label>`
- **About stats**: Total Runs → Runs, Tests Tracked → TestManager, Regressions → Compare
- Active ring: `shadow-[inset_0_0_0_2px_var(--gcp-<color>)]`

## Gotchas
- All pages use inline `style={{}` NOT Tailwind `className`
- `useSyncedUrlState` setter supports function updaters: `setState(prev => ({ ...prev, field: val }))`
- `navTo()` in `src/lib/nav.ts` uses `window.location.href` (full nav); use wouter's `useLocation()` for SPA navigation within pages
- `import.meta.env.BASE_URL` = `/` dev, `/AWARE/` production
- GitHub Actions at repo root `.github/workflows/`
- `"packageManager": "pnpm@10.26.1"` in `package.json` for CI
- `_notify()` must be called after any store mutation to trigger UI updates
- `saveToStorage()` must be called to persist to localStorage
- `testCasesStore` / `nextTcId` are module-level (shared across imports)
- `testType`, `config`, `assertions` fields on `TestCase` are legacy — new code uses `predicates` + `filmstripConfig`

## Run IDs
- `run_892_2341.1.0_prod_<1000-1011>` (12 entries)
- `DIFF_ROWS` = `diff_0` through `diff_14` (15 entries)
- Test IDs: `test_0`, `test_1`, etc. (RunDetail); `tc_N` (generated)

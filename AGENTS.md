# A.W.A.K.E. — opencode Agent Instructions

## Project
- React 19 + TypeScript 5.9 + Vite 7 SPA (Tailwind CSS 4 in index.css only, pages use inline `style={{}}`)
- Single app at `artifacts/aware-app/` — mockup fully removed
- Akamai CDN regression observability tool
- Live: https://ruake.github.io/AWARE | Repo: https://github.com/ruake/AWARE

## Commands
```bash
cd artifacts/aware-app
pnpm install
pnpm dev                    # dev server at :5173
pnpm build                  # prod build → dist/public/
pnpm run typecheck          # TS check (MUST pass before commit)
```

## Architecture
- **Routing**: wouter (`<Switch>` / `<Route>` / `<Link>`) with `base` from `import.meta.env.BASE_URL`
- **Data layer**: `src/lib/` — 15 modules. Barrel re-exported through `data.ts`. localStorage-persisted CRUD store (`aware_test_cases_v2`, `aware_test_suites_v2`); subscription system (`_notify()`, `_tcListeners`, `_tsListeners`) for reactive updates. Modules: `store.ts`, `runs.ts`, `testCases.ts`, `testSuites.ts`, `promotions.ts`, `testImportExport.ts`, `constants.ts`, `utils.ts`
- **Types**: `src/lib/types.ts` — all type interfaces (TestCase, TestSuite, Predicate, GenerateParams, LLM types, error classes, etc.)
- **Charts**: Recharts (not Google Charts)
- **Styling**: Inline `style={{}}` with `var(--gcp-*)` CSS variables from `src/_group.css`; shadcn/ui via `class-variance-authority` + `components.json`
- **LLM/AI**: `src/lib/llm.ts` — provider abstraction (Mock, OpenAI, WebLLM) + singleton service; `src/lib/skills.ts` — 5 skill registry for code gen, test analysis, diff explanation
- **Error handling**: `classifyError()`, `FetchError`, `TimeoutError`, `ValidationError` in `types.ts`; `ErrorBoundary` at `src/components/aware/ErrorBoundary.tsx`

## File Layout
```
artifacts/aware-app/src/
├── lib/                   # data.ts (barrel), store, runs, testCases, testSuites, promotions, constants, testImportExport, utils, llm, skills, types, nav, urlState, useLiveStatus
├── components/
│   ├── aware/             # AppLayout, ColumnFilter, CTAStatCard, FilterBar, StatusBadge, SectionHeader, GenerateWizard, StatsDashboard, TestCard, TestManagerSidePanel, SuiteTreeItem, SuiteEditor, AddTestsModal, YamlPreview, TestDocTopBar, TestDocSidebar, TestDocChangelog, CommandPalette, ErrorBoundary
│   └── ui/                # shadcn/ui components (button, card, badge, dialog, etc.)
├── pages/
│   ├── Dashboard.tsx      # Multi-env charts, alerts, promotion banner
│   ├── Runs.tsx           # Filterable run table + side panel CTAs
│   ├── RunDetail.tsx      # Test results + evidence viewer
│   ├── Compare.tsx        # Baseline vs candidate diff + CTA stat cards
│   ├── TestManager.tsx    # Test case CRUD, bulk actions, multi-format import, stats dashboard, generate wizard
│   ├── TestSuiteManager.tsx # Suite tree + editor + YAML export + recharts charts
│   ├── TestAnalytics.tsx  # Per-test analytics (works with tc_N and diff_N IDs)
│   ├── TestDoc.tsx        # Per-test documentation + 3-column layout
│   ├── SearchDemo.tsx     # Full-page search wired to real testCasesStore, RUNS, DIFF_ROWS
│   ├── StartRun.tsx       # New run form + command preview
│   ├── Sharing.tsx        # Permalink/share page
│   ├── Status.tsx         # System status dashboard
│   ├── Copilot.tsx        # AI chat with skill selector + WebLLM unavailable banner
│   ├── About.tsx          # Project info + stat cards
│   └── not-found.tsx      # 404 handler
├── hooks/
│   ├── useSimpleToast.tsx # Shared toast (all pages)
│   ├── useTestData.ts     # Subscribes to test cases + suites
│   └── useSyncedUrlState  # (in lib/urlState.ts, supports function updaters)
├── App.tsx                # wouter Router with all routes
├── main.tsx               # Entry point
├── _group.css             # GCP CSS variables
└── index.css              # Tailwind imports
```

## LLM / AI Copilot
- **Provider system** in `src/lib/llm.ts`: `MockLLMProvider` (offline), `OpenAILLMProvider` (OpenAI-compatible), `WebLLMProvider` (requires `@mlc-ai/web-llm` + WebGPU — shows user-friendly "not available" message when missing)
- **Config**: `LLMConfig` in `types.ts` — `provider`, `apiKey`, `apiUrl`, `model`, `temperature`, `maxTokens`
- **Skills**: `src/lib/skills.ts` — 5 built-in skills: `generate-tests`, `generate-script`, `analyze-results`, `explain-diff`, `generate-suite`
- **Generate tests with LLM**: `generateTestsWithLLM(params)` — sends prompt, parses JSON, persists via `createTestCase()`
- **Chat**: `llmChat(message, skillSystemPrompt?)` — rolling history (last 50)
- **Copilot page** at `/copilot`: Chat UI, skill selector, provider config panel, WebLLM availability check
- `checkWebLLM()` exported — pre-checks if `@mlc-ai/web-llm` loads

## Key Features
- **Bulk actions in TestManager**: Multi-select checkboxes, batch delete, batch status change, batch priority change, batch add-to-suite, bulk export (JSON/CSV/JUnit)
- **Multi-format import**: Auto-detects JSON, YAML, and JUnit XML via `importAuto()` from `testImportExport.ts`
- **Wired Search**: SearchDemo queries real `testCasesStore`, `RUNS`, and `DIFF_ROWS` instead of hardcoded arrays
- **Test Analytics**: Accepts both `testId` (tc_N) and `diffId` (diff_N) search params — shows test case metadata when available
- **CTA Pattern**: Stat cards toggle column filters across Compare, Analytics, Runs, Dashboard, About
- **Test scripts**: `.yaml` extension on all scriptPath fields (portable YAML schema, not Playwright TS)

## Gotchas
- All pages use inline `style={{}}` NOT Tailwind `className`
- `useSyncedUrlState` setter supports function updaters: `setState(prev => ({ ...prev, field: val }))`
- `navTo()` in `src/lib/nav.ts` uses `window.location.href` (full nav); use wouter's `useLocation()` for SPA navigation
- `import.meta.env.BASE_URL` = `/` dev, `/AWARE/` production
- GitHub Actions at repo root `.github/workflows/`
- `"packageManager": "pnpm@10.26.1"` in `package.json` for CI
- `_notify()` + `saveToStorage()` called by public API (createTestCase, etc.) — don't call manually
- `testType`, `config`, `assertions` fields on `TestCase` are legacy — new code uses `predicates` + `filmstrip`

## Data
- 12 runs: `run_892_2341.1.0_prod_<1000-1011>` (in `lib/runs.ts`)
- 15 diff rows: `diff_0`–`diff_14` (in `lib/runs.ts`)
- Test cases seed: 25 `tc_0`–`tc_24` (in `lib/testCases.ts`)
- Test suites: 8 seed suites (in `lib/testSuites.ts`)
- Environments: Prod/Production, Prod/Staging, UAT/Production, UAT/Staging

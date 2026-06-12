# PROOF — CLAUDE.md

## Project Overview
Configurable web app test observability SPA. React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4. Deployed to GitHub Pages.

**Live demo:** https://ruake.github.io/AWARE  
**Repo:** https://github.com/ruake/AWARE  
**App directory:** `artifacts/aware-app/`

## Directory Structure
```
artifacts/aware-app/src/
├── lib/
│   ├── data.ts              # Barrel re-export (backward compatible)
│   ├── store.ts             # _notify(), saveToStorage(), subscriptions
│   ├── runs.ts              # RUNS, DIFF_ROWS, charts, test details
│   ├── testCases.ts         # TestCase CRUD, generation, stats, filtering
│   ├── testSuites.ts        # TestSuite CRUD, tree building
│   ├── promotions.ts        # PromotionDecision CRUD
│   ├── constants.ts         # ENVS, CATEGORIES, TAG_COLORS, PRIORITIES, etc.
│   ├── llm.ts               # LLM provider system (Mock, OpenAI, WebLLM)
│   ├── skills.ts            # Skills registry (5 skills)
│   ├── types.ts             # All TypeScript interfaces & classes
│   ├── nav.ts               # navTo(), copyToClipboard(), showToast(), repo
│   ├── urlState.ts          # useSyncedUrlState hook
│   ├── useLiveStatus.ts     # Simulated polling with toast
│   ├── testImportExport.ts  # JSON/CSV/JUnit XML import/export
│   └── utils.ts             # cn() utility
├── components/
│   ├── aware/
│   │   ├── AppLayout.tsx    # Header, sidebar, ⌘K palette, live status
│   │   ├── ColumnFilter.tsx # Reusable column filter (aria/escape/focus)
│   │   ├── CTAStatCard.tsx  # Clickable stat card with active ring
│   │   ├── FilterBar.tsx    # Search + filter dropdowns
│   │   ├── StatusBadge.tsx  # PASS/FAIL/FLAKY badge
│   │   ├── SectionHeader.tsx # Title + actions slot
│   │   ├── GenerateWizard.tsx # Template/AI generation modal
│   │   ├── StatsDashboard.tsx # Bar chart stats
│   │   ├── TestCard.tsx     # TagBadge, StatusBadge, priorityColor
│   │   ├── TestManagerSidePanel.tsx # Test detail side panel
│   │   ├── SuiteTreeItem.tsx # Recursive tree node
│   │   ├── SuiteEditor.tsx  # Suite create/edit modal
│   │   ├── AddTestsModal.tsx # Multi-select test picker
│   │   ├── YamlPreview.tsx  # YAML copy-to-clipboard
│   │   ├── TestDocTopBar.tsx # Sticky test doc nav bar
│   │   ├── TestDocSidebar.tsx # Docs + related tests
│   │   ├── TestDocChangelog.tsx # Git history timeline
│   │   ├── CommandPalette.tsx # ⌘K overlay
│   │   └── ErrorBoundary.tsx # Error boundary with retry/home
│   └── ui/                  # shadcn/ui (button, card, badge, dialog, etc.)
├── pages/
│   ├── Dashboard.tsx        # Multi-env charts, alerts, version drift
│   ├── Runs.tsx             # Filterable run table + side panel CTAs
│   ├── RunDetail.tsx        # Test results + evidence viewer
│   ├── Compare.tsx          # Baseline vs candidate diff + CTA stat cards
│   ├── TestManager.tsx      # Test case CRUD, stats, generate wizard
│   ├── TestSuiteManager.tsx # Suite tree + editor + charts
│   ├── TestAnalytics.tsx    # Per-test analytics
│   ├── TestDoc.tsx          # 3-column test documentation
│   ├── SearchDemo.tsx       # Full-page keyboard-navigable search
│   ├── StartRun.tsx         # New run form + command preview
│   ├── Sharing.tsx          # Permalink/share with export formats
│   ├── Status.tsx           # System status dashboard
│   ├── Copilot.tsx          # AI chat with skill selector
│   ├── About.tsx            # Project info + stat cards
│   └── not-found.tsx        # 404 handler
├── hooks/
│   ├── useSimpleToast.tsx   # Shared toast hook (all pages)
│   ├── useTestData.ts       # Shared data subscription hook
│   ├── useSyncedUrlState    # (in lib/urlState.ts)
│   └── use-toast.ts         # shadcn sonner toast
├── App.tsx                  # wouter Router with all routes
├── main.tsx                 # Entry point
├── _group.css               # GCP theme CSS variables + component classes
└── index.css                # Tailwind imports
```

## Architecture Rules

### Pages
- Each page is a default export wrapped in `<AppLayout activeHref="...">`
- Routes defined in `App.tsx` via wouter `<Route path="..." component={...} />`
- Use inline `style={{}}` — NOT Tailwind `className` — for all page-level components
- Shared UI components (CTAStatCard, FilterBar) are in `components/aware/`

### Data Layer (src/lib/)
- All data functions importable from `@/lib/data` (barrel re-export)
- Mutations: call `createTestCase()`, `updateTestCase()`, etc. — they handle persistence + notifications
- Subscriptions: `subscribeToTestCases(cb)` / `subscribeToTestSuites(cb)` — return unsubscribe fn
- `useTestData()` hook from `@/hooks/useTestData` handles subscription lifecycle
- Never access `testCasesStore`, `nextTcId`, `saveToStorage()`, `_notify()` directly — use public API

### LLM / AI Copilot
- Provider system in `src/lib/llm.ts`: Mock (offline), OpenAI (API), WebLLM (WebGPU)
- Skills in `src/lib/skills.ts`: generate-tests (JSON), generate-script (YAML), analyze-results, explain-diff, generate-suite (YAML)
- Chat: `llmChat(message, skillSystemPrompt?)` maintains rolling history (last 50)
- Generate tests: `generateTestsWithLLM(params)` — sends prompt, parses JSON response, persists via `createTestCase()`
- WebLLM must be gracefully degraded — it's an optional dependency (`new Function('return import(...)')()` pattern)

### State Management
- Module-level stores + subscription system (no Redux/Zustand)
- URL state persistence via `useSyncedUrlState<T>(key, defaultValue)` — supports function updaters
- Toast: `useSimpleToast()` hook returns `{ show, Toast }`

### Styling
- Inline styles with GCP CSS variables: `var(--gcp-blue)`, `var(--gcp-surface)`, etc.
- Utility classes from `_group.css`: `gcp-card`, `gcp-button`, `gcp-button-primary`, `gcp-badge`, `gcp-input`, `gcp-table`, `gcp-mono`
- Dark mode toggles `dark` class on `<html>`

### CTA Pattern (stat → filter)
- `CTAStatCard` with `active` prop shows inset shadow ring
- Compare: New Failures/Fixed/Still Failing/Duration → toggle `state` column filter
- All stat cards: clicking toggles filter, clicking again resets

## Common Commands
```bash
cd artifacts/aware-app
pnpm install
pnpm dev                                  # dev server at :5173
pnpm build                                # production build → dist/public/
pnpm run typecheck                        # strict TS check (MUST pass)
```

## Deploy
Push to `main` — GitHub Actions builds and deploys automatically.
Manual build: `cd artifacts/aware-app && pnpm build`

# AWARE — Master Engineering Plan
> 10-year horizon · 110+ issues catalogued · 6 phases · Priority-ranked

---

## Executive Summary

AWARE is a CDN test observability platform that has grown organically into a sophisticated static SPA. The core ideas are sound: config-as-code YAML, a GitHub data branch, a browser-local LLM copilot. But the implementation has accumulated structural debt that will compound badly as the data volume grows, more teams adopt it, and the AI surface expands. This plan makes it production-grade, scalable, secure, and maintainable for the next decade.

---

## Phase 0 — Critical Security (Fix before anything else)

> These are active vulnerabilities. No new feature work starts until these are resolved.

### S-01 · OpenAI API key in localStorage ⚠️ CRITICAL
**File:** `src/lib/copilot/storage.ts`, `providers.ts`
**Issue:** The user pastes their OpenAI key into the UI; it's stored with `localStorage.setItem("aware_openai_config_v1", ...)` and sent as an `Authorization` header directly from the browser. Any XSS — even from a malicious test result name in `runs.json` — steals the key permanently.
**Fix:** Proxy all OpenAI calls through a thin server endpoint (`/api/ai/chat`). The key lives in a server-side env var (Replit secret), never touches the browser. The UI sends the conversation messages; the server forwards to OpenAI and streams back. If a fully serverless approach is required, use a short-lived token exchange pattern.

### S-02 · `dangerouslySetInnerHTML` without sanitization ⚠️ CRITICAL
**File:** `src/components/aware/Markdown.tsx:406`
**Issue:** `colorCellHtml(cell)` builds an HTML string from test result data and injects it with `dangerouslySetInnerHTML`. If a test result's name or metadata contains `<script>` or `<img onerror=...>`, it executes.
**Fix:** Wrap with `DOMPurify.sanitize()` before injection. Add `dompurify` to dependencies. Alternatively, refactor to render React elements instead of raw HTML.

### S-03 · Entire test-results.json exposed to browser ⚠️ HIGH
**Issue:** `dataFetcher.ts` fetches the complete `test-results.json` to the client. This file likely contains internal environment hostnames, IP ranges, header configurations, and Akamai property metadata — a roadmap for attackers.
**Fix:** For sensitive fields, either scrub them in the `record-run.mjs` CI step before committing to the data branch, or serve data through an API that redacts sensitive fields by role.

### S-04 · No Content Security Policy ⚠️ HIGH
**Issue:** No CSP headers are set anywhere. Combined with S-02, a successful XSS has unlimited reach.
**Fix:** Add a strict CSP meta tag to `index.html` (and HTTP headers on deployment): `default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.openai.com https://raw.githubusercontent.com`.

### S-05 · No rate limiting on AI requests ⚠️ MEDIUM
**Issue:** The Copilot makes direct, unbounded OpenAI API calls. A user can send thousands of requests and exhaust the API quota with no protection.
**Fix:** Implement a client-side token bucket in `graphAgent.ts` (max N requests per minute), with a server-side hard limit when the proxy (S-01) is in place.

---

## Phase 1 — Architecture Overhaul

> The structural issues that will get exponentially worse. Must be resolved before feature work.

### A-01 · Three parallel state systems ("split brain") 🔴 CRITICAL
**Files:** `src/lib/store.ts`, `src/lib/runs.ts`, `src/lib/initData.ts`, + React Query
**Issue:** Three completely separate reactive state systems coexist:
1. Custom pub/sub (`_tcListeners`, `_tsListeners`, `_runsListeners`, `_diffRowsListeners`) — manual `Set` of callbacks
2. React Query — proper async cache
3. Direct localStorage reads — no reactivity

This means a data update might propagate through only one system, causing stale UI in another. It also makes it impossible to reason about "the current state" of the app.

**Fix:** Consolidate on **Zustand** (lightweight, no boilerplate, works alongside React Query) for synchronous global state, and **React Query** for all async/server state. Migrate all pub/sub stores to Zustand slices. Migrate all React Query hooks to use the unified store as a selector layer.

```
Before: Custom pub/sub → subscribers re-render
After:  Zustand store → React components subscribe via useSyncExternalStore (what Zustand uses internally)
```

### A-02 · No runtime data validation 🔴 HIGH
**File:** `src/lib/dataFetcher.ts:30` — `return res.json() as Promise<T>`
**Issue:** The TypeScript `as T` cast is a lie to the compiler. When `runs.json` is malformed (corrupt CI write, schema drift), the app crashes deep inside `recomputeAll()` with an unreadable error, not at the fetch boundary where it's debuggable.
**Fix:** Use the Zod schemas that already exist in `lib/api-zod` (they're already generated — they're just not used). Wrap every `fetchJson` call with `.then(schema.parse)`. Parse errors surface immediately with field-level detail.

### A-03 · Blocking data load — no progressive rendering 🔴 HIGH
**File:** `src/lib/initData.ts:49` — `Promise.all([loadRuns, loadAllResults, loadTestSuites, ...])`
**Issue:** Six network requests must ALL complete before the first pixel of data renders. On a slow connection or when the data branch grows large, users see a spinner for 5–15 seconds.
**Fix:** Waterfall-aware streaming load:
1. Load `runs.json` first (small index file) → render the runs list immediately
2. Load test results lazily per-run when the user navigates to a run
3. Load suites, promotions, scheduler status in the background after runs render
4. Show skeleton UI for sections still loading

### A-04 · GitHub raw CDN as the sole data source 🟠 HIGH
**Files:** `dataFetcher.ts:1-6`
**Issue:** `https://raw.githubusercontent.com` is rate-limited (60 req/hr unauthenticated), has no SLA, and hardcodes `ruake/AWARE` in client-side code. When the repo is renamed or moved, the app silently breaks in production.
**Fix short-term:** Move `REPO_OWNER`, `REPO_NAME`, `DATA_BRANCH` to `import.meta.env.VITE_DATA_REPO_OWNER` etc. (build-time config, not runtime secret).
**Fix long-term:** Deploy a lightweight edge function (Cloudflare Worker or Replit deployment) that proxies data requests, adds caching headers, handles auth, and decouples the app from GitHub's raw CDN.

### A-05 · YAML config duplicated into TypeScript 🟠 MEDIUM
**Files:** `config/environments.yml` ↔ `src/lib/envConfig.ts`
**Issue:** The runtime TS file must manually mirror the source-of-truth YAML. A CI validation script catches drift, but only in CI — local dev can run with stale mirrors for hours without noticing.
**Fix:** Generate `envConfig.ts` at build time from the YAML using a codegen script (`scripts/codegen-config.mjs`). Run it as part of `vite.config.ts`'s `buildStart` hook. The generated file is never hand-edited; it's regenerated on every dev server start.

### A-06 · Dead library weight — Drizzle + OpenAPI unused 🟡 MEDIUM
**Files:** `lib/db/`, `lib/api-spec/`, `lib/api-client-react/`
**Issue:** A full database schema (Drizzle ORM) and OpenAPI spec exist as workspace packages but are not used anywhere in the app. They add install time and mental overhead.
**Decision point:** Either (a) commit to using them by wiring up the API server properly (recommended — see Phase 3), or (b) remove them entirely. Leaving them in a half-wired state is worse than either option.

### A-07 · Unbounded data branch growth 🟡 MEDIUM
**Issue:** Every test run commits JSON to the data branch. After a year of 96 daily runs, this becomes thousands of commits and potentially hundreds of MB of JSON. `git clone` of the data branch slows CI, and the browser loads more data than it can show.
**Fix:** Implement a data retention policy:
- Keep last 90 days of full data, archive older runs to a summary object
- Add a `scripts/prune-data-branch.mjs` script run weekly in CI
- Introduce a `runs-index.json` (lightweight manifest) vs `runs-full.json` (full data) split

---

## Phase 2 — Code Quality & Type Safety

### Q-01 · Massive page files violating Single Responsibility 🔴
| File | Lines | Problem |
|------|-------|---------|
| `Copilot.tsx` | 866 | Chat UI + state + streaming + UI effects all in one |
| `Dashboard.tsx` | 737 | KPI cards + chart + env health + trend in one |
| `RunDetail.tsx` | 591 | Run header + tabs + test table + diff view |
| `Markdown.tsx` | 600 | Parsing + table render + code highlight + HTML injection |
| `graphAgent.ts` | 644 | LLM routing + all node implementations + streaming |
| `tools.ts` | 685 | All 20+ AI tools in one file |

**Fix:** Extract each logical section into a named sub-component in a co-located folder. Target: no page file over 250 lines, no component file over 150 lines.

```
pages/Dashboard/
  index.tsx          (< 80 lines, composes sub-components)
  KpiSection.tsx
  EnvHealthGrid.tsx
  TrendChart.tsx
  AnomalyBanner.tsx
```

### Q-02 · `as any` casts and `Record<string, any>` 🟠
**Count:** 8 files contain `as any`; `AccessibilityWrapper.tsx` uses `Record<string, any>` for props.
**Fix:** Audit all `as` casts. Replace with proper type narrowing or Zod parse (A-02). Upgrade `@typescript-eslint/no-explicit-any` from `warn` to `error` in `eslint.config.js`.

### Q-03 · Prop drilling through 3+ component layers 🟠
**Example:** `colFilters` flows from `Tests.tsx` → `StatsDashboard.tsx` → child components.
**Fix:** Use Zustand slices (from A-01) for shared UI state like active filters. Components read directly from the store.

### Q-04 · Inconsistent routing patterns 🟡
**File:** `App.tsx`
**Issue:** `window.history.replaceState` used for redirects instead of wouter's `<Redirect />`. This bypasses wouter's router state and can cause browser history inconsistencies.
**Fix:** Replace all `window.history.replaceState` redirect patterns with wouter's `useLocation` hook + `setLocation` or the `<Redirect />` component.

### Q-05 · Two deprecated naming systems coexisting 🟡
**Issue:** Routes and files still say "Pulse" (`Pulse.tsx`, `PulseFeed.tsx`, `PulseDetail.tsx`) while docs say they were renamed to "Activity/Runs".
**Fix:** Rename files, update all imports, add wouter `<Redirect from="/pulse" to="/runs" />` for backward compatibility.

### Q-06 · CSS variable shims and inline style overuse 🟡
**File:** `index.css:160-165` — backward-compat aliases `--proof-grey`, `--proof-text-dim`
**Issue:** ~40% of styling uses inline style objects instead of CSS classes. Hover effects use `onMouseEnter`/`onMouseLeave` to set inline styles instead of `:hover` pseudo-classes.
**Fix:** 
- Remove all backward-compat CSS var aliases (do a find-replace for the old names)
- Move all inline styles that are static to CSS classes or Tailwind utilities
- Replace JS hover handlers with CSS `:hover` selectors

### Q-07 · Redundant charting libraries 🟡
**Issue:** Recharts (primary, modern, themed) AND Google Charts (legacy, marked `@deprecated`) are both in the bundle. Google Charts loads a CDN script tag dynamically, adding a third-party dependency and increasing bundle parse time.
**Fix:** Implement the missing sorted/filterable table in Recharts or a lightweight table library (`@tanstack/react-table`). Remove `react-google-charts` entirely.

---

## Phase 3 — Performance

### P-01 · No route-level lazy loading 🔴
**Issue:** All pages are imported eagerly. Copilot, RunDetail, and TestAnalytics are heavy pages that most users never visit in a session, but they're parsed on first load.
**Fix:**
```tsx
// App.tsx — replace eager imports with:
const Copilot = lazy(() => import('./pages/Copilot'));
const RunDetail = lazy(() => import('./pages/RunDetail'));
const TestAnalytics = lazy(() => import('./pages/TestAnalytics'));
```
Wrap with `<Suspense fallback={<PageSkeleton />}>`.

### P-02 · WebLLM ships 7B model weights to the browser silently 🔴
**Issue:** `@mlc-ai/web-llm` downloads ~4GB of model weights the first time a user enables WebLLM mode, with only a small progress indicator. Most users don't understand what's happening.
**Fix:** 
- Add a prominent pre-download warning dialog: "This will download ~4GB to your browser. This is a one-time download that enables fully private AI processing."
- Lazy-import `@mlc-ai/web-llm` only when the user explicitly selects WebLLM mode (currently it's in the main bundle)
- Show a proper progress UI with estimated time

### P-03 · Three.js PoPGlobe runs every frame, even off-screen 🟠
**File:** `src/components/PoPGlobe.tsx`
**Issue:** `useFrame` callback runs 60fps continuously even when the user is on a different page. On mobile, this drains the battery.
**Fix:** 
- Use `IntersectionObserver` to detect when the globe is visible; pause the render loop when hidden
- Add `frameloop="demand"` to `<Canvas>` and call `invalidate()` only when data changes
- On low-power devices (`navigator.getBattery()` or `prefers-reduced-motion`), render a static SVG map instead

### P-04 · No virtual scrolling in data tables 🟠
**Issue:** The Runs list and test results tables render all rows to the DOM. With 1000+ runs (realistic after 6 months), this freezes the browser on render.
**Fix:** Use `@tanstack/react-virtual` (already a dependency!) consistently across all list/table components.

### P-05 · Missing `React.memo` on expensive list items 🟡
**Files:** `TierCard` in Dashboard.tsx, run row components in Runs.tsx
**Issue:** When the global data store notifies, all subscriber components re-render including list items that didn't change.
**Fix:** Wrap all list item components with `React.memo`. Add `useMemo` for expensive derived calculations in `recomputeAll()`.

### P-06 · No skeleton loading — jarring blank → content 🟡
**Fix:** Add a `<Skeleton>` component system (shadcn/ui already has one). Show skeletons during:
- Initial data load (A-03)
- Run detail lazy load
- Chart data computation

---

## Phase 4 — Developer Experience & Testing

### D-01 · No component catalog (Storybook) 🟠
**Issue:** With 50+ components, there's no way to develop or review components in isolation. Designers can't review components without running the whole app.
**Fix:** Add Storybook with stories for all `src/components/aware/` components. This also serves as living documentation.

### D-02 · No pre-commit hooks 🟠
**Issue:** Formatting and linting errors reach the repo because there's no enforcement at commit time.
**Fix:** Add `simple-git-hooks` + `lint-staged` (lighter than husky). Run `eslint --fix` and `prettier --write` on staged files.

### D-03 · ESLint rules too lenient 🟡
**Changes needed in `eslint.config.js`:**
- `@typescript-eslint/no-explicit-any`: `"warn"` → `"error"`
- Add `@typescript-eslint/no-unsafe-assignment`
- Add `react-hooks/exhaustive-deps` enforcement
- Add `jsx-a11y` plugin

### D-04 · Test coverage gaps 🟡
**Current state:** Unit tests for lib utilities; smoke-only E2E; zero component tests; zero AI flow tests.
**Fix:**
- Add Vitest + React Testing Library tests for all components in `src/components/aware/`
- Add coverage thresholds to `vitest.config.ts`: `branches: 70, lines: 80`
- Add Playwright tests for: run detail view, filter state, copilot conversation flow
- Add `@axe-core/playwright` for automated accessibility checks in E2E

### D-05 · No error boundaries at page level 🟡
**Issue:** A runtime error in one page crashes the entire app with a white screen.
**Fix:** Wrap each route in `<ErrorBoundary>` with a friendly fallback UI and a "report issue" action.

### D-06 · Codegen not wired to dev server 🟡
**Issue:** `lib/api-spec` can generate types, but it's not part of the `dev` startup sequence.
**Fix:** Add codegen as a Vite plugin hook that runs `openapi-typescript` on `buildStart` in dev mode.

---

## Phase 5 — Accessibility & UX Polish

### U-01 · Keyboard navigation gaps 🟠
**Issues:**
- `HeatmapCalendar.tsx` — no keyboard navigation through cells
- `PoPGlobe.tsx` — no keyboard alternative to mouse hover/click on PoP markers
- Divs with `onKeyDown` acting as buttons (must be `<button>` elements for native keyboard support)
- Icon-only buttons use `title` not `aria-label`

**Fix:** 
- Replace div-buttons with `<button>` elements
- Add `aria-label` to all icon-only buttons
- Add keyboard nav to HeatmapCalendar (arrow keys, Enter/Space to select)
- Add a text-based PoP status list as an accessible alternative to the globe

### U-02 · Color contrast failures 🟠
**Issue:** `--proof-text-muted` (#4e6285) against dark surfaces likely fails WCAG AA (4.5:1 for normal text).
**Fix:** Run all color pairs through a contrast checker. Adjust token values in `index.css` to meet AA. Add automated contrast checks to CI.

### U-03 · No mobile responsiveness 🟠
**Issue:** The app is designed for widescreen. Grid layouts break at <768px. No responsive breakpoints exist.
**Fix:** Add Tailwind responsive prefixes (`md:`, `lg:`) to grid containers. Collapse the sidebar to a drawer on mobile. Make charts fluid.

### U-04 · No light/dark mode 🟡
**Issue:** The app is hardcoded dark. Many enterprise environments prefer light mode; some accessibility needs require it.
**Fix:** Move all color tokens to CSS `prefers-color-scheme` media query variants. Add a toggle button that also sets `localStorage.setItem("aware_theme", ...)`.

### U-05 · No skip navigation link 🟡
**Fix:** Add `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>` as the first element in `App.tsx`.

### U-06 · Route change announcements for screen readers 🟡
**Issue:** Single-page route changes are silent to screen readers.
**Fix:** Use an ARIA live region to announce route changes: `<div aria-live="polite" aria-atomic="true">` updated on route change.

### U-07 · Progressive disclosure on Dashboard 🟡
**Issue:** Dashboard currently tries to show everything (KPIs, health grid, trend chart, anomalies, recent runs). This violates the principle that a dashboard should answer "is everything OK?" at a glance, with details one click away.
**Fix:** Restructure Dashboard into three tiers:
1. **Hero row:** Single health status + critical alert count
2. **KPI row:** 4 key numbers
3. **Detail row:** Collapsible sections (env health, trend, recent runs)

---

## Phase 6 — Future Architecture (10-year horizon)

### F-01 · Migrate from static data branch to proper API 🔴
**Current:** Static JSON on GitHub raw CDN  
**Target:** A lightweight API server (can remain on Replit) that:
- Accepts test result writes from CI via authenticated POST
- Serves paginated, filterable read endpoints
- Indexes data in the existing Drizzle/PostgreSQL schema (already stubbed in `lib/db`)
- Keeps the static JSON as a fallback/export format

This is the single most impactful architectural change. It unlocks pagination (A-03), security (S-03), multi-tenancy (F-06), and real-time updates (F-02).

### F-02 · Real-time updates via WebSocket/SSE 🟠
**Current:** Data is stale until the user refreshes  
**Target:** When a CI run completes and posts results to the API (F-01), push an SSE event to all connected dashboard instances. The dashboard live-updates without a refresh. Implement with a simple `/api/stream` endpoint using Server-Sent Events.

### F-03 · Plugin system for custom test runners 🟠
**Current:** Playwright, pytest, Puppeteer are hardcoded  
**Target:** A `runner-plugin` interface that any team can implement to add a new test runner type. The config YAML gains a `runner: custom` field, and the scheduler resolves the runner from a plugin registry. This is how you grow from "Akamai CDN tests" to "any infrastructure test."

### F-04 · Multi-tenancy 🟠
**Current:** Single-tenant — one GitHub repo, one Akamai property  
**Target:** The API layer (F-01) supports multiple properties/organizations. Each has its own data namespace. Access control is enforced per-property. The UI gains a property selector. This is how AWARE becomes a product rather than a single team's tool.

### F-05 · AI Copilot via server proxy with memory 🟠
**Current:** Stateless client-side LLM calls  
**Target (building on S-01):**
- Server-side proxy enables model switching without client deploys
- Persistent conversation history stored in the database (not localStorage)
- Conversation context auto-enriched with the user's current page/run context
- Tool calls execute server-side, with access to full historical data (not just what's loaded in the browser)
- Support for organization-level AI configuration (model, temperature, system prompt)

### F-06 · Feature flag system 🟡
**Current:** Features are either compiled in or not  
**Target:** A lightweight feature flag system (`src/lib/flags.ts`) backed by a JSON config file (in-repo for simplicity, or a flag service for more control). This enables:
- Gradual rollouts of new UI
- A/B testing of dashboard layouts
- Disabling unstable features in production without a deploy

### F-07 · Observability & telemetry 🟡
**Current:** Zero visibility into how the tool is used  
**Target:**
- Error tracking: Sentry (browser SDK, no PII)
- Usage analytics: Privacy-preserving event tracking (Plausible or self-hosted)
- Performance monitoring: Web Vitals reporting to the API
- AI usage tracking: Token consumption per user/session for quota management

### F-08 · Automated dependency hygiene 🟡
**Current:** Dependencies are updated manually, if at all  
**Target:** Renovate bot configured with:
- Weekly patch/minor updates, batched into one PR
- Major updates as individual PRs with changelogs
- Security updates as immediate PRs
- `pnpm audit` gate in CI

---

## Implementation Sequence

```
WEEK 1-2:    Phase 0 (Security) — non-negotiable, blocks all else
WEEK 3-5:    Phase 1 A-01..A-05 (Architecture core)
WEEK 6-8:    Phase 2 Q-01..Q-04 (Code quality sweep)
WEEK 9-10:   Phase 3 P-01..P-04 (Performance)
WEEK 11-12:  Phase 4 D-01..D-04 (DX & testing)
WEEK 13-14:  Phase 5 U-01..U-05 (Accessibility & UX)
QUARTER 2+:  Phase 6 (Future architecture)
```

---

## Issue Count by Category

| Category | Count | Priority |
|----------|-------|----------|
| Security | 5 | P0 — fix now |
| Architecture | 7 | P1 — blocks growth |
| Code quality | 7 | P1 — compounds daily |
| Performance | 6 | P1 — user-facing |
| DX & Testing | 6 | P2 — team velocity |
| Accessibility | 7 | P2 — legal risk |
| Future-proofing | 8 | P3 — strategic |
| **Total** | **46 root causes → 110+ symptoms** | |

---

## What "10-year future-proof" means here

1. **Data can grow 100x** without touching the frontend (API + pagination)
2. **Team can grow 10x** without architecture confusion (one state system, clear patterns, Storybook)
3. **AI layer can evolve** without redeployment (server proxy, model-agnostic interface)
4. **New test runner types** can be added by any team (plugin system)
5. **Security doesn't degrade** as features are added (CSP, validated inputs, server-proxied secrets)
6. **Accessibility is systematic**, not bolt-on (enforced in CI via axe-playwright)
7. **Performance stays fast** as content grows (virtual scrolling, lazy data, skeletons)
8. **Dependencies stay healthy** automatically (Renovate, audit gates in CI)

# PROOF — State-of-the-Art Upgrade Plan

> A holistic blueprint for transforming PROOF from a useful internal tool into a
> category-defining, viral CDN observability platform.

---

## 0. The Honest Baseline

| Area | Current state | Gap |
|------|--------------|-----|
| Data | Static JSON seed, localStorage | No persistence across devices, no collaboration |
| Real-time | None — full reload required | CI runs happen in seconds; UI is always stale |
| Design | GCP clone aesthetic | Looks derivative; no brand identity |
| AI | Single chat with no memory | No actionable automation, no proactive insight |
| Shareability | Zero — everything is local | Nothing to go viral with |
| Multi-env | Hard-coded labels | Brittle; breaks for any non-standard stack |
| Tests | Static CRUD | No smart selection, no AI-driven generation from real traffic |
| Performance | No virtualisation | Will break on real datasets (10k+ test results) |

---

## 1. Brand & Identity — "PROOF"

### Problem
The app currently looks like a Google Cloud Console clone. Viral products have their own visual DNA.

### Changes

**1.1 New design language — "Obsidian"**
- Replace the GCP blue-grey palette with a high-contrast dark-first design:
  - Background: `#0d0f14` (near-black)
  - Surface: `#141720` (dark card)
  - Accent: `#5b8af5` (electric blue) — distinct from GCP `#1a73e8`
  - Pass green: `#22c55e`, Fail red: `#ef4444`, Warn amber: `#f59e0b`
- Typography: Geist (Vercel's font) for UI text, JetBrains Mono for test IDs / code
- Move CSS vars from GCP names (`--gcp-blue`) to brand names (`--proof-accent`, `--proof-surface`)

**1.2 Logo & wordmark**
- Custom SVG logo: a waveform that resolves into a checkmark — represents "CDN traffic proving correctness"
- Animated loading state on first paint (Lottie, ~1.2s)

**1.3 Public landing page (`/home`)**
- Hero section with live animated CDN globe (Three.js Points geometry, ~300 PoP dots)
- "Live stats" ticker showing anonymised aggregate pass rates from opted-in workspaces
- One-click GitHub sign-in → instant demo environment pre-loaded with synthetic data

---

## 2. Architecture — Event-Driven, Real-Time First

### Problem
The entire data layer is static JSON + localStorage. Real regression runs finish in seconds; the UI is always behind.

### Changes

**2.1 Backend: Replace REST polling with Server-Sent Events (SSE)**

```
GitHub Actions webhook  →  api-server  →  SSE stream  →  React (EventSource)
```

- `POST /webhooks/github` receives `workflow_run` and `check_run` events
- Server emits typed SSE events: `run.started`, `run.progress`, `run.completed`, `run.failed`
- Client subscribes with `useRunStream(runId)` hook — live progress bar, no polling

**2.2 Database: PostgreSQL → live schema**

Current Drizzle schema is unused. Activate it fully:

```
Table: workspaces      (id, slug, name, github_org, created_at)
Table: runs            (id, workspace_id, target, env, status, pass_pct, …, started_at, finished_at)
Table: test_results    (id, run_id, test_id, status, duration_ms, error, assertions jsonb)
Table: test_cases      (id, workspace_id, suite_id, name, script jsonb, …)
Table: annotations     (id, run_id, test_result_id, user_id, body, created_at)
Table: promotion_gates (id, workspace_id, rule jsonb, applies_to text[])
```

- Drizzle migrations run automatically on deploy
- All reads/writes go through the generated API client (already scaffolded in `lib/api-client-react`)
- localStorage stays only as an **offline cache** + optimistic update buffer

**2.3 Auth: Replit Auth / Clerk**

- Add workspace-level RBAC: `Owner`, `Engineer`, `Viewer`
- Personal access tokens for GitHub Actions → API integration (stored as hashed secrets in DB)
- Public "share link" tokens for read-only run reports (no auth required)

**2.4 Plugin system for CDN vendors**

```ts
interface CdnPlugin {
  vendor: "akamai" | "cloudflare" | "fastly" | "custom";
  parseHeaders(headers: Record<string, string>): CdnHeaderAnalysis;
  suggestCacheRule(analysis: CdnHeaderAnalysis): string;
  getPopLabel(ip: string): string;
}
```

- Plugins live in `lib/cdn-plugins/` — zero changes to core when adding Fastly support
- Each plugin registers header keys, cache logic, and a PoP resolver
- Dashboard switches panel labels and column names based on detected vendor

**2.5 Edge deployment**

- Move the API server to Cloudflare Workers (or keep Replit + add `@cloudflare/workers-types` shim)
- Static assets: Vite build → GitHub Pages / Cloudflare Pages (already configured)
- Webhooks: move to a dedicated durable queue (Cloudflare Queues or Upstash QStash) so no webhook is ever dropped

---

## 3. UX Architecture — Command-First, Zero Friction

### Problem
Most actions require 3–5 clicks. Power users are slow. The app can't be demoed in 30 seconds.

### Changes

**3.1 Universal Command Palette (extend current ⌘K)**

Current palette is navigation-only. Extend to:
- `> run full suite` — triggers GitHub Actions dispatch immediately
- `> compare last 2 runs` — opens Compare with pre-filled selections
- `> promote build <id>` — one-command approval workflow
- `> explain failure <test>` — opens Copilot with context pre-loaded
- `> share run <id>` — copies public shareable URL to clipboard
- Fuzzy search across test names, run IDs, error messages (use Fuse.js, already an easy add)

**3.2 Keyboard-native navigation**

- `J`/`K` to move between runs in the list (like GitHub Issues)
- `Space` to expand a run inline (no page navigation)
- `E` to open evidence panel
- `A`/`B` to toggle Approve/Block on focused run
- Arrow keys in charts to step between data points

**3.3 Progressive disclosure**

- Dashboard cards are collapsed summaries — click to expand inline, not navigate away
- Run list uses virtual infinite scroll (TanStack Virtual) — handles 100k rows
- Test result table renders 10 rows by default; user explicitly loads more

**3.4 Notification centre (extend current bell)**

- Real-time toast when any run in your workspace completes (via SSE)
- Notification drawer: history of alerts, last 30 days
- One-click "Mute this suite for 24h" directly from the notification

---

## 4. Dashboard — From Report to Mission Control

### Problem
Current dashboard is a static summary. "Viral" dashboards feel alive — numbers move, alerts pop, trends are obvious at a glance.

### Changes

**4.1 Live pass-rate ticker**

- Top of dashboard: animated count-up when a run finishes (`96% → 100%` animates over 800ms)
- Inline sparklines on each KPI card (Recharts `<Sparkline>`)

**4.2 Heatmap calendar panel**

- Full-year GitHub-style contribution heatmap of daily pass rate
- Green = 100%, gradient through amber → red = failures
- Click any day to filter all panels to that date

**4.3 Regression funnel**

- Sankey diagram: `All tests → Executed → Passed → Promoted`
- Shows the bottleneck instantly
- Built with Recharts `<SankeyChart>` (recharts v2.9+ supports it natively)

**4.4 PoP globe**

- Small Three.js globe in the sidebar/hero showing active CDN Points of Presence
- Dots pulse when a test runs through that PoP
- Click a dot to filter the run list to that geography

**4.5 Anomaly detection callout**

- Auto-compare last run vs 7-day rolling average per test
- If any test is > 2 standard deviations slower → show "⚡ Latency anomaly" banner above the chart
- Computed entirely client-side with a simple z-score (no ML required)

---

## 5. AI Copilot — From Chat to Autonomous Agent

### Problem
Current Copilot is a chat box that generates YAML. Great start, but not differentiated.

### Changes

**5.1 Skill registry**

Replace ad-hoc prompt engineering with named, versioned skill objects:

```ts
interface CopilotSkill {
  id: string;
  trigger: RegExp | ((msg: string) => boolean);
  systemPrompt: string;
  buildContext: (state: AppState) => string;
  onResult: (result: string) => CopilotAction;
}
```

Current skills to formalise:
- `generate-test` — YAML from description
- `explain-diff` — root cause of regression
- `suggest-promotion` — approve/block recommendation with reasoning
- `write-edge-worker` — Akamai EdgeWorker boilerplate from test failure

New skills to add:
- `predict-flaky` — "This test has flipped 3 times in 5 runs. Likely flaky due to timing. Suggested fix: …"
- `cluster-failures` — Groups failures by shared error message, surfaces systemic issues vs one-offs
- `write-runbook` — Generates a Confluence-ready runbook from a set of test cases

**5.2 Context injection**

Every Copilot message automatically includes:
- Last 3 run summaries (compressed)
- Current diff rows (regressions / fixes)
- Promotion gate rules
- Active env config

User never has to paste logs — Copilot already knows.

**5.3 Inline suggestions**

- On the Run Detail page, next to each FAIL result: small "✨ Ask Copilot" button
- Opens Copilot with that test's evidence (request/response/assertions) pre-loaded
- One click, zero copy-paste

**5.4 Agentic mode**

- User can say: "Fix the CDN cache headers failing test and open a PR"
- Copilot: reads the failing assertion, generates the diff, calls GitHub API to open a PR
- Requires a GitHub PAT scoped to the repo (stored in workspace settings)

---

## 6. Test Authoring — Visual-First, Not YAML-First

### Problem
Writing test YAML by hand or via chat is a power-user workflow. Viral tools are accessible to non-engineers.

### Changes

**6.1 Visual test builder**

- Drag-and-drop steps: Request → Assert Header → Assert Status → Assert Body
- Each step is a form, not raw YAML
- "Export to YAML" button for engineers who want the raw script
- Built as a React flow canvas using `@xyflow/react` (React Flow)

**6.2 Record from HAR**

- Paste a HAR file (exported from browser DevTools)
- Parser extracts URLs, headers, response shapes
- Auto-generates test cases for every CDN-relevant request (Cache-Control, X-Cache, Age headers detected automatically)

**6.3 AI-assisted assertion generation**

- User inputs a URL, clicks "Inspect"
- App fetches the URL (via proxy in api-server), shows the raw response
- Copilot suggests assertions: "I see `X-Cache: HIT` — add assertion that cache is always warm after first request"

**6.4 Test coverage map**

- Grid view of all CDN URLs in your spec
- Color-coded by test coverage: green = tested, amber = partial, red = untested
- "Fill gaps" button opens Copilot pre-prompted to generate tests for uncovered paths

---

## 7. Collaboration — Team-Native

### Problem
Everything is single-user. Viral B2B tools spread through teams, not individuals.

### Changes

**7.1 Annotations on runs**

- Any user can add a comment to any run, test result, or diff row
- Comments render inline in the UI (like GitHub PR review comments)
- `@mention` a teammate → sends a notification

**7.2 Promotion workflow**

- Gate: a run cannot be promoted unless N engineers have approved (configurable)
- UI shows pending approvals inline on the Dashboard
- Approvals are signed with the user's session and stored in `promotion_gates` table

**7.3 Shared dashboards**

- Any dashboard view (filters, date range, env selection) can be saved as a named view
- Shared via URL: `proof.app/dashboard?view=pre-launch-checklist`
- Views are workspace-scoped — team members all see the same numbers

**7.4 Slack / Teams bot**

- `/proof status` — posts current pass rate and last run summary
- `/proof promote <run-id>` — triggers approval workflow from Slack
- Alerts: when pass rate drops below workspace threshold, bot posts automatically

---

## 8. Shareability & Viral Mechanics

### Problem
Nothing in the app is currently shareable. Viral products spread because users share artifacts.

### Changes

**8.1 Public run reports**

- Every completed run gets a shareable URL: `proof.app/r/<runId>?token=<shareToken>`
- Read-only, beautiful one-page report:
  - Pass rate gauge
  - Regression / fixed summary
  - Per-test results table
  - "Powered by PROOF" badge that links to the product page

**8.2 CDN Health Score badge**

- `proof.app/badge/<workspace>/<suite>.svg` — a live SVG badge
- Embed in GitHub README: `![CDN Health](https://proof.app/badge/my-org/suite_full.svg)`
- Shows real-time pass rate and status colour
- Every repo that embeds this is a referral

**8.3 Leaderboard (opt-in)**

- Workspaces can opt into the public leaderboard
- Ranks CDN stability by suite type and target env
- "Your suite is in the top 12% of Akamai CDN setups this month"
- Shareable card (like Spotify Wrapped) — generates a PNG via HTML canvas

**8.8 Open-source test suite templates**

- GitHub repo: `proof-cdntests/templates`
- Community-maintained test suites for: Akamai, Cloudflare, Fastly, AWS CloudFront
- `import from template` button in Suite Manager pulls directly from the repo via GitHub raw API

---

## 9. Performance & Reliability

**9.1 Virtualised data tables (TanStack Virtual)**
- Current: DOM renders every row — breaks at ~500 rows
- Fix: `useVirtualizer` for Runs list, Test Results table, Test Manager list
- Target: smooth 60fps scroll with 100,000 rows

**9.2 Stale-while-revalidate everywhere**
- Use TanStack Query `staleTime: 30_000` + `gcTime: 300_000`
- Seed Query cache from localStorage on first load → instant paint, then hydrate from API
- Offline mode: app is fully usable with cached data, shows "Offline — showing last sync" banner

**9.3 Bundle splitting**
- Copilot page: lazy-load LLM SDK (currently bundled into main chunk)
- Desktop/noVNC: loaded only when navigating to `/desktop`
- Google Charts: dynamic import — saves ~180kb from initial load
- Target: LCP < 1.2s on a 4G connection

**9.4 Optimistic UI**
- Approve/Block actions: update local state immediately, sync to API in background
- New run trigger: show a "starting…" spinner run card immediately, replace with real data on SSE event
- Test case save: instant visual feedback, rollback on API error

**9.5 Error boundaries per panel**
- Each dashboard panel wrapped in `<ErrorBoundary>` with a retry button
- A chart data error never crashes the whole page (fixes the current axis error behaviour)
- Error state shows: "This panel couldn't load — [Retry] [Report issue]"

---

## 10. Developer Experience

**10.1 CLI: `proof-runner`**

```bash
npx proof-runner --suite suite_full --env production --report
```

- Runs your test suite locally, posts results to the API, opens the dashboard to the result
- Zero config if `PROOF_TOKEN` env var is set
- Written as a standalone npm package that references `lib/api-spec`

**10.2 GitHub Action**

```yaml
- uses: proof-cdntests/action@v1
  with:
    suite: suite_full
    env: production
    token: ${{ secrets.PROOF_TOKEN }}
    fail-on-regression: true
```

- Published to GitHub Marketplace
- Every star/install is organic marketing

**10.3 OpenAPI spec as the contract**

- `lib/api-spec` already exists — keep it as the single source of truth
- Orval regenerates `lib/api-client-react` on every schema change (`pnpm codegen`)
- No manual API client maintenance ever

**10.4 Storybook for components**

- All `aware/` components documented in Storybook
- Deployed to `proof.app/storybook` — contribution friendly
- Makes open-source contributors productive immediately

---

## 11. Phased Delivery

| Phase | Scope | Key outcome |
|-------|-------|-------------|
| **P1 — Polish** (1–2 weeks) | Obsidian design system, error boundaries, virtualised tables, bundle splitting | App feels production-grade |
| **P2 — Real-time** (2–3 weeks) | SSE live run updates, DB persistence, Auth | Multi-user, no stale data |
| **P3 — Collaboration** (2–3 weeks) | Annotations, approval workflow, Slack bot, shared views | Spreads through teams |
| **P4 — Shareability** (1–2 weeks) | Public run reports, SVG badge, leaderboard card | Organic marketing flywheel |
| **P5 — AI Agent** (2–3 weeks) | Skill registry, inline suggestions, GitHub PR automation | Category-defining feature |
| **P6 — Ecosystem** (ongoing) | CLI, GitHub Action, template library, Storybook | Developer community |

---

## 12. The Viral Loop

```
Engineer runs a test suite
  → Run fails → Copilot explains why in one click
    → Engineer shares the run report link in a Slack thread
      → Teammate opens the link → sees the beautiful read-only report
        → "What is this?" → clicks "Powered by PROOF"
          → Signs up → connects their GitHub repo
            → Embeds the CDN Health badge in their README
              → Another engineer sees the badge → clicks it
                → Loop repeats
```

The badge is the primary viral vector. It puts PROOF in every CDN-tested GitHub repository's README, permanently.

---

## Appendix A — File-level change map

| File / directory | Change type | Phase |
|-----------------|-------------|-------|
| `artifacts/aware-app/src/index.css` | Replace GCP vars with Obsidian vars | P1 |
| `artifacts/aware-app/src/components/aware/AppLayout.tsx` | Dark sidebar, new logo | P1 |
| `artifacts/aware-app/src/pages/Dashboard.tsx` | Heatmap, sparklines, anomaly banner | P1 |
| `artifacts/aware-app/src/lib/runs.ts` | Connect to API client, drop static seed | P2 |
| `artifacts/api-server/src/index.ts` | Add SSE endpoint, webhook handler | P2 |
| `lib/db/schema.ts` | Full schema activation | P2 |
| `artifacts/aware-app/src/pages/Copilot.tsx` | Skill registry, context injection | P5 |
| `artifacts/aware-app/src/pages/TestManager.tsx` | Visual test builder (React Flow) | P3 |
| NEW `packages/proof-runner/` | CLI package | P6 |
| NEW `packages/proof-action/` | GitHub Action | P6 |
| NEW `artifacts/aware-app/src/pages/Share.tsx` | Public run report page | P4 |
| NEW `artifacts/aware-app/src/components/aware/Globe.tsx` | Three.js PoP globe | P1 |
| NEW `lib/cdn-plugins/` | Vendor plugin interface + Akamai impl | P2 |

---

## Appendix B — Tech additions

| Package | Purpose | Replaces |
|---------|---------|---------|
| `@xyflow/react` | Visual test builder canvas | Manual YAML |
| `@tanstack/react-virtual` | Virtualised lists | DOM rendering all rows |
| `three` + `@react-three/fiber` | PoP globe | Static map image |
| `fuse.js` | Fuzzy search in command palette | Exact string match |
| `framer-motion` | Micro-animations, transitions | CSS transitions only |
| `lottie-react` | Loading animations | Spinner |
| `geist` | Brand typography | System font |
| `recharts` (expand) | Sparklines, Sankey, Heatmap | Google Charts for everything |

---

*Last updated: June 9, 2026 — PROOF Architecture Working Document*

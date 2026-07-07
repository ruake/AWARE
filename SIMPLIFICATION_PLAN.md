# A.W.A.R.E. Radical Simplification Plan

> **Goal:** Strip the dashboard down to the three things that matter — see env health, drill into a run's tests, and diff two runs side-by-side — using a tiny, boring stack anyone can read in an afternoon.

---

## 1. What the User Actually Needs

| # | Requirement | Current complexity |
|---|---|---|
| 1 | Minimalistic dashboard — pass-rate per QA / UAT / PROD | 193-line Dashboard + 432-line DashboardGrid + 2,951-line AI analyzer |
| 2 | Runs list per env, click → run detail with test list | 556-line Runs + 612-line RunDetail + 1,141-line RunsPanel sidebar |
| 3 | Compare two runs at test-detail level | 422-line Compare + 1,255-line CompareSidePanel |

Everything else (Copilot AI, 3D globe, flakiness heatmaps, test library, CI pipeline page, onboarding wizard, command palette, notification bell, tour, sharing, settings, filmstrip viewer, LangGraph, Zustand store, SWR-style data fetcher) is **out of scope** for these three requirements.

---

## 2. Current vs. Target Metrics

| Metric | Current | Target | Reduction |
|---|---|---|---|
| Source files | ~284 | ~20 | −93 % |
| Total lines of code | ~30,000 + | ~1,500 | −95 % |
| React components | 146 | ~10 | −93 % |
| npm dependencies | 52 | ~10 | −81 % |
| Routes | 11 | 4 | −64 % |
| Data-layer files | ~18 | 1 | −94 % |

---

## 3. Stack Decision

### Keep (already present, zero install cost)

| Tool | Why keep |
|---|---|
| **React 19 + Vite 7** | Instant HMR, JSX, no build ceremony |
| **Tailwind CSS 4** | Utility classes eliminate all component CSS files |
| **wouter** | 1.5 KB router, already used, handles `:runId` param |
| **lucide-react** | Icon-per-import, tree-shaken to nearly nothing |
| **recharts** | Already present; one `<BarChart>` on the Dashboard, nothing else |

### Remove entirely

| Package | Reason |
|---|---|
| `three` / `@react-three/fiber` / `@react-three/drei` | 3D PoP globe — not needed |
| `framer-motion` | All animations — not needed for minimalistic UI |
| `zustand` | Replace with `useState` + `useEffect` directly in pages |
| `fuse.js` | Replace with one-line `str.toLowerCase().includes(q)` |
| `react-google-charts` | Keep only recharts (already present) |
| `@mlc-ai/web-llm` / LangGraph / Chrome AI | Entire Copilot stack |
| `puppeteer-core` | CI only, not app runtime |
| All `@types/*` for removed packages | |

---

## 4. File Structure (target)

```
artifacts/aware-app/src/
├── main.tsx                    # Vite entry
├── App.tsx                     # Router (4 routes, no DataGate)
│
├── lib/
│   ├── types.ts                # Run, TestResult interfaces only (~60 lines)
│   └── data.ts                 # fetch runs.json + test-results.json (~80 lines)
│
├── pages/
│   ├── Dashboard.tsx           # 3 env tiles + recent runs table (~150 lines)
│   ├── Runs.tsx                # Filterable runs table + link to detail (~120 lines)
│   ├── RunDetail.tsx           # Test list for one run (~100 lines)
│   └── Compare.tsx             # Pick 2 runs → test diff table (~150 lines)
│
└── components/
    ├── Layout.tsx              # Topbar + nav links + <main> slot (~80 lines)
    ├── RunRow.tsx              # Single row in any runs table (~30 lines)
    ├── TestRow.tsx             # Single row in a test list (~30 lines)
    ├── StatusBadge.tsx         # PASS / FAIL / PARTIAL pill (~20 lines)
    └── EnvTile.tsx             # QA / UAT / PROD health card (~40 lines)
```

**Total: ~20 files, ~860 lines of application code.**  
Data files (`runs.json`, `test-results.json`) stay exactly as-is.

---

## 5. Data Layer (radical simplification)

### Current (18 files, pub-sub store, memoized caches, SWR pipeline)
```
dataFetcher.ts → fetchPipeline.ts → fetchDecorators.ts → initData.ts
  → runs.ts (pub-sub, memoized) → store.ts → filterStore.ts → dataService.ts
```

### Target (1 file, two plain `fetch` calls)
```typescript
// lib/data.ts — the entire data layer
export async function loadRuns(): Promise<Run[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/runs.json`);
  return res.json();
}

export async function loadResults(runId: string): Promise<TestResult[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/test-results.json`);
  const all: Record<string, TestResult[]> = await res.json();
  return all[runId] ?? [];
}
```

Each page calls these directly in a `useEffect` with a local `useState`. No global store. No subscriptions. No memoization layer. Browser cache handles repeat fetches.

---

## 6. Page Designs

### 6.1 Dashboard (`/`)

```
┌──────────────────────────────────────────────────────────┐
│  QA                UAT               PROD                │
│  ██ 97.2 %  PASS   ██ 94.8 %  WARN   ██ 99.1 %  PASS    │
│  12 runs · 2h ago  8 runs · 4h ago   5 runs · 1h ago    │
└──────────────────────────────────────────────────────────┘
  Recent runs (all envs, last 10)
  ┌─ run_id ─── env ─── suite ─── pass% ─── started ─── status ─┐
  │  ...                                                          │
  └───────────────────────────────────────────────────────────────┘
```

- 3 `<EnvTile>` cards at top (QA / UAT / PROD)
- Computed from `runs.json` with `useMemo`: latest run per env, avg pass rate
- Table of last 10 runs across all envs
- **No charts on dashboard** — numbers are enough

### 6.2 Runs (`/runs`)

```
Filter: [All envs ▼]  [Search run ID / build...]

  run_id      env   suite              pass%   failures  started         status
  ──────────────────────────────────────────────────────────────────────────────
  run_obsidian PROD  full_regression   99.1%   2         2026-07-05 …    PASS
  run_amber    UAT   smoke             94.8%   8         2026-07-05 …    PARTIAL
  …
```

- Env filter dropdown (QA / UAT / PROD / All)
- Plain text search on id, suite, build
- Click row → `/runs/:runId`

### 6.3 Run Detail (`/runs/:runId`)

```
← Runs   run_obsidian · PROD · full_regression · 99.1 % · 2026-07-05

  name                       category    status   duration
  ─────────────────────────────────────────────────────────
  [SEC] TLS Redirect Check   Security    PASS     142 ms
  [SEC] HSTS Header          Security    PASS     98 ms
  [PERF] TTFB < 200ms        Performance FAIL     310 ms   ← red row
  …
```

- Back link, run metadata header
- Table of all `TestResult` rows for the run
- FAIL rows highlighted in red/amber
- Click a FAIL row → expand inline to show `evidence.assertions` detail

### 6.4 Compare (`/compare`)

```
Baseline  [run_obsidian ▼]    Candidate  [run_amber ▼]    [Compare]

  name                    baseline   candidate   delta   change
  ──────────────────────────────────────────────────────────────
  [SEC] TLS Redirect      PASS       PASS        —       —
  [PERF] TTFB < 200ms     PASS       FAIL        +168ms  ⬇ REGRESSED
  [SEC] Cache-Control     FAIL       PASS        —       ✓ FIXED
  …
```

- Two `<select>` dropdowns populated from `runs.json`
- Diff computed with `useMemo` over the two result arrays — no separate `computeDiffRows` service
- Color coding: green = fixed, red = regressed, grey = unchanged
- Change summary at top: `2 regressions · 1 fixed · 38 unchanged`

---

## 7. Types (slim down from 601 lines to ~60)

```typescript
// The only types the app needs
export type RunStatus = 'PASS' | 'FAIL' | 'PARTIAL' | 'RUNNING';

export interface Run {
  id: string;
  label: string;
  suiteId: string;
  env: 'QA' | 'UAT' | 'PROD';
  status: RunStatus;
  passPct: number;
  failures: number;
  durationMs: number;
  started: string;    // ISO 8601
  build: string;
}

export interface TestResult {
  id: string;
  runId: string;
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;   // ms
  category: string;
  suite: string;
  evidence?: {
    assertions?: { label: string; pass: boolean; actual?: string }[];
  };
}
```

The existing `runs.json` and `test-results.json` are supersets of these fields — no data migration needed.

---

## 8. Component Inventory (target ~10)

| Component | Lines | Purpose |
|---|---|---|
| `Layout.tsx` | ~80 | Shell: topbar with logo + 4 nav links + `<main>` |
| `EnvTile.tsx` | ~40 | QA/UAT/PROD health card |
| `RunRow.tsx` | ~30 | Row in any runs table (used on Dashboard + Runs) |
| `TestRow.tsx` | ~30 | Row in a test results table (used on RunDetail + Compare) |
| `StatusBadge.tsx` | ~20 | `PASS` / `FAIL` / `PARTIAL` colored pill |
| `EnvSelect.tsx` | ~20 | Reusable env filter `<select>` |
| (inline page JSX) | — | Dashboard, Runs, RunDetail, Compare — no extra wrappers |

---

## 9. Routes (target 4)

| Route | Page | Notes |
|---|---|---|
| `/` | Dashboard | env tiles + recent runs |
| `/runs` | Runs | filterable list |
| `/runs/:runId` | RunDetail | test table for one run |
| `/compare` | Compare | pick 2 runs, see diff |

Routes to **delete**: `/trends`, `/tests`, `/copilot`, `/settings`, `/about`, `/start`, `/share`

---

## 10. What Gets Deleted

### Pages (7 deleted, 4 kept)
`TestAnalytics.tsx`, `Tests.tsx`, `Copilot.tsx`, `Settings.tsx`, `About.tsx`, `StartRun.tsx`, `Sharing.tsx`

### Components (136 deleted, ~10 kept)
Everything in `components/aware/`, `components/console/`, `components/copilot/` except the ~5 we rewrite fresh.

### Lib files (17 deleted, 2 kept)
`dataFetcher.ts`, `fetchPipeline.ts`, `fetchDecorators.ts`, `initData.ts`, `runs.ts`, `runsLoader.ts`, `testCases.ts`, `testSuites.ts`, `store.ts`, `filterStore.ts`, `dataService.ts`, `suiteTree.ts`, `ciConfig.ts`, `envConfig.ts`, `promotions.ts`, `incidents.ts`, `memo.ts`, `stateMachine.ts`, `helpRegistry.ts`, `skills.ts`, `llm.ts`, `providers.ts`, `filters.ts`, and all `lib/ai/` and `lib/copilot/` directories.

### Dependencies removed (~42 packages)
`three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`, `zustand`, `fuse.js`, `react-google-charts`, `@mlc-ai/web-llm`, `puppeteer-core`, plus all associated `@types/*` and AI/LangGraph packages.

---

## 11. Implementation Order

Each step is independently shippable and leaves the app in a working state.

### Phase 1 — New skeleton (Day 1)
1. Create fresh `lib/types.ts` (60 lines)
2. Create fresh `lib/data.ts` (80 lines)
3. Create 5 shared components (`Layout`, `StatusBadge`, `EnvTile`, `RunRow`, `TestRow`)
4. Create 4 pages (Dashboard, Runs, RunDetail, Compare) with new data layer
5. Wire `App.tsx` with 4 routes + `Layout` shell
6. Verify all 4 pages work against existing `runs.json` / `test-results.json`

### Phase 2 — Prune (Day 1–2)
7. Delete all old pages
8. Delete all old components (aware/, console/, copilot/)
9. Delete all old lib files
10. Remove unused npm dependencies from `package.json`
11. Run `pnpm install` + `pnpm typecheck` + `pnpm build`

### Phase 3 — Polish (Day 2)
12. Verify filter/search on Runs page
13. Verify inline evidence expansion on RunDetail
14. Verify compare diff correctness across 3 run pairs
15. Smoke-test on mobile viewport (Tailwind responsive)

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `test-results.json` is large (all runs in one file) | Load once, cache in module-level `let cache`; browser handles the rest |
| Some run IDs have no test-results entry | Guard with `?? []`, show "No test data for this run" |
| Compare needs both result sets loaded | Fetch both in parallel with `Promise.all` |
| Existing `runs.json` has extra fields the new types ignore | TypeScript `interface` is structural; extra fields are ignored safely |

---

## 13. What This Is NOT

This plan intentionally excludes features that are out-of-scope for the stated requirements:

- ❌ AI Copilot / LangGraph / Chrome AI
- ❌ 3D Akamai PoP globe
- ❌ Flakiness / anomaly detection
- ❌ Test suite manager
- ❌ CI pipeline trigger UI
- ❌ Promotion gate configuration
- ❌ Sharing / collaboration
- ❌ Onboarding wizard / tour
- ❌ Command palette (⌘K)
- ❌ Dark/light theme toggle
- ❌ Filmstrip / screenshot viewer
- ❌ Auto-refresh / scheduler

Any of these can be re-added as isolated files after the skeleton is solid, without touching the core.

---

## 14. Success Criteria

- [ ] `pnpm --filter @workspace/aware-app run dev` starts with no errors
- [ ] Dashboard loads and shows QA / UAT / PROD tiles with pass rates
- [ ] Runs page lists all runs, env filter works, search works
- [ ] Clicking a run opens RunDetail with full test list
- [ ] Compare page: select two runs → table shows REGRESSED / FIXED / UNCHANGED per test
- [ ] `pnpm run typecheck` passes with 0 errors
- [ ] `pnpm run build` produces a clean dist
- [ ] Total source files ≤ 25
- [ ] Zero `three`, `framer-motion`, `zustand`, or AI packages in the final bundle

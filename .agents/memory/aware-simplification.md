---
name: AWARE radical simplification
description: Records the post-simplification architecture — what was kept, deleted, and the new file layout
---

## What happened
The entire app was rewritten from scratch by a 10-agent parallel team.
284 source files → 12. ~30,000 lines → 721. 52 deps → ~10.

## New file layout (complete)
```
src/
  App.tsx                     — 4 routes only (/, /runs, /runs/:runId, /compare)
  main.tsx                    — unchanged entry
  lib/types.ts                — Run + TestResult interfaces + RunStatus/Env types only
  lib/data.ts                 — loadRuns(), loadResults(runId), loadAllResults() with module cache
  components/Layout.tsx       — sticky topbar + 3 nav links + <main>
  components/StatusBadge.tsx  — PASS/FAIL/PARTIAL/RUNNING colored pill
  components/EnvTile.tsx      — QA/UAT/PROD health card linking to /runs?env=X
  components/RunRow.tsx       — <tr> for any runs table
  pages/Dashboard.tsx         — 3 EnvTiles + recent 10 runs table
  pages/Runs.tsx              — env filter + text search + RunRow table
  pages/RunDetail.tsx         — test list + inline expandable assertions
  pages/Compare.tsx           — 2 run selects + computeDiff → REGRESSED/FIXED/UNCHANGED table
```

## What was deleted
- All components/aware/ (88 files), components/console/ (28), components/copilot/ (29)
- All lib/ai/, lib/copilot/, lib/anomaly/, lib/hooks/ subdirectories
- All old lib utility files (zustand store, pub-sub, SWR pipeline, ciConfig, envConfig, etc.)
- Pages: TestAnalytics, Tests, Copilot, Settings, About, StartRun, Sharing, NotFound
- All src/hooks/ directory

## Removed npm packages
three, @react-three/fiber, @react-three/drei, framer-motion, zustand, fuse.js,
@tanstack/react-query, puppeteer-core, prism-react-renderer, @tanstack/react-virtual,
@types/three, @types/dom-chromium-ai

## Kept packages
react, react-dom, wouter, recharts, lucide-react, tailwindcss, date-fns, clsx, tailwind-merge, vite, typescript, all @replit/* packages

## Key patterns
- Data loading: plain fetch() + module-level `let cache` variables in lib/data.ts
- No global store — each page does useEffect(() => loadRuns().then(...), [])
- Styling: Tailwind 4 dark theme (zinc-950/900/800 backgrounds, emerald/red/amber for status)
- Diff logic: inline useMemo in Compare.tsx, no separate service

**Why:** User requested minimalistic dashboard — env health, runs list, run detail, compare — no AI/analytics/suites.

## Build stats (post-simplification)
- 51 modules transformed, 2.59s build
- Largest page chunk: RunDetail 5.34 kB gzip 1.63 kB
- Vendor bundle: 190 kB gzip 60 kB (React + wouter)
- TypeScript: 0 errors

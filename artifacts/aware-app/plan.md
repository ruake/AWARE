# A.W.A.R.E. — Engineering Sprint Plan

**Goal:** No new features. Raise the bar on animation quality, eliminate every duplication, and harden stability + scalability.

---

## Wave 1 — Foundation (Main Agent)

| # | Task | File(s) |
|---|------|---------|
| W1-A | Install **Framer Motion** | `package.json` |
| W1-B | Add `relativeTime()` + `fmtDuration()` to shared utils | `src/lib/utils.ts` |
| W1-C | Create `src/lib/envStyles.ts` — single source of env badge styles | `src/lib/envStyles.ts` *(new)* |
| W1-D | Create `src/lib/motion.ts` — all Framer Motion shared variants | `src/lib/motion.ts` *(new)* |
| W1-E | Create `src/components/LoadingSpinner.tsx` — unified animated spinner | `src/components/LoadingSpinner.tsx` *(new)* |
| W1-F | Fix `sortData()` rules-of-hooks bug in `sortableTable.tsx` | `src/lib/sortableTable.tsx` |

---

## Wave 2 — Parallel Team (20 specialists)

| # | Specialist | File | Deliverable |
|---|-----------|------|-------------|
| T001 | Motion Engineer | `Layout.tsx` | `layoutId` spring nav indicator, header entrance |
| T002 | Motion Engineer | `Dashboard.tsx` | KPI card + env tile stagger entrance |
| T003 | Refactor Engineer | `RunRow.tsx` | Dedup helpers, progress bar animate |
| T004 | Refactor Engineer | `EnvTile.tsx` | Dedup helpers, tile hover lift, progress animate |
| T005 | Motion Engineer | `StatusBadge.tsx` | Badge fade-in, RUNNING pulse |
| T006 | Motion Engineer | `App.tsx` | `AnimatePresence` page transitions, unified spinner |
| T007 | Refactor + Motion | `Compare.tsx` | Dedup `envColor`, dropdown slide, diff row stagger |
| T008 | Refactor + Motion | `RunDetail.tsx` | Dedup `ENV_STYLE`, collapsible height animate |
| T009 | Motion Engineer | `Runs.tsx` | Filter bar entrance, row stagger, unified spinner |
| T010 | Component Engineer | `PageWrapper.tsx` *(new)* | Shared page entrance motion wrapper |
| T011 | Component Engineer | `SectionHeader.tsx` | Slide-in entrance |
| T012 | Component Engineer | `CTAStatCard.tsx` | Scale-in + hover lift |
| T013 | Stability Engineer | `ErrorBoundary.tsx` | Styled fallback UI, wrap all routes |
| T014 | Component Engineer | `YamlPreview.tsx` + `Markdown.tsx` | Fade-in wrappers |
| T015 | CSS Engineer | `index.css` | `prefers-reduced-motion`, scroll-behavior, GPU hints |
| T016 | Stability Engineer | `lib/data.ts` + `dataFetcher.ts` | Try/catch + retry logic |
| T017 | Perf Engineer | `hooks/useTestData.ts` | useMemo / useCallback audit |
| T018 | Motion Engineer | `TestAnalytics.tsx` | Chart entrance, unified spinner |
| T019 | Refactor Engineer | `lib/sortableTable.tsx` | Rules-of-hooks fix, stable accessors |
| T020 | QA Engineer | All changed files | Import path audit, TypeScript coherence |

---

## Done Criteria

- [ ] `framer-motion` in `package.json`
- [ ] `relativeTime()` only in `utils.ts` — zero duplicates
- [ ] `ENV_STYLE` / `envColor` only in `envStyles.ts` — zero duplicates
- [ ] `<LoadingSpinner>` — single component, used everywhere
- [ ] `sortData()` hook bug fixed
- [ ] All pages enter with motion
- [ ] Nav indicator slides with `layoutId` spring
- [ ] `StatusBadge` RUNNING pulses
- [ ] `CollapsibleSection` height animates
- [ ] Progress bars animate on mount
- [ ] Dropdowns animate open/close
- [ ] `prefers-reduced-motion` respected globally
- [ ] `ErrorBoundary` wraps every route
- [ ] Fetch failures degrade gracefully

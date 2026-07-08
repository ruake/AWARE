# AWARE App Tasks

## ✅ Completed

### Performance (10 Parallel Agents)
| # | Task | Status |
|---|------|--------|
| 1 | runs.ts — snapshot caching, single-pass O(n) aggregation, downsampling 365pt | ✅ |
| 2 | data.ts — microtask-batched notifications, skip re-fetch if loaded | ✅ |
| 3 | Runs.tsx — debounced search (300ms), `useDeferredValue`, `useTransition` | ✅ |
| 4 | RunDetail.tsx — debounced search, `React.memo` on panels, `useTransition` | ✅ |
| 5 | Dashboard.tsx — `useDeferredValue`, `React.memo` on KpiCard + EnvTile | ✅ |
| 6 | Compare.tsx — `React.memo` on DiffPanel/AssertionBlock, `useTransition` | ✅ |
| 7 | React.memo — RunRow, EnvTile, StatusBadge, SectionHeader | ✅ |
| 8 | TestAnalytics.tsx — full memo pass, debounce, `useDeferredValue`, chart splitting | ✅ |
| 9 | App.tsx + initData + dataFetcher — lazy loading verified, parallel `Promise.allSettled`, 10s timeout, cache + retry | ✅ |
| 10 | runs.ts chart exports — downsampling 365pts, Map lookup cache, single-pass aggregation | ✅ |

### Sortable Table Headers (Google Charts Style)
| File | Sort Toggle | Inline Column Filters |
|------|------------|----------------------|
| Dashboard.tsx | ✅ Click header to sort asc/desc | ✅ Run/Label, Env, Suite |
| Runs.tsx | ✅ Click header to sort | ✅ Run/Label, Env, Suite |
| RunDetail.tsx | ✅ Click header to sort | ✅ Name, Category |
| Compare.tsx | ✅ Click header to sort | ✅ Name, Category, Change |

### Evidence Panel
| Feature | Status |
|---------|--------|
| Collapsible request/response headers with scroll (`max-h-64 overflow-y-auto`) | ✅ |
| Cookies display (parses `Set-Cookie` header) | ✅ |
| Timings bar chart | ✅ |

### Compare Page
| Feature | Status |
|---------|--------|
| CompositeSelect (env badge + label + date columns) | ✅ |
| CTA stat cards toggle change filter (click Regressions/Fixed/Unchanged/New) | ✅ |

### TypeScript
| Check | Status |
|-------|--------|
| `pnpm run typecheck` — 0 errors | ✅ |

### Data Loading
| Feature | Status |
|---------|--------|
| `dataFetcher.ts` — in-memory cache (60s TTL), 2 retries with backoff, 8s AbortController timeout | ✅ |
| `initData.ts` — parallel `Promise.allSettled`, 10s timeout guard, per-call error handling | ✅ |

## 🟡 Remaining
| # | Task | Priority |
|---|------|----------|
| 11 | Run `pnpm test` — vitest unit tests | 🟡 Medium |
| 12 | Run `pnpm run build` — full build with prebuild validation | 🟡 Medium |
| 13 | Run `pnpm verify` — full CI pre-check | 🔴 High |
| 14 | Populate data files with real httpbin test results | 🔴 High |

# Agent Memory

- [AWARE project overview](aware-overview.md) — pnpm monorepo, React 19 + Vite 7 + Tailwind CSS 4; dev runs via `PORT=5000 pnpm --filter @workspace/aware-app run dev`
- [Test suite facts](aware-tests.md) — 421 tests across 34 files; vitest 4.1.9; SWR cache in dataFetcher requires `clearFetchCache()` in beforeEach; memoized `computeDiffRows` requires `.clear()` in beforeEach; CSS vars not hex for colors
- [Anomaly math constraints](aware-anomaly-math.md) — Z-score for single outlier among n identical values = sqrt(n-1); need n≥6 for Z>2, n≥11 for Z>3; IQR detection + stddev zScore is intentional (different purposes)
- [Architecture fixes applied](aware-arch-fixes.md) — durSlowdown is signed (not abs); PROMOTION_GATE_THRESHOLD exported in CiConfig.promotionGate; RUNNER_MAP explicit for all testTypes; IQR severity uses excessRatio not zScore

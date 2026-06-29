# Agent Memory

- [AWARE project overview](aware-overview.md) — pnpm monorepo, React 19 + Vite 7 + Tailwind CSS 4; dev runs via `PORT=5000 pnpm --filter @workspace/aware-app run dev`
- [Test suite facts](aware-tests.md) — 410 tests across 35 files; vitest 4.1.9; SWR cache in dataFetcher requires `clearFetchCache()` in beforeEach; memoized `computeDiffRows` requires `.clear()` in beforeEach; CSS vars not hex for colors

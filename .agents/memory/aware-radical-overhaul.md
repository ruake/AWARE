---
name: AWARE radical overhaul
description: Security, architecture, performance, DX, and accessibility changes applied across two sessions. Key decisions and conventions for future work.
---

## Security
- AI calls are proxied via a Vite server middleware at `/api/ai/chat` — `OPENAI_API_KEY` never ships to the browser. See `vite.config.ts` aiProxy plugin.
- `dangerouslySetInnerHTML` is gone from `Markdown.tsx`; replaced with a `ColorCell` React component that renders safe DOM.
- CSP meta tag added to `index.html`; skip-nav link present for keyboard users.
- Token bucket rate limiter at `src/lib/rateLimit.ts` (10 req/min) guards the AI proxy.

## Architecture
- `runs.ts`, `store.ts`, `filters.ts` migrated to Zustand vanilla stores (`zustand/vanilla` `createStore`). Zustand 5.0.14 in `dependencies` of aware-app, NOT workspace catalog.
- Data loading is a 3-phase waterfall (runs → suites → results) in `initData.ts`; `runsReady` flag controls DataGate progressive unlock.
- `fetchJson` in `dataFetcher.ts` accepts an optional `validate` callback for runtime shape checking; `DataValidationError` class exported for callers.
- `VITE_DATA_REPO_OWNER`, `VITE_DATA_REPO_NAME`, `VITE_DATA_BRANCH` env vars configure the data source; `dataUrl()` helper switches between GitHub raw and local `/data/`.

## Component splits
- `TierCard` + interfaces (`TierEnv`, `TierGroup`) + `statusConfig` + `TrendBadge` extracted to `src/components/aware/TierCard.tsx`.
- `RunRibbonCard` extracted to `src/components/aware/RunRibbonCard.tsx`.
- Both exported from `src/components/aware/index.ts`.
- `Dashboard.tsx` went from 737 → ~430 lines after split; retains only `ChartTip` inline (tightly coupled to the recharts chart).

## Dead code removal
- `Pulse.tsx`, `PulseFeed.tsx`, `PulseFilterBar.tsx`, `PulseDetail.tsx` deleted. `/pulse` route still exists in App.tsx as a `<Redirect to="/runs" />` for old bookmarks.
- `react-google-charts` removed from package.json; Google Charts component deleted.

## Accessibility
- `TierCard` converted from `<div role="button">` to `<button type="button">` with `appearance: none`, `textAlign: left`, `padding: 0`, `width: 100%` resets.
- `RunHistoryDots` dot elements converted from `<div role="button">` to `<button type="button">` with same reset pattern.
- `HeroKpiCard` and `RunRibbonCard` still use conditional `role={onClick ? "button" : undefined}` div pattern (acceptable when onClick is optional).
- `RouteAnnouncer` component (aria-live polite) in App.tsx for screen reader navigation announcements.
- Skip nav link in `index.html` targeting `#main-content`.

## Performance
- Route-level lazy loading via `React.lazy()` for all page components in App.tsx.
- Three.js PoPGlobe pauses via `IntersectionObserver` + `frameloop="demand"` when off-screen.
- `WebLLMWarning.tsx` dialog warns before triggering large model downloads.

**Why:** These are architectural constraints, not just style choices — future work on any of these subsystems must keep consistent with the patterns documented here.

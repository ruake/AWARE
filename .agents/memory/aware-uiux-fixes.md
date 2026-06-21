---
name: AWARE UI/UX fix pass
description: Comprehensive audit pass that fixed 17+ components across dashboard, tests, runs, and charts.
---

## Summary
A full UI/UX audit pass covering every page and component layer. Zero TypeScript errors maintained throughout.

## Fixes applied

### Chart/data components
- **SparkLine**: handles 0/1-pt data (flat dashed line), all-same-value gracefully
- **TrendChart**: sorted history before charting, Legend added, left margin -16, axis 10px, rolling avg dashed line, mono font for stats
- **MarkdownChart**: all 7 hardcoded hex colors → CSS vars; `isAnimationActive={false}` everywhere; shared margin constant; Legend added for multi-series
- **StatsDashboard**: replaced `#5b8af5` with `var(--proof-blue)`; per-status bar colors; empty-state for all charts; donut hole on pie
- **PassRateHeatmap**: hardcoded `rgba(34,197,94,…)` → CSS vars; fail cells get diagonal stripe pattern (colorblind friendly); 18px cells
- **CategoryHeatmap**: `rgba(34,197,94,…)` / `rgba(239,68,68,…)` → CSS vars
- **HeatmapCalendar**: `rgba(91,138,245,…)` → CSS vars (`--proof-blue-bg`, `--proof-blue`)

### Badge/status
- **StatusBadge**: PENDING→proof-badge-pending (not skip); WARNING→proof-badge-warning; TIMEOUT, CANCELLED, DISABLED variants; normalized display labels
- **index.css**: added `.proof-badge-warning` and `.proof-badge-pending` (with pulse animation) classes

### Table components
- **TestList**: sortable columns (ID, Name, Category, Priority, Status, Owner); sort icons with active state; keyboard a11y (`tabIndex=0`, `onKeyDown`); improved empty state message; font bumped to 12.5px for names; owner falls back to "—"
- **FlakinessTable**: already had sortable columns — no changes needed

### Run/status components
- **RunHistoryDots**: 10px dots; square (border-radius 2px) for FAIL, circle for PASS (colorblind distinction); pass rate shown in title tooltip; opacity 0.8 → 1 on hover
- **AnomalyBanner**: `AlertCircle` for critical, `AlertTriangle` for warning; `ArrowRight` on button; description line for critical regressions; dismiss button with proper hover state; `aria-live="assertive"`
- **RunRibbonCard**: label fontSize 9.5px → 11px, color from muted → secondary; "Next due" label shows "Scheduled" or "Queued" depending on future/past timestamp

### Filter UX
- **TestFilters**: "Clear filters" button (appears when any filter active); active filters highlighted with `--proof-blue-border`; count text turns blue when filtered; "Category" label (was "Cat"); search clear button; "Search tests…" ellipsis

### KPI cards
- **HeroKpiCard**: sparkline shown when `sparkData.length >= 1` (was `>= 2`)

### Data layer
- **constants.ts**: all `CATEGORY_COLORS` hex → CSS vars; `TAG_COLORS` map → CSS vars; `TEST_TAGS` → CSS vars
- **testColors.ts**: all `PRI_BGS`, `TYPE_BGS`, `CAT_BGS`, `STATUS_BGS` hardcoded `rgba()` → CSS var equivalents

## Why
All hardcoded hex/rgba colors break in light mode (they're tuned for dark). CSS vars automatically adapt between dark and light themes. Sortable tables, accessible badges, and clear-filter UX are standard usability expectations.

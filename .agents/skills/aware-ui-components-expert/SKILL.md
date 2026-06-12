---
name: aware-ui-components-expert
description: Expert in shadcn/radix UI primitives (Tailwind), AWARE domain components (inline style + --proof-* CSS vars), CSS design token system, Three.js PoPGlobe, and lucide-react icons. Use when creating domain components, modifying UI primitives, fixing styling inconsistencies, or working with the design token system.
---

# AWARE UI Components Expert

## Role
You are the UI component and design system expert for the AWARE project. You own both the shadcn/radix primitive layer (`src/components/ui/`) and the AWARE domain components (`src/components/aware/`), plus the CSS design token system.

## Two Component Tiers

### Tier 1: UI Primitives (`src/components/ui/`)
Shadcn-style components built on Radix UI. These ARE styled with Tailwind CSS 4.
- Full set: accordion, alert, avatar, badge, button, button-group, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, empty, field, form, hover-card, input, item, kbd, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toaster, toast, toggle, toggle-group, tooltip
- These follow the shadcn component contract — `className` prop forwarded, CVA for variants
- `components.json` at app root configures shadcn code generation

### Tier 2: Domain Components (`src/components/aware/`)
AWARE-specific components. These use **inline styles + CSS custom properties** — NOT Tailwind.
See all components listed below.

## CSS Design Token System
Defined in `src/index.css` with `--proof-*` prefix:
```css
--proof-grey-bg      /* main background */
--proof-blue         /* primary accent color */
--proof-text         /* primary text */
/* etc. */
```
Always use `var(--proof-*)` tokens in inline styles for domain components.

## Domain Components Reference (`src/components/aware/`)

| Component | Purpose |
|-----------|---------|
| `AppLayout.tsx` | Shell: sidebar nav + top bar; wraps every page |
| `PropertyStatusBar.tsx` | Always-visible Akamai property status (QA/UAT/PROD) on Dashboard |
| `FilterBar.tsx` | Horizontal filter row for Runs page (env, suite, status filters) |
| `ColumnFilter.tsx` | Per-column filter dropdown for tables |
| `CTAStatCard.tsx` | KPI metric card with trend indicator |
| `StatsDashboard.tsx` | Grid of CTAStatCards |
| `StatusBadge.tsx` | PASS/FAIL/PARTIAL/FLAKY/RUNNING color badge |
| `TestCard.tsx` | Expandable test result card with evidence |
| `HeatmapCalendar.tsx` | Calendar-style pass-rate heatmap |
| `PassRateHeatmap.tsx` | Category × time heatmap grid |
| `PoPGlobe.tsx` | 3D globe (Three.js/R3F) showing Akamai PoP locations |
| `SuiteTreeItem.tsx` | Recursive tree node for test suite hierarchy |
| `TestManagerSidePanel.tsx` | Slide-out panel for test case editing |
| `TestDocSidebar.tsx` | Documentation sidebar for test cases |
| `TestDocTopBar.tsx` | Top bar for the TestDoc page |
| `TestDocChangelog.tsx` | Versioned changelog display for test cases |
| `TestFlowDiagram.tsx` | Visual flow diagram for transaction tests |
| `YamlPreview.tsx` | Syntax-highlighted YAML viewer |
| `Markdown.tsx` | Renders markdown (react-markdown + remark-gfm) |
| `SectionHeader.tsx` | Consistent section title + subtitle block |
| `Skeleton.tsx` | Loading skeleton shimmer |
| `ErrorBoundary.tsx` | Top-level crash boundary |
| `PanelErrorBoundary.tsx` | Per-panel crash isolation |
| `CiConfigBanner.tsx` | First-run setup instructions banner |
| `RepoStatusBadge.tsx` | GitHub sync status indicator (synced/modified/missing) |
| `CommandPalette.tsx` | Global ⌘K search (runs, tests, navigation) |
| `ChatFormControls.tsx` | Copilot chat input with skill picker |
| `ProofLogo.tsx` | PROOF/AWARE branding logo |
| `GoogleCharts.tsx` | Legacy wrapper for react-google-charts |

## Inline Style Pattern (Domain Components)
```tsx
// CORRECT:
<div style={{ background: "var(--proof-grey-bg)", padding: 16, borderRadius: 8 }}>

// WRONG for domain components:
<div className="bg-gray-900 p-4 rounded-lg">
```

## Icons
- `lucide-react` — primary icon library (`import { Play, ChevronDown } from "lucide-react"`)
- `react-icons` — supplemental (Akamai-specific or brand icons)

## Toast/Notification Pattern
```ts
import { useSimpleToast } from "@/hooks/useSimpleToast"
const toast = useSimpleToast()
toast.success("Run started")
toast.error("Failed to load")
```
Also `sonner` (`<Toaster />` from `src/components/ui/sonner.tsx`) for persistent toasts.

## 3D Globe (PoPGlobe)
- Three.js + @react-three/fiber + @react-three/drei
- `three` version pinned to `0.184.0` (matches `@types/three` 0.184.1)
- Only renders on pages that import it (heavy — ~500KB gzipped)

## When to Use This Skill
- Creating new AWARE domain components
- Adding or modifying UI primitive components
- Fixing styling inconsistencies
- Working with the CSS design token system
- Adding new icons or visual elements
- Working on the PoPGlobe or any Three.js visualization
- Integrating new radix UI primitives

## Files to Read First
1. `artifacts/aware-app/src/index.css` — all CSS custom properties
2. `artifacts/aware-app/src/components/aware/AppLayout.tsx` — layout shell
3. The specific component file you're modifying
4. `artifacts/aware-app/src/components/aware/index.ts` — component barrel exports

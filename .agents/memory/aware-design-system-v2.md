---
name: AWARE design system v2
description: Design token decisions, shell layout, and page-level conventions from the radical v2 redesign.
---

# AWARE Design System v2

## Why
Full UI/UX redesign applying Nielsen, Shneiderman "Overview first", Few "Information Dashboard Design", and Tufte data-ink ratio principles. User explicitly requested Ralph Loop methodology / autonomous redesign.

## Key constraints
- **No Tailwind utilities in page JSX** — all styling via inline `style={}` + CSS vars + small set of CSS classes (`.proof-card`, `.proof-button`, `.proof-button-primary`, `.proof-badge-*`, etc.)
- **CSS var prefix stays `--proof-*`** — intentional design token prefix, not a brand reference
- Theme toggle writes `"dark"/"light"` to `localStorage("proof-theme")` and toggles `.light` class on `<html>`

## Shell layout
- Topbar: 56px, `var(--proof-console-topbar-height)`, fixed; gradient logo (blue→cyan); backdrop-blur
- Sidebar: 224px expanded / 54px collapsed; hover-expand pattern; pill-shaped active state (no left border); 3px left accent dot; group label headers in mono 9.5px
- **ConsoleShell.tsx**: `marginTop: "var(--proof-console-topbar-height)"` — do NOT hardcode 52px
- Breadcrumbs: 32px, surface bg, / separator

## Dark palette (`:root`)
- Background: `#09090b` (zinc-950)
- Surface: `#111113`
- Border: `rgba(255,255,255,0.07)`
- Text: `#fafafa` / secondary `#a1a1aa` / muted `#52525b`

## Light palette (`.light`)
- Background: `#f8fafc` (slate-50)
- Surface: `#ffffff`
- Border: `rgba(15,23,42,0.08)`
- Text: `#0f172a` / secondary `#475569` / muted `#94a3b8`

## Page conventions
- All pages use `animation: "page-enter 0.22s ease-out both"` on their root div
- KPI cards: 20px padding, 32px mono number, 10.5px uppercase label, icon in color-mix bg
- Section headers: 3px left accent bar + 13.5px bold title + subtle count badge
- Env health grid: 3-col grid with `color-mix` ring hover accent
- Filter bars: surface bg, 12px border-radius, search icon + select chain

## How to apply
- When adding new pages: follow the KPI-card + section-header + data-table pattern
- Sidebar icon names must exist in `ICON_MAP` inside `ConsoleSidebar.tsx`
- Card radius is 14px for main cards (`borderRadius: 14`), 12px for KPI strip cards, 10px for small utility panels

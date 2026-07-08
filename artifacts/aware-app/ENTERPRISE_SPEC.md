# Enterprise Design Spec — AWARE PROOF

## Guiding principle
This is an **observability dashboard** for CDN testing. Reference: Grafana, Linear, Datadog, GitHub.
All decisions serve: scannability, density, consistency, accessibility. Zero decoration.

## Color
- Primary: `var(--proof-blue)` (#4285F4) — active states, links, primary buttons
- Pass: `var(--proof-green)` (#34A853)
- Fail: `var(--proof-red)` (#EA4335)
- Warn: `var(--proof-yellow)` (#FBBC05)
- Text: `var(--proof-text)` → `var(--proof-text-secondary)` → `var(--proof-text-muted)` → `var(--proof-text-tertiary)`
- Surface: `var(--proof-bg)` → `var(--proof-surface)` → `var(--proof-surface-2)` → `var(--proof-elevated)`
- Border: `var(--proof-border)` → `var(--proof-border-strong)`

## Typography
- UI headings/body: `var(--font-sans)`
- Data/code/IDs: `var(--font-mono)` with `font-variant-numeric: tabular-nums`
- Scale: 10px(meta) → 12px(small) → 13px(body) → 14px(large body) → 16px(subtitle) → 20px(title) → 24px(page title)

## Spacing (16px grid)
- Page padding: 24px desktop / 16px mobile
- Card padding: 16px inside / 16px gap between
- Section gap: 24px
- Table cells: 12px 16px
- Button padding: 0 16px, height 32px
- Input padding: 8px 12px

## Surface system
- Page bg: `var(--proof-bg)`
- Card/panel: `var(--proof-surface)` + 1px `var(--proof-border)` + 8px radius
- Elevated (dropdowns): `var(--proof-surface-2)` + `var(--proof-border-strong)`
- Glass: ONLY for overlays/dropdowns, use `var(--proof-glass)` class

## Animation
- Duration: 150-200ms max
- Easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (standard ease-out)
- NO spring/bounce physics
- NO scale/rotate animations on cards
- Only: fadeIn, fadeUp (10px), hover bg changes
- Page transitions: 200ms fade + 6px slide

## Component patterns

### StatusBadge
```
[●] PASS    — green dot + green text, no bg, no border, no glow
[●] FAIL    — red dot + red text
[●] PARTIAL — yellow dot + yellow text
[●] RUNNING — blue dot + blue text, dot pulses
[●] PENDING — grey dot + grey text
```
Size: sm=10px mono, md=12px mono. Dot = 6px (md) / 4px (sm).

### EnvBadge (use envBadgeClass)
```
QA   — yellow bg(15%) + yellow border(25%) + yellow text
UAT  — blue bg(15%) + blue border(25%) + blue text
PROD — green bg(15%) + green border(25%) + green text
```
Size: 10px mono bold, rounded-md, inline-flex.

### Buttons
- Primary: blue bg, white text, 32px h, 6px r, 13px medium
- Ghost: transparent, text color, hover bg change
- Both: 150ms ease bg transition, cursor pointer

### Tables
- Full width, clean header row (surface bg, 11px uppercase tracking, medium weight, secondary text)
- Body: 13px, border between rows
- Hover: row bg changes to elevated
- No alternating colors
- SortHeader: clickable, shows direction arrow on active

### Paginator
- Previous 1 2 3 … 10 Next
- Active: blue bg
- Compact, 28px button height
- No glow, no border radius tricks

### Cards
- Surface bg, border, 8px radius, 16px padding
- No "glass" card effect (glass is for overlays only)
- Hover: bg → surface-2, no lift/translate

### Loading
- Centered spinner (20px, 2px border)
- Optional label below
- Page-level: overlay + spinner
- Section-level: inline spinner

### Empty state
- Icon (36px, in circle bg), message, optional action
- Consistent across all pages

## Page layout
```
┌─ Header (48px, bg, bottom border) ──────────────────┐
│  Logo   Nav items          Theme toggle  Version    │
├─────────────────────────────────────────────────────┤
│  Page content (24px padding, max 1400px)            │
│  ┌─ Section ──────────────────────────────────────┐ │
│  │  Content blocks with 16-24px gaps               │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

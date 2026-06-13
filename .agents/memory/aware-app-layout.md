---
name: AWARE AppLayout fullBleed prop
description: AppLayout supports a fullBleed prop for pages that need full-viewport control (no padding, overflow hidden).
---

# AppLayout `fullBleed` Prop

## The Rule
`AppLayout` accepts `fullBleed?: boolean`. When true, the inner `<main>` element gets `padding: 0` and `overflow: hidden` instead of `padding: 20px 24px` and `overflow: auto`.

**Why:** The default main padding (20px 24px) and auto-overflow are correct for content pages, but full-bleed pages like Copilot manage their own internal layout and scroll. Without `fullBleed`, a `height: calc(100vh - 54px)` container inside the padded main overflows the viewport.

**How to apply:**
- Use `<AppLayout fullBleed>` for pages that render a flex column filling the full available height (Copilot, any future fullscreen panel).
- Use `<AppLayout>` (no prop) for all normal content pages — they get padding and vertical scroll for free.
- Inside a `fullBleed` page, set the root container to `height: "100%"` (not `calc(100vh - Xpx)`).

## Layout math (for reference)
- Header: 54px
- Main top + bottom padding (non-fullBleed): 20px + 20px = 40px
- Available height for non-fullBleed content: `calc(100vh - 94px)`
- Available height for fullBleed content: `calc(100vh - 54px)` = `100%` of the main container

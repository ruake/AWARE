---
name: AWARE branding audit
description: App was renamed from PROOF → A.W.A.R.E.; CSS prefix proof- is intentional design token prefix, not brand.
---

## Rule
All user-visible text says "A.W.A.R.E." (or "Akamai Web Analytics Regression Engine"). The CSS class/variable prefix `proof-` (e.g. `proof-card`, `--proof-text`, `proof-button`) is a design system namespace — do NOT rename it.

## Why
The product was formerly called PROOF (Pipeline for Regression Observation and Output Framework). It was renamed to A.W.A.R.E. The CSS prefix was left as `proof-` to avoid a massive mechanical rename of thousands of style references. This is intentional and permanent.

## Files updated in branding pass
- Pages: `About.tsx`, `Status.tsx`, `Home.tsx`, `Dashboard.tsx`, `RunDetail.tsx`, `StartRun.tsx`, `Copilot.tsx`
- Components: `CiConfigBanner.tsx`, `CommandPalette.tsx`
- AI/lib: `src/lib/ai/context.ts`, `src/lib/skills.ts`
- Data: `data/scheduler-status.json` (field name mismatch fix, not brand)

## GitHub URLs
Changed `github.com/ruake/PROOF/...` → `github.com/ruake/AWARE/...` across all pages.

---
name: AWARE motion & refactor sprint
description: Key decisions and gotchas from the framer-motion + dedup sprint on the AWARE app
---

## Framer Motion setup
- Installed as `framer-motion` in `artifacts/aware-app` devDependencies
- Shared variants live in `artifacts/aware-app/src/lib/motion.ts` — import from there, never inline
- Shared env badge/select/status classes in `artifacts/aware-app/src/lib/envStyles.ts`
- Unified spinner: `artifacts/aware-app/src/components/LoadingSpinner.tsx`
- `PageWrapper` component (`src/components/PageWrapper.tsx`) wraps every page for consistent entrance

## Wouter v3 nested-anchor bug
**Why:** `<Link href="..."><a className="...">` creates nested `<a>` tags — invalid HTML, React warning, hydration error.
**How to apply:** In wouter v3, `Link` itself renders as `<a>`. Pass `className` directly to `<Link>`, never wrap with inner `<a>`.
Correct: `<Link href="..." className="...">content</Link>`
Wrong: `<Link href="..."><a className="...">content</a></Link>`

## sortableTable.tsx hook fix
`sortData()` was calling `useMemo()` inside a plain function (rules-of-hooks violation). Fixed by:
- Renaming to `useSortData` (proper hook)
- Exporting alias `sortData = useSortData` for backward compat
- Extracting pure `sortItems()` for non-hook contexts

## AnimatePresence page transitions
- In App.tsx, key AnimatePresence on `basePath` (first segment of loc), not full loc — avoids re-mounting on query param changes
- `basePath = '/' + (loc.split('/')[1] || '')`

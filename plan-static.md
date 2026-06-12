# PROOF — Static Site Upgrade Plan

> Static SPA on GitHub Pages. Data from JSON seed files + CI-generated commits.

---

## P0 — Prune (cut waste immediately)

| Item | Reason |
|------|--------|
| Three.js PoP globe | Zero decision value, 400KB+ bundle bloat |
| Lottie loading animation | Visible for milliseconds, dev time better spent |
| React Flow visual test builder | Historically failed products; power users prefer text |
| CDN plugin system | Premature; no second vendor exists yet |

---

## P1 — Foundation (high ROI, low effort)

### 1.1 Obsidian design system
- Replace GCP CSS variable names (`--gcp-*` → `--proof-*`)
- Dark-first palette: `#0d0f14` bg, `#141720` surface, `#5b8af5` accent
- Typography: system UI font, JetBrains Mono for mono
- Custom SVG favicon/logo

### 1.2 Error boundaries per panel
- Every chart and data panel gets `<ErrorBoundary>` with retry button
- Prevents a chart crash from taking down the whole page
- Add skeleton loading states for all data-dependent panels

### 1.3 Bundle splitting
- Lazy load: LLM SDK (Copilot page), Google Charts, noVNC
- Target: LCP < 1.2s

---

## P2 — Power User Velocity (client-side only)

### 2.1 Universal Command Palette
- Extend current Cmd+K beyond navigation
- Commands: `> compare last 2 runs`, `> explain failure <test>`, `> share run <id>`
- Fuzzy search across test names, run IDs, error messages (Fuse.js)

### 2.2 Keyboard navigation
- `J`/`K` move between list items
- `Space` expand inline
- `E` open evidence panel
- `A`/`B` approve/block

### 2.3 Progressive disclosure
- Virtual scroll for all lists (TanStack Virtual, target 10k+ rows)
- Test result table: 10 rows default, "load more" button

---

## P3 — Intelligence (client-side computation)

### 3.1 Anomaly detection
- Auto-compare last run vs 7-run rolling average per test
- If any test > 2 std deviations slower → "⚡ Latency anomaly" banner
- Pure client-side z-score computation on seed data

### 3.2 Heatmap calendar
- GitHub-style contribution grid of daily pass rate
- Green = 100%, gradient through amber → red = failures
- Click a day to filter panels

### 3.3 Smart alerts (visual only)
- Highlight tests where pass rate dropped below configurable threshold
- Inline indicators on dashboard, not push notifications

---

## P4 — Shareability (build-time generated)

### 4.1 CDN Health Score SVG badge
- Generated during `pnpm build` from latest run data
- `public/badge.svg` — embedded in GitHub READMEs
- Shows pass rate + status color, auto-updates on each deploy

### 4.2 Static shareable run reports
- Each run gets a dedicated static page generated at build time
- `public/r/<runId>/index.html` — self-contained, no JS required to view
- "Powered by PROOF" badge + CTA link

---

## P5 — AI Copilot (client-side LLM)

### 5.1 Skill registry refactor
- Formalize `CopilotSkill` interface with:
  - `outputSchema` (Zod) — structured output contracts
  - `requiresHumanReview` — gate dangerous skills
  - `confidenceInterval` — surface uncertainty in UI
- Skills: `explain-diff`, `cluster-failures`, `suggest-promotion`

### 5.2 Context injection
- Every Copilot message auto-includes: last 3 runs, current diffs, promotion gates
- No more copy-pasting logs into chat

### 5.3 Inline suggestion buttons
- Next to each FAIL result: "✨ Ask Copilot" button
- Pre-loads that test's evidence (request/response/assertions)
- One click, zero copy-paste

---

## Phasing

| Phase | Scope | Key outcome |
|-------|-------|-------------|
| **P0** | Prune globe, Lottie, test builder, plugin system | ~600KB removed from bundle, dev focus sharpened |
| **P1** | Obsidian theme, error boundaries, skeletons, bundle splitting | App feels production-grade, doesn't crash |
| **P2** | Cmd+K, keyboard nav, virtual scroll | Power users move 3x faster |
| **P3** | Anomaly detection, heatmap, smart alerts | Dashboard becomes proactive |
| **P4** | SVG badge, static run reports | Viral distribution channel opens |
| **P5** | AI Copilot skills + context injection | Category-defining feature |

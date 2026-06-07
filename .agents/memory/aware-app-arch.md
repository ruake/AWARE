---
name: AWARE app architecture
description: Key architectural constraints for the aware-app artifact to stay consistent across sessions.
---

**Stack:** React 19 + Vite 7, wouter routing, recharts for charts, lucide-react icons.

**Styling:** Inline styles using GCP CSS vars (`var(--gcp-blue)`, `var(--gcp-red)`, etc.) and CSS utility classes (`gcp-card`, `gcp-badge`, `gcp-button`, `gcp-table`, `gcp-input`, `gcp-toast`). Tailwind utility classes only in `_group.css` and `index.css` baseline — never use `className` in page components.

**localStorage keys:** `aware_test_cases_v2`, `aware_test_suites_v2`, `aware_promotion_decisions` (v2 avoids stale data from old schema keys).

**Routing:** `useLocation()` → `[location, navigate]`, `Link href=` for nav links. Never use `<a>` inside `<Link>`.

**Charts:** recharts only (`BarChart`, `LineChart`, `AreaChart`, `ResponsiveContainer`, `Cell`). Do NOT use react-google-charts — not installed.

**Data layer:** All data in `artifacts/aware-app/src/lib/data.ts` with localStorage persistence and a subscription system (`subscribeToTestCases`, `subscribeToTestSuites`). Subscription hook pattern in components via `useEffect`.

**TestCase schema:** CDN-specific model with `predicates`, `filmstrip`, `requestHeaders`, `cookies`, `expectedStatus`, `captureResponseHeaders`. Old wizard fields (testType, config, assertions) are REMOVED. TestWizardModal.tsx is DELETED.

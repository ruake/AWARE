---
name: AWARE app architecture
description: Key architectural constraints for the aware-app artifact to stay consistent across sessions.
---

**Stack:** React 19 + Vite 7, wouter routing, recharts for charts, lucide-react icons.

**Styling:** Inline styles using GCP CSS vars (`var(--gcp-blue)`, `var(--gcp-red)`, etc.) and CSS utility classes (`gcp-card`, `gcp-badge`, `gcp-button`, `gcp-table`, `gcp-input`, `gcp-toast`). NO Tailwind in the main app — Tailwind is only in the mockup-sandbox artifact.

**Why:** The main app was bootstrapped with GCP CSS vars before Tailwind was considered. The mockup-sandbox uses Tailwind for rapid prototyping; ports always need conversion.

**localStorage keys:** `aware_test_cases_v2`, `aware_test_suites_v2`, `aware_promotion_decisions` (v2 avoids stale data from old schema keys).

**Routing:** `useLocation()` → `[location, navigate]`, `Link href=` for nav links. Never use `<a>` inside `<Link>`.

**Charts:** recharts only (`BarChart`, `LineChart`, `AreaChart`, `ResponsiveContainer`, `Cell`). Do NOT use react-google-charts — not installed.

**Data layer:** All data in `artifacts/aware-app/src/lib/data.ts` with localStorage persistence and a subscription system (`subscribeToTestCases`, `subscribeToTestSuites`). Subscription hook pattern in components via `useEffect`.

**TestCase schema:** CDN-specific model with `predicates`, `filmstrip`, `requestHeaders`, `cookies`, `expectedStatus`, `captureResponseHeaders`. Old wizard fields (testType, config, assertions) are REMOVED. TestWizardModal.tsx is DELETED.

---
name: AWARE port decisions
description: Rules for porting mockup-sandbox designs into the aware-app main app.
---

When porting from mockup-sandbox to aware-app:

1. **Tailwind → inline styles:** Every `className="..."` Tailwind class must become a `style={{ ... }}` inline style using GCP CSS vars. Use `var(--gcp-blue)`, `var(--gcp-green)`, `var(--gcp-red)`, `var(--gcp-yellow)`, `var(--gcp-grey)`, `var(--gcp-surface)`, `var(--gcp-grey-bg)`, `var(--gcp-text)`, `var(--gcp-text-secondary)`, `var(--gcp-blue-bg)`, `var(--gcp-green-bg)`, `var(--gcp-red-bg)`, `var(--gcp-yellow-bg)`.

2. **navTo() → wouter:** Mockup uses `navTo(path)`. Main app uses `const [, navigate] = useLocation()` then `navigate(path)`.

3. **react-google-charts → recharts:** Mockup may use `react-google-charts`. Main app uses `recharts` (already installed). Replace `Chart` components with `BarChart`, `LineChart`, `AreaChart`, `ResponsiveContainer`, `Cell`.

4. **In-memory store → localStorage:** Mockup stores data in memory. Main app persists to localStorage via `saveToStorage()` and loads via `loadFromStorage()`.

5. **Component exports:** Each file should only export React components (for Vite Fast Refresh). Move utility functions to separate files (e.g., `lib/utils.ts`) rather than exporting them from component files — otherwise HMR will invalidate the entire component tree.

**Why:** These rules exist because the two environments were set up differently at project inception. The mockup uses Tailwind for speed; the main app uses GCP CSS vars for consistency with a custom GCP-inspired design system.

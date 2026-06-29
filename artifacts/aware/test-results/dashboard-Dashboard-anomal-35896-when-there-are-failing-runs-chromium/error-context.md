# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard >> anomaly banner appears when there are failing runs
- Location: e2e/dashboard.spec.ts:38:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /investigate/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /investigate/i })

```

```yaml
- complementary:
  - text: A A.W.A.R.E.
  - heading "Overview" [level=4]
  - navigation:
    - link "Dashboard":
      - /url: /
    - link "Runs":
      - /url: /runs
  - heading "Analysis" [level=4]
  - navigation:
    - link "Compare":
      - /url: /compare
    - link "Trends":
      - /url: /trends
  - heading "Tools" [level=4]
  - navigation:
    - link "Copilot":
      - /url: /copilot
    - link "Tests":
      - /url: /tests
    - link "Status":
      - /url: /status
  - heading "Config" [level=4]
  - navigation:
    - link "Settings":
      - /url: /settings
- banner:
  - text: Akamai Web Analytics Updated less than a minute ago
  - button "Refresh"
- main:
  - paragraph: Anomaly Detected
  - paragraph:
    - text: Run
    - strong: RUN-1001
    - text: (QA staging) pass rate
    - strong: 80%
    - text: — significantly below 14-day rolling mean (Z < −2.0).
  - link "Investigate Run":
    - /url: /compare?candidate=RUN-1001
  - button "Dismiss"
  - text: Overall Pass Rate (7d) 95%
  - paragraph: 40 runs analysed
  - img
  - text: Total Runs (7d) 40
  - paragraph: across all environments
  - text: Failed Runs (7d) 6
  - paragraph: 15% failure rate
  - text: Active Pipelines 1
  - paragraph: 1 running now
  - heading "Environment Tiers" [level=2]
  - link "View all runs →":
    - /url: /runs
  - text: QA HEALTHY 95% avg pass Staging 95% Production 96% Total Runs 50 UAT HEALTHY 96% avg pass Staging 96% Production 96% Total Runs 50 PROD HEALTHY 96% avg pass Staging 96% Production 96% Total Runs 50 30-Day Pass Rate Trend
  - link "Full analytics →":
    - /url: /trends
  - img: 1 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 60% 70% 80% 90% 100% 95% gate
- text: "PROMOTION GATE: OPEN UAT Pass Rate: 96.2% (Threshold: 95%)"
- region "Notifications (F8)":
  - list
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { goto, waitForApp } from "./helpers";
  3  | 
  4  | test.describe("Dashboard", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await goto(page, "/");
  7  |     await waitForApp(page);
  8  |   });
  9  | 
  10 |   test("renders four KPI cards", async ({ page }) => {
  11 |     await expect(page.getByText(/overall pass rate/i)).toBeVisible();
  12 |     await expect(page.getByText(/total runs/i)).toBeVisible();
  13 |     await expect(page.getByText(/failed runs/i)).toBeVisible();
  14 |     await expect(page.getByText(/active pipeline/i)).toBeVisible();
  15 |   });
  16 | 
  17 |   test("KPI pass rate card shows a percentage", async ({ page }) => {
  18 |     // Should be a number followed by %
  19 |     await expect(page.getByText(/\d+%/).first()).toBeVisible();
  20 |   });
  21 | 
  22 |   test("renders QA, UAT and PROD tier cards", async ({ page }) => {
  23 |     await expect(page.getByText("QA")).toBeVisible();
  24 |     await expect(page.getByText("UAT")).toBeVisible();
  25 |     await expect(page.getByText("PROD")).toBeVisible();
  26 |   });
  27 | 
  28 |   test("each tier card shows avg pass % and network breakdown", async ({ page }) => {
  29 |     await expect(page.getByText(/avg pass/i).first()).toBeVisible();
  30 |     await expect(page.getByText(/staging/i).first()).toBeVisible();
  31 |     await expect(page.getByText(/production/i).first()).toBeVisible();
  32 |   });
  33 | 
  34 |   test("30-day pass rate trend section heading is visible", async ({ page }) => {
  35 |     await expect(page.getByText(/30.day pass rate trend/i)).toBeVisible();
  36 |   });
  37 | 
  38 |   test("anomaly banner appears when there are failing runs", async ({ page }) => {
  39 |     // Mock data has FAIL runs (RUN-1001), so banner should appear
  40 |     const banner = page.getByText(/anomaly detected/i);
  41 |     // May or may not be present depending on Z-score; accept either case
  42 |     const visible = await banner.isVisible().catch(() => false);
  43 |     if (visible) {
> 44 |       await expect(page.getByRole("button", { name: /investigate/i })).toBeVisible();
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  45 |     }
  46 |   });
  47 | 
  48 |   test("refresh button triggers a data reload without crashing", async ({ page }) => {
  49 |     await page.getByRole("button", { name: /refresh/i }).click();
  50 |     // Page should still show KPI cards after refresh
  51 |     await expect(page.getByText(/overall pass rate/i)).toBeVisible();
  52 |   });
  53 | 
  54 |   test("promotion gate status bar shows UAT threshold info", async ({ page }) => {
  55 |     await expect(page.getByText(/promotion gate/i)).toBeVisible();
  56 |     await expect(page.getByText(/95%/)).toBeVisible();
  57 |   });
  58 | });
  59 | 
```
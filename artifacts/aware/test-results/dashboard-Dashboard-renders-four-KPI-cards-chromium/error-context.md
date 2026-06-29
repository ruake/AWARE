# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard >> renders four KPI cards
- Location: e2e/dashboard.spec.ts:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/total runs/i)
Expected: visible
Error: strict mode violation: getByText(/total runs/i) resolved to 4 elements:
    1) <div data-component-name="CardTitle" class="tracking-tight text-sm font-medium text-muted-foreground" data-replit-metadata="artifacts/aware/src/pages/Dashboard.tsx:140:14">Total Runs (7d)</div> aka getByText('Total Runs (7d)')
    2) <span data-component-name="span" class="text-muted-foreground" data-replit-metadata="artifacts/aware/src/pages/Dashboard.tsx:220:22">Total Runs</span> aka getByText('Total Runs').nth(1)
    3) <span data-component-name="span" class="text-muted-foreground" data-replit-metadata="artifacts/aware/src/pages/Dashboard.tsx:220:22">Total Runs</span> aka getByText('Total Runs').nth(2)
    4) <span data-component-name="span" class="text-muted-foreground" data-replit-metadata="artifacts/aware/src/pages/Dashboard.tsx:220:22">Total Runs</span> aka getByText('Total Runs').nth(3)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/total runs/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - complementary [ref=e4]:
        - generic [ref=e5]:
          - generic [ref=e6]: A
          - generic [ref=e7]: A.W.A.R.E.
        - generic [ref=e8]:
          - generic [ref=e9]:
            - heading "Overview" [level=4] [ref=e10]
            - navigation [ref=e11]:
              - link "Dashboard" [ref=e12] [cursor=pointer]:
                - /url: /
                - img [ref=e13]
                - generic [ref=e18]: Dashboard
              - link "Runs" [ref=e19] [cursor=pointer]:
                - /url: /runs
                - img [ref=e20]
                - generic [ref=e24]: Runs
          - generic [ref=e25]:
            - heading "Analysis" [level=4] [ref=e26]
            - navigation [ref=e27]:
              - link "Compare" [ref=e28] [cursor=pointer]:
                - /url: /compare
                - img [ref=e29]
                - generic [ref=e32]: Compare
              - link "Trends" [ref=e33] [cursor=pointer]:
                - /url: /trends
                - img [ref=e34]
                - generic [ref=e37]: Trends
          - generic [ref=e38]:
            - heading "Tools" [level=4] [ref=e39]
            - navigation [ref=e40]:
              - link "Copilot" [ref=e41] [cursor=pointer]:
                - /url: /copilot
                - img [ref=e42]
                - generic [ref=e45]: Copilot
              - link "Tests" [ref=e46] [cursor=pointer]:
                - /url: /tests
                - img [ref=e47]
                - generic [ref=e50]: Tests
              - link "Status" [ref=e51] [cursor=pointer]:
                - /url: /status
                - img [ref=e52]
                - generic [ref=e63]: Status
          - generic [ref=e64]:
            - heading "Config" [level=4] [ref=e65]
            - navigation [ref=e66]:
              - link "Settings" [ref=e67] [cursor=pointer]:
                - /url: /settings
                - img [ref=e68]
                - generic [ref=e71]: Settings
      - generic [ref=e72]:
        - banner [ref=e73]:
          - generic [ref=e75]: Akamai Web Analytics
          - generic [ref=e76]:
            - generic [ref=e77]: Updated less than a minute ago
            - button "Refresh" [ref=e78]:
              - img
              - text: Refresh
        - main [ref=e79]:
          - generic [ref=e81]:
            - generic [ref=e82]:
              - generic [ref=e83]:
                - img [ref=e84]
                - generic [ref=e86]:
                  - paragraph [ref=e87]: Anomaly Detected
                  - paragraph [ref=e88]:
                    - text: Run
                    - strong [ref=e89]: RUN-1001
                    - text: (QA staging) pass rate
                    - strong [ref=e90]: 80%
                    - text: — significantly below 14-day rolling mean (Z < −2.0).
              - generic [ref=e91]:
                - link "Investigate Run" [ref=e92] [cursor=pointer]:
                  - /url: /compare?candidate=RUN-1001
                - button "Dismiss" [ref=e93]:
                  - img
            - generic [ref=e94]:
              - generic [ref=e95] [cursor=pointer]:
                - generic [ref=e96]:
                  - generic [ref=e97]: Overall Pass Rate (7d)
                  - img [ref=e98]
                - generic [ref=e101]:
                  - generic [ref=e102]: 95%
                  - paragraph [ref=e103]: 40 runs analysed
                  - img [ref=e107]
              - generic [ref=e114] [cursor=pointer]:
                - generic [ref=e115]:
                  - generic [ref=e116]: Total Runs (7d)
                  - img [ref=e117]
                - generic [ref=e119]:
                  - generic [ref=e120]: "40"
                  - paragraph [ref=e121]: across all environments
              - generic [ref=e122] [cursor=pointer]:
                - generic [ref=e123]:
                  - generic [ref=e124]: Failed Runs (7d)
                  - img [ref=e125]
                - generic [ref=e129]:
                  - generic [ref=e130]: "6"
                  - paragraph [ref=e131]: 15% failure rate
              - generic [ref=e132] [cursor=pointer]:
                - generic [ref=e133]:
                  - generic [ref=e134]: Active Pipelines
                  - img [ref=e135]
                - generic [ref=e138]:
                  - generic [ref=e139]: "1"
                  - paragraph [ref=e140]: 1 running now
            - generic [ref=e141]:
              - generic [ref=e142]:
                - heading "Environment Tiers" [level=2] [ref=e143]
                - link "View all runs →" [ref=e144] [cursor=pointer]:
                  - /url: /runs
              - generic [ref=e145]:
                - generic [ref=e146] [cursor=pointer]:
                  - generic [ref=e147]:
                    - generic [ref=e148]: QA
                    - generic [ref=e149]: HEALTHY
                  - generic [ref=e150]:
                    - generic [ref=e151]:
                      - generic [ref=e152]: 95%
                      - generic [ref=e153]: avg pass
                    - generic [ref=e156]:
                      - generic [ref=e157]:
                        - generic [ref=e158]: Staging
                        - generic [ref=e159]: 95%
                      - generic [ref=e160]:
                        - generic [ref=e161]: Production
                        - generic [ref=e162]: 96%
                      - generic [ref=e163]:
                        - generic [ref=e164]: Total Runs
                        - generic [ref=e165]: "50"
                - generic [ref=e166] [cursor=pointer]:
                  - generic [ref=e167]:
                    - generic [ref=e168]: UAT
                    - generic [ref=e169]: HEALTHY
                  - generic [ref=e170]:
                    - generic [ref=e171]:
                      - generic [ref=e172]: 96%
                      - generic [ref=e173]: avg pass
                    - generic [ref=e176]:
                      - generic [ref=e177]:
                        - generic [ref=e178]: Staging
                        - generic [ref=e179]: 96%
                      - generic [ref=e180]:
                        - generic [ref=e181]: Production
                        - generic [ref=e182]: 96%
                      - generic [ref=e183]:
                        - generic [ref=e184]: Total Runs
                        - generic [ref=e185]: "50"
                - generic [ref=e186] [cursor=pointer]:
                  - generic [ref=e187]:
                    - generic [ref=e188]: PROD
                    - generic [ref=e189]: HEALTHY
                  - generic [ref=e190]:
                    - generic [ref=e191]:
                      - generic [ref=e192]: 96%
                      - generic [ref=e193]: avg pass
                    - generic [ref=e196]:
                      - generic [ref=e197]:
                        - generic [ref=e198]: Staging
                        - generic [ref=e199]: 96%
                      - generic [ref=e200]:
                        - generic [ref=e201]: Production
                        - generic [ref=e202]: 96%
                      - generic [ref=e203]:
                        - generic [ref=e204]: Total Runs
                        - generic [ref=e205]: "50"
            - generic [ref=e206]:
              - generic [ref=e207]:
                - generic [ref=e208]:
                  - img [ref=e209]
                  - text: 30-Day Pass Rate Trend
                - link "Full analytics →" [ref=e212] [cursor=pointer]:
                  - /url: /trends
              - img [ref=e217]:
                - generic [ref=e219]:
                  - generic [ref=e221]: "1"
                  - generic [ref=e223]: "1"
                  - generic [ref=e225]: "2"
                  - generic [ref=e227]: "3"
                  - generic [ref=e229]: "4"
                  - generic [ref=e231]: "5"
                  - generic [ref=e233]: "6"
                  - generic [ref=e235]: "7"
                  - generic [ref=e237]: "8"
                  - generic [ref=e239]: "9"
                  - generic [ref=e241]: "0"
                  - generic [ref=e243]: "1"
                  - generic [ref=e245]: "2"
                  - generic [ref=e247]: "3"
                  - generic [ref=e249]: "4"
                  - generic [ref=e251]: "5"
                  - generic [ref=e253]: "6"
                  - generic [ref=e255]: "7"
                  - generic [ref=e257]: "8"
                  - generic [ref=e259]: "9"
                  - generic [ref=e261]: "0"
                  - generic [ref=e263]: "1"
                  - generic [ref=e265]: "2"
                  - generic [ref=e267]: "3"
                  - generic [ref=e269]: "4"
                  - generic [ref=e271]: "5"
                  - generic [ref=e273]: "6"
                  - generic [ref=e275]: "7"
                  - generic [ref=e277]: "8"
                  - generic [ref=e279]: "9"
                - generic [ref=e281]:
                  - generic [ref=e283]: 60%
                  - generic [ref=e285]: 70%
                  - generic [ref=e287]: 80%
                  - generic [ref=e289]: 90%
                  - generic [ref=e291]: 100%
                - generic [ref=e293]: 95% gate
        - generic [ref=e300]:
          - generic [ref=e301]:
            - img [ref=e302]
            - generic [ref=e305]: "PROMOTION GATE: OPEN"
          - generic [ref=e306]: "UAT Pass Rate: 96.2% (Threshold: 95%)"
    - region "Notifications (F8)":
      - list
  - generic [ref=e307]: 60%
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
> 12 |     await expect(page.getByText(/total runs/i)).toBeVisible();
     |                                                 ^ Error: expect(locator).toBeVisible() failed
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
  44 |       await expect(page.getByRole("button", { name: /investigate/i })).toBeVisible();
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
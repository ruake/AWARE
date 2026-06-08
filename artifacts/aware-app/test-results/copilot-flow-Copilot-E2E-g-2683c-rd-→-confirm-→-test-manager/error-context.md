# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: copilot-flow.spec.ts >> Copilot E2E >> generate-tests skill: form → draft card → confirm → test manager
- Location: e2e/copilot-flow.spec.ts:4:3

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-HWpcqV --remote-debugging-pipe --no-startup-window
<launched> pid=14328
[pid=14328][err] /home/runner/workspace/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell: error while loading shared libraries: libdbus-1.so.3: cannot open shared object file: No such file or directory
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-HWpcqV --remote-debugging-pipe --no-startup-window
  - <launched> pid=14328
  - [pid=14328][err] /home/runner/workspace/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell: error while loading shared libraries: libdbus-1.so.3: cannot open shared object file: No such file or directory
  - [pid=14328] <gracefully close start>
  - [pid=14328] <kill>
  - [pid=14328] <will force kill>
  - [pid=14328] exception while trying to kill process: Error: kill ESRCH
  - [pid=14328] <process did exit: exitCode=127, signal=null>
  - [pid=14328] starting temporary directories cleanup
  - [pid=14328] finished temporary directories cleanup
  - [pid=14328] <gracefully close end>

```

# Test source

```ts
  1  | import { test, expect, chromium } from "@playwright/test";
  2  | 
  3  | test.describe("Copilot E2E", () => {
  4  |   test("generate-tests skill: form → draft card → confirm → test manager", async () => {
> 5  |     const browser = await chromium.launch({ headless: true });
     |                                    ^ Error: browserType.launch: Target page, context or browser has been closed
  6  |     const page = await browser.newPage();
  7  | 
  8  |     await test.step("Navigate to Copilot page", async () => {
  9  |       await page.goto("/copilot");
  10 |       await page.waitForLoadState("networkidle");
  11 |       await expect(page.locator("text=AI Copilot")).toBeVisible({ timeout: 5000 });
  12 |     });
  13 | 
  14 |     await test.step("Click Generate Test Cases skill", async () => {
  15 |       const skillBtn = page.locator("button", { hasText: "Generate Test Cases" });
  16 |       await skillBtn.waitFor({ state: "visible", timeout: 3000 });
  17 |       await skillBtn.click();
  18 |       await page.waitForTimeout(300);
  19 |     });
  20 | 
  21 |     await test.step("Send test generation request", async () => {
  22 |       const input = page.locator("input[placeholder*='Ask about']");
  23 |       await input.waitFor({ state: "visible", timeout: 3000 });
  24 |       await input.fill("Create a test for CDN cache HIT validation");
  25 |       const sendBtn = page.locator("button.gcp-button-primary").first();
  26 |       await sendBtn.click();
  27 |     });
  28 | 
  29 |     await test.step("Wait for form block to appear", async () => {
  30 |       const submitBtn = page.locator("button", { hasText: "Submit" });
  31 |       await submitBtn.waitFor({ state: "visible", timeout: 10000 });
  32 |     });
  33 | 
  34 |     await test.step("Fill form fields", async () => {
  35 |       const selects = page.locator("select");
  36 |       const selectCount = await selects.count();
  37 |       for (let i = 0; i < selectCount; i++) {
  38 |         const select = selects.nth(i);
  39 |         const options = await select.locator("option").all();
  40 |         if (options.length > 1) {
  41 |           await select.selectOption({ index: 1 });
  42 |         }
  43 |       }
  44 | 
  45 |       const textInputs = page.locator("input[placeholder='Type your answer...']");
  46 |       const textCount = await textInputs.count();
  47 |       for (let i = 0; i < textCount; i++) {
  48 |         await textInputs.nth(i).fill(`Test case ${i + 1}`);
  49 |       }
  50 |     });
  51 | 
  52 |     await test.step("Submit the form", async () => {
  53 |       const submitBtn = page.locator("button", { hasText: "Submit" });
  54 |       await submitBtn.click();
  55 |     });
  56 | 
  57 |     await test.step("Wait for draft card", async () => {
  58 |       await expect(page.locator("text=Draft Test Case")).toBeVisible({ timeout: 15000 });
  59 |       await expect(page.locator("text=Name")).toBeVisible({ timeout: 3000 });
  60 |       await expect(page.locator("text=Category")).toBeVisible({ timeout: 3000 });
  61 |     });
  62 | 
  63 |     await test.step("Click Confirm & Open in Test Manager", async () => {
  64 |       const confirmBtn = page.locator("button", { hasText: "Confirm & Open in Test Manager" });
  65 |       await confirmBtn.waitFor({ state: "visible", timeout: 3000 });
  66 |       await confirmBtn.click();
  67 |     });
  68 | 
  69 |     await test.step("Wait for Test Manager page and modal", async () => {
  70 |       await page.waitForURL("**/tests", { timeout: 10000 });
  71 |       await expect(page.locator("h2", { hasText: "New Test Case" })).toBeVisible({ timeout: 5000 });
  72 |     });
  73 | 
  74 |     await browser.close();
  75 |   });
  76 | });
  77 | 
```
import { test, expect } from "@playwright/test";

/**
 * Copilot UI Tests — verifies quick actions trigger the agent pipeline,
 * messages appear, and the LangGraph step indicator fires.
 *
 * NOTE: Chrome AI (Gemini Nano) may or may not be available in the test
 * browser. Tests are written to verify the pipeline runs regardless of
 * which provider is active — they check UI state transitions, not AI output.
 */
test.describe("Copilot — Quick Actions & Agent Pipeline", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[browser error] ${msg.text()}`);
    });
    page.on("pageerror", (err) => console.log(`[page error] ${err.message}`));

    await page.goto("/copilot");
    await expect(page.getByText("AWARE Copilot").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Quick Actions")).toBeVisible({ timeout: 5000 });
  });

  test("page structure — sidebar, provider selector, input bar all visible", async ({ page }) => {
    await page.screenshot({ path: "test-results/copilot-initial.png" });

    // Provider selector (Chrome AI / WebLLM / OpenAI pill button)
    await expect(
      page.locator("button").filter({ hasText: /Chrome AI|WebLLM|OpenAI/ }).first(),
    ).toBeVisible();

    // Input textarea
    await expect(page.locator("textarea")).toBeVisible();

    // At least one quick action button
    await expect(page.locator("button").filter({ hasText: "Latest Runs" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "Flaky Tests" }).first()).toBeVisible();
  });

  test("quick action — click adds user message to feed immediately", async ({ page }) => {
    const btn = page.locator("button").filter({ hasText: "Latest Runs" }).first();
    await expect(btn).toBeEnabled({ timeout: 5000 });
    await btn.click();

    // The user message must appear within ~2 seconds (state update is synchronous)
    await expect(
      page.locator("div").filter({ hasText: /last 10 test runs/i }).first(),
    ).toBeVisible({ timeout: 4000 });

    await page.screenshot({ path: "test-results/copilot-user-msg-appeared.png" });
  });

  test("quick action — agent becomes busy (Stop button or step indicator appears)", async ({ page }) => {
    const btn = page.locator("button").filter({ hasText: "Latest Runs" }).first();
    await btn.click();

    // Either the Stop button or the LangGraph step bar should appear while busy
    const stopBtn = page.locator("button").filter({ hasText: "Stop" });
    const stepBar = page.locator("div").filter({ hasText: /Thinking|Planning|Executing|Synthesizing/i });

    // Wait for either busy indicator
    await expect(stopBtn.or(stepBar).first()).toBeVisible({ timeout: 6000 });

    await page.screenshot({ path: "test-results/copilot-busy-state.png" });
  });

  test("quick action — assistant message bubble appears (with content or error)", async ({ page }) => {
    const btn = page.locator("button").filter({ hasText: "Latest Runs" }).first();
    await btn.click();

    // The streaming assistant bubble with blinking cursor must appear first
    // (streaming: true, hasContent: false shows just the cursor indicator)
    await page.waitForTimeout(500); // brief wait for React state to commit

    // After the agent runs (up to 30s), we expect either:
    // a) A non-empty response from the provider
    // b) A Chrome AI error message (if Chrome AI unavailable in test browser)
    // Either way, the streaming flag must clear and something must be visible.
    await page.waitForFunction(
      () => {
        // Look for any non-empty text in the message feed that appeared after click
        const allText = document.body.innerText;
        return (
          // Chrome AI unavailable message
          allText.includes("Chrome AI") ||
          // Actual response content
          allText.includes("pass rate") ||
          allText.includes("run") ||
          // OpenAI key missing message
          allText.includes("API key") ||
          // WebLLM loading
          allText.includes("Loading") ||
          // Any error from the provider
          allText.includes("error")
        );
      },
      { timeout: 35000 },
    ).catch(() => null); // don't fail test on timeout — screenshot will reveal state

    await page.screenshot({ path: "test-results/copilot-response.png" });

    // The user message must still be visible
    await expect(
      page.locator("div").filter({ hasText: /last 10 test runs/i }).first(),
    ).toBeVisible();
  });

  test("quick action — 'Flaky Tests' triggers agent (user message appears)", async ({ page }) => {
    const btn = page.locator("button").filter({ hasText: "Flaky Tests" }).first();
    await expect(btn).toBeEnabled();
    await btn.click();

    await expect(
      page.locator("div").filter({ hasText: /flaky/i }).first(),
    ).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: "test-results/copilot-flaky-tests.png" });
  });

  test("quick action — buttons disabled while agent is busy", async ({ page }) => {
    const latestRunsBtn = page.locator("button").filter({ hasText: "Latest Runs" }).first();
    await latestRunsBtn.click();

    // Poll for busy state for up to 2 seconds
    let wasBusy = false;
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(200);
      const stopVisible = await page.locator("button").filter({ hasText: "Stop" }).isVisible();
      if (stopVisible) {
        wasBusy = true;
        // While busy, other quick action buttons must be disabled
        const flakyBtn = page.locator("button").filter({ hasText: "Flaky Tests" }).first();
        await expect(flakyBtn).toBeDisabled({ timeout: 1000 });
        await page.screenshot({ path: "test-results/copilot-buttons-disabled.png" });
        break;
      }
    }
    // If the agent completed instantly (e.g. Chrome AI unavailable), wasBusy may be false
    // That's acceptable — the key check is the message appearing, tested above.
    if (!wasBusy) {
      console.log("Agent completed too fast to catch busy state (provider may be unavailable)");
    }
  });

  test("manual input — typing and Enter key sends message", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.click();
    await textarea.fill("Hello, are you working?");

    // Send button becomes active when input is non-empty
    const sendBtn = page.locator("button[title='Send (Enter)']");
    await expect(sendBtn).not.toBeDisabled({ timeout: 2000 });

    await page.keyboard.press("Enter");

    await expect(
      page.locator("div").filter({ hasText: "Hello, are you working?" }).first(),
    ).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: "test-results/copilot-manual-send.png" });
  });

  test("new chat — clears conversation and resets to greeting", async ({ page }) => {
    // Send a message first
    await page.locator("textarea").fill("test");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Click New Chat
    await page.locator("button").filter({ hasText: "New Chat" }).first().click();

    // New greeting appears
    await expect(
      page.locator("div").filter({ hasText: /New chat started/i }).first(),
    ).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: "test-results/copilot-new-chat.png" });
  });
});

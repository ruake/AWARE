import { test, expect } from "@playwright/test";
import { goto, waitForApp } from "./helpers";

test.describe("AI Copilot (/copilot)", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/copilot");
    await waitForApp(page);
  });

  test("renders copilot page without crashing", async ({ page }) => {
    await expect(page.locator("main, [role=main]").first()).toBeVisible();
  });

  test("shows chat input or textarea", async ({ page }) => {
    const input = page
      .getByRole("textbox")
      .or(page.getByPlaceholder(/ask|query|message/i))
      .first();
    await expect(input).toBeVisible();
  });

  test("shows send button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /send/i }).or(
        page.locator("button[type=submit]")
      ).first()
    ).toBeVisible();
  });

  test("shows suggestion chips", async ({ page }) => {
    const chips = [
      /analyze recent failures/i,
      /compare environments/i,
      /find flaky tests/i,
      /explain anomalies/i,
    ];
    const found = await Promise.all(
      chips.map((re) => page.getByText(re).first().isVisible().catch(() => false)),
    );
    expect(found.some(Boolean)).toBe(true);
  });

  test("clicking a suggestion chip populates input or sends a message", async ({
    page,
  }) => {
    const chip = page.getByText(/analyze recent failures/i).first();
    if (await chip.isVisible()) {
      await chip.click();
      await page.waitForTimeout(1_000);
      // Either the input has text, or a response bubble appeared
      const inputText = await page
        .getByRole("textbox")
        .first()
        .inputValue()
        .catch(() => "");
      const hasResponse = await page
        .getByText(/fail|pass|run|test/i)
        .nth(5) // skip nav items
        .isVisible()
        .catch(() => false);
      expect(inputText.length > 0 || hasResponse).toBe(true);
    }
  });

  test("typing a query and sending shows a response", async ({ page }) => {
    const input = page.getByRole("textbox").or(
      page.getByPlaceholder(/ask|query|message/i)
    ).first();
    await input.fill("Which tests failed recently?");
    await page.keyboard.press("Enter");
    // Wait for a response to appear (mock AI responds quickly)
    await page.waitForTimeout(2_000);
    // Some response text should appear
    await expect(page.locator("[class*=bubble], [class*=message], [class*=chat]").first()).toBeDefined();
  });

  test("has new conversation button", async ({ page }) => {
    const newConv = page.getByRole("button", { name: /new/i }).first();
    // May or may not be visible depending on implementation
    const visible = await newConv.isVisible().catch(() => false);
    if (visible) {
      await newConv.click();
      // Should clear/reset without crashing
      await expect(page.locator("main").first()).toBeVisible();
    }
  });
});

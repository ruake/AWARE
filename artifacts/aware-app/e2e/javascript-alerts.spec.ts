import { test, expect } from "@playwright/test";

const BASE = "https://the-internet.herokuapp.com";

test.describe("JavaScript Alerts", () => {
  test("accept JS alert", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto(`${BASE}/javascript_alerts`);
    await page.click("button:has-text('Click for JS Alert')");
    await expect(page.locator("#result")).toHaveText("You successfully clicked an alert");
  });

  test("accept JS confirm", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto(`${BASE}/javascript_alerts`);
    await page.click("button:has-text('Click for JS Confirm')");
    await expect(page.locator("#result")).toHaveText("You clicked: Ok");
  });

  test("dismiss JS confirm", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.dismiss());
    await page.goto(`${BASE}/javascript_alerts`);
    await page.click("button:has-text('Click for JS Confirm')");
    await expect(page.locator("#result")).toHaveText("You clicked: Cancel");
  });

  test("type in JS prompt", async ({ page }) => {
    page.on("dialog", (dialog) => {
      expect(dialog.type()).toBe("prompt");
      dialog.accept("Playwright test");
    });
    await page.goto(`${BASE}/javascript_alerts`);
    await page.click("button:has-text('Click for JS Prompt')");
    await expect(page.locator("#result")).toHaveText("You entered: Playwright test");
  });

  test("dismiss JS prompt returns null", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.dismiss());
    await page.goto(`${BASE}/javascript_alerts`);
    await page.click("button:has-text('Click for JS Prompt')");
    await expect(page.locator("#result")).toHaveText("You entered: null");
  });
});

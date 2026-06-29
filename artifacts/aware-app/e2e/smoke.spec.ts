import { test, expect } from "@playwright/test";

test.describe("AWARE App Smoke Tests", () => {
  test("Dashboard loads and shows data", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Regression Dashboard/ })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Pass Rate Trend")).toBeVisible({ timeout: 5000 });
  });

  test("Runs page loads", async ({ page }) => {
    await page.goto("/runs");
    await expect(page.getByRole("heading", { name: "Regression Runs" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("Copilot page loads with actions and provider selector", async ({ page }) => {
    await page.goto("/copilot");
    await expect(page.getByText("AWARE Copilot").first()).toBeVisible({ timeout: 10000 });
    // Actions toggle button visible (quick actions are in a collapsible bar)
    await expect(page.locator("button").filter({ hasText: "Actions" }).first()).toBeVisible({
      timeout: 5000,
    });
    // Provider selector must be visible
    await expect(
      page
        .locator("button")
        .filter({ hasText: /Chrome AI|WebLLM|OpenAI/ })
        .first(),
    ).toBeVisible({ timeout: 5000 });
    // Starter prompts visible in empty state
    await expect(page.locator("button").filter({ hasText: "What's failing?" }).first()).toBeVisible(
      { timeout: 3000 },
    );
  });

  test("About page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByText("A.W.A.R.E.").first()).toBeVisible({ timeout: 5000 });
  });

  test("Compare page loads", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.getByText("Compare").first()).toBeVisible({ timeout: 10000 });
  });

  test("Analytics loads", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page).toHaveURL(/analytics/);
  });
});

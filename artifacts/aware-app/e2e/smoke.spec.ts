import { test, expect } from "@playwright/test";

test.describe("PROOF App Smoke Tests", () => {
  test("Dashboard loads and shows empty state", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("No runs available")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("New Regression Run")).toBeVisible({ timeout: 5000 });
  });

  test("Runs page loads", async ({ page }) => {
    await page.goto("/runs");
    await expect(page.getByText("Regression Runs").or(page.getByText("Start Run"))).toBeVisible({ timeout: 5000 });
  });

  test("Test Manager loads test list", async ({ page }) => {
    await page.goto("/tests");
    await expect(page.getByText("Test Manager")).toBeVisible({ timeout: 5000 });
    const table = page.locator("table");
    await expect(table.first()).toBeVisible({ timeout: 5000 });
  });

  test("Copilot page loads and shows skills", async ({ page }) => {
    await page.goto("/copilot");
    await expect(page.getByText("Copilot").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Generate Tests").first()).toBeVisible({ timeout: 5000 });
  });

  test("About page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByText("About AWARE")).toBeVisible({ timeout: 5000 });
  });

  test("Compare page loads", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.getByText("Compare").first()).toBeVisible({ timeout: 10000 });
  });

  test("Test Analytics loads with search params", async ({ page }) => {
    await page.goto("/analytics?testId=ad_0");
    await expect(page).toHaveURL(/analytics/);
  });
});

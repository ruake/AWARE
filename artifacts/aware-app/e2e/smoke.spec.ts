import { test, expect } from "@playwright/test";

test.describe("PROOF App Smoke Tests", () => {
  test("Dashboard loads with KPI tiles", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Dashboard");
    const kpiCards = page.locator(".gcp-card >> text=Pass Rate >> visible=true");
    await expect(kpiCards.first()).toBeVisible({ timeout: 5000 });
  });

  test("Runs page shows run table", async ({ page }) => {
    await page.goto("/runs");
    await expect(page.locator("h1")).toContainText("Regression Runs");
    const rows = page.locator("table.gcp-table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 5000 });
  });

  test("Test Manager loads test list", async ({ page }) => {
    await page.goto("/tests");
    await expect(page.locator("h1")).toContainText("Test Manager");
    const table = page.locator("table.gcp-table");
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test("Copilot page loads and shows chat input", async ({ page }) => {
    await page.goto("/copilot");
    await expect(page.getByText("AI Copilot").first()).toBeVisible({ timeout: 5000 });
    const input = page.locator("input.gcp-input");
    await expect(input.first()).toBeVisible({ timeout: 5000 });
  });

  test("About page shows system stats", async ({ page }) => {
    await page.goto("/about");
    const statCards = page.locator("text=About").or(page.locator("text=System Status"));
    await expect(statCards.first()).toBeVisible({ timeout: 5000 });
  });

  test("Compare page shows diff table", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.locator("table.gcp-table")).toBeVisible({ timeout: 5000 });
    const table = page.locator("table.gcp-table");
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test("Test Analytics loads with search params", async ({ page }) => {
    await page.goto("/analytics?testId=tc_0");
    await expect(page).toHaveURL(/analytics/);
  });
});

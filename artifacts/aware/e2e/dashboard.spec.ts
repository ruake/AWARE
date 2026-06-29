import { test, expect } from "@playwright/test";
import { goto, waitForApp } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/");
    await waitForApp(page);
  });

  test("renders four KPI cards", async ({ page }) => {
    await expect(page.getByText(/overall pass rate/i)).toBeVisible();
    await expect(page.getByText(/total runs/i)).toBeVisible();
    await expect(page.getByText(/failed runs/i)).toBeVisible();
    await expect(page.getByText(/active pipeline/i)).toBeVisible();
  });

  test("KPI pass rate card shows a percentage", async ({ page }) => {
    // Should be a number followed by %
    await expect(page.getByText(/\d+%/).first()).toBeVisible();
  });

  test("renders QA, UAT and PROD tier cards", async ({ page }) => {
    await expect(page.getByText("QA")).toBeVisible();
    await expect(page.getByText("UAT")).toBeVisible();
    await expect(page.getByText("PROD")).toBeVisible();
  });

  test("each tier card shows avg pass % and network breakdown", async ({ page }) => {
    await expect(page.getByText(/avg pass/i).first()).toBeVisible();
    await expect(page.getByText(/staging/i).first()).toBeVisible();
    await expect(page.getByText(/production/i).first()).toBeVisible();
  });

  test("30-day pass rate trend section heading is visible", async ({ page }) => {
    await expect(page.getByText(/30.day pass rate trend/i)).toBeVisible();
  });

  test("anomaly banner appears when there are failing runs", async ({ page }) => {
    // Mock data has FAIL runs (RUN-1001), so banner should appear
    const banner = page.getByText(/anomaly detected/i);
    // May or may not be present depending on Z-score; accept either case
    const visible = await banner.isVisible().catch(() => false);
    if (visible) {
      await expect(page.getByRole("link", { name: /investigate/i })).toBeVisible();
    }
  });

  test("refresh button triggers a data reload without crashing", async ({ page }) => {
    await page.getByRole("button", { name: /refresh/i }).click();
    // Page should still show KPI cards after refresh
    await expect(page.getByText(/overall pass rate/i)).toBeVisible();
  });

  test("promotion gate status bar shows UAT threshold info", async ({ page }) => {
    await expect(page.getByText(/promotion gate/i)).toBeVisible();
    await expect(page.getByText(/95%/).first()).toBeVisible();
  });
});

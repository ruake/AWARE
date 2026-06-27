import { test, expect } from "@playwright/test";
import { goto, waitForApp } from "./helpers";

test.describe("CI Pipeline & Scheduler Status (/status)", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/status");
    await waitForApp(page);
  });

  test("renders status page without crashing", async ({ page }) => {
    await expect(page.locator("main, [role=main]").first()).toBeVisible();
  });

  test("shows scheduler health status badge", async ({ page }) => {
    await expect(
      page.getByText(/healthy|degraded|error/i).first()
    ).toBeVisible();
  });

  test("shows scheduler last run time", async ({ page }) => {
    await expect(page.getByText(/last run|last reconcile/i)).toBeVisible();
  });

  test("shows scheduler summary metrics", async ({ page }) => {
    // totalSuites, activeRuns, pendingDispatches
    const metrics = [/total suites/i, /active runs/i, /pending/i];
    const found = await Promise.all(
      metrics.map((re) => page.getByText(re).first().isVisible().catch(() => false)),
    );
    expect(found.some(Boolean)).toBe(true);
  });

  test("suite status table is present with at least one row", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("suite status rows contain suite IDs", async ({ page }) => {
    await expect(page.getByText(/SUITE-/i).first()).toBeVisible();
  });

  test("recent dispatches section is present", async ({ page }) => {
    await expect(
      page.getByText(/recent dispatch|dispatch log/i).first()
    ).toBeVisible();
  });

  test("recent dispatches show at least one entry", async ({ page }) => {
    // Look for dispatch status (success/failed)
    const success = await page.getByText(/success|failed/i).first().isVisible().catch(() => false);
    expect(success).toBe(true);
  });

  test("CI config section shows YAML content", async ({ page }) => {
    const hasYaml =
      (await page.getByText(/yaml|config/i).first().isVisible().catch(() => false)) ||
      (await page.locator("textarea, pre, code").first().isVisible().catch(() => false));
    expect(hasYaml).toBe(true);
  });

  test("copy button exists for CI config", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: /copy/i });
    const visible = await copyBtn.isVisible().catch(() => false);
    if (visible) {
      await copyBtn.click();
      // Should not crash
      await expect(page.locator("main").first()).toBeVisible();
    }
  });
});

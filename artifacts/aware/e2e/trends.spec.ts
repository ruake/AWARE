import { test, expect } from "@playwright/test";
import { goto, waitForApp } from "./helpers";

test.describe("Test Analytics / Trends (/trends)", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/trends");
    await waitForApp(page);
  });

  test("page renders without crashing", async ({ page }) => {
    // Any content is fine as long as we don't get an error screen
    await expect(page.locator("main, [role=main]").first()).toBeVisible();
  });

  test("shows pass rate trend chart or heading", async ({ page }) => {
    const hasChart =
      (await page.locator("svg").count()) > 0 ||
      (await page.getByText(/pass rate/i).isVisible().catch(() => false));
    expect(hasChart).toBe(true);
  });

  test("shows category heatmap section", async ({ page }) => {
    // Heatmap should contain category names
    const cats = ["CDN", "DNS", "TLS", "Cache", "EdgeWorker", "Redirect", "Auth"];
    const found = await Promise.all(
      cats.map((c) => page.getByText(c).first().isVisible().catch(() => false)),
    );
    expect(found.some(Boolean)).toBe(true);
  });

  test("heatmap contains environment column headers", async ({ page }) => {
    const envs = ["QA", "UAT", "PROD"];
    const found = await Promise.all(
      envs.map((e) => page.getByText(e).first().isVisible().catch(() => false)),
    );
    expect(found.some(Boolean)).toBe(true);
  });

  test("flakiness section is present", async ({ page }) => {
    const hasFlakiness = await page
      .getByText(/flak/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasFlakiness).toBe(true);
  });

  test("heatmap cells show percentage values", async ({ page }) => {
    // Any cell with a % value
    await expect(page.getByText(/%/).first()).toBeVisible({ timeout: 5_000 });
  });
});

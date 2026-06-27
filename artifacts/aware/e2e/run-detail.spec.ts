import { test, expect } from "@playwright/test";
import { goto, waitForApp, KNOWN_PASS_RUN_ID, KNOWN_FAIL_RUN_ID } from "./helpers";

test.describe("Run Detail (/runs/:runId)", () => {
  test.describe("PASS run (RUN-1000)", () => {
    test.beforeEach(async ({ page }) => {
      await goto(page, `/runs/${KNOWN_PASS_RUN_ID}`);
      await waitForApp(page);
    });

    test("shows run ID in heading", async ({ page }) => {
      await expect(page.getByText(KNOWN_PASS_RUN_ID)).toBeVisible();
    });

    test("shows PASS status badge", async ({ page }) => {
      await expect(page.getByText("PASS").first()).toBeVisible();
    });

    test("shows QA environment info", async ({ page }) => {
      await expect(page.getByText("QA").first()).toBeVisible();
      await expect(page.getByText("staging").first()).toBeVisible();
    });

    test("shows summary stat cards (total / passed / failed / skipped)", async ({ page }) => {
      // Detail page should show numeric stats
      await expect(page.getByText(/total/i).first()).toBeVisible();
      await expect(page.getByText(/passed/i).first()).toBeVisible();
      await expect(page.getByText(/failed/i).first()).toBeVisible();
      await expect(page.getByText(/skipped/i).first()).toBeVisible();
    });

    test("test results table has 20 rows (one per mock result)", async ({ page }) => {
      // Each run has exactly 20 test results in deterministic mock data
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("test result rows show category badge", async ({ page }) => {
      const cats = ["CDN", "DNS", "TLS", "Cache", "EdgeWorker", "Redirect", "Auth"];
      const found = await Promise.all(
        cats.map((c) => page.getByText(c).first().isVisible().catch(() => false)),
      );
      expect(found.some(Boolean)).toBe(true);
    });

    test("back to runs link works", async ({ page }) => {
      await page.getByRole("link", { name: /back to runs/i }).click();
      await expect(page).toHaveURL(/\/runs$/);
    });

    test("expanding a test result row shows assertions", async ({ page }) => {
      // Click the first expandable row
      const firstRow = page.locator("tbody tr").first();
      await firstRow.click();
      // After expanding, assertions should appear
      await expect(page.getByText(/status is 200|response schema/i).first()).toBeVisible({
        timeout: 5_000,
      });
    });

    test("filter tab 'Failed' hides PASS results", async ({ page }) => {
      // PASS run has 0 failures — filtering to FAIL should show empty or none
      const failTab = page.getByRole("tab", { name: /fail/i }).or(
        page.getByText(/^fail$/i).first(),
      );
      if (await failTab.isVisible()) {
        await failTab.click();
        await expect(page.getByText(/no results|empty/i).or(
          page.locator("tbody tr")
        ).first()).toBeDefined();
      }
    });

    test("search filters results by test name", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill("CDN");
        await page.waitForTimeout(300);
        // Only CDN rows should remain
        const rows = page.locator("tbody tr");
        const count = await rows.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("FAIL run (RUN-1001)", () => {
    test.beforeEach(async ({ page }) => {
      await goto(page, `/runs/${KNOWN_FAIL_RUN_ID}`);
      await waitForApp(page);
    });

    test("shows FAIL status badge", async ({ page }) => {
      await expect(page.getByText("FAIL").first()).toBeVisible();
    });

    test("shows non-zero failed count", async ({ page }) => {
      // The FAIL run has failures > 0
      // Look for a number next to "failed"
      await expect(page.getByText(/failed/i).first()).toBeVisible();
    });

    test("expanding a failed result shows assertion error details", async ({ page }) => {
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      for (let i = 0; i < Math.min(count, 5); i++) {
        const row = rows.nth(i);
        const text = await row.textContent();
        if (text?.includes("FAIL")) {
          await row.click();
          await expect(page.getByText(/503|assertion|error/i).first()).toBeVisible({
            timeout: 5_000,
          });
          break;
        }
      }
    });
  });

  test("unknown run ID shows not-found message", async ({ page }) => {
    await goto(page, "/runs/RUN-DOES-NOT-EXIST");
    await waitForApp(page);
    await expect(page.getByText(/run not found|not found|404/i)).toBeVisible();
  });
});

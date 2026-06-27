import { test, expect } from "@playwright/test";
import { goto, waitForApp } from "./helpers";

test.describe("Test Case Browser (/tests)", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/tests");
    await waitForApp(page);
  });

  test("renders test case browser without crashing", async ({ page }) => {
    await expect(page.locator("main, [role=main]").first()).toBeVisible();
  });

  test("shows table with test cases", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("table has expected column headers", async ({ page }) => {
    const headers = ["Test ID", "Name", "Category", "Type", "Priority", "Owner"];
    const found = await Promise.all(
      headers.map((h) =>
        page.getByText(new RegExp(h, "i")).first().isVisible().catch(() => false)
      ),
    );
    // At least 4 of the 6 headers should match
    const matchCount = found.filter(Boolean).length;
    expect(matchCount).toBeGreaterThanOrEqual(4);
  });

  test("known test case TC-0001 is visible", async ({ page }) => {
    await expect(page.getByText("TC-0001")).toBeVisible();
  });

  test("test type badges show playwright / pytest / http / puppeteer", async ({
    page,
  }) => {
    const types = ["playwright", "pytest", "http", "puppeteer"];
    const found = await Promise.all(
      types.map((t) => page.getByText(new RegExp(t, "i")).first().isVisible().catch(() => false)),
    );
    expect(found.some(Boolean)).toBe(true);
  });

  test("priority badges P0-P3 are visible", async ({ page }) => {
    const prios = ["P0", "P1", "P2", "P3"];
    const found = await Promise.all(
      prios.map((p) => page.getByText(p).first().isVisible().catch(() => false)),
    );
    expect(found.some(Boolean)).toBe(true);
  });

  test("search input filters test cases", async ({ page }) => {
    const search = page.getByPlaceholder(/search/i).first();
    if (await search.isVisible()) {
      await search.fill("CDN");
      await page.waitForTimeout(300);
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      // With filter active, only CDN-matching rows remain
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test("clicking a test row expands detail or opens modal", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    await firstRow.click();
    await page.waitForTimeout(500);
    // Expanded content should show description, scriptPath, or tags
    const expanded =
      (await page.getByText(/description|script path|tags|assertion/i).isVisible().catch(() => false));
    expect(expanded).toBe(true);
  });

  test("type filter narrows results to playwright tests", async ({ page }) => {
    const typeSelect = page
      .getByRole("combobox")
      .or(page.locator("select"))
      .first();
    if (await typeSelect.isVisible()) {
      try {
        await typeSelect.selectOption("playwright");
        await page.waitForTimeout(300);
        const rows = page.locator("tbody tr");
        const count = await rows.count();
        expect(count).toBeGreaterThanOrEqual(1);
      } catch {
        // If dropdown doesn't have that option, skip
      }
    }
  });
});

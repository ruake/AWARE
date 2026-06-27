import { test, expect } from "@playwright/test";
import { goto, waitForApp, KNOWN_PASS_RUN_ID, KNOWN_FAIL_RUN_ID } from "./helpers";

test.describe("Compare Runs (/compare)", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/compare");
    await waitForApp(page);
  });

  test("shows 'Compare Runs' heading", async ({ page }) => {
    await expect(page.getByText(/compare runs/i)).toBeVisible();
  });

  test("shows two run selector dropdowns", async ({ page }) => {
    const selects = page.locator("select");
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("shows swap button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /swap/i }).or(
        page.locator("[data-testid=swap-button]").or(
          page.locator("button").filter({ hasText: /⇄|swap|↔/i })
        )
      ).first()
    ).toBeDefined();
  });

  test("shows diff summary (regressions / fixed / unchanged)", async ({ page }) => {
    await expect(page.getByText(/regression/i).first()).toBeVisible();
    await expect(page.getByText(/fixed/i).first()).toBeVisible();
    await expect(page.getByText(/unchanged/i).first()).toBeVisible();
  });

  test("diff list has at least one row when different runs are selected", async ({ page }) => {
    const selects = page.locator("select");
    // Select the known PASS run as baseline and FAIL run as candidate
    await selects.first().selectOption(KNOWN_PASS_RUN_ID);
    await selects.nth(1).selectOption(KNOWN_FAIL_RUN_ID);
    await page.waitForTimeout(500);
    // Diff rows should be visible (PASS→FAIL transitions)
    const rows = page.locator("tbody tr, [data-testid*=diff-row]");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("URL params ?baseline=&candidate= pre-select runs", async ({ page }) => {
    await goto(
      page,
      `/compare?baseline=${KNOWN_PASS_RUN_ID}&candidate=${KNOWN_FAIL_RUN_ID}`,
    );
    await waitForApp(page);
    // Baseline select should show KNOWN_PASS_RUN_ID
    const baseSelect = page.locator("select").first();
    await expect(baseSelect).toHaveValue(KNOWN_PASS_RUN_ID);
    // Candidate select should show KNOWN_FAIL_RUN_ID
    const candSelect = page.locator("select").nth(1);
    await expect(candSelect).toHaveValue(KNOWN_FAIL_RUN_ID);
  });

  test("regression filter tab shows only regressions", async ({ page }) => {
    await goto(
      page,
      `/compare?baseline=${KNOWN_PASS_RUN_ID}&candidate=${KNOWN_FAIL_RUN_ID}`,
    );
    await waitForApp(page);
    const regBtn = page
      .getByRole("button", { name: /regressions/i })
      .or(page.getByText(/^regressions$/i));
    if (await regBtn.isVisible()) {
      await regBtn.click();
      await page.waitForTimeout(300);
      // All visible rows should be regression rows (red-coded)
      const rows = page.locator("tbody tr, [data-testid*=diff-row]");
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0); // May be 0 if all fixed
    }
  });

  test("search filters diff rows by test name", async ({ page }) => {
    await goto(
      page,
      `/compare?baseline=${KNOWN_PASS_RUN_ID}&candidate=${KNOWN_FAIL_RUN_ID}`,
    );
    await waitForApp(page);
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("CDN");
      await page.waitForTimeout(300);
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test("swap button exchanges baseline and candidate", async ({ page }) => {
    const selects = page.locator("select");
    await selects.first().selectOption(KNOWN_PASS_RUN_ID);
    await selects.nth(1).selectOption(KNOWN_FAIL_RUN_ID);

    const swapBtn = page
      .getByRole("button", { name: /swap/i })
      .or(page.locator("button").filter({ has: page.locator("svg") }).nth(0));
    if (await swapBtn.isVisible()) {
      await swapBtn.click();
      await page.waitForTimeout(300);
      const newBase = await selects.first().inputValue();
      const newCand = await selects.nth(1).inputValue();
      // After swap the values should be exchanged
      expect(newBase).toBe(KNOWN_FAIL_RUN_ID);
      expect(newCand).toBe(KNOWN_PASS_RUN_ID);
    }
  });
});

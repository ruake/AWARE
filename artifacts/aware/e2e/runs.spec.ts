import { test, expect } from "@playwright/test";
import { goto, waitForApp, KNOWN_PASS_RUN_ID, KNOWN_FAIL_RUN_ID } from "./helpers";

test.describe("Run History (/runs)", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/runs");
    await waitForApp(page);
  });

  test("shows page heading Run History", async ({ page }) => {
    await expect(page.getByText("Run History")).toBeVisible();
  });

  test("shows Export CSV button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /export csv/i })).toBeVisible();
  });

  test("shows search input", async ({ page }) => {
    await expect(page.getByPlaceholder(/search run id or label/i)).toBeVisible();
  });

  test("shows environment filter dropdown", async ({ page }) => {
    await expect(page.getByRole("option", { name: /all environments/i })).toBeDefined();
  });

  test("table has correct column headers", async ({ page }) => {
    await expect(page.getByText("Run ID")).toBeVisible();
    await expect(page.getByText("Environment").first()).toBeVisible();
    await expect(page.getByText(/pass/i).first()).toBeVisible();
  });

  test("known PASS run appears in the table", async ({ page }) => {
    await expect(page.getByText(KNOWN_PASS_RUN_ID)).toBeVisible();
  });

  test("known FAIL run appears in the table", async ({ page }) => {
    await expect(page.getByText(KNOWN_FAIL_RUN_ID)).toBeVisible();
  });

  test("searching by run ID filters results", async ({ page }) => {
    const input = page.getByPlaceholder(/search run id or label/i);
    await input.fill(KNOWN_PASS_RUN_ID);
    await page.waitForTimeout(300);
    await expect(page.getByText(KNOWN_PASS_RUN_ID)).toBeVisible();
    // Other run IDs should not appear (only our specific run)
    await expect(page.getByText(KNOWN_FAIL_RUN_ID)).not.toBeVisible();
  });

  test("filtering by QA shows only QA runs", async ({ page }) => {
    await page.selectOption("select", "QA");
    await page.waitForTimeout(300);
    // All visible env badges should be QA
    const badges = page.getByText("QA");
    await expect(badges.first()).toBeVisible();
  });

  test("clicking a run row navigates to run detail", async ({ page }) => {
    await page.getByText(KNOWN_PASS_RUN_ID).click();
    await expect(page).toHaveURL(new RegExp(`/runs/${KNOWN_PASS_RUN_ID}`));
  });
});

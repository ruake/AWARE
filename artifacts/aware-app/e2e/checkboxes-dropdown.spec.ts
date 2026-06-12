import { test, expect } from "@playwright/test";

const BASE = "https://the-internet.herokuapp.com";

test.describe("Checkboxes and Dropdown", () => {
  test("check and uncheck checkboxes", async ({ page }) => {
    await page.goto(`${BASE}/checkboxes`);
    const checkboxes = page.locator("input[type=checkbox]");
    await expect(checkboxes).toHaveCount(2);
    await expect(checkboxes.nth(0)).not.toBeChecked();
    await checkboxes.nth(0).check();
    await expect(checkboxes.nth(0)).toBeChecked();
    await checkboxes.nth(1).uncheck();
    await expect(checkboxes.nth(1)).not.toBeChecked();
  });

  test("select dropdown option by label", async ({ page }) => {
    await page.goto(`${BASE}/dropdown`);
    const dropdown = page.locator("#dropdown");
    await dropdown.selectOption("1");
    await expect(dropdown).toHaveValue("1");
    await dropdown.selectOption("2");
    await expect(dropdown).toHaveValue("2");
  });

  test("dropdown defaults to first option", async ({ page }) => {
    await page.goto(`${BASE}/dropdown`);
    await expect(page.locator("#dropdown")).toHaveValue("");
  });
});

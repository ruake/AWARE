import { test, expect } from "@playwright/test";

const BASE = "https://the-internet.herokuapp.com";

test.describe("Dynamic Content and Loading", () => {
  test("dynamic loading hidden element appears", async ({ page }) => {
    await page.goto(`${BASE}/dynamic_loading/1`);
    await page.click("#start button");
    await expect(page.locator("#finish h4")).toHaveText("Hello World!", { timeout: 10000 });
  });

  test("dynamic loading rendered after fetch", async ({ page }) => {
    await page.goto(`${BASE}/dynamic_loading/2`);
    await page.click("#start button");
    await expect(page.locator("#finish h4")).toHaveText("Hello World!", { timeout: 10000 });
  });

  test("dynamic content has at least one element", async ({ page }) => {
    await page.goto(`${BASE}/dynamic_content`);
    const rows = page.locator(".large-10.columns .row");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("floating menu disappears on scroll", async ({ page }) => {
    await page.goto(`${BASE}/floating_menu`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const menu = page.locator("#menu");
    await expect(menu).toBeVisible();
  });
});

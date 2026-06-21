import { test, expect } from "@playwright/test";

test.describe("Smoke tests @suite_continuous", () => {
  test("homepage returns 200 @smoke", async ({ request }) => {
    const res = await request.get(process.env.BASE_URL || "https://www.akamai.com");
    expect(res.ok()).toBeTruthy();
  });

  test("homepage has title @smoke", async ({ page }) => {
    await page.goto(process.env.BASE_URL || "https://www.akamai.com");
    await expect(page).toHaveTitle(/Akamai/);
  });
});

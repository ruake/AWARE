import { test, expect } from "@playwright/test";

const PAGES = [
  { path: "/", heading: /Regression Dashboard/ },
  { path: "/pulse", heading: /Pulse/ },
  { path: "/runs", heading: /Regression Runs/ },
  { path: "/compare", heading: /Compare/ },
  { path: "/analytics", heading: /Test Analytics/ },
  { path: "/suites", heading: /Test Suites/ },
  { path: "/copilot", heading: /Copilot/ },
  { path: "/ci-pipeline", heading: /CI Pipeline/ },
  { path: "/about", heading: /PROOF/ },
];

test.describe("App Navigation", () => {
  for (const { path, heading } of PAGES) {
    test(`${path} page loads with correct heading`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible({ timeout: 10000 });
    });
  }

  test("sidebar nav links navigate correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    const links = page.locator("nav a");
    const count = await links.count();
    expect(count).toBeGreaterThan(5);

    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href && href.startsWith("/")) hrefs.push(href);
    }

    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/pulse");
    expect(hrefs).toContain("/runs");
    expect(hrefs).toContain("/copilot");
  });

  test("keyboard shortcut g+d navigates to Dashboard", async ({ page }) => {
    await page.goto("/about");
    await page.keyboard.press("g");
    await page.keyboard.press("d");
    await expect(page).toHaveURL(/\/$/);
  });

  test("keyboard shortcut g+r navigates to Runs", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("g");
    await page.keyboard.press("r");
    await expect(page).toHaveURL(/\/runs/);
  });

  test("keyboard shortcut ?/ opens command palette", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("/");
    await expect(page.getByPlaceholder(/type a command/i).first()).toBeVisible({ timeout: 3000 });
  });

  test("404 page for unknown routes", async ({ page }) => {
    await page.goto("/nonexistent-route-xyz");
    await expect(page.getByText(/404|not found/i).first()).toBeVisible({ timeout: 5000 });
  });
});

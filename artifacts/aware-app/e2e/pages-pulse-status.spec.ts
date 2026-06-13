import { test, expect } from "@playwright/test";

test.describe("Pulse Page", () => {
  test("Pulse page loads with status feed", async ({ page }) => {
    await page.goto("/pulse");
    await expect(page.getByRole("heading", { name: /Pulse/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/status|running|passed|failed/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("Pulse page shows environment badges", async ({ page }) => {
    await page.goto("/pulse");
    await expect(page.getByText(/QA|UAT|PROD/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("Pulse page run cards link to run details", async ({ page }) => {
    await page.goto("/pulse");
    const runLinks = page.locator("a[href*='/runs/']");
    const count = await runLinks.count();
    if (count > 0) {
      await runLinks.first().click();
      await expect(page).toHaveURL(/\/runs\//);
    }
  });
});

test.describe("CI Pipeline Page", () => {
  test("CI Pipeline page loads", async ({ page }) => {
    await page.goto("/ci-pipeline");
    await expect(page.getByRole("heading", { name: /CI Pipeline/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/test-runner|promotion-gate|controller/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("CI Pipeline shows pipeline stages", async ({ page }) => {
    await page.goto("/ci-pipeline");
    const stages = ["Git Push", "Controller", "test-runner", "promotion-gate"];
    for (const stage of stages) {
      await expect(page.getByText(stage).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test("CI Pipeline has YAML config download", async ({ page }) => {
    await page.goto("/ci-pipeline");
    await expect(page.getByText(/download|config|yaml/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("CI Pipeline shows run frequency heatmap", async ({ page }) => {
    await page.goto("/ci-pipeline");
    await expect(page.getByText(/run frequency|heatmap|calendar/i).first()).toBeVisible({ timeout: 5000 });
  });
});

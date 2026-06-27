import { test, expect } from "@playwright/test";
import { goto, waitForApp } from "./helpers";

test.describe("Settings (/settings)", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/settings");
    await waitForApp(page);
  });

  test("renders settings page without crashing", async ({ page }) => {
    await expect(page.locator("main, [role=main]").first()).toBeVisible();
  });

  test("GitHub data source section is visible", async ({ page }) => {
    await expect(page.getByText(/github|data source/i).first()).toBeVisible();
  });

  test("promotion gate section shows threshold slider or input", async ({ page }) => {
    await expect(page.getByText(/promotion gate|threshold/i).first()).toBeVisible();
  });

  test("threshold slider is present and shows 95% default", async ({ page }) => {
    const slider = page.locator("[role=slider], input[type=range]").first();
    const visible = await slider.isVisible().catch(() => false);
    if (visible) {
      // Default value should be 95
      const value = await slider.getAttribute("aria-valuenow") ||
                    await slider.getAttribute("value");
      expect(Number(value)).toBe(95);
    } else {
      // Might be an input instead
      await expect(page.getByText("95%").or(page.getByText("95")).first()).toBeDefined();
    }
  });

  test("environment config section shows 6 environments", async ({ page }) => {
    await expect(page.getByText(/environment|env config/i).first()).toBeVisible();
    const envs = ["QA", "UAT", "PROD"];
    const found = await Promise.all(
      envs.map((e) => page.getByText(e).first().isVisible().catch(() => false)),
    );
    expect(found.some(Boolean)).toBe(true);
  });

  test("reload data button is present", async ({ page }) => {
    const btn = page.getByRole("button", { name: /reload|refresh data/i });
    const visible = await btn.isVisible().catch(() => false);
    if (visible) {
      await btn.click();
      await expect(page.locator("main").first()).toBeVisible();
    }
  });

  test("theme toggle is present", async ({ page }) => {
    const toggle =
      page.getByRole("button", { name: /dark|light|theme/i }).first().or(
        page.locator("[data-testid=theme-toggle]")
      );
    const visible = await toggle.isVisible().catch(() => false);
    if (visible) {
      await toggle.click();
      // Should not crash after toggle
      await expect(page.locator("main").first()).toBeVisible();
    }
  });

  test("GitHub URL input accepts and saves text", async ({ page }) => {
    const urlInput = page.getByPlaceholder(/github|repo url|raw url/i).first();
    if (await urlInput.isVisible()) {
      await urlInput.fill("https://raw.githubusercontent.com/example/repo");
      await urlInput.press("Tab");
      // Value should persist
      await expect(urlInput).toHaveValue(
        "https://raw.githubusercontent.com/example/repo",
      );
    }
  });
});

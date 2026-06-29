import { test, expect } from "@playwright/test";

const BASE = "https://the-internet.herokuapp.com";

test.describe("Login Page Authentication", () => {
  test("successful login with valid credentials", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill("#username", "tomsmith");
    await page.fill("#password", "SuperSecretPassword!");
    await page.click("button[type=submit]");
    await expect(page.locator(".flash.success")).toBeVisible();
    await expect(page).toHaveURL(/\/secure/);
    await expect(page.locator(".subheader")).toContainText("Secure Area");
  });

  test("failed login with invalid password", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill("#username", "tomsmith");
    await page.fill("#password", "wrongpassword");
    await page.click("button[type=submit]");
    await expect(page.locator(".flash.error")).toBeVisible();
    await expect(page).not.toHaveURL(/\/secure/);
  });

  test("failed login with empty username", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill("#password", "SuperSecretPassword!");
    await page.click("button[type=submit]");
    await expect(page.locator(".flash.error")).toBeVisible();
  });

  test("logout from secure area", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill("#username", "tomsmith");
    await page.fill("#password", "SuperSecretPassword!");
    await page.click("button[type=submit]");
    await page.click("a.button.secondary");
    await expect(page.locator(".flash.success")).toContainText("logged out");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page displays correct title", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page).toHaveTitle("The Internet");
    await expect(page.locator("h2")).toContainText("Login Page");
  });
});

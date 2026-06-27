import { test, expect } from "@playwright/test";
import { goto, waitForApp } from "./helpers";

test.describe("Navigation & Layout", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/");
    await waitForApp(page);
  });

  test("header shows brand name and subtitle", async ({ page }) => {
    await expect(page.getByText("A.W.A.R.E.")).toBeVisible();
    await expect(page.getByText(/akamai web analytics regression engine/i)).toBeVisible();
  });

  test("header has Refresh button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /refresh/i })).toBeVisible();
  });

  test("sidebar Overview section has Dashboard and Runs links", async ({ page }) => {
    const sidebar = page.locator("nav, aside, [data-testid=sidebar]").first();
    await expect(page.getByRole("link", { name: /dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /runs/i }).first()).toBeVisible();
  });

  test("sidebar Analysis section has Compare and Trends", async ({ page }) => {
    await expect(page.getByRole("link", { name: /compare/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /trends/i }).first()).toBeVisible();
  });

  test("sidebar Tools section has Copilot, Tests, Status", async ({ page }) => {
    await expect(page.getByRole("link", { name: /copilot/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /tests/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /status/i }).first()).toBeVisible();
  });

  test("sidebar Config section has Settings", async ({ page }) => {
    await expect(page.getByRole("link", { name: /settings/i }).first()).toBeVisible();
  });

  test("promotion gate status bar is visible at bottom", async ({ page }) => {
    await expect(page.getByText(/promotion gate/i)).toBeVisible();
    await expect(page.getByText(/uat pass rate/i)).toBeVisible();
  });

  test("navigating to Runs via sidebar works", async ({ page }) => {
    await page.getByRole("link", { name: /^runs$/i }).first().click();
    await expect(page).toHaveURL(/\/runs/);
    await expect(page.getByText("Run History")).toBeVisible();
  });

  test("navigating to Compare via sidebar works", async ({ page }) => {
    await page.getByRole("link", { name: /compare/i }).first().click();
    await expect(page).toHaveURL(/\/compare/);
    await expect(page.getByText(/compare runs/i)).toBeVisible();
  });

  test("navigating to Trends via sidebar works", async ({ page }) => {
    await page.getByRole("link", { name: /trends/i }).first().click();
    await expect(page).toHaveURL(/\/trends/);
  });

  test("navigating to Copilot via sidebar works", async ({ page }) => {
    await page.getByRole("link", { name: /copilot/i }).first().click();
    await expect(page).toHaveURL(/\/copilot/);
  });

  test("navigating to Status via sidebar works", async ({ page }) => {
    await page.getByRole("link", { name: /status/i }).first().click();
    await expect(page).toHaveURL(/\/status/);
  });

  test("navigating to Tests via sidebar works", async ({ page }) => {
    await page.getByRole("link", { name: /^tests$/i }).first().click();
    await expect(page).toHaveURL(/\/tests/);
  });

  test("navigating to Settings via sidebar works", async ({ page }) => {
    await page.getByRole("link", { name: /settings/i }).first().click();
    await expect(page).toHaveURL(/\/settings/);
  });
});

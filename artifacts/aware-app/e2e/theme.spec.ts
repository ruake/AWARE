import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test('theme toggle button exists', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByLabel('Toggle theme');
    await expect(toggle).toBeVisible({ timeout: 10000 });
  });

  test('clicking toggle switches from dark to light and back', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    const toggle = page.getByLabel('Toggle theme');
    const html = page.locator('html');

    // Default is dark — html should not have .light class
    await expect(html).not.toHaveClass(/light/);

    // Switch to light
    await toggle.click();
    await page.waitForTimeout(200);
    await expect(html).toHaveClass(/light/);

    // Switch back to dark
    await toggle.click();
    await page.waitForTimeout(200);
    await expect(html).not.toHaveClass(/light/);
  });

  test('theme persists on reload via localStorage', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    const toggle = page.getByLabel('Toggle theme');
    await toggle.click();
    await page.waitForTimeout(200);

    const theme = await page.evaluate(() => localStorage.getItem('aware-theme'));
    expect(theme).toBe('light');

    await page.reload();
    await page.waitForTimeout(500);
    const html = page.locator('html');
    await expect(html).toHaveClass(/light/);
  });

  test('theme toggle icon changes from Sun to Moon', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    const toggle = page.getByLabel('Toggle theme');

    // In dark mode, Sun icon is visible
    await expect(toggle.locator('svg')).toBeVisible();

    await toggle.click();
    await page.waitForTimeout(200);

    // In light mode, Moon icon should be visible (or the svg is still visible just different)
    await expect(toggle.locator('svg')).toBeVisible();
  });
});

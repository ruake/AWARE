import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('page loads and shows the logo and heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('A.W.A.R.E.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Regression Dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test('KPI cards show telemetry data', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Total Runs')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Total Failures')).toBeVisible();
    await expect(page.getByText('Avg Pass Rate')).toBeVisible();
    await expect(page.getByText('Environments')).toBeVisible();
    await expect(page.getByText('QA · UAT · PROD')).toBeVisible();
  });

  test('env tiles are rendered for QA, UAT, PROD', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Quality Assurance').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('User Acceptance').first()).toBeVisible();
    await expect(page.getByText('Production').first()).toBeVisible();
  });

  test('each env tile links to the runs page filtered by env', async ({ page }) => {
    await page.goto('/');
    const qaTile = page.getByText('Quality Assurance').first();
    await qaTile.click();
    await expect(page).toHaveURL(/\/runs\?env=QA/);
  });

  test('recent runs table is present with correct columns', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Recent Runs')).toBeVisible({ timeout: 10000 });
    const headers = ['Run / Label', 'Env', 'Suite', 'Pass Rate', 'Failures', 'Duration', 'When', 'Status'];
    for (const h of headers) {
      await expect(page.getByRole('table').first().getByText(h)).toBeVisible();
    }
  });

  test('navigation links are present in the header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Runs' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Compare' })).toBeVisible();
  });

  test('navigation links navigate correctly', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Runs' }).click();
    await expect(page).toHaveURL(/\/runs/);
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

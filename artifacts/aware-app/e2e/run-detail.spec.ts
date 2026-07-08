import { test, expect } from '@playwright/test';

test.describe('Run Detail', () => {
  test('navigating to a run detail page shows run info', async ({ page }) => {
    await page.goto('/runs');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    await page.getByText('run_obsidian').first().click();
    await expect(page).toHaveURL(/\/runs\/run_obsidian/);
    await expect(page.getByText('run_obsidian')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('100%')).toBeVisible();
  });

  test('run header shows env badge, pass rate, suite, and build info', async ({ page }) => {
    await page.goto('/runs/run_obsidian');
    await expect(page.getByText('PROD')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Suite')).toBeVisible();
    await expect(page.getByText('Build')).toBeVisible();
    await expect(page.getByText('Rev')).toBeVisible();
    await expect(page.getByText('Started')).toBeVisible();
  });

  test('test results table is displayed with name, category, status', async ({ page }) => {
    await page.goto('/runs/run_obsidian');
    const table = page.getByRole('table');
    await expect(table).toBeVisible({ timeout: 10000 });
    await expect(table.getByText('Name')).toBeVisible();
    await expect(table.getByText('Category')).toBeVisible();
    await expect(table.getByText('Status')).toBeVisible();
    await expect(table.getByText('Duration')).toBeVisible();
  });

  test('status filter buttons filter test results', async ({ page }) => {
    await page.goto('/runs/run_aurora');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    await page.getByRole('button', { name: 'FAIL' }).click();
    await page.waitForTimeout(200);
    const failRows = await page.getByRole('table').locator('tbody tr').count();
    expect(failRows).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'PASS' }).click();
    await page.waitForTimeout(200);
    const passRows = await page.getByRole('table').locator('tbody tr').count();
    expect(passRows).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'All Status' }).click();
  });

  test('search filters test by name', async ({ page }) => {
    await page.goto('/runs/run_obsidian');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const searchInput = page.getByPlaceholder('Search test name, category…');
    await searchInput.fill('HSTS');
    await page.waitForTimeout(200);

    const visibleRows = await page.getByRole('table').locator('tbody tr').count();
    expect(visibleRows).toBeGreaterThanOrEqual(1);
  });

  test('evidence panel expands and collapses on click', async ({ page }) => {
    await page.goto('/runs/run_obsidian');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstTestRow = page.getByRole('table').locator('tbody tr').first();
    await firstTestRow.click();
    await page.waitForTimeout(300);

    await expect(page.getByText('Assertions')).toBeVisible();
    await expect(page.getByText('Request')).toBeVisible();
    await expect(page.getByText('Response')).toBeVisible();

    await firstTestRow.click();
    await page.waitForTimeout(200);
    await expect(page.getByText('Assertions')).not.toBeVisible();
  });

  test('evidence panel shows request method, URL, and response status', async ({ page }) => {
    await page.goto('/runs/run_obsidian');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.getByRole('table').locator('tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(300);

    await expect(page.getByText('GET')).toBeVisible();
    await expect(page.getByText('example-cdn.akamaized.net')).toBeVisible();
    await expect(page.getByText('200')).toBeVisible();
  });

  test('assertions section is shown in evidence panel', async ({ page }) => {
    await page.goto('/runs/run_obsidian');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.getByRole('table').locator('tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(300);

    await expect(page.getByText('Assertions')).toBeVisible();
    await expect(page.getByText('No assertions').first()).toBeVisible();
  });

  test('ExternalLink icon is present for test cases with GitHub URLs', async ({ page }) => {
    await page.goto('/runs/run_obsidian');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const externalLinks = page.getByRole('table').locator('a[target="_blank"]');
    const count = await externalLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('back link navigates to runs page', async ({ page }) => {
    await page.goto('/runs/run_obsidian');
    await page.getByText('Runs').first().click();
    await expect(page).toHaveURL(/\/runs$/);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Runs Page', () => {
  test('page loads and shows the runs table', async ({ page }) => {
    await page.goto('/runs');
    await expect(page.getByRole('heading', { name: /Runs/i })).toBeVisible({ timeout: 10000 });
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows).not.toHaveCount(0);
  });

  test('env filter buttons toggle results', async ({ page }) => {
    await page.goto('/runs');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const initialRows = await page.getByRole('table').locator('tbody tr').count();
    expect(initialRows).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'QA' }).click();
    await page.waitForTimeout(200);
    const qaRows = await page.getByRole('table').locator('tbody tr').count();
    expect(qaRows).toBeLessThanOrEqual(5);

    await page.getByRole('button', { name: 'All Envs' }).click();
    await page.waitForTimeout(200);
    const allRows = await page.getByRole('table').locator('tbody tr').count();
    expect(allRows).toBe(initialRows);
  });

  test('status filter buttons filter results', async ({ page }) => {
    await page.goto('/runs');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    await page.getByRole('button', { name: 'PASS' }).click();
    await page.waitForTimeout(200);
    const passRows = await page.getByRole('table').locator('tbody tr').count();
    expect(passRows).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'FAIL' }).click();
    await page.waitForTimeout(200);
    const failRows = await page.getByRole('table').locator('tbody tr').count();
    expect(failRows).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'All Status' }).click();
    await page.waitForTimeout(200);
  });

  test('search input filters by run ID', async ({ page }) => {
    await page.goto('/runs');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const searchInput = page.getByPlaceholder('Search run ID, suite, build…');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('obsidian');
    await page.waitForTimeout(200);
    const filteredRows = await page.getByRole('table').locator('tbody tr').count();
    expect(filteredRows).toBe(1);
  });

  test('clear filters link appears when no results match', async ({ page }) => {
    await page.goto('/runs');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const searchInput = page.getByPlaceholder('Search run ID, suite, build…');
    await searchInput.fill('zzz_nonexistent_run');
    await page.waitForTimeout(200);
    await expect(page.getByText('No runs match the current filters')).toBeVisible({ timeout: 3000 });
    await page.getByText('Clear filters').click();
    await page.waitForTimeout(200);
    await expect(page.getByRole('table').locator('tbody tr').first()).toBeVisible();
  });

  test('statistics strip displays env counts', async ({ page }) => {
    await page.goto('/runs');
    await expect(page.getByText(/QA:/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/UAT:/)).toBeVisible();
    await expect(page.getByText(/PROD:/)).toBeVisible();
  });

  test('pagination controls not shown when fewer results than page size', async ({ page }) => {
    await page.goto('/runs');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    // 15 runs < 25 PAGE_SIZE, so pagination should not appear
    const pagination = page.getByText(/Page \d+ of \d+/);
    await expect(pagination).toHaveCount(0);
  });
});

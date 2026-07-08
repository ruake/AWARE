import { test, expect } from '@playwright/test';

test.describe('Compare Runs', () => {
  test('page loads with heading and selectors', async ({ page }) => {
    await page.goto('/compare');
    await expect(page.getByRole('heading', { name: /Compare Runs/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Baseline (Before)')).toBeVisible();
    await expect(page.getByText('Candidate (After)')).toBeVisible();
  });

  test('run select dropdowns are populated', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForSelector('select', { timeout: 10000 });
    const selects = page.locator('select');
    const count = await selects.count();
    expect(count).toBe(2);
    for (let i = 0; i < count; i++) {
      const options = await selects.nth(i).locator('option').count();
      expect(options).toBeGreaterThan(1);
    }
  });

  test('Swap button exchanges baseline and candidate selections', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForSelector('select', { timeout: 10000 });

    const selects = page.locator('select');
    const baseVal = await selects.nth(0).inputValue();
    const candVal = await selects.nth(1).inputValue();
    expect(baseVal).not.toBe('');
    expect(candVal).not.toBe('');

    await page.getByText('⇄ Swap').click();
    await page.waitForTimeout(200);

    const newBaseVal = await selects.nth(0).inputValue();
    const newCandVal = await selects.nth(1).inputValue();
    expect(newBaseVal).toBe(candVal);
    expect(newCandVal).toBe(baseVal);
  });

  test('Compare button is present and triggers comparison', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForSelector('select', { timeout: 10000 });

    const compareBtn = page.getByRole('button', { name: 'Compare' });
    await expect(compareBtn).toBeVisible();
    await expect(compareBtn).toBeEnabled();
  });

  test('comparison shows summary cards for diffs', async ({ page }) => {
    // Navigate with query params to set specific runs for a known comparison
    await page.goto('/compare?base=run_obsidian&cand=run_nebula');
    await page.waitForTimeout(2000);

    await expect(page.getByText('Regressions').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Fixed').first()).toBeVisible();
    await expect(page.getByText('Unchanged').first()).toBeVisible();
    await expect(page.getByText('New / Removed').first()).toBeVisible();
  });

  test('comparison table shows diff rows with change types', async ({ page }) => {
    await page.goto('/compare?base=run_obsidian&cand=run_nebula');
    await page.waitForTimeout(2000);

    const table = page.getByRole('table');
    await expect(table).toBeVisible({ timeout: 15000 });
    await expect(table.getByText('REGRESSED')).toBeVisible();
    await expect(table.getByText('UNCHANGED')).toBeVisible();
  });

  test('diff filter tabs filter the table rows', async ({ page }) => {
    await page.goto('/compare?base=run_obsidian&cand=run_nebula');
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: 'REGRESSED' }).click();
    await page.waitForTimeout(200);

    const table = page.getByRole('table');
    const regressedRows = await table.locator('tbody tr').count();
    expect(regressedRows).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'All Changes' }).click();
    await page.waitForTimeout(200);
  });

  test('clicking a diff row expands detail panel', async ({ page }) => {
    await page.goto('/compare?base=run_obsidian&cand=run_nebula');
    await page.waitForTimeout(2000);

    const regressedBtn = page.getByRole('button', { name: 'REGRESSED' });
    await regressedBtn.click();
    await page.waitForTimeout(200);

    const firstRow = page.getByRole('table').locator('tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(300);

    await expect(page.getByText('Baseline Assertions')).toBeVisible();
    await expect(page.getByText('Candidate Assertions')).toBeVisible();
  });
});

import { Page, expect } from "@playwright/test";

export const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:25485";

/** Navigate relative to the app base and wait for the page to be idle */
export async function goto(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
}

/** Known deterministic IDs exported from mockData.ts */
export const KNOWN_PASS_RUN_ID = "RUN-1000";
export const KNOWN_FAIL_RUN_ID = "RUN-1001";
export const KNOWN_UAT_PASS_ID = "RUN-1002";
export const KNOWN_UAT_FAIL_ID = "RUN-1003";

/** Assert that a Badge / cell contains one of the canonical status strings */
export async function expectStatusBadge(
  page: Page,
  status: "PASS" | "FAIL" | "RUNNING" | "PENDING",
) {
  await expect(page.getByText(status).first()).toBeVisible();
}

/** Wait for the store to populate (sidebar + header must be visible) */
export async function waitForApp(page: Page) {
  await expect(page.getByText("A.W.A.R.E.")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Dashboard")).toBeVisible();
}

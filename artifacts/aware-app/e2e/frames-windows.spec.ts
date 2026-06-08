import { test, expect } from "@playwright/test";

const BASE = "https://the-internet.herokuapp.com";

test.describe("Frames and Windows", () => {
  test("iframe editor loads with content", async ({ page }) => {
    await page.goto(`${BASE}/iframe`);
    const frame = page.frameLocator("#mce_0_ifr");
    const editor = frame.locator("#tinymce");
    await expect(editor).toBeVisible({ timeout: 10000 });
    const text = await editor.innerText();
    expect(text.length).toBeGreaterThan(0);
  });

  test("nested frames contain text", async ({ page }) => {
    await page.goto(`${BASE}/nested_frames`);
    const top = page.frameLocator("frame[name=frame-top]");
    const left = top.frameLocator("frame[name=frame-left]");
    await expect(left.locator("body")).toHaveText("LEFT");
    const bottom = page.frameLocator("frame[name=frame-bottom]");
    await expect(bottom.locator("body")).toContainText("BOTTOM");
  });

  test("open new window tab", async ({ page, context }) => {
    await page.goto(`${BASE}/windows`);
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      page.click("a:has-text('Click Here')"),
    ]);
    await newPage.waitForLoadState();
    await expect(newPage.locator("h3")).toHaveText("New Window");
  });
});

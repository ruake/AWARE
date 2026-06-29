// @ts-nocheck
/*
 * Puppeteer CDN screenshot tests for Akamai edge properties.
 * Discovered by discover-puppeteer.mjs; run by scripts/run-puppeteer.mjs
 * Tests Puppeteer's screenshot and visual capture capabilities.
 */

const TEST_BASE = process.env.BASE_URL || "https://www.akamai.com";

async function takeScreenshot(page, url, name) {
  await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
  const buf = await page.screenshot({ fullPage: true });
  return { buffer: buf, base64: buf.toString("base64") };
}

function test(name, fn) { if (typeof globalThis.__puppeteerRegister === "function") globalThis.__puppeteerRegister(name, "Screenshots", "akamai-puppeteer", fn); }

test.describe("Puppeteer CDN Screenshot Tests", () => {

  test("capture Akamai homepage full-page screenshot", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    try {
      const result = await takeScreenshot(page, TEST_BASE, "homepage");
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "capture Akamai homepage full-page screenshot",
          category: "Screenshots",
          status: result.buffer.length > 0 ? "passed" : "failed",
          screenshotData: `data:image/png;base64,${result.base64}`,
        });
      }
    } finally {
      await page.close();
    }
  });

  test("capture /en page screenshot", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    try {
      const result = await takeScreenshot(page, `${TEST_BASE}/en`, "en-page");
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "capture /en page screenshot",
          category: "Screenshots",
          status: result.buffer.length > 0 ? "passed" : "failed",
          screenshotData: `data:image/png;base64,${result.base64}`,
        });
      }
    } finally {
      await page.close();
    }
  });

  test("capture robots.txt as rendered", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    try {
      const result = await takeScreenshot(page, `${TEST_BASE}/robots.txt`, "robots-txt");
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "capture robots.txt as rendered",
          category: "Screenshots",
          status: result.buffer.length > 0 ? "passed" : "failed",
          screenshotData: `data:image/png;base64,${result.base64}`,
        });
      }
    } finally {
      await page.close();
    }
  });

  test("capture sitemap.xml screenshot", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    try {
      const result = await takeScreenshot(page, `${TEST_BASE}/sitemap.xml`, "sitemap");
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "capture sitemap.xml screenshot",
          category: "Screenshots",
          status: result.buffer.length > 0 ? "passed" : "failed",
          screenshotData: `data:image/png;base64,${result.base64}`,
        });
      }
    } finally {
      await page.close();
    }
  });
});

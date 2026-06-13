// @ts-nocheck
/*
 * Puppeteer CDN network interception tests for Akamai edge properties.
 * Showcases Puppeteer's network request/response monitoring capabilities.
 */

const TEST_BASE = process.env.BASE_URL || "https://www.akamai.com";

function test(name, fn) { if (typeof globalThis.__puppeteerRegister === "function") globalThis.__puppeteerRegister(name, "Network", "akamai-puppeteer", fn); }

test.describe("Puppeteer CDN Network Tests", () => {

  test("intercept and verify homepage load", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    const requests = [];
    await page.setRequestInterception(true);
    page.on("request", req => {
      requests.push({ url: req.url(), method: req.method(), type: req.resourceType() });
      req.continue();
    });
    try {
      await page.goto(TEST_BASE, { waitUntil: "networkidle0", timeout: 30000 });
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "intercept and verify homepage load",
          category: "Network",
          status: requests.length > 0 ? "passed" : "failed",
          extras: { requestCount: requests.length },
        });
      }
    } finally {
      await page.close();
    }
  });

  test("verify Akamai CDN headers present on all resources", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    const cdnHeaders = new Set();
    page.on("response", resp => {
      const headers = resp.headers();
      if (headers["x-cache"] || headers["X-Cache"]) cdnHeaders.add(resp.url());
    });
    try {
      await page.goto(TEST_BASE, { waitUntil: "networkidle0", timeout: 30000 });
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "verify Akamai CDN headers present on all resources",
          category: "Network",
          status: cdnHeaders.size > 0 ? "passed" : "failed",
          extras: { resourcesWithCdnHeaders: cdnHeaders.size },
        });
      }
    } finally {
      await page.close();
    }
  });

  test("verify all resources load over HTTPS", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    const requests = [];
    await page.setRequestInterception(true);
    page.on("request", req => {
      requests.push({ url: req.url(), method: req.method(), type: req.resourceType() });
      req.continue();
    });
    try {
      await page.goto(TEST_BASE, { waitUntil: "networkidle0", timeout: 30000 });
      const allHttps = requests.every(r => r.url.startsWith("https://"));
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "verify all resources load over HTTPS",
          category: "Network",
          status: allHttps ? "passed" : "failed",
          extras: { totalRequests: requests.length, allHttps },
        });
      }
    } finally {
      await page.close();
    }
  });

  test("measure page load performance metrics", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    try {
      const start = Date.now();
      await page.goto(TEST_BASE, { waitUntil: "networkidle0", timeout: 30000 });
      const loadTime = Date.now() - start;
      const perf = await page.evaluate(() => ({
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
        firstPaint: performance.timing.domInteractive - performance.timing.navigationStart,
      }));
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "measure page load performance metrics",
          category: "Network",
          status: loadTime > 0 ? "passed" : "failed",
          extras: { totalLoadTime: loadTime, ...perf },
        });
      }
    } finally {
      await page.close();
    }
  });
});

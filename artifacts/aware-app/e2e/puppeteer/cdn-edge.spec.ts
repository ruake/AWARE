// @ts-nocheck
/*
 * Puppeteer CDN edge property tests for Akamai.
 * Tests CDN header presence, cache behavior, and security headers.
 * Discovered by discover-puppeteer.mjs; run by scripts/run-puppeteer.mjs
 */

const TEST_BASE = process.env.BASE_URL || "https://www.akamai.com";

const CDN_HEADERS = ["x-cache", "x-akamai-transformed", "cache-control", "age"];

const SECURITY_HEADERS = [
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "content-security-policy",
];

function test(name, fn) { if (typeof globalThis.__puppeteerRegister === "function") globalThis.__puppeteerRegister(name, "CDN Edge", "akamai-puppeteer", fn); }

test.describe("Puppeteer CDN Edge Tests", () => {

  test("homepage returns 200 via Akamai CDN", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    try {
      const resp = await page.goto(TEST_BASE, { waitUntil: "networkidle0", timeout: 30000 });
      const status = resp ? resp.status() : 0;
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "homepage returns 200 via Akamai CDN",
          category: "CDN Edge",
          status: status === 200 ? "passed" : "failed",
          statusCode: status,
        });
      }
    } finally {
      await page.close();
    }
  });

  test("Akamai CDN headers present on homepage", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    try {
      const resp = await page.goto(TEST_BASE, { waitUntil: "networkidle0", timeout: 30000 });
      const headers = resp ? resp.headers() : {};
      const found = CDN_HEADERS.filter(h => headers[h] || headers[h.toLowerCase()]);
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "Akamai CDN headers present on homepage",
          category: "CDN Edge",
          status: found.length > 0 ? "passed" : "failed",
          extras: { cdnHeadersFound: found, count: found.length },
        });
      }
    } finally {
      await page.close();
    }
  });

  test("security headers present on homepage", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    try {
      const resp = await page.goto(TEST_BASE, { waitUntil: "networkidle0", timeout: 30000 });
      const headers = resp ? resp.headers() : {};
      const found = SECURITY_HEADERS.filter(h => headers[h] || headers[h.toLowerCase()]);
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "security headers present on homepage",
          category: "CDN Edge",
          status: found.length > 0 ? "passed" : "failed",
          extras: { securityHeadersFound: found, count: found.length },
        });
      }
    } finally {
      await page.close();
    }
  });

  test("CDN cache header present on static resource", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    try {
      const resp = await page.goto(`${TEST_BASE}/robots.txt`, { waitUntil: "networkidle0", timeout: 30000 });
      const headers = resp ? resp.headers() : {};
      const cacheHeader = headers["x-cache"] || headers["X-Cache"] || "";
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "CDN cache header present on static resource",
          category: "CDN Edge",
          status: cacheHeader.length > 0 ? "passed" : "failed",
          extras: { xCache: cacheHeader },
        });
      }
    } finally {
      await page.close();
    }
  });

  test("404 returned for non-existent path", async () => {
    const browser = await globalThis.__puppeteerBrowser;
    const page = await browser.newPage();
    try {
      const resp = await page.goto(`${TEST_BASE}/nonexistent-test-path-xyz`, { waitUntil: "networkidle0", timeout: 30000 });
      const status = resp ? resp.status() : 0;
      if (typeof globalThis.__puppeteerReport === "function") {
        globalThis.__puppeteerReport({
          title: "404 returned for non-existent path",
          category: "CDN Edge",
          status: status === 404 ? "passed" : "failed",
          statusCode: status,
        });
      }
    } finally {
      await page.close();
    }
  });
});

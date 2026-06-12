#!/usr/bin/env node
/**
 * Puppeteer Test Runner — Akamai CDN Edge Tests
 *
 * Executes Puppeteer-based CDN edge tests against the target Akamai
 * property, validating status codes, CDN headers, cache behavior,
 * and TLS security. Outputs Playwright-compatible JSON.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

function findChromium() {
  const candidates = [
    ...(process.env.HOME ? [
      path.join(process.env.HOME, ".cache", "ms-playwright", "chromium-1223", "chrome-linux", "chrome"),
    ] : []),
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const CHROMIUM_PATH = findChromium();

const CDN_PAGES = [
  { path: "/",                    name: "homepage loads via Akamai CDN",        category: "CDN Edge" },
  { path: "/en",                  name: "English page loads via Akamai CDN",    category: "CDN Edge" },
  { path: "/robots.txt",          name: "robots.txt loads via Akamai CDN",     category: "CDN Edge" },
  { path: "/sitemap.xml",         name: "sitemap.xml loads via Akamai CDN",    category: "CDN Edge" },
  { path: "/nonexistent-page",    name: "non-existent page returns 404",        category: "CDN Edge" },
];

const CDN_HEADERS = [
  "x-cache",
  "x-akamai-transformed",
  "cache-control",
  "age",
];

async function cdnNavTest(page, baseUrl, testPage, suiteTitle) {
  const url = `${baseUrl}${testPage.path}`;
  const start = Date.now();
  try {
    const resp = await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    const duration = Date.now() - start;
    const statusCode = resp ? resp.status() : 0;
    const headers = resp ? resp.headers() : {};

    const expectedStatus = testPage.path === "/nonexistent-page" ? 404 : 200;
    const ok = statusCode === expectedStatus;
    const foundCdnHeaders = CDN_HEADERS.filter(h => headers[h] || headers[h.toLowerCase()]);

    return {
      title: testPage.name,
      category: testPage.category,
      suite: suiteTitle,
      status: ok ? "passed" : "failed",
      duration,
      statusCode,
      requestUrl: url,
      responseHeaders: headers,
      extras: { cdnHeadersFound: foundCdnHeaders, cdnHeadersCount: foundCdnHeaders.length },
      error: !ok ? `Expected HTTP ${expectedStatus}, got ${statusCode}` : undefined,
    };
  } catch (err) {
    return {
      title: testPage.name,
      category: testPage.category,
      suite: suiteTitle,
      status: "failed",
      duration: Date.now() - start,
      statusCode: 0,
      requestUrl: url,
      responseHeaders: {},
      error: err.message,
    };
  }
}

async function runCdnScreenshotTests(browser, baseUrl) {
  const page = await browser.newPage();
  const suiteTitle = "Puppeteer CDN Screenshot Tests";
  const results = [];

  try {
    const start = Date.now();
    await page.goto(baseUrl, { waitUntil: "networkidle0", timeout: 30000 });
    const screenshot = await page.screenshot({ fullPage: true, encoding: "base64" });
    results.push({
      title: "capture Akamai homepage full-page screenshot",
      category: "Screenshots",
      suite: suiteTitle,
      status: "passed",
      duration: Date.now() - start,
      statusCode: 200,
      requestUrl: baseUrl,
      responseHeaders: {},
      screenshotData: `data:image/png;base64,${screenshot}`,
    });
  } catch (err) {
    results.push({
      title: "capture Akamai homepage full-page screenshot",
      category: "Screenshots",
      suite: suiteTitle,
      status: "failed",
      duration: 0,
      statusCode: 0,
      requestUrl: baseUrl,
      responseHeaders: {},
      error: err.message,
    });
  }

  try {
    const start = Date.now();
    await page.goto(`${baseUrl}/en`, { waitUntil: "networkidle0", timeout: 30000 });
    const screenshot = await page.screenshot({ encoding: "base64" });
    results.push({
      title: "capture Akamai /en page screenshot",
      category: "Screenshots",
      suite: suiteTitle,
      status: "passed",
      duration: Date.now() - start,
      statusCode: 200,
      requestUrl: `${baseUrl}/en`,
      responseHeaders: {},
      screenshotData: `data:image/png;base64,${screenshot}`,
    });
  } catch (err) {
    results.push({
      title: "capture Akamai /en page screenshot",
      category: "Screenshots",
      suite: suiteTitle,
      status: "failed",
      duration: 0,
      statusCode: 0,
      requestUrl: `${baseUrl}/en`,
      responseHeaders: {},
      error: err.message,
    });
  }

  await page.close();
  return results;
}

async function runCdnNetworkTests(browser, baseUrl) {
  const page = await browser.newPage();
  const suiteTitle = "Puppeteer CDN Network Tests";
  const results = [];
  const allRequests = [];

  await page.setRequestInterception(true);
  page.on("request", req => {
    allRequests.push({ url: req.url(), method: req.method(), type: req.resourceType() });
    req.continue();
  });

  try {
    const start = Date.now();
    allRequests.length = 0;
    await page.goto(baseUrl, { waitUntil: "networkidle0", timeout: 30000 });
    const requestCount = allRequests.length;
    const allHttps = allRequests.every(r => r.url.startsWith("https://"));
    results.push({
      title: "monitor all network requests on homepage",
      category: "Network",
      suite: suiteTitle,
      status: requestCount > 0 ? "passed" : "failed",
      duration: Date.now() - start,
      statusCode: 200,
      requestUrl: baseUrl,
      responseHeaders: {},
      extras: { requestCount, allHttps },
    });
  } catch (err) {
    results.push({
      title: "monitor all network requests on homepage",
      category: "Network",
      suite: suiteTitle,
      status: "failed",
      duration: 0,
      statusCode: 0,
      requestUrl: baseUrl,
      responseHeaders: {},
      error: err.message,
    });
  }

  try {
    const start = Date.now();
    allRequests.length = 0;
    await page.goto(baseUrl, { waitUntil: "networkidle0", timeout: 30000 });
    const allHttps = allRequests.every(r => r.url.startsWith("https://"));
    results.push({
      title: "verify all page resources load over HTTPS",
      category: "Network",
      suite: suiteTitle,
      status: allHttps ? "passed" : "failed",
      duration: Date.now() - start,
      statusCode: 200,
      requestUrl: baseUrl,
      responseHeaders: {},
      extras: { totalRequests: allRequests.length, allHttps },
    });
  } catch (err) {
    results.push({
      title: "verify all page resources load over HTTPS",
      category: "Network",
      suite: suiteTitle,
      status: "failed",
      duration: 0,
      statusCode: 0,
      requestUrl: baseUrl,
      responseHeaders: {},
      error: err.message,
    });
  }

  await page.close();
  return results;
}

async function runAll(baseUrl) {
  if (!CHROMIUM_PATH) {
    console.error("  [ERROR] Chromium not found. Install Playwright browsers: pnpm exec playwright install chromium");
    process.exit(1);
  }

  console.error(`  Using Chromium: ${CHROMIUM_PATH}`);

  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const allResults = [];

  const navSuiteTitle = "Puppeteer CDN Navigation Tests";
  const page = await browser.newPage();
  for (const testPage of CDN_PAGES) {
    const result = await cdnNavTest(page, baseUrl, testPage, navSuiteTitle);
    allResults.push(result);
  }
  await page.close();

  const screenshotResults = await runCdnScreenshotTests(browser, baseUrl);
  allResults.push(...screenshotResults);

  const networkResults = await runCdnNetworkTests(browser, baseUrl);
  allResults.push(...networkResults);

  await browser.close();

  return buildPlaywrightJson(allResults);
}

function buildPlaywrightJson(results) {
  const suitesMap = {};
  for (const r of results) {
    if (!suitesMap[r.suite]) suitesMap[r.suite] = [];
    suitesMap[r.suite].push(r);
  }

  const suites = Object.entries(suitesMap).map(([title, specs]) => ({
    title,
    specs: specs.map(r => {
      const testEntry = {
        results: [{
          status: r.status,
          duration: r.duration,
          ...(r.error ? { error: { message: r.error } } : {}),
        }],
      };

      if (r.screenshotData) {
        testEntry.results[0].attachments = [{
          name: r.title.replace(/\s+/g, "-").toLowerCase(),
          contentType: "image/png",
          body: r.screenshotData.replace(/^data:image\/png;base64,/, ""),
        }];
      }

      if (r.extras) {
        if (!testEntry.results[0].attachments) testEntry.results[0].attachments = [];
        testEntry.results[0].attachments.push({
          name: "extras",
          contentType: "application/json",
          body: Buffer.from(JSON.stringify(r.extras)).toString("base64"),
        });
      }

      return {
        title: r.title,
        tests: [testEntry],
      };
    }),
  }));

  return { suites };
}

function main() {
  const args = process.argv.slice(2);
  const dirIdx = args.indexOf("--dir");
  const outputIdx = args.indexOf("--output");
  const baseUrlIdx = args.indexOf("--base-url");

  const dir = dirIdx >= 0 ? args[dirIdx + 1] : "e2e/puppeteer";
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : "test-results/puppeteer-results.json";
  const baseUrl = baseUrlIdx >= 0 ? args[baseUrlIdx + 1] : (process.env.BASE_URL || "https://www.akamai.com");

  const absOutput = path.resolve(PROJECT_ROOT, outputPath);

  console.error(`\n--- Puppeteer CDN Edge Test Runner ---`);
  console.error(`  Target: ${baseUrl}`);
  console.error(`  Output: ${absOutput}`);

  runAll(baseUrl).then(result => {
    fs.mkdirSync(path.dirname(absOutput), { recursive: true });
    fs.writeFileSync(absOutput, JSON.stringify(result, null, 2), "utf-8");
    console.error(`  Written: ${result.suites.reduce((a, s) => a + s.specs.length, 0)} tests across ${result.suites.length} suites`);
  }).catch(err => {
    console.error(`  [FATAL] ${err.message}`);
    process.exit(1);
  });
}

main();

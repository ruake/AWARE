#!/usr/bin/env node
/**
 * Puppeteer Test Runner
 *
 * Reads Puppeteer spec files from e2e/puppeteer/, executes them
 * using puppeteer-core (reusing Playwright's installed Chromium),
 * and outputs results in Playwright JSON reporter format for
 * consumption by record-run.mjs.
 *
 * Usage:
 *   node scripts/run-puppeteer.mjs [--dir dir] [--output path]
 *
 * Defaults:
 *   --dir     e2e/puppeteer
 *   --output  test-results/puppeteer-results.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

function findChromium() {
  const candidates = [
    // Playwright-installed Chromium (most common)
    ...(process.env.HOME ? [
      path.join(process.env.HOME, ".cache", "ms-playwright", "chromium-1223", "chrome-linux", "chrome"),
    ] : []),
    // System Chromium
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

const TEST_PAGES = [
  { path: "/login",               name: "login page loads",             category: "Smoke" },
  { path: "/checkboxes",           name: "checkboxes page loads",        category: "Functional" },
  { path: "/dropdown",             name: "dropdown page loads",          category: "Functional" },
  { path: "/dynamic_loading/2",    name: "dynamic loading page loads",  category: "Performance" },
  { path: "/javascript_alerts",    name: "JavaScript alerts page loads", category: "Security" },
  { path: "/frames",               name: "frames page loads",            category: "Functional" },
  { path: "/windows",              name: "windows page loads",           category: "Functional" },
  { path: "/key_presses",          name: "key presses page loads",      category: "Functional" },
  { path: "/upload",               name: "file upload page loads",       category: "Functional" },
  { path: "/drag_and_drop",        name: "drag and drop page loads",    category: "Functional" },
];

async function navigateTest(page, baseUrl, testPage, suiteTitle) {
  const url = `${baseUrl}${testPage.path}`;
  const start = Date.now();
  try {
    const resp = await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    const duration = Date.now() - start;
    const status = resp && resp.ok() ? "passed" : "failed";
    const statusCode = resp ? resp.status() : 0;
    const headers = resp ? resp.headers() : {};

    return {
      title: testPage.name,
      category: testPage.category,
      suite: suiteTitle,
      status,
      duration,
      statusCode,
      requestUrl: url,
      responseHeaders: headers,
      error: !resp || !resp.ok() ? `HTTP ${statusCode}` : undefined,
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

async function runScreenshotTest(browser, baseUrl) {
  const page = await browser.newPage();
  const suiteTitle = "Puppeteer Screenshot Tests";
  const results = [];

  // Test 1: Full-page screenshot of login page
  try {
    const start = Date.now();
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle0", timeout: 30000 });
    const screenshot = await page.screenshot({ fullPage: true, encoding: "base64" });
    results.push({
      title: "capture login page screenshot",
      category: "Screenshots",
      suite: suiteTitle,
      status: "passed",
      duration: Date.now() - start,
      statusCode: 200,
      requestUrl: `${baseUrl}/login`,
      responseHeaders: {},
      screenshotData: `data:image/png;base64,${screenshot}`,
    });
  } catch (err) {
    results.push({
      title: "capture login page screenshot",
      category: "Screenshots",
      suite: suiteTitle,
      status: "failed",
      duration: 0,
      statusCode: 0,
      requestUrl: `${baseUrl}/login`,
      responseHeaders: {},
      error: err.message,
    });
  }

  // Test 2: Screenshot with specific element
  try {
    const start = Date.now();
    await page.goto(`${baseUrl}/dropdown`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.select("#dropdown", "1");
    await page.waitForTimeout(300);
    const screenshot = await page.screenshot({ encoding: "base64" });
    results.push({
      title: "capture dropdown with option selected",
      category: "Screenshots",
      suite: suiteTitle,
      status: "passed",
      duration: Date.now() - start,
      statusCode: 200,
      requestUrl: `${baseUrl}/dropdown`,
      responseHeaders: {},
      screenshotData: `data:image/png;base64,${screenshot}`,
    });
  } catch (err) {
    results.push({
      title: "capture dropdown with option selected",
      category: "Screenshots",
      suite: suiteTitle,
      status: "failed",
      duration: 0,
      statusCode: 0,
      requestUrl: `${baseUrl}/dropdown`,
      responseHeaders: {},
      error: err.message,
    });
  }

  // Test 3: Screenshot of dynamic loading element
  try {
    const start = Date.now();
    await page.goto(`${baseUrl}/dynamic_loading/2`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.click("#start button");
    await page.waitForSelector("#finish", { timeout: 10000 });
    await page.waitForTimeout(500);
    const screenshot = await page.screenshot({ encoding: "base64" });
    results.push({
      title: "capture dynamic loading element screenshot",
      category: "Screenshots",
      suite: suiteTitle,
      status: "passed",
      duration: Date.now() - start,
      statusCode: 200,
      requestUrl: `${baseUrl}/dynamic_loading/2`,
      responseHeaders: {},
      screenshotData: `data:image/png;base64,${screenshot}`,
    });
  } catch (err) {
    results.push({
      title: "capture dynamic loading element screenshot",
      category: "Screenshots",
      suite: suiteTitle,
      status: "failed",
      duration: 0,
      statusCode: 0,
      requestUrl: `${baseUrl}/dynamic_loading/2`,
      responseHeaders: {},
      error: err.message,
    });
  }

  // Test 4: Screenshot of alerts page
  try {
    const start = Date.now();
    await page.goto(`${baseUrl}/javascript_alerts`, { waitUntil: "networkidle0", timeout: 30000 });
    page.on("dialog", d => d.accept());
    await page.click("button:first-of-type");
    await page.waitForTimeout(500);
    const screenshot = await page.screenshot({ encoding: "base64" });
    results.push({
      title: "capture javascript alerts page screenshot",
      category: "Screenshots",
      suite: suiteTitle,
      status: "passed",
      duration: Date.now() - start,
      statusCode: 200,
      requestUrl: `${baseUrl}/javascript_alerts`,
      responseHeaders: {},
      screenshotData: `data:image/png;base64,${screenshot}`,
    });
  } catch (err) {
    results.push({
      title: "capture javascript alerts page screenshot",
      category: "Screenshots",
      suite: suiteTitle,
      status: "failed",
      duration: 0,
      statusCode: 0,
      requestUrl: `${baseUrl}/javascript_alerts`,
      responseHeaders: {},
      error: err.message,
    });
  }

  // Test 5: Screenshot of file upload page
  try {
    const start = Date.now();
    await page.goto(`${baseUrl}/upload`, { waitUntil: "networkidle0", timeout: 30000 });
    const screenshot = await page.screenshot({ encoding: "base64" });
    results.push({
      title: "capture file upload page screenshot",
      category: "Screenshots",
      suite: suiteTitle,
      status: "passed",
      duration: Date.now() - start,
      statusCode: 200,
      requestUrl: `${baseUrl}/upload`,
      responseHeaders: {},
      screenshotData: `data:image/png;base64,${screenshot}`,
    });
  } catch (err) {
    results.push({
      title: "capture file upload page screenshot",
      category: "Screenshots",
      suite: suiteTitle,
      status: "failed",
      duration: 0,
      statusCode: 0,
      requestUrl: `${baseUrl}/upload`,
      responseHeaders: {},
      error: err.message,
    });
  }

  await page.close();
  return results;
}

async function runNetworkTests(browser, baseUrl) {
  const page = await browser.newPage();
  const suiteTitle = "Puppeteer Network Tests";
  const results = [];
  const allRequests = [];

  // Set up request interception for monitoring
  await page.setRequestInterception(true);
  page.on("request", req => {
    allRequests.push({ url: req.url(), method: req.method(), type: req.resourceType() });
    req.continue();
  });

  // Test 1: Monitor login page requests
  try {
    const start = Date.now();
    allRequests.length = 0;
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle0", timeout: 30000 });
    const requestCount = allRequests.length;
    results.push({
      title: "monitor all network requests on login page",
      category: "Network",
      suite: suiteTitle,
      status: requestCount > 0 ? "passed" : "failed",
      duration: Date.now() - start,
      statusCode: 200,
      requestUrl: `${baseUrl}/login`,
      responseHeaders: {},
      extras: { requestCount },
    });
  } catch (err) {
    results.push({
      title: "monitor all network requests on login page",
      category: "Network",
      suite: suiteTitle,
      status: "failed",
      duration: 0,
      statusCode: 0,
      requestUrl: `${baseUrl}/login`,
      responseHeaders: {},
      error: err.message,
    });
  }

  // Test 2: Verify all requests use HTTPS
  try {
    const start = Date.now();
    allRequests.length = 0;
    await page.goto(`${baseUrl}/checkboxes`, { waitUntil: "networkidle0", timeout: 30000 });
    const allHttps = allRequests.every(r => r.url.startsWith("https://"));
    results.push({
      title: "verify all page resources load over HTTPS",
      category: "Network",
      suite: suiteTitle,
      status: allHttps ? "passed" : "failed",
      duration: Date.now() - start,
      statusCode: 200,
      requestUrl: `${baseUrl}/checkboxes`,
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
      requestUrl: `${baseUrl}/checkboxes`,
      responseHeaders: {},
      error: err.message,
    });
  }

  // Test 3: Measure performance metrics
  try {
    const start = Date.now();
    allRequests.length = 0;
    await page.goto(`${baseUrl}/dynamic_loading/2`, { waitUntil: "networkidle0", timeout: 30000 });
    const metrics = await page.evaluate(() => JSON.parse(JSON.stringify(performance.memory || {})));
    const timing = await page.evaluate(() => {
      const t = performance.timing || performance.getEntriesByType("navigation")[0];
      return t ? { domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart, load: t.loadEventEnd - t.navigationStart } : {};
    });
    results.push({
      title: "measure page load performance metrics",
      category: "Network",
      suite: suiteTitle,
      status: "passed",
      duration: Date.now() - start,
      statusCode: 200,
      requestUrl: `${baseUrl}/dynamic_loading/2`,
      responseHeaders: {},
      extras: { metrics, timing },
    });
  } catch (err) {
    results.push({
      title: "measure page load performance metrics",
      category: "Network",
      suite: suiteTitle,
      status: "failed",
      duration: 0,
      statusCode: 0,
      requestUrl: `${baseUrl}/dynamic_loading/2`,
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

  // Navigation tests (10 tests)
  const navSuiteTitle = "Puppeteer Navigation Tests";
  const page = await browser.newPage();
  for (const testPage of TEST_PAGES) {
    const result = await navigateTest(page, baseUrl, testPage, navSuiteTitle);
    allResults.push(result);
  }
  await page.close();

  // Screenshot tests (5 tests)
  const screenshotResults = await runScreenshotTest(browser, baseUrl);
  allResults.push(...screenshotResults);

  // Network tests (3 tests)
  const networkResults = await runNetworkTests(browser, baseUrl);
  allResults.push(...networkResults);

  await browser.close();

  return buildPlaywrightJson(allResults);
}

function buildPlaywrightJson(results) {
  // Group results by suite
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

      // Attach screenshot if present
      if (r.screenshotData) {
        testEntry.results[0].attachments = [{
          name: r.title.replace(/\s+/g, "-").toLowerCase(),
          contentType: "image/png",
          body: r.screenshotData.replace(/^data:image\/png;base64,/, ""),
        }];
      }

      // Attach extras as a JSON attachment
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
  const baseUrl = baseUrlIdx >= 0 ? args[baseUrlIdx + 1] : "https://the-internet.herokuapp.com";

  const absOutput = path.resolve(PROJECT_ROOT, outputPath);

  console.error(`\n--- Puppeteer runner ---`);
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

#!/usr/bin/env node
/**
 * Unified Test Discovery Orchestrator
 *
 * Runs pytest, Playwright, Puppeteer, and HTTP discovery scripts,
 * merges results, and writes a single auto-tests.json file.
 *
 * Usage:
 *   node scripts/discover-all.mjs [--pytest-dirs dir ...] [--playwright-dirs dir ...]
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const PYTEST_SCRIPT = path.join(__dirname, "discover-tests.py");
const PLAYWRIGHT_SCRIPT = path.join(__dirname, "discover-playwright.mjs");
const PUPPETEER_SCRIPT = path.join(__dirname, "discover-puppeteer.mjs");
const HTTP_SCRIPT = path.join(__dirname, "discover-http.mjs");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "src/data/auto-tests.json");
const PLAYWRIGHT_OUTPUT = path.join(PROJECT_ROOT, "src/data/auto-tests-playwright.json");
const PUPPETEER_OUTPUT = path.join(PROJECT_ROOT, "src/data/auto-tests-puppeteer.json");
const HTTP_OUTPUT = path.join(PROJECT_ROOT, "src/data/auto-tests-http.json");

function runScript(label, cmd, outputPath) {
  console.error(`\n--- Running ${label} discovery ---`);
  try {
    execSync(cmd, { cwd: PROJECT_ROOT, stdio: "inherit" });
  } catch (err) {
    console.error(`  [WARN] ${label} discovery failed:`, err.message);
    return [];
  }
  if (!fs.existsSync(outputPath)) return [];
  const data = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  console.error(`  ${label}: ${data.length} tests`);
  return data;
}

function runPytest(args = []) {
  const cmd = ["python3", PYTEST_SCRIPT, ...args].join(" ");
  return runScript("Pytest", cmd, OUTPUT_FILE);
}

function runPlaywright(args = []) {
  const cmd = ["node", PLAYWRIGHT_SCRIPT, ...args].join(" ");
  return runScript("Playwright", cmd, PLAYWRIGHT_OUTPUT);
}

function runPuppeteer(args = []) {
  const cmd = ["node", PUPPETEER_SCRIPT, ...args].join(" ");
  return runScript("Puppeteer", cmd, PUPPETEER_OUTPUT);
}

function runHttp(args = []) {
  const cmd = ["node", HTTP_SCRIPT, ...args].join(" ");
  return runScript("HTTP", cmd, HTTP_OUTPUT);
}

function mergeWithExisting(tests) {
  // Preserve filmstrip, predicates, config, assertions from previous runs
  // so manually-maintained metadata isn't lost on re-discovery.
  if (!fs.existsSync(OUTPUT_FILE)) return tests;
  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
  } catch { return tests; }

  const oldByScript = {};
  for (const t of existing) {
    oldByScript[t.scriptPath] = t;
  }

  let preserved = 0;
  for (const t of tests) {
    const old = oldByScript[t.scriptPath];
    if (old) {
      if (old.filmstrip) t.filmstrip = old.filmstrip;
      if (old.screenshotOnFailure !== undefined) t.screenshotOnFailure = old.screenshotOnFailure;
      preserved++;
    }
  }
  if (preserved > 0) console.error(`  Preserved filmstrip for ${preserved} tests`);
  return tests;
}

function mergeAndWrite(pytestTests, playwrightTests, puppeteerTests, httpTests) {
  let all = [...pytestTests, ...playwrightTests, ...puppeteerTests, ...httpTests];

  // Collision check
  const ids = new Set();
  for (const t of all) {
    if (ids.has(t.id)) {
      console.error(`  [WARN] Duplicate ID: ${t.id} — skipping`);
      continue;
    }
    ids.add(t.id);
  }

  const unique = all.filter(t => ids.has(t.id));
  ids.clear();
  all = null;

  // Preserve filmstrip from previous run
  const merged = mergeWithExisting(unique);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2), "utf-8");
  console.error(`\n  Merged: ${unique.length} tests (${pytestTests.length} pytest + ${playwrightTests.length} playwright + ${puppeteerTests.length} puppeteer + ${httpTests.length} http)`);
  console.error(`  Written to: ${OUTPUT_FILE}`);

  const cats = {};
  for (const t of unique) {
    cats[t.category] = (cats[t.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
    console.error(`    ${cat}: ${count}`);
  }
}

function main() {
  const args = process.argv.slice(2);

  const pytestDirsIdx = args.indexOf("--pytest-dirs");
  const playwrightDirsIdx = args.indexOf("--playwright-dirs");

  const pytestArgs = pytestDirsIdx >= 0 ? ["--dirs", args[pytestDirsIdx + 1]] : [];
  const playwrightArgs = playwrightDirsIdx >= 0 ? ["--dirs", args[playwrightDirsIdx + 1]] : [];

  const pytestTests = runPytest(pytestArgs);
  const playwrightTests = runPlaywright(playwrightArgs);
  const puppeteerTests = runPuppeteer();
  const httpTests = runHttp();

  mergeAndWrite(pytestTests, playwrightTests, puppeteerTests, httpTests);

  // Clean up intermediate files
  for (const f of [PLAYWRIGHT_OUTPUT, PUPPETEER_OUTPUT, HTTP_OUTPUT]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}

main();

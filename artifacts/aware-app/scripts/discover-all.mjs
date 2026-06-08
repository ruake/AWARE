#!/usr/bin/env node
/**
 * Unified Test Discovery Orchestrator
 *
 * Runs both pytest and Playwright discovery scripts, merges results,
 * and writes a single auto-tests.json file.
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
const OUTPUT_FILE = path.join(PROJECT_ROOT, "src/data/auto-tests.json");
const PLAYWRIGHT_OUTPUT = path.join(PROJECT_ROOT, "src/data/auto-tests-playwright.json");

function runPytest(args = []) {
  console.error("\n--- Running pytest discovery ---");
  const cmd = ["python3", PYTEST_SCRIPT, ...args].join(" ");
  try {
    execSync(cmd, { cwd: PROJECT_ROOT, stdio: "inherit" });
  } catch (err) {
    console.error("  [WARN] pytest discovery failed:", err.message);
    return [];
  }
  if (!fs.existsSync(OUTPUT_FILE)) return [];
  const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
  console.error(`  Pytest: ${data.length} tests`);
  return data;
}

function runPlaywright(args = []) {
  console.error("\n--- Running Playwright discovery ---");
  const cmd = ["node", PLAYWRIGHT_SCRIPT, ...args].join(" ");
  try {
    execSync(cmd, { cwd: PROJECT_ROOT, stdio: "inherit" });
  } catch (err) {
    console.error("  [WARN] Playwright discovery failed:", err.message);
    return [];
  }
  if (!fs.existsSync(PLAYWRIGHT_OUTPUT)) return [];
  const data = JSON.parse(fs.readFileSync(PLAYWRIGHT_OUTPUT, "utf-8"));
  console.error(`  Playwright: ${data.length} tests`);
  return data;
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

function mergeAndWrite(pytestTests, playwrightTests) {
  let all = [...pytestTests, ...playwrightTests];

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
  console.error(`\n  Merged: ${unique.length} tests (${pytestTests.length} pytest + ${playwrightTests.length} playwright)`);
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

  mergeAndWrite(pytestTests, playwrightTests);

  // Clean up intermediate file
  if (fs.existsSync(PLAYWRIGHT_OUTPUT)) {
    fs.unlinkSync(PLAYWRIGHT_OUTPUT);
  }
}

main();

#!/usr/bin/env node
/**
 * A.W.A.R.E. — Sync Data to Data Branch
 *
 * Copies all JSON data files from artifacts/aware-app/data/ to the root
 * of the `data` branch and pushes them. This ensures the production site
 * always has the latest test runs AND their corresponding test results.
 *
 * Usage (CI): automatically called by sync-data-branches.yml on push.
 *
 * Usage (local):
 *   GITHUB_TOKEN=ghp_xxx node scripts/sync-data.mjs
 *   GITHUB_TOKEN=ghp_xxx node scripts/sync-data.mjs --dry-run
 */

import { execSync } from "child_process";
import { readFileSync, readdirSync, copyFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_SRC = join(ROOT, "artifacts", "aware-app", "data");
const DATA_BRANCH = "data";

const DRY_RUN = process.argv.includes("--dry-run");
const TOKEN = process.env.GITHUB_TOKEN;

function sh(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: "pipe", cwd: ROOT, ...opts }).trim();
  } catch (e) {
    if (opts.allowFail) return null;
    console.error(`Command failed: ${cmd}`);
    console.error(e.stderr || e.message);
    process.exit(1);
  }
}

function main() {
  console.log("A.W.A.R.E. — Sync Data to Data Branch\n");

  if (!existsSync(DATA_SRC)) {
    console.error(`✗ Data directory not found: ${DATA_SRC}`);
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log("  (dry-run mode — no git changes will be made)\n");
  }

  // ── Collect data files ──────────────────────────────────────────────
  const files = readdirSync(DATA_SRC)
    .filter((f) => f.endsWith(".json"))
    .filter((f) => f !== "schemas");

  console.log(`  Files to sync (${files.length}):`);
  for (const f of files) {
    const srcPath = join(DATA_SRC, f);
    const size = readFileSync(srcPath).length;
    console.log(`    - ${f} (${(size / 1024).toFixed(1)} KB)`);
  }
  console.log("");

  if (DRY_RUN) {
    console.log("✓ Dry run complete — would push the above files to the data branch.");
    process.exit(0);
  }

  // ── Save current branch ──────────────────────────────────────────────
  const currentBranch = sh("git rev-parse --abbrev-ref HEAD");

  // ── Fetch data branch ────────────────────────────────────────────────
  const branchExists = sh(`git ls-remote --heads origin ${DATA_BRANCH}`, { allowFail: true });
  if (!branchExists || !branchExists.trim()) {
    console.error(`✗ Remote branch "${DATA_BRANCH}" does not exist. Run init-data-branch.mjs first.`);
    process.exit(1);
  }

  sh(`git fetch origin ${DATA_BRANCH}:${DATA_BRANCH} 2>/dev/null || true`);

  // ── Read source files into memory BEFORE switching branches ──────────
  const payload = new Map();
  for (const f of files) {
    payload.set(f, readFileSync(join(DATA_SRC, f)));
  }

  // ── Switch to data branch and clean it ───────────────────────────────
  try {
    sh(`git checkout -f ${DATA_BRANCH}`);
  } catch {
    console.error(`✗ Could not checkout "${DATA_BRANCH}". Creating orphan...`);
    sh(`git checkout --orphan ${DATA_BRANCH}`);
  }
  // Remove ALL tracked files — the data branch should ONLY contain data files
  sh("git rm -rf . --quiet", { allowFail: true });

  // ── Write data files ─────────────────────────────────────────────────
  let changed = 0;
  for (const [f, content] of payload) {
    const dst = join(ROOT, f);
    let skip = false;
    if (existsSync(dst)) {
      const existing = readFileSync(dst);
      if (Buffer.compare(content, existing) === 0) {
        skip = true;
      }
    }
    if (skip) {
      console.log(`  = ${f} (unchanged)`);
    } else {
      writeFileSync(dst, content);
      console.log(`  + ${f} (updated)`);
      changed++;
    }
  }

  // Add a branch README if missing
  if (!existsSync(join(ROOT, "README.md"))) {
    writeFileSync(
      join(ROOT, "README.md"),
      [
        "# AWARE — Data Branch",
        "",
        "This orphan branch stores live test run data for the AWARE dashboard.",
        "",
        `Last synced: ${new Date().toISOString()}`,
        "",
      ].join("\n")
    );
    console.log("  + README.md (created)");
  }

  // ── Configure git identity for CI ────────────────────────────────────
  const gitUser = sh("git config user.name", { allowFail: true });
  const gitEmail = sh("git config user.email", { allowFail: true });
  if (!gitUser) sh('git config user.name "AWARE Bot"');
  if (!gitEmail) sh('git config user.email "bot@aware.dev"');

  // ── Commit & push ────────────────────────────────────────────────────
  sh(`git add -A`);
  const hasChanges = sh(`git diff --cached --quiet`, { allowFail: true }) === null;

  if (!hasChanges) {
    console.log("\n  ℹ No data changes to commit");
  } else {
    const stats = sh(`git diff --cached --stat`).split("\n").filter(Boolean).slice(0, 10).join("\n    ");
    console.log(`\n  Changes:\n    ${stats}`);
    sh(`git commit -m "sync: update data files from main [skip ci]"`);
    if (TOKEN) {
      const remote = `https://x-access-token:${TOKEN}@github.com/${process.env.GITHUB_REPOSITORY || "ruake/AWARE"}.git`;
      sh(`git push "${remote}" ${DATA_BRANCH}`);
    } else {
      sh(`git push origin ${DATA_BRANCH}`);
    }
    console.log(`\n✓ Synced ${changed} files to "${DATA_BRANCH}" branch`);
  }

  // ── Return to original branch ────────────────────────────────────────
  sh(`git checkout -f ${currentBranch}`);
  console.log(`\n  Returned to "${currentBranch}"`);
}

main();

#!/usr/bin/env node
/**
 * A.W.A.R.E. — Initialize Data Branch
 *
 * Creates an orphan `data` branch pre-seeded with the starter JSON files
 * from artifacts/aware-app/data/. Run this once after forking before
 * triggering your first CI run.
 *
 * Usage (local):
 *   node scripts/init-data-branch.mjs
 *   node scripts/init-data-branch.mjs --dry-run   (preview changes, no git push)
 *
 * Usage (GitHub Actions): automatically called by deploy.yml on first push.
 *
 * What it does:
 *   1. Checks if a `data` branch already exists (local + remote).
 *   2. If not, creates an orphan branch with seed JSON files.
 *   3. Commits and pushes so the AWARE dashboard has data on first load.
 */

import { execSync, spawnSync } from "child_process";
import { readFileSync, existsSync, readdirSync, cpSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "artifacts", "aware-app", "data");
const DATA_BRANCH = "data";

const DRY_RUN = process.argv.includes("--dry-run");

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: "pipe", cwd: ROOT, ...opts }).trim();
  } catch (e) {
    if (opts.allowFail) return null;
    console.error(`Command failed: ${cmd}`);
    console.error(e.stderr || e.message);
    process.exit(1);
  }
}

function branchExists(branch) {
  const local = run(`git branch --list ${branch}`, { allowFail: true });
  if (local && local.trim()) return "local";

  const remote = run(`git ls-remote --heads origin ${branch}`, { allowFail: true });
  if (remote && remote.trim()) return "remote";

  return false;
}

async function main() {
  console.log("A.W.A.R.E. — Init Data Branch\n");

  if (DRY_RUN) {
    console.log("  (dry-run mode — no git changes will be made)\n");
  }

  // ── Check if already exists ──────────────────────────────────────────────
  const exists = branchExists(DATA_BRANCH);
  if (exists) {
    console.log(`✓ "${DATA_BRANCH}" branch already exists (${exists}). Nothing to do.`);
    console.log("  To re-seed, delete the branch first:");
    console.log(`    git push origin --delete ${DATA_BRANCH}`);
    console.log(`    git branch -D ${DATA_BRANCH}`);
    console.log("");
    process.exit(0);
  }

  // ── Find seed JSON files ──────────────────────────────────────────────────
  if (!existsSync(DATA_DIR)) {
    console.error(`✗ Data directory not found: ${DATA_DIR}`);
    console.error("  Make sure you are running this from the repository root.");
    process.exit(1);
  }

  const seedFiles = readdirSync(DATA_DIR)
    .filter(f => f.endsWith(".json") && f !== "schemas");

  if (seedFiles.length === 0) {
    console.error("✗ No JSON files found in artifacts/aware-app/data/");
    process.exit(1);
  }

  console.log(`  Seed files (${seedFiles.length}):`);
  for (const f of seedFiles) {
    console.log(`    - ${f}`);
  }
  console.log("");

  if (DRY_RUN) {
    console.log(`✓ Dry run complete — would create "${DATA_BRANCH}" branch with ${seedFiles.length} seed files.`);
    process.exit(0);
  }

  // ── Save current branch ──────────────────────────────────────────────────
  const currentBranch = run("git rev-parse --abbrev-ref HEAD");

  // ── Configure git identity if needed ─────────────────────────────────────
  const gitUser = run("git config user.name", { allowFail: true });
  const gitEmail = run("git config user.email", { allowFail: true });

  if (!gitUser) run('git config user.name "AWARE Bot"');
  if (!gitEmail) run('git config user.email "bot@aware.dev"');

  // ── Create orphan branch ─────────────────────────────────────────────────
  console.log(`  Creating orphan branch "${DATA_BRANCH}"...`);
  run(`git checkout --orphan ${DATA_BRANCH}`);

  // Remove all tracked files from the index
  run("git rm -rf . --quiet", { allowFail: true });

  // Copy seed files to working directory root
  for (const f of seedFiles) {
    copyFileSync(join(DATA_DIR, f), join(ROOT, f));
    run(`git add ${f}`);
  }

  // Add a branch README
  writeFileSync(
    join(ROOT, "README.md"),
    [
      "# AWARE — Data Branch",
      "",
      "This orphan branch stores live test run data for the AWARE dashboard.",
      "",
      "**Do not edit manually.** Files are written by the AWARE CI workflows:",
      "- `deploy.yml` — records runs after each CI pass",
      "- `run-tests.yml` — records individual suite runs",
      "- `scheduler.yml` — updates scheduler status",
      "",
      `Files: ${seedFiles.join(", ")}`,
      "",
      `Initialized: ${new Date().toISOString()}`,
      "",
    ].join("\n")
  );
  run("git add README.md");

  run(`git commit -m "init: seed data branch with starter JSON files [skip ci]"`);

  // ── Push ─────────────────────────────────────────────────────────────────
  console.log(`  Pushing "${DATA_BRANCH}" to origin...`);
  run(`git push origin ${DATA_BRANCH}`);

  // ── Return to original branch ─────────────────────────────────────────────
  run(`git checkout -f ${currentBranch}`);

  console.log(`\n✅ "${DATA_BRANCH}" branch created and pushed successfully.`);
  console.log("   The AWARE dashboard will now load data from this branch.\n");
}

main().catch(e => {
  console.error("init-data-branch: unexpected error:", e.message);
  process.exit(1);
});

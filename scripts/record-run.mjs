#!/usr/bin/env node

/**
 * AWARE Record Run — records test run results with conditions pattern.
 *
 * Called by CI after test execution. Updates an existing RUNNING entry
 * in runs.json with PASS/FAIL status and full conditions.
 *
 * Environment variables:
 *   AWARE_SUITE   — suite ID (e.g., "suite_smoke")
 *   AWARE_ENV     — environment label (e.g., "QA / Staging")
 *   AWARE_TARGET  — target tier ("QA"|"UAT"|"PROD")
 *   AWARE_NETWORK — network ("staging"|"production")
 *   PASS_PCT      — pass percentage (0-100)
 *   DURATION_MS   — total duration in milliseconds
 *   FAILURES      — number of failures
 *
 * Usage (from CI):
 *   AWARE_SUITE=suite_smoke AWARE_ENV="QA / Staging" node scripts/record-run.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import {
  RUN_STATUSES,
  condition,
  deriveRunStatus,
  completeRunConditions,
  readRuns,
  writeRuns,
} from "./lib/runStatus.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "artifacts", "aware-app", "data");
const RUNS_FILE = join(DATA_DIR, "runs.json");

function main() {
  const suite = process.env.AWARE_SUITE || "";
  const envLabel = process.env.AWARE_ENV || "";
  const target = process.env.AWARE_TARGET || "";
  const network = process.env.AWARE_NETWORK || "";
  const passPct = parseInt(process.env.PASS_PCT || "100", 10);
  const durationMs = parseInt(process.env.DURATION_MS || "0", 10);
  const failures = parseInt(process.env.FAILURES || "0", 10);
  const timestamp = new Date().toISOString();
  const commitSha = process.env.GITHUB_SHA || "";
  const workflowRunId = process.env.GITHUB_RUN_ID || null;

  if (!suite) {
    console.error("AWARE_SUITE is required");
    process.exit(1);
  }

  const runs = readRuns(RUNS_FILE);
  const passed = passPct >= 100 && failures === 0;

  // Try to find an existing RUNNING entry for this suite+target
  let targetRun = null;
  for (const run of runs) {
    if (run.status === "RUNNING" && run.suite === suite) {
      if (target && run.target === target) {
        targetRun = run;
        break;
      }
      if (!targetRun) targetRun = run;
    }
  }

  if (targetRun) {
    targetRun.conditions = completeRunConditions(passed);
    targetRun.status = deriveRunStatus(targetRun.conditions);
    targetRun.passPct = passPct;
    targetRun.failures = failures;
    targetRun.durationMs = durationMs;
    targetRun.updatedAt = timestamp;
    if (workflowRunId) targetRun.workflowRunId = workflowRunId;
    console.log(`Updated run ${targetRun.id} → ${targetRun.status}`);
  } else {
    // Create new run entry
    const runId = `ci_${Date.now().toString(36)}`;
    const newRun = {
      id: runId,
      label: `${suite} — ${envLabel || target}`,
      suite,
      target,
      network,
      status: passed ? "PASS" : "FAIL",
      conditions: completeRunConditions(passed),
      passPct,
      failures,
      duration: `${Math.floor(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`,
      durationMs,
      started: timestamp,
      updatedAt: timestamp,
      build: commitSha.slice(0, 7),
      rev: commitSha,
      env: target || "QA",
      ...(workflowRunId ? { workflowRunId: Number(workflowRunId) } : {}),
    };
    runs.unshift(newRun);
    console.log(`Created new run ${runId} → ${newRun.status}`);
  }

  writeRuns(RUNS_FILE, runs);
  console.log(`runs.json updated (${runs.length} total runs)`);
}

try {
  main();
} catch (e) {
  console.error(`record-run failed: ${e.message}`);
  process.exit(1);
}

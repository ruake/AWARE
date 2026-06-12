/**
 * Run Status — Kubernetes-style conditions and status management for test runs.
 *
 * Each Run can have multiple conditions (Dispatched, WorkflowRunning, Completed, Passed).
 * A condition follows the pattern:
 *   { type, status: "True"|"False"|"Unknown", reason, message, lastTransitionTime }
 *
 * The overall run.status is derived from conditions:
 *   "PENDING"  → not yet dispatched
 *   "RUNNING"  → WorkflowRunning=True
 *   "PASS"     → Completed=True, Passed=True
 *   "FAIL"     → Completed=True, Passed=False
 *   "ERROR"    → fatal / unrecoverable
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

export const RUN_STATUSES = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  PASS: "PASS",
  FAIL: "FAIL",
  ERROR: "ERROR",
};

export const CONDITION_TYPES = {
  DISPATCHED: "Dispatched",
  WORKFLOW_RUNNING: "WorkflowRunning",
  COMPLETED: "Completed",
  PASSED: "Passed",
  RECONCILED: "Reconciled",
};

export const CONDITION_STATUS = {
  TRUE: "True",
  FALSE: "False",
  UNKNOWN: "Unknown",
};

/**
 * Create a condition object.
 */
export function condition(type, status, reason, message) {
  return {
    type,
    status,
    reason: reason || "Unknown",
    message: message || "",
    lastTransitionTime: new Date().toISOString(),
  };
}

/**
 * Derive overall run.status from conditions.
 */
export function deriveRunStatus(conditions) {
  const byType = {};
  for (const c of conditions) {
    byType[c.type] = c;
  }

  const completed = byType[CONDITION_TYPES.COMPLETED];
  const passed = byType[CONDITION_TYPES.PASSED];
  const dispatched = byType[CONDITION_TYPES.DISPATCHED];
  const wfRunning = byType[CONDITION_TYPES.WORKFLOW_RUNNING];

  if (completed?.status === CONDITION_STATUS.TRUE) {
    return passed?.status === CONDITION_STATUS.TRUE ? RUN_STATUSES.PASS : RUN_STATUSES.FAIL;
  }
  if (dispatched?.status === CONDITION_STATUS.TRUE && wfRunning?.status === CONDITION_STATUS.FALSE) {
    return RUN_STATUSES.RUNNING;
  }
  if (dispatched?.status === CONDITION_STATUS.TRUE) {
    return RUN_STATUSES.RUNNING;
  }
  return RUN_STATUSES.PENDING;
}

/**
 * Upsert a condition: replaces existing of same type, or appends.
 */
export function upsertCondition(conditions, newCond) {
  const idx = conditions.findIndex((c) => c.type === newCond.type);
  if (idx >= 0) {
    // Only update if status changed
    if (conditions[idx].status !== newCond.status) {
      newCond.lastTransitionTime = new Date().toISOString();
    } else {
      newCond.lastTransitionTime = conditions[idx].lastTransitionTime;
    }
    conditions[idx] = newCond;
  } else {
    conditions.push(newCond);
  }
  return conditions;
}

/**
 * Build initial conditions for a newly created run.
 */
export function initialRunConditions() {
  return [
    condition(CONDITION_TYPES.DISPATCHED, CONDITION_STATUS.TRUE, "WorkflowDispatched", "Dispatched via scheduler"),
    condition(CONDITION_TYPES.WORKFLOW_RUNNING, CONDITION_STATUS.TRUE, "InProgress", "Workflow is executing"),
    condition(CONDITION_TYPES.COMPLETED, CONDITION_STATUS.FALSE, "InProgress", "Awaiting completion"),
    condition(CONDITION_TYPES.PASSED, CONDITION_STATUS.UNKNOWN, "Pending", "Not yet determined"),
    condition(CONDITION_TYPES.RECONCILED, CONDITION_STATUS.TRUE, "Reconciled", "Initial state set"),
  ];
}

/**
 * Mark a run as completed (PASS or FAIL).
 */
export function completeRunConditions(passed) {
  const conditions = [
    condition(CONDITION_TYPES.WORKFLOW_RUNNING, CONDITION_STATUS.FALSE, passed ? "Succeeded" : "Failed", passed ? "All tests passed" : "One or more tests failed"),
    condition(CONDITION_TYPES.COMPLETED, CONDITION_STATUS.TRUE, passed ? "Completed" : "CompletedWithFailures", passed ? "Run completed successfully" : "Run completed with failures"),
    condition(CONDITION_TYPES.PASSED, passed ? CONDITION_STATUS.TRUE : CONDITION_STATUS.FALSE, passed ? "Passed" : "Failed", passed ? "All checks passed" : "Some checks failed"),
    condition(CONDITION_TYPES.RECONCILED, CONDITION_STATUS.TRUE, "Reconciled", "Final state reconciled"),
  ];
  return conditions;
}

// ── Runs file I/O ──────────────────────────────────────────────────────

export function readRuns(runsFile) {
  if (!existsSync(runsFile)) return [];
  try {
    return JSON.parse(readFileSync(runsFile, "utf-8"));
  } catch {
    return [];
  }
}

export function writeRuns(runsFile, runs) {
  mkdirSync(dirname(runsFile), { recursive: true });
  writeFileSync(runsFile, JSON.stringify(runs, null, 2) + "\n");
}

export function findRun(runs, suiteId, envLabel) {
  return runs.find((r) => (r.suiteId || r.suite) === suiteId && r.env === envLabel && r.status === "RUNNING");
}

export function updateRunInPlace(runs, runId, patch) {
  const idx = runs.findIndex((r) => r.id === runId);
  if (idx === -1) return null;
  runs[idx] = { ...runs[idx], ...patch };
  return runs[idx];
}

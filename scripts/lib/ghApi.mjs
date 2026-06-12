/**
 * GitHub API Facade — wraps `gh` CLI for workflow/run operations.
 * Kubernetes-inspired: treats workflow runs as resources with status.
 */

import { execSync } from "child_process";

function sh(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: "utf-8",
    maxBuffer: 16 * 1024 * 1024,
    ...opts,
  }).trim();
}

function gh(args) {
  const token = process.env.GITHUB_TOKEN;
  const env = token ? { ...process.env, GH_TOKEN: token } : process.env;
  try {
    return sh(`gh ${args}`, { env });
  } catch (e) {
    const short = e.message.slice(0, 200);
    console.error(`  gh ${args.split(/\s/)[0]} … ${short}`);
    return null;
  }
}

/**
 * WorkflowRunStatus — mirrors a GitHub Actions workflow run.
 */
export class WorkflowRunStatus {
  constructor(data) {
    this.databaseId = data.databaseId;
    this.displayTitle = data.displayTitle;
    this.status = data.status;       // "in_progress" | "completed" | "pending" | ...
    this.conclusion = data.conclusion; // "success" | "failure" | null
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.htmlUrl = data.htmlUrl || null;
  }

  get isActive() {
    return ["in_progress", "pending", "queued", "waiting", "requested"].includes(this.status);
  }

  get isCompleted() {
    return this.status === "completed";
  }

  get isSuccess() {
    return this.conclusion === "success";
  }

  get isFailure() {
    return this.conclusion === "failure";
  }
}

/**
 * List recent workflow runs, optionally filtered by suite label.
 */
export function listWorkflowRuns(workflowFile, { limit = 20, suiteId = null, envLabel = null } = {}) {
  const out = gh(
    `run list --workflow "${workflowFile}" --limit ${limit} --json databaseId,displayTitle,status,conclusion,createdAt,updatedAt,htmlUrl`
  );
  if (!out) return [];
  try {
    let runs = JSON.parse(out);
    if (suiteId) {
      runs = runs.filter((r) => r.displayTitle && r.displayTitle.includes(suiteId));
    }
    if (envLabel) {
      runs = runs.filter((r) => r.displayTitle && r.displayTitle.includes(envLabel));
    }
    return runs.map((r) => new WorkflowRunStatus(r));
  } catch {
    return [];
  }
}

/**
 * Get a single workflow run by databaseId.
 */
export function getWorkflowRun(databaseId) {
  const out = gh(`run view ${databaseId} --json conclusion,status,updatedAt,htmlUrl`);
  if (!out) return null;
  try {
    const data = JSON.parse(out);
    return new WorkflowRunStatus({
      databaseId,
      displayTitle: "",
      status: data.status,
      conclusion: data.conclusion,
      createdAt: "",
      updatedAt: data.updatedAt,
      htmlUrl: data.htmlUrl || null,
    });
  } catch {
    return null;
  }
}

/**
 * Dispatch a workflow with input parameters.
 * Returns true if dispatch succeeded.
 */
export function dispatchWorkflow(workflowFile, ref, inputs) {
  const inputFlags = Object.entries(inputs)
    .map(([k, v]) => `-f ${k}="${v}"`)
    .join(" ");
  const out = gh(`workflow run "${workflowFile}" --ref "${ref}" ${inputFlags}`);
  return out !== null;
}

/**
 * Extract the most recent dispatch for a given suite+env.
 * Used to correlate a scheduler dispatch with its GitHub workflow run.
 */
export function findLatestDispatch(workflowFile, suiteId, envLabel) {
  const runs = listWorkflowRuns(workflowFile, { limit: 20, suiteId, envLabel });
  if (runs.length === 0) return null;
  runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return runs[0];
}

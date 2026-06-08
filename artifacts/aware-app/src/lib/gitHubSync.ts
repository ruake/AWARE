import { getTestCases, updateTestCase } from "./testCases";
import type { TestCase } from "./types";

export interface RepoManifest {
  version: string;
  testCases: Array<{
    id: string;
    path: string;
    sha?: string;
  }>;
}

const GITHUB_API_URL = "https://api.github.com/repos/ruake/AWARE/contents/tests";

export type SyncStatus = "idle" | "syncing" | "error";

export type SyncListener = (status: SyncStatus, date: string) => void;
let _syncListeners: SyncListener[] = [];
export function onSyncStatusChange(fn: SyncListener) {
  _syncListeners.push(fn);
  return () => { _syncListeners = _syncListeners.filter(l => l !== fn); };
}
function _notifySync(status: SyncStatus, date: string) {
  _syncListeners.forEach(fn => fn(status, date));
}

interface GitHubContentItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  html_url: string;
  download_url: string;
  type: string;
}

function _parseTestCaseIdFromFilename(name: string): string | null {
  const match = name.match(/^(tc_\d+)\.yaml$/);
  return match ? match[1] : null;
}

async function _fetchGitHubAPIListing(): Promise<GitHubContentItem[] | null> {
  try {
    const resp = await fetch(GITHUB_API_URL);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!Array.isArray(data)) return null;
    return data as GitHubContentItem[];
  } catch {
    return null;
  }
}

export async function fetchManifest(): Promise<RepoManifest | null> {
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}test-manifest.json`);
    if (resp.ok) {
      return (await resp.json()) as RepoManifest;
    }
  } catch {
    /* fall through */
  }

  try {
    const items = await _fetchGitHubAPIListing();
    if (!items) return null;
    const testCases: RepoManifest["testCases"] = [];
    for (const item of items) {
      const id = _parseTestCaseIdFromFilename(item.name);
      if (id) {
        testCases.push({ id, path: item.path, sha: item.sha });
      }
    }
    return { version: "1.0", testCases };
  } catch {
    return null;
  }
}

export async function reconcile(): Promise<{ synced: number; missing: number; errors: number }> {
  _notifySync("syncing", new Date().toISOString());
  let synced = 0, missing = 0, errors = 0;

  try {
    const items = await _fetchGitHubAPIListing();

    if (items && items.length > 0) {
      const repoFiles = new Map<string, GitHubContentItem>();
      for (const item of items) {
        const id = _parseTestCaseIdFromFilename(item.name);
        if (id) repoFiles.set(id, item);
      }

      const tests = getTestCases();
      for (const test of tests) {
        const file = repoFiles.get(test.id);
        if (file) {
          updateTestCase(test.id, {
            repoStatus: "synced",
            githubPath: file.path,
            githubUrl: file.html_url,
            lastSyncedAt: new Date().toISOString(),
          });
          synced++;
        } else {
          updateTestCase(test.id, {
            repoStatus: "missing",
            lastSyncedAt: new Date().toISOString(),
          });
          missing++;
        }
      }
      _notifySync("idle", new Date().toISOString());
      return { synced, missing, errors: 0 };
    }

    const manifest = await fetchManifest();
    if (!manifest) {
      _notifySync("error", new Date().toISOString());
      return { synced: 0, missing: 0, errors: 1 };
    }

    const tests = getTestCases();
    for (const test of tests) {
      const repoEntry = manifest.testCases.find(tc => tc.id === test.id);
      if (repoEntry) {
        updateTestCase(test.id, {
          repoStatus: "synced",
          githubPath: repoEntry.path,
          githubUrl: `https://github.com/ruake/PROOF/blob/main/${repoEntry.path}`,
          lastSyncedAt: new Date().toISOString(),
        });
        synced++;
      } else {
        updateTestCase(test.id, {
          repoStatus: "missing",
          lastSyncedAt: new Date().toISOString(),
        });
        missing++;
      }
    }
    _notifySync("idle", new Date().toISOString());
    return { synced, missing, errors: 0 };
  } catch {
    _notifySync("error", new Date().toISOString());
    return { synced, missing, errors: 1 };
  }
}

export async function checkTestCaseInRepo(testId: string): Promise<{ inRepo: boolean; path?: string }> {
  const items = await _fetchGitHubAPIListing();
  if (items) {
    for (const item of items) {
      if (item.name === `${testId}.yaml`) {
        return { inRepo: true, path: item.path };
      }
    }
    return { inRepo: false };
  }

  const manifest = await fetchManifest();
  if (!manifest) return { inRepo: false };
  const entry = manifest.testCases.find(tc => tc.id === testId);
  return entry ? { inRepo: true, path: entry.path } : { inRepo: false };
}

export function getCheckInSteps(testCase: TestCase): string[] {
  const filename = `${testCase.id}.yaml`;
  const repoPath = `tests/${testCase.category || "uncategorized"}/${filename}`;
  const yamlContent = generateYamlContent(testCase);
  return [
    `1. Create the file \`${repoPath}\` in your local clone of ruake/AWARE`,
    `2. Add the following content to \`${repoPath}\`:\n\`\`\`yaml\n${yamlContent}\n\`\`\``,
    `3. Update \`test-manifest.json\` at the repo root:\n\`\`\`json\n{"id": "${testCase.id}", "path": "${repoPath}"}\n\`\`\``,
    `4. Commit and push:\n\`\`\`bash\ngit add ${repoPath} test-manifest.json\ngit commit -m "Add test case ${testCase.id}: ${testCase.name}"\ngit push\n\`\`\``,
    `5. After the GitHub Pages build completes, run reconciliation to verify the check-in`,
  ];
}

export function generateYamlContent(testCase: TestCase): string {
  const lines = [
    `# ${testCase.name}`,
    `# Generated by PROOF`,
    `# ID: ${testCase.id}`,
    `# Category: ${testCase.category}`,
    `# Priority: ${testCase.priority}`,
    `# Severity: ${testCase.severity}`,
    ``,
    `config:`,
    `  test_id: "${testCase.id}"`,
    `  name: "${testCase.name}"`,
    `  description: "${testCase.description || ""}"`,
    `  test_type: "${testCase.testType}"`,
    `  category: "${testCase.category}"`,
    `  priority: "${testCase.priority}"`,
    `  severity: "${testCase.severity}"`,
    `  expected_status: ${testCase.expectedStatus}`,
    `  automated: ${testCase.automated}`,
    ``,
  ];

  if (testCase.requestHeaders && Object.keys(testCase.requestHeaders).length > 0) {
    lines.push(`request_headers:`);
    for (const [k, v] of Object.entries(testCase.requestHeaders)) {
      lines.push(`  ${k}: "${v}"`);
    }
    lines.push(``);
  }

  if (testCase.cookies && Object.keys(testCase.cookies).length > 0) {
    lines.push(`cookies:`);
    for (const [k, v] of Object.entries(testCase.cookies)) {
      lines.push(`  ${k}: "${v}"`);
    }
    lines.push(``);
  }

  if (testCase.predicates && testCase.predicates.length > 0) {
    lines.push(`predicates:`);
    for (const p of testCase.predicates) {
      lines.push(`  - type: ${p.type}`);
      lines.push(`    field: "${p.field || ""}"`);
      lines.push(`    expected: "${p.expected}"`);
      lines.push(`    operator: ${p.operator}`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

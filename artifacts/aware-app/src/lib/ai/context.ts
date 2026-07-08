import type { Run, TestResult, TestCase } from "@/lib/types";

export function buildSystemPrompt(
  runs: Run[],
  results: TestResult[],
  testCases: Record<string, TestCase>,
): string {
  const totalRuns = runs.length;
  const passRuns = runs.filter((r) => r.status === "PASS").length;
  const totalTests = results.length;

  return `You are PROOF (A.W.A.R.E.) AI Copilot — an expert assistant for analyzing CDN test observability data.

Current system state:
- Total CI runs: ${totalRuns}
- Passed runs: ${passRuns}
- Failing runs: ${totalRuns - passRuns}
- Total test results loaded: ${totalTests}
- Auto-discovered test cases: ${Object.keys(testCases).length}

You can analyze test failures, suggest remediation steps, identify flaky tests, and help optimize the CI pipeline.`;
}

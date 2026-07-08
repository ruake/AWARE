import type { Run, TestResult, TestCase } from "@/lib/types";

export function getTestFailureRate(runs: Run[]): number {
  return runs.length > 0 ? runs.filter((r) => r.status === "FAIL").length / runs.length : 0;
}

export function getRunsForEnv(runs: Run[], env: string): Run[] {
  return runs.filter((r) => r.env === env);
}

export function getCategoryBreakdown(
  results: TestResult[],
): Record<string, { pass: number; fail: number }> {
  const breakdown: Record<string, { pass: number; fail: number }> = {};
  for (const r of results) {
    if (!breakdown[r.category]) breakdown[r.category] = { pass: 0, fail: 0 };
    if (r.status === "PASS") breakdown[r.category].pass++;
    else breakdown[r.category].fail++;
  }
  return breakdown;
}

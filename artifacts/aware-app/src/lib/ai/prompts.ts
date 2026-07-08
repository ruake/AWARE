export function buildAnalyzeFailurePrompt(failures: Array<{ name: string; category: string; assertion: string }>): string {
  return `Analyze the following test failures and provide root cause analysis:

${failures.map(f => `- **${f.name}** (${f.category}): ${f.assertion}`).join('\n')}

For each failure, identify:
1. Likely root cause (infrastructure, configuration, or code change)
2. Suggested remediation steps
3. Priority level (P0/P1/P2)`;
}

export function buildFlakinessPrompt(flakyTests: Array<{ name: string; passRate: number; totalRuns: number }>): string {
  return `Analyze these flaky tests and suggest stabilization strategies:

${flakyTests.map(t => `- **${t.name}**: ${(t.passRate * 100).toFixed(0)}% pass rate over ${t.totalRuns} runs`).join('\n')}

For each test, suggest:
1. Common failure patterns
2. Stabilization techniques (retry, wait strategies, data seeding)
3. Whether to quarantine the test`;
}

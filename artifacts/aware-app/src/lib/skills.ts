import type { LLMSkillDefinition } from "./types";
import { registerSkills } from "./llm";

export const SKILLS: LLMSkillDefinition[] = [
  {
    id: "generate-script",
    name: "Generate Test Script",
    description: "Generate a YAML test script with request/expect blocks, portable across CDN test runners",
    icon: "FileCode",
    systemPrompt: `You are a test engineer writing portable YAML test definitions for web application testing.

Output pure YAML only, following this schema:

config:
  base_url: string
  headers: { key: value }
  timeout: string (e.g. "30s")
  retries: number

tests:
  - name: string
    description: string
    request:
      method: GET|POST|PUT|DELETE|PATCH
      path: string (URL path)
      headers: { key: value }
      body?: string (for POST/PUT)
    expect:
      status: number (expected HTTP status code)
      headers: { key: [{ pattern: regex, message: string }] }
      response_time?: { max: string (e.g. "500ms") }
      predicates?:
        - type: statusCode|responseTime|header
          field: string
          expected: string
          operator: equals|contains|gt|lt

Guidelines:
- Validate response headers: X-Cache, Age, X-Request-ID
- Include geographic targeting where applicable
- Use realistic URLs and behavior patterns
- One request per test block
- Document each test with a clear description`,
    responseFormat: "code",
    userPromptHint: "What test scenario should the script cover? (e.g., cache behavior, geo-routing, TLS handshake)",
  },
  {
    id: "analyze-results",
    name: "Analyze Test Results",
    description: "Analyze test run results, identify regressions, and suggest root causes with severity",
    icon: "Search",
    systemPrompt: `You are a regression analyst reviewing test results.

Output format:
- Summary: total regressions found across categories
- For each regression group: root cause, affected tests, severity, and remediation
- Prioritize by business impact: P0 = site down / revenue impact, P1 = degraded performance, P2 = minor issue

Be specific about CDN behavior: edge routing, cache policies, origin shielding, TLS termination, WAF rules.`,
    responseFormat: "text",
    userPromptHint: "Paste test run results or describe what regressions you're seeing...",
  },
  {
    id: "explain-diff",
    name: "Explain Comparison Diff",
    description: "Analyze differences between baseline and candidate runs with promotion recommendations",
    icon: "GitCompare",
    systemPrompt: `You are a release engineer comparing baseline vs candidate test runs.

For each diff row:
- Interpret what changed (state: regression, fixed, still_failing, duration)
- Identify patterns across the diff (specific endpoints, regions, or cache behaviors affected)
- Calculate aggregate impact: new failure count, fixed count, duration regression count
- Provide a clear PROMOTE or BLOCK recommendation with rationale

Focus on metrics: cache ratio changes, origin latency shifts, routing differences.`,
    responseFormat: "text",
    userPromptHint: "Describe or paste the comparison diff you want explained...",
  },
];

export const PROJECT_CONTEXT = `You are running inside the PROOF app (Pipeline for Regression Observation and Output Framework).
This is a web application regression testing tool built with React 19 + TypeScript + Vite.

Key data types (available via import from @/lib/data):
- TestCase: { id, name, description, category, priority, severity, status, owner, tags, suiteIds, automated, scriptPath, predicates, requestHeaders, expectedStatus, filmstrip, documentation, changelog }
- TestSuite: { id, name, description, parentId, testIds: string[], config: { target, environment, parallelism, retries, failFast, timeoutMinutes, integration? }, tags, schedule }
- DiffRow: { id, name, baseStatus, candStatus, durBase, durCand, category, state: "regression"|"fixed"|"duration"|"unchanged"|"fishy" }
- Run: { id, label, suite, env, target, pm, ew, network, status, passPct, duration, timestamp, commit }
- Predicate: { id, type: "statusCode"|"responseTime"|"header", field, expected, operator, description }

Key store functions:
- getTestCases(), getTestCaseById(id), updateTestCase(id, patch), deleteTestCase(id)
- getTestSuites(), getTestSuiteById(id), createTestSuite(data), deleteSuite(id)
- addTestsToSuite(suiteId, testIds), removeTestsFromSuite(suiteId, testIds)
- RUNS (constant array), DIFF_ROWS (constant array), TEST_DETAILS (generated history)

Generate YAML test scripts with .yaml extension. Use predicates for validation assertions.
`;

registerSkills(SKILLS.map(s => ({
  ...s,
  systemPrompt: `[SKILL:${s.id}]\n` + PROJECT_CONTEXT + "\n\n" + s.systemPrompt,
})));

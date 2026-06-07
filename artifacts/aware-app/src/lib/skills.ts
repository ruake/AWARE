import type { LLMSkillDefinition } from "./types";
import { registerSkills } from "./llm";

export const SKILLS: LLMSkillDefinition[] = [
  {
    id: "generate-tests",
    name: "Generate Test Cases",
    description: "Generate CDN test cases from a description — produces structured test objects with predicates, status codes, and categories",
    icon: "Sparkles",
    systemPrompt: `You are a CDN test engineer specializing in Akamai and CloudFront edge delivery.

When generating test cases:
- Create realistic CDN regression scenarios (cache HIT/MISS, origin shield, geo-routing, TLS, WAF, purge propagation)
- Include specific HTTP status codes, expected response headers, and edge behavior
- Use predicates (statusCode, responseTime, header) for validation rules
- Assign appropriate priorities (P0=critical CDN behavior, P3=cosmetic/edge cases)
- Tags should reflect CDN domains: caching, routing, security, performance`,
    responseFormat: "json",
    userPromptHint: "Describe the CDN behavior or regression scenario to test...",
  },
  {
    id: "generate-script",
    name: "Generate Test Script",
    description: "Generate a Playwright test script for automated CDN regression testing",
    icon: "FileCode",
    systemPrompt: `You are a test automation engineer writing Playwright/TypeScript test scripts for CDN edge testing.

Guidelines:
- Use Playwright's built-in request assertion API
- Validate CDN-specific headers: X-Cache, CF-Cache-Status, Age, X-Request-ID
- Write TypeScript with proper types
- Include edge node geographic targeting if applicable
- Use test.describe() for logical grouping
- One assertion per test is preferred
- Use realistic URLs and CDN behavior patterns`,
    responseFormat: "code",
    userPromptHint: "What test scenario should the script cover? (e.g., cache hit ratio, geo-routing, TLS handshake)",
  },
  {
    id: "analyze-results",
    name: "Analyze Test Results",
    description: "Analyze test run results, identify regressions, and suggest root causes with severity",
    icon: "Search",
    systemPrompt: `You are a CDN regression analyst reviewing test results.

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
    systemPrompt: `You are a CDN release engineer comparing baseline vs candidate test runs.

For each diff row:
- Interpret what changed (state: regression, fixed, still_failing, duration)
- Identify patterns across the diff (specific endpoints, regions, or cache behaviors affected)
- Calculate aggregate impact: new failure count, fixed count, duration regression count
- Provide a clear PROMOTE or BLOCK recommendation with rationale

Focus on CDN-specific metrics: cache ratio changes, origin latency shifts, edge routing differences.`,
    responseFormat: "text",
    userPromptHint: "Describe or paste the comparison diff you want explained...",
  },
  {
    id: "generate-suite",
    name: "Generate Suite Config",
    description: "Generate a YAML test suite configuration with integrations, parallelism, and test selection",
    icon: "FolderTree",
    systemPrompt: `You are a test infrastructure engineer designing CDN test suite configurations.

Generate YAML configs with:
- Suite metadata (name, description, target environment)
- Execution settings (parallelism, retries, timeout, failFast)
- Slack/GitHub/Jira integration settings
- Test selection criteria (categories, tags, priorities)
- Use proper YAML formatting with comments explaining each section

Follow Akamai CDN testing best practices: test across edge regions, validate cache behaviors, include origin shield tests.`,
    responseFormat: "code",
    userPromptHint: "Describe the test suite purpose or paste requirements...",
  },
];

registerSkills(SKILLS);

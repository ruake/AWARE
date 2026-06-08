import type {
  LLMConfig,
  LLMProviderType,
  LLMMessage,
  LLMCompletionRequest,
  LLMCompletionResponse,
  TestCase,
  GenerateWithLLMParams,
  LLMSkillDefinition,
} from "./types";
import { DEFAULT_LLM_CONFIG } from "./types";
import { createTestCase } from "./data";

// ── Provider Interface ───────────────────────────────────────────────

export interface ILLMProvider {
  readonly type: LLMProviderType;
  complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse>;
  stream?(
    req: LLMCompletionRequest,
    onChunk: (text: string) => void,
  ): Promise<LLMCompletionResponse>;
  testConnection(): Promise<boolean>;
}

// ── Mock Provider (production-grade — context-aware dynamic responses) ──

const CATEGORIES = ["geo-match", "locale-split", "caching", "security", "performance", "routing", "tls", "ddos", "url-health"] as const;
const TEST_TYPES = ["web", "api", "edgeworker", "transaction"] as const;
const SEVERITIES = ["critical", "major", "minor", "trivial"] as const;

function _getSkillId(messages: LLMMessage[]): string | null {
  for (const m of messages) {
    if (m.role === "system") {
      const match = m.content.match(/\[SKILL:([a-z-]+)\]/);
      if (match) return match[1];
    }
  }
  return null;
}

function _isGreeting(text: string): boolean {
  const greetings = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening", "howdy", "sup", "yo", "what's up"];
  return greetings.some(g => text === g || (text.startsWith(g) && text.replace(g, "").trim().length < 5));
}

function _extractTestDetails(text: string): Record<string, string> {
  const lower = text.toLowerCase();
  const details: Record<string, string> = {};

  for (const cat of CATEGORIES) {
    if (lower.includes(cat)) { details.category = cat; break; }
  }

  const prioMatch = text.match(/\b(P[0-3])\b/);
  if (prioMatch) details.priority = prioMatch[1];

  for (const sev of SEVERITIES) {
    if (lower.includes(sev)) { details.severity = sev; break; }
  }

  const statusMatch = text.match(/\b(20[0-9]|30[0-9]|40[0-9]|50[0-9])\b/);
  if (statusMatch) details.expectedStatus = statusMatch[1];

  for (const t of TEST_TYPES) {
    if (lower.includes(t)) { details.testType = t; break; }
  }

  const nameMatch = text.match(/(?:test|case|scenario|check|verify|validate)\s+(?:for|to|that|called|named)?\s*[""]?([A-Za-z][A-Za-z0-9\s\-_]{4,80})/i);
  if (nameMatch) details.name = nameMatch[1].trim();

  if (/\b(auto|automated|yes)\b/i.test(lower)) details.automated = "true";
  if (/\b(manual|no)\b/i.test(lower)) details.automated = "false";

  const lines = text.split("\n").filter(l => l.includes(":") && !l.startsWith(" "));
  for (const line of lines) {
    const [key, ...rest] = line.split(":");
    const val = rest.join(":").trim();
    const k = key.trim().toLowerCase().replace(/\s+/g, "");
    if (k === "name") details.name = val;
    else if (k === "category" || k === "cat") details.category = val;
    else if (k === "priority") details.priority = val;
    else if (k === "severity") details.severity = val;
    else if (k === "status" || k === "expectedstatus") details.expectedStatus = val;
    else if (k === "type" || k === "testtype") details.testType = val;
    else if (k === "automated" || k === "auto") details.automated = val;
  }

  return details;
}

function _skillGreeting(skillId: string): string {
  const map: Record<string, string> = {
    "generate-tests": `Hello! I'm your test engineer assistant. I can help you create structured test cases for web application delivery.

What kind of test would you like to create? For example:
• A **cache validation** test to verify HIT/MISS behavior
• A **geo-routing** test to check regional targeting
• A **security** test for WAF or TLS validation
• A **performance** test for response time thresholds

Describe the behavior you want to validate and I'll generate a complete test configuration with predicates, headers, filmstrip, and changelog.`,
    "analyze-results": `Hello! I'm your regression analyst. I can review test run results and identify regressions, root causes, and remediation steps.

Please share the test run data or describe what regressions you're seeing — cache ratio drops, latency spikes, error rate increases, or specific test failures.`,
    "explain-diff": `Hello! I'm your release engineer. I can analyze differences between baseline and candidate test runs to determine if a promotion is safe.

Share the comparison diff data or describe what changed between runs — I'll break down regressions, fixes, and duration changes with a clear promote/block recommendation.`,
    "generate-script": `Hello! I'm your test script writer. I can generate portable YAML test definitions for web application testing scenarios.

Describe the test scenario you need a script for — include the endpoint, expected behavior, headers, and any validation predicates you want to check.`,
    "generate-suite": `Hello! I'm your test infrastructure engineer. I can design test suite configurations with integrations, parallelism, and test selection criteria.

Describe the suite you want to create — target environment, categories to include, integration requirements (Slack, GitHub, Jira), and execution parameters.`,
  };
  return map[skillId] ?? `Hello! I'm your regression testing assistant. I can help you with:

• **Generating test cases** — describe the behavior you want to validate
• **Writing test scripts** — YAML scripts for automated testing
• **Analyzing results** — explain test failures and regressions
• **Comparing runs** — interpret baseline vs candidate diffs
• **Generating suite configs** — YAML configurations for test suites

What would you like to work on today?`;
}

const _GENERIC_GREETING = `Hello! I'm your regression testing assistant. I can help you with:

• **Generating test cases** — describe the behavior you want to validate
• **Writing test scripts** — YAML scripts for automated testing
• **Analyzing results** — explain test failures and regressions
• **Comparing runs** — interpret baseline vs candidate diffs
• **Generating suite configs** — YAML configurations for test suites

What skill would you like to use? Select one from the list above.`;

function _handleGenerateTests(userMsg: string, messages: LLMMessage[]): LLMCompletionResponse {
  const hasAssistant = messages.some(m => m.role === "assistant");
  const assistantCount = messages.filter(m => m.role === "assistant").length;

  if (!hasAssistant || (userMsg.trim().length < 15 && assistantCount >= 1)) {
    return { content: _skillGreeting("generate-tests"), finishReason: "stop" };
  }

  const details = _extractTestDetails(userMsg);
  const now = Date.now();
  const name = details.name || "Web App Regression Test";
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || `cdn_test_${now % 10000}`;
  const cat = details.category || "caching";
  const priority = details.priority || "P2";
  const severity = details.severity || "minor";
  const statusCode = details.expectedStatus || "200";
  const testType = details.testType || "web";
  const automated = details.automated !== "false";
  const timestamp = new Date().toISOString();

  const config = {
    id: `tc_${now % 100000}`,
    name,
    description: `Test case for ${cat} — validates correct behavior across the delivery network. Generated based on user input: "${userMsg.substring(0, 100)}"`,
    testType,
    category: cat,
    priority,
    severity,
    status: "active",
    tags: [cat, "cdn", "regression", testType],
    owner: "mock-llm",
    suiteIds: [] as string[],
    automated,
    scriptPath: `tests/${cat}/${safeName}.yaml`,
    preconditions: "- Edge PoP token is valid and active\n- Test data has been seeded\n- Cache has been warmed with initial request\n- Network latency baseline captured",
    expectedBehavior: `- HTTP ${statusCode} response received\n- Response time under 500ms (p95)\n- X-Cache header contains HIT or STALE\n- Edge location header matches routing policy\n- Response body validates content type`,
    expectedStatus: parseInt(statusCode, 10),
    requestHeaders: {
      "Accept": "application/json",
      "User-Agent": "PROOF-TestRunner/2.0",
      "X-Debug": "true",
    },
    cookies: {},
    captureResponseHeaders: ["X-Cache", "X-Request-ID", "Age", "X-Edge-Location", "CF-Cache-Status"],
    filmstrip: {
      enabled: automated,
      threshold: 0.95,
    },
    predicates: [
      {
        id: `pred_${now}`,
        type: "statusCode",
        field: "",
        expected: statusCode,
        operator: "equals",
        description: `Response status code is ${statusCode}`,
      },
      {
        id: `pred_${now + 1}`,
        type: "responseTime",
        field: "duration",
        expected: "500",
        operator: "lt",
        description: "Response time under 500ms threshold",
      },
    ],
    version: 1,
    changelog: [
      {
        version: 1,
        timestamp,
        author: "mock-llm",
        summary: "Initial test case generation",
        changes: ["Created via MockLLMProvider with dynamic generation"],
      },
    ],
  };

  return {
    content: `Here's a summary of the test configuration I've generated:

- **Name**: ${name}
- **Category**: ${cat}
- **Priority**: ${priority} · **Severity**: ${severity}
- **Expected Status**: HTTP ${statusCode}
- **Predicates**: ${config.predicates.length} rules (status code + response time)
- **Automated**: ${automated ? "Yes" : "No"}

Please review the draft card below with the full configuration. Click **"Confirm & Open in Test Manager"** when you're ready to save it.

---TEST_CONFIG_START---
${JSON.stringify(config, null, 2)}
---TEST_CONFIG_END---`,
    finishReason: "stop",
  };
}



function _handleAnalyzeResults(userMsg: string): LLMCompletionResponse {
  const hash = userMsg.length % 7 + 3;
  const totalFails = hash * 2 + 1;
  const cacheFails = Math.ceil(totalFails * 0.45);
  const geoFails = Math.ceil(totalFails * 0.3);
  const tlsFails = totalFails - cacheFails - geoFails;
  const now = Date.now();

  const categories = [
    {
      name: "Cache Policy Regression",
      count: cacheFails,
      rootCause: "Origin Cache-Control header overriding web app TTL configuration — max-age=0 detected in upstream response",
      affected: Array.from({ length: cacheFails }, (_, i) => `TC-${String(now % 100 + i).padStart(3, "0")}`),
      severity: cacheFails > 4 ? "HIGH" : "MEDIUM",
      recommendation: cacheFails > 4
        ? "Revert origin header change from deployment. Set Cache-Control: max-age=604800 on static assets. Update edge rule to strip upstream cache headers."
        : "Review edge rule order in Property Manager — ensure cache override rules are evaluated after origin response.",
    },
    {
      name: "Geo-Routing Regression",
      count: geoFails,
      rootCause: "Edge function deployment missing x-region header rewrite — APAC traffic routing to default US edge",
      affected: Array.from({ length: geoFails }, (_, i) => `TC-${String(now % 100 + cacheFails + i).padStart(3, "0")}`),
      severity: "MEDIUM",
      recommendation: "Roll forward with corrected edge function. Add x-region rewrite rule in APAC match criteria and verify edge location headers.",
    },
    {
      name: "TLS Handshake Regression",
      count: tlsFails,
      rootCause: "Certificate bundle update dropped intermediate CA certificate — incomplete chain sent to clients",
      affected: Array.from({ length: tlsFails }, (_, i) => `TC-${String(now % 100 + cacheFails + geoFails + i).padStart(3, "0")}`),
      severity: tlsFails > 0 ? "CRITICAL" : "LOW",
      recommendation: tlsFails > 0
        ? "Immediate rollback of certificate update. Verify full CA chain with openssl s_client before redeploying."
        : "Monitor TLS handshake metrics for next 24 hours.",
    },
  ].filter(c => c.count > 0);

  const cacheHitDrop = 70 + Math.floor(Math.random() * 15);
  const latencyIncrease = 120 + Math.floor(Math.random() * 180);

  return {
    content: `## Regression Analysis Report

**Generated**: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
**Analysis ID**: anl_${now % 100000}

### Summary
Found **${totalFails} regressions** across ${categories.length} categories:

${categories.map((c, i) => `### ${i + 1}. ${c.name} (${c.count} failure${c.count > 1 ? "s" : ""})
- **Root Cause**: ${c.rootCause}
- **Affected Tests**: ${c.affected.join(", ")}
- **Severity**: ${c.severity}
- **Recommendation**: ${c.recommendation}`).join("\n\n")}

### Overall Impact Assessment
- **Cache hit ratio**: Dropped from 94% → ${cacheHitDrop}%
- **p95 latency**: Increased ${latencyIncrease}ms above baseline (${latencyIncrease > 200 ? "exceeds SLO" : "within SLO margin"})
- **Error rate**: ${(1.5 + Math.random() * 3.5).toFixed(1)}% of requests returning 5xx
- **Origin shield hit ratio**: ${50 + Math.floor(Math.random() * 30)}% (down from 78%)

### Recommended Actions
1. **IMMEDIATE**: ${categories[0]?.recommendation || "Review all regression categories"}
2. **SHORT TERM**: Schedule follow-up validation run after fixes are deployed (estimated 2-4 hours)
3. **LONG TERM**: Update test suite to include new edge location and cache status assertions
4. **DOCUMENTATION**: Add regression findings to team wiki with affected test IDs`,
    finishReason: "stop",
  };
}

function _handleExplainDiff(userMsg: string): LLMCompletionResponse {
  const hash = userMsg.length % 5 + 2;
  const totalDiffs = 10 + hash * 2;
  const regressions = Math.ceil(totalDiffs * 0.35);
  const fixed = Math.ceil(totalDiffs * 0.25);
  const durationRegs = Math.max(1, Math.ceil(totalDiffs * 0.15));
  const stillFailing = totalDiffs - regressions - fixed - durationRegs;
  const now = Date.now();

  return {
    content: `## Comparison Analysis: Baseline vs Candidate

**Generated**: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
**Diff Set**: ${now % 100000}

### Overview
- **Total diffs**: ${totalDiffs}
- **Regressions (new failures)**: ${regressions} — diff_0 through diff_${regressions - 1}
- **Fixed**: ${fixed} — diff_${totalDiffs - fixed - durationRegs - stillFailing} through diff_${totalDiffs - durationRegs - stillFailing - 1}
- **Still Failing**: ${stillFailing} — diff_${totalDiffs - durationRegs - stillFailing} through diff_${totalDiffs - durationRegs - 1}
- **Duration Regressions**: ${durationRegs} — diff_${totalDiffs - durationRegs} through diff_${totalDiffs - 1}

### Key Findings
1. **Cache HIT ratio dropped** from 94% → ${65 + Math.floor(Math.random() * 20)}% — primarily affects static assets under /assets/* and /images/*
2. **${regressions - 1} new 5xx errors** on origin-shield endpoints (${`/api/health, /origin/shield, /v1/status`}) suggest upstream timeout configuration issue
3. **APAC edge latency increased** ${200 + Math.floor(Math.random() * 300)}ms → ${500 + Math.floor(Math.random() * 500)}ms — possible routing misconfiguration in APAC edge function deployment
4. **${fixed} previously failing tests now pass** — consistent with PR #${800 + Math.floor(now / 10000) % 200} fix for TLS certificate chain

### Test State Breakdown
| State | Count | Impact |
|-------|-------|--------|
| 🔴 Regression | ${regressions} | New failures requiring immediate investigation |
| 🟢 Fixed | ${fixed} | Issues resolved in candidate build |
| 🟡 Duration | ${durationRegs} | Performance regression exceeds 15% threshold |
| ⚪ Still Failing | ${stillFailing} | Pre-existing issues not addressed |

### Recommendation
**${regressions > 4 ? "BLOCK" : "CONDITIONAL PROMOTE"}** promotion until cache policy issue (POLICY-${100 + Math.floor(now / 1000) % 900}) and ${regressions > 4 ? "TLS handshake" : "APAC routing"} regressions are resolved. ${fixed > 3 ? `The ${fixed} fixes in this build show the release addresses key issues, but the ${regressions} new failures must be investigated first.` : ""}

**Required actions before promotion:**
1. ${regressions > 3 ? "Revert origin Cache-Control header change" : "Investigate APAC edge function routing tables"}
2. Re-run full regression suite with fixes applied
3. ${durationRegs > 1 ? "Review web app performance tuning parameters for edge regions" : "Verify no additional regressions introduced"}
4. Sign off by SRE team lead`,
    finishReason: "stop",
  };
}

function _handleGenerateScript(userMsg: string): LLMCompletionResponse {
  const lower = userMsg.toLowerCase();
  const pathMatch = userMsg.match(/\/[a-z0-9_\-/.{}*]+/i);
  const path = pathMatch ? pathMatch[0] : "/api/v1/data";
  const methodMatch = userMsg.match(/\b(GET|POST|PUT|DELETE|PATCH)\b/i);
  const method = methodMatch ? methodMatch[0].toUpperCase() : "GET";
  const statusMatch = userMsg.match(/\b(20[0-9]|30[0-9]|40[0-9]|50[0-9])\b/);
  const status = statusMatch ? statusMatch[1] : "200";
  const hasCache = lower.includes("cache") || lower.includes("hit") || lower.includes("miss");
  const hasGeo = lower.includes("geo") || lower.includes("routing") || lower.includes("region") || lower.includes("apac");
  const hasTls = lower.includes("tls") || lower.includes("ssl") || lower.includes("certificate") || lower.includes("https");
  const hasSecurity = lower.includes("waf") || lower.includes("security") || lower.includes("auth") || lower.includes("token");

  const scenarioName = path === "/api/v1/data" ? "API Data Endpoint" : `Endpoint ${path}`;
  const testNames: string[] = [];
  const descriptions: string[] = [];

  testNames.push(`web app_${Date.now() % 10000}: ${scenarioName} — ${hasCache ? "Cache validation" : "Response verification"}`);
  descriptions.push(hasCache
    ? `Verify that ${path} returns HTTP ${status} with correct cache headers. Validate that responses are served from edge cache after warm-up.`
    : `Verify that ${path} returns HTTP ${status} with correct response headers and body.`
  );

  if (hasGeo) {
    testNames.push(`web app_${Date.now() % 10000 + 1}: Geo-routing validation — ${path}`);
    descriptions.push(`Validate that requests from APAC region are routed to the nearest edge node. Verify X-Edge-Location header contains expected PoP code.`);
  }

  if (hasSecurity) {
    testNames.push(`web app_${Date.now() % 10000 + 2}: Security policy validation — ${path}`);
    descriptions.push(`Verify WAF rules are correctly applied. Test that malicious request patterns are blocked with 403 response.`);
  }

  return {
    content: `# Test Script (YAML)
# Auto-generated for: ${scenarioName}
# Generated: ${new Date().toISOString()}
# Compatible with PROOF test runner v2.0+

config:
  base_url: "https://example.com"
  headers:
    User-Agent: "PROOF-TestRunner/2.0"
    Accept: "application/json"
  timeout: 30s
  retries: ${1 + Math.floor(Math.random() * 3)}
  default_region: "us-east-1"

tests:
  - name: "${testNames[0]}"
    description: >
      ${descriptions[0]}
    request:
      method: ${method}
      path: "${path}"
      headers:
        Accept: "application/json"
        X-Debug: "true"
    expect:
      status: ${status}
      headers:
        X-Cache:
          - pattern: "HIT|STALE"
            message: "Response should be served from edge cache"
        Age:
          type: number
          gt: 0
        X-Request-ID:
          exists: true
      response_time:
        max: 500ms
      predicates:
        - type: statusCode
          field: ""
          expected: "${status}"
          operator: equals
        - type: responseTime
          field: duration
          expected: "500"
          operator: lt

${hasGeo ? `  - name: "${testNames[1]}"
    description: >
      ${descriptions[1]}
    request:
      method: ${method}
      path: "${path}"
      headers:
        X-Region: "ap-southeast-1"
        X-Forwarded-For: "203.0.113.1"
    expect:
      status: ${status}
      headers:
        X-Edge-Location:
          - pattern: "^(HKG|SIN|NRT|TYO)"
            message: "Request should route to APAC edge"
        X-Cache:
          - pattern: "HIT|MISS"
            message: "Cache status should be present"
      response_time:
        max: 800ms
      predicates:
        - type: headerContains
          field: "X-Edge-Location"
          expected: "^(HKG|SIN|NRT)"
          operator: contains
          description: "Edge location is in APAC region"

` : ""}${hasSecurity ? `  - name: "${testNames[2]}"
    description: >
      ${descriptions[2]}
    request:
      method: GET
      path: "${path}"
      headers:
        X-Forwarded-For: "198.51.100.1"
        User-Agent: "malicious-bot/1.0"
    expect:
      status: 403
      headers:
        X-WAF-Rule:
          - pattern: ".*"
            message: "WAF should block malicious requests"
      predicates:
        - type: statusCode
          field: ""
          expected: "403"
          operator: equals
          description: "WAF blocks malicious request"

` : ""}  - name: "${`web app_${Date.now() % 10000 + 3}: Health check — ${path}`}"
    description: >
      Basic health check to verify endpoint availability
      and response time SLO compliance.
    request:
      method: GET
      path: "/health"
    expect:
      status: 200
      headers:
        Content-Type:
          - pattern: "application/json"
      response_time:
        max: 200ms
      predicates:
        - type: statusCode
          field: ""
          expected: "200"
          operator: equals`,
    finishReason: "stop",
  };
}

function _handleGenerateSuite(userMsg: string): LLMCompletionResponse {
  const lower = userMsg.toLowerCase();
  const hasProd = lower.includes("prod") || lower.includes("production");
  const hasStaging = lower.includes("staging") || lower.includes("stage");
  const targetEnv = hasProd && !hasStaging ? "production" : "staging";
  const network = hasProd && !hasStaging ? "production" : "staging";
  const includeCaching = lower.includes("cache") || lower.includes("caching");
  const includeGeo = lower.includes("geo") || lower.includes("routing");
  const includeSecurity = lower.includes("security") || lower.includes("waf") || lower.includes("tls");
  const includePerformance = lower.includes("perf") || lower.includes("perform") || lower.includes("latency");
  const parallelism = 2 + Math.floor(Math.random() * 4);
  const now = Date.now();

  return {
    content: `# web app Test Suite Configuration
# Generated: ${new Date().toISOString()}
# Suite ID: suite_${now % 100000}

name: ${(lower.match(/(?:suite|config)\s+(?:for|to|named|called)?\s*[""]?([A-Za-z][A-Za-z0-9\s\-_]+)/i)?.[1]?.trim().toLowerCase().replace(/\s+/g, "-") || "cdn-regression-suite")}
description: "web app regression test suite for ${targetEnv} environment — validates edge delivery, caching, and routing behavior"
target: ${targetEnv}
environment: ${network}
parallelism: ${parallelism}
retries: 2
timeout: ${180 + Math.floor(Math.random() * 120)}
failFast: false

integrations:
  slack:
    channel: "#cdn-alerts"
    notifyOn: ["failure", "regression", "new"]
  github:
    labels: ["regression", "cdn", "${targetEnv}"]
    assignees: ["sre-team"]
  jira:
    project: "OPS"
    issueType: "Bug"
    components: ["cdn", "${targetEnv}"]

test_selection:
  categories:
  ${[
    includeCaching && "- caching",
    includeGeo && "- routing",
    includeSecurity && "- security",
    includePerformance && "- performance",
    !includeCaching && !includeGeo && !includeSecurity && !includePerformance && "- caching",
    "- url-health",
  ].filter(Boolean).join("\n  ")}

  priorities:
    - P0
    - P1

  tags:
    - "regression"
    - "${targetEnv}"

schedule:
  frequency: "daily"
  time: "06:00 UTC"
  days: ["monday", "tuesday", "wednesday", "thursday", "friday"]

tests:
${[
  (includeCaching || true) && `  - name: "Cache HIT/MISS validation"
    category: "caching"
    priority: P0
    automated: true
    script: "tests/caching/cache_hit_validation.yaml"
    description: "Verify static assets are served from edge cache with correct cache headers"`,
  includeGeo && `  - name: "Geo-routing validation"
    category: "routing"
    priority: P1
    automated: true
    script: "tests/routing/geo_routing_validation.yaml"
    description: "Verify requests are routed to correct edge PoP based on geographic region"`,
  includeSecurity && `  - name: "TLS handshake check"
    category: "security"
    priority: P0
    automated: true
    script: "tests/security/tls_handshake_check.yaml"
    description: "Validate TLS certificate chain and handshake completion across all edge nodes"`,
  includePerformance && `  - name: "Latency SLO validation"
    category: "performance"
    priority: P1
    automated: true
    script: "tests/performance/latency_slo_check.yaml"
    description: "Verify p95 response time remains under 500ms SLO threshold for all regions"`,
  `  - name: "URL health check"
    category: "url-health"
    priority: P0
    automated: true
    script: "tests/url_health/endpoint_health.yaml"
    description: "Verify all configured endpoints return expected status codes"`,
].filter(Boolean).join("\n")}`,
    finishReason: "stop",
  };
}

async function mockComplete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
  const { messages } = req;
  const userMsg = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
  const lower = userMsg.toLowerCase().trim();
  const skillId = _getSkillId(messages);

  // Greeting detection — short or greeting messages
  if (_isGreeting(lower) || lower.length < 3) {
    return {
      content: skillId ? _skillGreeting(skillId) : _GENERIC_GREETING,
      finishReason: "stop",
    };
  }

  // Skill-specific routing based on [SKILL:xxx] marker in system prompt
  switch (skillId) {
    case "generate-tests":
      return _handleGenerateTests(userMsg, messages);
    case "analyze-results":
      return _handleAnalyzeResults(userMsg);
    case "explain-diff":
      return _handleExplainDiff(userMsg);
    case "generate-script":
      return _handleGenerateScript(userMsg);
    case "generate-suite":
      return _handleGenerateSuite(userMsg);
    case null:
    case undefined:
      break;
  }

  // No explicit skill — generic help
  return {
    content: `I understand you're asking about: "${userMsg.substring(0, 100)}". As a web app regression assistant, I can help with:

• **Generating test cases** — describe the web app behavior you want to validate
• **Writing test scripts** — YAML scripts for automated testing
• **Analyzing results** — explain test failures and regressions
• **Comparing runs** — interpret baseline vs candidate diffs
• **Generating suite configs** — YAML configurations for test suites

Select a skill above or describe what you need more specifically.`,
    finishReason: "stop",
  };
}

class MockLLMProvider implements ILLMProvider {
  readonly type: LLMProviderType = "mock";

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    return mockComplete(req);
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}

// ── OpenAI-Compatible Provider ──────────────────────────────────────

class OpenAILLMProvider implements ILLMProvider {
  readonly type: LLMProviderType = "openai";

  constructor(private config: LLMConfig) {}

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const url = this.config.apiUrl ?? "https://api.openai.com/v1/chat/completions";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey ?? ""}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: req.messages,
        temperature: req.temperature ?? this.config.temperature,
        max_tokens: req.maxTokens ?? this.config.maxTokens,
        stream: false,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      throw new Error(`LLM API error ${res.status}: ${text}`);
    }
    const data = await res.json();
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content ?? "",
      finishReason: choice?.finish_reason === "stop" ? "stop" : "length",
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.complete({ messages: [{ role: "user", content: "ping" }], maxTokens: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

// ── WebLLM Provider (requires @mlc-ai/web-llm package + WebGPU) ─────

let _webLlmAvailable: boolean | null = null;
let _webLlmProgressCallback: ((progress: number, text: string) => void) | null = null;

export function setWebLLMProgressCallback(cb: ((progress: number, text: string) => void) | null): void {
  _webLlmProgressCallback = cb;
}

export async function checkWebLLM(): Promise<boolean> {
  if (_webLlmAvailable !== null) return _webLlmAvailable;
  try {
    await import("@mlc-ai/web-llm");
    _webLlmAvailable = true;
  } catch (e) {
    console.warn("WebLLM import failed:", e);
    _webLlmAvailable = false;
  }
  return _webLlmAvailable;
}

class WebLLMProvider implements ILLMProvider {
  readonly type: LLMProviderType = "webllm";
  private engine: any = null;
  private _initPromise: Promise<void> | null = null;

  constructor(private config: LLMConfig) {}

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const avail = await checkWebLLM();
    if (!avail) {
      return {
        content: "WebLLM is not available. This browser lacks WebGPU support or the `@mlc-ai/web-llm` package is not installed.\n\nTo use WebLLM:\n1. Use Chrome (≥113) with WebGPU enabled\n2. Run `pnpm add @mlc-ai/web-llm`\n\nFor now, switch to **Mock (offline)** or configure an **OpenAI-compatible API** in Settings.",
        finishReason: "error",
      };
    }
    if (!this.engine) {
      if (!this._initPromise) this._initPromise = this._init();
      await this._initPromise;
    }
    const res = await this.engine.chat.completions.create({
      messages: req.messages.map(m => ({ role: m.role, content: m.content })),
      temperature: req.temperature ?? this.config.temperature,
      max_tokens: req.maxTokens ?? this.config.maxTokens,
    });
    const choice = res.choices?.[0];
    return {
      content: choice?.message?.content ?? "",
      finishReason: choice?.finish_reason === "stop" ? "stop" : "length",
    };
  }

  private async _init() {
    const mod = await import("@mlc-ai/web-llm");
    this.engine = await mod.CreateMLCEngine(
      this.config.model || "Llama-3.2-1B-Instruct-q4f32_1-MLC",
      {
        initProgressCallback: (report: { progress: number; text: string }) => {
          if (_webLlmProgressCallback) {
            _webLlmProgressCallback(report.progress, report.text);
          }
        },
      },
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      const avail = await checkWebLLM();
      if (!avail) return false;
      if (!this.engine) await this._init();
      return this.engine !== null;
    } catch {
      return false;
    }
  }
}

// ── Chrome Built-in AI Provider (LanguageModel API, Chrome 148+) ────

let _chromeAIAvailable: boolean | null = null;
let _chromeAIProgressCallback: ((progress: number, text: string) => void) | null = null;

export function setChromeAIProgressCallback(cb: ((progress: number, text: string) => void) | null): void {
  _chromeAIProgressCallback = cb;
}

export async function checkChromeAI(): Promise<boolean> {
  if (_chromeAIAvailable !== null) return _chromeAIAvailable;
  try {
    if (!("LanguageModel" in self)) {
      _chromeAIAvailable = false;
      return false;
    }
    const availability: string = await (self as any).LanguageModel.availability();
    _chromeAIAvailable = availability !== "unavailable";
    return _chromeAIAvailable;
  } catch {
    _chromeAIAvailable = false;
    return false;
  }
}

export async function getChromeAIStatus(): Promise<"available" | "downloadable" | "downloading" | "unavailable"> {
  if (!("LanguageModel" in self)) return "unavailable";
  try {
    return await (self as any).LanguageModel.availability() as any;
  } catch {
    return "unavailable";
  }
}

class ChromeBuiltinLLMProvider implements ILLMProvider {
  readonly type: LLMProviderType = "chrome";
  private session: any = null;
  private _initPromise: Promise<void> | null = null;

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const avail = await checkChromeAI();
    if (!avail) {
      return {
        content: "Chrome Built-in AI is not available. This requires Chrome 148+ on desktop with Gemini Nano enabled.\n\nTo enable:\n1. Go to chrome://flags/#optimization-guide-on-device-model → Enabled\n2. Go to chrome://flags/#prompt-api-for-gemini-nano → Enabled\n3. Restart Chrome\n4. Visit chrome://on-device-internals to check model download status",
        finishReason: "error",
      };
    }
    if (!this.session) {
      if (!this._initPromise) this._initPromise = this._init();
      await this._initPromise;
    }

    const systemMsg = req.messages.find(m => m.role === "system");
    const userMessages = req.messages.filter(m => m.role !== "system").map(m => m.content).join("\n");

    try {
      const result = await this.session.prompt(userMessages);
      return {
        content: result,
        finishReason: "stop",
      };
    } catch (err) {
      return {
        content: `Chrome AI error: ${err instanceof Error ? err.message : "Unknown error"}`,
        finishReason: "error",
      };
    }
  }

  private async _init() {
    this.session = await (self as any).LanguageModel.create({
      monitor: (m: any) => {
        if (_chromeAIProgressCallback) {
          m.addEventListener("downloadprogress", (e: any) => {
            _chromeAIProgressCallback!(e.loaded, `Downloading Gemini Nano model...`);
          });
        }
      },
    });
  }

  async testConnection(): Promise<boolean> {
    return checkChromeAI();
  }
}

// ── Singleton Service ───────────────────────────────────────────────

function _resolveInitialConfig(): LLMConfig {
  const envUseMock = import.meta.env.VITE_USE_MOCK;
  if (envUseMock === "false") {
    return {
      provider: (import.meta.env.VITE_LLM_PROVIDER as LLMProviderType) || "chrome",
      apiKey: import.meta.env.VITE_LLM_API_KEY || "",
      apiUrl: import.meta.env.VITE_LLM_API_URL || "",
      model: import.meta.env.VITE_LLM_MODEL || "gemini-2.0-flash-lite",
      temperature: 0.7,
      maxTokens: 2048,
    };
  }
  return { ...DEFAULT_LLM_CONFIG };
}

let _config: LLMConfig = _resolveInitialConfig();
let _provider: ILLMProvider = _buildProvider(_config);
let _chatHistory: { role: "system" | "user" | "assistant"; content: string }[] = [];
let _skills: LLMSkillDefinition[] = [];

export function registerSkills(skills: LLMSkillDefinition[]): void {
  _skills = skills;
}

export function getRegisteredSkills(): LLMSkillDefinition[] {
  return _skills;
}

export function getLLMConfig(): LLMConfig {
  return { ..._config };
}

export function setLLMConfig(config: Partial<LLMConfig>): LLMConfig {
  _config = { ..._config, ...config };
  _provider = _buildProvider(_config);
  return getLLMConfig();
}

function _buildProvider(config: LLMConfig): ILLMProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAILLMProvider(config);
    case "webllm":
      return new WebLLMProvider(config);
    case "chrome":
      return new ChromeBuiltinLLMProvider();
    case "mock":
    default:
      return new MockLLMProvider();
  }
}

export function getProvider(): ILLMProvider {
  return _provider;
}

export async function llmComplete(
  messages: LLMMessage[],
  opts?: { temperature?: number; maxTokens?: number },
): Promise<LLMCompletionResponse> {
  return _provider.complete({
    messages,
    temperature: opts?.temperature ?? _config.temperature,
    maxTokens: opts?.maxTokens ?? _config.maxTokens,
  });
}

export async function llmChat(
  message: string,
  skillSystemPrompt?: string,
): Promise<LLMCompletionResponse> {
  const messages: LLMMessage[] = [];
  if (skillSystemPrompt) {
    messages.push({ role: "system", content: skillSystemPrompt });
  }
  messages.push(..._chatHistory.slice(-10));
  messages.push({ role: "user", content: message });
  const res = await _provider.complete({
    messages,
    temperature: _config.temperature,
    maxTokens: _config.maxTokens,
  });
  _chatHistory.push({ role: "user", content: message });
  _chatHistory.push({ role: "assistant", content: res.content });
  if (_chatHistory.length > 50) {
    _chatHistory = _chatHistory.slice(-50);
  }
  return res;
}

export function clearChatHistory(): void {
  _chatHistory = [];
}

export function syncChatHistory(messages: { role: "system" | "user" | "assistant"; content: string }[]): void {
  _chatHistory = messages.slice(-50);
}

export async function generateTestsWithLLM(
  params: GenerateWithLLMParams,
): Promise<TestCase[]> {
  const skill = _skills.find(s => s.id === "generate-tests");
  const prompt = `Generate ${params.count} web app test cases for the "${params.category}" category. Description: ${params.description}. Respond with a JSON array of test case objects, each with: name, description, category (use "${params.category}"), priority (P0-P3), severity, status ("active"), tags (array of strings), owner ("llm"), automated (true), scriptPath (use .yaml extension), preconditions, expectedBehavior, expectedStatus (HTTP number), predicates (array of {id, type, field, expected, operator, description}), and suiteIds.`;

  const res = await _provider.complete({
    messages: [
      {
        role: "system",
        content: `You are a web app test engineer generating structured test cases. Always respond with valid JSON only, no markdown formatting. Use this skill context: ${skill?.systemPrompt ?? ""}`,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    maxTokens: 4096,
  });

  const testCases: TestCase[] = [];
  try {
    const parsed = JSON.parse(res.content);
    const items = Array.isArray(parsed) ? parsed : parsed.testCases ?? parsed.tests ?? [];
    for (const item of items.slice(0, params.count)) {
      const tc = createTestCase({
        name: item.name ?? `Generated Test ${testCases.length + 1}`,
        description: item.description ?? "",
        category: item.category ?? params.category,
        priority: item.priority ?? "P2",
        severity: item.severity ?? "minor",
        status: "active",
        tags: item.tags ?? [params.category.replace(/[^a-z0-9]/g, "_")],
        owner: item.owner ?? "llm",
        suiteIds: [...params.suites],
        automated: true,
        scriptPath: item.scriptPath ?? `tests/generated/llm/tc_${testCases.length + 1}.yaml`,
        preconditions: item.preconditions ?? "",
        expectedBehavior: item.expectedBehavior ?? "",
        documentation: item.documentation ?? "",
        relatedTestIds: [],
        requestHeaders: { "Accept": "application/json" },
        cookies: {},
        expectedStatus: item.expectedStatus ?? 200,
        testType: "web",
        config: {},
        assertions: [],
        captureResponseHeaders: ["X-Cache", "X-Request-ID"],
        filmstrip: { enabled: false, threshold: 0.99 },
        predicates: item.predicates ?? [],
        version: 1,
        changelog: [],
      });
      testCases.push(tc);
    }
  } catch {
    throw new Error(
      `Failed to parse LLM response as test cases. Raw: ${res.content.substring(0, 200)}`,
    );
  }

  return testCases;
}

// ── Test Config URL Encoding ─────────────────────────────────────────

const PENDING_TEST_CONFIG_KEY = "aware_pending_test_config";

export function savePendingTestConfig(config: Record<string, unknown>): void {
  localStorage.setItem(PENDING_TEST_CONFIG_KEY, JSON.stringify(config));
}

export function getPendingTestConfig(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(PENDING_TEST_CONFIG_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_TEST_CONFIG_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function encodeTestConfigForNav(config: Record<string, unknown>): string {
  try {
    const json = JSON.stringify(config);
    return btoa(encodeURIComponent(json));
  } catch {
    return "";
  }
}

export function decodeTestConfigFromNav(encoded: string): Record<string, unknown> {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function extractTestConfigFromMessage(content: string): Record<string, unknown> | null {
  const startMarker = "---TEST_CONFIG_START---";
  const endMarker = "---TEST_CONFIG_END---";
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
  const jsonStr = content.substring(startIdx + startMarker.length, endIdx).trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

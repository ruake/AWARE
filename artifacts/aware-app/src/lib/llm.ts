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

// ── Mock Provider (demo/dev — generates template-based output) ──────

const MOCK_RESPONSES: Record<string, string> = {
  "generate-tests": `Generate comprehensive CDN test cases covering edge caching, origin shield behavior, and cache key variations.

Each test should validate:
  - Cache HIT/MISS status codes
  - Response header propagation (X-Cache, Age, CF-Cache-Status)
  - Edge node geographic routing
  - Origin shield fallback behavior
  - Cache purging propagation delay

Prioritize regression scenarios that could occur during Akamai-to-CloudFront migration.`,

  "generate-script": `import { test, expect } from '@playwright/test';

const BASE = process.env.APP_URL || 'https://example.com';
const EDGE_CACHE_HEADERS = ['X-Cache', 'CF-Cache-Status', 'Age'];

test.describe('CDN Edge Regression Suite', () => {
  test('CDN01: Static asset returns HIT after second request', async ({ page }) => {
    const url = BASE + '/assets/logo.png';
    const resp1 = await page.request.get(url);
    expect(resp1.headers()['CF-Cache-Status'] || resp1.headers()['X-Cache']).toMatch(/MISS|DYNAMIC/);

    const resp2 = await page.request.get(url);
    const cache2 = resp2.headers()['CF-Cache-Status'] || resp2.headers()['X-Cache'];
    expect(cache2).toMatch(/HIT|STALE/);
  });

  test('CDN02: Origin shield populates on cache miss', async ({ page }) => {
    const resp = await page.request.get(BASE + '/api/health');
    const age = resp.headers()['Age'];
    expect(Number(age) || 0).toBeGreaterThanOrEqual(0);
  });
});`,

  "analyze-results": `## Regression Analysis Report

### Summary
Found **12 regressions** across 3 categories:

### 1. Cache Policy Regression (7 failures)
- **Root Cause**: Origin \`Cache-Control: max-age=0\` overriding CDN TTL
- **Affected Tests**: TC-001 through TC-007
- **Severity**: HIGH — impacts all asset delivery
- **Recommendation**: Revert origin header change from PR #892

### 2. Geo-Routing Regression (3 failures)
- **Root Cause**: Edge function deployment missing \`x-region\` header rewrite
- **Affected Tests**: TC-015, TC-016, TC-017
- **Severity**: MEDIUM — only affects APAC traffic
- **Recommendation**: Roll forward with corrected edge function

### 3. TLS Handshake Regression (2 failures)
- **Root Cause**: Certificate bundle update dropped intermediate CA
- **Affected Tests**: TC-022, TC-023
- **Severity**: CRITICAL — breaks all HTTPS connections
- **Recommendation**: Immediate rollback of certificate update`,

  "explain-diff": `## Comparison Analysis: Baseline vs Candidate

### Overview
- **Total diffs**: 15
- **Regressions (new failures)**: 7 — \`diff_0\` through \`diff_6\`
- **Fixed**: 4 — \`diff_10\` through \`diff_13\`
- **Still Failing**: 2 — \`diff_7\`, \`diff_8\`
- **Duration Regressions**: 2 — \`diff_14\`, \`diff_15\`

### Key Findings
1. **Cache HIT ratio dropped** from 94% → 72% — primarily affects static assets
2. **3 new 503 errors** on origin-shield endpoints suggest upstream timeout
3. **APAC edge latency increased** 240ms → 890ms — possible routing issue
4. **4 previously failing tests now pass** — consistent with PR #845 fix

### Recommendation
**BLOCK promotion** until cache POLICY-001 and TLS handshake issues are resolved. APAC routing can be addressed in a follow-up.`,

  "generate-suite": `name: cdn-regression-suite
description: "Comprehensive CDN regression test suite for Akamai-to-CloudFront migration"
target: production
environment: staging
parallelism: 4
retries: 2
timeout: 300
failFast: false

integrations:
  slack:
    channel: "#cdn-alerts"
    notifyOn: ["failure", "regression"]
  github:
    labels: ["regression", "cdn"]
    assignees: ["sre-team"]
  jira:
    project: "OPS"
    issueType: "Bug"

tests:
  - name: "Cache HIT verification"
    category: "caching"
    priority: P0
    automated: true

  - name: "Geo-routing validation"
    category: "routing"
    priority: P1
    automated: true

  - name: "TLS handshake check"
    category: "security"
    priority: P0
    automated: true`,
};

function mockComplete(messages: LLMMessage[]): LLMCompletionResponse {
  const userMsg = messages.find(m => m.role === "user")?.content ?? "";
  const lower = userMsg.toLowerCase();
  let content = "";

  if (lower.includes("test") && (lower.includes("generat") || lower.includes("create"))) {
    content = MOCK_RESPONSES["generate-tests"];
  } else if (lower.includes("script") || lower.includes("code") || lower.includes("playwright")) {
    content = MOCK_RESPONSES["generate-script"];
  } else if (lower.includes("analyz") || lower.includes("result") || lower.includes("fail")) {
    content = MOCK_RESPONSES["analyze-results"];
  } else if (lower.includes("diff") || lower.includes("compar") || lower.includes("promot")) {
    content = MOCK_RESPONSES["explain-diff"];
  } else if (lower.includes("suite") || lower.includes("config") || lower.includes("yaml")) {
    content = MOCK_RESPONSES["generate-suite"];
  } else {
    content = `I understand you're asking about: "${userMsg.substring(0, 100)}". As a CDN regression assistant, I can help with:

- **Generating test cases** — describe the CDN behavior you want to validate
- **Writing test scripts** — Playwright/Jest scripts for automated testing
- **Analyzing results** — explain test failures and regressions
- **Comparing runs** — interpret baseline vs candidate diffs
- **Generating suite configs** — YAML configurations for test suites

What would you like me to help with?`;
  }

  return {
    content,
    finishReason: "stop",
    usage: { promptTokens: Math.round(messages.reduce((a, m) => a + m.content.length / 4, 0)), completionTokens: Math.round(content.length / 4), totalTokens: 0 },
  };
}

class MockLLMProvider implements ILLMProvider {
  readonly type: LLMProviderType = "mock";

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    return mockComplete(req.messages);
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

// ── WebLLM Provider (stub — requires @mlc-ai/web-llm) ──────────────

class WebLLMProvider implements ILLMProvider {
  readonly type: LLMProviderType = "webllm";
  private engine: any = null;

  constructor(private config: LLMConfig) {}

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (!this.engine) await this._init();
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
    try {
      // @ts-expect-error - @mlc-ai/web-llm is optional; handled in try/catch
      const mod = await import("@mlc-ai/web-llm") as any;
      this.engine = await mod.CreateMLCEngine(
        this.config.model || "Llama-3.2-1B-Instruct-q4f32_1-MLC",
      );
    } catch (e) {
      throw new Error(
        `WebLLM init failed: ${e}. Install @mlc-ai/web-llm and ensure WebGPU is available.`,
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this._init();
      return this.engine !== null;
    } catch {
      return false;
    }
  }
}

// ── Singleton Service ───────────────────────────────────────────────

let _config: LLMConfig = { ...DEFAULT_LLM_CONFIG };
let _provider: ILLMProvider = new MockLLMProvider();
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

export async function generateTestsWithLLM(
  params: GenerateWithLLMParams,
): Promise<TestCase[]> {
  const skill = _skills.find(s => s.id === "generate-tests");
  const prompt = `Generate ${params.count} CDN test cases for the "${params.category}" category. Description: ${params.description}. Respond with a JSON array of test case objects, each with: name, description, category (use "${params.category}"), priority (P0-P3), severity, status ("active"), tags (array of strings), owner ("llm"), automated (true), scriptPath, preconditions, expectedBehavior, expectedStatus (HTTP number), predicates (array of {id, type, field, expected, operator, description}), and suiteIds.`;

  const res = await _provider.complete({
    messages: [
      {
        role: "system",
        content: `You are a CDN test engineer generating structured test cases. Always respond with valid JSON only, no markdown formatting. Use this skill context: ${skill?.systemPrompt ?? ""}`,
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
        scriptPath: item.scriptPath ?? `tests/generated/llm/tc_${testCases.length + 1}.spec.ts`,
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

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
  "generate-tests": `I'll help you create a CDN test case. Let me ask a few questions to collect the requirements.

Please fill out the form below with the test details:

[FORM]
[
  {"question":"Test Name","type":"text","id":"name"},
  {"question":"Category","type":"select","id":"category","options":["geo-match","locale-split","caching","security","performance","routing","tls","ddos","url-health"]},
  {"question":"Priority","type":"radio","id":"priority","options":[{"value":"P0","label":"P0 - Critical"},{"value":"P1","label":"P1 - Major"},{"value":"P2","label":"P2 - Minor"},{"value":"P3","label":"P3 - Trivial"}]},
  {"question":"Severity","type":"select","id":"severity","options":["critical","major","minor","trivial"]},
  {"question":"Expected Status Code","type":"select","id":"expectedStatus","options":["200","201","301","302","403","404","429","500"]},
  {"question":"Automated?","type":"toggle","id":"automated","default":true}
]
[/FORM]

Once you submit the form, I'll generate the complete test configuration with predicates, request headers, and filmstrip settings.`,

  "generate-script": `# CDN Regression Test Script (YAML)
# Compatible with standard CDN test runners

config:
  base_url: "https://example.com"
  headers:
    User-Agent: "AWARE-TestRunner/2.0"
  timeout: 30s
  retries: 2

tests:
  - name: "CDN01: Static asset cache HIT after warm-up"
    description: >
      Verify that a static asset transitions from
      MISS to HIT on second request
    request:
      method: GET
      path: "/assets/logo.png"
      headers:
        Accept: "image/*"
    expect:
      status: 200
      headers:
        X-Cache:
          - pattern: "HIT|STALE"
            message: "Asset should be served from edge cache"
        Age:
          type: number
          gt: 0
      predicates:
        - type: responseTime
          field: duration
          expected: "2000"
          operator: lt

  - name: "CDN02: Origin shield fallback"
    description: >
      Validate origin shield serves cached content
      when origin is degraded
    request:
      method: GET
      path: "/api/health"
    expect:
      status: 200
      headers:
        Age:
          exists: true
        CF-Cache-Status:
          - pattern: "HIT|STALE|DYNAMIC"
      predicates:
        - type: statusCode
          field: ""
          expected: "200"
          operator: equals

  - name: "CDN03: Geo-routing APAC"
    description: APAC users must be routed to nearest edge
    request:
      method: GET
      path: "/api/v1/data"
      headers:
        X-Region: "ap-southeast-1"
    expect:
      status: 200
      headers:
        X-Edge-Location:
          - pattern: "^(HKG|SIN|NRT)"
            message: "Should route to APAC edge"
      response_time:
        max: 500ms`,

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

function _looksLikeFormSubmission(text: string): boolean {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  return lines.length >= 2 && lines.every(l => /^\w+:\s*\S/.test(l));
}

function _getSkillId(messages: LLMMessage[]): string | null {
  for (const m of messages) {
    if (m.role === "system") {
      const match = m.content.match(/\[SKILL:([a-z-]+)\]/);
      if (match) return match[1];
    }
  }
  return null;
}

function mockComplete(messages: LLMMessage[]): LLMCompletionResponse {
  const userMsg = messages.find(m => m.role === "user")?.content ?? "";
  const lower = userMsg.toLowerCase();
  const skillId = _getSkillId(messages);
  let content = "";

  if (skillId === "generate-tests" && _looksLikeFormSubmission(userMsg)) {
    const lines = userMsg.split("\n").filter(l => l.includes(":"));
    const getName = () => {
      const n = lines.find(l => l.startsWith("name:"));
      return n ? n.split(":")[1].trim() : "CDN Cache HIT Verification";
    };
    const getCat = () => {
      const c = lines.find(l => l.startsWith("category:"));
      return c ? c.split(":")[1].trim() : "caching";
    };
    const getPrio = () => {
      const p = lines.find(l => l.startsWith("priority:"));
      return p ? p.split(":")[1].trim() : "P2";
    };
    const getSeverity = () => {
      const s = lines.find(l => l.startsWith("severity:"));
      return s ? s.split(":")[1].trim() : "minor";
    };
    const getStatus = () => {
      const s = lines.find(l => l.startsWith("expectedStatus:"));
      return s ? s.split(":")[1].trim() : "200";
    };
    const isAuto = () => {
      const a = lines.find(l => l.startsWith("automated:"));
      return a ? a.split(":")[1].trim() === "true" : true;
    };
    const name = getName();
    const cat = getCat();
    content = `Here's a summary of the test configuration I've generated:

- **Name**: ${name}
- **Category**: ${cat}
- **Priority**: ${getPrio()} · **Severity**: ${getSeverity()}
- **Expected Status**: HTTP ${getStatus()}
- **Predicates**: 2 rules (status code + response time)
- **Automated**: ${isAuto() ? "Yes" : "No"}

Please review the draft card below with the full configuration. Click **"Confirm & Open in Test Manager"** when you're ready to save it.

---TEST_CONFIG_START---
{"name":"${name}","description":"CDN test case for ${cat} — validates correct edge behavior across Akamai network","category":"${cat}","priority":"${getPrio()}","severity":"${getSeverity()}","status":"active","tags":["${cat}","cdn","regression"],"owner":"engineer@co.com","automated":${isAuto()},"scriptPath":"tests/${cat}/${name.toLowerCase().replace(/\s+/g, "_")}.yaml","preconditions":"- Edge token valid\\n- Test data seeded\\n- Cache warmed","expectedBehavior":"- Status ${getStatus()}\\n- Response time < 500ms\\n- Correct headers present","expectedStatus":${getStatus()},"requestHeaders":{"Accept":"application/json","User-Agent":"AWARE-TestRunner/2.0"},"cookies":{},"captureResponseHeaders":["X-Cache","X-Request-ID","Age"],"filmstrip":{"enabled":false,"threshold":0.99},"predicates":[{"id":"pred_0","type":"statusCode","field":"","expected":"${getStatus()}","operator":"equals","description":"Response status is ${getStatus()}"},{"id":"pred_1","type":"responseTime","field":"duration","expected":"500","operator":"lt","description":"Response under 500ms"}]}
---TEST_CONFIG_END---`;
  } else if (skillId === "generate-tests" || (lower.includes("test") && (lower.includes("generat") || lower.includes("create")))) {
    content = MOCK_RESPONSES["generate-tests"];
  } else if (skillId === "generate-script" || lower.includes("script") || lower.includes("yaml") || lower.includes("code")) {
    content = MOCK_RESPONSES["generate-script"];
  } else if (skillId === "analyze-results" || lower.includes("analyz") || lower.includes("result") || lower.includes("fail")) {
    content = MOCK_RESPONSES["analyze-results"];
  } else if (skillId === "explain-diff" || lower.includes("diff") || lower.includes("compar") || lower.includes("promot")) {
    content = MOCK_RESPONSES["explain-diff"];
  } else if (skillId === "generate-suite" || lower.includes("suite") || lower.includes("config") || lower.includes("yaml")) {
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

  constructor(private config: LLMConfig) {}

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const avail = await checkWebLLM();
    if (!avail) {
      return {
        content: "WebLLM is not available. This browser lacks WebGPU support or the `@mlc-ai/web-llm` package is not installed.\n\nTo use WebLLM:\n1. Use Chrome (≥113) with WebGPU enabled\n2. Run `pnpm add @mlc-ai/web-llm`\n\nFor now, switch to **Mock (offline)** or configure an **OpenAI-compatible API** in Settings.",
        finishReason: "error",
      };
    }
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

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const avail = await checkChromeAI();
    if (!avail) {
      return {
        content: "Chrome Built-in AI is not available. This requires Chrome 148+ on desktop with Gemini Nano enabled.\n\nTo enable:\n1. Go to chrome://flags/#optimization-guide-on-device-model → Enabled\n2. Go to chrome://flags/#prompt-api-for-gemini-nano → Enabled\n3. Restart Chrome\n4. Visit chrome://on-device-internals to check model download status",
        finishReason: "error",
      };
    }
    if (!this.session) await this._init();

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
  const prompt = `Generate ${params.count} CDN test cases for the "${params.category}" category. Description: ${params.description}. Respond with a JSON array of test case objects, each with: name, description, category (use "${params.category}"), priority (P0-P3), severity, status ("active"), tags (array of strings), owner ("llm"), automated (true), scriptPath (use .yaml extension), preconditions, expectedBehavior, expectedStatus (HTTP number), predicates (array of {id, type, field, expected, operator, description}), and suiteIds.`;

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
  const json = JSON.stringify(config);
  const encoded = encodeURIComponent(json);
  return btoa(encoded);
}

export function decodeTestConfigFromNav(encoded: string): Record<string, unknown> {
  const json = decodeURIComponent(atob(encoded));
  return JSON.parse(json);
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

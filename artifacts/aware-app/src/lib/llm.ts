import type {
  LLMConfig,
  LLMProviderType,
  LLMMessage,
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMSkillDefinition,
} from "./types";
import { DEFAULT_LLM_CONFIG } from "./types";

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

function _skillGreeting(skillId: string): string {
  const map: Record<string, string> = {
    "analyze-results": `Hello! I'm your regression analyst. I can review test run results and identify regressions, root causes, and remediation steps.

Please share the test run data or describe what regressions you're seeing — cache ratio drops, latency spikes, error rate increases, or specific test failures.`,
    "explain-diff": `Hello! I'm your release engineer. I can analyze differences between baseline and candidate test runs to determine if a promotion is safe.

Share the comparison diff data or describe what changed between runs — I'll break down regressions, fixes, and duration changes with a clear promote/block recommendation.`,
    "generate-script": `Hello! I'm your test script writer. I can generate portable YAML test definitions for web application testing scenarios.

Describe the test scenario you need a script for — include the endpoint, expected behavior, headers, and any validation predicates you want to check.`,
  };
  return map[skillId] ?? `Hello! I'm your regression testing assistant. I can help you with:

• **Writing test scripts** — YAML scripts for automated testing
• **Analyzing results** — explain test failures and regressions
• **Comparing runs** — interpret baseline vs candidate diffs

What would you like to work on today?`;
}

const _GENERIC_GREETING = `Hello! I'm your regression testing assistant. I can help you with:

• **Writing test scripts** — YAML scripts for automated testing
• **Analyzing results** — explain test failures and regressions
• **Comparing runs** — interpret baseline vs candidate diffs

What skill would you like to use? Select one from the list above.`;



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
    case "analyze-results":
      return _handleAnalyzeResults(userMsg);
    case "explain-diff":
      return _handleExplainDiff(userMsg);
    case "generate-script":
      return _handleGenerateScript(userMsg);
    case null:
    case undefined:
      break;
  }

  // No explicit skill — generic help
  return {
    content: `I understand you're asking about: "${userMsg.substring(0, 100)}". As a web app regression assistant, I can help with:

• **Writing test scripts** — YAML scripts for automated testing
• **Analyzing results** — explain test failures and regressions
• **Comparing runs** — interpret baseline vs candidate diffs

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

let _webLlmProgressCallback: ((progress: number, text: string) => void) | null = null;

export function checkWebLLM(): Promise<boolean> {
  return Promise.resolve(false);
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

let _chromeAIProgressCallback: ((progress: number, text: string) => void) | null = null;

export async function checkChromeAI(): Promise<boolean> {
  try {
    if (!("LanguageModel" in self)) return false;
    const availability: string = await (self as any).LanguageModel.availability();
    return availability !== "unavailable";
  } catch {
    return false;
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


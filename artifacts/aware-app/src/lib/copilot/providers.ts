import type {
  IProvider,
  ProviderStatus,
  ProviderType,
  ApiMessage,
  ToolDefinition,
  StreamDelta,
} from "./types";
import { synthesizeWithChromeAI, answerDirectWithChromeAI } from "./chromeAIDataLayer";

interface ChromeLanguageModel {
  availability(): Promise<"unavailable" | "downloadable" | "downloading" | "available">;
  create(options?: {
    systemPrompt?: string;
    signal?: AbortSignal;
    temperature?: number;
    topK?: number;
  }): Promise<ChromeAISession>;
}

interface ChromeAISession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

interface OldChromeAI {
  capabilities(): Promise<{ available: string }>;
  create(opts?: { systemPrompt?: string; signal?: AbortSignal }): Promise<OldChromeAISession>;
}

interface OldChromeAISession {
  promptStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

declare global {
  interface Window {
    ai?: { languageModel?: OldChromeAI };
    LanguageModel?: ChromeLanguageModel;
  }
}

// ── Keyword routing ───────────────────────────────────────────────────────────
// Deterministic tool selection — no LLM needed. Ordered from most-specific to
// least-specific so "flaky run history" → get_flaky_tests, not query_runs.

// Routing table — evaluated top-to-bottom, first match wins.
// More-specific patterns must appear BEFORE general catch-alls.
const KEYWORD_ROUTES: Array<{
  tool: string;
  args: Record<string, unknown>;
  patterns: RegExp[];
}> = [
  // ── Flakiness ──────────────────────────────────────────────────────────────
  {
    tool: "get_flaky_tests",
    args: {},
    patterns: [
      /flak/i,
      /unstable/i,
      /\bflip\b/i,
      /PASS.*FAIL|FAIL.*PASS/i,
      /reliab/i,
      /inconsist/i,
      /never.*fail/i,
      /high.risk.*test/i,
      /\bstable\b/i,
    ],
  },

  // ── Promotion gate ─────────────────────────────────────────────────────────
  {
    tool: "get_promotion_status",
    args: {},
    patterns: [
      /promot/i,
      /\bdeploy\b/i,
      /release.?ready/i,
      /go.to.prod/i,
      /can we.*(deploy|ship|release)/i,
      /prod.*(ready|block|gate)/i,
      /\bgate\b/i,
      /block.*rate|percent.*block/i,
      /uat.*threshold|above.*95/i,
      /last.*block/i,
      /successful.*promot/i,
      /gate.*trend|block.*often/i,
    ],
  },

  // ── Failure breakdown ──────────────────────────────────────────────────────
  {
    tool: "get_failure_breakdown",
    args: {},
    patterns: [
      /breakdown/i,
      /\bcategor/i,
      /why.*fail/i,
      /what.*failing/i,
      /root.cause/i,
      /failing most/i,
      /\bwaf\b/i,
      /security.*fail|security.*test/i,
      /bot.*manager|bot.*protect/i,
      /\btls\b|certificate.*valid/i,
      /performance.*fail|timing.*fail/i,
      /api.*fail|http.*fail/i,
      /regression.*alert|newly.*fail/i,
      /zero.*pass.*rate|zero.*pass\b/i,
      /\bedgeworker\b|edge.*worker/i,
      /cache.*behav|cdn.*cache.*test/i,
      /suite.*fail|fail.*suite/i,
      /\bheatmap\b/i,
      /\bfail/i,
    ],
  },

  // ── Compare environments ───────────────────────────────────────────────────
  {
    tool: "compare_environments",
    args: {},
    patterns: [
      /compare.*(env|qa|uat|prod)/i,
      /env.*(compar|health|summar|status|across)/i,
      /qa.*uat|uat.*prod/i,
      /all.*(env|environment)/i,
      /across.*(env|environment)/i,
      /qa.*health|qa.*deep.dive/i,
      /uat.*status|uat.*health/i,
      /prod.*status|prod.*health/i,
      /qa.*vs.*prod|quality.*gap/i,
      /worst.*env|env.*worst/i,
      /\bdegrading\b|env.*trend/i,
      /staging.*network/i,
      /production.*network/i,
      /cdn.*health|cdn.*summar/i,
      /cdn.*report|full.*cdn.*report/i,
      /playwright.*vs.*pytest|web.*vs.*api/i,
      /akamai.*health|akamai.*property/i,
    ],
  },

  // ── QA-specific runs ─────────────────────────────────────────────────────
  {
    tool: "query_runs",
    args: { limit: 10, env: "QA" },
    patterns: [/\bqa\b.*run|run.*\bqa\b/i],
  },

  // ── UAT-specific runs ─────────────────────────────────────────────────────
  {
    tool: "query_runs",
    args: { limit: 10, env: "UAT" },
    patterns: [/\buat\b.*run|run.*\buat\b/i],
  },

  // ── PROD-specific runs ─────────────────────────────────────────────────────
  {
    tool: "query_runs",
    args: { limit: 10, env: "PROD" },
    patterns: [/\bprod\b.*run|run.*\bprod\b/i],
  },

  // ── Health / summary / overview ──────────────────────────────────────────────
  {
    tool: "query_runs",
    args: { limit: 10 },
    patterns: [
      /\bsummary\b/i,
      /\bhealth\b/i,
      /\boverview\b/i,
      /\btrend\b/i,
      /overall.*(status|health|pass)/i,
    ],
  },

  // ── General runs (catch-all) ───────────────────────────────────────────────
  {
    tool: "query_runs",
    args: { limit: 10 },
    patterns: [
      /\brun\b/i,
      /pass.?rate/i,
      /latest.*(run|result|test)/i,
      /last \d+/i,
      /\bhistory\b/i,
      /failure.count/i,
      /test.result/i,
      /recent.*(run|test)/i,
      /playwright.*pass|playwright.*rate/i,
      /pytest.*pass|pytest.*rate|pytest.*result/i,
      /\bsuite\b/i,
      /test.*volume|test.*count|how.many.*test/i,
      /last test|latest test|most recent test/i,
      /tell me about.*(test|run|result)/i,
      /what.*happen|what.*went|how.*did/i,
      /show me.*(test|run|result|data)/i,
      /give me.*(test|run|result|data)/i,
      /\btest status\b|\brun status\b|\bcurrent status\b/i,
      /how.*test|test.*today|test.*this week/i,
      /any.*fail|did.*fail|are.*fail/i,
      /\bresult\b/i,
      /\blatest\b/i,
      /\brecent\b/i,
      /\bci\b/i,
      /how.much.data/i,
      /what.data.do.you/i,
      /how.many.run|how.many.test/i,
      /what.do.you.have|what.do.you.know/i,
      /data.*available|available.*data/i,
      /data.*coverage|coverage.*data/i,
      /\bscope\b/i,
    ],
  },

  // ── Environment comparison ─────────────────────────────────────────────────
  {
    tool: "compare_environments",
    args: {},
    patterns: [/\bcompare\b.*env/i, /env.*comparison/i, /qa.*vs.*uat|qa.*vs.*prod|uat.*vs.*prod/i],
  },
];

export function routeByKeyword(
  query: string,
): { tool: string; args: Record<string, unknown> } | null {
  for (const { tool, args, patterns } of KEYWORD_ROUTES) {
    if (patterns.some((p) => p.test(query))) return { tool, args };
  }
  return null;
}

// ── Template synthesis (Chrome AI path) ──────────────────────────────────────
export class ChromeProvider implements IProvider {
  readonly type: ProviderType = "chrome";
  readonly supportsToolCalling = false;

  private _initPromise: Promise<ProviderStatus> | null = null;

  async checkAvailability(): Promise<ProviderStatus> {
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      try {
        if (typeof (window as any).LanguageModel?.availability === "function") {
          const r = await (window as any).LanguageModel.availability();
          if (r === "available") return "available";
          if (r === "downloading" || r === "downloadable") return "downloading";
          return "unavailable";
        }
        if (typeof (window as any).ai?.languageModel?.capabilities === "function") {
          const api = (window as any).ai.languageModel;
          const r = await api.capabilities();
          const avail = typeof r === "object" ? r.available : r;
          if (avail === "readily") return "available";
          if (avail === "after-download" || avail === "downloadable") return "downloading";
          return "unavailable";
        }
        return "unavailable";
      } catch {
        return "unavailable";
      } finally {
        this._initPromise = null;
      }
    })();

    return this._initPromise;
  }

  async stream(
    messages: ApiMessage[],
    _tools: ToolDefinition[],
    signal: AbortSignal,
    onDelta: (delta: StreamDelta) => void,
  ): Promise<void> {
    const userQuery = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const query = typeof userQuery === "string" ? userQuery : JSON.stringify(userQuery);

    const lastUserIdx = messages.reduce((idx, m, i) => (m.role === "user" ? i : idx), -1);
    const currentTurnMessages = lastUserIdx >= 0 ? messages.slice(lastUserIdx) : [];
    const toolMessages = currentTurnMessages.filter((m) => m.role === "tool");

    const priorResponses = messages
      .slice(0, lastUserIdx)
      .filter((m) => m.role === "assistant" && typeof m.content === "string" && m.content)
      .map((m) => (typeof m.content === "string" ? m.content : ""))
      .filter(Boolean)
      .slice(-2);

    if (toolMessages.length > 0) {
      const assistantMsg = [...currentTurnMessages]
        .reverse()
        .find((m) => m.role === "assistant" && m.tool_calls);
      const toolName = assistantMsg?.tool_calls?.[0]?.function?.name ?? "tool";

      const lastToolMsg = toolMessages[toolMessages.length - 1];
      let rawData: unknown;
      try {
        rawData = JSON.parse(lastToolMsg?.content ?? "null");
      } catch {
        rawData = lastToolMsg?.content ?? null;
      }

      await synthesizeWithChromeAI({ toolName, rawData, userQuery: query, signal, onDelta });
      return;
    }

    await answerDirectWithChromeAI({ userQuery: query, priorResponses, signal, onDelta });
  }
}

// ── Provider Registry ─────────────────────────────────────────────────────────
export function createProvider(_type: ProviderType): IProvider {
  return new ChromeProvider();
}

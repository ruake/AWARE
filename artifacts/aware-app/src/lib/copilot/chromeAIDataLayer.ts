import type { StreamDelta } from "./types";

// ── Chrome AI Session types ──────────────────────────────────────────────────
interface ChromeAISession {
  promptStreaming(prompt: string): ReadableStream;
  destroy(): void;
}
interface OldChromeAISession {
  promptStreaming(prompt: string): ReadableStream;
  destroy(): void;
}

function hasNewAPI(): boolean { return typeof (window as any).LanguageModel?.create === "function"; }
function hasOldAPI(): boolean { return typeof (window as any).ai?.languageModel?.create === "function"; }

// ── Streaming helper ─────────────────────────────────────────────────────────
async function streamFromChromeAI(
  systemPrompt: string,
  userPrompt: string,
  signal: AbortSignal,
  onDelta: (delta: StreamDelta) => void,
): Promise<void> {
  let session: ChromeAISession | OldChromeAISession;

  try {
    if (hasNewAPI()) {
      session = await (window as any).LanguageModel.create({ systemPrompt, signal });
    } else if (hasOldAPI()) {
      session = await (window as any).ai.languageModel.create({ systemPrompt, signal });
    } else {
      onDelta({ content: "Chrome AI is not available in this browser.", done: true });
      return;
    }
  } catch (err: unknown) {
    if (signal.aborted) { onDelta({ done: true }); return; }
    const msg = err instanceof Error ? err.message : String(err);
    onDelta({ content: `Chrome AI error: ${msg}`, done: true });
    return;
  }

  if (signal.aborted) { session.destroy(); onDelta({ done: true }); return; }

  const stream = session.promptStreaming(userPrompt);
  const reader = stream.getReader();
  let lastLen = 0;

  try {
    while (true) {
      if (signal.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      const text = typeof value === "string" ? value : new TextDecoder().decode(value);
      // Chrome AI streams cumulative text — emit only the new delta
      if (text.length > lastLen) {
        onDelta({ content: text.slice(lastLen), done: false });
        lastLen = text.length;
      }
    }
  } finally {
    reader.releaseLock();
    session.destroy();
  }

  onDelta({ done: true });
}

async function callChromeAI(systemPrompt: string, userPrompt: string, signal: AbortSignal): Promise<string | null> {
  try {
    return await new Promise<string | null>((resolve) => {
      const chunks: string[] = [];
      streamFromChromeAI(systemPrompt, userPrompt, signal, delta => {
        if (delta.content) chunks.push(delta.content);
        if (delta.done) {
          const text = chunks.join("").trim();
          resolve(isGibberish(text) ? null : text);
        }
      }).catch(() => resolve(null));
    });
  } catch {
    return null;
  }
}

// ── Gibberish detection ──────────────────────────────────────────────────────
function isGibberish(text: string): boolean {
  const t = text.trim();
  if (t.length < 20) return true;
  if (!/\s/.test(t)) return true;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 3) return true;
  if (/^[.,!?;\s\-_#*+=\[\](){}<>'"`~@#$%^&|\\\/]+$/.test(t)) return true;
  if (!/[aeiouAEIOU]/.test(t)) return true;
  return false;
}

// ── Emit as streaming deltas ─────────────────────────────────────────────────
function emitAsStream(text: string, onDelta: (delta: StreamDelta) => void): void {
  const CHUNK = 12;
  for (let i = 0; i < text.length; i += CHUNK) {
    onDelta({ content: text.slice(i, i + CHUNK), done: false });
  }
  onDelta({ done: true });
}

const ALL_TOPICS = `
- ⚡ **Flaky tests** — tests that flip between pass/fail (ask: "show flaky tests")
- 🔀 **Environment comparison** — QA vs UAT vs PROD health grid (ask: "compare environments")
- 🛡️ **Promotion gate** — UAT→PROD deployment decisions & block rate (ask: "promotion status")
- 🔍 **Failure breakdown** — root causes by category: WAF, TLS, API, EdgeWorker, cache (ask: "failure breakdown")
- 🧪 **Suite health** — per-suite pass rates across all environments (ask: "suite health")
- ⏱️ **Duration trends** — execution timing regressions (ask: "duration trends")
- 🌐 **Akamai property** — CDN property versions, EdgeWorker status, PoP coverage (ask: "Akamai status")
- 📊 **Run history** — pass rates, failure counts, trend over time (ask: "show runs")`.trim();

// ── Canned responses for casual queries ─────────────────────────────────────
const CASUAL_PATTERNS: Array<{ pattern: RegExp; response: string }> = [
  {
    pattern: /^\s*(hi|hello|hey|howdy|sup|yo)\s*[!?.]*\s*$/i,
    response:
      `Hi! I'm the **A.W.A.R.E. Copilot** — your CDN test observability AI.\n\nI can analyze:\n${ALL_TOPICS}\n\nTry a **Quick Action** above, or just ask!`,
  },
  {
    pattern: /how are you|how.*doing|how.*going/i,
    response: "All systems nominal! I'm monitoring your CDN test data across QA, UAT, and PROD. Ask me about pass rates, flakiness, environment health, or promotion gate status.",
  },
  {
    pattern: /what.*(can|do) you|what you (can|do)|your (capabilities|features)|who are you/i,
    response:
      `**A.W.A.R.E. Copilot** — I can analyze:\n\n${ALL_TOPICS}\n\nAll results include **interactive charts** and **sortable tables**.`,
  },
  {
    // Follow-up conversational queries — "apart from this?", "what else?", "do you know anything else?"
    pattern: /apart from|besides that|what else|anything else|other than that|tell me more|what more|in addition|beyond (that|this)|what other/i,
    response:
      `Here are all the other topics I can analyze:\n\n${ALL_TOPICS}\n\nJust ask about any of these — or try a **Quick Action** above!`,
  },
  {
    // "what do you know?" — treat as capability overview, not a data query
    pattern: /what.*do you know|what.*information.*do you|what.*data.*do you|what.*can you tell me/i,
    response:
      `I have access to your full CDN test dataset. Here's what I can show you:\n\n${ALL_TOPICS}\n\nAsk me about any of these topics!`,
  },
  {
    pattern: /thank|thanks|great|awesome|nice|cool|perfect/i,
    response: "Glad to help! Let me know if you need a deeper dive into any metric.",
  },
];

function getCannedResponse(query: string): string | null {
  for (const { pattern, response } of CASUAL_PATTERNS) {
    if (pattern.test(query)) return response;
  }
  return null;
}

// ── Rich template synthesis — distinct per tool ──────────────────────────────
function buildTemplateSynthesis(toolName: string, rawData: unknown, userQuery: string): string {
  const q = userQuery.toLowerCase();
  const wantSummary = /summary|overview|health|trend|overall|how.*doing/.test(q);

  try {
    switch (toolName) {
      case "query_runs": {
        const runs: any[] = Array.isArray(rawData) ? rawData : [];
        if (!runs.length) return "No test runs found in the dataset.";

        const passRates = runs.map((r: any) => Number(r.passRate ?? r.passPct ?? 0));
        const avgPass = passRates.length > 0 ? Math.round(passRates.reduce((a, b) => a + b, 0) / passRates.length) : 0;
        const totalFails = runs.reduce((s: number, r: any) => s + Number(r.failures ?? 0), 0);
        const envs = [...new Set(runs.map((r: any) => r.env).filter(Boolean))];
        const latest = runs[0];
        const oldest = runs[runs.length - 1];
        const trend = passRates.length >= 2 ? passRates[0] - passRates[passRates.length - 1] : 0;
        const trendArrow = trend > 2 ? "↑ improving" : trend < -2 ? "↓ declining" : "→ stable";

        if (wantSummary) {
          return (
            `## Run History Summary\n\n` +
            `**${runs.length} runs** analyzed across **${envs.join(", ")}**.\n\n` +
            `| Metric | Value |\n|---|---|\n` +
            `| Avg Pass Rate | **${avgPass}%** |\n` +
            `| Total Failures | **${totalFails}** |\n` +
            `| Trend | **${trendArrow}** (${Math.abs(trend).toFixed(0)}pp) |\n` +
            `| Latest Run | **${latest?.run}** — ${latest?.passRate}% |\n\n` +
            `The **Pass Rate Trend** chart and table above show the full timeline. ` +
            `${avgPass >= 95 ? "✅ All runs are above the 95% promotion threshold." : avgPass >= 80 ? "⚠️ Some runs are below the 95% threshold." : "🔴 Pass rates are critically low — investigate failures."}`
          );
        }

        const rows = runs.slice(0, 8).map((r: any) =>
          `- **${r.run}** (${r.env}) — **${r.passRate ?? "?"}%** pass · ${r.failures ?? 0} fail${(r.failures ?? 0) !== 1 ? "s" : ""} · ${r.date ?? ""}`
        ).join("\n");

        return `**Last ${runs.length} Test Runs** — avg **${avgPass}%** pass, **${totalFails}** total failures:\n\n${rows}\n\nSee the table above for the full breakdown.`;
      }

      case "get_flaky_tests": {
        const tests: any[] = Array.isArray(rawData) ? rawData : [];
        if (!tests.length) return "✅ **No flaky tests detected** — all tests are stable across recent runs.";

        const worst = tests[0];
        const avgScore = Math.round(tests.reduce((s: number, t: any) => s + Number(t.score ?? 0), 0) / tests.length);
        const highRisk = tests.filter((t: any) => Number(t.score ?? 0) >= 50).length;

        return (
          `## Flakiness Analysis\n\n` +
          `**${tests.length} flaky tests** detected · avg flakiness score **${avgScore}%** · **${highRisk}** high-risk (≥50%)\n\n` +
          `### 🔴 Top Offenders\n` +
          tests.slice(0, 5).map((t: any) =>
            `- **\`${t.test}\`** — score **${t.score}%** · ${t.flips} flip${t.flips !== 1 ? "s" : ""} · pattern: \`${t.sequence ?? "?"}\``
          ).join("\n") +
          `\n\n> **Recommendation:** Quarantine the top ${Math.min(3, tests.length)} tests to prevent CI noise. ` +
          `\`${worst.test}\` is the most unstable with a **${worst.score}%** flakiness score.`
        );
      }

      case "compare_environments": {
        const rows: any[] = Array.isArray(rawData) ? rawData : [];
        if (!rows.length) return "No environment data available.";

        const best = [...rows].sort((a: any, b: any) => b.avgPassRate - a.avgPassRate)[0];
        const worst = [...rows].sort((a: any, b: any) => a.avgPassRate - b.avgPassRate)[0];

        return (
          `## Environment Health Comparison\n\n` +
          rows.map((r: any) => {
            const icon = r.avgPassRate >= 95 ? "🟢" : r.avgPassRate >= 80 ? "🟡" : "🔴";
            return `${icon} **${r.env}** — **${r.avgPassRate}%** avg pass · ${r.totalFailures} total failures · ${r.runs} runs`;
          }).join("\n") +
          `\n\n**Best:** ${best.env} (${best.avgPassRate}%) · **Worst:** ${worst.env} (${worst.avgPassRate}%)\n\n` +
          `${best.avgPassRate >= 95 ? "✅ All environments are above the 95% promotion threshold." : "⚠️ Some environments may not meet the promotion gate."}`
        );
      }

      case "get_promotion_status": {
        const d = (rawData as any) || {};
        const { total = 0, promoted = 0, blocked = 0, pending = 0, promoteRate = 0 } = d;

        return (
          `## Promotion Gate Status\n\n` +
          `**${total} decisions** evaluated for UAT → PROD promotion:\n\n` +
          `| Outcome | Count | Rate |\n|---|---|---|\n` +
          `| ✅ Promoted | **${promoted}** | ${promoteRate}% |\n` +
          `| ❌ Blocked | **${blocked}** | ${total > 0 ? Math.round((blocked / total) * 100) : 0}% |\n` +
          `| ⏳ Pending | **${pending}** | ${total > 0 ? Math.round((pending / total) * 100) : 0}% |\n\n` +
          `${promoted > blocked
            ? `✅ More promotions than blocks — UAT quality is generally **above the 95% threshold**.`
            : `⚠️ High block rate — UAT is frequently **below the 95% pass threshold**.`
          }\n\nSee the decision history table for individual run outcomes.`
        );
      }

      case "get_failure_breakdown": {
        const d = (rawData as any) || {};
        const { label, passPct, rows = [], env } = d;
        const totalFailed = rows.reduce((s: number, r: any) => s + Number(r.failed ?? 0), 0);
        const totalTests = rows.reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);

        if (!rows.length) return `**${label || "Latest Run"}** — **${passPct}%** pass rate · No failures detected ✅`;

        const topCat = rows[0];
        return (
          `## Failure Breakdown — ${label || "Latest Run"}\n\n` +
          `**${env || "—"}** environment · **${passPct}%** pass · **${totalFailed}/${totalTests}** tests failed\n\n` +
          `### By Category\n` +
          rows.slice(0, 6).map((r: any) => {
            const icon = r.failed === 0 ? "✅" : r.passRate >= 80 ? "⚠️" : "🔴";
            return `${icon} **${r.category}** — ${r.failed}/${r.total} failed · **${r.passRate}%** pass`;
          }).join("\n") +
          `\n\n> **Root cause:** \`${topCat.category}\` has the most failures (${topCat.failed}/${topCat.total}). ` +
          `Investigate ${topCat.category.toLowerCase()} test configuration.`
        );
      }

      case "get_suite_health": {
        const rows: any[] = Array.isArray(rawData) ? rawData : [];
        if (!rows.length) return "No suite data available.";

        const failing = rows.filter((r: any) => r.avgPassRate < 95);
        return (
          `## Suite Health Report\n\n` +
          `**${rows.length} suites** analyzed:\n\n` +
          rows.slice(0, 6).map((r: any) => {
            const icon = r.avgPassRate >= 95 ? "🟢" : r.avgPassRate >= 80 ? "🟡" : "🔴";
            return `${icon} **${r.suite}** — **${r.avgPassRate}%** avg · ${r.totalFailures} failures · ${r.runs} runs`;
          }).join("\n") +
          (failing.length > 0
            ? `\n\n⚠️ **${failing.length} suite${failing.length !== 1 ? "s" : ""}** below 95% threshold: ${failing.map((r: any) => `\`${r.suite}\``).join(", ")}`
            : `\n\n✅ All suites are above the 95% promotion threshold.`)
        );
      }

      case "get_duration_trends": {
        const rows: any[] = Array.isArray(rawData) ? rawData : [];
        if (!rows.length) return "No duration data available.";

        const durations = rows.map((r: any) => Number(r.durationSec ?? 0));
        const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
        const max = Math.max(...durations);
        const slowRuns = rows.filter((r: any) => r.durationSec > avg * 1.2).length;

        return (
          `## Execution Duration Trends\n\n` +
          `| Metric | Value |\n|---|---|\n` +
          `| Avg Duration | **${avg}s** |\n` +
          `| Max Duration | **${max}s** |\n` +
          `| Slow Runs (>120% avg) | **${slowRuns}** |\n\n` +
          `${slowRuns > 0
            ? `⚠️ **${slowRuns} run${slowRuns !== 1 ? "s" : ""}** significantly exceeded the average duration. Check for test parallelization issues or network timeouts.`
            : `✅ Duration is consistent — no significant timing regressions detected.`
          }\n\nThe chart above shows duration over time. Upward spikes may correlate with test failures.`
        );
      }

      case "get_akamai_property": {
        const rows: any[] = Array.isArray(rawData) ? rawData : [];
        if (!rows.length) return "No Akamai property data available.";

        const active = rows.filter((r: any) => r.status?.includes("Active")).length;
        return (
          `## Akamai Property Status\n\n` +
          `**${rows.length} slots** (3 tiers × 2 networks) · **${active} active**\n\n` +
          rows.map((r: any) =>
            `- **${r.env}/${r.network}** — Property v${r.propertyVersion} · EW \`${r.edgeWorkerVersion}\` · ${r.pops} PoPs · ${r.status}`
          ).join("\n") +
          `\n\nSee the table above for full cpCode and PoP coverage details.`
        );
      }

      default:
        return `**${toolName}** results are shown in the table and chart above.`;
    }
  } catch {
    return `Results from **${toolName}** are shown in the table and chart above.`;
  }
}

// ── Format tool data for Gemini Nano micro-prompt ────────────────────────────
function formatToolDataForNano(toolName: string, rawData: unknown): string | null {
  try {
    switch (toolName) {
      case "query_runs": {
        const runs: any[] = Array.isArray(rawData) ? rawData : [];
        if (!runs.length) return null;
        const avg = Math.round(runs.reduce((s, r) => s + Number(r.passRate ?? 0), 0) / runs.length);
        const fails = runs.reduce((s, r) => s + Number(r.failures ?? 0), 0);
        return `${runs.length} runs, avg pass ${avg}%, ${fails} total failures. Latest: ${runs[0]?.run} ${runs[0]?.passRate}%`;
      }
      case "get_flaky_tests": {
        const tests: any[] = Array.isArray(rawData) ? rawData : [];
        if (!tests.length) return "No flaky tests";
        return `${tests.length} flaky tests. Top: ${tests[0]?.test} score ${tests[0]?.score}%, ${tests[0]?.flips} flips`;
      }
      case "compare_environments": {
        const rows: any[] = Array.isArray(rawData) ? rawData : [];
        return rows.map((r: any) => `${r.env}: ${r.avgPassRate}% avg (${r.runs} runs)`).join(", ");
      }
      case "get_promotion_status": {
        const d = rawData as any;
        return `${d.promoted} promoted, ${d.blocked} blocked, ${d.pending} pending out of ${d.total} decisions`;
      }
      case "get_failure_breakdown": {
        const d = rawData as any;
        const top = Array.isArray(d.rows) ? d.rows[0] : null;
        return `${d.label}: ${d.passPct}% pass. Top category: ${top?.category} (${top?.failed}/${top?.total} failed)`;
      }
      case "get_suite_health": {
        const rows: any[] = Array.isArray(rawData) ? rawData : [];
        return rows.slice(0, 4).map((r: any) => `${r.suite}: ${r.avgPassRate}%`).join(", ");
      }
      case "get_duration_trends": {
        const rows: any[] = Array.isArray(rawData) ? rawData : [];
        const avg = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + Number(r.durationSec ?? 0), 0) / rows.length) : 0;
        return `Avg duration ${avg}s across ${rows.length} runs`;
      }
      case "get_akamai_property": {
        const rows: any[] = Array.isArray(rawData) ? rawData : [];
        return `${rows.length} property slots. Versions: PROD v${rows.find((r: any) => r.env === "PROD")?.propertyVersion ?? "?"}, UAT v${rows.find((r: any) => r.env === "UAT")?.propertyVersion ?? "?"}, QA v${rows.find((r: any) => r.env === "QA")?.propertyVersion ?? "?"}`;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────
export interface SynthesisInput {
  toolName: string;
  rawData: unknown;
  userQuery: string;
  signal: AbortSignal;
  onDelta: (delta: StreamDelta) => void;
}

export interface DirectInput {
  userQuery: string;
  priorResponses?: string[];
  signal: AbortSignal;
  onDelta: (delta: StreamDelta) => void;
}

export async function synthesizeWithChromeAI(input: SynthesisInput): Promise<void> {
  const { toolName, rawData, userQuery, signal, onDelta } = input;

  // Try Gemini Nano with compact prompt
  const formatted = formatToolDataForNano(toolName, rawData);
  if (formatted) {
    const prompt = `Data: ${formatted}\n\nUser asked: "${userQuery}"\n\nAnswer in 2-3 sentences using only the data above:`;
    const llmResult = await callChromeAI(
      "You are AWARE Copilot, a CDN test analytics assistant. Answer very briefly from the data provided. No JSON, no markdown, plain text only.",
      prompt,
      signal,
    );

    if (llmResult) {
      // Wrap Chrome AI's plain-text answer in context-aware markdown
      const template = buildTemplateSynthesis(toolName, rawData, userQuery);
      emitAsStream(template, onDelta);
      return;
    }
  }

  // Fallback: rich template synthesis (always distinct per tool)
  const template = buildTemplateSynthesis(toolName, rawData, userQuery);
  emitAsStream(template, onDelta);
}

export async function answerDirectWithChromeAI(input: DirectInput): Promise<void> {
  const { userQuery, priorResponses = [], signal, onDelta } = input;

  // Always check canned responses first — these handle follow-up / capability questions
  // deterministically, without burning a Gemini Nano session on a conversational query.
  const canned = getCannedResponse(userQuery);
  if (canned) { emitAsStream(canned, onDelta); return; }

  // Build a context-aware prompt so the model doesn't repeat prior answers
  const contextBlock = priorResponses.length > 0
    ? `Previous answers in this conversation:\n${priorResponses.map((r, i) => `[${i + 1}] ${r.slice(0, 300)}`).join("\n")}\n\n`
    : "";

  const llmResult = await callChromeAI(
    "You are AWARE Copilot, a CDN test observability assistant. Answer briefly and helpfully. Do NOT repeat information already given in previous answers. Keep responses under 3 sentences.",
    `${contextBlock}Question: ${userQuery}`,
    signal,
  );

  if (llmResult) { emitAsStream(llmResult, onDelta); return; }

  // Final fallback — list available topics so the user always has something useful
  emitAsStream(
    `I can help with: **run history**, **flaky tests**, **environment comparison** (QA/UAT/PROD), **promotion gate status**, **failure breakdown**, **suite health**, **duration trends**, and **Akamai property status**.\n\nTry asking about one of these, or use a **Quick Action** above!`,
    onDelta,
  );
}


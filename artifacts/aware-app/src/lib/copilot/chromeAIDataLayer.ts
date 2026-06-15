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

// ── Query-aware template synthesis ───────────────────────────────────────────
// Each tool has multiple response angles selected by what the user actually asked.
// The table/chart are already rendered by the UI — the text adds insight, not repetition.
function buildTemplateSynthesis(toolName: string, rawData: unknown, userQuery: string): string {
  const q = userQuery.toLowerCase();

  try {
    switch (toolName) {
      case "query_runs": {
        const runs: any[] = Array.isArray(rawData) ? rawData : [];
        if (!runs.length) return "No test runs found in the dataset.";

        const passRates = runs.map((r: any) => Number(r.passRate ?? r.passPct ?? 0));
        const avgPass = Math.round(passRates.reduce((a, b) => a + b, 0) / passRates.length);
        const totalFails = runs.reduce((s: number, r: any) => s + Number(r.failures ?? 0), 0);
        const latest = runs[0];
        const oldest = runs[runs.length - 1];
        const trend = passRates.length >= 2 ? passRates[0] - passRates[passRates.length - 1] : 0;
        const trendWord = trend > 2 ? "improving" : trend < -2 ? "declining" : "stable";
        const failedRuns = runs.filter((r: any) => Number(r.failures ?? 0) > 0);
        const envCounts = runs.reduce((acc: any, r: any) => { acc[r.env] = (acc[r.env] || 0) + 1; return acc; }, {});
        const envSummary = Object.entries(envCounts).map(([e, c]) => `${c}× ${e}`).join(", ");
        const gateStatus = avgPass >= 95 ? "✅ Above the 95% promotion gate." : "⚠️ Below the 95% promotion gate.";

        // "last test / latest / most recent"
        if (/latest|last test|most recent|just ran|newest|single/.test(q)) {
          const f = Number(latest?.failures ?? 0);
          return `Latest run: **${latest?.run}** on **${latest?.env}** (${latest?.date ?? "—"}) — **${latest?.passRate}%** pass, **${f}** failure${f !== 1 ? "s" : ""}. ${f === 0 ? "✅ Clean." : "⚠️ Review the failure before promoting."}`;
        }

        // "fail / broke / error / problem"
        if (/fail|broke|broken|error|problem|issue|wrong/.test(q)) {
          if (totalFails === 0) return `✅ Zero failures across all ${runs.length} runs (${envSummary}). Every run is above the 95% gate.`;
          const failLines = failedRuns.slice(0, 4).map((r: any) =>
            `- **${r.run}** (${r.env}, ${r.date}) — ${r.failures} failure${Number(r.failures) !== 1 ? "s" : ""}, **${r.passRate}%** pass`
          ).join("\n");
          return `**${totalFails} failure${totalFails !== 1 ? "s" : ""}** found across ${runs.length} runs:\n\n${failLines}\n\n${gateStatus}`;
        }

        // "trend / over time / direction / improving / declining"
        if (/trend|over time|direction|improv|declin|getting|progress/.test(q)) {
          const pp = Math.abs(trend).toFixed(0);
          const move = trend > 2 ? `up ${pp}pp` : trend < -2 ? `down ${pp}pp` : "flat";
          return `Pass rates are **${trendWord}** — ${move} from **${oldest?.run}** (${oldest?.passRate}%) to **${latest?.run}** (${latest?.passRate}%). Avg across ${runs.length} runs: **${avgPass}%** with ${totalFails} total failure${totalFails !== 1 ? "s" : ""}. ${gateStatus}`;
        }

        // "pass rate / percent / %"
        if (/pass.?rate|passing|percent|%/.test(q)) {
          const min = Math.min(...passRates);
          const max = Math.max(...passRates);
          return `Pass rates over ${runs.length} runs — avg **${avgPass}%**, high **${max}%**, low **${min}%**. Trend is **${trendWord}**. ${totalFails === 0 ? "No failures — all runs green." : `${totalFails} failure${totalFails !== 1 ? "s" : ""} across ${failedRuns.length} run${failedRuns.length !== 1 ? "s" : ""}.`}`;
        }

        // "history / all / timeline / full"
        if (/history|all run|timeline|full|complete|entire/.test(q)) {
          return `**${runs.length} runs** (${envSummary}) — avg **${avgPass}%** pass, **${totalFails}** failure${totalFails !== 1 ? "s" : ""}, trend **${trendWord}**. ${gateStatus} Full timeline in the chart and table above.`;
        }

        // "summary / overview / health"
        if (/summary|overview|health|how.*doing|status/.test(q)) {
          return (
            `**${runs.length} runs** across ${envSummary}.\n\n` +
            `| Metric | Value |\n|---|---|\n` +
            `| Avg Pass Rate | **${avgPass}%** |\n` +
            `| Total Failures | **${totalFails}** |\n` +
            `| Trend | **${trendWord}** (${trend > 0 ? "+" : ""}${trend.toFixed(0)}pp) |\n` +
            `| Latest | **${latest?.run}** — ${latest?.passRate}% |\n\n` +
            gateStatus
          );
        }

        // Default — lead with the headline insight, not a repeated list
        const headline = totalFails === 0
          ? `✅ All ${runs.length} runs passed`
          : `**${totalFails}** failure${totalFails !== 1 ? "s" : ""} across ${runs.length} runs`;
        return `${headline} — avg **${avgPass}%**, trend **${trendWord}**. Latest: **${latest?.run}** (${latest?.env}) at **${latest?.passRate}%**. See chart and table above for the full picture.`;
      }

      case "get_flaky_tests": {
        const tests: any[] = Array.isArray(rawData) ? rawData : [];
        if (!tests.length) return "✅ No flaky tests detected — all tests are stable across recent runs.";

        const worst = tests[0];
        const avgScore = Math.round(tests.reduce((s: number, t: any) => s + Number(t.score ?? 0), 0) / tests.length);
        const highRisk = tests.filter((t: any) => Number(t.score ?? 0) >= 50).length;
        const stable = tests.filter((t: any) => Number(t.flips ?? 0) === 1).length;

        if (/worst|top|most|highest|biggest/.test(q)) {
          return `Most unstable: **\`${worst.test}\`** — flakiness score **${worst.score}%** with **${worst.flips}** flips (pattern: \`${worst.sequence ?? "?"}\`). ${highRisk} test${highRisk !== 1 ? "s" : ""} are high-risk (≥50% score). Quarantine these to cut CI noise.`;
        }

        if (/stable|reliable|consistent|trust/.test(q)) {
          return `${stable} test${stable !== 1 ? "s" : ""} flipped only once (borderline). ${tests.length - highRisk} tests are below the 50% risk threshold. The **${highRisk}** high-risk test${highRisk !== 1 ? "s" : ""} account for most CI instability — ranked in the table above.`;
        }

        return (
          `**${tests.length}** flaky tests — avg score **${avgScore}%**, **${highRisk}** high-risk (≥50%).\n\n` +
          `🔴 Top offenders:\n` +
          tests.slice(0, 4).map((t: any) =>
            `- \`${t.test}\` — **${t.score}%** · ${t.flips} flip${t.flips !== 1 ? "s" : ""} · \`${t.sequence ?? "?"}\``
          ).join("\n") +
          `\n\nQuarantine \`${worst.test}\` (${worst.score}% score) to reduce CI noise.`
        );
      }

      case "compare_environments": {
        const rows: any[] = Array.isArray(rawData) ? rawData : [];
        if (!rows.length) return "No environment data available.";

        const sorted = [...rows].sort((a: any, b: any) => b.avgPassRate - a.avgPassRate);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        const allHealthy = rows.every((r: any) => r.avgPassRate >= 95);
        const gapPP = best.avgPassRate - worst.avgPassRate;

        if (/worst|problem|low|struggling|bad/.test(q)) {
          return `Lowest performing: **${worst.env}** at **${worst.avgPassRate}%** avg pass with **${worst.totalFailures}** total failures across ${worst.runs} runs. ${worst.avgPassRate < 95 ? "⚠️ Below the 95% promotion gate." : "✅ Still above the gate."}`;
        }

        if (/best|top|highest|cleanest/.test(q)) {
          return `Best performing: **${best.env}** at **${best.avgPassRate}%** avg pass across ${best.runs} runs — **${best.totalFailures}** total failures. Gap between best and worst: **${gapPP}pp**.`;
        }

        return (
          rows.map((r: any) => {
            const icon = r.avgPassRate >= 95 ? "🟢" : r.avgPassRate >= 80 ? "🟡" : "🔴";
            return `${icon} **${r.env}** — **${r.avgPassRate}%** avg · ${r.totalFailures} failures · ${r.runs} runs`;
          }).join("\n") +
          `\n\n**${gapPP}pp** spread between ${best.env} (${best.avgPassRate}%) and ${worst.env} (${worst.avgPassRate}%). ${allHealthy ? "✅ All above the 95% promotion gate." : "⚠️ Some environments are below the gate."}`
        );
      }

      case "get_promotion_status": {
        const d = (rawData as any) || {};
        const { total = 0, promoted = 0, blocked = 0, pending = 0, promoteRate = 0 } = d;
        const blockRate = total > 0 ? Math.round((blocked / total) * 100) : 0;

        if (/block|prevent|stop|reject/.test(q)) {
          return `**${blocked}** of ${total} UAT→PROD promotions were **blocked** (${blockRate}% block rate) — runs fell below the 95% pass threshold. ${promoted} succeeded. ${pending > 0 ? `${pending} still pending.` : ""}`;
        }

        if (/ready|can we|should we|go to prod/.test(q)) {
          return promoteRate >= 80
            ? `✅ **${promoteRate}%** of evaluations resulted in promotion — UAT quality is consistently above the 95% gate. You can promote.`
            : `⚠️ Only **${promoteRate}%** promote rate — ${blockRate}% of runs were blocked. Investigate failures before promoting to PROD.`;
        }

        return (
          `**${total}** gate decisions — **${promoted}** promoted (${promoteRate}%), **${blocked}** blocked (${blockRate}%), **${pending}** pending.\n\n` +
          `${promoted > blocked ? "✅ Promotion rate is healthy — UAT quality is generally above the 95% threshold." : "⚠️ High block rate — UAT frequently falls below 95%."}`
        );
      }

      case "get_failure_breakdown": {
        const d = (rawData as any) || {};
        const { label, passPct, rows = [], env } = d;
        const totalFailed = rows.reduce((s: number, r: any) => s + Number(r.failed ?? 0), 0);
        const totalTests = rows.reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);

        if (!rows.length) return `**${label || "Latest Run"}** (${env}) — **${passPct}%** pass · No failures ✅`;

        const topCat = rows[0];
        const cleanCats = rows.filter((r: any) => r.failed === 0).length;

        if (/category|type|kind|which|what kind/.test(q)) {
          return (
            `Failures by category in **${label || "latest run"}** (${env}):\n\n` +
            rows.slice(0, 5).map((r: any) => {
              const icon = r.failed === 0 ? "✅" : r.passRate >= 80 ? "⚠️" : "🔴";
              return `${icon} **${r.category}** — ${r.failed}/${r.total} failed`;
            }).join("\n") +
            `\n\n**${topCat.category}** is the worst offender at ${topCat.failed}/${topCat.total} failures.`
          );
        }

        return (
          `**${label || "Latest run"}** (${env}) — **${passPct}%** pass, **${totalFailed}/${totalTests}** failed.\n\n` +
          `Root cause: **${topCat.category}** leads with ${topCat.failed}/${topCat.total} failures. ${cleanCats} categor${cleanCats !== 1 ? "ies" : "y"} fully clean. See category breakdown in the chart above.`
        );
      }

      case "get_suite_health": {
        const rows: any[] = Array.isArray(rawData) ? rawData : [];
        if (!rows.length) return "No suite data available.";

        const failing = rows.filter((r: any) => r.avgPassRate < 95);
        const best = rows[0];
        const worst = rows[rows.length - 1];

        if (/worst|low|struggling|problem/.test(q)) {
          return failing.length === 0
            ? `✅ All ${rows.length} suites are above the 95% threshold. Lowest: **${worst.suite}** at **${worst.avgPassRate}%**.`
            : `Struggling suite${failing.length !== 1 ? "s" : ""}: ${failing.map((r: any) => `**${r.suite}** (${r.avgPassRate}%)`).join(", ")}. These are below the 95% promotion gate — investigate before releasing.`;
        }

        if (/best|top|clean|healthy/.test(q)) {
          return `Top suite: **${best.suite}** at **${best.avgPassRate}%** avg pass across ${best.runs} runs with ${best.totalFailures} total failures.`;
        }

        return (
          rows.slice(0, 5).map((r: any) => {
            const icon = r.avgPassRate >= 95 ? "🟢" : r.avgPassRate >= 80 ? "🟡" : "🔴";
            return `${icon} **${r.suite}** — **${r.avgPassRate}%** avg · ${r.totalFailures} failures`;
          }).join("\n") +
          (failing.length > 0
            ? `\n\n⚠️ ${failing.length} suite${failing.length !== 1 ? "s" : ""} below 95%: ${failing.map((r: any) => `\`${r.suite}\``).join(", ")}.`
            : `\n\n✅ All ${rows.length} suites above the 95% gate.`)
        );
      }

      case "get_duration_trends": {
        const rows: any[] = Array.isArray(rawData) ? rawData : [];
        if (!rows.length) return "No duration data available.";

        const durations = rows.map((r: any) => Number(r.durationSec ?? 0));
        const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
        const max = Math.max(...durations);
        const min = Math.min(...durations);
        const slowRuns = rows.filter((r: any) => r.durationSec > avg * 1.2);
        const slowest = rows.reduce((a: any, b: any) => (b.durationSec > a.durationSec ? b : a), rows[0]);

        if (/slow|longest|worst|spike|timeout/.test(q)) {
          return slowRuns.length === 0
            ? `No significantly slow runs detected. All durations within 20% of the ${avg}s average.`
            : `**${slowRuns.length} slow run${slowRuns.length !== 1 ? "s" : ""}** exceeded 120% of avg (${avg}s). Slowest: **${slowest.run}** at **${slowest.durationSec}s** — check for parallelization issues or network timeouts.`;
        }

        return (
          `Avg **${avg}s** · min **${min}s** · max **${max}s** across ${rows.length} runs. ` +
          (slowRuns.length > 0
            ? `⚠️ **${slowRuns.length} run${slowRuns.length !== 1 ? "s" : ""}** exceeded 120% of average. Slowest: **${slowest.run}** (${slowest.durationSec}s).`
            : `✅ Duration is consistent — no significant timing regressions.`)
        );
      }

      case "get_akamai_property": {
        const rows: any[] = Array.isArray(rawData) ? rawData : [];
        if (!rows.length) return "No Akamai property data available.";

        const active = rows.filter((r: any) => r.status?.includes("Active")).length;
        const pending = rows.filter((r: any) => r.status?.includes("Pending")).length;
        const prodRow = rows.find((r: any) => r.env === "PROD" && r.network === "Production");
        const ewVersions = [...new Set(rows.map((r: any) => r.edgeWorkerVersion))];

        if (/edgeworker|ew|worker/.test(q)) {
          return `EdgeWorker versions: ${ewVersions.join(", ")} across 3 tiers. PROD is on **${prodRow?.edgeWorkerVersion ?? "—"}**. ${ewVersions.length > 1 ? "⚠️ Multiple versions deployed — check for drift." : "✅ Consistent version across all tiers."}`;
        }

        if (/prod|production|live/.test(q)) {
          return `PROD/Production — Property v**${prodRow?.propertyVersion ?? "—"}** · EW **${prodRow?.edgeWorkerVersion ?? "—"}** · **${prodRow?.pops ?? "—"}** PoPs · ${prodRow?.status ?? "—"}.`;
        }

        return (
          `**${active}** of ${rows.length} slots active, **${pending}** pending. ` +
          `PROD on property v${prodRow?.propertyVersion ?? "?"}, EW \`${prodRow?.edgeWorkerVersion ?? "?"}\` with ${prodRow?.pops ?? "?"} PoPs. ` +
          `Full version matrix in the table above.`
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

  // Build a query-aware prompt so Gemini Nano generates a response tailored to
  // what was actually asked — not a generic summary of everything.
  const formatted = formatToolDataForNano(toolName, rawData);
  if (formatted) {
    const prompt =
      `Tool: ${toolName}\n` +
      `Data: ${formatted}\n` +
      `User asked: "${userQuery}"\n\n` +
      `Write 1-2 sentences directly answering what the user asked. ` +
      `Use the specific numbers from the data. Be direct — no preamble, no "Based on the data".`;

    const llmResult = await callChromeAI(
      "You are a CDN test analytics assistant. Answer directly using only the numbers provided. No JSON. No markdown. Plain sentences only.",
      prompt,
      signal,
    );

    if (llmResult) {
      // Use Chrome AI's original answer — this is what the model actually generated
      // for this specific question. Do NOT fall back to the template here.
      emitAsStream(llmResult, onDelta);
      return;
    }
  }

  // Fallback: query-aware template synthesis (used only when Chrome AI fails/gibberish)
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


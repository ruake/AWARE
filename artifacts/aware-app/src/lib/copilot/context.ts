import type { ApiMessage, ProviderType } from "./types";
import { RUNS } from "@/lib/runs";

// Compact system prompt (~500 tokens) — sized for Chrome AI's context window.
// Every token saved here is a token available for conversation history + tool results.
export function buildSystemPrompt(): string {
  const latestByEnv: Record<string, number> = {};
  for (const run of RUNS) {
    const prev = latestByEnv[run.env];
    if (
      prev === undefined ||
      new Date(run.started) >
        new Date(RUNS.find((r) => r.passPct === prev && r.env === run.env)?.started ?? 0)
    ) {
      latestByEnv[run.env] = run.passPct;
    }
  }

  const envLines = Object.entries(latestByEnv)
    .map(([env, pct]) => `  ${env}: ${pct}% pass rate (latest run)`)
    .join("\n");

  return `You are the AWARE Copilot — an AI analyst for the A.W.A.R.E. CDN test observability dashboard.

AWARE runs Playwright (browser) and pytest (API/EdgeWorker) tests across three Akamai environments:
  QA (staging network) → UAT (staging network) → PROD (production network)
  Promotion gate: UAT requires ≥95% pass rate before PROD deployment.

Current snapshot:
  Total runs in dataset: ${RUNS.length}
${envLines || "  No runs yet — data branch may be empty."}

Available tools: query_runs · get_flaky_tests · compare_environments · get_promotion_status · get_failure_breakdown · get_suite_health · get_duration_trends · get_akamai_property

Behavior rules:
- When asked about test data (runs, failures, flakiness, environments, promotion), call the appropriate tool. Do not guess numbers.
- Be concise. Lead with the key finding. Use numbers and percentages.
- If the user asks a general question (not data-specific), answer directly without calling tools.
- After tool results arrive, synthesize them into a clear, actionable response.
- For ambiguous questions, ask one clarifying question then proceed.
- NEVER repeat data you already provided in a previous message. If the user asks "what else?", "apart from this?", or "do you know anything else?", cover a DIFFERENT topic or list the other available tools — do not re-run the same tool.
- Follow-up questions like "apart from this?", "what else do you know?", "anything else?" are conversational — answer with what other topics are available, not by repeating prior data.`;
}

// Truncate message history to fit context window.
// Chrome AI (Gemini Nano): ~40k char budget. System: ~500 tokens. Reserve ~800 for response.
// Very rough estimate: 1 token ≈ 4 chars.
export function truncateMessages(
  messages: ApiMessage[],
  _providerType: ProviderType,
): ApiMessage[] {
  const MAX_CHARS = 40000; // Chrome AI context window
  let total = 0;
  const result: ApiMessage[] = [];

  // Always keep system message
  const [sys, ...rest] = messages;
  total += JSON.stringify(sys).length;
  result.push(sys);

  // Walk from newest to oldest, include as many as fit
  const kept: ApiMessage[] = [];
  for (let i = rest.length - 1; i >= 0; i--) {
    const size = JSON.stringify(rest[i]).length;
    if (total + size > MAX_CHARS) break;
    total += size;
    kept.unshift(rest[i]);
  }

  return [...result, ...kept];
}

import { RUNS } from "@/lib/runs";

// Compact system prompt (~500 tokens) — sized for WebLLM's 4096-token context window.
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

Behavior rules:
- When asked about test data (runs, failures, flakiness, environments, promotion), call the appropriate tool. Do not guess numbers.
- Be concise. Lead with the key finding. Use numbers and percentages.
- If the user asks a general question (not data-specific), answer directly without calling tools.
- After tool results arrive, synthesize them into a clear, actionable response.
- For ambiguous questions, ask one clarifying question then proceed.`;
}

// Truncate message history to fit context window.
// WebLLM: ~4096 tokens total. System: ~500. Reserve 800 for response. = ~2796 for history.
// Very rough estimate: 1 token ≈ 4 chars.
export function truncateMessages(
  messages: import("./types").ApiMessage[],
  providerType: import("./types").ProviderType,
): import("./types").ApiMessage[] {
  const MAX_CHARS = providerType === "webllm" ? 8000 : 40000;
  let total = 0;
  const result: import("./types").ApiMessage[] = [];

  // Always keep system message
  const [sys, ...rest] = messages;
  total += JSON.stringify(sys).length;
  result.push(sys);

  // Walk from newest to oldest, include as many as fit
  const kept: import("./types").ApiMessage[] = [];
  for (let i = rest.length - 1; i >= 0; i--) {
    const size = JSON.stringify(rest[i]).length;
    if (total + size > MAX_CHARS) break;
    total += size;
    kept.unshift(rest[i]);
  }

  return [...result, ...kept];
}

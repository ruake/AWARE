import type { AgentEvent, IProvider, Message, ToolDefinition } from "./types";
import { logInfo, logDebug, logError } from "@/lib/ai/debugLogger";
import { runGraphAgent } from "./graphAgent";

export interface AgentOptions {
  userContent: string;
  history: Message[];
  provider: IProvider;
  tools: ToolDefinition[];
  signal: AbortSignal;
  onEvent: (event: AgentEvent) => void;
}

// ── Main agent entry point ───────────────────────────────────────────────────
// Delegates to the LangGraph-style graph agent (graphAgent.ts) which uses a
// multi-node pipeline: plan_and_route → execute_tools → synthesize → session_carve.
//
// This file remains as the public API for backward compatibility.
export async function runAgent(opts: AgentOptions): Promise<void> {
  const { userContent, history, provider, tools, signal, onEvent } = opts;

  logInfo(
    "agent",
    `Delegating to graph agent (${history.length} history messages, ${tools.length} tools)`,
  );

  try {
    await runGraphAgent({
      userContent,
      history,
      provider,
      tools,
      signal,
      onEvent,
    });
  } catch (err: unknown) {
    if (!signal.aborted) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      logError("agent", `Graph agent failed: ${msg}`);
      onEvent({ type: "error", error: msg });
    }
  }
}

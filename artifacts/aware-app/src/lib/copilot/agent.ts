import type {
  AgentEvent,
  ApiMessage,
  IProvider,
  Message,
  ToolCall,
  ToolDefinition,
} from "./types";
import { buildSystemPrompt, truncateMessages } from "./context";
import { logInfo, logDebug, logError } from "@/lib/ai/debugLogger";

export interface AgentOptions {
  userContent: string;
  history: Message[];
  provider: IProvider;
  tools: ToolDefinition[];
  signal: AbortSignal;
  onEvent: (event: AgentEvent) => void;
}

// Convert UI Messages to OpenAI-format ApiMessages
function messagesToApi(history: Message[]): ApiMessage[] {
  const out: ApiMessage[] = [];
  for (const m of history) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.content });
    } else {
      // assistant — include any tool calls that happened
      if (m.toolCalls?.length) {
        out.push({
          role: "assistant",
          content: m.content || null,
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: JSON.stringify(tc.args) },
          })),
        });
        for (const tc of m.toolCalls) {
          if (tc.result) {
            out.push({
              role: "tool",
              content: JSON.stringify(tc.result.data).slice(0, 3000),
              tool_call_id: tc.id,
            });
          }
        }
      } else {
        out.push({ role: "assistant", content: m.content });
      }
    }
  }
  return out;
}

const MAX_ITERATIONS = 5;

// ── Main agent loop ─────────────────────────────────────────────────────────
// Uses a callback-based design so streaming deltas can directly update
// React state on every token, giving real live typing effect.
export async function runAgent(opts: AgentOptions): Promise<void> {
  const { userContent, history, provider, tools, signal, onEvent } = opts;

  let apiMessages: ApiMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...messagesToApi(history),
    { role: "user", content: userContent },
  ];

  apiMessages = truncateMessages(apiMessages, provider.type);

  logInfo("agent", `Starting agent loop (${apiMessages.length} messages, ${tools.length} tools)`);

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    if (signal.aborted) return;
    logDebug("agent", `Iteration ${iter + 1}/${MAX_ITERATIONS}`);

    // Accumulators for this stream pass
    let collectedContent = "";
    const pendingToolCalls: Array<{ id: string; name: string; argsJson: string }> = [];
    let streamDone = false;

    // Stream from provider — onDelta fires synchronously for each chunk
    logInfo("agent", `Streaming from ${provider.type} provider`);
    await new Promise<void>((resolve, reject) => {
      provider
        .stream(apiMessages, tools, signal, (delta) => {
          if (delta.content) {
            collectedContent += delta.content;
            onEvent({ type: "delta", content: delta.content });
          }
          if (delta.toolCallId) {
            pendingToolCalls.push({
              id: delta.toolCallId,
              name: delta.toolCallName ?? "",
              argsJson: delta.toolCallArgsChunk ?? "{}",
            });
          }
          if (delta.done) {
            streamDone = true;
            resolve();
          }
        })
        .then(() => {
          if (!streamDone) resolve();
        })
        .catch(reject);
    });

    if (signal.aborted) return;

    // No tool calls — the model gave a final answer
    if (pendingToolCalls.length === 0) {
      logInfo("agent", `Final answer received (${collectedContent.length} chars)`);
      onEvent({ type: "done" });
      return;
    }

    logInfo("agent", `Model requested ${pendingToolCalls.length} tool call(s): ${pendingToolCalls.map(t => t.name).join(", ")}`);

    // ── Tool calling round ─────────────────────────────────────────────────
    // Record the assistant's tool-requesting message in history
    apiMessages.push({
      role: "assistant",
      content: collectedContent || null,
      tool_calls: pendingToolCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.name, arguments: tc.argsJson },
      })),
    });

    for (const tc of pendingToolCalls) {
      if (signal.aborted) return;

      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.argsJson);
      } catch {
        /* malformed args — pass empty object */
      }

      const toolCall: ToolCall = {
        id: tc.id,
        name: tc.name,
        args,
        status: "running",
        startedAt: Date.now(),
      };

      logDebug("agent", `Tool call: ${tc.name}(${JSON.stringify(args).slice(0, 100)})`);
      onEvent({ type: "tool_start", toolCall });

      const toolDef = tools.find((t) => t.name === tc.name);
      if (!toolDef) {
        logError("agent", `Unknown tool: ${tc.name}`);
        onEvent({
          type: "tool_done",
          toolCall: { ...toolCall, status: "error", completedAt: Date.now() },
        });
        apiMessages.push({
          role: "tool",
          content: `Error: unknown tool '${tc.name}'`,
          tool_call_id: tc.id,
        });
        continue;
      }

      try {
        const start = performance.now();
        const result = await toolDef.execute(args);
        const duration = Math.round(performance.now() - start);
        logInfo("agent", `Tool ${tc.name} completed in ${duration}ms`);
        onEvent({
          type: "tool_done",
          toolCall: { ...toolCall, status: "done", result, completedAt: Date.now() },
        });
        // Truncate result to avoid blowing the context window
        const resultJson = JSON.stringify(result.data);
        apiMessages.push({
          role: "tool",
          content: resultJson.length > 4000 ? resultJson.slice(0, 4000) + "…" : resultJson,
          tool_call_id: tc.id,
        });
      } catch (err: any) {
        logError("agent", `Tool ${tc.name} failed: ${err?.message}`);
        onEvent({
          type: "tool_done",
          toolCall: { ...toolCall, status: "error", completedAt: Date.now() },
        });
        apiMessages.push({
          role: "tool",
          content: `Error executing ${tc.name}: ${err?.message ?? "unknown error"}`,
          tool_call_id: tc.id,
        });
      }
    }

    // Loop continues — model will synthesize the tool results
  }

  onEvent({ type: "done" });
}

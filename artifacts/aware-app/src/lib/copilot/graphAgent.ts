import type {
  AgentEvent,
  ApiMessage,
  ChartData,
  IProvider,
  Message,
  SubAgentStep,
  ToolCall,
  ToolDefinition,
  ToolResult,
} from "./types";
import type { AgentNode, AgentGraphContext, AgentNodeResult } from "./graphTypes";
import { buildSystemPrompt, truncateMessages } from "./context";
import { logInfo, logDebug, logError } from "@/lib/ai/debugLogger";

export interface GraphAgentOptions {
  userContent: string;
  history: Message[];
  provider: IProvider;
  tools: ToolDefinition[];
  signal: AbortSignal;
  onEvent: (event: AgentEvent) => void;
}

const MAX_ITERATIONS = 5;

// ── Helpers ──────────────────────────────────────────────────────────────────

function messagesToApi(history: Message[]): ApiMessage[] {
  const out: ApiMessage[] = [];
  for (const m of history) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.content });
    } else {
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

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ── Node: session_carve (context optimization) ──────────────────────────────
// Smart truncation: keep system prompt + newest messages.
// Drops old tool results first, then old chat history.
function sessionCarveNode(): AgentNode {
  return {
    id: "session_carve",
    label: "Context Optimize",
    description: "Optimizing context window for next turn",
    async execute(ctx: AgentGraphContext): Promise<AgentNodeResult> {
      const providerType = ctx.provider.type;
      const MAX_CHARS = providerType === "webllm" ? 8000 : 40000;
      const steps: SubAgentStep[] = [];

      const sys = ctx.apiMessages.find((m) => m.role === "system");
      const rest = ctx.apiMessages.filter((m) => m.role !== "system");

      let total = sys ? JSON.stringify(sys).length : 0;
      const kept: ApiMessage[] = [];

      // Walk from newest to oldest — always keep current exchange
      for (let i = rest.length - 1; i >= 0; i--) {
        const size = JSON.stringify(rest[i]).length;
        if (total + size > MAX_CHARS) {
          const dropped = rest.length - kept.length - i;
          if (dropped > 0) {
            steps.push({
              id: uid(),
              label: "Carved context",
              status: "completed",
              detail: `Dropped ${dropped} old message(s) to fit ${MAX_CHARS} budget`,
            });
          }
          break;
        }
        total += size;
        kept.unshift(rest[i]);
      }

      ctx.apiMessages = sys ? [sys, ...kept] : kept;

      const saved = rest.length - kept.length;
      if (saved > 0) {
        logInfo("session_carve", `Carved ${saved} messages from context (${total} chars used)`);
        steps.push({
          id: uid(),
          label: "Tokens used",
          status: "completed",
          detail: `~${Math.round(total / 4)}t / ${providerType === "webllm" ? "4096" : "32768"}t`,
        });
      } else {
        steps.push({
          id: uid(),
          label: "Context OK",
          status: "completed",
          detail: `~${Math.round(total / 4)}t (no carving needed)`,
        });
      }

      return { status: "completed", steps };
    },
  };
}

// Stream timeout — if the provider hangs without emitting done, resolve after
// this many milliseconds so the graph isn't stuck forever.
const STREAM_TIMEOUT_MS = 60_000;

// ── Node: plan_and_route ────────────────────────────────────────────────────
// Stream from provider. If tool calls come back, route to execute_tools.
// If no tools, route to synthesize (the content IS the final answer).
function planAndRouteNode(): AgentNode {
  return {
    id: "plan_and_route",
    label: "Planning",
    description: "Analyzing query and deciding action",
    async execute(ctx: AgentGraphContext): Promise<AgentNodeResult> {
      const steps: SubAgentStep[] = [];

      // Emit an immediate "Thinking" step so the LangGraph indicator appears
      // right away — gives the user visual feedback that the agent is running.
      const thinkingStep: SubAgentStep = {
        id: uid(),
        label: "Thinking…",
        status: "running",
        detail: `${ctx.provider.type} · ${ctx.tools.length} tools available`,
      };
      ctx.onEvent({ type: "step", step: thinkingStep });

      // Streaming accumulator
      let collectedContent = "";
      const localPendingCalls: Array<{ id: string; name: string; argsJson: string }> = [];
      let streamDone = false;

      const step = uid();

      await new Promise<void>((resolve, reject) => {
        // Timeout guard — some providers (e.g. Chrome AI during model load)
        // can stall indefinitely. Resolve after STREAM_TIMEOUT_MS with whatever
        // content has been collected so far.
        const timeout = setTimeout(() => {
          if (!streamDone) {
            logError("plan_and_route", `Stream timeout after ${STREAM_TIMEOUT_MS}ms`);
            streamDone = true;
            resolve();
          }
        }, STREAM_TIMEOUT_MS);

        ctx.provider
          .stream(ctx.apiMessages, ctx.tools, ctx.signal, (delta) => {
            if (delta.content) {
              collectedContent += delta.content;
              ctx.onEvent({ type: "delta", content: delta.content });
            }
            if (delta.toolCallId) {
              localPendingCalls.push({
                id: delta.toolCallId,
                name: delta.toolCallName ?? "",
                argsJson: delta.toolCallArgsChunk ?? "{}",
              });
            }
            if (delta.done) {
              streamDone = true;
              clearTimeout(timeout);
              resolve();
            }
          })
          .then(() => {
            clearTimeout(timeout);
            if (!streamDone) resolve();
          })
          .catch((err) => {
            clearTimeout(timeout);
            reject(err);
          });
      });

      if (ctx.signal.aborted) return { status: "completed" };

      if (localPendingCalls.length > 0) {
        steps.push({
          id: step,
          label: "Planned tool calls",
          status: "completed",
          detail: localPendingCalls.map((t) => t.name).join(", "),
        });

        // Parse and store tool calls for the execute_tools node
        for (const tc of localPendingCalls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.argsJson);
          } catch {
            /* malformed args — pass empty object */
          }
          ctx.pendingToolCalls.push({ id: tc.id, name: tc.name, args });
        }

        // Record the assistant's tool-requesting message in history
        ctx.apiMessages.push({
          role: "assistant",
          content: collectedContent || null,
          tool_calls: localPendingCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.argsJson },
          })),
        });
      } else {
        steps.push({
          id: step,
          label: "Answered directly",
          status: "completed",
          detail: "No tools needed",
        });
        ctx.finalContent = collectedContent;
      }

      return { status: "completed", steps };
    },
  };
}

// ── Node: execute_tools ─────────────────────────────────────────────────────
// Run each tool call, push results into apiMessages for the next LLM round.
function executeToolsNode(): AgentNode {
  return {
    id: "execute_tools",
    label: "Executing",
    description: "Running data queries and computations",
    async execute(ctx: AgentGraphContext): Promise<AgentNodeResult> {
      const steps: SubAgentStep[] = [];

      for (const tc of ctx.pendingToolCalls) {
        if (ctx.signal.aborted) return { status: "completed" };

        const stepId = uid();
        const step: SubAgentStep = {
          id: stepId,
          label: tc.name,
          status: "running",
          detail: "Querying...",
        };
        steps.push(step);
        // Emit tool_start for UI
        const toolCall: ToolCall = {
          id: tc.id,
          name: tc.name,
          args: tc.args,
          status: "running",
          startedAt: Date.now(),
        };
        ctx.onEvent({ type: "tool_start", toolCall });

        const toolDef = ctx.tools.find((t) => t.name === tc.name);
        if (!toolDef) {
          logError("execute_tools", `Unknown tool: ${tc.name}`);
          ctx.onEvent({
            type: "tool_done",
            toolCall: { ...toolCall, status: "error", completedAt: Date.now() },
          });
          ctx.apiMessages.push({
            role: "tool",
            content: `Error: unknown tool '${tc.name}'`,
            tool_call_id: tc.id,
          });
          step.status = "error";
          step.detail = "Unknown tool";
          continue;
        }

        try {
          const start = performance.now();
          const result = await toolDef.execute(tc.args);
          const duration = Math.round(performance.now() - start);
          logInfo("execute_tools", `Tool ${tc.name} completed in ${duration}ms`);
          ctx.onEvent({
            type: "tool_done",
            toolCall: { ...toolCall, status: "done", result, completedAt: Date.now() },
          });

          // Store result for synthesis
          ctx.toolResults.set(tc.name, result);
          if (result.chartData) ctx.charts.push(result.chartData);

          // Push tool result into message history
          const resultJson = JSON.stringify(result.data);
          ctx.apiMessages.push({
            role: "tool",
            content: resultJson.length > 4000 ? resultJson.slice(0, 4000) + "\u2026" : resultJson,
            tool_call_id: tc.id,
          });

          step.status = "completed";
          step.detail = `${duration}ms`;
        } catch (err: any) {
          logError("execute_tools", `Tool ${tc.name} failed: ${err?.message}`);
          ctx.onEvent({
            type: "tool_done",
            toolCall: { ...toolCall, status: "error", completedAt: Date.now() },
          });
          ctx.apiMessages.push({
            role: "tool",
            content: `Error executing ${tc.name}: ${err?.message ?? "unknown error"}`,
            tool_call_id: tc.id,
          });
          step.status = "error";
          step.detail = err?.message?.slice(0, 60) ?? "Error";
        }
      }

      ctx.pendingToolCalls = [];
      return { status: "completed", steps };
    },
  };
}

// ── Node: synthesize ────────────────────────────────────────────────────────
// If there's a final answer already (no tools were called), just emit done.
// Otherwise, stream from provider with tool results to generate the response.
function synthesizeNode(): AgentNode {
  return {
    id: "synthesize",
    label: "Synthesizing",
    description: "Generating final response from analysis",
    async execute(ctx: AgentGraphContext): Promise<AgentNodeResult> {
      const steps: SubAgentStep[] = [];

      // If we already have a direct answer from plan_and_route, no synthesis needed
      if (ctx.finalContent) {
        steps.push({
          id: uid(),
          label: "Pass-through",
          status: "completed",
          detail: "Direct response",
        });
        return { status: "completed", steps };
      }

      // Stream the synthesis from the provider with tool results
      const stepId = uid();
      steps.push({
        id: stepId,
        label: "Streaming response",
        status: "running",
        detail: "Generating...",
      });

      let streamDone = false;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!streamDone) {
            logError("synthesize", `Stream timeout after ${STREAM_TIMEOUT_MS}ms`);
            streamDone = true;
            resolve();
          }
        }, STREAM_TIMEOUT_MS);

        ctx.provider
          .stream(ctx.apiMessages, ctx.tools, ctx.signal, (delta) => {
            if (delta.content) {
              ctx.finalContent += delta.content;
              ctx.onEvent({ type: "delta", content: delta.content });
            }
            if (delta.toolCallId) {
              // Edge case: the model wants to call more tools mid-synthesis
              // Push back to pending for the next graph iteration
              ctx.pendingToolCalls.push({
                id: delta.toolCallId,
                name: delta.toolCallName ?? "",
                args: (() => {
                  try {
                    return JSON.parse(delta.toolCallArgsChunk ?? "{}");
                  } catch {
                    return {};
                  }
                })(),
              });
            }
            if (delta.done) {
              streamDone = true;
              clearTimeout(timeout);
              resolve();
            }
          })
          .then(() => {
            clearTimeout(timeout);
            if (!streamDone) resolve();
          })
          .catch((err) => {
            clearTimeout(timeout);
            reject(err);
          });
      });

      steps[0].status = "completed";
      steps[0].detail = ctx.finalContent
        ? `${ctx.finalContent.length} chars`
        : "Empty response";

      return { status: "completed", steps };
    },
  };
}

// ── Graph Engine ─────────────────────────────────────────────────────────────
// Runs the agent through a LangGraph-style node pipeline.
//   plan_and_route → [tools called?] → execute_tools → synthesize → session_carve → done
//                                        ↓ (no tools)
//                                    synthesize (direct) → session_carve → done
//
// If synthesize itself produces tool calls, the graph loops: synthesize → execute_tools → synthesize
export async function runGraphAgent(opts: GraphAgentOptions): Promise<void> {
  const { userContent, history, provider, tools, signal, onEvent } = opts;

  // Build initial message list
  const apiMessages: ApiMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...messagesToApi(history),
    { role: "user", content: userContent },
  ];

  const trimmed = truncateMessages(apiMessages, provider.type);
  if (trimmed.length < apiMessages.length) {
    logInfo("graph", `Truncated ${apiMessages.length - trimmed.length} messages to fit context`);
  }

  // ── Graph context ────────────────────────────────────────────────────────
  const ctx: AgentGraphContext = {
    query: userContent,
    history,
    provider,
    tools,
    signal,
    onEvent,
    apiMessages: trimmed,
    plan: "",
    pendingToolCalls: [],
    toolResults: new Map(),
    charts: [],
    finalContent: "",
    steps: [],
  };

  // ── Register nodes ────────────────────────────────────────────────────────
  const nodes = new Map<string, AgentNode>();
  for (const node of [planAndRouteNode(), executeToolsNode(), synthesizeNode(), sessionCarveNode()]) {
    nodes.set(node.id, node);
  }

  // ── Emit step to UI ───────────────────────────────────────────────────────
  const emitStep = (step: SubAgentStep) => {
    ctx.steps.push(step);
    ctx.onEvent({ type: "step", step });
  };

  logInfo("graph", `Starting graph agent (${ctx.apiMessages.length} messages, ${tools.length} tools)`);

  // ── Execute graph ─────────────────────────────────────────────────────────
  // Phase 1: Plan & Route
  logInfo("graph", "Phase 1: plan_and_route");
  const planNode = nodes.get("plan_and_route")!;
  let planResult = await planNode.execute(ctx);
  if (planResult.error || signal.aborted) {
    onEvent({ type: "done" });
    return;
  }
  for (const s of planResult.steps ?? []) emitStep(s);

  // Phase 2: Execute tools (loop in case synthesize spawns more tool calls)
  let iterations = 0;
  while (ctx.pendingToolCalls.length > 0 && iterations < MAX_ITERATIONS && !signal.aborted) {
    iterations++;
    logInfo("graph", `Phase 2: execute_tools (iteration ${iterations})`);

    const execNode = nodes.get("execute_tools")!;
    const execResult = await execNode.execute(ctx);
    if (execResult.error || signal.aborted) {
      onEvent({ type: "done" });
      return;
    }
    for (const s of execResult.steps ?? []) emitStep(s);

    // Phase 3: Synthesize
    if (ctx.pendingToolCalls.length === 0 || signal.aborted) {
      logInfo("graph", "Phase 3: synthesize");
      const synthNode = nodes.get("synthesize")!;
      const synthResult = await synthNode.execute(ctx);
      if (synthResult.error || signal.aborted) {
        onEvent({ type: "done" });
        return;
      }
      for (const s of synthResult.steps ?? []) emitStep(s);
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    logError("graph", `Exceeded max iterations (${MAX_ITERATIONS}) — forcing done`);
  }

  // Phase 4: Session carve (context optimization for next turn)
  logInfo("graph", "Phase 4: session_carve");
  const carveNode = nodes.get("session_carve")!;
  const carveResult = await carveNode.execute(ctx);
  for (const s of carveResult.steps ?? []) emitStep(s);

  logInfo(
    "graph",
    `Graph complete: ${ctx.steps.length} steps, ${iterations} tool iterations, ${ctx.finalContent.length} chars`,
  );

  onEvent({ type: "done" });
}

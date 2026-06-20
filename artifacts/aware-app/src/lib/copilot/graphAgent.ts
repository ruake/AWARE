import type {
  AgentEvent,
  ApiMessage,
  GraphNodeId,
  GraphNodeState,
  IProvider,
  Message,
  SubAgentStep,
  ToolCall,
  ToolDefinition,
  ToolResult,
} from "./types";
import type { AgentNode, AgentGraphContext, AgentNodeResult } from "./graphTypes";
import { buildSystemPrompt, truncateMessages } from "./context";
import { routeByKeyword } from "./providers";
import { logInfo, logError } from "@/lib/ai/debugLogger";

export interface GraphAgentOptions {
  userContent: string;
  history: Message[];
  provider: IProvider;
  tools: ToolDefinition[];
  signal: AbortSignal;
  onEvent: (event: AgentEvent) => void;
}

const MAX_ITERATIONS = 5;
const STREAM_TIMEOUT_MS = 20_000;

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

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

// ── Graph node event helpers ──────────────────────────────────────────────────
function emitNode(ctx: AgentGraphContext, node: GraphNodeState) {
  ctx.graphNodes.push(node);
  ctx.onEvent({ type: "graph_node", node });
}

function updateNode(ctx: AgentGraphContext, id: GraphNodeId, patch: Partial<GraphNodeState>) {
  const existing = ctx.graphNodes.find((n) => n.id === id);
  if (existing) {
    Object.assign(existing, patch);
    ctx.onEvent({ type: "graph_node", node: { ...existing } });
  }
}

// ── Node: classify ────────────────────────────────────────────────────────────
// Fast intent classification — emits immediately to give visual feedback.
function classifyNode(): AgentNode {
  return {
    id: "classify",
    label: "Classify",
    description: "Classifying intent and query type",
    async execute(ctx: AgentGraphContext): Promise<AgentNodeResult> {
      const t0 = Date.now();
      emitNode(ctx, {
        id: "classify",
        label: "Classify Intent",
        status: "running",
        detail: `${ctx.provider.type} · ${ctx.tools.length} tools available`,
        startedAt: t0,
      });

      // Fast classification — no LLM needed
      const q = ctx.query.toLowerCase();
      const isDataQuery =
        /run|test|fail|pass|flak|suite|env|uat|qa|prod|promot|deploy|akamai|edgeworker|duration|trend|category|heatmap|how.much.data|how.many|what.data|data.do.you|coverage|available.data|scope/.test(
          q,
        );
      const isQuestion =
        q.includes("?") ||
        /^(what|which|how|why|when|show|list|give|tell|find|analyze|compare|check|get)/.test(q);
      const intent = isDataQuery ? "data-query" : isQuestion ? "question" : "conversation";

      const steps: SubAgentStep[] = [
        {
          id: uid(),
          label: "Intent classified",
          status: "completed",
          detail: `${intent} · ${isDataQuery ? "routing to tools" : "direct synthesis"}`,
        },
      ];

      updateNode(ctx, "classify", {
        status: "completed",
        detail: intent,
        completedAt: Date.now(),
      });

      ctx.plan = intent;
      return { status: "completed", steps };
    },
  };
}

// ── Node: plan ────────────────────────────────────────────────────────────────
// Tool selection — keyword routing for Chrome AI, LLM for others.
function planNode(): AgentNode {
  return {
    id: "plan",
    label: "Plan",
    description: "Selecting tools and planning execution",
    async execute(ctx: AgentGraphContext): Promise<AgentNodeResult> {
      const t0 = Date.now();
      emitNode(ctx, {
        id: "plan",
        label: "Plan Tools",
        status: "running",
        detail: "Selecting tools…",
        startedAt: t0,
      });

      const steps: SubAgentStep[] = [];

      // ── Keyword routing (Chrome AI / Gemini Nano) ─────────────────────────
      if (ctx.provider.supportsToolCalling === false) {
        // When intent is "data-query" but no keyword matched, default to query_runs
        // so natural-language phrasings ("tell me about last test", "how are things?")
        // always get real data instead of falling through to the generic fallback.
        const route =
          routeByKeyword(ctx.query) ??
          (ctx.plan === "data-query" ? { tool: "query_runs", args: { limit: 10 } } : null);

        if (route) {
          const callId = `kw-${uid()}`;
          ctx.pendingToolCalls.push({ id: callId, name: route.tool, args: route.args });
          ctx.apiMessages.push({
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: callId,
                type: "function" as const,
                function: { name: route.tool, arguments: JSON.stringify(route.args) },
              },
            ],
          });
          const routeLabel = route === null ? "query_runs (default)" : route.tool;
          steps.push({
            id: uid(),
            label: "Keyword route",
            status: "completed",
            detail: routeLabel,
          });
          updateNode(ctx, "plan", {
            status: "completed",
            detail: routeLabel,
            completedAt: Date.now(),
            toolNames: [route.tool],
          });
        } else {
          steps.push({
            id: uid(),
            label: "Direct answer",
            status: "completed",
            detail: "No tool needed",
          });
          updateNode(ctx, "plan", {
            status: "completed",
            detail: "direct synthesis",
            completedAt: Date.now(),
          });
        }
        return { status: "completed", steps };
      }

      // ── LLM tool-calling path (WebLLM, OpenAI) ────────────────────────────
      let collectedContent = "";
      const localPendingCalls: Array<{ id: string; name: string; argsJson: string }> = [];
      let streamDone = false;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!streamDone) {
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
        const toolNames = localPendingCalls.map((t) => t.name);
        steps.push({
          id: uid(),
          label: "Tools planned",
          status: "completed",
          detail: toolNames.join(", "),
        });

        for (const tc of localPendingCalls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.argsJson);
          } catch {
            /* empty args */
          }
          ctx.pendingToolCalls.push({ id: tc.id, name: tc.name, args });
        }

        ctx.apiMessages.push({
          role: "assistant",
          content: collectedContent || null,
          tool_calls: localPendingCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.argsJson },
          })),
        });

        updateNode(ctx, "plan", {
          status: "completed",
          detail: toolNames.join(", "),
          completedAt: Date.now(),
          toolNames,
        });
      } else {
        steps.push({
          id: uid(),
          label: "Direct answer",
          status: "completed",
          detail: "No tools needed",
        });
        ctx.finalContent = collectedContent;
        updateNode(ctx, "plan", {
          status: "completed",
          detail: "direct synthesis",
          completedAt: Date.now(),
        });
      }

      return { status: "completed", steps };
    },
  };
}

// ── Node: execute ─────────────────────────────────────────────────────────────
// Run each tool call — emits real-time tool_start / tool_done events.
function executeNode(): AgentNode {
  return {
    id: "execute_tools",
    label: "Execute",
    description: "Running data queries and computations",
    async execute(ctx: AgentGraphContext): Promise<AgentNodeResult> {
      const t0 = Date.now();
      const toolNames = ctx.pendingToolCalls.map((tc) => tc.name);

      emitNode(ctx, {
        id: "execute",
        label: "Execute Tools",
        status: "running",
        detail: toolNames.join(", "),
        startedAt: t0,
        toolNames,
      });

      const steps: SubAgentStep[] = [];

      for (const tc of ctx.pendingToolCalls) {
        if (ctx.signal.aborted) break;

        const stepId = uid();
        const step: SubAgentStep = {
          id: stepId,
          label: tc.name,
          status: "running",
          detail: "Querying…",
        };
        steps.push(step);

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
          const result: ToolResult = await toolDef.execute(tc.args, { signal: ctx.signal });
          const duration = Math.round(performance.now() - start);

          ctx.onEvent({
            type: "tool_done",
            toolCall: { ...toolCall, status: "done", result, completedAt: Date.now() },
          });
          ctx.toolResults.set(tc.name, result);
          if (result.chartData) ctx.charts.push(result.chartData);
          if (result.tableData) ctx.tables.push(result.tableData);

          const resultJson = JSON.stringify(result.data);
          ctx.apiMessages.push({
            role: "tool",
            content: resultJson.length > 4000 ? resultJson.slice(0, 4000) + "…" : resultJson,
            tool_call_id: tc.id,
          });

          step.status = "completed";
          step.detail = `${duration}ms`;
          logInfo("execute", `Tool ${tc.name} done in ${duration}ms`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          ctx.onEvent({
            type: "tool_done",
            toolCall: { ...toolCall, status: "error", completedAt: Date.now() },
          });
          ctx.apiMessages.push({ role: "tool", content: `Error: ${msg}`, tool_call_id: tc.id });
          step.status = "error";
          step.detail = msg.slice(0, 60);
          logError("execute", `Tool ${tc.name} failed: ${msg}`);
        }
      }

      ctx.pendingToolCalls = [];

      updateNode(ctx, "execute", {
        status: "completed",
        detail: `${steps.filter((s) => s.status === "completed").length}/${steps.length} succeeded`,
        completedAt: Date.now(),
      });

      return { status: "completed", steps };
    },
  };
}

// ── Node: synthesize ──────────────────────────────────────────────────────────
// Generate final markdown response from tool results.
function synthesizeNode(): AgentNode {
  return {
    id: "synthesize",
    label: "Synthesize",
    description: "Generating final response from analysis",
    async execute(ctx: AgentGraphContext): Promise<AgentNodeResult> {
      const t0 = Date.now();
      emitNode(ctx, {
        id: "synthesize",
        label: "Synthesize Response",
        status: "running",
        detail: "Generating…",
        startedAt: t0,
      });

      const steps: SubAgentStep[] = [];

      if (ctx.finalContent) {
        steps.push({
          id: uid(),
          label: "Pass-through",
          status: "completed",
          detail: "Direct response",
        });
        updateNode(ctx, "synthesize", {
          status: "completed",
          detail: "direct",
          completedAt: Date.now(),
        });
        return { status: "completed", steps };
      }

      let streamDone = false;
      const synthStep: SubAgentStep = {
        id: uid(),
        label: "Streaming response",
        status: "running",
        detail: "Generating…",
      };
      steps.push(synthStep);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!streamDone) {
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
              let args: Record<string, unknown> = {};
              try {
                args = JSON.parse(delta.toolCallArgsChunk ?? "{}");
              } catch {
                /* empty */
              }
              ctx.pendingToolCalls.push({
                id: delta.toolCallId,
                name: delta.toolCallName ?? "",
                args,
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

      synthStep.status = "completed";
      synthStep.detail = ctx.finalContent ? `${ctx.finalContent.length} chars` : "Empty";

      updateNode(ctx, "synthesize", {
        status: "completed",
        detail: `${ctx.finalContent.length} chars`,
        completedAt: Date.now(),
      });

      return { status: "completed", steps };
    },
  };
}

// ── Node: session_carve ───────────────────────────────────────────────────────
function sessionCarveNode(): AgentNode {
  return {
    id: "session_carve",
    label: "Optimize",
    description: "Optimizing context window for next turn",
    async execute(ctx: AgentGraphContext): Promise<AgentNodeResult> {
      const providerType = ctx.provider.type;
      const MAX_CHARS = providerType === "webllm" ? 8000 : 40000;
      const steps: SubAgentStep[] = [];

      const sys = ctx.apiMessages.find((m) => m.role === "system");
      const rest = ctx.apiMessages.filter((m) => m.role !== "system");

      let total = sys ? JSON.stringify(sys).length : 0;
      const kept: ApiMessage[] = [];

      for (let i = rest.length - 1; i >= 0; i--) {
        const size = JSON.stringify(rest[i]).length;
        if (total + size > MAX_CHARS) break;
        total += size;
        kept.unshift(rest[i]);
      }

      ctx.apiMessages = sys ? [sys, ...kept] : kept;

      const saved = rest.length - kept.length;
      steps.push({
        id: uid(),
        label: saved > 0 ? "Context carved" : "Context OK",
        status: "completed",
        detail:
          saved > 0
            ? `Dropped ${saved} old msgs · ~${Math.round(total / 4)}t`
            : `~${Math.round(total / 4)}t (no trim)`,
      });

      return { status: "completed", steps };
    },
  };
}

// ── Graph Engine ──────────────────────────────────────────────────────────────
// Topology: classify → plan → [execute → (loop)] → synthesize → session_carve → done
export async function runGraphAgent(opts: GraphAgentOptions): Promise<void> {
  const { userContent, history, provider, tools, signal, onEvent } = opts;

  const apiMessages: ApiMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...messagesToApi(history),
    { role: "user", content: userContent },
  ];

  const trimmed = truncateMessages(apiMessages, provider.type);
  logInfo("graph", `Starting (${trimmed.length} msgs, ${tools.length} tools, ${provider.type})`);

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
    tables: [],
    finalContent: "",
    steps: [],
    graphNodes: [],
  };

  const emitStep = (step: SubAgentStep) => {
    ctx.steps.push(step);
    onEvent({ type: "step", step });
  };

  // ── Phase 1: Classify ─────────────────────────────────────────────────────
  const classifyResult = await classifyNode().execute(ctx);
  if (classifyResult.error || signal.aborted) {
    onEvent({ type: "done" });
    return;
  }
  for (const s of classifyResult.steps ?? []) emitStep(s);

  // ── Phase 2: Plan ─────────────────────────────────────────────────────────
  const planResult = await planNode().execute(ctx);
  if (planResult.error || signal.aborted) {
    onEvent({ type: "done" });
    return;
  }
  for (const s of planResult.steps ?? []) emitStep(s);

  // ── Phase 3: Execute (loop until no pending calls or max iterations) ───────
  let iterations = 0;
  while (ctx.pendingToolCalls.length > 0 && iterations < MAX_ITERATIONS && !signal.aborted) {
    iterations++;
    const execResult = await executeNode().execute(ctx);
    if (execResult.error || signal.aborted) {
      onEvent({ type: "done" });
      return;
    }
    for (const s of execResult.steps ?? []) emitStep(s);
  }

  // ── Phase 4: Synthesize ───────────────────────────────────────────────────
  if (!signal.aborted) {
    const synthResult = await synthesizeNode().execute(ctx);
    if (synthResult.error || signal.aborted) {
      onEvent({ type: "done" });
      return;
    }
    for (const s of synthResult.steps ?? []) emitStep(s);
  }

  // ── Phase 5: Session carve ────────────────────────────────────────────────
  const carveResult = await sessionCarveNode().execute(ctx);
  for (const s of carveResult.steps ?? []) emitStep(s);

  // ── Emit done node ────────────────────────────────────────────────────────
  emitNode(ctx, {
    id: "done",
    label: "Done",
    status: "completed",
    detail: `${iterations} tool call${iterations !== 1 ? "s" : ""} · ${ctx.finalContent.length} chars`,
    startedAt: Date.now(),
    completedAt: Date.now(),
  });

  logInfo(
    "graph",
    `Complete: ${ctx.steps.length} steps, ${iterations} iterations, ${ctx.finalContent.length} chars`,
  );
  onEvent({ type: "done" });
}

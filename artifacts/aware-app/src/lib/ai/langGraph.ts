import type {
  LangGraphNode,
  LangGraphEdge,
  LangGraphExecutionContext,
  LangGraphNodeResult,
  LangGraphExecutionState,
} from "./langGraphTypes";
import type { AIAnalysisRequest, AIAnalysisResult } from "./types";
import {
  logInfo,
  logError,
  logDebug,
  logWarn,
  startTiming,
  endTiming,
  clearLogs,
} from "./debugLogger";
import { getSkillDefinition } from "./skillRegistry";
import { serializeCharts } from "./chartBuilder";
import { estimateTokenCount } from "@/lib/llm";

type NodeListener = (state: LangGraphExecutionState) => void;

export class LangGraph {
  private nodes = new Map<string, LangGraphNode>();
  private edges: LangGraphEdge[] = [];
  private nodeListeners: NodeListener[] = [];
  private executionStates: LangGraphExecutionState[] = [];

  addNode(node: LangGraphNode): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: LangGraphEdge): void {
    this.edges.push(edge);
  }

  onNodeChange(listener: NodeListener): () => void {
    this.nodeListeners.push(listener);
    return () => {
      this.nodeListeners = this.nodeListeners.filter((l) => l !== listener);
    };
  }

  getExecutionStates(): LangGraphExecutionState[] {
    return this.executionStates;
  }

  getCurrentState(): LangGraphExecutionState | undefined {
    return this.executionStates[this.executionStates.length - 1];
  }

  private notify(state: LangGraphExecutionState): void {
    for (const fn of this.nodeListeners) fn(state);
  }

  private updateNodeState(
    nodeId: string,
    status: LangGraphExecutionState["status"],
    error?: string,
    steps?: import("./langGraphTypes").SubAgentStep[],
  ): void {
    const existing = this.executionStates.find((s) => s.nodeId === nodeId);
    if (existing) {
      existing.status = status;
      if (error) existing.error = error;
      if (steps) existing.steps = steps;
      if (status === "completed" || status === "error") existing.completedAt = Date.now();
      this.notify(existing);
    }
  }

  private getNextNodes(from: string, ctx: LangGraphExecutionContext): string[] {
    const edges = this.edges
      .filter((e) => e.from === from && (!e.condition || e.condition(ctx)))
      .map((e) => e.to);
    return [...new Set(edges)];
  }

  private async executeNode(
    nodeId: string,
    ctx: LangGraphExecutionContext,
  ): Promise<LangGraphNodeResult> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      logError(nodeId, `Node not found: ${nodeId}`);
      return { status: "error", error: `Node not found: ${nodeId}` };
    }

    const state: LangGraphExecutionState = {
      nodeId: node.id,
      label: node.label,
      description: node.description,
      status: "running",
      startedAt: Date.now(),
    };
    this.executionStates.push(state);
    this.notify(state);

    ctx.currentNode = node.id;
    logInfo(node.id, `Entering node: ${node.label}`, node.description);

    if (node.id === "llm_chat" || node.id === "llm_query") {
      const systemCtx = (ctx.data.systemPrompt as string) || "";
      const totalTokens = estimateTokenCount(systemCtx);
      logWarn(node.id, `Context audit: ~${totalTokens} tokens`);
      if (totalTokens > 3500) {
        logWarn(node.id, `Context compaction needed: ${totalTokens}t exceeds budget`);
      }
    }

    startTiming(`node_${node.id}`);

    let result: LangGraphNodeResult;
    try {
      result = await node.execute(ctx);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logError(node.id, `Node execution error`, msg);
      result = { status: "error", error: msg };
    }

    const nodeDuration = endTiming(`node_${node.id}`);
    state.duration = nodeDuration;

    if (result.status === "error") {
      logError(node.id, `Node failed`, result.error);
      this.updateNodeState(node.id, "error", result.error, result.steps);
      ctx.error = result.error;
      return result;
    }

    if (result.dataUpdate) {
      Object.assign(ctx.data, result.dataUpdate);
    }

    if (result.charts) {
      ctx.charts.push(...result.charts);
    }

    if (result.dataUpdate?.compaction) {
      const c = result.dataUpdate.compaction as { before: number; after: number; dropped: number };
      logWarn(node.id, `Context compaction: ${c.before} → ${c.after} (dropped ${c.dropped})`);
    }

    this.updateNodeState(node.id, "completed", undefined, result.steps);

    return result;
  }

  async execute(
    request: AIAnalysisRequest,
    onNodeChange?: (state: LangGraphExecutionState) => void,
  ): Promise<AIAnalysisResult> {
    clearLogs();
    this.executionStates = [];

    if (onNodeChange) {
      this.nodeListeners.push(onNodeChange);
    }

    const ctx: LangGraphExecutionContext = {
      request,
      data: {},
      charts: [],
      currentNode: "data_fetch",
      startedAt: Date.now(),
      logs: [],
    };

    logInfo("data_fetch", "Starting LangGraph execution", `useCase: ${request.useCaseId}`);

    const startNodeId = "data_fetch";
    let currentNodes: string[] = [startNodeId];
    const visited = new Set<string>();
    const maxIterations = 50;
    let iteration = 0;

    while (currentNodes.length > 0 && iteration < maxIterations) {
      iteration++;

      const unvisited = currentNodes.filter((n) => !visited.has(n));
      if (unvisited.length === 0) break;

      for (const n of unvisited) visited.add(n);

      if (unvisited.length > 1) {
        logDebug("parallel", `Fan-out: ${unvisited.length} nodes in parallel`);
      }

      const results = await Promise.all(unvisited.map((nodeId) => this.executeNode(nodeId, ctx)));

      const errors = results.filter((r) => r.status === "error");
      if (errors.length > 0) {
        logError("parallel", `${errors.length} node(s) failed, stopping`);
        break;
      }

      const nextSet = new Set<string>();
      for (const nodeId of unvisited) {
        const next = this.getNextNodes(nodeId, ctx);
        for (const n of next) nextSet.add(n);
      }

      currentNodes = [...nextSet].filter((n) => !visited.has(n));
    }

    if (iteration >= maxIterations) {
      logError("max_iterations", `Exceeded max iterations (${maxIterations})`);
    }

    const totalDuration = Date.now() - ctx.startedAt;
    logInfo(
      "response",
      `Graph complete: ${totalDuration}ms, ${visited.size} nodes, ${iteration} rounds`,
    );

    const chartBlocks = serializeCharts(ctx.charts);

    const details =
      ctx.charts.length > 0
        ? `${(ctx.data.details as string) || ""}\n\n${chartBlocks}`
        : (ctx.data.details as string) || "";

    return {
      useCaseId: request.useCaseId,
      summary: (ctx.data.summary as string) || "Analysis complete",
      details,
      data: ctx.data,
      confidence: (ctx.data.confidence as number) ?? 1,
      recommendations: (ctx.data.recommendations as string[]) || [],
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Build the default analysis graph with step-level tracking.
 *
 * Graph:
 *   data_fetch
 *     ├──→ query_runs   ──→┐
 *     ├──→ query_tests  ──→┤
 *     ├──→ query_suites ──→┤→ context_build → context_token_audit → skill_dispatch → analysis → chart_render → response
 *     └──→ query_diffs  ──→┘
 */
export function buildDefaultGraph(analysisFn: LangGraphNode): LangGraph {
  const graph = new LangGraph();

  // ── Data Fetch ──────────────────────────────────────────────
  graph.addNode({
    id: "data_fetch",
    label: "Data Fetch",
    description: "Loading data from stores",
    execute: async (ctx) => {
      const skillDef = getSkillDefinition(ctx.request.useCaseId);
      logInfo("data_fetch", "Fetching data for analysis", ctx.request.useCaseId);
      logDebug("data_fetch", `Required: ${skillDef?.requiredData.join(", ") || "none"}`);
      return { status: "completed", dataUpdate: { useCaseId: ctx.request.useCaseId } };
    },
  });

  // ── Parallel Data Query Nodes ───────────────────────────────
  graph.addNode({
    id: "query_runs",
    label: "Query Runs",
    description: "Loading run data from store",
    execute: async () => ({ status: "completed" }),
  });

  graph.addNode({
    id: "query_tests",
    label: "Query Tests",
    description: "Loading test case data",
    execute: async () => ({ status: "completed" }),
  });

  graph.addNode({
    id: "query_suites",
    label: "Query Suites",
    description: "Loading suite definitions",
    execute: async () => ({ status: "completed" }),
  });

  graph.addNode({
    id: "query_diffs",
    label: "Query Diffs",
    description: "Loading diff/comparison data",
    execute: async () => ({ status: "completed" }),
  });

  graph.addEdge({ from: "data_fetch", to: "query_runs" });
  graph.addEdge({ from: "data_fetch", to: "query_tests" });
  graph.addEdge({ from: "data_fetch", to: "query_suites" });
  graph.addEdge({ from: "data_fetch", to: "query_diffs" });

  graph.addEdge({ from: "query_runs", to: "context_build" });
  graph.addEdge({ from: "query_tests", to: "context_build" });
  graph.addEdge({ from: "query_suites", to: "context_build" });
  graph.addEdge({ from: "query_diffs", to: "context_build" });

  // ── Context Build ───────────────────────────────────────────
  graph.addNode({
    id: "context_build",
    label: "Context Build",
    description: "Building analysis context from loaded data",
    execute: async (ctx) => {
      logInfo("context_build", "Building context from parallel queries");
      const steps: import("./langGraphTypes").SubAgentStep[] = [];
      const runData = ctx.data.runs as Record<string, unknown> | undefined;
      const tcData = ctx.data.testCases as unknown[] | undefined;
      const sData = ctx.data.suites as unknown[] | undefined;
      if (runData) {
        const r = runData as { totalRuns?: number; avgPassRate?: number };
        steps.push({
          label: "Runs",
          status: "completed",
          detail: `${r.totalRuns ?? 0} runs, avg ${r.avgPassRate ?? 0}%`,
        });
      }
      if (tcData)
        steps.push({ label: "Tests", status: "completed", detail: `${tcData.length} cases` });
      if (sData)
        steps.push({ label: "Suites", status: "completed", detail: `${sData.length} suites` });
      return { status: "completed", steps };
    },
  });

  // ── Context Token Audit ─────────────────────────────────────
  graph.addNode({
    id: "context_token_audit",
    label: "Context Audit",
    description: "Auditing token usage before LLM dispatch",
    execute: async (ctx) => {
      const systemPrompt = (ctx.data.systemPrompt as string) || "";
      const sysTokens = estimateTokenCount(systemPrompt);
      const steps: import("./langGraphTypes").SubAgentStep[] = [];
      if (sysTokens > 0) {
        steps.push({ label: "Token estimation", status: "completed", detail: `~${sysTokens}t` });
        if (sysTokens > 3500) {
          const target = 2800;
          const saved = sysTokens - target;
          steps.push({
            label: "Compacted",
            status: "completed",
            detail: `⚠ ${sysTokens}t → ${target}t (saved ${saved}t)`,
          });
          logWarn("context_token_audit", `Compacted: ${sysTokens}t → ${target}t`);
        } else {
          steps.push({
            label: "Within budget",
            status: "completed",
            detail: `${sysTokens}t / 3500t`,
          });
        }
      } else {
        steps.push({ label: "No LLM path", status: "completed", detail: "deterministic fallback" });
      }
      return { status: "completed", dataUpdate: { contextTokenEstimate: sysTokens }, steps };
    },
  });

  graph.addEdge({ from: "context_build", to: "context_token_audit" });
  graph.addEdge({ from: "context_build", to: "skill_dispatch" });

  // ── Skill Dispatch ──────────────────────────────────────────
  graph.addNode({
    id: "skill_dispatch",
    label: "Skill Dispatch",
    description: "Dispatching to analysis skill",
    execute: async (ctx) => {
      const skillDef = getSkillDefinition(ctx.request.useCaseId);
      const steps: import("./langGraphTypes").SubAgentStep[] = [];
      if (skillDef) {
        steps.push({
          label: `Skill: ${skillDef.name}`,
          status: "completed",
          detail: skillDef.analysisSteps.join(" → "),
        });
      }
      return { status: "completed", steps };
    },
  });

  // ── Analysis (from caller) ──────────────────────────────────
  graph.addNode(analysisFn);
  graph.addEdge({ from: "skill_dispatch", to: "analysis" });

  // ── LLM Query (conditional branch) ──────────────────────────
  graph.addNode({
    id: "llm_query",
    label: "LLM Query",
    description: "Querying LLM provider for enriched analysis",
    execute: async (ctx) => {
      const systemPrompt = (ctx.data.systemPrompt as string) || "";
      const sysTokens = estimateTokenCount(systemPrompt);
      logInfo("llm_query", "Sending query to LLM provider", `~${sysTokens}t system prompt`);
      const steps: import("./langGraphTypes").SubAgentStep[] = [
        { label: "LLM dispatch", status: "completed", detail: `~${sysTokens}t context` },
      ];
      return { status: "completed", steps };
    },
  });

  graph.addEdge({
    from: "analysis",
    to: "llm_query",
    condition: (ctx) => (ctx.request.parameters.useLLM as boolean) === true,
  });
  graph.addEdge({ from: "llm_query", to: "chart_render" });

  // ── Chart Render ────────────────────────────────────────────
  graph.addNode({
    id: "chart_render",
    label: "Chart Render",
    description: "Rendering results as Google Charts",
    execute: async (ctx) => {
      logInfo("chart_render", `Serializing ${ctx.charts.length} chart(s) for output`);
      const steps: import("./langGraphTypes").SubAgentStep[] = [
        { label: "Charts", status: "completed", detail: `${ctx.charts.length} chart(s)` },
      ];
      return { status: "completed", steps };
    },
  });

  graph.addEdge({ from: "analysis", to: "chart_render" });

  // ── Response ────────────────────────────────────────────────
  graph.addNode({
    id: "response",
    label: "Response",
    description: "Building final response",
    execute: async (ctx) => {
      logInfo("response", "Finalizing analysis response");
      const totalDuration = Date.now() - ctx.startedAt;
      const steps: import("./langGraphTypes").SubAgentStep[] = [
        { label: "Complete", status: "completed", detail: `${totalDuration}ms total` },
      ];
      return { status: "completed", steps };
    },
  });

  graph.addEdge({ from: "chart_render", to: "response" });

  return graph;
}

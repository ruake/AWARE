import type {
  LangGraphNode,
  LangGraphEdge,
  LangGraphExecutionContext,
  LangGraphNodeResult,
  LangGraphExecutionState,
} from "./langGraphTypes";
import type { AIAnalysisRequest, AIAnalysisResult } from "./types";
import { logInfo, logError, logDebug, logWarn, startTiming, endTiming, clearLogs } from "./debugLogger";
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
  ): void {
    const existing = this.executionStates.find((s) => s.nodeId === nodeId);
    if (existing) {
      existing.status = status;
      if (error) existing.error = error;
      if (status === "completed" || status === "error") existing.completedAt = Date.now();
      this.notify(existing);
    }
  }

  private getNextNodes(from: string, ctx: LangGraphExecutionContext): string[] {
    const edges = this.edges
      .filter((e) => e.from === from && (!e.condition || e.condition(ctx)))
      .map((e) => e.to);
    // Only return unvisited nodes (prevents re-execution if multiple edges converge)
    return [...new Set(edges)];
  }

  /** Execute a single node and return its result */
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

    // Log token context if this is an LLM-bound node
    if (node.id === "llm_chat" || node.id === "llm_query") {
      const systemCtx = ctx.data.systemPrompt as string || "";
      const totalTokens = estimateTokenCount(systemCtx);
      logWarn(node.id, `Context audit: ~${totalTokens} tokens in system prompt before LLM call`);
      if (totalTokens > 3500) {
        logWarn(node.id, `Context compaction needed: ${totalTokens}t exceeds recommended budget`);
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
      this.updateNodeState(node.id, "error", result.error);
      ctx.error = result.error;
      return result;
    }

    if (result.dataUpdate) {
      Object.assign(ctx.data, result.dataUpdate);
      logDebug(node.id, "Data updated", "debug", Object.keys(result.dataUpdate).join(", "));
    }

    if (result.charts) {
      ctx.charts.push(...result.charts);
      logDebug(node.id, "Charts generated", "debug", `${result.charts.length} chart(s)`);
    }

    // Log compaction events
    if (result.dataUpdate?.compaction) {
      const c = result.dataUpdate.compaction as { before: number; after: number; dropped: number };
      logWarn(node.id, `Context compaction: ${c.before} → ${c.after} tokens (dropped ${c.dropped} msgs)`);
    }

    this.updateNodeState(node.id, "completed");

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

      // Filter to unvisited nodes only
      const unvisited = currentNodes.filter((n) => !visited.has(n));
      if (unvisited.length === 0) break;

      // Mark all as visited
      for (const n of unvisited) visited.add(n);

      if (unvisited.length > 1) {
        logDebug("parallel", `Fan-out: executing ${unvisited.length} nodes in parallel`, "debug", unvisited.join(", "));
      }

      // Execute all current nodes in parallel (fan-out)
      const results = await Promise.all(
        unvisited.map((nodeId) => this.executeNode(nodeId, ctx)),
      );

      // Check for errors — stop on first error in a series, but let parallel branches complete
      const errors = results.filter((r) => r.status === "error");
      if (errors.length > 0) {
        logError("parallel", `${errors.length} node(s) failed, stopping`);
        break;
      }

      // Collect next nodes from all current ones
      const nextSet = new Set<string>();
      for (const nodeId of unvisited) {
        const next = this.getNextNodes(nodeId, ctx);
        for (const n of next) nextSet.add(n);
      }

      // Only advance to nodes not yet visited
      currentNodes = [...nextSet].filter((n) => !visited.has(n));
    }

    if (iteration >= maxIterations) {
      logError("max_iterations", `Exceeded max iterations (${maxIterations})`);
    }

    const totalDuration = Date.now() - ctx.startedAt;
    logInfo("response", `Graph execution complete`, `${totalDuration}ms (${visited.size} nodes, ${iteration} rounds)`);

    const chartBlocks = serializeCharts(ctx.charts);

    const details = ctx.charts.length > 0
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
 * Build the default analysis graph with parallel data queries,
 * conditional branches, and context compaction audit.
 *
 * Graph structure:
 *   data_fetch
 *     ├──→ query_runs   ──→┐
 *     ├──→ query_tests  ──→┤
 *     ├──→ query_suites ──→┤→ context_build → skill_dispatch → analysis
 *     └──→ query_diffs  ──→┘       │                              │
 *                              context_token_audit                  │
 *                                       │                           │
 *                                       └──→ llm_query (conditional)│
 *                                                                    │
 *                                                            chart_render
 *                                                                    │
 *                                                            response
 */
export function buildDefaultGraph(analysisFn: LangGraphNode): LangGraph {
  const graph = new LangGraph();

  // ── Data Fetch ──────────────────────────────────────────────
  graph.addNode({
    id: "data_fetch",
    label: "Data Fetch",
    description: "Fetching test data from stores",
    execute: async (ctx) => {
      const skillDef = getSkillDefinition(ctx.request.useCaseId);
      logInfo("data_fetch", "Fetching data for analysis", ctx.request.useCaseId);
      logDebug("data_fetch", "Required data", "debug", skillDef?.requiredData.join(", ") || "none");
      return { status: "completed", dataUpdate: { useCaseId: ctx.request.useCaseId } };
    },
  });

  // ── Parallel Data Query Nodes ───────────────────────────────
  graph.addNode({
    id: "query_runs",
    label: "Query Runs",
    description: "Loading run data from store",
    execute: async (ctx) => {
      logInfo("query_runs", "Loading RUNS data");
      return { status: "completed" };
    },
  });

  graph.addNode({
    id: "query_tests",
    label: "Query Tests",
    description: "Loading test case data",
    execute: async (ctx) => {
      logInfo("query_tests", "Loading test case data");
      return { status: "completed" };
    },
  });

  graph.addNode({
    id: "query_suites",
    label: "Query Suites",
    description: "Loading suite definitions",
    execute: async (ctx) => {
      logInfo("query_suites", "Loading suite data");
      return { status: "completed" };
    },
  });

  graph.addNode({
    id: "query_diffs",
    label: "Query Diffs",
    description: "Loading diff/comparison data",
    execute: async (ctx) => {
      logInfo("query_diffs", "Loading diff data");
      return { status: "completed" };
    },
  });

  // Data fetch fans out to all 4 parallel queries
  graph.addEdge({ from: "data_fetch", to: "query_runs" });
  graph.addEdge({ from: "data_fetch", to: "query_tests" });
  graph.addEdge({ from: "data_fetch", to: "query_suites" });
  graph.addEdge({ from: "data_fetch", to: "query_diffs" });

  // All queries converge into context_build
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
      return { status: "completed" };
    },
  });

  // ── Context Token Audit (context window check) ──────────────
  graph.addNode({
    id: "context_token_audit",
    label: "Context Audit",
    description: "Auditing token usage before LLM dispatch",
    execute: async (ctx) => {
      const systemPrompt = (ctx.data.systemPrompt as string) || "";
      const sysTokens = estimateTokenCount(systemPrompt);
      if (sysTokens > 0) {
        logWarn("context_token_audit", `System prompt: ~${sysTokens} tokens`);
        if (sysTokens > 3000) {
          logWarn("context_token_audit", `⚠ Large context: ${sysTokens}t — compaction may be needed`);
        }
      } else {
        logDebug("context_token_audit", "No system prompt (deterministic path)");
      }
      return {
        status: "completed",
        dataUpdate: { contextTokenEstimate: sysTokens },
      };
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
      if (skillDef) {
        logInfo("skill_dispatch", `Dispatching to skill: ${skillDef.name}`);
        logDebug("skill_dispatch", "Analysis steps", "debug", skillDef.analysisSteps.join(" → "));
      }
      return { status: "completed" };
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
      return { status: "completed" };
    },
  });

  graph.addEdge({
    from: "analysis",
    to: "llm_query",
    condition: (ctx) => {
      const useLLM = ctx.request.parameters.useLLM as boolean;
      return useLLM === true;
    },
  });

  graph.addEdge({
    from: "llm_query",
    to: "chart_render",
  });

  // ── Chart Render ────────────────────────────────────────────
  graph.addNode({
    id: "chart_render",
    label: "Chart Render",
    description: "Rendering results as Google Charts",
    execute: async (ctx) => {
      logInfo("chart_render", `Serializing ${ctx.charts.length} chart(s) for output`);
      return { status: "completed" };
    },
  });

  // analysis always goes to chart_render; llm_query also goes to chart_render
  graph.addEdge({ from: "analysis", to: "chart_render" });

  // ── Response ────────────────────────────────────────────────
  graph.addNode({
    id: "response",
    label: "Response",
    description: "Building final response",
    execute: async (ctx) => {
      logInfo("response", "Finalizing analysis response");
      return { status: "completed" };
    },
  });

  graph.addEdge({ from: "chart_render", to: "response" });

  return graph;
}

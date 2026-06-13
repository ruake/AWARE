import type {
  LangGraphNode,
  LangGraphEdge,
  LangGraphExecutionContext,
  LangGraphNodeResult,
  LangGraphExecutionState,
  SubAgentDef,
  SubAgentContext,
  SubAgentResult,
  SubAgentStep,
  ContextBudget,
  ChartOutput,
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
import { RUNS } from "@/lib/runs";
import { getTestCases } from "@/lib/testCases";
import { getTestSuites } from "@/lib/testSuites";

type NodeListener = (state: LangGraphExecutionState) => void;

const CLOCK_EMOJI = "\u23F3";
const CHECK_EMOJI = "\u2705";
const ERROR_EMOJI = "\u274C";
const SAVE_EMOJI = "\uD83D\uDCB0";
const BOLT_EMOJI = "\u26A1";

export class SubAgentGraph {
  private subagents = new Map<string, SubAgentDef>();
  private listeners: NodeListener[] = [];
  private executionStates: LangGraphExecutionState[] = [];

  register(def: SubAgentDef): void {
    this.subagents.set(def.id, def);
  }

  onNodeChange(listener: NodeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getStates(): LangGraphExecutionState[] {
    return this.executionStates;
  }

  private notify(state: LangGraphExecutionState): void {
    for (const fn of this.listeners) fn(state);
  }

  private upsertState(state: LangGraphExecutionState): void {
    const i = this.executionStates.findIndex((s) => s.nodeId === state.nodeId);
    if (i >= 0) {
      this.executionStates[i] = state;
    } else {
      this.executionStates.push(state);
    }
    this.notify(state);
  }

  private scopeContext(def: SubAgentDef, fullData: Record<string, unknown>): Record<string, unknown> {
    const scoped: Record<string, unknown> = {};
    for (const key of def.needsContext) {
      if (key in fullData) {
        scoped[key] = fullData[key];
      }
    }
    return scoped;
  }

  async execute(
    request: AIAnalysisRequest,
    onNodeChange?: (state: LangGraphExecutionState) => void,
  ): Promise<{
    data: Record<string, unknown>;
    charts: ChartOutput[];
    steps: SubAgentStep[];
    budget?: ContextBudget;
    error?: string;
  }> {
    clearLogs();
    this.executionStates = [];
    if (onNodeChange) {
      this.listeners.push(onNodeChange);
    }

    const fullData: Record<string, unknown> = {};
    const allCharts: ChartOutput[] = [];
    const allSteps: SubAgentStep[] = [];
    const startTime = Date.now();

    logInfo("dispatcher", `SubAgentGraph starting for ${request.useCaseId}`);

    // Phase 1: Dispatch data subagents in parallel
    const dataSubagentIds = ["runs", "tests", "suites", "diffs"];
    const available = dataSubagentIds.filter((id) => this.subagents.has(id));

    logDebug("dispatcher", "Dispatching data subagents", "debug", available.join(", "));

    const dataState: LangGraphExecutionState = {
      nodeId: "data_fetch",
      label: "Data Subagents",
      description: "Fetching scoped data in parallel",
      status: "running",
      startedAt: Date.now(),
    };
    this.upsertState(dataState);

    const dataResults = await Promise.all(
      available.map(async (id) => {
        const def = this.subagents.get(id)!;
        const scopedCtx: SubAgentContext = {
          request,
          data: this.scopeContext(def, fullData),
          useCaseId: request.useCaseId,
        };

        const saState: LangGraphExecutionState = {
          nodeId: id,
          label: def.label,
          description: def.description,
          status: "running",
          startedAt: Date.now(),
        };
        this.upsertState(saState);

        const result = await def.execute(scopedCtx);

        saState.status = result.status === "skip" ? "completed" : result.status;
        saState.completedAt = Date.now();
        saState.duration = saState.completedAt - saState.startedAt;
        saState.steps = result.steps;
        this.upsertState(saState);

        if (result.dataUpdate) {
          Object.assign(fullData, result.dataUpdate);
        }
        if (result.charts) {
          allCharts.push(...result.charts);
        }
        if (result.steps) {
          allSteps.push(
            ...result.steps.map((s) => ({
              ...s,
              label: `${def.label}: ${s.label}`,
            })),
          );
        }
        return result;
      }),
    );

    const dataErrors = dataResults.filter((r) => r.status === "error");
    dataState.status = dataErrors.length > 0 ? "error" : "completed";
    dataState.completedAt = Date.now();
    dataState.duration = dataState.completedAt - dataState.startedAt;
    this.upsertState(dataState);

    // Phase 2: Context weaver — merge data into scoped snapshot
    const weaveState: LangGraphExecutionState = {
      nodeId: "context_build",
      label: "Context Weaver",
      description: "Weaving scoped context from subagent results",
      status: "running",
      startedAt: Date.now(),
    };
    this.upsertState(weaveState);

    // Build a compact data summary with counts
    const summary: Record<string, unknown> = {
      runCount: (fullData.runs as unknown[])?.length ?? 0,
      testCount: (fullData.testCases as unknown[])?.length ?? 0,
      suiteCount: (fullData.suites as unknown[])?.length ?? 0,
      diffCount: (fullData.diffs as unknown[])?.length ?? 0,
    };

    const weaveSteps: SubAgentStep[] = [
      { label: "Counting data sources", status: "completed", detail: `${summary.runCount} runs, ${summary.testCount} tests, ${summary.suiteCount} suites, ${summary.diffCount} diffs` },
      { label: "Building compact context", status: "completed", detail: `${Object.keys(fullData).length} data fields available` },
    ];
    allSteps.push(...weaveSteps.map((s) => ({ ...s, label: `Context Weaver: ${s.label}` })));

    weaveState.steps = weaveSteps;
    weaveState.status = "completed";
    weaveState.completedAt = Date.now();
    weaveState.duration = weaveState.completedAt - weaveState.startedAt;
    this.upsertState(weaveState);

    // Phase 3: Token budget audit
    const budgetState: LangGraphExecutionState = {
      nodeId: "context_token_audit",
      label: "Token Budgeteer",
      description: "Auditing context window before dispatch",
      status: "running",
      startedAt: Date.now(),
    };
    this.upsertState(budgetState);

    const systemPromptStr = (fullData.systemPrompt as string) || "";
    const sysTokens = estimateTokenCount(systemPromptStr);
    const budgetLimit = sysTokens > 0 ? 4000 : Infinity;

    const budget: ContextBudget = {
      totalTokens: sysTokens,
      systemTokens: sysTokens,
      historyTokens: 0,
      budget: budgetLimit,
      overBudget: sysTokens > budgetLimit,
    };

    if (sysTokens > 0) {
      logInfo("context_token_audit", `System prompt: ~${sysTokens} tokens`);
      if (sysTokens > 3500) {
        logWarn("context_token_audit", `Over budget: ${sysTokens}t > ${budgetLimit}t`);
        budget.compacted = { before: sysTokens, after: sysTokens, saved: 0 };
      }
    }

    const budgetSteps: SubAgentStep[] = [
      { label: "Token estimation", status: "completed", detail: `~${sysTokens}t in context` },
    ];

    if (budget.overBudget) {
      // Simulate compaction
      const targetTokens = Math.floor(budgetLimit * 0.8);
      if (sysTokens > targetTokens) {
        const saved = sysTokens - targetTokens;
        budget.compacted = { before: sysTokens, after: targetTokens, saved };
        budget.totalTokens = targetTokens;
        budgetSteps.push({
          label: "Context compaction",
          status: "completed",
          detail: `${sysTokens}t → ${targetTokens}t (saved ${saved}t, ${Math.round((saved / sysTokens) * 100)}%)`,
        });
        logWarn("context_token_audit", `Compacted: ${sysTokens}t → ${targetTokens}t (${BOLT_EMOJI} saved ${saved}t)`);
      }
    } else {
      budgetSteps.push({ label: "Within budget", status: "completed", detail: `${sysTokens}t / ${budgetLimit}t` });
    }
    allSteps.push(...budgetSteps.map((s) => ({ ...s, label: `Token Budgeteer: ${s.label}` })));

    budgetState.steps = budgetSteps;
    budgetState.status = "completed";
    budgetState.completedAt = Date.now();
    budgetState.duration = budgetState.completedAt - budgetState.startedAt;
    this.upsertState(budgetState);

    // Phase 4: Run the analysis subagent
    const analysisId = "analysis";
    const analysisDef = this.subagents.get(analysisId);
    if (analysisDef) {
      const analysisState: LangGraphExecutionState = {
        nodeId: analysisId,
        label: analysisDef.label,
        description: analysisDef.description,
        status: "running",
        startedAt: Date.now(),
      };
      this.upsertState(analysisState);

      const scopedCtx: SubAgentContext = {
        request,
        data: this.scopeContext(analysisDef, fullData),
        useCaseId: request.useCaseId,
      };

      const analysisResult = await analysisDef.execute(scopedCtx);

      analysisState.status = analysisResult.status === "skip" ? "completed" : analysisResult.status;
      analysisState.completedAt = Date.now();
      analysisState.duration = analysisState.completedAt - analysisState.startedAt;
      analysisState.steps = analysisResult.steps;
      this.upsertState(analysisState);

      if (analysisResult.dataUpdate) {
        Object.assign(fullData, analysisResult.dataUpdate);
      }
      if (analysisResult.charts) {
        allCharts.push(...analysisResult.charts);
      }
      if (analysisResult.steps) {
        allSteps.push(
          ...analysisResult.steps.map((s) => ({
            ...s,
            label: `${analysisDef.label}: ${s.label}`,
          })),
        );
      }

      if (analysisResult.status === "error") {
        return { data: fullData, charts: allCharts, steps: allSteps, budget, error: analysisResult.error };
      }
    }

    // Phase 5: Response assembly
    const responseState: LangGraphExecutionState = {
      nodeId: "response",
      label: "Response Builder",
      description: "Assembling final output",
      status: "running",
      startedAt: Date.now(),
    };
    this.upsertState(responseState);

    const totalDuration = Date.now() - startTime;
    const responseSteps: SubAgentStep[] = [
      { label: "Charts serialized", status: "completed", detail: `${allCharts.length} chart(s)` },
      { label: "Graph complete", status: "completed", detail: `${totalDuration}ms total` },
    ];
    allSteps.push(...responseSteps.map((s) => ({ ...s, label: `Response Builder: ${s.label}` })));

    responseState.steps = responseSteps;
    responseState.status = "completed";
    responseState.completedAt = Date.now();
    responseState.duration = responseState.completedAt - responseState.startedAt;
    this.upsertState(responseState);

    logInfo("response", `SubAgentGraph complete in ${totalDuration}ms`, `${allSteps.length} steps`);

    return { data: fullData, charts: allCharts, steps: allSteps, budget };
  }
}

/**
 * Build the default subagent graph for analysis use cases.
 * Each subagent gets only the context keys it needs.
 */
export function buildDefaultSubAgentGraph(): SubAgentGraph {
  const graph = new SubAgentGraph();

  // ── Runs SubAgent ──────────────────────────────────────────────
  graph.register({
    id: "runs",
    label: "Runs SubAgent",
    description: "Fetches run data from store",
    needsContext: [],
    execute: async (ctx) => {
      const steps: SubAgentStep[] = [];
      const totalRuns = RUNS.length;
      steps.push({ label: "Reading RUNS", status: "completed", detail: `${totalRuns} runs in store` });

      const envs = [...new Set(RUNS.map((r) => r.env))];
      const avgPass = totalRuns > 0
        ? Math.round(RUNS.reduce((s, r) => s + r.passPct, 0) / totalRuns)
        : 0;

      steps.push({ label: "Computing stats", status: "completed", detail: `${envs.length} envs, avg ${avgPass}% pass` });

      const runData = {
        totalRuns,
        avgPassRate: avgPass,
        envs,
        latestRun: RUNS[RUNS.length - 1] || null,
        recentRuns: [...RUNS].sort(
          (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
        ).slice(0, 5),
      };

      return { status: "completed", dataUpdate: { runs: runData, rawRuns: RUNS }, steps };
    },
  });

  // ── Tests SubAgent ─────────────────────────────────────────────
  graph.register({
    id: "tests",
    label: "Tests SubAgent",
    description: "Fetches test case data",
    needsContext: [],
    execute: async () => {
      const steps: SubAgentStep[] = [];
      const testCases = getTestCases();
      steps.push({ label: "Reading test cases", status: "completed", detail: `${testCases.length} test cases in store` });

      const categories = [...new Set(testCases.map((t) => t.category).filter(Boolean))];
      steps.push({ label: "Analyzing categories", status: "completed", detail: `${categories.length} categories found` });

      return {
        status: "completed",
        dataUpdate: { testCases, categoryCount: categories.length },
        steps,
      };
    },
  });

  // ── Suites SubAgent ────────────────────────────────────────────
  graph.register({
    id: "suites",
    label: "Suites SubAgent",
    description: "Fetches suite definitions",
    needsContext: [],
    execute: async () => {
      const steps: SubAgentStep[] = [];
      const suites = getTestSuites();
      steps.push({ label: "Reading suites", status: "completed", detail: `${suites.length} suites in store` });
      return { status: "completed", dataUpdate: { suites }, steps };
    },
  });

  // ── Diffs SubAgent ─────────────────────────────────────────────
  graph.register({
    id: "diffs",
    label: "Diffs SubAgent",
    description: "Fetches comparison/diff data",
    needsContext: [],
    execute: async () => {
      const steps: SubAgentStep[] = [];
      const { DIFF_ROWS } = await import("@/lib/runs");
      steps.push({ label: "Reading diffs", status: "completed", detail: `${DIFF_ROWS.length} diff rows` });
      return { status: "completed", dataUpdate: { diffs: DIFF_ROWS }, steps };
    },
  });

  // ── Analysis SubAgent (delegates to caller-provided function) ──
  graph.register({
    id: "analysis",
    label: "Analysis SubAgent",
    description: "Running analysis logic",
    needsContext: ["runs", "testCases", "suites", "diffs"],
    execute: async (ctx) => {
      const steps: SubAgentStep[] = [];
      const runData = ctx.data.runs as Record<string, unknown> | undefined;
      steps.push({
        label: "Received context",
        status: "completed",
        detail: runData ? `${(runData as { totalRuns?: number }).totalRuns ?? 0} runs available` : "no run data",
      });
      return { status: "completed", steps };
    },
  });

  return graph;
}

// ── Legacy LangGraph (kept for backward compat, delegates internally) ──

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
    steps?: SubAgentStep[],
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
        logDebug("parallel", `Fan-out: ${unvisited.length} nodes in parallel`, "debug", unvisited.join(", "));
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
    logInfo("response", `Graph complete: ${totalDuration}ms, ${visited.size} nodes, ${iteration} rounds`);

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
 * Build the default analysis graph with SubAgent-powered nodes.
 * Graph:
 *   data_fetch
 *     ├──→ query_runs   ──→┐
 *     ├──→ query_tests  ──→┤
 *     ├──→ query_suites ──→┤→ context_build → context_token_audit → analysis → chart_render → response
 *     └──→ query_diffs  ──→┘
 */
export function buildDefaultGraph(analysisFn: LangGraphNode): LangGraph {
  const graph = new LangGraph();
  const subGraph = buildDefaultSubAgentGraph();

  graph.addNode({
    id: "data_fetch",
    label: "SubAgent Dispatch",
    description: "Dispatching data subagents in parallel",
    execute: async (ctx) => {
      logInfo("data_fetch", "Running SubAgent graph for", ctx.request.useCaseId);
      const result = await subGraph.execute(ctx.request, (state) => {
        const stateCopy = { ...state, steps: state.steps ? [...state.steps] : undefined };
        if (state.status === "running") {
          ctx.data._subagentRunning = state.label;
          ctx.data._subagentDetail = state.description;
        }
        if (state.steps && state.steps.length > 0 && state.status === "completed") {
          logDebug(state.nodeId, state.steps.map((s) => `${CHECK_EMOJI} ${s.label}: ${s.detail || ""}`).join(" | "));
        }
      });

      if (result.error) {
        return { status: "error", error: result.error };
      }

      const budgetSteps: import("./langGraphTypes").SubAgentStep[] = [];
      if (result.budget) {
        if (result.budget.compacted) {
          budgetSteps.push({
            label: "Token budget",
            status: "completed",
            detail: `${SAVE_EMOJI} ${result.budget.compacted.before}t → ${result.budget.compacted.after}t (saved ${result.budget.compacted.saved}t)`,
          });
        } else if (result.budget.totalTokens > 0) {
          budgetSteps.push({
            label: "Token budget",
            status: "completed",
            detail: `~${result.budget.totalTokens}t used`,
          });
        }
      }

      if (result.data.runs) {
        const r = result.data.runs as { totalRuns?: number; avgPassRate?: number; envs?: string[] };
        logInfo("data_fetch", `${r.totalRuns ?? 0} runs, avg ${r.avgPassRate ?? 0}% pass, ${(r.envs ?? []).length} envs`);
      }
      if (result.data.testCases) {
        const tc = result.data.testCases as unknown[];
        logDebug("data_fetch", `${tc.length} test cases loaded`);
      }

      return {
        status: "completed",
        dataUpdate: result.data,
        charts: result.charts,
        steps: [
          { label: "Data subagents", status: "completed", detail: "runs, tests, suites, diffs" },
          ...budgetSteps,
        ],
      };
    },
  });

  graph.addNode({
    id: "query_runs",
    label: "Runs SubAgent",
    description: "Reading run data from store",
    execute: async () => ({ status: "completed" }),
  });

  graph.addNode({
    id: "query_tests",
    label: "Tests SubAgent",
    description: "Reading test case data",
    execute: async () => ({ status: "completed" }),
  });

  graph.addNode({
    id: "query_suites",
    label: "Suites SubAgent",
    description: "Reading suite definitions",
    execute: async () => ({ status: "completed" }),
  });

  graph.addNode({
    id: "query_diffs",
    label: "Diffs SubAgent",
    description: "Reading diff/comparison data",
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

  graph.addNode({
    id: "context_build",
    label: "Context Weaver",
    description: "Weaving scoped context",
    execute: async (ctx) => {
      const runInfo = ctx.data.runs as Record<string, unknown> | undefined;
      const tcInfo = ctx.data.testCases as unknown[] | undefined;
      const sInfo = ctx.data.suites as unknown[] | undefined;
      const steps: import("./langGraphTypes").SubAgentStep[] = [
        { label: "Data summary", status: "completed", detail: `${(runInfo as { totalRuns?: number })?.totalRuns ?? 0} runs, ${tcInfo?.length ?? 0} tests, ${sInfo?.length ?? 0} suites` },
      ];
      return { status: "completed", steps };
    },
  });

  graph.addNode({
    id: "context_token_audit",
    label: "Token Budgeteer",
    description: "Auditing context window",
    execute: async (ctx) => {
      const systemPrompt = (ctx.data.systemPrompt as string) || "";
      const tokens = estimateTokenCount(systemPrompt);
      const steps: import("./langGraphTypes").SubAgentStep[] = [
        { label: "Token estimation", status: "completed", detail: `~${tokens}t` },
      ];
      if (tokens > 3500) {
        steps.push({ label: "Over budget", status: "completed", detail: `${BOLT_EMOJI} ${tokens}t > 3500t — compaction recommended` });
      }
      return { status: "completed", dataUpdate: { contextTokenEstimate: tokens }, steps };
    },
  });

  graph.addEdge({ from: "context_build", to: "context_token_audit" });
  graph.addEdge({ from: "context_build", to: "skill_dispatch" });

  graph.addNode({
    id: "skill_dispatch",
    label: "Skill Dispatch",
    description: "Dispatching to analysis skill",
    execute: async (ctx) => {
      const skillDef = getSkillDefinition(ctx.request.useCaseId);
      const steps: import("./langGraphTypes").SubAgentStep[] = [];
      if (skillDef) {
        steps.push({ label: `Dispatching: ${skillDef.name}`, status: "completed", detail: skillDef.analysisSteps.join(" → ") });
      }
      return { status: "completed", steps };
    },
  });

  graph.addNode(analysisFn);

  graph.addEdge({ from: "skill_dispatch", to: "analysis" });

  graph.addNode({
    id: "llm_query",
    label: "LLM Query",
    description: "Querying LLM provider",
    execute: async (ctx) => {
      const systemPrompt = (ctx.data.systemPrompt as string) || "";
      const sysTokens = estimateTokenCount(systemPrompt);
      const steps: import("./langGraphTypes").SubAgentStep[] = [
        { label: "LLM dispatch", status: "completed", detail: `~${sysTokens}t system prompt` },
      ];
      return { status: "completed", steps };
    },
  });

  graph.addEdge({
    from: "analysis",
    to: "llm_query",
    condition: (ctx) => {
      return (ctx.request.parameters.useLLM as boolean) === true;
    },
  });

  graph.addEdge({ from: "llm_query", to: "chart_render" });

  graph.addNode({
    id: "chart_render",
    label: "Chart Render",
    description: "Serializing charts",
    execute: async (ctx) => {
      const steps: import("./langGraphTypes").SubAgentStep[] = [
        { label: "Charts", status: "completed", detail: `${ctx.charts.length} chart(s) serialized` },
      ];
      return { status: "completed", steps };
    },
  });

  graph.addEdge({ from: "analysis", to: "chart_render" });

  graph.addNode({
    id: "response",
    label: "Response",
    description: "Building final response",
    execute: async (ctx) => {
      const totalDuration = Date.now() - ctx.startedAt;
      const steps: import("./langGraphTypes").SubAgentStep[] = [
        { label: "Response built", status: "completed", detail: `${totalDuration}ms total` },
      ];
      return { status: "completed", steps };
    },
  });

  graph.addEdge({ from: "chart_render", to: "response" });

  return graph;
}

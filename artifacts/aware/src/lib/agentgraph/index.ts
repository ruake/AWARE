import { GraphContext, GraphNode } from "./types";

export class AgentGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, string[]> = new Map();

  addNode(node: GraphNode): this {
    this.nodes.set(node.id, node);
    if (!this.edges.has(node.id)) {
      this.edges.set(node.id, []);
    }
    return this;
  }

  addEdge(from: string, to: string): this {
    if (!this.edges.has(from)) {
      this.edges.set(from, []);
    }
    this.edges.get(from)!.push(to);
    return this;
  }

  async execute(
    startNodeId: string,
    initialCtx: Partial<GraphContext>,
  ): Promise<GraphContext> {
    let ctx: GraphContext = {
      query: "",
      intent: "unknown",
      runs: [],
      testResults: [],
      testCases: [],
      suites: [],
      schedulerStatus: null,
      analysis: {},
      chartConfig: null,
      textResponse: "",
      reasoning: null,
      recommendations: null,
      error: null,
      ...initialCtx,
    };

    const visited = new Set<string>();
    const queue: string[] = [startNodeId];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (!node) {
        ctx.error = `Node "${nodeId}" not found`;
        break;
      }

      try {
        ctx = await node.execute(ctx);
      } catch (e) {
        ctx.error = `Node "${nodeId}" failed: ${(e as Error).message}`;
        break;
      }

      if (ctx.error) break;

      const nextNodes = this.edges.get(nodeId) || [];
      for (const nextId of nextNodes) {
        if (!visited.has(nextId)) {
          queue.push(nextId);
        }
      }
    }

    return ctx;
  }
}

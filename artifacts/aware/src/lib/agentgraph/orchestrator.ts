import { GraphNode, GraphContext, Intent } from "./types";
import { classifyIntent as classifyWithChromeAi } from "./chrome-ai";

function classifyIntentKeyword(query: string): Intent {
  const q = query.toLowerCase();
  if (q.includes("flak") || q.includes("intermittent"))
    return "flakiness";
  if (q.includes("fail") || q.includes("error") || q.includes("broken"))
    return "failures";
  if (q.includes("env") || q.includes("compare") || q.includes("environment") || q.includes("staging") || q.includes("prod"))
    return "environment_compare";
  if (q.includes("anomal") || q.includes("unusual") || q.includes("outlier") || q.includes("strange") || q.includes("weird"))
    return "anomalies";
  if (q.includes("health") || q.includes("summar") || q.includes("pipeline") || q.includes("overview") || q.includes("status"))
    return "pipeline_health";
  if (q.includes("trend") || q.includes("history") || q.includes("over time") || q.includes("day") || q.includes("week"))
    return "trend";
  if (q.includes("test") && (q.includes("detail") || q.includes("info") || q.includes("about") || q.includes("what is")))
    return "test_detail";
  return "unknown";
}

export const OrchestratorNode: GraphNode = {
  id: "orchestrator",
  execute: async (ctx) => {
    let intent: Intent = "unknown";

    const aiIntent = await classifyWithChromeAi(ctx.query);
    if (aiIntent) {
      intent = aiIntent as Intent;
    } else {
      intent = classifyIntentKeyword(ctx.query);
    }

    return { ...ctx, intent };
  },
};

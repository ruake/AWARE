---
name: Chrome AI tool-calling architecture
description: Chrome AI (Gemini Nano) cannot do LLM tool selection — use keyword routing. Only call Chrome AI for compact synthesis after tools run.
---

# Chrome AI (Gemini Nano) — Architecture Constraints

## Hard limits
- **Context window**: ~1024 tokens in Replit's preview browser
- **Our system prompt alone**: ~200 tokens (buildSystemPrompt)
- **Tool descriptions (5 tools)**: ~200 tokens
- **History (2+ turns)**: easily 400+ tokens
- **Result**: context saturated before user query. Model returns 4 chars or hangs indefinitely.

## supportsToolCalling = false
`ChromeProvider` sets `supportsToolCalling = false`. The graph agent checks this flag in `plan_and_route` and uses **keyword routing** instead of calling the LLM for tool selection.

```typescript
if (ctx.provider.supportsToolCalling === false) {
  const route = routeByKeyword(ctx.query); // instant, deterministic
  if (route) { ctx.pendingToolCalls.push(...); }
  return; // no LLM call
}
```

**Why:** Prompting Gemini Nano to output JSON tool-call format reliably requires extensive instructions (>500 tokens) — which already blows the context. Keyword routing is faster, deterministic, and costs zero tokens.

## Synthesis prompt: ~150 tokens max
`ChromeProvider.stream()` detects synthesis mode (messages contain `role: "tool"`) and builds a compact prompt:
```
You are a concise CDN test analytics assistant. Use numbers from the data.
Data (tool_name): {first 600 chars of result}
Question: {user query}
Answer:
```

**Why:** Chrome AI only needs to format numbers it already has. The LLM adds the narrative wrapper; we provide the data.

## Never use initialPrompts for history
`initialPrompts` requires alternating user/assistant — assistant-first history causes the session to hang or throw. Always use `systemPrompt` (single string, no format constraints).

## Always emit { done: true } in all code paths
Every exit path (abort, error, stream end) must call `onDelta({ done: true })`. Failure leaves the graph Promise unresolved forever.

## Streaming: cumulative text, not deltas
`promptStreaming` yields the full text accumulated so far on every chunk. Track `lastEmittedLen` and emit `text.slice(lastLen)` as the delta. Never use `+=`.

## Stream timeout: 20s (not 60s)
Chrome AI synthesis on a small prompt completes in 2-5s. A 60s timeout makes failures feel broken. 20s is the cap.

## Related files
- `providers.ts` → `ChromeProvider` + `routeByKeyword()`
- `graphAgent.ts` → `planAndRouteNode()` checks `supportsToolCalling`
- `types.ts` → `IProvider.supportsToolCalling?: boolean`

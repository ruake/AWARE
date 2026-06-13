---
name: AWARE AI Copilot
description: Architecture of the rearchitected Copilot — lib/copilot/ library, streaming agent, virtualized feed
---

## Architecture (post-rearchitecture)

### Core library — `src/lib/copilot/`
| File | Purpose |
|------|---------|
| `types.ts` | `Message`, `ToolCall`, `ToolResult`, `ChartData`, `AgentEvent`, `IProvider`, `ProviderType/Status` |
| `tools.ts` | 5 tool definitions + data implementations: `query_runs`, `get_flaky_tests`, `compare_environments`, `get_promotion_status`, `get_failure_breakdown` |
| `providers.ts` | `WebLLMProvider` (primary, WebGPU), `OpenAIProvider`, `ChromeProvider`; `createProvider(type)` factory |
| `agent.ts` | `runAgent(opts)` — callback-based agentic loop; fires `AgentEvent` types: `delta | tool_start | tool_done | error | done` |
| `context.ts` | `buildSystemPrompt()` — compact 500-token prompt with live data snapshot |
| `storage.ts` | localStorage v4 keys; `loadSession/saveSession/clearSession`, `loadOpenAIConfig/saveOpenAIConfig`, `loadProviderType/saveProviderType` |

### Component layer — `src/components/copilot/`
- `MessageFeed.tsx` — TanStack Virtual v3 virtualized list; auto-scrolls when at bottom; `data-index` + `ref={virtualizer.measureElement}` for dynamic heights
- `Bubble.tsx` — `UserBubble` + `AssistantBubble` (streaming cursor via CSS blink, react-markdown)
- `ToolCallCard.tsx` — tool name, spinner → result; expands raw data + ChartCard
- `ChartCard.tsx` — recharts `line | column | bar | pie` driven by `ChartData` from tool results
- `AgentTrace.tsx` — collapsible execution trace showing provider + tool timing
- `QuickActions.tsx` — 7 pre-built analysis messages in left sidebar
- `InputBar.tsx` — auto-resize textarea; Enter to send / Shift+Enter for newline
- `ProviderSelector.tsx` — dropdown with status dots + WebLLM download progress bar

### Page — `src/pages/Copilot.tsx`
- Providers created once via `useMemo` (singletons — WebLLM engine persists between calls)
- `handleEvent` is `useCallback` with no deps (uses functional state updates only)
- `handleSend` captures `messages` BEFORE state update → passes as `history` to `runAgent`
- Stop button calls `abortRef.current.abort()` then fires a synthetic `done` event
- `@keyframes blink` + `@keyframes spin` injected via `<style>` tag in the page render

### Key types
```typescript
type AgentEvent =
  | { type: "delta"; content: string }
  | { type: "tool_start"; toolCall: ToolCall }
  | { type: "tool_done"; toolCall: ToolCall }
  | { type: "done" }
  | { type: "error"; error: string }

type ProviderStatus = "available" | "downloading" | "unavailable"  // no "error" variant
```

### WebLLM
- Model: `Llama-3.2-3B-Instruct-q4f32_1-MLC`
- Download progress wired via `provider.onLoadProgress = (progress, text) => ...` in a `useEffect`
- WebGPU check: `"gpu" in navigator && navigator.gpu.requestAdapter()` — unavailable in sandbox/server envs

**Why:** Old architecture used a regex-intent-map + LangGraph node execution, bypassing the LLM for most queries. New architecture routes everything through real LLM inference with tool calling for accurate live answers.

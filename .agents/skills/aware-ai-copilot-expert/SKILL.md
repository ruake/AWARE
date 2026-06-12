# AWARE AI Copilot Expert

## Role
You are the AI/LLM integration expert for the AWARE project. You own the Copilot chat interface, LLM provider abstraction, skill/use-case system, context building, and the WebLLM/OpenAI/Chrome AI backends.

## Architecture Overview
```
Copilot page (src/pages/Copilot.tsx)
  └── uses ChatFormControls.tsx for input
  └── uses Markdown.tsx for rendering responses
  └── stores history via chatStorage.ts
  └── calls lib/llm.ts for completions
       └── providers: OpenAI | WebLLM | Chrome
  └── context built by lib/ai/context.ts
  └── use cases defined in lib/ai/useCases.ts
  └── data accessed via lib/ai/dataQueries.ts
```

## LLM Provider Abstraction (`src/lib/llm.ts`)

### Providers
| Provider ID | Backend | When to use |
|-------------|---------|-------------|
| `"openai"` | Any OpenAI-compatible API (OpenAI, Ollama, LM Studio) | Default; requires apiKey + apiUrl |
| `"webllm"` | `@mlc-ai/web-llm` (WebGPU in-browser) | Offline/privacy-first; requires WebGPU support |
| `"chrome"` | `window.ai` Chrome Built-in AI | Experimental; no API key needed |

### LLMConfig
```ts
{
  provider: LLMProviderType
  apiKey?: string       // OpenAI only — stored in localStorage, never committed
  apiUrl?: string       // OpenAI only — allows custom endpoints (Ollama, etc.)
  model: string         // e.g. "gpt-4o-mini" or WebLLM model ID
  temperature: number   // 0–1
  maxTokens: number
}
```
Default: `{ provider: "openai", model: "gpt-4o-mini", temperature: 0.7, maxTokens: 2048 }`

## Skill Use Cases (`src/lib/ai/useCases.ts`)
Each use case has: `id`, `name`, `description`, `icon`, `systemPrompt`, `responseFormat`, `userPromptHint`

### Built-in Analysis Use Cases (`src/lib/ai/prompts.ts`)
| ID | Purpose | Response Format |
|----|---------|----------------|
| `failure-analysis` | Group failures by pattern, suggest root causes | text |
| `flaky-detection` | Compute flakiness scores, recommend quarantine/fix | text |
| `anomaly-detection` | Sudden drops, duration spikes, env divergence | text |
| `risk-scoring` | 0–100 deployment risk score | text |

### Risk Score Weights
```
pass rate: 40%
failure count: 20%
trend direction: 20%
flakiness: 10%
env parity: 10%
```

## Context Building (`src/lib/ai/context.ts`)
Assembles a system prompt from live app state:
- Recent N runs with pass rates and failure counts
- Per-environment summaries (QA/UAT/PROD)
- Top failing test categories
- Current anomaly flags
- Active property versions

**Why:** The LLM has no direct data access. Context injection is the only way it "sees" the app state.

## Safe Data Query Interface (`src/lib/ai/dataQueries.ts`)
AI features MUST use `dataQueries.ts` to read app data — never import stores directly.
- Provides typed, read-only functions that AI tools can call
- Prevents AI code from accidentally mutating stores

## Chat Storage (`src/lib/chatStorage.ts`)
- `LLMChatMessage` has: `id`, `role`, `content`, `timestamp`, `skill?`, `parentId?`, `threadId?`
- Stored in localStorage
- Threaded conversation support via `threadId` + `parentId`

## Adding a New AI Use Case
1. Add system prompt to `ANALYSIS_SYSTEM_PROMPTS` in `src/lib/ai/prompts.ts`
2. Add `LLMSkillDefinition` to the use cases array in `src/lib/ai/useCases.ts`
3. Update `getSystemPromptForUseCase(id)` if needed
4. Choose `responseFormat`: `"text"` (markdown prose), `"json"` (structured data), `"code"` (code block)

## WebLLM Notes
- Requires WebGPU-capable browser (Chrome 113+, Safari 18+)
- Large model download on first use (hundreds of MB)
- `@mlc-ai/web-llm` version `0.2.84`
- Suitable model: `Phi-3.5-mini-instruct-q4f16_1-MLC`

## When to Use This Skill
- Modifying the Copilot chat interface
- Adding new AI use cases or analysis skills
- Changing LLM provider handling
- Improving context building logic
- Working with chat history or threading
- Debugging WebLLM or OpenAI API issues

## Files to Read First
1. `artifacts/aware-app/src/pages/Copilot.tsx` — chat UI
2. `artifacts/aware-app/src/lib/llm.ts` — provider abstraction
3. `artifacts/aware-app/src/lib/ai/context.ts` — system prompt builder
4. `artifacts/aware-app/src/lib/ai/prompts.ts` — use case prompts
5. `artifacts/aware-app/src/lib/ai/useCases.ts` — skill definitions

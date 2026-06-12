---
name: AWARE AI Copilot
description: LLM provider architecture, skill use-cases, context building, data query interface, and WebLLM/OpenAI/Chrome provider details.
---

# AWARE AI Copilot

## Location
`src/lib/ai/` — main AI logic  
`src/lib/llm.ts` — LLM provider abstraction  
`src/pages/Copilot.tsx` — chat UI

## LLM Providers
Three providers are supported via `LLMProviderType`:

| Provider | ID | Notes |
|----------|----|-------|
| OpenAI-compatible | `"openai"` | External API; requires `apiKey` + `apiUrl` in config |
| WebLLM | `"webllm"` | Local in-browser inference via WebGPU (@mlc-ai/web-llm) |
| Chrome Built-in AI | `"chrome"` | Uses `window.ai` (experimental Chrome feature) |

Default config (`DEFAULT_LLM_CONFIG`): `provider: "openai"`, `model: "gpt-4o-mini"`, `temperature: 0.7`, `maxTokens: 2048`

## AI Module Files
| File | Purpose |
|------|---------|
| `ai/index.ts` | Re-exports, entry point |
| `ai/types.ts` | AI-specific type definitions |
| `ai/context.ts` | Builds the full system prompt from current app state |
| `ai/prompts.ts` | `ANALYSIS_SYSTEM_PROMPTS` — system prompts per use-case |
| `ai/useCases.ts` | ~20 skill use-case definitions with icons, hints, response formats |
| `ai/analyzer.ts` | Orchestrates analysis: picks use-case, calls LLM, parses output |
| `ai/dataQueries.ts` | Safe interface for AI to query app data (no direct store access) |

## Skill Use Cases (from `prompts.ts`)
| ID | Description |
|----|-------------|
| `failure-analysis` | Group failures, find patterns, suggest root causes |
| `flaky-detection` | Compute flakiness scores, flag tests >20% |
| `anomaly-detection` | Sudden pass rate drops, duration spikes, env divergence |
| `risk-scoring` | 0–100 risk score; factors: pass rate (40%), failures (20%), trend (20%), flakiness (10%), env parity (10%) |

## Context Building (`context.ts`)
Gathers the entire observable state into a structured prompt:
- Recent runs with pass rates and failure counts
- Per-environment summaries
- Top failing test categories
- Current anomaly flags

**Why:** The LLM has no direct database access — context building is the data injection mechanism. Keep context lean to stay within token limits.

## Chat Storage (`src/lib/chatStorage.ts`)
- Persists conversation history in localStorage
- `LLMChatMessage` includes `threadId`, `parentId`, `skill` for threading

## LLM Config Storage
User-configured LLM settings stored in localStorage under a key in `llm.ts`. API keys should never be committed — users enter them in the Copilot settings panel.

## How to Apply
- When adding a new AI use case, add entry to `ANALYSIS_SYSTEM_PROMPTS` and a matching `LLMSkillDefinition` in `useCases.ts`
- Response format choices: `"text"` | `"json"` | `"code"` — choose based on downstream parsing needs
- `dataQueries.ts` is the only sanctioned way for AI features to read app data

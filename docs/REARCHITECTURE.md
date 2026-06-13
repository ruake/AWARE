# A.W.A.R.E. — Full Rearchitecture Plan

## Overview

This document describes the three major rearchitecture streams:

1. **GitHub Actions → Kubernetes-Inspired Workflow Architecture**
2. **Four-Branch Repository Strategy** (main / tests / data / site)
3. **Copilot → Real Streaming Tool-Calling Agent**

---

## 1. GitHub Actions: Kubernetes-Inspired Architecture

### Why Kubernetes as the mental model?

Kubernetes solved the "how do you run distributed workloads reliably at scale" problem with a set of patterns that translate directly to CI/CD:

| Kubernetes Concept | What it does | AWARE Equivalent |
|---|---|---|
| **Operator** | Manages the full lifecycle of a custom resource | `aware-operator` action — owns an entire test run from pending → done |
| **Controller / Reconciler** | Watches desired state vs actual state, makes them match | `controller.yml` — reads `test-suites.yml` (desired), checks what actually ran (actual), dispatches missing jobs |
| **CronJob** | Schedules periodic Jobs | `controller.yml` runs every 15 min via schedule trigger |
| **Job** | A unit of work that runs to completion | `job-playwright.yml` / `job-pytest.yml` — run once, emit outputs, exit |
| **Pod Template** | A reusable spec for how a Pod runs | `test-runner` composite action — the template for any test execution |
| **ConfigMap** | Declarative configuration separate from code | `config/akamai-config.yml`, `config/environments.yml`, `config/test-suites.yml` |
| **Readiness Probe** | Blocks traffic until a Pod is healthy | `promotion-gate` action — blocks UAT → PROD until ≥ 95% pass rate |
| **PersistentVolume** | Durable storage outside the Pod lifecycle | `data` branch — outlives any individual run |
| **PV Controller** | Single entity that manages writes to a PV | `data-writer` action — the ONLY thing that commits to the data branch |
| **Labels & Selectors** | Metadata tags for filtering/routing | Every job output is labeled: suite, env, tier, network, shard, run-id |
| **Namespace** | Isolation boundary between workloads | Each test suite = its own namespace (separate artifacts, separate status contexts) |

### Current Problems with the Old Architecture

```
scheduler.yml ──calls──► run-tests.yml ──everything mixed in one file──► data branch
                           │
                           ├── validate-config (duplicated)
                           ├── parse-config (inline bash)
                           ├── playwright (hardcoded shards)
                           ├── pytest (hardcoded)
                           ├── report (ad-hoc git commits)
                           └── promotion-gate (bolted on at end)
```

Problems:
- **Monolithic**: One 340-line workflow file does everything
- **Not reusable**: Playwright/pytest logic cannot be called from other workflows
- **Scattered data writes**: Git commits to data branch are done inline in multiple places
- **Promotion gate is not a gate**: It runs as a job but doesn't actually block anything
- **No lifecycle tracking**: There's no concept of a run being "pending" before it starts
- **Scheduler and runner are coupled**: Can't run the scheduler logic without also running tests

### New Architecture

```
controller.yml (CronJob reconciler)
    │
    ├── reads config/test-suites.yml  ← desired state
    ├── reads data/scheduler-status.json  ← actual state
    ├── computes delta: what suites are due?
    │
    ├──calls──► job-playwright.yml (Job template)
    │               │
    │               ├── uses: .github/actions/setup-node   ← shared bootstrap
    │               ├── uses: .github/actions/test-runner  ← pod template
    │               │         (checks out tests branch, runs playwright)
    │               ├── uses: .github/actions/aware-operator ← lifecycle owner
    │               │         (emits pending→running→done status)
    │               ├── uses: .github/actions/promotion-gate ← readiness probe
    │               │         (blocks if UAT and pass rate < 95%)
    │               └── uses: .github/actions/data-writer  ← PV controller
    │                         (ONLY entity that writes to data branch)
    │
    └──calls──► job-pytest.yml (Job template)
                    └── same composite action stack

validate.yml (ConfigMap validation — runs on every push to config/ or tests/)
deploy-site.yml (builds React SPA, pushes to site branch)
sync-data.yml (periodic data branch integrity check)
```

### New Files Created

#### Composite Actions (`.github/actions/`)

```
.github/
  actions/
    aware-operator/
      action.yml    ← Custom Resource Operator
                    Inputs: suite-id, env-label, tier, network, run-id, pass-rate, failures
                    Outputs: run-id, decision (promote|block|skip), promoted
                    Does: emits pending status → annotates run → runs gate → writes final status → writes step summary

    test-runner/
      action.yml    ← Pod Template
                    Inputs: runner-type (playwright|pytest), suite-id, env-label, base-url, network, shard, total-shards, working-dir
                    Outputs: results-path, passed, failed, total, duration-ms
                    Does: checkout tests branch, install deps, run tests (sharded if playwright), upload artifacts

    data-writer/
      action.yml    ← PersistentVolume Controller
                    Inputs: files (space-separated local paths), dest-paths (space-separated names on branch), commit-message, branch (default: data)
                    Outputs: committed (true|false), sha
                    Does: fetch target branch, copy files into it, commit, push with retry
                    RULE: This is the ONLY action that may commit to the data branch

    promotion-gate/
      action.yml    ← Readiness Probe
                    Inputs: pass-rate (0-100), tier (QA|UAT|PROD), min-pass-rate (default: 95)
                    Outputs: decision (promote|block|skip), reason, gate-triggered
                    Does: reads min-pass-rate from akamai-config.yml if not provided, evaluates, emits decision

    setup-node/
      action.yml    ← Reusable Bootstrap
                    Inputs: node-version (default: 22), working-dir (default: .), install-flags
                    Does: pnpm/action-setup, actions/setup-node, pnpm install --frozen-lockfile
```

#### Workflow Files (`.github/workflows/`)

| New File | Replaces | Role |
|---|---|---|
| `controller.yml` | `scheduler.yml` + run dispatching in `run-tests.yml` | CronJob reconciler |
| `job-playwright.yml` | playwright jobs in `run-tests.yml` | Pure Playwright job template |
| `job-pytest.yml` | pytest jobs in `run-tests.yml` | Pure pytest job template |
| `deploy-site.yml` | `deploy.yml` | Build + push to `site` branch |
| `validate.yml` | `validate-config.yml` | ConfigMap validation gate |
| `sync-data.yml` | `sync-data-branches.yml` | Data branch integrity |

Old files deleted:
- `run-tests.yml` (replaced by controller + job-playwright + job-pytest)
- `scheduler.yml` (merged into controller.yml)
- `deploy.yml` (replaced by deploy-site.yml)
- `validate-config.yml` (replaced by validate.yml)
- `sync-data-branches.yml` (replaced by sync-data.yml)

### How a Test Run Flows (New)

```
1. controller.yml fires (cron: every 15min)
   ↓
2. Controller reads test-suites.yml (desired state) and scheduler-status.json (actual state)
   ↓
3. Controller computes: suite_regression_uat is due (cron matches), hasn't run in 6h
   ↓
4. Controller dispatches job-playwright.yml via workflow_call with labeled inputs:
   suite=suite_regression_uat, env=UAT/Staging, tier=UAT, network=staging
   ↓
5. job-playwright.yml runs:
   a. setup-node action → bootstraps Node + pnpm
   b. test-runner action → checks out tests branch, runs playwright (4 shards in parallel)
   c. Merges shard results
   d. aware-operator action → emits lifecycle events, runs promotion-gate
   e. data-writer action → appends run JSON to data branch
   ↓
6. If tier=UAT and pass-rate ≥ 95%:
   promotion-gate outputs decision=promote
   aware-operator sets commit status to "Gate: PROMOTE ✅"
   
   If pass-rate < 95%:
   promotion-gate outputs decision=block
   aware-operator sets commit status to "Gate: BLOCKED 🚫"
```

---

## 2. Four-Branch Repository Strategy

### Branch Responsibilities

```
┌─────────────────────────────────────────────────────────┐
│  main                                                   │
│  ─────────────────────────────────────────────────────  │
│  • React app source (artifacts/aware-app/src/)          │
│  • GitHub Actions workflows (.github/)                  │
│  • Package configs (package.json, pnpm-workspace.yaml)  │
│  • TypeScript source (lib/, scripts/)                   │
│  • NOTHING ELSE — no built files, no test specs,        │
│    no data JSON committed here                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  tests                                                  │
│  ─────────────────────────────────────────────────────  │
│  • Playwright test specs (e2e/**/*.spec.ts)             │
│  • pytest test files (tests/**/*.py)                    │
│  • Test config YAMLs (config/akamai-config.yml,         │
│    config/environments.yml, config/test-suites.yml)     │
│  • Playwright config (playwright.config.ts)             │
│  • pytest config (pyproject.toml, conftest.py)          │
│                                                         │
│  Checked out by: test-runner action during CI runs      │
│  Updated by: engineers writing/changing tests           │
│  Purpose: test specs and config can be updated without  │
│  touching app code or triggering a site redeploy        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  data (orphan branch)                                   │
│  ─────────────────────────────────────────────────────  │
│  • runs.json        — all test run records              │
│  • test-results/    — per-run test result JSON          │
│  • scheduler-status.json — controller state             │
│  • promotions.json  — promotion gate decisions          │
│                                                         │
│  Written by: data-writer action ONLY                    │
│  Read by: React app (fetches via raw.githubusercontent) │
│  Purpose: live data store that outlives any single run  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  site (orphan branch — like gh-pages)                   │
│  ─────────────────────────────────────────────────────  │
│  • Built React SPA (index.html, assets/)                │
│  • 404.html (SPA fallback)                              │
│  • _headers (Cloudflare/GitHub Pages headers)           │
│  • NOTHING ELSE — pure build artifact                   │
│                                                         │
│  Written by: deploy-site.yml ONLY                       │
│  Read by: GitHub Pages / CDN                            │
│  Purpose: clean separation between source and artifact  │
└─────────────────────────────────────────────────────────┘
```

### Why This Matters

**Current problem**: Test specs, data, and built artifacts all live alongside source code on `main`. This means:
- Changing a test triggers a full app redeploy
- Data commits pollute the git history of source code
- The "deployed site" is the same branch as the code

**New model**: Each branch has a single, clear owner and purpose. Like Kubernetes namespaces, each branch is an isolation boundary. The controller only reads from `tests` and `config` — it never writes there. The data-writer only writes to `data`. The deploy job only writes to `site`.

---

## 3. Copilot: Real Streaming Tool-Calling Agent

### Current Problems

The existing Copilot is built on four fragile foundations:

1. **Fake LangGraph**: A custom graph executor that simulates LangGraph. Nodes execute sequentially with no real branching. The "parallel execution" is faked. The graph is rebuilt on every request.

2. **Regex intent matching**: User messages are matched against hardcoded regex patterns to route to "skills". This means "why did the test fail?" accidentally triggers `failure-analysis`, which may not be what the user asked.

3. **Google Charts in Markdown strings**: The LLM is instructed to output valid JSON inside `\`\`\`chart` fenced code blocks. This is parsed at render time. Any malformed JSON silently drops the chart. The LLM frequently gets the format wrong.

4. **No real streaming**: The entire response arrives at once after the LangGraph execution completes. There's no token-by-token streaming.

5. **Monolithic component**: `Copilot.tsx` is 640 lines containing all state, all handlers, and all layout. `MessageList.tsx` passes 12 props down to `ChatMessage.tsx`. The component tree is deeply coupled.

### New Architecture: Three Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: Provider (how tokens arrive)                         │
│                                                                 │
│  IProvider interface: stream(messages, tools, signal, onDelta)  │
│  ─────────────────────────────────────────────────────────────  │
│  WebLLMProvider   — PRIMARY                                     │
│    Llama-3.2-3B-Instruct-q4f32_1-MLC running in browser        │
│    via WebGPU (@mlc-ai/web-llm)                                 │
│    Supports: tool calling (function calling spec),              │
│              streaming (async iterator), context 4096 tokens    │
│    No API key needed. Downloads model once, caches in browser.  │
│                                                                 │
│  ChromeProvider   — SECONDARY                                   │
│    Gemini Nano via window.LanguageModel (Chrome 148+)           │
│    Supports: streaming (ReadableStream), no tool calling        │
│    Fallback: tools are described in system prompt as JSON       │
│    No API key needed. Model runs on-device.                     │
│                                                                 │
│  OpenAIProvider   — TERTIARY (user supplies key)                │
│    Any OpenAI-compatible endpoint (GPT-4o-mini default)         │
│    Supports: tool calling (full spec), streaming (SSE)          │
│    Full context window (128k tokens)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: Agent (what the model decides to do)                 │
│                                                                 │
│  agent.ts — Agentic loop                                        │
│  ─────────────────────────────────────────────────────────────  │
│  1. Build message history: [system, ...history, user]           │
│  2. Truncate to fit context window (provider-aware)             │
│  3. Call provider.stream(messages, tools, signal, onDelta)      │
│  4. Collect streaming deltas:                                   │
│     • text delta → append to current assistant message          │
│     • tool_call delta → record tool name + args                 │
│  5. When stream ends:                                           │
│     a. If tool calls were requested:                            │
│        - emit tool_start event (UI shows spinner card)          │
│        - execute the tool (typed TypeScript function)           │
│        - emit tool_result event (UI shows result card)          │
│        - append tool results to message history                 │
│        - LOOP back to step 3 (up to 5 iterations)              │
│     b. If no tool calls: done                                   │
│                                                                 │
│  tools.ts — 5 typed tools (not 26 "skills")                     │
│  ─────────────────────────────────────────────────────────────  │
│  query_runs           → returns runs array + LineChart data     │
│  get_flaky_tests      → returns flaky test list + BarChart      │
│  compare_environments → returns env comparison + ColumnChart    │
│  get_promotion_status → returns gate decisions + PieChart       │
│  get_failure_breakdown→ returns category breakdown + BarChart   │
│                                                                 │
│  Each tool returns: { data: typed, chartData?: ChartData }      │
│  ChartData is a structured object, NOT a string of JSON         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: Render Pipeline (how messages appear)                │
│                                                                 │
│  MessageFeed.tsx — TanStack Virtual list                        │
│  ─────────────────────────────────────────────────────────────  │
│  Uses @tanstack/react-virtual (already in deps)                 │
│  Renders only visible messages → handles 10,000+ messages with  │
│  zero performance regression                                    │
│  Auto-scroll: tracks user scroll position, only auto-scrolls   │
│  when user was already at the bottom                            │
│                                                                 │
│  Bubble.tsx — Message rendering                                 │
│  ─────────────────────────────────────────────────────────────  │
│  UserBubble: plain text, right-aligned                          │
│  AssistantBubble: streaming markdown (tokens appear live)       │
│    Uses a ref-based buffer: each onDelta appends to ref,        │
│    requestAnimationFrame batches DOM updates                    │
│    react-markdown renders final content                         │
│                                                                 │
│  ToolCallCard.tsx — Tool invocation display                     │
│  ─────────────────────────────────────────────────────────────  │
│  Pending:  "⟳ Querying last 10 runs…"                          │
│  Running:  animated spinner with tool name                      │
│  Done:     collapsible card showing tool name + key result      │
│                                                                 │
│  ChartCard.tsx — Data visualization                             │
│  ─────────────────────────────────────────────────────────────  │
│  Driven by ChartData from tool results (NOT LLM-generated JSON) │
│  Uses recharts (already in deps)                                │
│  Types: LineChart, BarChart, ColumnChart (bar horizontal),      │
│         PieChart (donut)                                        │
│  No more Google Charts — recharts is fully typed                │
│                                                                 │
│  AgentTrace.tsx — Execution trace (replaces ThinkingStepFeed)  │
│  ─────────────────────────────────────────────────────────────  │
│  Shows: provider → tool calls → token count → duration          │
│  Collapsible: click to expand/collapse                          │
│  Available after response is done (not live during streaming)   │
│                                                                 │
│  QuickActions.tsx — Replaces the 26-item sidebar               │
│  ─────────────────────────────────────────────────────────────  │
│  7 quick action buttons mapped to direct tool calls             │
│  (not intent-matched, not regex-routed — always reliable)       │
│  "Analyze failures" → calls get_failure_breakdown tool directly │
│  "Check flakiness" → calls get_flaky_tests tool directly        │
│  "Compare envs"    → calls compare_environments tool directly   │
│  "Promotion ready?"→ calls get_promotion_status tool directly   │
└─────────────────────────────────────────────────────────────────┘
```

### Message Type System

Each message in the feed is one of:

```typescript
interface Message {
  id: string;                        // stable, used as virtual list key
  role: "user" | "assistant";
  content: string;                   // markdown text
  timestamp: number;
  streaming?: boolean;               // true while tokens are arriving
  toolCalls?: ToolCall[];            // tool invocations (if any)
  error?: string;                    // if something went wrong
}

interface ToolCall {
  id: string;                        // stable ID from the model
  name: string;                      // e.g. "query_runs"
  args: Record<string, unknown>;     // parsed tool arguments
  status: "pending" | "running" | "done" | "error";
  result?: {
    data: unknown;                   // typed return value
    chartData?: ChartData;           // if tool has chart output
  };
  startedAt: number;
  completedAt?: number;
}
```

### WebLLM Model Loading

On first use, WebLLM downloads `Llama-3.2-3B-Instruct-q4f32_1-MLC` (~2GB) and caches it in IndexedDB. Subsequent loads use the cache (fast). The ProviderSelector shows a download progress bar during the initial load.

The model supports:
- Tool calling (function calling format)
- Streaming responses
- 4096 token context window

For WebLLM, the context window budget is used carefully:
- System prompt: ~600 tokens (condensed vs the current ~2000 token prompt)
- Chat history: last 10 messages, truncated to fit
- Tool results: injected as `tool` role messages

---

## File Map: What Gets Created / Changed / Deleted

### New Files

```
.github/
  actions/
    aware-operator/action.yml          NEW
    test-runner/action.yml             NEW
    data-writer/action.yml             NEW
    promotion-gate/action.yml          NEW
    setup-node/action.yml              NEW
  workflows/
    controller.yml                     NEW (replaces scheduler.yml)
    job-playwright.yml                 NEW (replaces playwright jobs in run-tests.yml)
    job-pytest.yml                     NEW (replaces pytest jobs in run-tests.yml)
    deploy-site.yml                    NEW (replaces deploy.yml)
    validate.yml                       NEW (replaces validate-config.yml)
    sync-data.yml                      NEW (replaces sync-data-branches.yml)

artifacts/aware-app/src/lib/copilot/
    types.ts                           NEW
    tools.ts                           NEW
    providers.ts                       NEW
    agent.ts                           NEW
    context.ts                         NEW
    storage.ts                         NEW

artifacts/aware-app/src/components/copilot/
    MessageFeed.tsx                    NEW (replaces MessageList.tsx)
    Bubble.tsx                         NEW (UserBubble + AssistantBubble)
    ToolCallCard.tsx                   NEW
    ChartCard.tsx                      NEW
    AgentTrace.tsx                     NEW (replaces ThinkingStepFeed.tsx)
    QuickActions.tsx                   NEW (replaces Sidebar.tsx)
    InputBar.tsx                       REWRITTEN
    ProviderSelector.tsx               REWRITTEN
```

### Deleted Files

```
.github/workflows/run-tests.yml       DELETED (split into controller + job-playwright + job-pytest)
.github/workflows/scheduler.yml       DELETED (merged into controller.yml)
.github/workflows/deploy.yml          DELETED (replaced by deploy-site.yml)
.github/workflows/validate-config.yml DELETED (replaced by validate.yml)
.github/workflows/sync-data-branches.yml DELETED (replaced by sync-data.yml)
```

### Preserved (Unchanged)

```
.github/workflows/code-quality.yml    KEPT (linting — already good)
artifacts/aware-app/src/lib/llm.ts    KEPT (providers use it as a base)
artifacts/aware-app/src/lib/ai/       KEPT (existing analysis logic still available)
artifacts/aware-app/src/lib/runs.ts   KEPT (data layer unchanged)
All other pages, components, lib files KEPT
```

---

## What This Achieves

| Problem | Before | After |
|---|---|---|
| CI workflow complexity | 340-line monolithic run-tests.yml | 5 small, single-purpose workflow files |
| Test spec isolation | Tests on main, trigger app redeployment | Tests on their own `tests` branch |
| Data writes | Scattered ad-hoc git commits in 3 workflows | Single `data-writer` action, one place |
| Promotion gate | Bolted on, doesn't actually block | Composite action called by every UAT job |
| Copilot streaming | No streaming, full response at once | Real token-by-token streaming (WebLLM/OpenAI) |
| Chart rendering | LLM writes JSON strings that break | Tools return typed data, recharts renders it |
| LLM context | 2000+ token system prompt for tiny model | ~600 token compact prompt, history truncated |
| Message list perf | Scroll-all at once, degrades with many messages | TanStack Virtual, handles 10k+ messages |
| Intent routing | Regex pattern matching (brittle) | LLM decides which tools to call (reliable) |

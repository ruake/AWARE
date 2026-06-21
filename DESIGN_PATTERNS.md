# AWARE — Design Patterns Catalogue

> **Status:** Living document — updated by each implementation iteration.
> Root: `artifacts/aware-app/src/`

---

## Pattern Inventory

| # | Pattern | Category | Location | Priority |
|---|---------|----------|----------|----------|
| 1 | [Repository](#1-repository-pattern) | Data | `lib/runs.ts`, `lib/testCases.ts`, `lib/jobs/store.ts` | P0 |
| 2 | [Observer / Typed EventBus](#2-observer--typed-eventbus) | Reactive | `lib/store.ts`, `lib/initData.ts` | P0 |
| 3 | [Strategy](#3-strategy-pattern) | Behaviour | `lib/copilot/providers.ts`, `lib/anomalyDetection.ts` | P0 |
| 4 | [Chain of Responsibility](#4-chain-of-responsibility) | Pipeline | `lib/initData.ts`, `lib/dataFetcher.ts` | P1 |
| 5 | [State Machine](#5-state-machine) | Behaviour | `lib/types.ts` (`JobStatus`, `RunStatus`) | P1 |
| 6 | [Decorator](#6-decorator-pattern) | Infrastructure | `lib/dataFetcher.ts` | P1 |
| 7 | [Command](#7-command-pattern) | UI | `lib/promotions.ts`, `lib/testCases.ts` | P1 |
| 8 | [Builder](#8-builder-pattern) | Construction | `lib/types.ts` (`TestCase`) | P2 |
| 9 | [Composite](#9-composite-pattern) | Structure | `lib/testSuites.ts` (`SuiteNode`) | P2 |
| 10 | [Memoization Cache](#10-memoization--cache) | Performance | `lib/runs.ts` (`computeTestDetailForName`) | P0 |
| 11 | [Facade](#11-facade-pattern) | API Design | `lib/data.ts` | P1 |
| 12 | [Template Method](#12-template-method) | Skeleton | `lib/initData.ts` (`safeLoad`) | P2 |

---

## 1. Repository Pattern

### Problem
`lib/runs.ts`, `lib/testCases.ts`, `lib/jobs/store.ts` each expose raw module-level mutable arrays (`_runs`, `_diffRows`) and imperative compute functions directly. Consumers reach into module internals, making testing and swapping data sources impossible.

### Solution
A typed `IRepository<T>` interface with `findById`, `findMany`, `count`, `subscribe` — each data store implements it. The module-level arrays become **private implementation details**.

### File: `lib/repository.ts` (new)
```typescript
export interface IRepository<T, ID = string> {
  findById(id: ID): T | undefined;
  findMany(predicate?: (item: T) => boolean): T[];
  count(predicate?: (item: T) => boolean): number;
  subscribe(cb: () => void): () => void;
  getSnapshot(): readonly T[];
}
```

### Impact
- `RunRepository`, `TestCaseRepository`, `JobRepository` replace raw array exports.
- `data.ts` facade speaks only repository interfaces.
- Unit tests inject `InMemoryRepository<T>` mock.

---

## 2. Observer / Typed EventBus

### Problem
Each module hand-rolls its own `Set<() => void>` listeners (`_tcListeners`, `_tsListeners`, `_listeners` in initData, `subscribeToJobs` uses `setInterval`). No event types, no payload — just "something changed".

### Solution
A **typed EventBus** with named events and payloads. Consumers subscribe to specific events; the bus handles dispatch, unsubscription, and memory safety.

### File: `lib/eventBus.ts` (new)
```typescript
type EventMap = {
  'runs:loaded': { count: number };
  'runs:updated': void;
  'testcases:updated': void;
  'suites:updated': void;
  'promotions:updated': void;
  'jobs:updated': { jobId: string };
  'data:phase': { phase: 1 | 2 | 3; done: boolean };
  'anomaly:detected': { runId: string; severity: string };
};

export class TypedEventBus { ... }
export const bus = new TypedEventBus();
```

### Impact
- Replaces all hand-rolled pub/sub.
- `subscribeToJobs` drops its `setInterval` polling hack.
- Enables cross-module event tracing in dev mode.

---

## 3. Strategy Pattern

### Problem (a) — Provider Selection
`createProvider()` is a switch statement. Adding a new provider requires editing `providers.ts`. Chrome AI keyword routing is a 500-line RegExp cascade in the same file.

### Solution
**Provider Registry** — providers register themselves; `createProvider` does a map lookup. Keyword routes become `RouteStrategy` objects with a `matches(query): boolean` and `resolve(): ToolCall`.

### Problem (b) — Anomaly Detection Algorithm
`detectAnomalies()` is a single monolithic function using Z-score only. The threshold (`1.5`) is a magic number. New algorithms (IQR, CUSUM) cannot be added without forking.

### Solution
`AnomalyStrategy` interface: `detect(entries: Entry[]): AnomalyResult[]`. Implementations: `ZScoreStrategy`, `IqrStrategy`, `CusumStrategy`. A configurable `AnomalyDetector` selects the strategy.

### Files
- `lib/copilot/routeStrategy.ts` (new)
- `lib/anomaly/strategy.ts` (new)
- `lib/anomaly/zscore.ts`, `iqr.ts`, `cusum.ts` (new)

---

## 4. Chain of Responsibility

### Problem
`initData.ts` chains loaders with `safeLoad()` + `Promise.all`. There are no middleware hooks for retry, progress, or cancellation per-step. `dataFetcher.ts` duplicates timeout logic in every function (`fetchJson`, `fetchBlob`, `fetchImage`).

### Solution
**FetchMiddleware chain**: `timeout → retry → cache → validate → fetch`. Each link is composable. Data loading becomes a **LoadPipeline** with phases that accept middleware.

### File: `lib/fetchPipeline.ts` (new)
```typescript
type Middleware = (req: FetchRequest, next: Handler) => Promise<FetchResponse>;
export function compose(...middleware: Middleware[]): Handler { ... }
export const defaultPipeline = compose(timeoutMiddleware(15000), retryMiddleware(2), cacheMiddleware());
```

---

## 5. State Machine

### Problem
`JobStatus` (`pending → running → completed | failed | cancelled`) and `RunStatus` transitions are unconstrained strings. Any code can set `status: "completed"` without going through `running`. No transition guards, no hooks, no audit.

### Solution
Explicit `StateMachine<S, E>` with transition table. Invalid transitions throw `InvalidTransitionError`. Hooks fire `onEnter`/`onExit` for each state.

### File: `lib/stateMachine.ts` (new)
```typescript
const jobMachine = new StateMachine({
  initial: 'pending',
  transitions: [
    { from: 'pending',  event: 'start',    to: 'running'   },
    { from: 'running',  event: 'complete', to: 'completed' },
    { from: 'running',  event: 'fail',     to: 'failed'    },
    { from: 'running',  event: 'cancel',   to: 'cancelled' },
    { from: 'pending',  event: 'cancel',   to: 'cancelled' },
  ]
});
```

---

## 6. Decorator Pattern

### Problem
`fetchJson`, `fetchBlob`, `fetchImage` each duplicate: `AbortController`, `clearTimeout`, error handling. There is no caching layer — the same JSON is re-fetched on every page visit.

### Solution
**Fetch Decorators** — compose behaviours without modifying the base fetcher:
- `withTimeout(ms)` — AbortController timeout
- `withRetry(n)` — exponential backoff
- `withCache(ttlMs)` — in-memory LRU cache keyed by URL
- `withValidation(guard)` — runtime shape check
- `withLogging()` — dev-mode fetch trace

### File: `lib/fetchDecorators.ts` (new)
```typescript
export const cachedFetch = withCache(60_000)(withRetry(2)(withTimeout(15_000)(baseFetch)));
```

---

## 7. Command Pattern

### Problem
Promotion decisions (`promote` / `block`) and test enable/disable are scattered imperative calls. There is no undo, no audit log visible in the UI, no optimistic update rollback.

### Solution
**Command** objects: `PromoteRunCommand`, `BlockRunCommand`, `EnableTestCommand`, `DisableTestCommand`. A `CommandBus` executes, logs, and optionally reverts them.

### File: `lib/commands/index.ts` (new)
```typescript
export interface Command<T = void> {
  readonly id: string;
  readonly label: string;
  execute(): Promise<T>;
  undo?(): Promise<void>;
}

export class CommandBus {
  execute<T>(cmd: Command<T>): Promise<T>;
  undo(): Promise<void>;
  readonly history: Command[];
}
```

---

## 8. Builder Pattern

### Problem
`TestCase` has 30+ fields. Creating valid test cases requires knowing all defaults. Tests in the codebase construct partial objects and cast them, bypassing validation.

### Solution
`TestCaseBuilder` — fluent API that enforces required fields and provides sensible defaults. `build()` validates and returns a frozen `TestCase`.

### File: `lib/builders/testCase.ts` (new)
```typescript
new TestCaseBuilder()
  .name('WAF Block Test')
  .category('Security')
  .priority('P0')
  .assertion({ type: 'statusCode', expected: '403' })
  .build();
```

---

## 9. Composite Pattern

### Problem
`SuiteNode` (tree of test suites) is a plain object with `children: SuiteNode[]`. There are no traversal operations (find, reduce, map, flatten) — callers write recursive functions ad hoc throughout the codebase.

### Solution
`SuiteTree` class implementing the Composite pattern with built-in traversal: `find`, `flattenTests`, `countAll`, `reduce`, `walk`.

### File: `lib/suiteTree.ts` (new)
```typescript
class SuiteTree {
  static from(nodes: SuiteNode[]): SuiteTree;
  find(predicate: (s: TestSuite) => boolean): SuiteNode | undefined;
  flattenTests(): string[];  // all testIds in subtree
  walk(visitor: (node: SuiteNode) => void): void;
  toDepthFirstArray(): SuiteNode[];
}
```

---

## 10. Memoization / Cache

### Problem
`computeTestDetailForName(name)` iterates all runs × all results on every call — O(n×m). Called from render paths. `computeDiffRows` similarly re-scans all results on every compare page render.

### Solution
**Memoization decorator** + **LRU cache** keyed by `(name, runsFingerprint)`. Cache is invalidated on `runs:updated` event. Result is stable reference-equal until invalidated — enables `React.memo`.

### File: `lib/memo.ts` (new)
```typescript
export function memoize<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  keyFn: (...args: Args) => string,
  cache: LRUCache<string, R>
): (...args: Args) => R;
```

---

## 11. Facade Pattern

### Problem
`lib/data.ts` re-exports ~60 symbols including mutable arrays (`RUNS`, `DIFF_ROWS`, `ENV_SUMMARY`), internal compute functions (`recomputeAll`), and raw stores. Consumers can bypass the facade entirely.

### Solution
Strengthen the facade: **hide** mutable arrays, **hide** `recomputeAll`, **expose only** stable read/subscribe APIs. Add a `DataService` class as the canonical access point for all data operations.

### File: `lib/dataService.ts` (new)
```typescript
export class DataService {
  static readonly instance: DataService;
  getRuns(filter?: RunFilter): Run[];
  getRunById(id: string): Run | undefined;
  subscribeToRuns(cb: () => void): () => void;
  // … all data operations here, nothing else exported
}
```

---

## 12. Template Method

### Problem
`safeLoad` in `initData.ts` is a one-size-fits-all wrapper. It can't add per-loader retry policies, progress events, or phase-specific timeouts. All loaders are treated identically.

### Solution
`DataLoader<T>` abstract class with Template Method hooks: `beforeLoad()`, `doLoad()` (abstract), `afterLoad(result)`, `onError(err)`. Concrete implementations: `RunsLoader`, `SuitesLoader`, etc.

### File: `lib/loaders/base.ts` (new)
```typescript
abstract class DataLoader<T> {
  abstract doLoad(): Promise<T>;
  beforeLoad(): void {}
  afterLoad(result: T): void {}
  onError(err: unknown): void { console.error(err); }
  async load(): Promise<T | undefined> {
    this.beforeLoad();
    try {
      const r = await this.doLoad();
      this.afterLoad(r);
      return r;
    } catch (err) {
      this.onError(err);
    }
  }
}
```

---

## Implementation Iteration Log

| Iter | Team | Pattern(s) | Status |
|------|------|-----------|--------|
| 1 | Alpha | Repository + Facade | ✅ |
| 2 | Beta | Typed EventBus | ✅ |
| 3 | Gamma | Strategy (Providers + Anomaly) | ✅ |
| 4 | Delta | Decorator + Memoization | ✅ |
| 5 | Epsilon | Command + Builder | ✅ |
| 6 | Alpha | State Machine (Jobs + Runs) | ✅ |
| 7 | Beta | Chain of Responsibility (Fetch Pipeline) | ✅ |
| 8 | Gamma | Composite (SuiteTree) | ✅ |
| 9 | Delta | Template Method (DataLoaders) | ✅ |
| 10 | Epsilon | Integration + cross-cutting wiring | ✅ |

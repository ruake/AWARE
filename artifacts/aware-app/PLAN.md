# AWARE — Implementation Plan

## Overview

AWARE is a **local-first, AI-augmented, read-only** test observability dashboard deployed as a static site on GitHub Pages. The browser is the runtime. Dexie/IndexedDB is the database. The GitHub repo is the canonical source of truth. Background sync keeps the cache fresh. A vector RAG pipeline powers the AI copilot.

**No server. No authentication. No in-app editing. Zero LFS risk.**

---

## 1. Architecture

```
GITHUB REPO (source of truth)
  artifacts/aware-app/src/data/*.json    ← seed data, CI-updated
  artifacts/aware-app/src/data/auto-tests.json  ← testCase.sourceFile links
  artifacts/aware-app/public/evidence/   ← screenshots as .png
        │
        │ raw.githubusercontent.com (unauthenticated, read-only)
        ▼
SERVICE WORKER (vite-plugin-pwa)
  network-first for JSON (stale-while-revalidate)
  cache-first for evidence images
        │
        ▼
BACKGROUND SYNC ENGINE
  5 triggers: boot, 5min, visibilitychange, focus, online
  SHA-256 each JSON → compare stored rev → bulkPut Dexie if changed
  BroadcastChannel cross-tab sync
  Generation-batch guard to prevent cross-gen mixing
  never blocks render, never touches view-config tables
        │
        ▼
DEXIE INDEXEDDB (read-only cache + view config)
  ┌─────────────────────┐  ┌───────────────────────┐
  │ CANONICAL (overwrite) │  │ VIEW CONFIG (persist)  │
  │ runs, testResults,   │  │ comparisons,           │
  │ testCases, testSuites│  │ savedFilters,          │
  │ diffRows, promotions │  │ dashboards, bookmarks  │
  │ embeddings (RAG)     │  │ userPreferences        │
  └─────────────────────┘  └───────────────────────┘
        │
        ▼
IN-MEMORY SNAPSHOT (single source of truth for React)
  Atomic swap after sync completes.
  All views read from snapshot — never from Dexie directly.
  build-time JSON seeds snapshot only when Dexie is empty.
        │
        ▼
REACT — 4 views + search overlay
  /           Feed — timeline, charts, bookmarks
  /tests      Tests — dual-pane browser
  /compare    Compare — diff table + saved comparisons
  /copilot    Copilot — unified search + RAG AI
  /settings   Settings (modal overlay)
```

---

## 2. DB Consistency Guarantee

**"Whole application has to be consistent from db prospective all the time."**

The plan enforces 7 invariants to guarantee this:

### Invariant 1: Single Source of Truth

All React components read from a single `snapshots` object — never from Dexie directly.

```typescript
// src/lib/snapshot.ts — the ONLY data source for React

interface AppSnapshot {
  generation: number;                    // monotonic counter, drives re-render
  runs: Run[];
  testResults: TestResult[];
  testCases: TestCase[];
  testSuites: TestSuite[];
  diffRows: DiffRow[];
  promotions: PromotionDecision[];
}

let _snapshot: AppSnapshot = {
  generation: 0,
  runs: [],
  testResults: [],
  testCases: [],
  testSuites: [],
  diffRows: [],
  promotions: [],
};

let _listeners = new Set<() => void>();

export function getSnapshot(): AppSnapshot { return _snapshot; }

export function subscribeToSnapshot(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// Called by sync engine after Dexie transaction commits.
// All arrays are swapped synchronously (same microtask) before notifying React.
export async function refreshSnapshotFromDexie(): Promise<void> {
  const [runs, testResults, testCases, testSuites, diffRows, promotions] = await Promise.all([
    db.runs.toArray(),
    db.testResults.toArray(),
    db.testCases.toArray(),
    db.testSuites.toArray(),
    db.diffRows.toArray(),
    db.promotions.toArray(),
  ]);

  // Synchronous swap — React never sees partial state
  _snapshot = {
    generation: _snapshot.generation + 1,
    runs,
    testResults,
    testCases,
    testSuites,
    diffRows,
    promotions,
  };

  _listeners.forEach(fn => fn());
}

// React hook
export function useAppSnapshot(): AppSnapshot {
  return React.useSyncExternalStore(subscribeToSnapshot, getSnapshot);
}

// In each view:
function FeedView() {
  const snap = useAppSnapshot();
  // snap.runs, snap.testResults, etc. — guaranteed consistent
}
```

**Enforcement**: No component imports `db` directly. A lint rule `no-restricted-imports` blocks `@/lib/db` in `components/` and `views/`.

### Invariant 2: Atomic Snapshot Swap

The sync engine **never notifies React before the snapshot is swapped**:

```typescript
// sync/engine.ts — correct ordering
async function sync() {
  // 1. Fetch + SHA check
  // 2. Dexie transaction (writes canonical tables + syncMeta)
  await db.transaction('rw', [...], async () => { ... });

  // 3. Snapshot swap (reads Dexie, writes _snapshot atomically)
  await refreshSnapshotFromDexie();

  // 4. Notify React (after snapshot is consistent)
  _setStatus('success');
  // Broadcast cross-tab
  bc.postMessage({ type: 'sync-complete', generation: _snapshot.generation });
}
```

### Invariant 3: Generation-Batch Guard

Prevents mixing data from different sync generations (e.g., Service Worker returning stale `runs.json` with fresh `test-results.json`):

```typescript
// sync/engine.ts — generation batch check
const revs = await Promise.all(SYNC_FILES.map(async spec => {
  const text = await fetchWithCache(spec.url);
  return { table: spec.table, sha: await sha256(text), data: JSON.parse(text) };
}));

const batchId = revs.map(r => r.sha).sort().join('|');

// Compare with known-good batch — if any file comes from cache (different generation), skip
const lastBatch = await db.syncMeta.get('lastBatch');
if (lastBatch?.value && revs.some((r, i) => r.sha === lastBatch.value.split('|')[i])) {
  // Mixed generations — skip this sync cycle
  return;
}

// Inside transaction: verify all revs match current fetch
await db.syncMeta.put({ key: 'lastBatch', value: batchId });
```

### Invariant 4: Build-Time JSON Only Seeds Empty Dexie

```typescript
// src/lib/hydration.ts — only runs when Dexie is completely empty
export async function hydrateFromBuildTime(): Promise<void> {
  const hasData = await db.syncMeta.get('runs-rev');
  if (hasData) return;  // Dexie already populated — skip

  // Brand-new browser — seed from build-time JSON
  await db.transaction('rw', db.tables, async () => {
    await db.runs.bulkAdd(runsSeed as Run[]);
    await db.testResults.bulkAdd(testResultsSeed as TestResult[]);
    // ... all tables
  });
  await refreshSnapshotFromDexie();
}
```

### Invariant 5: Cross-Tab Sync via BroadcastChannel

```typescript
// sync/engine.ts — cross-tab consistency
const bc = new BroadcastChannel('aware-sync');

// After successful sync:
bc.postMessage({ type: 'sync-complete', generation: _snapshot.generation });

// On mount, listen for other tabs' syncs:
bc.onmessage = async (event) => {
  if (event.data.type === 'sync-complete') {
    await refreshSnapshotFromDexie();
    // React re-renders via useSyncExternalStore subscription
  }
};
```

### Invariant 6: Version Rollback Protection

```typescript
// src/lib/db.ts — Dexie constructor with rollback safety
export async function openDatabase(): Promise<AwareDB> {
  try {
    await db.open();
  } catch (err: any) {
    if (err.name === 'VersionError' || err.name === 'VersionNotFoundError') {
      // App was rolled back to an older version. Delete DB and recreate.
      await db.delete();
      await db.open();
    } else {
      throw err;
    }
  }
  return db;
}
```

### Invariant 7: Storage Quota Guard

```typescript
// sync/engine.ts — pre-sync quota check
async function checkStorageQuota(): Promise<boolean> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? Number.MAX_SAFE_INTEGER;
    const pct = usage / quota;
    if (pct > 0.95) {
      // Quota exceeded — evict old test results
      const oldResults = await db.testResults
        .orderBy('id')
        .reverse()
        .skip(1000)  // keep newest 1000
        .toArray();
      const idsToDelete = (await db.testResults.toArray())
        .filter(r => !oldResults.find(o => o.id === r.id))
        .map(r => r.id);
      await db.testResults.bulkDelete(idsToDelete);
      await db.embeddings.where('entityType').equals('testResult')
        .filter(e => idsToDelete.includes(e.entityId))
        .delete();
    }
    return pct < 0.9;
  }
  return true;
}
```

---

## 3. Dexie Schema (Final)

```typescript
// src/lib/db.ts

import Dexie, { type EntityTable } from 'dexie';
import type { Run, TestResult, TestCase, TestSuite, DiffRow, PromotionDecision } from './types';

// ── Additional interfaces ──

export interface EmbeddingRecord {
  id: number;
  entityType: 'testCase' | 'testSuite' | 'run' | 'testResult' | 'diffRow';
  entityId: string;
  chunkIndex: number;
  text: string;
  model: string;
  dimensions: number;
  vector: Float32Array;
  entityRev: string;           // SHA of source entity at time of embedding
  createdAt: string;
}

export interface SavedComparison {
  id: string;
  name: string;
  baseRunId: string;
  candRunId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedFilter {
  id: string;
  page: 'feed' | 'tests';
  name: string;
  filter: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'passRateChart' | 'anomalyList' | 'envSummary' | 'recentRegressions' | 'bookmarks';
  title: string;
  query?: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: number;
  entityType: string;
  entityId: string;
  label?: string;
  createdAt: string;
}

// ── Dexie class ──

class AwareDB extends Dexie {
  // Canonical (GitHub mirror, OVERWRITTEN on sync)
  runs!: EntityTable<Run & { _rev: string }, 'id'>;
  testResults!: EntityTable<TestResult & { _rev: string }, 'id'>;
  testCases!: EntityTable<TestCase & { _rev: string }, 'id'>;
  testSuites!: EntityTable<TestSuite & { _rev: string }, 'id'>;
  diffRows!: EntityTable<DiffRow & { _rev: string }, 'id'>;
  promotions!: EntityTable<PromotionDecision & { _rev: string }, 'runId'>;

  // Vector (computed from canonical, rebuilt on data change)
  embeddings!: EntityTable<EmbeddingRecord, number>;
  embeddingMeta!: EntityTable<{ key: string; value: string }, 'key'>;

  // View configuration (user-owned, NEVER touched by sync)
  comparisons!: EntityTable<SavedComparison, 'id'>;
  savedFilters!: EntityTable<SavedFilter, 'id'>;
  dashboards!: EntityTable<Dashboard, 'id'>;
  bookmarks!: EntityTable<Bookmark, number>;

  // Sync metadata
  syncMeta!: EntityTable<{ key: string; value: string }, 'key'>;

  // Preferences
  userPreferences!: EntityTable<{ key: string; value: string }, 'key'>;

  constructor() {
    super('AWARE');
    this.version(1).stores({
      runs: 'id, env, status, started, suite, target, _rev',
      testResults: 'id, runId, status, category, suite, _rev',
      testCases: 'id, status, priority, category, *suiteIds, *tags, _rev',
      testSuites: 'id, parentId, _rev',
      diffRows: 'id, category, state, _rev',
      promotions: 'runId, _rev',

      embeddings: '++id, entityType, entityId, model, entityRev',
      embeddingMeta: 'key',

      comparisons: 'id, createdAt',
      savedFilters: 'id, page, createdAt',
      dashboards: 'id, createdAt',
      bookmarks: '++id, entityType, entityId, createdAt',

      syncMeta: 'key',
      userPreferences: 'key',
    });
  }
}

export const db = new AwareDB();
```

---

## 4. Background Sync Engine

```typescript
// src/lib/sync/engine.ts

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

class SyncEngine {
  private status: SyncStatus = 'idle';
  private lastSyncAt: number = 0;
  private retryCount: number = 0;
  private readonly listeners = new Set<(status: SyncStatus, lastSyncAt: number) => void>();
  private readonly retryDelays = [5000, 15000, 60000, 300000];
  private readonly pollInterval = 5 * 60 * 1000;
  private rebuildQueue: Promise<void> | null = null;
  private bc: BroadcastChannel;

  constructor() {
    this.bc = new BroadcastChannel('aware-sync');
    this.bc.onmessage = (event) => {
      if (event.data.type === 'sync-complete') {
        refreshSnapshotFromDexie();  // cross-tab sync
      }
    };
  }

  start(): void {
    this.sync();
    setInterval(() => this.sync(), this.pollInterval);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.sync(); });
    window.addEventListener('focus', () => this.sync());
    window.addEventListener('online', () => this.sync());
  }

  async sync(): Promise<void> {
    if (this.status === 'syncing') return;
    if (!navigator.onLine) { this._setStatus('offline'); return; }
    if (!(await checkStorageQuota())) { this._setStatus('error'); return; }

    this._setStatus('syncing');
    const startTime = performance.now();

    try {
      // Fetch all files in parallel with SHA
      const fetched = await Promise.allSettled(
        SYNC_FILES.map(async (spec) => {
          const url = `${DATA_URL_BASE}/${spec.file}?_t=${Date.now()}`;
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) throw new Error(`${spec.file}: HTTP ${res.status}`);
          const text = await res.text();
          return { ...spec, sha: await sha256(text), records: JSON.parse(text) };
        }),
      );

      // Generation-batch guard: skip if any file came from a different generation
      const successful = fetched.filter(r => r.status === 'fulfilled').map(r => r.value);
      const batchId = successful.map(r => r.sha).sort().join('|');
      const lastBatch = await db.syncMeta.get('lastBatch');
      if (lastBatch?.value && batchId !== lastBatch.value) {
        // Mixed generations — wait for next cycle
        return;
      }

      // Dexie transaction: only write tables whose SHA changed
      const changedTables: string[] = [];
      await db.transaction('rw', Object.values(db._allTables), async () => {
        for (const { table, sha, records } of successful) {
          const stored = await db.syncMeta.get(`${table}-rev`);
          if (stored?.value === sha) continue;
          await (db[table] as any).clear();
          if (Array.isArray(records) && records.length > 0) {
            await (db[table] as any).bulkPut(
              records.map((r: any) => ({ ...r, _rev: sha }))
            );
          }
          await db.syncMeta.put({ key: `${table}-rev`, value: sha });
          changedTables.push(table);
        }
        await db.syncMeta.put({ key: 'lastBatch', value: batchId });
        await db.syncMeta.put({ key: 'lastSyncAt', value: String(Date.now()) });
      });

      // Atomic snapshot swap (after transaction, before notification)
      await refreshSnapshotFromDexie();

      this.lastSyncAt = Date.now();
      this.retryCount = 0;
      this._setStatus('success');

      // Notify other tabs
      this.bc.postMessage({ type: 'sync-complete', at: this.lastSyncAt });

      // Rebuild vector index if canonical data changed (queued, not fire-and-forget)
      if (changedTables.some(t => t !== 'promotions')) {
        this._queueVectorRebuild();
      }

    } catch (err) {
      this.retryCount++;
      const delay = this.retryDelays[Math.min(this.retryCount, this.retryDelays.length - 1)];
      setTimeout(() => this.sync(), delay);
      this._setStatus('error');
    }
  }

  private async _queueVectorRebuild(): Promise<void> {
    if (this.rebuildQueue) {
      await this.rebuildQueue;  // wait for current rebuild, then re-run
    }
    this.rebuildQueue = rebuildVectorIndex();
    try { await this.rebuildQueue; } finally { this.rebuildQueue = null; }
  }

  forceSync(): Promise<void> { return this.sync(); }
  getStatus(): SyncStatus { return this.status; }
  getLastSyncAt(): number { return this.lastSyncAt; }

  subscribe(fn: (s: SyncStatus, t: number) => void): () => void {
    this.listeners.add(fn);
    fn(this.status, this.lastSyncAt);
    return () => this.listeners.delete(fn);
  }

  private _setStatus(s: SyncStatus) {
    this.status = s;
    this.listeners.forEach(fn => fn(s, this.lastSyncAt));
  }
}
```

### Cross-Tab Timeline

```
Tab A opens app:
  sync → fetches data → writes Dexie → snapshot swap → notifies React
                                                      → bc.postMessage({ type: 'sync-complete' })
                                                                           │
Tab B (already open, showing stale data):                                  │
  bc.onmessage → refreshSnapshotFromDexie() ← reads Dexie (already updated by Tab A)
               → snapshot swap → React re-renders with fresh data
```

Both tabs show identical data within 1ms of each other.

---

## 5. Jump to Test File on GitHub

Every test case has a `scriptPath` field (e.g., `tests/test_geo_matching.py::test_geo_match` or `e2e/login-auth.spec.ts`). Every run/test result has a `suite` field. The app links directly to the source file on GitHub.

### Link Resolution

```typescript
// src/lib/githubLinks.ts

const REPO_BASE = 'https://github.com/ruake/AWARE/blob/main/artifacts/aware-app';
const REPO_RAW_BASE = 'https://raw.githubusercontent.com/ruake/AWARE/main/artifacts/aware-app';

export function testCaseSourceLink(scriptPath: string): string {
  // scriptPath = "tests/test_geo_matching.py::test_geo_match"
  // scriptPath = "e2e/login-auth.spec.ts::login test"
  const [file] = scriptPath.split('::');
  return `${REPO_BASE}/${file}`;
}

export function testResultSpecLink(suite: string): string {
  // suite = "test_geo_matching.py" or "login-auth.spec.ts"
  // Search auto-tests.json for matching scriptPath
  return `${REPO_BASE}/tests/${suite}`;
}

export function testFileRawUrl(scriptPath: string): string {
  const [file] = scriptPath.split('::');
  return `${REPO_RAW_BASE}/${file}`;
}

export function evidenceImageUrl(relativePath: string): string {
  // relativePath = "evidence/run_abc/ss_0.png"
  return `${import.meta.env.BASE_URL}${relativePath}`;
}
```

### TestFileLink Component

```tsx
function TestFileLink({ scriptPath }: { scriptPath: string }) {
  const href = testCaseSourceLink(scriptPath);
  const [file, line] = scriptPath.split('::');
  const fileName = file.split('/').pop();

  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
       style={{ fontSize: 12, color: 'var(--aw-accent)', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontFamily: 'var(--font-mono)' }}>
      <FileCode size={12} />
      {fileName}
    </a>
  );
}
```

### Where Links Appear

| View | Entity | Links To | Component |
|------|--------|----------|-----------|
| Feed — test result | `result.suite` | Spec file on GitHub | `TestFileLink` |
| Tests — detail tab | `tc.scriptPath` | Source file on GitHub | `TestFileLink` |
| Tests — list item | `tc.scriptPath` | Source file on GitHub | `TestFileLink` |
| Compare — diff row | `row.name` (matched to test case) | Source file | `TestFileLink` |
| Copilot — source citation | Cited test case | Source file | `TestFileLink` |

---

## 6. Search Feature

Search is integrated into the Copilot view and available globally via Cmd+K.

### Search Architecture

```
User query
    │
    ├── Intent classifier (runs synchronously, zero deps)
    │   ├── Exact ID match (ad_005, run_abc, pw_003) → direct entity lookup
    │   ├── Aggregation query ("count", "how many", "most") → Dexie query
    │   ├── Filter query ("failures from last week") → Dexie where clause
    │   └── Open-ended ("what's flaky?", "explain") → vector search + LLM
    │
    ├── Fuse.js fallback (always available, no download)
    │   Index built from in-memory snapshot at boot (67 test cases, 12 runs)
    │   Searches: name, description, category, suite, scriptPath
    │
    ├── Vector search (requires transformers.js model)
    │   Embed query → cosine similarity on db.embeddings
    │   Returns top-5 chunks with relevance scores
    │
    └── Dexie direct queries (for structured filters)
        db.runs.where({ status: 'FAIL' }).toArray()
        db.testCases.where({ category: 'security' }).toArray()
```

### Query Classifier

```typescript
// src/lib/search/classifier.ts

type SearchIntent =
  | { type: 'entityLookup'; entityType: string; id: string }
  | { type: 'aggregation'; field: string }
  | { type: 'filter'; filters: Record<string, unknown> }
  | { type: 'semantic'; query: string };

function classifyQuery(query: string): SearchIntent {
  // Entity ID patterns: ad_005, run_abc, pw_003, tc_001, tr_...
  const entityMatch = query.match(/^([a-z]{2,3})[_-](\w+)$/);
  if (entityMatch) {
    return { type: 'entityLookup', entityType: entityMatch[1], id: query };
  }

  // Aggregation keywords
  if (/^(count|how many|most|total|average|avg)\b/i.test(query)) {
    return { type: 'aggregation', field: extractField(query) };
  }

  // Filter patterns
  if (/(fail|pass|last week|yesterday|security|prod)/i.test(query)) {
    return { type: 'filter', filters: extractFilters(query) };
  }

  // Default: semantic search
  return { type: 'semantic', query };
}
```

### Search UI

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Cmd+K  Search anything (test cases, runs, suites, results...)              │
│                                                                            │
│  ⚡ flaky                                                         3 results │
│                                                                            │
│  ┌─ Test Cases ──────────────────────────────────────────────────────────┐ │
│  │  ad_011  XSS Check                  Flakiness: 30%  [🔖]  [📄]       │ │
│  │  ad_005  Session Refresh            Flakiness: 20%  [🔖]  [📄]       │ │
│  │  ad_002  Auth Flow                  Flakiness: 10%  [🔖]  [📄]       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─ Runs ─────────────────────────────────────────────────────────────────┐ │
│  │  run_def  Security Suite     ⚠ 88%  Jun 08      [🔖]  [📄]           │ │
│  │  run_abc  Prod Smoke Suite   ✅ 92%  Jun 09      [🔖]  [📄]           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─ Results ──────────────────────────────────────────────────────────────┐ │
│  │  ad_011  XSS Check              FAIL  Timeout    run_def  [🔖]  [📄]   │ │
│  │  ad_011  XSS Check              FAIL  Timeout    run_abc  [🔖]  [📄]   │ │
│  │  ad_005  Session Refresh        FAIL  Token exp  run_abc  [🔖]  [📄]   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  [Press Enter to open Copilot with full RAG context]                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Search Results Component

```tsx
function SearchResults({ results }: { results: SearchResults }) {
  if (results.type === 'entities') {
    return <EntityResultList entities={results.entities} />;
  }
  if (results.type === 'aggregation') {
    return <AggregationResult data={results.data} chart={results.chart} />;
  }
  if (results.type === 'semantic') {
    return <SemanticResultList chunks={results.chunks} />;
  }
}
```

---

## 7. Google Charts — Uniform Charting

Google Charts via `react-google-charts` is used for ALL data visualizations across all views. This ensures uniform chart formatting.

### Chart Components (reusable, typed)

```tsx
// src/components/aware/charts/GoogleAreaChart.tsx
// src/components/aware/charts/GoogleBarChart.tsx
// src/components/aware/charts/GooglePieChart.tsx
// src/components/aware/charts/GoogleTable.tsx

// Already exist in GoogleCharts.tsx as wrappers. Standardized options:
const CHART_THEME = {
  backgroundColor: 'transparent',
  chartArea: { width: '85%', height: '75%' },
  fontName: 'Inter, system-ui, sans-serif',
  fontSize: 11,
  titleTextStyle: { fontSize: 13, bold: false, color: '#e8e8e8' },
  legend: { position: 'bottom', textStyle: { fontSize: 10, color: '#9aa0a6' } },
  hAxis: { textStyle: { color: '#9aa0a6', fontSize: 10 },
           gridlines: { color: '#2a2a2a' } },
  vAxis: { textStyle: { color: '#9aa0a6', fontSize: 10 },
           gridlines: { color: '#2a2a2a' },
           baselineColor: '#2a2a2a' },
  tooltip: { isHtml: true },
};
```

### Where Charts Appear

| View | Chart Type | Data Source |
|------|-----------|-------------|
| Feed — widget grid | `GoogleAreaChart` — pass rate over time | `snap.runs` grouped by day |
| Feed — widget grid | `GoogleBarChart` — env summary | `snap.runs` grouped by env |
| Feed — widget grid | `GooglePieChart` — outcome mix | `snap.testResults` status count |
| Tests — Results tab | `GoogleAreaChart` — per-test pass rate over runs | `snap.testResults` filtered |
| Compare | `GoogleTable` — diff rows | `snap.diffRows` |
| Dashboard widgets | Configurable chart type | User-configured Dexie query |

---

## 8. Uniform Table & Image Formatting

### Table Formatting Rules

```typescript
// src/components/aware/DataTable.tsx — single table component for ALL tabular data

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  maxHeight?: string;
  rowHref?: (row: T) => string;   // make rows clickable
  rowActions?: (row: T) => ReactNode;
  density?: 'compact' | 'normal' | 'comfortable';
}

// Usage:
<DataTable
  data={snap.runs}
  columns={[
    { key: 'id', label: 'Run', width: 100, render: (r) => <code>{r.id}</code> },
    { key: 'passPct', label: 'Pass Rate', width: 80, align: 'right',
      render: (r) => <PassBadge pct={r.passPct} /> },
    { key: 'started', label: 'Date', width: 120,
      render: (r) => formatDate(r.started) },
    { key: 'actions', label: '', width: 60,
      render: (r) => <RowActionsMenu run={r} /> },
  ]}
  density="compact"
/>
```

**Visual rules applied to all tables**:
- Font: `var(--font-mono)` for IDs, `var(--font-sans)` for labels
- Font size: 12px (compact), 13px (normal), 14px (comfortable)
- Row height: 28px (compact), 36px (normal), 44px (comfortable)
- Hover: `background: var(--aw-elevated)` on row
- Selection: `background: var(--aw-accent)` at 10% opacity
- Sorting: click column header, indicator shown via `▲`/`▼`
- Sticky header: `position: sticky; top: 0`
- Column widths: explicit or `fr` via CSS grid
- No cell borders — rows separated by `border-bottom: 1px solid var(--aw-border)`
- Right-align numeric columns

### Image Formatting Rules

```tsx
// src/components/aware/EvidenceViewer.tsx — single component for ALL images

interface EvidenceViewerProps {
  frames: (FilmstripFrame & { url: string })[];
  layout?: 'grid' | 'carousel' | 'single';
  maxWidth?: number;
}

// Usage:
<EvidenceViewer
  frames={frames.map(f => ({
    ...f,
    url: f.path ? evidenceImageUrl(f.path) : f.dataUri!,
  }))}
  layout="grid"
  maxWidth={800}
/>
```

**Visual rules applied to all images**:
- Max width: 800px (configurable)
- Border radius: 4px
- Background: `#1a1a1a` (prevents white flash on transparent PNG)
- Loading: `<img loading="lazy">` native lazy loading
- Error: `onError` shows a placeholder `<div>` with broken-image icon
- Carousel: `embla-carousel-react` (already in deps) for swipeable galleries
- Grid: CSS `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`
- No border — images sit flush against their container
- Caption: 11px `var(--aw-secondary)` below each image showing frame label

---

## 9. RAG Pipeline + LLM Provider Chain

### Embedding: Compute-Before-Write (Atomic Swap)

```typescript
// src/lib/rag/rebuild.ts

async function rebuildVectorIndex(): Promise<void> {
  // Phase 1: Compute (no side effects on DB)
  // Only re-embed entities whose _rev changed since last build
  const entities = await loadChangedEntities();
  const newEmbeddings: EmbeddingRecord[] = [];

  const embedder = await getEmbedder(); // lazy-load transformers.js
  for (const entity of entities) {
    const chunks = chunkEntity(entity);
    const vectors = await embedder.embed(chunks.map(c => c.text));
    for (let i = 0; i < chunks.length; i++) {
      newEmbeddings.push({
        entityType: entity.type,
        entityId: entity.id,
        chunkIndex: i,
        text: chunks[i].text,
        model: 'all-MiniLM-L6-v2',
        dimensions: 384,
        vector: vectors[i],
        entityRev: entity._rev,
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (newEmbeddings.length === 0) return;

  // Phase 2: Atomic swap in single transaction
  await db.transaction('rw', [db.embeddings, db.embeddingMeta], async () => {
    // Only delete + rewrite changed entity types
    const types = [...new Set(newEmbeddings.map(e => e.entityType))];
    for (const type of types) {
      await db.embeddings.where('entityType').equals(type).delete();
    }
    await db.embeddings.bulkAdd(newEmbeddings);
    await db.embeddingMeta.put({ key: 'version', value: '2' });
    await db.embeddingMeta.put({ key: 'count', value: String(newEmbeddings.length) });
    await db.embeddingMeta.put({
      key: 'generation', value: String(getSnapshot().generation),
    });
  });
}
```

### LLM Provider Auto-Detection

```
Copilot boots
  │
  ├── Chrome AI (window.ai.languageModel)?
  │   ✅ → Gemini Nano — instant, no download
  │   ❌ → Fall through
  │
  ├── WebGPU available (navigator.gpu)?
  │   ✅ → Download TinyLlama via WebLLM (user-initiated, progress shown)
  │   ❌ → Fall through
  │
  └── No LLM → RAG-only search results (Fuse.js + vector if available)
```

### Fallback Chain

```
User query
    │
    ├── Intent classifier
    │   ├── Entity lookup → direct snapshot read (instant, no deps)
    │   ├── Aggregation → Dexie query on snapshot (instant, no deps)
    │   └── Semantic → continue below
    │
    ├── Fuse.js index ready?
    │   ✅ → Keyword search returns results in <1ms
    │   ❌ → Build index from snapshot (first query only, ~2ms)
    │
    ├── Vector index ready?
    │   ✅ → Embed query → cosine similarity → ranked results
    │   ❌ → Use Fuse.js results only
    │
    ├── LLM available?
    │   ✅ → RAG context → LLM synthesizes answer
    │   ❌ → Show structured results with bookmark + edit hints
    │
    └── Display results
```

---

## 10. URL Structure — 4 Routes + Search

```
/                                Feed (default)
/?expand=run_abc                Feed with run expanded
/?from=2026-06-01&to=2026-06-10 Feed date range
/?filter=preset-name            Feed with saved filter

/tests                           Tests list
/tests/ad_005                    Tests with ad_005 selected
/tests?filter=security-active    Tests with saved filter

/compare                         Compare picker
/compare?base=run_abc&cand=run_def   Compare two runs
/compare/saved_xyz               Compare from saved comparison

/copilot                         Copilot (blank)
/copilot?q=flaky+tests           Copilot with pre-filled query
```

Routes in `App.tsx`:

```tsx
<Switch>
  <Route path="/"><FeedView /></Route>
  <Route path="/tests/:testId?"><TestsView /></Route>
  <Route path="/compare/:comparisonId?"><CompareView /></Route>
  <Route path="/copilot"><CopilotView /></Route>
  <Route component={NotFoundToFeed} />
</Switch>
```

URL builders in `src/lib/link.ts` generate shareable links. Every view has a 🔗 "Copy link" button.

---

## 11. 4 Views

### View 1: Feed (`/`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⟐ Feed  [▼ All envs] [▼ Status] [Q Filter...]  [💾 Save] [📂 Load]  🔗   │
│  Last synced: 3m ago  ●                                                      │
│                                                                            │
│  ┌─ Widget: Pass Rate (last 14d) ───┐  ┌─ Widget: Outcome Mix ──────────┐  │
│  │  [GoogleAreaChart]                │  │  [GooglePieChart]              │  │
│  │  92%  ▲3%                         │  │  ✅ 87%  ❌ 10%  ⚠ 3%        │  │
│  └───────────────────────────────────┘  └────────────────────────────────┘  │
│                                                                            │
│  ── Today ───────────────────────────────────────────────────────────────  │
│                                                                            │
│  ◉ run_abc  Prod Smoke Suite  ◉ 92% pass  1.2s              [🔖]  [🔗]   │
│    ├─ ✅ pw_001  Login test         PASS  0.3s        [▶]  [🔖]  [📄]    │
│    ├─ ✅ ad_002  Status check       PASS  1.1s        [▶]  [🔖]  [📄]    │
│    ├─ ❌ ad_005  Session refresh    FAIL  2.4s  "Token expired" [🔖] [📄] │
│    └─ ✅ pw_003  Login perf         PASS  1.5s        [▶]  [🔖]  [📄]    │
│                                                                            │
│  ◉ run_def  Security Suite  ⚠ 88% pass  2.1s           [▶]  [🔖]  [🔗]   │
│    [collapsed — 3 PASS, 1 FAIL]                                            │
│                                                                            │
│  [Load more...]                                                   3.2ms   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### View 2: Tests (`/tests[/:id]`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ✓ Tests  [Q Search name, category, tag...]  [▼ Status] [▼ Category] [📂]  │
│                                                                            │
│  ┌──────────── List ───────────────┬─────────── Detail ───────────────────┐│
│  │  ad_001  Status Check       ✅  │  ad_001  Status Check  [🔖] [📄]     ││
│  │  ad_002  Auth Flow          ✅  │  ─────────────────────────────────   ││
│  │  ad_005  Session Refresh    ❌  │  Web  ·  P0  ·  Security  ·  active  ││
│  │  pw_001  Login Test         ✅  │  📄 tests/test_geo_matching.py       ││
│  │  pw_003  Login Perf         ✅  │                                      ││
│  │  ad_010  SQL Injection      ✅  │  ┌─ Info ┬ Suites ┬ Results ┬ Doc ┐ ││
│  │  ad_011  XSS Check          ❌  │  │ Expected: 200 + CORS header   │  ││
│  │                              │  │  GoogleAreaChart: pass rate     │  ││
│  │  67 tests · 0.4ms           │  │  over last 10 runs              │  ││
│  └──────────────────────────────┘  └──────────────────────────────────┘  ││
│                                                                            │
│  Filters: [Security] [P0] [FAIL]  × Clear                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

### View 3: Compare (`/compare[/:id] or ?base=&cand=`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⇄ Compare  [Baseline: run_abc ▼]  [Candidate: run_def ▼]  [↕]            │
│  [💾 Save] [📂 Load]  [🔗]  [📄 Edit on GitHub]                            │
│                                                                            │
│  Delta: +2 regressions · +1 fix · +0.3s avg duration                      │
│                                                                            │
│  [GoogleTable]                                                             │
│  Test          Base      Cand      Δ Duration  State         [🔖] [📄]    │
│  ad_005        ✅ PASS   ❌ FAIL     +1.2s      🔴 regression             │
│  ad_008        ✅ PASS   ❌ FAIL     +0.3s      🔴 regression             │
│  pw_002        ❌ FAIL   ✅ PASS     -0.5s      ✅ fixed                   │
│  ad_001        ✅ PASS   ✅ PASS     +0.1s      — unchanged                │
│                                                                            │
│  [Promote]  [Block]  [Export]                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### View 4: Copilot (`/copilot`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ✦ Copilot        [RAG ● | Raw ○]  [Clear]  [🔗]                          │
│  ● TinyLlama 1.1B (WebLLM) · 410 chunks indexed  [Rebuild]  [Change]      │
│                                                                            │
│  User: What's the flakiest Security test?                                 │
│                                                                            │
│  AI: ad_011 (XSS Check) — 30% flakiness over 10 runs.                    │
│                                                                            │
│  Sources:                                                                 │
│    · ad_011  Test case  92% relevance  [🔖] [📄]                         │
│    · run_def Run        85% relevance  [🔖]                               │
│    · run_abc Run        78% relevance  [🔖]                               │
│                                                                            │
│  ───────────────────────────────────────────────────────────────────────── │
│                                                                            │
│  User: Show failures from last week                                       │
│                                                                            │
│  AI: [Querying database...] 3 results:                                    │
│    ❌ ad_005  Session Refresh  run_abc  "Token expired"  [🔖] [📄]       │
│    ❌ ad_008  Rate Limiting    run_def  "429"             [🔖] [📄]       │
│    ❌ ad_011  XSS Check        run_ghi  "Timeout"         [🔖] [📄]       │
│                                                                            │
│  [Ask a question or type a search...                          [Send] 🔍]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Image Pipeline + LFS

| Stage | Action | Enforcer |
|-------|--------|----------|
| CI test run | Playwright captures `.png` screenshots | Playwright config |
| CI record | `record-run.mjs` writes to `public/evidence/{runId}/{frameId}.png` | Script |
| Validate | `validate-data.mjs` checks evidence total < 500MB | CI, exits 1 |
| Deploy | Evidence committed to repo | `deploy.yml` → `git add public/evidence/` |
| Serve | Browser loads from `/AWARE/evidence/{runId}/{frameId}.png` | GitHub Pages |
| GC | CI cleans evidence older than 90 days | Scheduled action |

### LFS Guard

| Gate | Limit | Enforcer |
|------|-------|----------|
| Per-image | < 500 KB | `record-run.mjs` compresses |
| Total evidence | < 500 MB | `validate-data.mjs` + `deploy.yml` |
| Per-JSON file | < 1 MB | `validate-data.mjs` |
| Evidence retention | 90 days | CI cleanup |

LFS threshold is 100 MB per file. Files are 200x-340x below that.

---

## 13. Service Worker

```typescript
// src/sw.ts

const DATA_CACHE = 'aware-data-v2';
const ASSET_CACHE = 'aware-assets-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(event.request, DATA_CACHE));
  } else if (url.pathname.includes('/evidence/')) {
    event.respondWith(cacheFirst(event.request, ASSET_CACHE));
  } else {
    event.respondWith(cacheFirst(event.request, ASSET_CACHE));
  }
});
```

---

## 14. Bundle Budget

| Layer | Size (gzip) | Load Timing |
|-------|-------------|-------------|
| Dexie.js | 16 KB | Eager (boot) |
| vite-plugin-pwa | 5 KB | Eager (SW registration) |
| react-google-charts | 0 KB static | **Lazy** (loaded on first chart render) |
| transformers.js | 0 KB static | **Lazy** (first Copilot/Search use) |
| all-MiniLM-L6-v2 | 0 KB static | **Lazy** downloaded once, cached |
| New view/app code | ~20 KB | Code-split per view |
| **Added total** | **41 KB static** | |
| JSON removed from bundle | -12 KB | No longer imported at build time |
| **Net static** | **+29 KB** | 97 KB → 126 KB gzip |
| **Lazy (transformers)** | 23 MB model | Downloaded once, cached by browser |

---

## 15. Implementation Phases

| Phase | Scope | Key Files | Consistency Fixes Included | Weeks |
|-------|-------|-----------|---------------------------|-------|
| **P1** | Dexie schema, snapshot system, version rollback guard, BroadcastChannel | `db.ts`, `snapshot.ts`, `openDatabase()` | Invariants 1, 5, 6 | 1 |
| **P2** | Background sync engine with generation-batch guard, quota check, cross-tab | `sync/engine.ts`, `sync/hasher.ts` | Invariants 2, 3, 7 | 1 |
| **P3** | Build-time hydration guard (only when Dexie empty) | `hydration.ts`, `main.tsx` | Invariant 4 | 0.5 |
| **P4** | Service Worker, image pipeline, CI changes | `sw.ts`, `record-run.mjs`, `validate-data.mjs`, `deploy.yml` | — | 1 |
| **P5** | App shell, 4 routes, URL builders, sync dot, `TestFileLink` | `App.tsx`, `AppShell.tsx`, `link.ts`, `githubLinks.ts` | — | 0.5 |
| **P6** | Google Charts wrappers, `DataTable`, `EvidenceViewer`, chart theme | `charts/*.tsx`, `DataTable.tsx`, `EvidenceViewer.tsx` | — | 0.5 |
| **P7** | Feed view + dashboard widgets | `views/Feed.tsx`, `RunCard.tsx`, `FilterBar.tsx` | Pass snapshot, not db | 1 |
| **P8** | Tests view + analytics tab (charts) | `views/Tests.tsx`, `TestDetailTabs.tsx` | Pass snapshot, not db | 1 |
| **P9** | Compare view + saved comparisons | `views/Compare.tsx`, `CompareTable.tsx` | Pass snapshot, not db | 0.5 |
| **P10** | Copilot + search + RAG pipeline + LLM provider chain | `views/Copilot.tsx`, `rag/*.ts`, `search/*.ts` | Queued rebuild, compute-before-write | 1.5 |
| **P11** | Settings overlay, bookmark UI, filter presets | `SettingsOverlay.tsx`, `BookmarkToggle.tsx` | — | 0.5 |

**Total: ~9 weeks**

### Per-Phase Regression Safety

- **P1-P3**: Zero visual changes. Infra only. Existing 15 pages continue to work unchanged.
- **P4**: Recorded runs now use `.png` files. Old runs with `dataUri` still render via backward-compat.
- **P5**: New AppShell renders. Old pages are wrapped inside it. Zero page logic changes.
- **P6**: Chart components available. No pages use them yet.
- **P7-P10**: Old pages deleted one-by-one as new views replace them. Rollback = restore old pages, no data loss.
- **P11**: Pure additive — no old code removed.

---

## 16. Old vs New Comparison

| Aspect | Current (15 pages) | Future (4 views + search overlay) |
|--------|-------------------|----------------------------------|
| **Data source** | Build-time JSON imports | Dexie IndexedDB, synced via 5 triggers |
| **DB consistency** | Not applicable (single import) | 7 invariants enforced |
| **Cross-tab sync** | Not applicable | BroadcastChannel |
| **AI Copilot** | Chrome AI only, no RAG | Chrome AI → WebLLM, vector RAG, query classifier |
| **Search** | Fuse.js on in-memory | Intent classifier → Fuse.js / vector / Dexie query |
| **Test file links** | None | Direct link to GitHub source file |
| **Charts** | Mixed (Google Charts + recharts) | Google Charts only, uniform theme |
| **Tables** | Inconsistent per-page | Single `DataTable` component |
| **Images** | Base64 in JSON | `.png` files in `public/evidence/` |
| **Service Worker** | None | Precaching, network-first for data |
| **Offline** | Broken | Functional after first hydration |
| **URL sharing** | Manual | Every view state encoded in URL |
| **Bundle** | ~97 KB gzip | ~126 KB gzip (+29 KB net) |
| **Page count** | 15 | 4 + 1 overlay |

import { loadRuns, recomputeAll } from "./runs";
import { loadAllResults } from "./runsLoader";
import { loadTestSuites } from "./testSuites";
import { loadPromotions } from "./promotions";
import { loadSchedulerStatus } from "./schedulerStatus";
import { loadAutoDiscoveredTests } from "./testDiscovery";

export interface DataInitState {
  loaded: boolean;
  loading: boolean;
  runsReady: boolean;
  error: unknown;
}

let _loading = false;
let _loaded = false;
let _runsReady = false;
let _error: unknown = null;
let _snapshot: DataInitState = {
  loaded: false,
  loading: false,
  runsReady: false,
  error: null,
};
const _listeners = new Set<() => void>();

export function getDataInitState(): DataInitState {
  return _snapshot;
}

function updateSnapshot(): void {
  _snapshot = {
    loaded: _loaded,
    loading: _loading,
    runsReady: _runsReady,
    error: _error,
  };
}

export function subscribeToDataInit(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function notify(): void {
  _listeners.forEach((cb) => cb());
}

async function safeLoad<T>(
  loader: () => Promise<T>,
  name: string,
  errors: unknown[],
): Promise<T | undefined> {
  try {
    return await loader();
  } catch (err) {
    errors.push(`${name}: ${err}`);
    return undefined;
  }
}

export async function loadAllData(): Promise<void> {
  if (_loaded || _loading) return;
  _loading = true;
  updateSnapshot();
  notify();

  const errors: unknown[] = [];

  // ── Phase 1: Load runs first — unblocks the run list UI immediately ───────
  await safeLoad(loadRuns, "runs", errors);
  recomputeAll();
  _runsReady = true;
  updateSnapshot();
  notify();

  // ── Phase 2: Load supporting data concurrently ────────────────────────────
  await Promise.all([
    safeLoad(loadTestSuites, "suites", errors),
    safeLoad(loadPromotions, "promotions", errors),
    safeLoad(loadSchedulerStatus, "scheduler", errors),
    safeLoad(loadAutoDiscoveredTests, "discovery", errors),
  ]);
  recomputeAll();
  updateSnapshot();
  notify();

  // ── Phase 3: Load full test results last (largest payload) ────────────────
  await safeLoad(loadAllResults, "results", errors);
  recomputeAll();

  if (errors.length > 0) {
    _error = errors.join("; ");
    console.error("Data load errors:", errors);
  }

  _loaded = true;
  _loading = false;
  updateSnapshot();
  notify();
}

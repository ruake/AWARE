import { loadRuns, recomputeAll } from "./runs";
import { loadAllResults } from "./runsLoader";
import { loadTestSuites } from "./testSuites";
import { loadPromotions } from "./promotions";
import { loadSchedulerStatus } from "./schedulerStatus";
import { loadAutoDiscoveredTests } from "./testDiscovery";

let _loading = false;
let _loaded = false;
let _error: unknown = null;
let _snapshot: { loaded: boolean; loading: boolean; error: unknown } = {
  loaded: false,
  loading: false,
  error: null,
};
const _listeners = new Set<() => void>();

export function getDataInitState(): { loaded: boolean; loading: boolean; error: unknown } {
  return _snapshot;
}

function updateSnapshot(): void {
  _snapshot = { loaded: _loaded, loading: _loading, error: _error };
}

export function subscribeToDataInit(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function notify(): void {
  _listeners.forEach((cb) => cb());
}

export async function loadAllData(): Promise<void> {
  if (_loaded || _loading) return;
  _loading = true;
  updateSnapshot();
  notify();
  const errors: unknown[] = [];
  async function safeLoad<T>(loader: () => Promise<T>, name: string): Promise<T | undefined> {
    try {
      return await loader();
    } catch (err) {
      errors.push(`${name}: ${err}`);
      return undefined;
    }
  }
  await Promise.all([
    safeLoad(loadRuns, "runs"),
    safeLoad(loadAllResults, "results"),
    safeLoad(loadTestSuites, "suites"),
    safeLoad(loadPromotions, "promotions"),
    safeLoad(loadSchedulerStatus, "scheduler"),
    safeLoad(loadAutoDiscoveredTests, "discovery"),
  ]);
  recomputeAll();
  _loaded = true;
  if (errors.length > 0) {
    _error = errors.join("; ");
    console.error("Data load errors:", errors);
  }
  _loading = false;
  updateSnapshot();
  notify();
}

import { loadRuns, recomputeAll } from "./runs";
import { loadTestSuites } from "./testSuites";
import { loadPromotions } from "./promotions";
import { loadSchedulerStatus } from "./schedulerStatus";
import { loadAutoDiscoveredTests } from "./testDiscovery";

let _loading = false;
let _loaded = false;
let _error: unknown = null;
const _listeners = new Set<() => void>();

export function getDataInitState(): { loaded: boolean; loading: boolean; error: unknown } {
  return { loaded: _loaded, loading: _loading, error: _error };
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
  notify();
  try {
    await Promise.all([
      loadRuns(),
      loadTestSuites(),
      loadPromotions(),
      loadSchedulerStatus(),
      loadAutoDiscoveredTests(),
    ]);
    recomputeAll();
    _loaded = true;
  } catch (err) {
    _error = err;
    throw err;
  } finally {
    _loading = false;
    notify();
  }
}

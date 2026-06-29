export const LS_TC_KEY = "aware_test_cases_v2";
export const LS_SUITE_KEY = "aware_test_suites_v2";
export const LS_DECISIONS_KEY = "aware_promotion_decisions";

export function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [...fallback];
  } catch {
    return [...fallback];
  }
}

// Plain Set-based pub/sub — exported for testing and for useSyncExternalStore consumers
export const _tcListeners = new Set<() => void>();
export const _tsListeners = new Set<() => void>();

export function _notifyTC(): void {
  _tcListeners.forEach((fn) => fn());
}

export function _notifyTS(): void {
  _tsListeners.forEach((fn) => fn());
}

export function _notify(): void {
  _notifyTC();
  _notifyTS();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === LS_TC_KEY || e.key === LS_SUITE_KEY) {
      _notify();
    }
  });
}

export function subscribeToTestCases(onChange: () => void): () => void {
  _tcListeners.add(onChange);
  return () => { _tcListeners.delete(onChange); };
}

export function subscribeToTestSuites(onChange: () => void): () => void {
  _tsListeners.add(onChange);
  return () => { _tsListeners.delete(onChange); };
}

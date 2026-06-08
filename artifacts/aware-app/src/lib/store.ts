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

export const _tcListeners = new Set<() => void>();
export const _tsListeners = new Set<() => void>();

export function _notifyTC() {}
export function _notifyTS() {}
export function _notify() {}

export function subscribeToTestCases(onChange: () => void): () => void {
  _tcListeners.add(onChange);
  return () => _tcListeners.delete(onChange);
}

export function subscribeToTestSuites(onChange: () => void): () => void {
  _tsListeners.add(onChange);
  return () => _tsListeners.delete(onChange);
}

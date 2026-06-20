import { createStore } from "zustand/vanilla";

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

// Zustand vanilla stores for subscription management
const _tcStore = createStore(() => ({}));
const _tsStore = createStore(() => ({}));

export function _notifyTC() {
  _tcStore.setState({});
}
export function _notifyTS() {
  _tsStore.setState({});
}
export function _notify() {
  _notifyTC();
  _notifyTS();
}

export function subscribeToTestCases(onChange: () => void): () => void {
  return _tcStore.subscribe(onChange);
}

export function subscribeToTestSuites(onChange: () => void): () => void {
  return _tsStore.subscribe(onChange);
}

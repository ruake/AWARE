import {
  getSelectedEnvIds,
  setSelectedEnvIds,
  toggleSelectedEnvId,
  subscribeToSelectedEnv,
} from "@/lib/selectedEnv";

export { getSelectedEnvIds, setSelectedEnvIds, toggleSelectedEnvId, subscribeToSelectedEnv };

export interface FilterState {
  status: "ALL" | "PASS" | "FAIL";
  search: string;
  env: string | null;
  category: string | null;
  page: number;
}

export const DEFAULT_FILTERS: FilterState = {
  status: "ALL",
  search: "",
  env: null,
  category: null,
  page: 1,
};

let _suiteIds: string[] = [];
const _suiteListeners = new Set<() => void>();

export function getSelectedSuiteIds(): string[] {
  return _suiteIds;
}

export function setSelectedSuiteIds(ids: string[]): void {
  _suiteIds = ids;
  localStorage.setItem("aware-selected-suites-v1", JSON.stringify(ids));
  _suiteListeners.forEach((fn) => fn());
}

export function toggleSelectedSuiteId(id: string): void {
  if (_suiteIds.includes(id)) {
    _suiteIds = _suiteIds.filter((s) => s !== id);
  } else {
    _suiteIds = [..._suiteIds, id];
  }
  localStorage.setItem("aware-selected-suites-v1", JSON.stringify(_suiteIds));
  _suiteListeners.forEach((fn) => fn());
}

export function subscribeToSelectedSuites(cb: () => void): () => void {
  _suiteListeners.add(cb);
  return () => {
    _suiteListeners.delete(cb);
  };
}

export function getSelectedSuiteSnapshot(): { suiteIds: string[] } {
  return { suiteIds: _suiteIds };
}

export function subscribeToFilters(cb: () => void): () => void {
  const unsubEnv = subscribeToSelectedEnv(cb);
  const unsubSuite = subscribeToSelectedSuites(cb);
  return () => {
    unsubEnv();
    unsubSuite();
  };
}

const DEFAULT_LAYOUT = {
  sidebarWidth: 240,
  detailPanelWidth: 380,
  chartPanelCollapsed: false,
  sidebarCollapsed: false,
  testDetailPanelCollapsed: false,
  envHealthCollapsed: false,
};

let _layout = { ...DEFAULT_LAYOUT };
const _layoutListeners = new Set<() => void>();

export function getLayoutSettings(): typeof DEFAULT_LAYOUT {
  return _layout;
}

export function getLayoutSnapshot(): typeof DEFAULT_LAYOUT {
  return { ..._layout };
}

export function setLayoutSettings(partial: Partial<typeof DEFAULT_LAYOUT>): void {
  _layout = { ..._layout, ...partial };
  localStorage.setItem("aware-layout-v1", JSON.stringify(_layout));
  _layoutListeners.forEach((fn) => fn());
}

export function subscribeToLayout(cb: () => void): () => void {
  _layoutListeners.add(cb);
  return () => {
    _layoutListeners.delete(cb);
  };
}

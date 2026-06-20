import { createStore } from "zustand/vanilla";

const ENV_STORAGE_KEY = "aware-selected-env-v2";
const SUITE_STORAGE_KEY = "aware-selected-suites-v1";
const LAYOUT_STORAGE_KEY = "aware-layout-v1";

// ── Layout Settings type ──────────────────────────────────────────────
export interface LayoutSettings {
  sidebarWidth: number;
  detailPanelWidth: number;
  chartPanelCollapsed: boolean;
  sidebarCollapsed: boolean;
  testDetailPanelCollapsed: boolean;
  envHealthCollapsed: boolean;
}

const DEFAULT_LAYOUT: LayoutSettings = {
  sidebarWidth: 240,
  detailPanelWidth: 380,
  chartPanelCollapsed: false,
  sidebarCollapsed: false,
  testDetailPanelCollapsed: false,
  envHealthCollapsed: false,
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) return (Array.isArray(parsed) ? parsed : fallback) as T;
    return { ...(fallback as object), ...(parsed as object) } as T;
  } catch {
    return fallback;
  }
}

// ── Zustand vanilla stores ────────────────────────────────────────────

interface EnvState {
  envIds: string[];
}

interface SuiteState {
  suiteIds: string[];
}

const _envStore = createStore<EnvState>()(() => ({
  envIds: readStorage<string[]>(ENV_STORAGE_KEY, []),
}));

const _suiteStore = createStore<SuiteState>()(() => ({
  suiteIds: readStorage<string[]>(SUITE_STORAGE_KEY, []),
}));

const _layoutStore = createStore<LayoutSettings>()(() =>
  readStorage<LayoutSettings>(LAYOUT_STORAGE_KEY, DEFAULT_LAYOUT),
);

// ── Env public API ───────────────────────────────────────────────────

export function getSelectedEnvIds(): string[] {
  return _envStore.getState().envIds;
}

export function getSelectedEnvSnapshot(): { envIds: string[] } {
  return _envStore.getState();
}

export function setSelectedEnvIds(envIds: string[]): void {
  try {
    localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(envIds));
  } catch {
    /* ignore */
  }
  _envStore.setState({ envIds });
}

export function toggleSelectedEnvId(envId: string): void {
  const current = _envStore.getState().envIds;
  const next = current.includes(envId)
    ? current.filter((id) => id !== envId)
    : [...current, envId];
  setSelectedEnvIds(next);
}

export function subscribeToSelectedEnv(cb: () => void): () => void {
  return _envStore.subscribe(cb);
}

// ── Suite public API ─────────────────────────────────────────────────

export function getSelectedSuiteIds(): string[] {
  return _suiteStore.getState().suiteIds;
}

export function getSelectedSuiteSnapshot(): { suiteIds: string[] } {
  return _suiteStore.getState();
}

export function setSelectedSuiteIds(suiteIds: string[]): void {
  try {
    localStorage.setItem(SUITE_STORAGE_KEY, JSON.stringify(suiteIds));
  } catch {
    /* ignore */
  }
  _suiteStore.setState({ suiteIds });
}

export function toggleSelectedSuiteId(suiteId: string): void {
  const current = _suiteStore.getState().suiteIds;
  const next = current.includes(suiteId)
    ? current.filter((id) => id !== suiteId)
    : [...current, suiteId];
  setSelectedSuiteIds(next);
}

export function subscribeToSelectedSuites(cb: () => void): () => void {
  return _suiteStore.subscribe(cb);
}

export function subscribeToFilters(cb: () => void): () => void {
  const unsubEnv = _envStore.subscribe(cb);
  const unsubSuite = _suiteStore.subscribe(cb);
  return () => {
    unsubEnv();
    unsubSuite();
  };
}

// ── Layout public API ────────────────────────────────────────────────

export function getLayoutSettings(): LayoutSettings {
  return _layoutStore.getState();
}

export function getLayoutSnapshot(): LayoutSettings {
  return _layoutStore.getState();
}

export function setLayoutSettings(partial: Partial<LayoutSettings>): void {
  const next = { ..._layoutStore.getState(), ...partial };
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  _layoutStore.setState(next);
}

export function subscribeToLayout(cb: () => void): () => void {
  return _layoutStore.subscribe(cb);
}

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

/**
 * @description Returns the list of currently selected environment IDs.
 * @returns Array of environment ID strings.
 */
export function getSelectedEnvIds(): string[] {
  return _envStore.getState().envIds;
}

/**
 * @description Returns a snapshot of the environment selection state.
 * @returns EnvState object containing selected IDs.
 */
export function getSelectedEnvSnapshot(): EnvState {
  return _envStore.getState();
}

/**
 * @description Sets the selected environment IDs and persists them to localStorage.
 * @param envIds - Array of environment ID strings to select.
 */
export function setSelectedEnvIds(envIds: string[]): void {
  try {
    localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(envIds));
  } catch {
    /* ignore */
  }
  _envStore.setState({ envIds });
}

/**
 * @description Toggles the selection state of a single environment ID.
 * @param envId - The environment ID to toggle.
 */
export function toggleSelectedEnvId(envId: string): void {
  const current = _envStore.getState().envIds;
  const next = current.includes(envId) ? current.filter((id) => id !== envId) : [...current, envId];
  setSelectedEnvIds(next);
}

/**
 * @description Subscribes to changes in environment selection.
 * @param cb - Callback function to execute on change.
 * @returns A function to unsubscribe.
 */
export function subscribeToSelectedEnv(cb: () => void): () => void {
  return _envStore.subscribe(cb);
}

// ── Suite public API ─────────────────────────────────────────────────

/**
 * @description Returns the list of currently selected suite IDs.
 * @returns Array of suite ID strings.
 */
export function getSelectedSuiteIds(): string[] {
  return _suiteStore.getState().suiteIds;
}

/**
 * @description Returns a snapshot of the suite selection state.
 * @returns SuiteState object containing selected IDs.
 */
export function getSelectedSuiteSnapshot(): SuiteState {
  return _suiteStore.getState();
}

/**
 * @description Sets the selected suite IDs and persists them to localStorage.
 * @param suiteIds - Array of suite ID strings to select.
 */
export function setSelectedSuiteIds(suiteIds: string[]): void {
  try {
    localStorage.setItem(SUITE_STORAGE_KEY, JSON.stringify(suiteIds));
  } catch {
    /* ignore */
  }
  _suiteStore.setState({ suiteIds });
}

/**
 * @description Toggles the selection state of a single suite ID.
 * @param suiteId - The suite ID to toggle.
 */
export function toggleSelectedSuiteId(suiteId: string): void {
  const current = _suiteStore.getState().suiteIds;
  const next = current.includes(suiteId)
    ? current.filter((id) => id !== suiteId)
    : [...current, suiteId];
  setSelectedSuiteIds(next);
}

/**
 * @description Subscribes to changes in suite selection.
 * @param cb - Callback function to execute on change.
 * @returns A function to unsubscribe.
 */
export function subscribeToSelectedSuites(cb: () => void): () => void {
  return _suiteStore.subscribe(cb);
}

/**
 * @description Subscribes to changes in both environment and suite filters.
 * @param cb - Callback function to execute on change.
 * @returns A function to unsubscribe.
 */
export function subscribeToFilters(cb: () => void): () => void {
  const unsubEnv = _envStore.subscribe(cb);
  const unsubSuite = _suiteStore.subscribe(cb);
  return () => {
    unsubEnv();
    unsubSuite();
  };
}

// ── Layout public API ────────────────────────────────────────────────

/**
 * @description Returns the current layout settings.
 * @returns LayoutSettings object.
 */
export function getLayoutSettings(): LayoutSettings {
  return _layoutStore.getState();
}

/**
 * @description Returns a snapshot of the current layout settings.
 * @returns LayoutSettings object.
 */
export function getLayoutSnapshot(): LayoutSettings {
  return _layoutStore.getState();
}

/**
 * @description Updates the layout settings and persists them to localStorage.
 * @param partial - Partial layout settings to update.
 */
export function setLayoutSettings(partial: Partial<LayoutSettings>): void {
  const next = { ..._layoutStore.getState(), ...partial };
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  _layoutStore.setState(next);
}

/**
 * @description Subscribes to changes in layout settings.
 * @param cb - Callback function to execute on change.
 * @returns A function to unsubscribe.
 */
export function subscribeToLayout(cb: () => void): () => void {
  return _layoutStore.subscribe(cb);
}

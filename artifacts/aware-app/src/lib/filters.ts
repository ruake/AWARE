// ── Filter Store (env + suite) + Layout Settings ─────────────────────
const ENV_STORAGE_KEY = "aware-selected-env-v2";
const SUITE_STORAGE_KEY = "aware-selected-suites-v1";
const LAYOUT_STORAGE_KEY = "aware-layout-v1";

// ── Listeners ────────────────────────────────────────────────────────
const _envListeners = new Set<() => void>();
const _suiteListeners = new Set<() => void>();
const _layoutListeners = new Set<() => void>();

// ── Env IDs ──────────────────────────────────────────────────────────
let _selectedEnvIds: string[] = (() => {
  try {
    const raw = localStorage.getItem(ENV_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
})();

// ── Suite IDs ────────────────────────────────────────────────────────
let _selectedSuiteIds: string[] = (() => {
  try {
    const raw = localStorage.getItem(SUITE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
})();

// ── Layout Settings ──────────────────────────────────────────────────
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

let _layout: LayoutSettings = (() => {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    return { ...DEFAULT_LAYOUT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LAYOUT;
  }
})();

// ── Snapshots ────────────────────────────────────────────────────────
// Each domain has its own stable snapshot for useSyncExternalStore,
// so consumers only re-render when their relevant data changes.

let _envSnapshot = { envIds: _selectedEnvIds };
let _suiteSnapshot = { suiteIds: _selectedSuiteIds };
let _layoutSnapshot = { ..._layout };

function updateEnvSnapshot(): void {
  _envSnapshot = { envIds: _selectedEnvIds };
}

function updateSuiteSnapshot(): void {
  _suiteSnapshot = { suiteIds: _selectedSuiteIds };
}

function updateLayoutSnapshot(): void {
  _layoutSnapshot = { ..._layout };
}

// ── Env public API ───────────────────────────────────────────────────
export function getSelectedEnvIds(): string[] {
  return _selectedEnvIds;
}

export function getSelectedEnvSnapshot(): { envIds: string[] } {
  return _envSnapshot;
}

export function setSelectedEnvIds(envIds: string[]): void {
  _selectedEnvIds = envIds;
  try {
    localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(envIds));
  } catch {
    /* ignore */
  }
  updateEnvSnapshot();
  _envListeners.forEach((cb) => cb());
}

export function toggleSelectedEnvId(envId: string): void {
  const idx = _selectedEnvIds.indexOf(envId);
  let next: string[];
  if (idx >= 0) {
    next = _selectedEnvIds.filter((id) => id !== envId);
  } else {
    next = [..._selectedEnvIds, envId];
  }
  setSelectedEnvIds(next);
}

export function subscribeToSelectedEnv(cb: () => void): () => void {
  _envListeners.add(cb);
  return () => _envListeners.delete(cb);
}

// ── Suite public API ─────────────────────────────────────────────────
export function getSelectedSuiteIds(): string[] {
  return _selectedSuiteIds;
}

export function getSelectedSuiteSnapshot(): { suiteIds: string[] } {
  return _suiteSnapshot;
}

export function setSelectedSuiteIds(suiteIds: string[]): void {
  _selectedSuiteIds = suiteIds;
  try {
    localStorage.setItem(SUITE_STORAGE_KEY, JSON.stringify(suiteIds));
  } catch {
    /* ignore */
  }
  updateSuiteSnapshot();
  _suiteListeners.forEach((cb) => cb());
}

export function toggleSelectedSuiteId(suiteId: string): void {
  const idx = _selectedSuiteIds.indexOf(suiteId);
  let next: string[];
  if (idx >= 0) {
    next = _selectedSuiteIds.filter((id) => id !== suiteId);
  } else {
    next = [..._selectedSuiteIds, suiteId];
  }
  setSelectedSuiteIds(next);
}

export function subscribeToSelectedSuites(cb: () => void): () => void {
  _suiteListeners.add(cb);
  return () => _suiteListeners.delete(cb);
}

// ── Combined filter subscription ─────────────────────────────────────
export function subscribeToFilters(cb: () => void): () => void {
  _envListeners.add(cb);
  _suiteListeners.add(cb);
  return () => {
    _envListeners.delete(cb);
    _suiteListeners.delete(cb);
  };
}

// ── Layout public API ────────────────────────────────────────────────
export function getLayoutSettings(): LayoutSettings {
  return _layout;
}

export function getLayoutSnapshot(): LayoutSettings {
  return _layoutSnapshot;
}

export function setLayoutSettings(partial: Partial<LayoutSettings>): void {
  _layout = { ..._layout, ...partial };
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(_layout));
  } catch {
    /* ignore */
  }
  updateLayoutSnapshot();
  _layoutListeners.forEach((cb) => cb());
}

export function subscribeToLayout(cb: () => void): () => void {
  _layoutListeners.add(cb);
  return () => _layoutListeners.delete(cb);
}

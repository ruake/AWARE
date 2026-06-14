const STORAGE_KEY = "aware-selected-env-v2";
const _listeners = new Set<() => void>();

let _selectedEnvIds: string[] = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
})();

let _snapshot = { envIds: _selectedEnvIds };

function updateSnapshot(): void {
  _snapshot = { envIds: _selectedEnvIds };
}

function notify(): void {
  _listeners.forEach((cb) => cb());
}

export function getSelectedEnvIds(): string[] {
  return _selectedEnvIds;
}

export function getSelectedEnvSnapshot(): { envIds: string[] } {
  return _snapshot;
}

export function setSelectedEnvIds(envIds: string[]): void {
  _selectedEnvIds = envIds;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envIds));
  } catch {
    /* ignore */
  }
  updateSnapshot();
  notify();
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
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

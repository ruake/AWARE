let _envIds: string[] = [];
const _listeners = new Set<() => void>();

export function getSelectedEnvIds(): string[] {
  return _envIds;
}

export function setSelectedEnvIds(ids: string[]): void {
  _envIds = ids;
  localStorage.setItem('aware-selected-env-v2', JSON.stringify(ids));
  _listeners.forEach(fn => fn());
}

export function toggleSelectedEnvId(id: string): void {
  if (_envIds.includes(id)) {
    _envIds = _envIds.filter(e => e !== id);
  } else {
    _envIds = [..._envIds, id];
  }
  localStorage.setItem('aware-selected-env-v2', JSON.stringify(_envIds));
  _listeners.forEach(fn => fn());
}

export function subscribeToSelectedEnv(cb: () => void): () => void {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

export function getSelectedEnvSnapshot(): { envIds: string[] } {
  return { envIds: _envIds };
}

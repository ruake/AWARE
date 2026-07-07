import { loadAllData } from "./initData";

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastUpdate: Date | null = null;
let _enabled = false;
let _configIntervalMs = 300000;
const _listeners = new Set<() => void>();

function notify(): void {
  _listeners.forEach((cb) => cb());
}

function clearIntervalIfNeeded(): void {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

function startInterval(): void {
  clearIntervalIfNeeded();
  _intervalId = setInterval(async () => {
    try {
      await loadAllData(true);
      _lastUpdate = new Date();
      notify();
    } catch {
      /* ignore */
    }
  }, _configIntervalMs);
}

export function startAutoRefresh(intervalMs: number = 300000): () => void {
  _configIntervalMs = intervalMs;
  _enabled = true;
  startInterval();
  notify();
  return () => stopAutoRefresh();
}

export function stopAutoRefresh(): void {
  _enabled = false;
  clearIntervalIfNeeded();
  notify();
}

export function pauseAutoRefresh(): void {
  clearIntervalIfNeeded();
  notify();
}

export function resumeAutoRefresh(): void {
  if (_enabled) {
    startInterval();
    notify();
  }
}

export function getAutoRefreshState(): { enabled: boolean; lastUpdate: Date | null } {
  return { enabled: _enabled, lastUpdate: _lastUpdate };
}

export function subscribeToAutoRefresh(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseAutoRefresh();
    } else {
      resumeAutoRefresh();
    }
  });
}

import type { SchedulerStatus } from "./types";
import { fetchJson } from "./dataFetcher";

let _cached: SchedulerStatus = {
  lastRun: null,
  lastRunBy: null,
  status: "healthy",
  suites: [],
  recentDispatches: [],
  summary: { total: 0, scheduled: 0, due: 0, dispatched: 0, running: 0 },
};
let _loaded = false;
const _listeners = new Set<() => void>();

export async function loadSchedulerStatus(): Promise<void> {
  if (_loaded) return;
  _loaded = true;
  try {
    const data = await fetchJson<SchedulerStatus>("scheduler-status.json");
    if (!data) return;
    _cached = {
      ...data,
      lastRun: data.lastRun ?? null,
      lastRunBy: data.lastRunBy ?? null,
      status: data.status ?? "healthy",
      summary: data.summary ?? _cached.summary,
      suites: data.suites ? [...data.suites] : [],
      recentDispatches: data.recentDispatches ? [...data.recentDispatches] : [],
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[AWARE] scheduler-status.json unavailable — using defaults.", err);
    }
  }
}

export function getSchedulerStatus(): SchedulerStatus {
  return _cached;
}

export function refreshSchedulerStatus(status: SchedulerStatus): void {
  _cached = status;
  _listeners.forEach((cb) => cb());
}

export function subscribeToSchedulerStatus(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

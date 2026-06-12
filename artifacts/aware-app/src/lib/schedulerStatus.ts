import type { SchedulerStatus } from "./types";
import schedulerStatusSeed from "@/data/scheduler-status.json";

const _initial = schedulerStatusSeed as unknown as SchedulerStatus;

let _cached: SchedulerStatus = {
  ..._initial,
  suites: [..._initial.suites],
  recentDispatches: [..._initial.recentDispatches],
};
const _listeners = new Set<() => void>();

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

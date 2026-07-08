import { fetchJson } from "@/lib/dataFetcher";

export interface SchedulerSuite {
  id: string;
  name: string;
  schedule: string | null;
  scheduleDesc: string | null;
  due: boolean;
  lastDispatched: string | null;
  lastConclusion: string | null;
  lastRunUrl: string | null;
  activeRuns: number;
  status: string;
  nextDue: string | null;
  environments: string[];
  runners: string[];
}

export interface SchedulerStatus {
  lastRun: string | null;
  lastRunBy: string | null;
  status: string;
  suites: SchedulerSuite[];
  recentDispatches: unknown[];
  summary: {
    total: number;
    scheduled: number;
    due: number;
    dispatched: number;
    running: number;
  };
}

let _status: SchedulerStatus | null = null;
let _loaded = false;

export async function loadSchedulerStatus(): Promise<void> {
  if (_loaded) return;
  try {
    _status = await fetchJson<SchedulerStatus>("scheduler-status.json");
  } catch {
    _status = null;
  }
  _loaded = true;
}

export function getSchedulerStatus(): SchedulerStatus | null {
  return _status;
}

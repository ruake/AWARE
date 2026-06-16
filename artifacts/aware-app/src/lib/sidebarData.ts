export interface CompareStat {
  label: string;
  value: string | number;
  color: string;
  key: string;
  count: number;
}

export interface TestDetailStat {
  passRate: number;
  flakinessScore: number;
  avgDuration: number;
  failCount: number;
  errorCount: number;
}

interface Store {
  compare: { stats: CompareStat[]; activeFilter: string | null };
  testAnalytics: { detail: TestDetailStat | null; hStatus: string };
}

const store: Store = {
  compare: { stats: [], activeFilter: null },
  testAnalytics: { detail: null, hStatus: "all" },
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function setCompareStats(stats: CompareStat[], activeFilter: string | null) {
  store.compare = { stats, activeFilter };
  notify();
}

export function getCompareStats(): Store["compare"] {
  return store.compare;
}

export function setTestDetailStat(detail: TestDetailStat | null, hStatus: string) {
  store.testAnalytics = { detail, hStatus };
  notify();
}

export function getTestDetailStat(): Store["testAnalytics"] {
  return store.testAnalytics;
}

export function subscribeToSidebarData(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

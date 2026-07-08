import { fetchJson } from './dataFetcher';
import type { Run } from './types';

let cache: Run[] | null = null;
const listeners = new Set<() => void>();

export async function loadRuns(): Promise<Run[]> {
  if (cache) return cache;
  const data = await fetchJson<Run[]>('runs.json');
  cache = data;
  listeners.forEach(fn => fn());
  return data;
}

export function getRuns(): Run[] {
  return cache ?? [];
}

export function subscribeRuns(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

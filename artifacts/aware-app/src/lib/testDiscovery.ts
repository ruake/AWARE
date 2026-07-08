import { fetchJson } from './dataFetcher';
import type { TestCase } from './types';

let cache: Record<string, TestCase> | null = null;

export async function loadTestDiscovery(): Promise<void> {
  if (cache) return;
  const data = await fetchJson<Record<string, TestCase>>('auto-tests.json');
  cache = data;
}

export function getAutoDiscoveredTests(): Record<string, TestCase> {
  return cache ?? {};
}

export function getAutoDiscoverySummary(): { total: number; pytest: number; playwright: number } {
  if (!cache) return { total: 0, pytest: 0, playwright: 0 };
  const tests = Object.values(cache);
  return {
    total: tests.length,
    pytest: tests.filter(t => t.fileType === 'pytest').length,
    playwright: tests.filter(t => t.fileType === 'playwright').length,
  };
}

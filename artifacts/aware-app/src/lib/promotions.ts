import { fetchJson } from './dataFetcher';
import type { PromotionDecision } from './types';

let cache: PromotionDecision[] | null = null;
let listeners = new Set<() => void>();

export async function loadPromotions(): Promise<PromotionDecision[]> {
  if (cache) return cache;
  try {
    const data = await fetchJson<PromotionDecision[]>('promotions.json');
    cache = data;
    listeners.forEach(fn => fn());
    return data;
  } catch {
    cache = [];
    listeners.forEach(fn => fn());
    return [];
  }
}

export function getPromotions(): PromotionDecision[] {
  return cache ?? [];
}

export function getPromotionDecision(id: string): PromotionDecision | undefined {
  return (cache ?? []).find(d => d.id === id);
}

export function subscribePromotions(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function resetPromotions(): void {
  cache = null;
  listeners = new Set();
}

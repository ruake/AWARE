import type { PromotionDecision } from "./types";
import { fetchJson } from "./dataFetcher";

let _promotionDecisions: PromotionDecision[] = [];
let _promotionsSnapshot: PromotionDecision[] = [];
let _promotionsLoaded = false;
const _listeners = new Set<() => void>();

function notify(): void {
  _listeners.forEach((cb) => cb());
}

function updateSnapshot(): void {
  _promotionsSnapshot = [..._promotionDecisions];
}

export function subscribeToPromotions(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

export async function loadPromotions(): Promise<void> {
  if (_promotionsLoaded) return;
  _promotionsLoaded = true;
  try {
    _promotionDecisions = await fetchJson<PromotionDecision[]>("promotions.json");
    updateSnapshot();
    notify();
  } catch {
    /* fetch failed, keep defaults */
  }
}

export function getPromotionDecision(runId: string): PromotionDecision | undefined {
  return _promotionDecisions.find((d) => d.runId === runId);
}

export function getAllPromotionDecisions(): PromotionDecision[] {
  return _promotionsSnapshot;
}

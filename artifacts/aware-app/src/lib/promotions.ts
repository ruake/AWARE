import { logWarn } from "./ai/debugLogger";
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
    _promotionDecisions = (await fetchJson<PromotionDecision[]>("promotions.json")) || [];
    updateSnapshot();
    notify();
  } catch (err) {
    logWarn("promotions", "promotions.json failed to load — promotion gate data unavailable", String(err));
  }
}

export function getPromotionDecision(runId: string): PromotionDecision | undefined {
  return _promotionDecisions.find((d) => d.runId === runId);
}

export function getAllPromotionDecisions(): PromotionDecision[] {
  return _promotionsSnapshot;
}

export function setPromotionDecision(runId: string, decision: PromotionDecision["decision"]): void {
  const existingIndex = _promotionDecisions.findIndex((d) => d.runId === runId);
  if (existingIndex >= 0) {
    _promotionDecisions[existingIndex] = {
      ..._promotionDecisions[existingIndex],
      decision,
      decidedAt: new Date().toISOString(),
      decidedBy: "User (Command)",
    };
  } else {
    _promotionDecisions.push({
      runId,
      decision,
      decidedAt: new Date().toISOString(),
      decidedBy: "User (Command)",
    });
  }
  updateSnapshot();
  notify();
}

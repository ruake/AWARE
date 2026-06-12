import type { PromotionDecision } from "./types";
import { fetchJson } from "./dataFetcher";

let _promotionDecisions: PromotionDecision[] = [];
let _promotionsLoaded = false;

export async function loadPromotions(): Promise<void> {
  if (_promotionsLoaded) return;
  _promotionsLoaded = true;
  _promotionDecisions = await fetchJson<PromotionDecision[]>("promotions.json");
}

export function getPromotionDecision(runId: string): PromotionDecision | undefined {
  return _promotionDecisions.find((d) => d.runId === runId);
}

export function getAllPromotionDecisions(): PromotionDecision[] {
  return [..._promotionDecisions];
}

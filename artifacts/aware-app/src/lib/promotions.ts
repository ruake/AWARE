import type { PromotionDecision } from "./types";
import { LS_DECISIONS_KEY, loadFromStorage, saveToStorage } from "./store";

let promotionDecisions: PromotionDecision[] = loadFromStorage<PromotionDecision>(LS_DECISIONS_KEY, []);

export function resetPromotionDecisions(): void {
  promotionDecisions = [];
  saveToStorage(LS_DECISIONS_KEY, promotionDecisions);
}

export function getPromotionDecision(runId: string): PromotionDecision | undefined {
  return promotionDecisions.find(d => d.runId === runId);
}

export function setPromotionDecision(decision: PromotionDecision): void {
  const idx = promotionDecisions.findIndex(d => d.runId === decision.runId);
  if (idx >= 0) promotionDecisions[idx] = decision;
  else promotionDecisions.push(decision);
  saveToStorage(LS_DECISIONS_KEY, promotionDecisions);
}

export function getAllPromotionDecisions(): PromotionDecision[] {
  return [...promotionDecisions];
}

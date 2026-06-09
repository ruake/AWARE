import type { PromotionDecision } from "./types";

const promotionDecisions: PromotionDecision[] = [];

export function getPromotionDecision(runId: string): PromotionDecision | undefined {
  return promotionDecisions.find(d => d.runId === runId);
}

export function getAllPromotionDecisions(): PromotionDecision[] {
  return [...promotionDecisions];
}

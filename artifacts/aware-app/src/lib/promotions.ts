import type { PromotionDecision } from "./types";
import promotionsSeed from "@/data/promotions.json";

const promotionDecisions: PromotionDecision[] = promotionsSeed as PromotionDecision[];

export function getPromotionDecision(runId: string): PromotionDecision | undefined {
  return promotionDecisions.find((d) => d.runId === runId);
}

export function getAllPromotionDecisions(): PromotionDecision[] {
  return [...promotionDecisions];
}

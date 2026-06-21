import { DataLoader } from "./base";
import { loadPromotions } from "../promotions";
import type { PromotionDecision } from "../types";

export class PromotionsLoader extends DataLoader<PromotionDecision[]> {
  constructor() {
    super({ name: "PromotionsLoader", required: false });
  }

  protected async doLoad(): Promise<PromotionDecision[]> {
    await loadPromotions();
    const { getAllPromotionDecisions } = await import("../promotions");
    return getAllPromotionDecisions();
  }
}

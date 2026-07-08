import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PromotionDecision } from "@/lib/types";

vi.mock("@/lib/dataFetcher", () => ({
  fetchJson: vi.fn(),
}));

import { fetchJson } from "@/lib/dataFetcher";
import {
  getPromotions,
  subscribePromotions,
  loadPromotions,
  resetPromotions,
} from "@/lib/promotions";

function makeDecision(overrides: Partial<PromotionDecision> & { id: string }): PromotionDecision {
  return {
    fromEnv: "UAT",
    toEnv: "PROD",
    passRate: 97,
    threshold: 95,
    approved: true,
    timestamp: "2026-06-01T10:00:00Z",
    triggeredBy: "ci",
    ...overrides,
  };
}

describe("promotions store", () => {
  beforeEach(() => {
    resetPromotions();
    vi.mocked(fetchJson).mockReset();
  });

  describe("after loadPromotions()", () => {
    it("getPromotions returns loaded data", async () => {
      const decisions = [makeDecision({ id: "r1" }), makeDecision({ id: "r2" })];
      vi.mocked(fetchJson).mockResolvedValue(decisions);
      await loadPromotions();
      expect(getPromotions()).toHaveLength(2);
    });

    it("find a decision by id", async () => {
      const decisions = [makeDecision({ id: "run_abc", passRate: 98 })];
      vi.mocked(fetchJson).mockResolvedValue(decisions);
      await loadPromotions();
      const d = getPromotions().find(d => d.id === "run_abc");
      expect(d).toBeDefined();
      expect(d!.passRate).toBe(98);
    });

    it("returns undefined for unknown id", async () => {
      vi.mocked(fetchJson).mockResolvedValue([makeDecision({ id: "r1" })]);
      await loadPromotions();
      expect(getPromotions().find(d => d.id === "does-not-exist")).toBeUndefined();
    });

    it("loadPromotions is idempotent — calls fetchJson only once", async () => {
      vi.mocked(fetchJson).mockResolvedValue([]);
      await loadPromotions();
      await loadPromotions();
      expect(fetchJson).toHaveBeenCalledTimes(1);
    });

    it("notifies subscribers after load", async () => {
      const decisions = [makeDecision({ id: "r1" })];
      vi.mocked(fetchJson).mockResolvedValue(decisions);
      const cb = vi.fn();
      subscribePromotions(cb);
      await loadPromotions();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("subscribePromotions returns unsubscribe function", async () => {
      vi.mocked(fetchJson).mockResolvedValue([makeDecision({ id: "r1" })]);
      const cb = vi.fn();
      const unsub = subscribePromotions(cb);
      unsub();
      await loadPromotions();
      expect(cb).not.toHaveBeenCalled();
    });

    it("approved decision has passRate >= threshold", async () => {
      const decisions = [makeDecision({ id: "r_approved", passRate: 97, threshold: 95, approved: true })];
      vi.mocked(fetchJson).mockResolvedValue(decisions);
      await loadPromotions();
      const d = getPromotions().find(d => d.id === "r_approved");
      expect(d!.approved).toBe(true);
      expect(d!.passRate).toBeGreaterThanOrEqual(d!.threshold);
    });

    it("handles fetch failure gracefully — returns empty array", async () => {
      vi.mocked(fetchJson).mockRejectedValue(new Error("Network error"));
      await loadPromotions();
      expect(getPromotions()).toEqual([]);
    });
  });

  describe("before loadPromotions()", () => {
    it("getPromotions returns empty array", () => {
      expect(getPromotions()).toEqual([]);
    });

    it("finding a decision returns undefined", () => {
      expect(getPromotions().find(d => d.id === "r1")).toBeUndefined();
    });
  });
});

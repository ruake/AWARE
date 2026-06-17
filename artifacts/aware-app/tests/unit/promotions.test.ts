import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PromotionDecision } from "@/lib/types";

vi.mock("@/lib/dataFetcher", () => ({
  fetchJson: vi.fn(),
}));

import { fetchJson } from "@/lib/dataFetcher";
import {
  getPromotionDecision,
  getAllPromotionDecisions,
  subscribeToPromotions,
  loadPromotions,
} from "@/lib/promotions";

function makeDecision(overrides: Partial<PromotionDecision> & { runId: string }): PromotionDecision {
  return {
    fromEnv: "UAT",
    toEnv: "PROD",
    passPct: 97,
    threshold: 95,
    approved: true,
    timestamp: "2026-06-01T10:00:00Z",
    ...overrides,
  };
}

describe("promotions store", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.mocked(fetchJson).mockReset();
  });

  describe("after loadPromotions()", () => {
    it("getAllPromotionDecisions returns loaded data", async () => {
      const decisions = [makeDecision({ runId: "r1" }), makeDecision({ runId: "r2" })];
      vi.mocked(fetchJson).mockResolvedValue(decisions);
      const { loadPromotions: load, getAllPromotionDecisions: getAll } = await import("@/lib/promotions");
      await load();
      expect(getAll()).toHaveLength(2);
    });

    it("getPromotionDecision finds a decision by runId", async () => {
      const decisions = [makeDecision({ runId: "run_abc", passPct: 98 })];
      vi.mocked(fetchJson).mockResolvedValue(decisions);
      const { loadPromotions: load, getPromotionDecision: getDecision } = await import("@/lib/promotions");
      await load();
      const d = getDecision("run_abc");
      expect(d).toBeDefined();
      expect(d!.passPct).toBe(98);
    });

    it("getPromotionDecision returns undefined for unknown runId", async () => {
      vi.mocked(fetchJson).mockResolvedValue([makeDecision({ runId: "r1" })]);
      const { loadPromotions: load, getPromotionDecision: getDecision } = await import("@/lib/promotions");
      await load();
      expect(getDecision("does-not-exist")).toBeUndefined();
    });

    it("loadPromotions is idempotent — calls fetchJson only once", async () => {
      vi.mocked(fetchJson).mockResolvedValue([]);
      const { loadPromotions: load } = await import("@/lib/promotions");
      await load();
      await load();
      expect(fetchJson).toHaveBeenCalledTimes(1);
    });

    it("notifies subscribers after load", async () => {
      const decisions = [makeDecision({ runId: "r1" })];
      vi.mocked(fetchJson).mockResolvedValue(decisions);
      const { loadPromotions: load, subscribeToPromotions: subscribe } = await import("@/lib/promotions");
      const cb = vi.fn();
      subscribe(cb);
      await load();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("subscribeToPromotions returns unsubscribe function", async () => {
      vi.mocked(fetchJson).mockResolvedValue([makeDecision({ runId: "r1" })]);
      const { loadPromotions: load, subscribeToPromotions: subscribe } = await import("@/lib/promotions");
      const cb = vi.fn();
      const unsub = subscribe(cb);
      unsub();
      await load();
      expect(cb).not.toHaveBeenCalled();
    });

    it("approved decision has passPct >= threshold", async () => {
      const decisions = [makeDecision({ runId: "r_approved", passPct: 97, threshold: 95, approved: true })];
      vi.mocked(fetchJson).mockResolvedValue(decisions);
      const { loadPromotions: load, getPromotionDecision: getDecision } = await import("@/lib/promotions");
      await load();
      const d = getDecision("r_approved");
      expect(d!.approved).toBe(true);
      expect(d!.passPct).toBeGreaterThanOrEqual(d!.threshold);
    });

    it("handles fetch failure gracefully — returns empty array", async () => {
      vi.mocked(fetchJson).mockRejectedValue(new Error("Network error"));
      const { loadPromotions: load, getAllPromotionDecisions: getAll } = await import("@/lib/promotions");
      await load();
      expect(getAll()).toEqual([]);
    });
  });

  describe("before loadPromotions()", () => {
    it("getAllPromotionDecisions returns empty array", async () => {
      const { getAllPromotionDecisions: getAll } = await import("@/lib/promotions");
      expect(getAll()).toEqual([]);
    });

    it("getPromotionDecision returns undefined", async () => {
      const { getPromotionDecision: getDecision } = await import("@/lib/promotions");
      expect(getDecision("r1")).toBeUndefined();
    });
  });
});

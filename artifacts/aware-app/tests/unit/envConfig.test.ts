import { describe, it, expect } from "vitest";
import {
  getEnvConfigById,
  getEnvByTierAndNetwork,
  envIdToLabel,
  labelToEnvId,
  getEnvConfigs,
  getEnvLabels,
  getEnvConfig,
} from "@/lib/envConfig";

describe("envConfig", () => {
  describe("getEnvConfigs", () => {
    it("returns all 6 environments", () => {
      const configs = getEnvConfigs();
      expect(configs).toHaveLength(6);
    });
  });

  describe("getEnvLabels", () => {
    it("returns all 6 labels", () => {
      const labels = getEnvLabels();
      expect(labels).toHaveLength(6);
      expect(labels).toContain("QA / Staging");
      expect(labels).toContain("PROD / Production");
    });
  });

  describe("getEnvConfig", () => {
    it("finds config by label", () => {
      const cfg = getEnvConfig("QA / Staging");
      expect(cfg).toBeDefined();
      expect(cfg!.id).toBe("qa_staging");
    });

    it("returns undefined for unknown label", () => {
      const cfg = getEnvConfig("Nonexistent");
      expect(cfg).toBeUndefined();
    });
  });

  describe("getEnvConfigById", () => {
    const ids = ["qa_staging", "qa_prod", "uat_staging", "uat_prod", "prod_staging", "prod_prod"];

    it("returns a config for each valid id", () => {
      for (const id of ids) {
        const cfg = getEnvConfigById(id);
        expect(cfg).toBeDefined();
        expect(cfg!.id).toBe(id);
      }
    });

    it("returns config with correct target and network for qa_staging", () => {
      const cfg = getEnvConfigById("qa_staging");
      expect(cfg!.target).toBe("QA");
      expect(cfg!.network).toBe("staging");
    });

    it("returns config with correct target and network for qa_prod", () => {
      const cfg = getEnvConfigById("qa_prod");
      expect(cfg!.target).toBe("QA");
      expect(cfg!.network).toBe("production");
    });

    it("returns config with correct target and network for uat_staging", () => {
      const cfg = getEnvConfigById("uat_staging");
      expect(cfg!.target).toBe("UAT");
      expect(cfg!.network).toBe("staging");
    });

    it("returns config with correct target and network for uat_prod", () => {
      const cfg = getEnvConfigById("uat_prod");
      expect(cfg!.target).toBe("UAT");
      expect(cfg!.network).toBe("production");
    });

    it("returns config with correct target and network for prod_staging", () => {
      const cfg = getEnvConfigById("prod_staging");
      expect(cfg!.target).toBe("PROD");
      expect(cfg!.network).toBe("staging");
    });

    it("returns config with correct target and network for prod_prod", () => {
      const cfg = getEnvConfigById("prod_prod");
      expect(cfg!.target).toBe("PROD");
      expect(cfg!.network).toBe("production");
    });

    it("returns undefined for unknown id", () => {
      const cfg = getEnvConfigById("invalid_env");
      expect(cfg).toBeUndefined();
    });
  });

  describe("getEnvByTierAndNetwork", () => {
    it("finds QA / staging", () => {
      const cfg = getEnvByTierAndNetwork("QA", "staging");
      expect(cfg!.id).toBe("qa_staging");
    });

    it("finds QA / production", () => {
      const cfg = getEnvByTierAndNetwork("QA", "production");
      expect(cfg!.id).toBe("qa_prod");
    });

    it("finds UAT / staging", () => {
      const cfg = getEnvByTierAndNetwork("UAT", "staging");
      expect(cfg!.id).toBe("uat_staging");
    });

    it("finds UAT / production", () => {
      const cfg = getEnvByTierAndNetwork("UAT", "production");
      expect(cfg!.id).toBe("uat_prod");
    });

    it("finds PROD / staging", () => {
      const cfg = getEnvByTierAndNetwork("PROD", "staging");
      expect(cfg!.id).toBe("prod_staging");
    });

    it("finds PROD / production", () => {
      const cfg = getEnvByTierAndNetwork("PROD", "production");
      expect(cfg!.id).toBe("prod_prod");
    });

    it("returns undefined for unknown tier", () => {
      const cfg = getEnvByTierAndNetwork("DEV" as any, "staging");
      expect(cfg).toBeUndefined();
    });

    it("returns undefined for unknown network", () => {
      const cfg = getEnvByTierAndNetwork("QA", "dr" as any);
      expect(cfg).toBeUndefined();
    });
  });

  describe("envIdToLabel", () => {
    it("maps qa_staging to QA / Staging", () => {
      expect(envIdToLabel("qa_staging")).toBe("QA / Staging");
    });

    it("maps qa_prod to QA / Production", () => {
      expect(envIdToLabel("qa_prod")).toBe("QA / Production");
    });

    it("maps uat_staging to UAT / Staging", () => {
      expect(envIdToLabel("uat_staging")).toBe("UAT / Staging");
    });

    it("maps uat_prod to UAT / Production", () => {
      expect(envIdToLabel("uat_prod")).toBe("UAT / Production");
    });

    it("maps prod_staging to PROD / Staging", () => {
      expect(envIdToLabel("prod_staging")).toBe("PROD / Staging");
    });

    it("maps prod_prod to PROD / Production", () => {
      expect(envIdToLabel("prod_prod")).toBe("PROD / Production");
    });

    it("falls back to the raw id for unknown envId", () => {
      expect(envIdToLabel("bogus" as any)).toBe("bogus");
    });
  });

  describe("labelToEnvId", () => {
    it("maps QA / Staging to qa_staging", () => {
      expect(labelToEnvId("QA / Staging")).toBe("qa_staging");
    });

    it("maps QA / Production to qa_prod", () => {
      expect(labelToEnvId("QA / Production")).toBe("qa_prod");
    });

    it("maps UAT / Staging to uat_staging", () => {
      expect(labelToEnvId("UAT / Staging")).toBe("uat_staging");
    });

    it("maps UAT / Production to uat_prod", () => {
      expect(labelToEnvId("UAT / Production")).toBe("uat_prod");
    });

    it("maps PROD / Staging to prod_staging", () => {
      expect(labelToEnvId("PROD / Staging")).toBe("prod_staging");
    });

    it("maps PROD / Production to prod_prod", () => {
      expect(labelToEnvId("PROD / Production")).toBe("prod_prod");
    });

    it("returns undefined for unknown label", () => {
      expect(labelToEnvId("Bogus")).toBeUndefined();
    });
  });
});

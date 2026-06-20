import { describe, it, expect } from "vitest";
import {
  getEnvConfigs,
  getEnvLabels,
  getEnvConfig,
  getEnvConfigById,
  getEnvByTierAndNetwork,
  envIdToLabel,
  labelToEnvId,
  ENV_CONFIGS,
} from "../envConfig";

describe("getEnvConfigs", () => {
  it("returns all 6 environment configs", () => {
    const configs = getEnvConfigs();
    expect(configs).toHaveLength(6);
  });

  it("returns configs with correct IDs", () => {
    const ids = getEnvConfigs().map((c) => c.id);
    expect(ids).toEqual([
      "qa_staging",
      "qa_prod",
      "uat_staging",
      "uat_prod",
      "prod_staging",
      "prod_prod",
    ]);
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
  it("finds env config by label", () => {
    const qaStaging = getEnvConfig("QA / Staging");
    expect(qaStaging).toBeDefined();
    expect(qaStaging?.id).toBe("qa_staging");
    expect(qaStaging?.target).toBe("QA");
    expect(qaStaging?.network).toBe("staging");
  });

  it("returns undefined for unknown label", () => {
    const result = getEnvConfig("Non Existent" as any);
    expect(result).toBeUndefined();
  });
});

describe("getEnvConfigById", () => {
  it("finds env config by id", () => {
    const prodProd = getEnvConfigById("prod_prod");
    expect(prodProd).toBeDefined();
    expect(prodProd?.label).toBe("PROD / Production");
    expect(prodProd?.target).toBe("PROD");
    expect(prodProd?.network).toBe("production");
  });

  it("returns PROD staging with 3 IPs", () => {
    const prodStaging = getEnvConfigById("prod_staging");
    expect(prodStaging?.ips).toHaveLength(3);
  });

  it("PROD envs have 3 IPs, others have 2", () => {
    const configs = getEnvConfigs();
    for (const c of configs) {
      if (c.target === "PROD") {
        expect(c.ips).toHaveLength(3);
      } else {
        expect(c.ips).toHaveLength(2);
      }
    }
  });

  it("returns undefined for unknown id", () => {
    const result = getEnvConfigById("invalid_id");
    expect(result).toBeUndefined();
  });
});

describe("getEnvByTierAndNetwork", () => {
  it("finds QA staging env", () => {
    const result = getEnvByTierAndNetwork("QA", "staging");
    expect(result?.id).toBe("qa_staging");
  });

  it("finds PROD production env", () => {
    const result = getEnvByTierAndNetwork("PROD", "production");
    expect(result?.id).toBe("prod_prod");
  });

  it("returns undefined for invalid tier", () => {
    const result = getEnvByTierAndNetwork("INVALID" as any, "production");
    expect(result).toBeUndefined();
  });

  it("returns undefined for invalid network", () => {
    const result = getEnvByTierAndNetwork("QA", "invalid" as any);
    expect(result).toBeUndefined();
  });

  it("handles nullish inputs gracefully", () => {
    const result = getEnvByTierAndNetwork(undefined as any, undefined as any);
    expect(result).toBeUndefined();
  });
});

describe("envIdToLabel", () => {
  it("maps valid env IDs to labels", () => {
    expect(envIdToLabel("qa_staging")).toBe("QA / Staging");
    expect(envIdToLabel("qa_prod")).toBe("QA / Production");
    expect(envIdToLabel("uat_staging")).toBe("UAT / Staging");
    expect(envIdToLabel("uat_prod")).toBe("UAT / Production");
    expect(envIdToLabel("prod_staging")).toBe("PROD / Staging");
    expect(envIdToLabel("prod_prod")).toBe("PROD / Production");
  });

  it("returns the envId as-is for unknown IDs", () => {
    expect(envIdToLabel("unknown_env" as any)).toBe("unknown_env");
  });
});

describe("labelToEnvId", () => {
  it("maps valid labels to env IDs", () => {
    expect(labelToEnvId("QA / Staging")).toBe("qa_staging");
    expect(labelToEnvId("PROD / Production")).toBe("prod_prod");
  });

  it("returns undefined for unknown label", () => {
    expect(labelToEnvId("unknown label")).toBeUndefined();
  });
});

describe("ENV_CONFIGS (DEFAULT_ENVIRONMENTS)", () => {
  it("is the same array as getEnvConfigs()", () => {
    expect(ENV_CONFIGS).toBe(getEnvConfigs());
  });

  it("all configs have required fields", () => {
    for (const c of ENV_CONFIGS) {
      expect(c.id).toBeDefined();
      expect(c.label).toBeDefined();
      expect(c.target).toBeDefined();
      expect(c.stage).toBeDefined();
      expect(c.baseUrl).toBeDefined();
      expect(c.ips).toBeInstanceOf(Array);
      expect(c.network).toBeDefined();
      expect(c.property).toBeDefined();
      expect(c.propertyVersion).toBeTypeOf("number");
      expect(c.propertyStatus).toBeDefined();
      expect(c.cpcode).toBeDefined();
      expect(c.edgeHostname).toBeDefined();
    }
  });
});

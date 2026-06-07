import { describe, it, expect, beforeEach } from "vitest";
import {
  extractTestConfigFromMessage,
  savePendingTestConfig,
  getPendingTestConfig,
  encodeTestConfigForNav,
  decodeTestConfigFromNav,
  clearChatHistory,
  llmChat,
  setLLMConfig,
  getLLMConfig,
} from "./llm";
import "./skills";

beforeEach(() => {
  clearChatHistory();
  localStorage.clear();
  setLLMConfig({ provider: "mock" });
});

describe("extractTestConfigFromMessage", () => {
  it("extracts JSON between markers", () => {
    const content = `Here is the config:
---TEST_CONFIG_START---
{"name":"Cache HIT Test","category":"caching","priority":"P1","severity":"minor","status":"active"}
---TEST_CONFIG_END---
Review it and confirm.`;
    const config = extractTestConfigFromMessage(content);
    expect(config).not.toBeNull();
    expect(config!.name).toBe("Cache HIT Test");
    expect(config!.category).toBe("caching");
    expect(config!.priority).toBe("P1");
  });

  it("returns null when no markers present", () => {
    const result = extractTestConfigFromMessage("just a normal message");
    expect(result).toBeNull();
  });

  it("returns null for invalid JSON between markers", () => {
    const content = `---TEST_CONFIG_START---
{invalid json}
---TEST_CONFIG_END---`;
    const result = extractTestConfigFromMessage(content);
    expect(result).toBeNull();
  });

  it("returns null with only start marker", () => {
    const content = `---TEST_CONFIG_START---
{"name":"test"}`;
    const result = extractTestConfigFromMessage(content);
    expect(result).toBeNull();
  });

  it("handles empty JSON object", () => {
    const content = `---TEST_CONFIG_START---
{}
---TEST_CONFIG_END---`;
    const result = extractTestConfigFromMessage(content);
    expect(result).toEqual({});
  });
});

describe("savePendingTestConfig / getPendingTestConfig", () => {
  it("saves and retrieves config", () => {
    const config = { name: "Test", category: "caching", priority: "P1" };
    savePendingTestConfig(config);
    const retrieved = getPendingTestConfig();
    expect(retrieved).toEqual(config);
  });

  it("clears config after retrieval", () => {
    savePendingTestConfig({ name: "Test" });
    getPendingTestConfig();
    expect(getPendingTestConfig()).toBeNull();
  });

  it("returns null when no config stored", () => {
    expect(getPendingTestConfig()).toBeNull();
  });

  it("handles complex nested config", () => {
    const config = {
      name: "CDN Cache HIT Verification",
      description: "Validates edge cache behavior",
      category: "caching",
      priority: "P0",
      severity: "critical",
      status: "active",
      tags: ["caching", "cdn", "regression"],
      owner: "engineer@co.com",
      automated: true,
      predicates: [
        { id: "pred_0", type: "statusCode", field: "", expected: "200", operator: "equals" },
        { id: "pred_1", type: "responseTime", field: "duration", expected: "500", operator: "lt" },
      ],
    };
    savePendingTestConfig(config);
    const retrieved = getPendingTestConfig();
    expect(retrieved).toEqual(config);
    expect(Array.isArray(retrieved!.predicates)).toBe(true);
    expect(retrieved!.predicates).toHaveLength(2);
  });
});

describe("encode / decode test config for nav", () => {
  it("round-trips a config through encode/decode", () => {
    const config = { name: "Geo Routing Test", category: "routing", priority: "P2" };
    const encoded = encodeTestConfigForNav(config);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);
    const decoded = decodeTestConfigFromNav(encoded);
    expect(decoded).toEqual(config);
  });

  it("handles special characters", () => {
    const config = { name: "TLS 1.3 & QUIC Test", path: "/api/v1/data?env=prod" };
    const encoded = encodeTestConfigForNav(config);
    const decoded = decodeTestConfigFromNav(encoded);
    expect(decoded).toEqual(config);
  });
});

describe("llmChat with skill routing (mock)", () => {
  it("responds with form block on generate-tests request without details", async () => {
    const res = await llmChat("I need to create a test for CDN caching", "[SKILL:generate-tests]\nYou are a CDN test engineer.");
    expect(res.content).toContain("[FORM]");
    expect(res.finishReason).toBe("stop");
  });

  it("responds with test config on complete form submission", async () => {
    const formData = [
      "name: CDN Cache HIT Verification",
      "category: caching",
      "priority: P1",
      "severity: major",
      "expectedStatus: 200",
      "automated: true",
    ].join("\n");

    const res = await llmChat(formData, "[SKILL:generate-tests]\nYou are a CDN test engineer.");
    expect(res.content).toContain("---TEST_CONFIG_START---");
    expect(res.content).toContain("---TEST_CONFIG_END---");

    const config = extractTestConfigFromMessage(res.content);
    expect(config).not.toBeNull();
    expect(config!.name).toBe("CDN Cache HIT Verification");
    expect(config!.category).toBe("caching");
  });

  it("runs generate-script skill when [SKILL:generate-script] is set", async () => {
    const res = await llmChat("generate a script for cache HIT", "[SKILL:generate-script]\nYou are a test engineer.");
    expect(res.content).toContain("config:");
    expect(res.content).toContain("tests:");
  });

  it("runs analyze-results skill when [SKILL:analyze-results] is set", async () => {
    const res = await llmChat("my tests are failing", "[SKILL:analyze-results]\nYou are an analyst.");
    expect(res.content).toContain("Regression");
  });

  it("runs explain-diff skill when [SKILL:explain-diff] is set", async () => {
    const res = await llmChat("compare baseline vs candidate", "[SKILL:explain-diff]\nYou are a release engineer.");
    expect(res.content).toContain("Comparison");
  });

  it("runs generate-suite skill when [SKILL:generate-suite] is set", async () => {
    const res = await llmChat("create a suite for CDN", "[SKILL:generate-suite]\nYou are an infrastructure engineer.");
    expect(res.content).toContain("name:");
  });
});

describe("config persistence across chat", () => {
  it("matches the complete copilot flow: form → config → localStorage bridge", async () => {
    // Step 1: Send request → get form
    const formRes = await llmChat("Create a cache test", "[SKILL:generate-tests]\nYou are a CDN engineer.");
    expect(formRes.content).toContain("[FORM]");

    // Step 2: Submit form → get config
    const formData = [
      "name: CDN Cache HIT Verification",
      "category: caching",
      "priority: P0",
      "severity: critical",
      "expectedStatus: 200",
      "automated: true",
    ].join("\n");
    const configRes = await llmChat(formData, "[SKILL:generate-tests]\nYou are a CDN engineer.");
    expect(configRes.content).toContain("---TEST_CONFIG_START---");

    // Step 3: Extract config
    const config = extractTestConfigFromMessage(configRes.content);
    expect(config).not.toBeNull();

    // Step 4: Save via localStorage bridge (simulates what Copilot.tsx does)
    savePendingTestConfig(config!);

    // Step 5: Retrieve and verify it auto-clears
    const retrieved = getPendingTestConfig();
    expect(retrieved).toEqual(config);
    expect(getPendingTestConfig()).toBeNull();
  });
});

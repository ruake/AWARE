import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TestSuite, TestCase } from "@/lib/types";

vi.mock("@/lib/data", () => ({
  getTestSuites: vi.fn(),
  getTestCases: vi.fn(),
}));

vi.mock("@/lib/envConfig", () => ({
  getEnvConfigs: vi.fn(),
}));

import { getTestSuites, getTestCases } from "@/lib/data";
import { getEnvConfigs } from "@/lib/envConfig";
import { generateCiConfig } from "@/lib/ciConfig";
import type { EnvConfig } from "@/lib/envConfig";

function makeSuite(id: string, testIds: string[]): TestSuite {
  return {
    id,
    name: `Suite ${id}`,
    description: "",
    parentId: null,
    testIds,
    envIds: ["qa_staging"],
    schedule: "0 */6 * * *",
    enabled: true,
    tags: [],
  };
}

function makeTest(id: string, testType: "web" | "pytest" | "api", category: string): TestCase {
  return {
    id,
    name: `Test ${id}`,
    description: "",
    category,
    status: "active",
    priority: "high",
    severity: "high",
    tags: [],
    suiteIds: ["suite_a"],
    automated: true,
    owner: "team",
    testType,
    scriptPath: `tests/${id}.spec.ts`,
    version: 1,
    changelog: [],
  };
}

function makeEnvConfig(id: string): EnvConfig {
  return {
    id,
    label: `${id} label`,
    target: "QA" as any,
    network: "staging" as any,
    baseUrl: `https://${id}.example.com`,
    ips: [],
    property: "www.example.com",
    propertyVersion: 1,
    edgeHostname: "e.example.com",
    color: "#0ea5e9",
  };
}

beforeEach(() => {
  const tests = [
    makeTest("t1", "web", "Security"),
    makeTest("t2", "pytest", "Caching"),
    makeTest("t3", "web", "Security"),
    makeTest("t4", "api", "Geo-match"),
  ];
  const suites = [
    makeSuite("suite_a", ["t1", "t2"]),
    makeSuite("suite_b", ["t3", "t4"]),
  ];
  const envs = [
    makeEnvConfig("qa_staging"),
    makeEnvConfig("qa_prod"),
    makeEnvConfig("uat_staging"),
    makeEnvConfig("uat_prod"),
    makeEnvConfig("prod_staging"),
    makeEnvConfig("prod_prod"),
  ];
  vi.mocked(getTestSuites).mockReturnValue(suites);
  vi.mocked(getTestCases).mockReturnValue(tests);
  vi.mocked(getEnvConfigs).mockReturnValue(envs);
});

describe("generateCiConfig", () => {
  it("returns version '3.0'", () => {
    const config = generateCiConfig();
    expect(config.version).toBe("3.0");
  });

  it("includes project name referencing AWARE", () => {
    const config = generateCiConfig();
    expect(config.project).toContain("A.W.A.R.E");
  });

  it("suites array length matches number of test suites", () => {
    const config = generateCiConfig();
    expect(config.suites).toHaveLength(2);
  });

  it("each suite includes testCount matching its test members", () => {
    const config = generateCiConfig();
    const suiteA = config.suites.find((s) => s.name === "Suite suite_a")!;
    expect(suiteA.testCount).toBe(2);
  });

  it("suite runners include 'playwright' for web tests", () => {
    const config = generateCiConfig();
    const suiteA = config.suites.find((s) => s.name === "Suite suite_a")!;
    expect(suiteA.runners).toContain("playwright");
  });

  it("suite runners include 'pytest' for pytest tests", () => {
    const config = generateCiConfig();
    const suiteA = config.suites.find((s) => s.name === "Suite suite_a")!;
    expect(suiteA.runners).toContain("pytest");
  });

  it("deduplicates categories within each suite", () => {
    const config = generateCiConfig();
    const suiteA = config.suites.find((s) => s.name === "Suite suite_a")!;
    const uniqueCats = [...new Set(suiteA.categories)];
    expect(suiteA.categories).toEqual(uniqueCats);
  });

  it("environments array length matches number of env configs", () => {
    const config = generateCiConfig();
    expect(config.environments).toHaveLength(6);
  });

  it("each environment has label, target, and network", () => {
    const config = generateCiConfig();
    config.environments.forEach((env) => {
      expect(env).toHaveProperty("label");
      expect(env).toHaveProperty("target");
      expect(env).toHaveProperty("network");
    });
  });

  it("workflow references controller.yml", () => {
    const config = generateCiConfig();
    expect(config.workflow.file).toBe("controller.yml");
    expect(config.workflow.path).toContain("controller.yml");
  });

  it("runners specify playwright with chromium browser", () => {
    const config = generateCiConfig();
    expect(config.runners.playwright.browser).toBe("chromium");
  });

  it("runners specify pytest markers including smoke and regression", () => {
    const config = generateCiConfig();
    expect(config.runners.pytest.markers).toContain("smoke");
    expect(config.runners.pytest.markers).toContain("regression");
  });

  it("instructions mention the promotion gate threshold", () => {
    const config = generateCiConfig();
    expect(config.instructions).toContain("95%");
  });

  it("suite with no matching tests has testCount of 0", () => {
    vi.mocked(getTestCases).mockReturnValue([]);
    const config = generateCiConfig();
    config.suites.forEach((s) => expect(s.testCount).toBe(0));
  });

  it("omits ips field when env has no IPs", () => {
    const config = generateCiConfig();
    config.environments.forEach((env) => {
      expect(env.ips).toBeUndefined();
    });
  });
});

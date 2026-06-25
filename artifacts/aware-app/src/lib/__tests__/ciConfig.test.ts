import { describe, it, expect, beforeEach, vi } from "vitest";
import { generateCiConfig, generateCiConfigYaml, downloadCiConfig, PROMOTION_GATE_THRESHOLD } from "../ciConfig";

vi.mock("../data", () => ({
  getTestSuites: vi.fn(),
  getTestCases: vi.fn(),
}));

vi.mock("../envConfig", () => ({
  getEnvConfigs: vi.fn(),
}));

import { getTestSuites, getTestCases } from "../data";
import { getEnvConfigs } from "../envConfig";
import type { TestSuite, TestCase, EnvironmentConfig } from "../types";

const mockSuites: TestSuite[] = [
  {
    id: "suite_1",
    name: "Smoke Tests",
    description: "Quick smoke tests",
    parentId: null,
    testIds: ["test_1", "test_2"],
    envIds: ["qa_staging", "qa_prod"],
    runners: ["playwright"],
    config: { parallelism: 2, retries: 0, failFast: false, timeoutMinutes: 10 },
    tags: ["smoke"],
    schedule: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

const mockTestCases: TestCase[] = [
  {
    id: "test_1",
    name: "Test One",
    description: "First test",
    testType: "web",
    category: "caching",
    priority: "P0",
    severity: "critical",
    status: "active",
    tags: ["smoke"],
    owner: "team-a",
    suiteIds: ["suite_1"],
    automated: true,
    scriptPath: "tests/test-one.spec.ts",
    preconditions: "",
    expectedBehavior: "",
    documentation: "",
    relatedTestIds: [],
    requestHeaders: {},
    cookies: {},
    expectedStatus: 200,
    captureResponseHeaders: [],
    filmstrip: {
      enabled: false,
      mode: "screenshot",
      threshold: 0,
      captureOnFailure: true,
      maxFrames: 3,
    },
    predicates: [],
    config: {},
    assertions: [],
    version: 1,
    changelog: [],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "test_2",
    name: "Test Two",
    description: "Second test",
    testType: "pytest",
    category: "security",
    priority: "P1",
    severity: "major",
    status: "active",
    tags: ["regression"],
    owner: "team-b",
    suiteIds: ["suite_1"],
    automated: true,
    scriptPath: "tests/test-two.py",
    preconditions: "",
    expectedBehavior: "",
    documentation: "",
    relatedTestIds: [],
    requestHeaders: {},
    cookies: {},
    expectedStatus: 200,
    captureResponseHeaders: [],
    filmstrip: {
      enabled: false,
      mode: "screenshot",
      threshold: 0,
      captureOnFailure: true,
      maxFrames: 3,
    },
    predicates: [],
    config: {},
    assertions: [],
    version: 1,
    changelog: [],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

const mockEnvConfigs: EnvironmentConfig[] = [
  {
    id: "qa_staging",
    label: "QA / Staging",
    target: "QA",
    stage: "Staging",
    baseUrl: "https://example.com",
    ips: ["1.1.1.1"],
    network: "staging",
    property: "example.com",
    propertyVersion: 1,
    propertyStatus: "active",
    cpcode: "12345",
    edgeHostname: "example.com.edgekey.net",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  (getTestSuites as ReturnType<typeof vi.fn>).mockReturnValue(mockSuites);
  (getTestCases as ReturnType<typeof vi.fn>).mockReturnValue(mockTestCases);
  (getEnvConfigs as ReturnType<typeof vi.fn>).mockReturnValue(mockEnvConfigs);
});

describe("generateCiConfig", () => {
  it("returns a CI config with version 3.0", () => {
    const config = generateCiConfig();
    expect(config.version).toBe("3.0");
    expect(config.project).toContain("A.W.A.R.E.");
  });

  it("maps suite test counts correctly", () => {
    const config = generateCiConfig();
    expect(config.suites).toHaveLength(1);
    expect(config.suites[0].name).toBe("Smoke Tests");
    expect(config.suites[0].testCount).toBe(2);
  });

  it("maps suite test IDs", () => {
    const config = generateCiConfig();
    expect(config.suites[0].testIds).toEqual(["test_1", "test_2"]);
  });

  it("maps categories from suite test cases", () => {
    const config = generateCiConfig();
    expect(config.suites[0].categories).toEqual(["caching", "security"]);
  });

  it("maps runners from suite test types", () => {
    const config = generateCiConfig();
    expect(config.suites[0].runners).toContain("playwright");
    expect(config.suites[0].runners).toContain("pytest");
  });

  it("includes environment configs", () => {
    const config = generateCiConfig();
    expect(config.environments).toHaveLength(1);
    expect(config.environments[0].label).toBe("QA / Staging");
  });

  it("includes runner definitions", () => {
    const config = generateCiConfig();
    expect(config.runners.playwright.version).toBe("^1.60.0");
    expect(config.runners.pytest.version).toBe("^8.0");
    expect(config.runners.pytest.markers).toContain("smoke");
  });

  it("handles empty suites", () => {
    (getTestSuites as ReturnType<typeof vi.fn>).mockReturnValue([]);
    const config = generateCiConfig();
    expect(config.suites).toEqual([]);
  });

  it("includes promotionGate with correct threshold (critical business rule)", () => {
    const config = generateCiConfig();
    expect(config.promotionGate).toBeDefined();
    expect(config.promotionGate.threshold).toBe(PROMOTION_GATE_THRESHOLD);
    expect(config.promotionGate.threshold).toBe(0.95);
    expect(config.promotionGate.description).toContain("95%");
    expect(config.promotionGate.description).toContain("UAT");
    expect(config.promotionGate.description).toContain("PROD");
  });

  it("PROMOTION_GATE_THRESHOLD is exported and equals 0.95", () => {
    expect(PROMOTION_GATE_THRESHOLD).toBe(0.95);
  });

  it("maps 'http' and 'edgeworker' testTypes to pytest runner", () => {
    const suiteWithHttp: typeof mockSuites = [
      {
        ...mockSuites[0],
        testIds: ["test_http", "test_ew"],
      },
    ];
    const httpTests: TestCase[] = [
      { ...mockTestCases[0], id: "test_http", testType: "http" },
      { ...mockTestCases[0], id: "test_ew", testType: "edgeworker" },
    ];
    (getTestSuites as ReturnType<typeof vi.fn>).mockReturnValue(suiteWithHttp);
    (getTestCases as ReturnType<typeof vi.fn>).mockReturnValue(httpTests);
    const config = generateCiConfig();
    expect(config.suites[0].runners).toContain("pytest");
    expect(config.suites[0].runners).not.toContain("playwright");
  });

  it("maps 'web' testType to playwright runner", () => {
    const webOnly: TestCase[] = [{ ...mockTestCases[0], id: "test_1", testType: "web" }];
    const suiteWebOnly = [{ ...mockSuites[0], testIds: ["test_1"] }];
    (getTestSuites as ReturnType<typeof vi.fn>).mockReturnValue(suiteWebOnly);
    (getTestCases as ReturnType<typeof vi.fn>).mockReturnValue(webOnly);
    const config = generateCiConfig();
    expect(config.suites[0].runners).toContain("playwright");
    expect(config.suites[0].runners).not.toContain("pytest");
  });

  it("handles empty test cases within a suite", () => {
    const suiteNoTests: TestSuite[] = [
      {
        ...mockSuites[0],
        testIds: [],
      },
    ];
    (getTestSuites as ReturnType<typeof vi.fn>).mockReturnValue(suiteNoTests);
    const config = generateCiConfig();
    expect(config.suites[0].testCount).toBe(0);
    expect(config.suites[0].testIds).toEqual([]);
    expect(config.suites[0].categories).toEqual([]);
    expect(config.suites[0].runners).toEqual([]);
  });
});

describe("generateCiConfigYaml", () => {
  it("returns a string prefixed with YAML header comment", () => {
    const yaml = generateCiConfigYaml();
    expect(yaml).toContain("# A.W.A.R.E. — Akamai CDN Regression Test Configuration");
    expect(yaml).toContain("version: '3.0'");
    expect(yaml).toContain("project:");
  });

  it("contains suites section", () => {
    const yaml = generateCiConfigYaml();
    expect(yaml).toContain("suites:");
    expect(yaml).toContain("Smoke Tests");
  });

  it("contains environments section", () => {
    const yaml = generateCiConfigYaml();
    expect(yaml).toContain("environments:");
    expect(yaml).toContain("QA / Staging");
  });

  it("contains instructions in the YAML header", () => {
    const yaml = generateCiConfigYaml();
    expect(yaml).toContain("INSTRUCTIONS");
    expect(yaml).toContain("gh workflow run");
  });
});

describe("downloadCiConfig", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("creates a download link with YAML blob", () => {
    const clickSpy = vi.fn();
    const createElement = vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: clickSpy,
    } as unknown as HTMLAnchorElement);

    const revokeSpy = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL: revokeSpy });

    const createObjectURLSpy = vi.fn().mockReturnValue("blob:url");
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeSpy,
    });

    downloadCiConfig();

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith("blob:url");

    vi.unstubAllGlobals();
  });
});

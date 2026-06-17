import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TestCase } from "@/lib/types";

vi.mock("@/lib/testDiscovery", () => ({
  getAutoDiscoveredTests: vi.fn(),
}));

vi.mock("@/lib/store", () => ({
  subscribeToTestCases: vi.fn(() => () => {}),
}));

import { getAutoDiscoveredTests } from "@/lib/testDiscovery";
import { getTestCasesByFilter, getTestCaseById, getTestChangelog, computeTestStats } from "@/lib/testCases";

function makeTestCase(overrides: Partial<TestCase> & { id: string }): TestCase {
  return {
    name: `Test ${overrides.id}`,
    description: `Description for ${overrides.id}`,
    category: "Security",
    status: "active",
    priority: "high",
    severity: "high",
    tags: [],
    suiteIds: ["suite_a"],
    automated: true,
    owner: "team-security",
    testType: "web",
    scriptPath: `tests/${overrides.id}.spec.ts`,
    version: 1,
    changelog: [],
    ...overrides,
  };
}

const TC1 = makeTestCase({ id: "tc1", name: "CSP header check", category: "Security", tags: ["csp"], priority: "high", status: "active" });
const TC2 = makeTestCase({ id: "tc2", name: "Cache hit ratio", category: "Caching", tags: ["cache", "perf"], priority: "medium", status: "active", automated: true });
const TC3 = makeTestCase({ id: "tc3", name: "Geo-match routing", category: "Geo-match", tags: ["geo"], priority: "low", status: "deprecated", automated: false, suiteIds: ["suite_b"] });
const TC4 = makeTestCase({ id: "tc4", name: "TLS enforcement", category: "Security", description: "Validates TLS 1.3", tags: ["tls", "security"], priority: "high", status: "active", version: 3 });

beforeEach(() => {
  vi.mocked(getAutoDiscoveredTests).mockReturnValue([TC1, TC2, TC3, TC4]);
});

describe("getTestCasesByFilter", () => {
  it("returns all tests when filter is empty", () => {
    const result = getTestCasesByFilter({ search: "", status: "", priority: "", category: "", tags: [], suiteId: "" });
    expect(result).toHaveLength(4);
  });

  it("filters by name search (case-insensitive)", () => {
    const result = getTestCasesByFilter({ search: "csp", status: "", priority: "", category: "", tags: [], suiteId: "" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("tc1");
  });

  it("filters by description search (case-insensitive)", () => {
    const result = getTestCasesByFilter({ search: "validates tls", status: "", priority: "", category: "", tags: [], suiteId: "" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("tc4");
  });

  it("search matches both name and description", () => {
    const result = getTestCasesByFilter({ search: "TLS", status: "", priority: "", category: "", tags: [], suiteId: "" });
    expect(result.map((t) => t.id)).toContain("tc4");
  });

  it("filters by status", () => {
    const result = getTestCasesByFilter({ search: "", status: "deprecated", priority: "", category: "", tags: [], suiteId: "" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("tc3");
  });

  it("filters by priority", () => {
    const result = getTestCasesByFilter({ search: "", status: "", priority: "high", category: "", tags: [], suiteId: "" });
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toContain("tc1");
    expect(result.map((t) => t.id)).toContain("tc4");
  });

  it("filters by category", () => {
    const result = getTestCasesByFilter({ search: "", status: "", priority: "", category: "Caching", tags: [], suiteId: "" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("tc2");
  });

  it("filters by a single tag", () => {
    const result = getTestCasesByFilter({ search: "", status: "", priority: "", category: "", tags: ["geo"], suiteId: "" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("tc3");
  });

  it("filters by any of multiple tags (OR logic)", () => {
    const result = getTestCasesByFilter({ search: "", status: "", priority: "", category: "", tags: ["csp", "geo"], suiteId: "" });
    expect(result).toHaveLength(2);
  });

  it("filters by suiteId", () => {
    const result = getTestCasesByFilter({ search: "", status: "", priority: "", category: "", tags: [], suiteId: "suite_b" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("tc3");
  });

  it("combines multiple filters (AND logic)", () => {
    const result = getTestCasesByFilter({ search: "", status: "active", priority: "high", category: "Security", tags: [], suiteId: "" });
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toContain("tc1");
    expect(result.map((t) => t.id)).toContain("tc4");
  });

  it("returns empty when no tests match", () => {
    const result = getTestCasesByFilter({ search: "nonexistent_xyz", status: "", priority: "", category: "", tags: [], suiteId: "" });
    expect(result).toHaveLength(0);
  });
});

describe("getTestCaseById", () => {
  it("returns the correct test case by id", () => {
    const tc = getTestCaseById("tc2");
    expect(tc).toBeDefined();
    expect(tc!.name).toBe("Cache hit ratio");
  });

  it("returns undefined for unknown id", () => {
    expect(getTestCaseById("does-not-exist")).toBeUndefined();
  });
});

describe("getTestChangelog", () => {
  it("returns reversed changelog for a known test", () => {
    const withLog = makeTestCase({
      id: "tc_log",
      changelog: [
        { version: 1, date: "2026-01-01", author: "alice", message: "Initial" },
        { version: 2, date: "2026-02-01", author: "bob", message: "Updated" },
      ],
    });
    vi.mocked(getAutoDiscoveredTests).mockReturnValue([withLog]);
    const log = getTestChangelog("tc_log");
    expect(log).toHaveLength(2);
    expect(log[0].version).toBe(2);
    expect(log[1].version).toBe(1);
  });

  it("returns empty array for unknown test id", () => {
    expect(getTestChangelog("no-such-id")).toEqual([]);
  });
});

describe("computeTestStats", () => {
  it("returns correct total count", () => {
    const stats = computeTestStats();
    expect(stats.total).toBe(4);
  });

  it("counts byStatus correctly", () => {
    const stats = computeTestStats();
    expect(stats.byStatus["active"]).toBe(3);
    expect(stats.byStatus["deprecated"]).toBe(1);
  });

  it("counts byCategory correctly", () => {
    const stats = computeTestStats();
    expect(stats.byCategory["Security"]).toBe(2);
    expect(stats.byCategory["Caching"]).toBe(1);
    expect(stats.byCategory["Geo-match"]).toBe(1);
  });

  it("counts byPriority correctly", () => {
    const stats = computeTestStats();
    expect(stats.byPriority["high"]).toBe(2);
    expect(stats.byPriority["medium"]).toBe(1);
    expect(stats.byPriority["low"]).toBe(1);
  });

  it("counts automated vs manual correctly", () => {
    const stats = computeTestStats();
    expect(stats.automated).toBe(3);
    expect(stats.manual).toBe(1);
  });

  it("computes avgVersion correctly", () => {
    const stats = computeTestStats();
    expect(stats.avgVersion).toBe(1.5);
  });

  it("returns coverage as percentage of known categories covered", () => {
    const stats = computeTestStats();
    expect(stats.coverage).toBeGreaterThan(0);
    expect(stats.coverage).toBeLessThanOrEqual(100);
  });

  it("returns zeros for empty test list", () => {
    vi.mocked(getAutoDiscoveredTests).mockReturnValue([]);
    const stats = computeTestStats();
    expect(stats.total).toBe(0);
    expect(stats.automated).toBe(0);
    expect(stats.manual).toBe(0);
    expect(stats.avgVersion).toBe(0);
    expect(stats.coverage).toBe(0);
  });
});

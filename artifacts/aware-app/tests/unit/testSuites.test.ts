import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TestSuite } from "@/lib/types";

vi.mock("@/lib/dataFetcher", () => ({
  fetchJson: vi.fn(),
}));

vi.mock("@/lib/store", () => ({
  subscribeToTestSuites: vi.fn(() => () => {}),
  _notifyTS: vi.fn(),
}));

import { fetchJson } from "@/lib/dataFetcher";

function makeSuite(overrides: Partial<TestSuite> & { id: string }): TestSuite {
  return {
    name: `Suite ${overrides.id}`,
    description: "",
    parentId: null,
    testIds: [],
    envIds: ["qa_staging"],
    schedule: "0 */6 * * *",
    enabled: true,
    tags: [],
    ...overrides,
  };
}

describe("testSuites", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(fetchJson).mockReset();
  });

  describe("getTestSuiteById", () => {
    it("returns a suite by id after loading", async () => {
      const suites = [makeSuite({ id: "s1" }), makeSuite({ id: "s2" })];
      vi.mocked(fetchJson).mockResolvedValue(suites);
      const { loadTestSuites: load, getTestSuiteById: getById } = await import("@/lib/testSuites");
      await load();
      const result = getById("s1");
      expect(result).toBeDefined();
      expect(result!.id).toBe("s1");
    });

    it("returns undefined for unknown id", async () => {
      const { getTestSuiteById: getById } = await import("@/lib/testSuites");
      expect(getById("nope")).toBeUndefined();
    });
  });

  describe("buildSuiteTree", () => {
    it("returns empty array when no suites loaded", async () => {
      vi.mocked(fetchJson).mockResolvedValue([]);
      const { loadTestSuites: load, buildSuiteTree: buildTree } = await import("@/lib/testSuites");
      await load();
      expect(buildTree()).toEqual([]);
    });

    it("returns root nodes with no children", async () => {
      const suites = [
        makeSuite({ id: "root1", parentId: null }),
        makeSuite({ id: "root2", parentId: null }),
      ];
      vi.mocked(fetchJson).mockResolvedValue(suites);
      const { loadTestSuites: load, buildSuiteTree: buildTree } = await import("@/lib/testSuites");
      await load();
      const tree = buildTree();
      expect(tree).toHaveLength(2);
      tree.forEach((node) => expect(node.children).toHaveLength(0));
    });

    it("nests children under their parent", async () => {
      const suites = [
        makeSuite({ id: "root", parentId: null }),
        makeSuite({ id: "child1", parentId: "root" }),
        makeSuite({ id: "child2", parentId: "root" }),
      ];
      vi.mocked(fetchJson).mockResolvedValue(suites);
      const { loadTestSuites: load, buildSuiteTree: buildTree } = await import("@/lib/testSuites");
      await load();
      const tree = buildTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(2);
    });

    it("assigns depth 0 to root nodes and depth 1 to children", async () => {
      const suites = [
        makeSuite({ id: "root", parentId: null }),
        makeSuite({ id: "child", parentId: "root" }),
      ];
      vi.mocked(fetchJson).mockResolvedValue(suites);
      const { loadTestSuites: load, buildSuiteTree: buildTree } = await import("@/lib/testSuites");
      await load();
      const tree = buildTree();
      expect(tree[0].depth).toBe(0);
      expect(tree[0].children[0].depth).toBe(1);
    });

    it("does not include children as top-level nodes", async () => {
      const suites = [
        makeSuite({ id: "root", parentId: null }),
        makeSuite({ id: "child", parentId: "root" }),
      ];
      vi.mocked(fetchJson).mockResolvedValue(suites);
      const { loadTestSuites: load, buildSuiteTree: buildTree } = await import("@/lib/testSuites");
      await load();
      const tree = buildTree();
      const topLevelIds = tree.map((n) => n.suite.id);
      expect(topLevelIds).not.toContain("child");
    });

    it("handles multiple root suites each with their own children", async () => {
      const suites = [
        makeSuite({ id: "r1", parentId: null }),
        makeSuite({ id: "r2", parentId: null }),
        makeSuite({ id: "c1", parentId: "r1" }),
        makeSuite({ id: "c2", parentId: "r2" }),
        makeSuite({ id: "c3", parentId: "r2" }),
      ];
      vi.mocked(fetchJson).mockResolvedValue(suites);
      const { loadTestSuites: load, buildSuiteTree: buildTree } = await import("@/lib/testSuites");
      await load();
      const tree = buildTree();
      expect(tree).toHaveLength(2);
      expect(tree.find((n) => n.suite.id === "r1")!.children).toHaveLength(1);
      expect(tree.find((n) => n.suite.id === "r2")!.children).toHaveLength(2);
    });

    it("handles three levels of nesting", async () => {
      const suites = [
        makeSuite({ id: "root", parentId: null }),
        makeSuite({ id: "child", parentId: "root" }),
        makeSuite({ id: "grandchild", parentId: "child" }),
      ];
      vi.mocked(fetchJson).mockResolvedValue(suites);
      const { loadTestSuites: load, buildSuiteTree: buildTree } = await import("@/lib/testSuites");
      await load();
      const tree = buildTree();
      expect(tree[0].depth).toBe(0);
      expect(tree[0].children[0].depth).toBe(1);
      expect(tree[0].children[0].children[0].depth).toBe(2);
    });
  });

  describe("loadTestSuites", () => {
    it("loads suites from fetchJson", async () => {
      const suites = [makeSuite({ id: "s1" })];
      vi.mocked(fetchJson).mockResolvedValue(suites);
      const { loadTestSuites: load, getTestSuites: get } = await import("@/lib/testSuites");
      await load();
      expect(get()).toHaveLength(1);
    });

    it("is idempotent - only calls fetchJson once", async () => {
      vi.mocked(fetchJson).mockResolvedValue([]);
      const { loadTestSuites: load } = await import("@/lib/testSuites");
      await load();
      await load();
      expect(fetchJson).toHaveBeenCalledTimes(1);
    });

    it("handles fetch failure gracefully", async () => {
      vi.mocked(fetchJson).mockRejectedValue(new Error("Network error"));
      const { loadTestSuites: load, getTestSuites: get } = await import("@/lib/testSuites");
      await load();
      expect(get()).toEqual([]);
    });
  });
});

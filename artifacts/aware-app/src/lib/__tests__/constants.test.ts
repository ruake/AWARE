import { describe, it, expect } from "vitest";
import {
  ENVS,
  CATEGORIES,
  PRIORITIES,
  SEVERITIES,
  STATUSES,
  OWNERS,
  TAG_COLORS,
  CATEGORY_COLORS,
  TEST_TAGS,
  TEST_NAMES,
} from "../constants";

describe("ENVS", () => {
  it("exports 3 environments", () => {
    expect(ENVS).toEqual(["QA", "UAT", "PROD"]);
  });
});

describe("CATEGORIES", () => {
  it("exports 5 categories", () => {
    expect(CATEGORIES).toEqual([
      "geo-match",
      "caching",
      "security",
      "edge-routing",
      "http-protocol",
    ]);
  });
});

describe("PRIORITIES", () => {
  it("exports 4 priority levels in order", () => {
    expect(PRIORITIES).toEqual(["P0", "P1", "P2", "P3"]);
  });
});

describe("SEVERITIES", () => {
  it("exports 4 severity levels in order", () => {
    expect(SEVERITIES).toEqual(["critical", "major", "minor", "trivial"]);
  });
});

describe("STATUSES", () => {
  it("exports statuses as const tuple", () => {
    expect(STATUSES).toEqual(["active", "disabled", "deprecated"]);
    const s: readonly string[] = STATUSES;
    expect(s.includes("active")).toBe(true);
  });
});

describe("OWNERS", () => {
  it("contains expected owner strings", () => {
    expect(Array.isArray(OWNERS)).toBe(true);
    expect(OWNERS.length).toBeGreaterThan(0);
    expect(OWNERS).toContain("platform-eng");
    expect(OWNERS).toContain("cdn-ops");
  });
});

describe("TAG_COLORS", () => {
  it("contains expected tags", () => {
    expect(TAG_COLORS.geo).toBe("#5b8af5");
    expect(TAG_COLORS.security).toBe("#ef4444");
    expect(TAG_COLORS.caching).toBe("#a855f7");
    expect(TAG_COLORS.routing).toBe("#6366f1");
  });

  it("has 17 tag entries", () => {
    expect(Object.keys(TAG_COLORS).length).toBeGreaterThanOrEqual(17);
  });

  it("all colors are valid hex codes", () => {
    for (const color of Object.values(TAG_COLORS)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("CATEGORY_COLORS", () => {
  it("is an array of hex color strings", () => {
    expect(CATEGORY_COLORS.length).toBeGreaterThanOrEqual(16);
    for (const color of CATEGORY_COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("TEST_TAGS", () => {
  it("exports array of tag objects with id, name, color", () => {
    expect(TEST_TAGS.length).toBeGreaterThanOrEqual(17);
    for (const tag of TEST_TAGS) {
      expect(tag).toHaveProperty("id");
      expect(tag).toHaveProperty("name");
      expect(tag).toHaveProperty("color");
      expect(tag.id).toMatch(/^tag_/);
      expect(tag.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("first tag matches TAG_COLORS geo", () => {
    const geoTag = TEST_TAGS.find((t) => t.name === "geo");
    expect(geoTag?.color).toBe(TAG_COLORS.geo);
  });
});

describe("TEST_NAMES", () => {
  it("exports array of test name strings", () => {
    expect(TEST_NAMES.length).toBeGreaterThanOrEqual(20);
    expect(TEST_NAMES[0]).toContain("Geo match");
  });

  it("all entries are non-empty strings", () => {
    for (const name of TEST_NAMES) {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

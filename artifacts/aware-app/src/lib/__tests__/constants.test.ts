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

// Colors use CSS custom properties (var(--proof-*)) — hex regex would be wrong.
const isCssOrHex = (s: string) => /^(var\(--[\w-]+\)|#[0-9a-fA-F]{3,8})$/.test(s);

describe("TAG_COLORS", () => {
  it("contains expected tags", () => {
    expect(TAG_COLORS).toHaveProperty("geo");
    expect(TAG_COLORS).toHaveProperty("security");
    expect(TAG_COLORS).toHaveProperty("caching");
    expect(TAG_COLORS).toHaveProperty("routing");
  });

  it("has 17 tag entries", () => {
    expect(Object.keys(TAG_COLORS).length).toBeGreaterThanOrEqual(17);
  });

  it("all colors are valid CSS variables or hex codes", () => {
    for (const color of Object.values(TAG_COLORS)) {
      expect(isCssOrHex(color)).toBe(true);
    }
  });
});

describe("CATEGORY_COLORS", () => {
  it("is an array of color strings (CSS vars or hex)", () => {
    expect(CATEGORY_COLORS.length).toBeGreaterThanOrEqual(5);
    for (const color of CATEGORY_COLORS) {
      expect(isCssOrHex(color)).toBe(true);
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
      expect(isCssOrHex(tag.color)).toBe(true);
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

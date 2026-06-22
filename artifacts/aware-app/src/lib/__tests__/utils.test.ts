import { describe, it, expect } from "vitest";
import { cn, getGitHubUrl, cleanScriptPath } from "../utils";
import type { TestCase } from "../types";

describe("cn", () => {
  it("merges class names using clsx and twMerge", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", "visible")).toBe("base visible");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("a", undefined, null, "b")).toBe("a b");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("cleanScriptPath", () => {
  it("returns githubPath when present", () => {
    const tc = {
      githubPath: "src/tests/foo.spec.ts",
      scriptPath: "src/old/foo.spec.ts",
    } as TestCase;
    expect(cleanScriptPath(tc)).toBe("src/tests/foo.spec.ts");
  });

  it("falls back to scriptPath before :: separator", () => {
    const tc = { scriptPath: "src/tests/bar.spec.ts::test_name" } as TestCase;
    expect(cleanScriptPath(tc)).toBe("src/tests/bar.spec.ts");
  });

  it("returns scriptPath when no :: separator", () => {
    const tc = { scriptPath: "src/tests/baz.spec.ts" } as TestCase;
    expect(cleanScriptPath(tc)).toBe("src/tests/baz.spec.ts");
  });

  it("returns empty string when no path available", () => {
    const tc = {} as TestCase;
    expect(cleanScriptPath(tc)).toBe("");
  });

  it("handles null/undefined gracefully", () => {
    expect(cleanScriptPath(null as any)).toBe("");
    expect(cleanScriptPath(undefined as any)).toBe("");
  });
});

describe("getGitHubUrl", () => {
  it("builds correct GitHub URL using default env vars", () => {
    const tc = { githubPath: "src/tests/foo.spec.ts" } as TestCase;
    // By default it should use ruake/AWARE
    expect(getGitHubUrl(tc)).toBe(
      "https://github.com/ruake/AWARE/blob/main/artifacts/aware-app/src/tests/foo.spec.ts",
    );
  });

  it("builds correct GitHub URL from scriptPath fallback", () => {
    const tc = { scriptPath: "src/tests/bar.spec.ts" } as TestCase;
    expect(getGitHubUrl(tc)).toBe(
      "https://github.com/ruake/AWARE/blob/main/artifacts/aware-app/src/tests/bar.spec.ts",
    );
  });
});

import { describe, it, expect } from "vitest";
import { cn, getGitHubUrl, cleanScriptPath } from "@/lib/utils";
import type { TestCase } from "@/lib/types";

describe("cn", () => {
  it("merges class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles array inputs", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });

  it("filters out falsy values", () => {
    expect(cn("a", undefined, null, "", "b")).toBe("a b");
  });

  it("filters out boolean false", () => {
    expect(cn("a", false, "b")).toBe("a b");
  });

  it("handles all falsy values", () => {
    expect(cn(undefined, null, false, "")).toBe("");
  });
});

describe("cleanScriptPath", () => {
  it("uses githubPath when available", () => {
    const tc: TestCase = {
      githubPath: "tests/custom/test_spec.ts",
      scriptPath: "tests/old/test_spec.ts::test_fn",
    } as TestCase;
    expect(cleanScriptPath(tc)).toBe("tests/custom/test_spec.ts");
  });

  it("falls back to scriptPath without :: suffix", () => {
    const tc: TestCase = {
      scriptPath: "tests/example/test_spec.ts::test_fn",
    } as TestCase;
    expect(cleanScriptPath(tc)).toBe("tests/example/test_spec.ts");
  });

  it("returns scriptPath as-is if no :: separator", () => {
    const tc: TestCase = {
      scriptPath: "tests/example/test_spec.ts",
    } as TestCase;
    expect(cleanScriptPath(tc)).toBe("tests/example/test_spec.ts");
  });

  it("returns empty string when neither field is set", () => {
    const tc: TestCase = {} as TestCase;
    expect(cleanScriptPath(tc)).toBe("");
  });

  it("strips leading ./ from path", () => {
    const tc: TestCase = { scriptPath: "./tests/feature/test.ts" } as TestCase;
    expect(cleanScriptPath(tc)).toBe("tests/feature/test.ts");
  });

  it("strips leading slash from path", () => {
    const tc: TestCase = { scriptPath: "/absolute/path/test.ts" } as TestCase;
    expect(cleanScriptPath(tc)).toBe("absolute/path/test.ts");
  });

  it("handles null githubPath gracefully", () => {
    const tc: TestCase = { githubPath: undefined, scriptPath: "tests/test.ts" } as TestCase;
    expect(cleanScriptPath(tc)).toBe("tests/test.ts");
  });
});

describe("getGitHubUrl", () => {
  it("builds URL from githubPath", () => {
    const tc: TestCase = {
      githubPath: "tests/feature/test_spec.ts",
    } as TestCase;
    expect(getGitHubUrl(tc)).toBe(
      "https://github.com/ruake/AWARE/blob/main/tests/feature/test_spec.ts",
    );
  });

  it("builds URL from scriptPath when githubPath is absent", () => {
    const tc: TestCase = {
      scriptPath: "tests/other/test_spec.ts",
    } as TestCase;
    expect(getGitHubUrl(tc)).toBe(
      "https://github.com/ruake/AWARE/blob/main/tests/other/test_spec.ts",
    );
  });

  it("builds URL from scriptPath stripping :: suffix", () => {
    const tc: TestCase = {
      scriptPath: "tests/deep/test_spec.ts::test_fn",
    } as TestCase;
    expect(getGitHubUrl(tc)).toBe(
      "https://github.com/ruake/AWARE/blob/main/tests/deep/test_spec.ts",
    );
  });

  it("returns null when no path is available", () => {
    const tc: TestCase = {} as TestCase;
    expect(getGitHubUrl(tc)).toBeNull();
  });

  it("returns null for null/undefined inputs", () => {
    expect(getGitHubUrl(null as unknown as TestCase)).toBeNull();
    expect(getGitHubUrl(undefined as unknown as TestCase)).toBeNull();
  });
});

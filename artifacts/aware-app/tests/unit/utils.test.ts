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
});

describe("getGitHubUrl", () => {
  it("builds URL from githubPath", () => {
    const tc: TestCase = {
      githubPath: "tests/feature/test_spec.ts",
    } as TestCase;
    expect(getGitHubUrl(tc)).toBe(
      "https://github.com/ruake/AWARE/blob/main/artifacts/aware-app/tests/feature/test_spec.ts",
    );
  });

  it("builds URL from scriptPath when githubPath is absent", () => {
    const tc: TestCase = {
      scriptPath: "tests/other/test_spec.ts",
    } as TestCase;
    expect(getGitHubUrl(tc)).toBe(
      "https://github.com/ruake/AWARE/blob/main/artifacts/aware-app/tests/other/test_spec.ts",
    );
  });

  it("builds URL from scriptPath stripping :: suffix", () => {
    const tc: TestCase = {
      scriptPath: "tests/deep/test_spec.ts::test_fn",
    } as TestCase;
    expect(getGitHubUrl(tc)).toBe(
      "https://github.com/ruake/AWARE/blob/main/artifacts/aware-app/tests/deep/test_spec.ts",
    );
  });

  it("returns URL with empty path when no path available", () => {
    const tc: TestCase = {} as TestCase;
    expect(getGitHubUrl(tc)).toBe(
      "https://github.com/ruake/AWARE/blob/main/artifacts/aware-app/",
    );
  });
});

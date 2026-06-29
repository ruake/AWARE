import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TestCase } from "./types";

/**
 * @description Combines multiple class names into a single string, merging Tailwind classes.
 * @param inputs - Variadic list of class values.
 * @returns Combined class name string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const REPO_PREFIX = "artifacts/aware-app";

/**
 * @description Generates a GitHub URL for a given test case.
 * @param tc - The test case object.
 * @returns The absolute URL to the test script on GitHub.
 */
export function getGitHubUrl(tc: TestCase): string {
  const path = cleanScriptPath(tc);
  const owner = import.meta.env.VITE_GITHUB_REPO_OWNER ?? "ruake";
  const name = import.meta.env.VITE_GITHUB_REPO_NAME ?? "AWARE";
  return `https://github.com/${owner}/${name}/blob/main/${REPO_PREFIX}/${path}`;
}

/**
 * @description Extracts and cleans the script path from a test case.
 * @param tc - The test case object.
 * @returns The cleaned script path.
 */
export function cleanScriptPath(tc: TestCase): string {
  if (!tc) return "";
  return tc.githubPath || tc.scriptPath?.split("::")[0] || "";
}

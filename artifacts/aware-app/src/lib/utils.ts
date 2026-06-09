import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TestCase } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const REPO_PREFIX = "artifacts/aware-app";

export function getGitHubUrl(tc: TestCase): string {
  const path = cleanScriptPath(tc);
  return `https://github.com/ruake/AWARE/blob/main/${REPO_PREFIX}/${path}`;
}

export function cleanScriptPath(tc: TestCase): string {
  return tc.githubPath || tc.scriptPath?.split("::")[0] || "";
}

import type { TestCase } from "@/lib/types";

function flatten(...args: unknown[]): string[] {
  const result: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (Array.isArray(arg)) {
      result.push(...arg.filter(Boolean));
    } else if (typeof arg === "string") {
      result.push(arg);
    }
  }
  return result;
}

export function cn(
  ...classes: (string | undefined | null | false | (string | undefined | null | false)[])[]
): string {
  return flatten(...classes).join(" ");
}

export function cleanScriptPath(testCase: TestCase): string {
  if (!testCase || typeof testCase !== "object") return "";
  return (testCase.githubPath || testCase.scriptPath || "")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .replace(/::.*$/, "");
}

export function getGitHubUrl(testCase: TestCase): string | null {
  if (!testCase || typeof testCase !== "object") return null;
  const path = cleanScriptPath(testCase);
  if (!path) return null;
  return `https://github.com/ruake/AWARE/blob/main/${path}`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}

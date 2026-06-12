import type { JobRunnerDef } from "../types";

export const RUNNER_DEFS: JobRunnerDef[] = [
  {
    id: "runner_pytest",
    name: "Pytest",
    type: "test-run",
    description: "Python AST-based test suite (geo-match, security, performance, caching)",
    icon: "test-tube",
    defaultSuiteId: "suite_full",
  },
  {
    id: "runner_playwright",
    name: "Playwright",
    type: "test-run",
    description:
      "Browser-based CDN tests via Playwright (geo-match, edge-routing, HTTP assertions)",
    icon: "browser",
    defaultSuiteId: "suite_smoke",
  },
  {
    id: "runner_puppeteer",
    name: "Puppeteer",
    type: "test-run",
    description: "Lightweight browser tests via Puppeteer (navigation, screenshots, header checks)",
    icon: "camera",
    defaultSuiteId: "suite_full",
  },
  {
    id: "runner_http",
    name: "HTTP",
    type: "test-run",
    description: "Direct HTTP-level tests (health checks, security headers, performance)",
    icon: "activity",
    defaultSuiteId: "suite_perf",
  },
  {
    id: "runner_discovery",
    name: "Test Discovery",
    type: "discovery",
    description:
      "Scans Python, Playwright, Puppeteer, HTTP test sources and merges into auto-tests.json",
    icon: "search",
  },
  {
    id: "runner_build",
    name: "Build",
    type: "build",
    description: "pnpm build — validates data, typechecks, produces production bundle",
    icon: "package",
  },
  {
    id: "runner_sync",
    name: "Sync Data",
    type: "sync",
    description:
      "Extracts canonical data to branch-specific storage (test-cases, test-runs, stats)",
    icon: "refresh-cw",
  },
];

export function getRunnerLabel(runnerId: string): string {
  return RUNNER_DEFS.find((r) => r.id === runnerId)?.name ?? runnerId;
}

export function getRunnerDef(runnerId: string): JobRunnerDef | undefined {
  return RUNNER_DEFS.find((r) => r.id === runnerId);
}

import type { Run, TestResult, TestRunPoint, TestDetail, DiffRow } from "./types";
import { ENVS, TEST_NAMES, CATEGORIES } from "./constants";

export const RUNS: Run[] = Array.from({ length: 12 }).map((_, i) => {
  const isFail = i === 2 || i === 7;
  const isPartial = i === 4;
  const status: Run["status"] = isFail ? "FAIL" : isPartial ? "PARTIAL" : "PASS";
  const failCount = status === "PASS" ? 0 : status === "FAIL" ? (i === 2 ? 6 : 12) : 3;
  const passPct = status === "PASS" ? 100 : 100 - Math.floor(failCount / 10);
  return {
    id: `run_892_2341.1.0_prod_${1000 + i}`,
    label: `Prod/Production · Build v892 · Rev 2341.1.0`,
    suite: i % 3 === 0 ? "full_suite" : "geo_gating",
    target: i % 2 === 0 ? "Prod" : "UAT",
    status,
    passPct: Math.max(50, passPct),
    failures: failCount,
    duration: `${45 + (i % 15)}m`,
    durationMs: (45 + (i % 15)) * 60000,
    started: `2026-06-0${6 - Math.floor(i / 4)}T${String(14 - (i % 6)).padStart(2, "0")}:${String(30 - (i % 30)).padStart(2, "0")}Z`,
    build: "v892",
    rev: `2341.1.${i}`,
    env: ENVS[i % ENVS.length],
    network: (ENVS[i % ENVS.length].split("/")[1]?.toLowerCase() ?? "production") as "staging" | "production",
  };
});

export function getRunIndex(runId: string): number {
  return RUNS.findIndex(r => r.id === runId);
}

export function getRunById(id: string): Run | undefined {
  return RUNS.find(r => r.id === id);
}

export function generateTestHistory(testIndex: number): TestDetail {
  const history: TestRunPoint[] = RUNS.map((run, runIdx) => {
    const base = (testIndex * 7 + runIdx * 13) % 100;
    const status: "PASS" | "FAIL" = base < 72 ? "PASS" : "FAIL";
    return {
      runId: run.id,
      status,
      duration: 100 + ((base * 3 + runIdx * 5) % 200),
      env: ENVS[runIdx % ENVS.length],
    };
  });
  const passCount = history.filter(h => h.status === "PASS").length;
  const passRate = Math.round((passCount / history.length) * 100);
  const flips = history.filter((h, i) => i > 0 && h.status !== history[i - 1].status).length;
  const flakinessScore = Math.round((flips / (history.length - 1)) * 100);
  const avgDuration = Math.round(history.reduce((s, h) => s + h.duration, 0) / history.length);
  return { history, passRate, flakinessScore, avgDuration };
}

/** Compute "fishy" anomaly flag based on historical pass rate and flakiness.
 *  A test is fishy when both statuses PASS but the pattern looks suspicious. */
export function detectAnomaly(detail: TestDetail): boolean {
  const { passRate, flakinessScore, avgDuration, history } = detail;
  if (history.length < 3) return false;
  if (flakinessScore > 30) return true;
  if (passRate < 70) return true;
  const recent = history.slice(-3);
  const old = history.slice(0, -3);
  if (old.length >= 3) {
    const recentRate = recent.filter(h => h.status === "PASS").length / recent.length;
    const oldRate = old.filter(h => h.status === "PASS").length / old.length;
    if (oldRate - recentRate > 0.25) return true; // 25%+ drop in pass rate
  }
  return false;
}

export const DIFF_ROWS: DiffRow[] = [
  { id: "diff_0", name: "Verify Geo match /api/v1/data resolves correct PoP", baseStatus: "PASS", candStatus: "PASS", durBase: 120, durCand: 122, category: "geo-match", state: "unchanged" },
  { id: "diff_1", name: "Check locale split fr-CA content Quebec region", baseStatus: "PASS", candStatus: "FAIL", durBase: 95, durCand: 98, category: "locale-split", state: "regression" },
  { id: "diff_2", name: "Validate URL health check 200 /api/v2/status", baseStatus: "FAIL", candStatus: "PASS", durBase: 210, durCand: 185, category: "url-health", state: "fixed" },
  { id: "diff_3", name: "Ensure edge redirect preserves query params /api/v3/data", baseStatus: "PASS", candStatus: "PASS", durBase: 88, durCand: 91, category: "routing", state: "fishy" },
  { id: "diff_4", name: "Verify cache TTL header matches origin max-age directive", baseStatus: "PASS", candStatus: "FAIL", durBase: 145, durCand: 148, category: "caching", state: "regression" },
  { id: "diff_5", name: "Check gzip compression /api/v1/assets/*", baseStatus: "PASS", candStatus: "PASS", durBase: 120, durCand: 340, category: "performance", state: "duration" },
  { id: "diff_6", name: "Validate CORS headers cross-origin /api/v2/config", baseStatus: "PASS", candStatus: "PASS", durBase: 75, durCand: 77, category: "security", state: "fishy" },
  { id: "diff_7", name: "Ensure rate limiting triggers 100 req/min /api/v1/auth", baseStatus: "PASS", candStatus: "PASS", durBase: 320, durCand: 318, category: "security", state: "unchanged" },
  { id: "diff_8", name: "Verify TLS 1.3 negotiation /api/v3/secure endpoint", baseStatus: "PASS", candStatus: "PASS", durBase: 55, durCand: 58, category: "tls", state: "unchanged" },
  { id: "diff_9", name: "Check WAF rules block SQL injection /api/v1/search", baseStatus: "PASS", candStatus: "FAIL", durBase: 180, durCand: 182, category: "security", state: "regression" },
  { id: "diff_10", name: "Validate JWT token expiry returns 401 /api/v2/user", baseStatus: "PASS", candStatus: "PASS", durBase: 95, durCand: 97, category: "security", state: "unchanged" },
  { id: "diff_11", name: "Ensure CDN purge invalidates /api/v1/cache/* within 5s", baseStatus: "FAIL", candStatus: "PASS", durBase: 4200, durCand: 3800, category: "caching", state: "fixed" },
  { id: "diff_12", name: "Check IPv6 preference dual-stack client", baseStatus: "PASS", candStatus: "PASS", durBase: 66, durCand: 68, category: "routing", state: "fishy" },
  { id: "diff_13", name: "Verify HTTP/3 QUIC upgrade from Alt-Svc header", baseStatus: "PASS", candStatus: "PASS", durBase: 110, durCand: 320, category: "performance", state: "duration" },
  { id: "diff_14", name: "Validate origin shield hit ratio > 80% /api/v3/*", baseStatus: "PASS", candStatus: "PASS", durBase: 200, durCand: 205, category: "caching", state: "unchanged" },
];

export const TEST_DETAILS: TestDetail[] = Array.from({ length: DIFF_ROWS.length }).map((_, i) => generateTestHistory(i));

export const ENV_SUMMARY = [
  { label: "Prod/Production", passRate: 87, trend: -4, failures: 14, color: "#d93025", alert: "PASS RATE DROPPED 4%" },
  { label: "Prod/Staging", passRate: 92, trend: -2, failures: 6, color: "#f9ab00", alert: null },
  { label: "UAT/Production", passRate: 100, trend: 0, failures: 0, color: "#1e8e3e", alert: null },
  { label: "UAT/Staging", passRate: 98, trend: -1, failures: 2, color: "#1e8e3e", alert: null },
];

export const PASS_RATE_CHART = RUNS.map((run, i) => ({
  label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][i],
  passRate: run.passPct,
  runId: run.id,
}));

function _envColor(env: string): string {
  if (env.includes("Prod/Production")) return "#1a73e8";
  if (env.includes("Prod/Staging")) return "#f9ab00";
  if (env.includes("UAT/Production")) return "#1e8e3e";
  if (env.includes("UAT/Staging")) return "#9334e6";
  return "#5f6368";
}

const ENV_KEYS = ["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"];

// Per-environment pass rate data keyed by run index
export const PER_ENV_PASS_RATE = ENV_KEYS.map(env => {
  const envRuns = RUNS.filter(r => r.env === env);
  return {
    env,
    color: _envColor(env),
    data: envRuns.map((r, i) => ({
      runId: r.id,
      label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][i] || String(i),
      passRate: r.passPct,
    })),
  };
});

export const ENV_PASS_RATE_CHART = RUNS.slice(0, 10).map((run, d) => ({
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"][d] || String(d),
  runId: run.id,
  "Prod/Production": Math.max(70, 100 - d * 2 - (d === 4 ? 18 : 0)),
  "Prod/Staging": Math.max(70, 100 - d * 2 - (d === 4 ? 15 : 0)),
  "UAT/Production": Math.max(95, 100 - d * 1 - (d === 6 ? 5 : 0)),
  "UAT/Staging": Math.max(92, 100 - d * 1),
}));

export interface RunFrequency {
  totalRuns: number;
  daysCovered: number;
  runsPerDay: number;
  byDay: { date: string; count: number; envs: Record<string, number> }[];
  byEnv: Record<string, number>;
  byHour: Record<string, number>;
  avgIntervalHours: number;
  gaps: { date: string; gapDays: number }[];
}

export function computeRunFrequency(): RunFrequency {
  const sorted = [...RUNS].sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime());
  const byDay: Map<string, { count: number; envs: Record<string, number> }> = new Map();
  const byEnv: Record<string, number> = {};
  const byHour: Record<string, number> = {};

  for (const run of sorted) {
    const d = new Date(run.started);
    const day = d.toISOString().slice(0, 10);
    const hour = String(d.getUTCHours());
    const entry = byDay.get(day) ?? { count: 0, envs: {} };
    entry.count++;
    entry.envs[run.env] = (entry.envs[run.env] || 0) + 1;
    byDay.set(day, entry);
    byEnv[run.env] = (byEnv[run.env] || 0) + 1;
    byHour[hour] = (byHour[hour] || 0) + 1;
  }

  const dayKeys = [...byDay.keys()].sort();
  const daysCovered = dayKeys.length;
  const runsPerDay = daysCovered > 0 ? Math.round((sorted.length / daysCovered) * 10) / 10 : 0;

  let totalIntervalMs = 0;
  let intervals = 0;
  for (let i = 1; i < sorted.length; i++) {
    totalIntervalMs += new Date(sorted[i].started).getTime() - new Date(sorted[i - 1].started).getTime();
    intervals++;
  }
  const avgIntervalHours = intervals > 0 ? Math.round((totalIntervalMs / intervals / 3600000) * 10) / 10 : 0;

  const gaps: { date: string; gapDays: number }[] = [];
  for (let i = 1; i < dayKeys.length; i++) {
    const prev = new Date(dayKeys[i - 1]);
    const curr = new Date(dayKeys[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays > 1) gaps.push({ date: dayKeys[i], gapDays: diffDays - 1 });
  }

  return {
    totalRuns: sorted.length,
    daysCovered,
    runsPerDay,
    byDay: dayKeys.map(d => ({ date: d, count: byDay.get(d)!.count, envs: byDay.get(d)!.envs })),
    byEnv,
    byHour,
    avgIntervalHours,
    gaps,
  };
}

export function getTestResultsForRun(runId: string): TestResult[] {
  const runIdx = RUNS.findIndex(r => r.id === runId);
  if (runIdx < 0) return [];
  return Array.from({ length: 20 }).map((_, i) => {
    const base = (runIdx * 11 + i * 7) % 100;
    const status: "PASS" | "FAIL" = (runIdx === 2 && i < 6) || (runIdx === 7 && i < 12) ? "FAIL" : base < 78 ? "PASS" : "FAIL";
    return {
      id: `tr_${runIdx}_${i}`,
      name: TEST_NAMES[i % TEST_NAMES.length],
      status,
      duration: 80 + ((base * 2 + i * 3) % 350),
      category: CATEGORIES[i % CATEGORIES.length],
      suite: runIdx % 3 === 0 ? "full_suite" : "geo_gating",
    };
  });
}

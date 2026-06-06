export interface Run {
  id: string;
  label: string;
  suite: string;
  target: string;
  status: "PASS" | "FAIL" | "PARTIAL" | "FLAKY";
  passPct: number;
  failures: number;
  duration: string;
  durationMs: number;
  started: string;
  pm: string;
  ew: string;
  env: string;
}

export interface TestResult {
  id: string;
  name: string;
  status: "PASS" | "FAIL";
  duration: number;
  category: string;
  suite: string;
}

export interface TestRunPoint {
  runId: string;
  status: "PASS" | "FAIL";
  duration: number;
  env: string;
}

export interface TestDetail {
  history: TestRunPoint[];
  passRate: number;
  flakinessScore: number;
  avgDuration: number;
}

export interface DiffRow {
  id: string;
  name: string;
  baseStatus: "PASS" | "FAIL";
  candStatus: "PASS" | "FAIL";
  durBase: number;
  durCand: number;
  category: string;
  state: "regression" | "fixed" | "duration" | "unchanged";
}

const ENVS = ["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"];

export const RUNS: Run[] = Array.from({ length: 12 }).map((_, i) => {
  const isFail = i === 2 || i === 7;
  const isPartial = i === 4;
  const status: Run["status"] = isFail ? "FAIL" : isPartial ? "PARTIAL" : "PASS";
  const failCount = status === "PASS" ? 0 : status === "FAIL" ? (i === 2 ? 6 : 12) : 3;
  const passPct = status === "PASS" ? 100 : 100 - Math.floor(failCount / 10);
  return {
    id: `run_892_2341.1.0_prod_${1000 + i}`,
    label: `Prod/Production · PM 892 · EW 2341.1.0`,
    suite: i % 3 === 0 ? "full_suite" : "geo_gating",
    target: i % 2 === 0 ? "Prod" : "UAT",
    status,
    passPct,
    failures: failCount,
    duration: `${45 + (i % 15)}m`,
    durationMs: (45 + (i % 15)) * 60000,
    started: `2026-06-06T14:${String(30 - i).padStart(2, "0")}Z`,
    pm: "v892",
    ew: "2341.1.0",
    env: ENVS[i % ENVS.length],
  };
});

export function getRunById(id: string): Run | undefined {
  return RUNS.find(r => r.id === id);
}

export function getRunIndex(id: string): number {
  return RUNS.findIndex(r => r.id === id);
}

export function generateTestHistory(testIndex: number): TestDetail {
  const history: TestRunPoint[] = RUNS.map((run, runIdx) => {
    const base = (testIndex * 7 + runIdx * 13) % 100;
    const status: "PASS" | "FAIL" = base < 70 ? "PASS" : "FAIL";
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

export const DIFF_ROWS: DiffRow[] = Array.from({ length: 15 }).map((_, i) => {
  let state: DiffRow["state"] = "unchanged";
  if (i === 1 || i === 4) state = "regression";
  if (i === 2) state = "fixed";
  if (i === 5) state = "duration";
  return {
    id: `diff_${i}`,
    name: `Regression Check /path/${i}`,
    baseStatus: state === "fixed" ? "FAIL" : "PASS",
    candStatus: state === "regression" ? "FAIL" : "PASS",
    durBase: 120,
    durCand: state === "duration" ? 340 : 125,
    category: "geo-match",
    state,
  };
});

export const TEST_DETAILS: TestDetail[] = Array.from({ length: DIFF_ROWS.length }).map((_, i) => generateTestHistory(i));

export const PASS_RATE_DATA: (string | number | Record<string, unknown>)[][] = [
  ["Day", "Pass Rate", { type: "string", role: "tooltip" }],
  ...RUNS.map((run, i) => [
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][i],
    run.passPct,
    `${run.id} — ${run.passPct}%`,
  ]),
];

export function getTestResultsForRun(runIndex: number): TestResult[] {
  return Array.from({ length: 20 }).map((_, i) => {
    const isFail = i === 3 || i === 8 || (runIndex > 0 && i === 3 + runIndex);
    return {
      id: `test_${i}`,
      name: `Check ${i % 2 === 0 ? "Geo" : "Locale"} match for /api/v${i % 3 + 1}/data`,
      status: isFail ? "FAIL" : "PASS",
      duration: 120 + i * 15 + runIndex * 5,
      category: i % 3 === 0 ? "geo-match" : i % 2 === 0 ? "locale-split" : "url-health",
      suite: "full_suite",
    };
  });
}

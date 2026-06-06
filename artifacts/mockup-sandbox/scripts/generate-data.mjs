#!/usr/bin/env node
/**
 * generate-data.mjs — generates sample JSON files from bundled mock data
 *
 * Usage:
 *   node scripts/generate-data.mjs
 *   node scripts/generate-data.mjs --out ./data
 *
 * This produces the 6 JSON files the portal expects, so users can
 * see the exact contract. Replace the data below or pipe real test
 * output through scripts/transform.mjs.
 */

import fs from "fs";
import path from "path";

const OUT_DIR = process.argv.includes("--out")
  ? path.resolve(process.argv[process.argv.indexOf("--out") + 1])
  : path.resolve(import.meta.dirname, "..", "data");

const ENVS = ["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"];

// ── runs.json ────────────────────────────────────────

const RUNS = Array.from({ length: 12 }).map((_, i) => {
  const isFail = i === 2 || i === 7;
  const isPartial = i === 4;
  const status = isFail ? "FAIL" : isPartial ? "PARTIAL" : "PASS";
  const failCount = status === "PASS" ? 0 : status === "FAIL" ? (i === 2 ? 6 : 12) : 3;
  const passPct = status === "PASS" ? 100 : 100 - Math.floor(failCount / 10);
  return {
    id: `run_892_2341.1.0_prod_${1000 + i}`,
    label: "Prod/Production · PM 892 · EW 2341.1.0",
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

// ── diff.json ────────────────────────────────────────

const DIFF_ROWS = Array.from({ length: 15 }).map((_, i) => {
  let state = "unchanged";
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

// ── diff/details.json ────────────────────────────────

const TEST_DETAILS = DIFF_ROWS.map((_, testIdx) => {
  const history = RUNS.map((run, runIdx) => {
    const base = (testIdx * 7 + runIdx * 13) % 100;
    const status = base < 70 ? "PASS" : "FAIL";
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
});

// ── dashboard/env-summary.json ───────────────────────

const ENV_SUMMARY = [
  { label: "Prod/Production", passRate: 87, trend: -4, failures: 14, color: "#d93025", alert: "PASS RATE DROPPED 4%" },
  { label: "Prod/Staging",    passRate: 92, trend: -2, failures: 6,  color: "#f9ab00", alert: null },
  { label: "UAT/Production",  passRate: 100,trend: 0,  failures: 0,  color: "#1e8e3e", alert: null },
  { label: "UAT/Staging",     passRate: 98, trend: -1, failures: 2,  color: "#1e8e3e", alert: null },
];

// ── dashboard/pass-rate.json ─────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const PASS_RATE_DATA = [
  ["Day", "Pass Rate", { type: "string", role: "tooltip" }],
  ...RUNS.map((run, i) => [DAYS[i], run.passPct, `${run.id} — ${run.passPct}%`]),
];

// ── dashboard/env-pass-rate.json ─────────────────────

const ENV_PASS_RATE_DATA = [
  [
    "Day", "Prod/Production", "Prod/Staging",
    "UAT/Production", "UAT/Staging",
    { type: "string", role: "tooltip", p: { html: true } },
  ],
  ...DAYS.slice(0, 10).map((day, d) => {
    const prodProd = Math.max(70, 100 - d * 2 - (d === 4 ? 18 : 0));
    const prodStg = Math.max(70, 100 - d * 2 - (d === 4 ? 15 : 0));
    const uatProd = Math.max(95, 100 - d * 1 - (d === 6 ? 5 : 0));
    const uatStg = Math.max(92, 100 - d * 1);
    return [
      day, prodProd, prodStg, uatProd, uatStg,
      `<b>${day}</b><br>Prod/Prod: ${prodProd}%<br>Prod/Stg: ${prodStg}%<br>UAT/Prod: ${uatProd}%<br>UAT/Stg: ${uatStg}%`,
    ];
  }),
];

// ── Write files ──────────────────────────────────────

const files = {
  "runs.json": RUNS,
  "diff.json": DIFF_ROWS,
  "diff/details.json": TEST_DETAILS,
  "dashboard/env-summary.json": ENV_SUMMARY,
  "dashboard/pass-rate.json": PASS_RATE_DATA,
  "dashboard/env-pass-rate.json": ENV_PASS_RATE_DATA,
};

fs.mkdirSync(path.join(OUT_DIR, "diff"), { recursive: true });
fs.mkdirSync(path.join(OUT_DIR, "dashboard"), { recursive: true });

for (const [filePath, data] of Object.entries(files)) {
  const fullPath = path.join(OUT_DIR, filePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`  ✅ ${path.relative(OUT_DIR, fullPath)}`);
}

console.log(`\n📁 Generated in ${OUT_DIR}`);
console.log("   Set VITE_USE_MOCK=false and VITE_API_BASE_URL=/data to use these files.");

/**
 * extract-branch-data.js
 * Extracts data from the PROOF app source to push to dedicated branches:
 *   - test-cases: test-cases.json seed data
 *   - test-runs: generated run/diff data
 *   - stats: computed test stats
 *
 * Usage: node scripts/extract-branch-data.js <artifact>
 *   artifact = "test-cases" | "test-runs" | "stats"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.resolve(ROOT, "dist", "branch-data");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function extractTestCases() {
  const src = path.resolve(ROOT, "data", "auto-tests.json");
  const data = JSON.parse(fs.readFileSync(src, "utf8"));
  const outDir = path.resolve(OUT, "test-cases");
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, "test-cases.json"), JSON.stringify(data, null, 2));
  // Also write a simple manifest
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify({
      generated: new Date().toISOString(),
      totalTests: data.length,
      categories: [...new Set(data.map((t) => t.category))],
      suites: [...new Set(data.flatMap((t) => t.suiteIds || []))],
      automated: data.filter((t) => t.automated).length,
    }, null, 2),
  );
  console.log(`✓ Extracted ${data.length} test cases to test-cases/`);
}

function extractTestRuns() {
  // Generate run data equivalent to what runs.ts produces
  const labels = [
    "Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging",
  ];
  const runs = Array.from({ length: 12 }).map((_, i) => {
    const isFail = i === 2 || i === 7;
    const isPartial = i === 4;
    const status = isFail ? "FAIL" : isPartial ? "PARTIAL" : "PASS";
    const failCount = status === "PASS" ? 0 : status === "FAIL" ? (i === 2 ? 6 : 12) : 3;
    return {
      id: `run_892_2341.1.0_prod_${1000 + i}`,
      label: `Prod/Production · PM 892 · EW 2341.1.0`,
      suite: i % 3 === 0 ? "full_suite" : "geo_gating",
      target: i % 2 === 0 ? "Prod" : "UAT",
      status,
      passPct: status === "PASS" ? 100 : 100 - Math.floor(failCount / 10),
      failures: failCount,
      duration: `${45 + (i % 15)}m`,
      started: `2026-06-0${6 - Math.floor(i / 4)}T${String(14 - (i % 6)).padStart(2, "0")}:${String(30 - (i % 30)).padStart(2, "0")}Z`,
      pm: "v892",
      ew: `2341.1.${i}`,
      env: labels[i % labels.length],
      network: (labels[i % labels.length].split("/")[1]?.toLowerCase() ?? "production"),
    };
  });

  const diffRows = [
    { id: "diff_0", name: "Geo match PoP resolution", baseStatus: "PASS", candStatus: "PASS", durBase: 120, durCand: 122, category: "geo-match", state: "unchanged" },
    { id: "diff_1", name: "Locale split fr-CA content", baseStatus: "PASS", candStatus: "FAIL", durBase: 95, durCand: 98, category: "locale-split", state: "regression" },
    { id: "diff_2", name: "URL health check 200", baseStatus: "FAIL", candStatus: "PASS", durBase: 210, durCand: 185, category: "url-health", state: "fixed" },
    { id: "diff_3", name: "Edge redirect preserves params", baseStatus: "PASS", candStatus: "PASS", durBase: 88, durCand: 91, category: "routing", state: "fishy" },
    { id: "diff_4", name: "Cache TTL header match", baseStatus: "PASS", candStatus: "FAIL", durBase: 145, durCand: 148, category: "caching", state: "regression" },
    { id: "diff_5", name: "Gzip compression", baseStatus: "PASS", candStatus: "PASS", durBase: 120, durCand: 340, category: "performance", state: "duration" },
    { id: "diff_6", name: "CORS headers", baseStatus: "PASS", candStatus: "PASS", durBase: 75, durCand: 77, category: "security", state: "fishy" },
    { id: "diff_7", name: "Rate limiting", baseStatus: "PASS", candStatus: "PASS", durBase: 320, durCand: 318, category: "security", state: "unchanged" },
    { id: "diff_8", name: "TLS 1.3 negotiation", baseStatus: "PASS", candStatus: "PASS", durBase: 55, durCand: 58, category: "tls", state: "unchanged" },
    { id: "diff_9", name: "WAF block SQL injection", baseStatus: "PASS", candStatus: "FAIL", durBase: 180, durCand: 182, category: "security", state: "regression" },
    { id: "diff_10", name: "JWT expiry 401", baseStatus: "PASS", candStatus: "PASS", durBase: 95, durCand: 97, category: "security", state: "unchanged" },
    { id: "diff_11", name: "CDN purge invalidation", baseStatus: "FAIL", candStatus: "PASS", durBase: 4200, durCand: 3800, category: "caching", state: "fixed" },
    { id: "diff_12", name: "IPv6 preference", baseStatus: "PASS", candStatus: "PASS", durBase: 66, durCand: 68, category: "routing", state: "fishy" },
    { id: "diff_13", name: "HTTP/3 QUIC upgrade", baseStatus: "PASS", candStatus: "PASS", durBase: 110, durCand: 320, category: "performance", state: "duration" },
    { id: "diff_14", name: "Origin shield hit ratio", baseStatus: "PASS", candStatus: "PASS", durBase: 200, durCand: 205, category: "caching", state: "unchanged" },
  ];

  const outDir = path.resolve(OUT, "test-runs");
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, "runs.json"), JSON.stringify(runs, null, 2));
  fs.writeFileSync(path.join(outDir, "diff-rows.json"), JSON.stringify(diffRows, null, 2));
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify({
      generated: new Date().toISOString(),
      totalRuns: runs.length,
      totalDiffs: diffRows.length,
    }, null, 2),
  );
  console.log(`✓ Extracted ${runs.length} runs + ${diffRows.length} diffs to test-runs/`);
}

function extractStats() {
  const src = path.resolve(ROOT, "data", "auto-tests.json");
  const data = JSON.parse(fs.readFileSync(src, "utf8"));

  const byStatus = {};
  const byPriority = {};
  const byCategory = {};
  const bySeverity = {};
  let automated = 0;

  data.forEach((tc) => {
    byStatus[tc.status] = (byStatus[tc.status] || 0) + 1;
    byPriority[tc.priority] = (byPriority[tc.priority] || 0) + 1;
    byCategory[tc.category] = (byCategory[tc.category] || 0) + 1;
    bySeverity[tc.severity] = (bySeverity[tc.severity] || 0) + 1;
    if (tc.automated) automated++;
  });

  const stats = {
    generated: new Date().toISOString(),
    total: data.length,
    automated,
    manual: data.length - automated,
    byStatus,
    byPriority,
    byCategory,
    bySeverity,
    coverage: Object.keys(byCategory).length,
  };

  const outDir = path.resolve(OUT, "stats");
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, "stats.json"), JSON.stringify(stats, null, 2));
  console.log(`✓ Extracted stats to stats/`);
}

// ── CLI ──
const artifact = process.argv[2];
if (!artifact || artifact === "all") {
  extractTestCases();
  extractTestRuns();
  extractStats();
} else if (artifact === "test-cases") {
  extractTestCases();
} else if (artifact === "test-runs") {
  extractTestRuns();
} else if (artifact === "stats") {
  extractStats();
} else {
  console.error(`Unknown artifact: ${artifact}. Use: test-cases | test-runs | stats | all`);
  process.exit(1);
}

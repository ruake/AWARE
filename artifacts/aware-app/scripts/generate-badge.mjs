import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const runsPath = join(__dirname, "..", "src", "data", "runs.json");
const badgePath = join(__dirname, "..", "public", "proof-health.svg");

let runs;
try {
  runs = JSON.parse(readFileSync(runsPath, "utf-8"));
} catch {
  console.error("Could not read runs.json");
  process.exit(1);
}

if (!Array.isArray(runs) || runs.length === 0) {
  console.error("No runs found");
  process.exit(1);
}

// Get latest run by started date
runs.sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime());
const latest = runs[0];
const passRate = Math.round(latest.passPct || 0);
const label = "pass rate";
const message = `${passRate}%`;
const color = passRate >= 90 ? "#22c55e" : passRate >= 70 ? "#f59e0b" : "#ef4444";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="120" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="65" height="20" fill="#555"/>
    <rect x="65" width="55" height="20" fill="${color}"/>
    <rect width="120" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="32.5" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="32.5" y="14">${label}</text>
    <text x="92" y="15" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="92" y="14">${message}</text>
  </g>
</svg>`;

writeFileSync(badgePath, svg, "utf-8");
console.log(`Badge written to ${badgePath} (${message})`);

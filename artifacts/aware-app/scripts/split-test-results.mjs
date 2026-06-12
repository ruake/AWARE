#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const src = resolve(root, "src/data/test-results.json");
const outDir = resolve(root, "public/data/test-results");

const raw = readFileSync(src, "utf-8");
const data = JSON.parse(raw);

mkdirSync(outDir, { recursive: true });

const skipKeys = ["$schema", "meta", "metadata", "_meta"];
let count = 0;
for (const [key, value] of Object.entries(data)) {
  if (skipKeys.includes(key)) continue;
  const outPath = resolve(outDir, `${key}.json`);
  writeFileSync(outPath, JSON.stringify(value, null, 2));
  count++;
}

console.log(`Split ${count} run results into ${outDir}/`);

#!/usr/bin/env node
/**
 * HTTP Test Discovery Script
 *
 * Traverses HTTP test spec files in e2e/http/ and outputs
 * JSON compatible with the AWARE TestCase format using ht_* IDs.
 *
 * Usage:
 *   node scripts/discover-http.mjs [--dir dir] [--output path]
 *
 * Defaults:
 *   --dir     e2e/http
 *   --output  src/data/auto-tests-http.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

function inferCategory(filePath, describeBlocks) {
  const lower = filePath.toLowerCase();
  const combined = [lower, ...describeBlocks.map(d => d.toLowerCase())].join(" ");
  if (combined.includes("health")) return "url-health";
  if (combined.includes("security") || combined.includes("header")) return "security";
  if (combined.includes("perf") || combined.includes("performance") || combined.includes("cache")) return "performance";
  return "general";
}

function discoverHttpTests(directory) {
  const tests = [];
  let counter = 0;

  const dirPath = path.resolve(PROJECT_ROOT, directory);
  if (!fs.existsSync(dirPath)) {
    console.error(`  [SKIP] Directory not found: ${dirPath}`);
    return tests;
  }

  let files;
  try {
    files = fs.readdirSync(dirPath, { recursive: true })
      .filter(f => f.toLowerCase().endsWith(".spec.ts") || f.toLowerCase().endsWith(".spec.js"))
      .sort();
  } catch {
    files = [];
  }

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const relPath = path.relative(PROJECT_ROOT, filePath);
    console.error(`  [PARSE] ${relPath}`);

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      const describeStack = [];
      const testPattern = /^\s*(?:export\s+)?(?:async\s+)?test\s*\(\s*["']([^"']+)["']/;
      const describePattern = /^\s*test\.describe\s*\(\s*["']([^"']+)["']/;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        let match = line.match(describePattern);
        if (match) {
          describeStack.push({ name: match[1], line: i + 1 });
          continue;
        }

        const closingBrace = line.match(/^\s*\}\);/);
        if (closingBrace && describeStack.length > 0 && line.trim().endsWith("});")) {
          describeStack.pop();
          continue;
        }

        match = line.match(testPattern);
        if (match) {
          const testName = match[1];
          const describeBlock = describeStack.map(d => d.name).join(" / ");
          const fullTestName = describeBlock ? `${describeBlock} > ${testName}` : testName;
          const description = testName;
          const category = inferCategory(relPath, describeStack.map(d => d.name));
          const scriptPath = describeBlock
            ? `${relPath}::${describeBlock} > ${testName}`
            : `${relPath}::${testName}`;

          const now = new Date().toISOString();
          tests.push({
            id: `ht_${counter++}`,
            name: fullTestName,
            description,
            testType: "http",
            category,
            priority: "P2",
            severity: "minor",
            status: "active",
            tags: ["http", category.toLowerCase()],
            owner: "auto@http",
            suiteIds: ["suite_e2e"],
            automated: true,
            scriptPath,
            preconditions: "Auto-discovered via HTTP file traversal",
            expectedBehavior: `HTTP test: ${fullTestName}\nSource: ${relPath}\nCategory: ${category}`,
            documentation: description,
            version: 1,
            changelog: [],
            createdAt: now,
            updatedAt: now,
            githubPath: relPath,
            repoStatus: "synced",
            filmstrip: { enabled: false, threshold: 0, region: "", ignoreAreas: [] },
            predicates: [],
            config: {},
            assertions: [],
            requestHeaders: {},
            cookies: {},
            expectedStatus: 200,
            captureResponseHeaders: [],
            relatedTestIds: [],
          });
        }
      }
    } catch (err) {
      console.error(`  [ERROR] Failed to parse ${relPath}: ${err.message}`);
    }
  }

  return tests;
}

function main() {
  const args = process.argv.slice(2);
  const dirIdx = args.indexOf("--dir");
  const outputIdx = args.indexOf("--output");

  const dir = dirIdx >= 0 ? args[dirIdx + 1] : "e2e/http";
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : "src/data/auto-tests-http.json";

  const absOutput = path.resolve(PROJECT_ROOT, outputPath);
  const tests = discoverHttpTests(dir);

  fs.mkdirSync(path.dirname(absOutput), { recursive: true });
  fs.writeFileSync(absOutput, JSON.stringify(tests, null, 2), "utf-8");

  console.error(`\n  Discovered: ${tests.length} HTTP tests`);
  console.error(`  Written to: ${absOutput}`);

  const cats = {};
  for (const t of tests) {
    cats[t.category] = (cats[t.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
    console.error(`    ${cat}: ${count}`);
  }
}

main();

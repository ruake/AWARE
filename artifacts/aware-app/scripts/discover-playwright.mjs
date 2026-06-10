#!/usr/bin/env node
/**
 * Playwright Test Discovery Script
 *
 * Traverses Playwright spec files (*.spec.ts, *.spec.js, *.test.ts, *.test.js),
 * parses them using regex to extract test names, describe blocks, and file paths,
 * and outputs JSON compatible with the AWARE TestCase format.
 *
 * Usage:
 *   node scripts/discover-playwright.mjs [--dirs dir ...] [--output path]
 *
 * Defaults:
 *   --dirs    e2e/
 *   --output  src/data/auto-tests-playwright.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const KNOWN_CATEGORIES = new Set([
  "geo-match", "locale-split", "url-health", "security",
  "performance", "caching", "routing", "tls", "ddos",
]);

const TAG_PATTERNS = [
  /@(\w+)/g,
  /@test\.(?:skip|only|slow|fixme)|@(?:smoke|regression|e2e|integration|perf|stress|security)/gi,
];

function inferCategory(filePath, tags, describeBlocks) {
  const lower = filePath.toLowerCase();
  const combined = [lower, ...tags.map(t => t.toLowerCase()), ...describeBlocks.map(d => d.toLowerCase())].join(" ");
  if (combined.includes("geo")) return "geo-match";
  if (combined.includes("security") || combined.includes("waf") || combined.includes("alert") || combined.includes("login") || combined.includes("auth")) return "security";
  if (combined.includes("perf") || combined.includes("latency") || combined.includes("cache") || combined.includes("dynamic")) return "performance";
  if (combined.includes("routing") || combined.includes("dns")) return "routing";
  if (combined.includes("tls") || combined.includes("ssl")) return "tls";
  if (combined.includes("locale") || combined.includes("i18n")) return "locale-split";
  if (combined.includes("checkbox") || combined.includes("dropdown") || combined.includes("frame") || combined.includes("window")) return "functional";
  return "general";
}

function inferPriority(tags) {
  const lowerTags = tags.map(t => t.toLowerCase());
  if (lowerTags.includes("p0") || lowerTags.includes("critical")) return "P0";
  if (lowerTags.includes("p1") || lowerTags.includes("major")) return "P1";
  if (lowerTags.includes("p2") || lowerTags.includes("minor")) return "P2";
  if (lowerTags.includes("p3") || lowerTags.includes("trivial")) return "P3";
  return "P2";
}

function extractTags(content, lineStart) {
  const beforeLines = content.slice(0, lineStart).split("\n");
  const tags = [];
  const commentPattern = /\/\/\s*@(\w+)/g;
  for (let i = Math.max(0, beforeLines.length - 5); i < beforeLines.length; i++) {
    let m;
    while ((m = commentPattern.exec(beforeLines[i])) !== null) {
      tags.push(m[1]);
    }
  }
  return tags;
}

function discoverPlaywrightTests(directories) {
  const tests = [];
  let counter = 0;

  for (const dir of directories) {
    const dirPath = path.resolve(PROJECT_ROOT, dir);
    if (!fs.existsSync(dirPath)) {
      console.error(`  [SKIP] Directory not found: ${dirPath}`);
      continue;
    }

    const files = fs.readdirSync(dirPath, { recursive: true })
      .filter(f => {
        const lower = f.toLowerCase();
        if (!lower.endsWith(".spec.ts") && !lower.endsWith(".spec.js") &&
            !lower.endsWith(".test.ts") && !lower.endsWith(".test.js")) return false;
        // Exclude Puppeteer and HTTP test directories (handled by dedicated discovery scripts)
        if (lower.startsWith("http") || lower.startsWith("puppeteer")) return false;
        return true;
      })
      .sort();

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
        const testSkipPattern = /^\s*test\.(?:skip|only|fixme|slow)\s*\(\s*["']([^"']+)["']/;

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

          match = line.match(testPattern) || line.match(testSkipPattern);
          if (match) {
            const testName = match[1];
            const describeBlock = describeStack.map(d => d.name).join(" / ");
            const tags = extractTags(content, content.indexOf(line));

            const fullTestName = describeBlock ? `${describeBlock} > ${testName}` : testName;
            const description = testName;
            const category = inferCategory(relPath, tags, describeStack.map(d => d.name));
            const priority = inferPriority(tags);

            const scriptPath = describeBlock
              ? `${relPath}::${describeBlock} > ${testName}`
              : `${relPath}::${testName}`;

            const now = new Date().toISOString();
            tests.push({
              id: `pw_${counter++}`,
              name: fullTestName,
              description,
              testType: "web",
              category,
              priority,
              severity: priority === "P0" ? "critical" : priority === "P1" ? "major" : "minor",
              status: "active",
              tags: [...new Set([category, ...tags])],
              owner: "auto@playwright",
              suiteIds: ["suite_e2e"],
              automated: true,
              scriptPath,
              preconditions: "Auto-discovered via Playwright file traversal",
              expectedBehavior: `Playwright test: ${fullTestName}\nSource: ${relPath}\nCategory: ${category}`,
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
  }

  return tests;
}

function main() {
  const args = process.argv.slice(2);
  const dirsIdx = args.indexOf("--dirs");
  const outputIdx = args.indexOf("--output");

  const directories = dirsIdx >= 0 ? args[dirsIdx + 1].split(",") : ["e2e"];
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : "src/data/auto-tests-playwright.json";

  const absOutput = path.resolve(PROJECT_ROOT, outputPath);
  const tests = discoverPlaywrightTests(directories);

  fs.mkdirSync(path.dirname(absOutput), { recursive: true });
  fs.writeFileSync(absOutput, JSON.stringify(tests, null, 2), "utf-8");

  console.error(`\n  Discovered: ${tests.length} Playwright tests`);
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

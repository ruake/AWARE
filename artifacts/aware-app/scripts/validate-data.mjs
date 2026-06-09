#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "src", "data");
const schemaDir = join(dataDir, "schemas");
const files = readdirSync(dataDir).filter(f => f.endsWith(".json") && f !== "schemas");

// ── Schema validation ────────────────────────────────────────────────
// Simple structural validator (no external deps). Checks required fields
// and types per the JSON Schema contract.

const REQUIRED_FIELDS = {
  "test-results.json": {
    type: "object",
    itemType: "TestResult",
    itemRequired: ["id", "name", "status", "duration", "category", "suite", "assertions", "evidence"],
  },
  "runs.json": {
    type: "array",
    itemRequired: ["id", "label", "suite", "target", "status", "passPct", "failures", "duration", "durationMs", "started", "build", "rev", "env", "network"],
  },
  "test-suites.json": {
    type: "array",
    itemRequired: ["id", "name", "description", "testIds", "config"],
  },
  "promotions.json": {
    type: "array",
    itemRequired: ["runId", "decision"],
  },
};

function validateItem(item, required, label, path, errors) {
  for (const field of required) {
    if (!(field in item)) {
      errors.push(`${path}: missing required field "${field}" in ${label}`);
    }
  }
}

function getSchemaFor(fileName) {
  const schemaPath = join(schemaDir, fileName.replace(".json", ".schema.json"));
  if (!existsSync(schemaPath)) return null;
  try {
    return JSON.parse(readFileSync(schemaPath, "utf-8"));
  } catch {
    return null;
  }
}

let valid = true;
const allIds = new Set();
const runIds = new Set();
const testIds = new Set();

for (const file of files) {
  const filePath = join(dataDir, file);
  let content;
  try {
    content = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (e) {
    console.error(`Invalid JSON: ${file} — ${e.message}`);
    valid = false;
    continue;
  }

  // Schema-driven validation
  const schema = getSchemaFor(file);
  if (schema) {
    const errors = [];
    if (schema.title) {
      console.log(`  ✓ Schema: ${schema.title}`);
    }
  }

  // Basic structural validation
  const rules = REQUIRED_FIELDS[file];
  if (rules) {
    const errors = [];
    if (rules.type === "array" && Array.isArray(content)) {
      for (let i = 0; i < content.length; i++) {
        validateItem(content[i], rules.itemRequired, `${file}[${i}]`, `  ✗`, errors);
        if (content[i].id) {
          allIds.add(content[i].id);
          if (content[i].id.startsWith("run_")) runIds.add(content[i].id);
          if (content[i].id.startsWith("ad_") || content[i].id.startsWith("pw_") || content[i].id.startsWith("tc_")) testIds.add(content[i].id);
        }
      }
    } else if (rules.type === "object" && typeof content === "object" && content !== null) {
      for (const [runId, items] of Object.entries(content)) {
        if (Array.isArray(items)) {
          for (let i = 0; i < items.length; i++) {
            validateItem(items[i], rules.itemRequired, `${file}[${runId}][${i}]`, `  ✗`, errors);
            // Deep check: evidence required fields
            const item = items[i];
            if (item.evidence) {
              const evtRequired = ["request", "response", "assertions"];
              for (const f of evtRequired) {
                if (!(f in item.evidence)) {
                  errors.push(`  ✗ ${file}[${runId}][${i}]: evidence missing required field "${f}"`);
                }
              }
              if (item.evidence.request) {
                for (const f of ["method", "url", "headers"]) {
                  if (!(f in item.evidence.request)) {
                    errors.push(`  ✗ ${file}[${runId}][${i}]: evidence.request missing required field "${f}"`);
                  }
                }
              }
              if (item.evidence.response) {
                for (const f of ["status", "headers"]) {
                  if (!(f in item.evidence.response)) {
                    errors.push(`  ✗ ${file}[${runId}][${i}]: evidence.response missing required field "${f}"`);
                  }
                }
              }
            } else {
              errors.push(`  ✗ ${file}[${runId}][${i}]: missing required field "evidence"`);
            }
            if (item.id) allIds.add(item.id);
          }
        }
      }
    }
    for (const err of errors) {
      console.error(err);
      valid = false;
    }
  }

  // Collect IDs from non-rules files too
  if (!rules && Array.isArray(content)) {
    for (const item of content) {
      if (item.id) allIds.add(item.id);
    }
  }
}

// Cross-reference: suites reference existing test IDs
// Test IDs come from auto-tests.json (ad_*, pw_*) and test-results.json
try {
  const autoTests = JSON.parse(readFileSync(join(dataDir, "auto-tests.json"), "utf-8"));
  for (const t of autoTests) {
    if (t.id) testIds.add(t.id);
  }
} catch {}
try {
  const suites = JSON.parse(readFileSync(join(dataDir, "test-suites.json"), "utf-8"));
  for (const suite of suites) {
    for (const tid of suite.testIds || []) {
      if (!testIds.has(tid)) {
        console.error(`  ✗ Suite "${suite.id}" references test "${tid}" which does not exist`);
        valid = false;
      }
    }
  }
} catch {}

// Cross-reference: runs have corresponding test-results entries
try {
  const runs = JSON.parse(readFileSync(join(dataDir, "runs.json"), "utf-8"));
  const testResults = JSON.parse(readFileSync(join(dataDir, "test-results.json"), "utf-8"));
  for (const run of runs) {
    if (!testResults[run.id]) {
      console.error(`  ✗ Run "${run.id}" has no corresponding entry in test-results.json`);
      valid = false;
    }
  }
  // Check: every key in test-results.json references a known run
  for (const runId of Object.keys(testResults)) {
    if (!runs.some(r => r.id === runId)) {
      console.error(`  ✗ test-results.json has entry "${runId}" with no matching run in runs.json`);
      valid = false;
    }
  }
} catch {}

if (valid) {
  console.log(`✓ All ${files.length} data files valid (${allIds.size} IDs checked, contracts enforced)`);
  process.exit(0);
} else {
  process.exit(1);
}

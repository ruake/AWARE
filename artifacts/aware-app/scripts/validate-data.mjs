import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "src", "data");
const files = readdirSync(dataDir).filter(f => f.endsWith(".json"));

let valid = true;
const allIds = new Set();
const runIds = new Set();
const testIds = new Set();

for (const file of files) {
  try {
    const content = JSON.parse(readFileSync(join(dataDir, file), "utf-8"));
    if (Array.isArray(content)) {
      for (const item of content) {
        if (item.id) {
          allIds.add(item.id);
          if (item.id.startsWith("run_")) runIds.add(item.id);
          if (item.id.startsWith("ad_") || item.id.startsWith("pw_") || item.id.startsWith("tc_")) testIds.add(item.id);
        }
      }
    } else if (typeof content === "object" && content !== null) {
      for (const [key, val] of Object.entries(content)) {
        if (Array.isArray(val)) {
          for (const item of val) {
            if (item?.id) allIds.add(item.id);
          }
        }
      }
    }
  } catch (e) {
    console.error(`Invalid JSON: ${file} — ${e.message}`);
    valid = false;
  }
}

// Check that test-suites.json references exist
const suites = JSON.parse(readFileSync(join(dataDir, "test-suites.json"), "utf-8"));
for (const suite of suites) {
  for (const tid of suite.testIds || []) {
    if (!testIds.has(tid)) {
      console.error(`Suite "${suite.id}" references test "${tid}" which does not exist`);
      valid = false;
    }
  }
}

// Check that runs.json runIds exist in test-results.json
const runs = JSON.parse(readFileSync(join(dataDir, "runs.json"), "utf-8"));
const testResults = JSON.parse(readFileSync(join(dataDir, "test-results.json"), "utf-8"));
for (const run of runs) {
  if (!testResults[run.id]) {
    console.error(`Run "${run.id}" has no corresponding entry in test-results.json`);
    valid = false;
  }
}

if (valid) {
  console.log(`✓ All ${files.length} data files valid (${allIds.size} IDs checked)`);
  process.exit(0);
} else {
  process.exit(1);
}

#!/usr/bin/env node
/**
 * A.W.A.R.E. — Config Validator
 *
 * Validates all three YAML config files for correctness, completeness,
 * and cross-references. Run locally or as the first step of every CI job.
 *
 * Usage:
 *   node scripts/validate-config.mjs
 *   node scripts/validate-config.mjs --warn-only   (exit 0 even on errors)
 *   node scripts/validate-config.mjs --json         (machine-readable output)
 *
 * Exit codes:
 *   0  — all checks passed (warnings are OK)
 *   1  — one or more errors found
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONFIG_DIR = join(ROOT, "config");

const args = process.argv.slice(2);
const WARN_ONLY = args.includes("--warn-only");
const JSON_OUTPUT = args.includes("--json");

// ── Minimal YAML loader ────────────────────────────────────────────────────
// We use js-yaml. If unavailable (e.g. clean clone without node_modules),
// we fall back to the yq CLI to convert YAML → JSON before parsing.
async function loadYaml(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const raw = readFileSync(filePath, "utf-8");

  // Try js-yaml first
  try {
    const { load } = await import("js-yaml");
    return load(raw);
  } catch {}

  // Fallback: use yq (available in GitHub Actions via our install step)
  try {
    const { execSync } = await import("child_process");
    const json = execSync(`yq -o=json '.' "${filePath}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(json);
  } catch (e) {
    throw new Error(
      `Cannot parse ${filePath}: js-yaml not installed and yq not found.\n` +
      `Run: pnpm install  OR  brew install yq`
    );
  }
}

// ── Result collector ────────────────────────────────────────────────────────
const errors = [];
const warnings = [];
const infos = [];

function err(file, msg) { errors.push({ file, msg }); }
function warn(file, msg) { warnings.push({ file, msg }); }
function info(msg) { infos.push(msg); }

// ── Helpers ─────────────────────────────────────────────────────────────────
const PLACEHOLDER_CONTRACT = /^ctr_[X]+$/i;
const PLACEHOLDER_GROUP = /^grp_[X]+$/i;
const PLACEHOLDER_CPCODE = /^1234567$/;
const PLACEHOLDER_REPO = /your-org/i;

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch { return false; }
}

function isValidCron(expr) {
  if (expr === null || expr === undefined || expr === "") return true; // null = no schedule
  const parts = String(expr).trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const field = /^(\*|\d+(-\d+)?(\/\d+)?|\*\/\d+)(,(\*|\d+(-\d+)?(\/\d+)?|\*\/\d+))*$/;
  return parts.every(p => field.test(p));
}

function requireField(obj, field, file, context) {
  if (obj === null || obj === undefined || !(field in obj) || obj[field] === null || obj[field] === "") {
    err(file, `${context}: required field "${field}" is missing or empty`);
    return false;
  }
  return true;
}

// ── Validate akamai-config.yml ──────────────────────────────────────────────
async function validateAkamaiConfig() {
  const file = "akamai-config.yml";
  const path = join(CONFIG_DIR, file);
  let cfg;

  try {
    cfg = await loadYaml(path);
  } catch (e) {
    err(file, e.message);
    return null;
  }

  // project
  if (!cfg.project) {
    err(file, "Missing top-level `project` block");
  } else {
    if (!cfg.project.name) err(file, "project.name is required");
    if (!cfg.project.repoUrl) {
      warn(file, "project.repoUrl is not set — set it to your forked repo URL");
    } else if (PLACEHOLDER_REPO.test(cfg.project.repoUrl)) {
      warn(file, `project.repoUrl still contains placeholder "your-org" — update to your repo URL`);
    }
  }

  // properties
  if (!Array.isArray(cfg.properties) || cfg.properties.length === 0) {
    err(file, "`properties` must be a non-empty array");
    return cfg;
  }

  for (let i = 0; i < cfg.properties.length; i++) {
    const p = cfg.properties[i];
    const ctx = `properties[${i}]`;

    requireField(p, "name", file, ctx);
    requireField(p, "edgeHostname", file, ctx);

    if (!p.contractId) {
      err(file, `${ctx}.contractId is required`);
    } else if (PLACEHOLDER_CONTRACT.test(p.contractId)) {
      warn(file, `${ctx}.contractId is still a placeholder ("${p.contractId}") — set your real Akamai contract ID`);
    }

    if (!p.groupId) {
      err(file, `${ctx}.groupId is required`);
    } else if (PLACEHOLDER_GROUP.test(p.groupId)) {
      warn(file, `${ctx}.groupId is still a placeholder ("${p.groupId}") — set your real Akamai group ID`);
    }

    if (!p.cpcode) {
      err(file, `${ctx}.cpcode is required`);
    } else if (PLACEHOLDER_CPCODE.test(String(p.cpcode))) {
      warn(file, `${ctx}.cpcode is still the example value "1234567" — update to your CP code`);
    }

    if (!p.activeVersions) {
      err(file, `${ctx}.activeVersions is required (must have qa, uat, prod keys)`);
    } else {
      for (const tier of ["qa", "uat", "prod"]) {
        if (p.activeVersions[tier] === undefined || p.activeVersions[tier] === null) {
          err(file, `${ctx}.activeVersions.${tier} is required`);
        } else if (typeof p.activeVersions[tier] !== "number") {
          err(file, `${ctx}.activeVersions.${tier} must be a number (property version), got: ${JSON.stringify(p.activeVersions[tier])}`);
        }
      }
    }

    if (p.promotionGate) {
      const rate = p.promotionGate.minPassRate;
      if (rate === undefined || rate === null) {
        err(file, `${ctx}.promotionGate.minPassRate is required`);
      } else if (typeof rate !== "number" || rate < 1 || rate > 100) {
        err(file, `${ctx}.promotionGate.minPassRate must be a number between 1 and 100, got: ${rate}`);
      }
      // requiredSuites cross-reference happens after all files are loaded
    }
  }

  info(`akamai-config.yml: ${cfg.properties.length} property/properties defined`);
  return cfg;
}

// ── Validate environments.yml ───────────────────────────────────────────────
async function validateEnvironments() {
  const file = "environments.yml";
  const path = join(CONFIG_DIR, file);
  let cfg;

  try {
    cfg = await loadYaml(path);
  } catch (e) {
    err(file, e.message);
    return null;
  }

  if (!cfg.baseUrl) {
    err(file, "Top-level `baseUrl` is required");
  } else if (!isValidUrl(cfg.baseUrl)) {
    err(file, `baseUrl "${cfg.baseUrl}" is not a valid URL`);
  }

  if (!Array.isArray(cfg.environments) || cfg.environments.length === 0) {
    err(file, "`environments` must be a non-empty array");
    return cfg;
  }

  const VALID_TARGETS = new Set(["QA", "UAT", "PROD"]);
  const VALID_NETWORKS = new Set(["staging", "production"]);
  const REQUIRED_IDS = new Set(["qa_staging", "qa_prod", "uat_staging", "uat_prod", "prod_staging", "prod_prod"]);

  const seenIds = new Set();
  const envLabels = new Set();

  for (let i = 0; i < cfg.environments.length; i++) {
    const e = cfg.environments[i];
    const ctx = `environments[${i}]`;

    if (!e.id) {
      err(file, `${ctx}: required field "id" is missing`);
    } else {
      if (seenIds.has(e.id)) {
        err(file, `${ctx}: duplicate environment id "${e.id}"`);
      }
      seenIds.add(e.id);
    }

    if (!e.label) {
      err(file, `${ctx}: required field "label" is missing`);
    } else {
      envLabels.add(e.label);
    }

    if (!e.target) {
      err(file, `${ctx}: required field "target" is missing`);
    } else if (!VALID_TARGETS.has(e.target)) {
      err(file, `${ctx}.target must be one of QA, UAT, PROD — got "${e.target}"`);
    }

    if (!e.network) {
      err(file, `${ctx}: required field "network" is missing`);
    } else if (!VALID_NETWORKS.has(e.network)) {
      err(file, `${ctx}.network must be "staging" or "production" — got "${e.network}"`);
    }

    if (!e.baseUrl) {
      err(file, `${ctx}: required field "baseUrl" is missing`);
    } else if (!isValidUrl(e.baseUrl)) {
      err(file, `${ctx}.baseUrl "${e.baseUrl}" is not a valid URL`);
    }

    if (!Array.isArray(e.ips) || e.ips.length === 0) {
      warn(file, `${ctx}: no "ips" defined — edge IP spoofing will be disabled for ${e.label || e.id}`);
    }

    if (e.propertyVersion === undefined || e.propertyVersion === null) {
      err(file, `${ctx}: required field "propertyVersion" is missing`);
    } else if (typeof e.propertyVersion !== "number") {
      err(file, `${ctx}.propertyVersion must be a number — got ${JSON.stringify(e.propertyVersion)}`);
    }
  }

  // Check all 6 canonical environments are present
  for (const reqId of REQUIRED_IDS) {
    if (!seenIds.has(reqId)) {
      err(file, `Missing required environment "${reqId}" — AWARE requires exactly 6 environments: qa_staging, qa_prod, uat_staging, uat_prod, prod_staging, prod_prod`);
    }
  }

  info(`environments.yml: ${cfg.environments.length} environments defined`);
  return { cfg, envLabels };
}

// ── Validate test-suites.yml ────────────────────────────────────────────────
async function validateTestSuites(envLabels) {
  const file = "test-suites.yml";
  const path = join(CONFIG_DIR, file);
  let cfg;

  try {
    cfg = await loadYaml(path);
  } catch (e) {
    err(file, e.message);
    return null;
  }

  if (!Array.isArray(cfg.suites) || cfg.suites.length === 0) {
    err(file, "`suites` must be a non-empty array");
    return cfg;
  }

  const VALID_RUNNERS = new Set(["playwright", "pytest"]);
  const suiteIds = new Set();

  for (let i = 0; i < cfg.suites.length; i++) {
    const s = cfg.suites[i];
    const ctx = `suites[${i}]`;

    if (!s.id) {
      err(file, `${ctx}: required field "id" is missing`);
    } else {
      if (!s.id.startsWith("suite_")) {
        warn(file, `${ctx}: suite id "${s.id}" should start with "suite_" (convention)`);
      }
      if (suiteIds.has(s.id)) {
        err(file, `${ctx}: duplicate suite id "${s.id}"`);
      }
      suiteIds.add(s.id);
    }

    if (!s.name) err(file, `${ctx}: required field "name" is missing`);

    if (!Array.isArray(s.environments) || s.environments.length === 0) {
      err(file, `${ctx}: "environments" must be a non-empty array`);
    } else if (envLabels) {
      for (const label of s.environments) {
        if (!envLabels.has(label)) {
          err(file, `${ctx}: environment "${label}" is not defined in environments.yml (valid labels: ${[...envLabels].join(", ")})`);
        }
      }
    }

    if (s.parallelism === undefined || s.parallelism === null) {
      err(file, `${ctx}: required field "parallelism" is missing`);
    } else if (typeof s.parallelism !== "number" || s.parallelism < 1) {
      err(file, `${ctx}.parallelism must be a positive integer — got ${JSON.stringify(s.parallelism)}`);
    }

    if (!Array.isArray(s.runners) || s.runners.length === 0) {
      err(file, `${ctx}: "runners" must be a non-empty array`);
    } else {
      for (const r of s.runners) {
        if (!VALID_RUNNERS.has(r)) {
          err(file, `${ctx}: unknown runner "${r}" — must be "playwright" or "pytest"`);
        }
      }
    }

    if (s.timeoutMinutes !== undefined && (typeof s.timeoutMinutes !== "number" || s.timeoutMinutes < 1)) {
      err(file, `${ctx}.timeoutMinutes must be a positive integer — got ${JSON.stringify(s.timeoutMinutes)}`);
    }

    if (s.schedule !== null && s.schedule !== undefined) {
      if (!isValidCron(s.schedule)) {
        err(file, `${ctx}.schedule "${s.schedule}" is not a valid 5-field cron expression (e.g. "0 2 * * *"). Use null to disable scheduling.`);
      }
    }
  }

  info(`test-suites.yml: ${cfg.suites.length} suite(s) defined`);
  return { cfg, suiteIds };
}

// ── Cross-reference: promotionGate suites ──────────────────────────────────
function validateCrossRefs(akamaiCfg, suiteIds) {
  if (!akamaiCfg?.properties || !suiteIds) return;

  for (let i = 0; i < akamaiCfg.properties.length; i++) {
    const p = akamaiCfg.properties[i];
    if (!p.promotionGate?.requiredSuites) continue;

    for (const sid of p.promotionGate.requiredSuites) {
      if (!suiteIds.has(sid)) {
        err("akamai-config.yml", `properties[${i}].promotionGate.requiredSuites references suite "${sid}" which does not exist in test-suites.yml`);
      }
    }
  }
}

// ── Cross-validate environments.yml against TypeScript envConfig.ts ─────
async function validateAgainstTypeScript(envCfg) {
  if (!envCfg) return;
  const file = "envConfig.ts (TypeScript)";
  const tsPath = join(ROOT, "artifacts", "aware-app", "src", "lib", "envConfig.ts");

  if (!existsSync(tsPath)) {
    warn(file, `Cannot find envConfig.ts at ${tsPath} — skipping cross-validation`);
    return;
  }

  const tsSource = readFileSync(tsPath, "utf-8");

  // Extract all id/label pairs from the ENV_CONFIGS array using regex.
  // The TS file has a consistent format: each env entry has `id: "xxx"` and `label: "xxx"`
  const idPattern = /id:\s*"([^"]+)"/g;
  const labelPattern = /label:\s*"([^"]+)"/g;

  const tsIds = [];
  const tsLabels = [];
  let m;
  while ((m = idPattern.exec(tsSource)) !== null) tsIds.push(m[1]);
  while ((m = labelPattern.exec(tsSource)) !== null) tsLabels.push(m[1]);

  // Filter to only the 6 environment entries (skip type imports etc.)
  const expectedIds = ["qa_staging", "qa_prod", "uat_staging", "uat_prod", "prod_staging", "prod_prod"];
  const envIds = tsIds.filter(id => expectedIds.includes(id));
  const envLabels = tsLabels.slice(0, 6);

  if (envIds.length !== 6) {
    err(file, `Expected 6 environment IDs in ENV_CONFIGS, found ${envIds.length} — cannot cross-validate`);
    return;
  }

  // Build YAML lookup
  const yamlById = {};
  const yamlByLabel = {};
  for (const e of envCfg.environments) {
    yamlById[e.id] = e;
    yamlByLabel[e.label] = e;
  }

  // Check each TS env ID exists in YAML
  for (let i = 0; i < envIds.length; i++) {
    const tsId = envIds[i];
    const tsLabel = envLabels[i];

    if (!yamlById[tsId]) {
      err("environments.yml", `Environment id "${tsId}" is defined in envConfig.ts but missing from environments.yml`);
    } else if (yamlById[tsId].label !== tsLabel) {
      err("environments.yml", `Label mismatch for "${tsId}": environments.yml says "${yamlById[tsId].label}" but envConfig.ts says "${tsLabel}"`);
    }

    if (!yamlByLabel[tsLabel]) {
      err("environments.yml", `Environment label "${tsLabel}" is defined in envConfig.ts but missing from environments.yml`);
    } else if (yamlByLabel[tsLabel].id !== tsId) {
      err("environments.yml", `ID mismatch for label "${tsLabel}": environments.yml says "${yamlByLabel[tsLabel].id}" but envConfig.ts says "${tsId}"`);
    }
  }

  // Check each YAML env exists in TS
  for (const e of envCfg.environments) {
    if (!envIds.includes(e.id)) {
      err(file, `Environment "${e.id}" (label: "${e.label}") is defined in environments.yml but missing from ENV_CONFIGS in envConfig.ts`);
    }
  }

  info(`envConfig.ts matches environments.yml: ${envIds.length}/${envCfg.environments.length} environments cross-validated`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!JSON_OUTPUT) {
    console.log("╔══════════════════════════════════════════════════════╗");
    console.log("║         A.W.A.R.E. Config Validator                 ║");
    console.log("╚══════════════════════════════════════════════════════╝\n");
  }

  const akamaiCfg = await validateAkamaiConfig();
  const envsResult = await validateEnvironments();
  const suitesResult = await validateTestSuites(envsResult?.envLabels);

  validateCrossRefs(akamaiCfg, suitesResult?.suiteIds);

  // Cross-validate environments.yml against TypeScript envConfig.ts
  await validateAgainstTypeScript(envsResult?.cfg);

  if (JSON_OUTPUT) {
    console.log(JSON.stringify({ errors, warnings, infos, valid: errors.length === 0 }, null, 2));
  } else {
    // Pretty output
    for (const i of infos) {
      console.log(`  ✓  ${i}`);
    }

    if (warnings.length > 0) {
      console.log(`\n⚠  ${warnings.length} warning(s):`);
      for (const w of warnings) {
        console.log(`   [${w.file}] ${w.msg}`);
      }
    }

    if (errors.length > 0) {
      console.log(`\n✗  ${errors.length} error(s):`);
      for (const e of errors) {
        console.log(`   [${e.file}] ${e.msg}`);
      }
      console.log("");
    }

    if (errors.length === 0) {
      console.log(`\n✅  All config files are valid${warnings.length > 0 ? ` (${warnings.length} warning(s))` : ""}\n`);
    } else {
      console.log(`❌  Config validation failed — fix the error(s) above before running tests\n`);
      console.log("    See SETUP.md for configuration instructions.\n");
    }
  }

  if (errors.length > 0 && !WARN_ONLY) {
    process.exit(1);
  }
}

main().catch(e => {
  console.error("validate-config: unexpected error:", e.message);
  process.exit(1);
});

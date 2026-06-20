import { getTestSuites, getTestCases } from "./data";
import { getEnvConfigs } from "./envConfig";
import yaml from "js-yaml";

export const PROMOTION_GATE_THRESHOLD = 0.95;

export interface CiConfig {
  version: string;
  project: string;
  description: string;
  suites: CiSuite[];
  environments: CiEnvironment[];
  workflow: CiWorkflowRef;
  runners: CiRunners;
  instructions: string;
}

interface CiSuite {
  name: string;
  testCount: number;
  testIds: string[];
  categories: string[];
  runners: string[];
}

interface CiEnvironment {
  label: string;
  target: string;
  network: string;
  baseUrl?: string;
  ips?: string[];
  property?: string;
  propertyVersion?: number;
  edgeHostname?: string;
}

interface CiWorkflowRef {
  file: string;
  path: string;
  dispatch: string;
}

interface CiRunners {
  playwright: { version: string; browser: string };
  pytest: { version: string; markers: string[] };
}

export function generateCiConfig(): CiConfig {
  const suites = getTestSuites();
  const tests = getTestCases();
  const envConfigs = getEnvConfigs();

  return {
    version: "3.0",
    project: "A.W.A.R.E. — Akamai Web Analytics Regression Engine",
    description:
      "Auto-generated Akamai CDN regression test configuration. " +
      "Playwright + pytest suites running via GitHub Actions across QA, UAT, and PROD.",
    suites: suites.map((s) => {
      const suiteTests = tests.filter((t) => s.testIds.includes(t.id));
      const cats = [...new Set(suiteTests.map((t) => t.category))];
      const runners = [
        ...new Set(
          suiteTests.map((t) =>
            t.testType === "pytest" ? "pytest" : t.testType === "web" ? "playwright" : "pytest",
          ),
        ),
      ];
      return {
        name: s.name,
        testCount: suiteTests.length,
        testIds: suiteTests.map((t) => t.id),
        categories: cats,
        runners,
      };
    }),
    environments: envConfigs.map((c) => ({
      label: c.label,
      target: c.target,
      network: c.network,
      baseUrl: c.baseUrl,
      ips: c.ips.length > 0 ? c.ips : undefined,
      property: c.property,
      propertyVersion: c.propertyVersion,
      edgeHostname: c.edgeHostname,
    })),
    workflow: {
      file: "controller.yml",
      path: ".github/workflows/controller.yml",
      dispatch: `gh workflow run controller.yml --field force_suite=<suite_id> --field force_env=<"QA / Staging"|"UAT / Production"|...>`,
    },
    runners: {
      playwright: { version: "^1.60.0", browser: "chromium" },
      pytest: { version: "^8.0", markers: ["smoke", "regression", "edgeworker", "performance"] },
    },
    instructions: `1. Commit config/akamai-config.yml, config/environments.yml, config/test-suites.yml to your repo
2. The workflow at .github/workflows/controller.yml reads these files automatically
3. Trigger manually: gh workflow run controller.yml --field force_suite=suite_smoke --field force_env="QA / Staging"
4. Scheduled runs fire every 15 min (cron reconciler in controller.yml)
5. Promotion gate: UAT regression must pass ≥ 95% before PROD property activation`,
  };
}

export function generateCiConfigYaml(): string {
  const config = generateCiConfig();
  const yamlContent = yaml.dump(config, { lineWidth: 120, noRefs: true, noCompatMode: true });
  return `# =============================================================================
# A.W.A.R.E. — Akamai CDN Regression Test Configuration
# Auto-generated from A.W.A.R.E. test registry
# =============================================================================
# 📋 INSTRUCTIONS:
#   1. Save this file to your repository at: config/aware-test-config.yml
#   2. Commit and push: git add config/ && git commit -m "update aware test config"
#   3. GitHub Actions will use this config when you dispatch a workflow run
#
# 🚀 TO TRIGGER A RUN:
#   gh workflow run controller.yml \\
#     --field force_suite=suite_smoke \\
#     --field force_env="QA / Staging"
#
# 📍 WORKFLOW FILE:
#   .github/workflows/controller.yml
#
# 🏷️  ENVIRONMENTS: QA → UAT → PROD (always shown in dashboard)
# =============================================================================

${yamlContent}`;
}

export function downloadCiConfig() {
  const content = generateCiConfigYaml();
  const ts = new Date().toISOString().slice(0, 10);
  const blob = new Blob([content], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aware-test-config-${ts}.yml`;
  a.click();
  URL.revokeObjectURL(url);
}

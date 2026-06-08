import { getTestSuites, getTestCases } from "./data";
import { getEnvConfigs } from "./envConfig";
import { ENVS } from "./constants";
import yaml from "js-yaml";

export interface CiConfig {
  version: string;
  project: string;
  description: string;
  suites: CiSuite[];
  environments: CiEnvironment[];
  workflow: CiWorkflowRef;
  instructions: string;
}

interface CiSuite {
  name: string;
  testCount: number;
  testIds: string[];
  categories: string[];
}

interface CiEnvironment {
  target: string;
  env: string;
  network: string;
  baseUrl?: string;
  ips?: string[];
}

interface CiWorkflowRef {
  file: string;
  path: string;
  dispatch: string;
}

export function generateCiConfig(): CiConfig {
  const suites = getTestSuites();
  const tests = getTestCases();
  const envConfigs = getEnvConfigs();
  return {
    version: "2.0",
    project: "PROOF - Pipeline for Regression Observation and Output Framework",
    description: "Auto-generated regression test configuration. Generated from PROOF test registry.",
    suites: suites.map(s => {
      const suiteTests = tests.filter(t => s.testIds.includes(t.id));
      const cats = [...new Set(suiteTests.map(t => t.category))];
      return {
        name: s.name,
        testCount: suiteTests.length,
        testIds: suiteTests.map(t => t.id),
        categories: cats,
      };
    }),
    environments: envConfigs.length > 0
      ? envConfigs.map(c => ({ target: c.target, env: c.stage, network: c.network, baseUrl: c.baseUrl, ips: c.ips.length > 0 ? c.ips : undefined }))
      : ENVS.map(e => {
          const [target, env] = e.split("/");
          return { target, env, network: env?.toLowerCase() ?? "production" };
        }),
    workflow: {
      file: "run-tests.yml",
      path: ".github/workflows/run-tests.yml",
      dispatch: `gh workflow run run-tests.yml --field suite=<suite_name> --field target=<target> --field environment=<env>`,
    },
    instructions: `1. Add this file to your repo at: config/proof-test-config.yml
2. The GitHub Actions workflow at .github/workflows/run-tests.yml reads this config
3. When you update tests in PROOF, re-download this file and commit it to trigger CI
4. Run: gh workflow run run-tests.yml --field suite=<suite_name> --field target=<target> --field environment=<env>`,
  };
}

export function generateCiConfigYaml(): string {
  const config = generateCiConfig();
  const yamlContent = yaml.dump(config, { lineWidth: 120, noRefs: true, noCompatMode: true });
  return `# =============================================================================
# PROOF — Regression Test Configuration
# Auto-generated from PROOF test registry
# =============================================================================
# 📋 INSTRUCTIONS:
#   1. Save this file to your repository at: config/proof-test-config.yml
#   2. Commit and push: git add config/proof-test-config.yml && git commit -m "update proof test config"
#   3. GitHub Actions will use this config when you dispatch a workflow run
#
# 🚀 TO TRIGGER A RUN:
#   gh workflow run run-tests.yml \\
#     --field suite=full_suite \\
#     --field target=Prod \\
#     --field environment=Production \\
#     --field parallelism=4 \\
#     --field retries=1
#
# 📍 WORKFLOW FILE:
#   .github/workflows/run-tests.yml
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
  a.download = `proof-test-config-${ts}.yml`;
  a.click();
  URL.revokeObjectURL(url);
}

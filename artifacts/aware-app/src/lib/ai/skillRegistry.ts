import type { AIUseCase } from "./types";
import { AI_USE_CASES } from "./useCases";
import { logInfo, logWarn } from "./debugLogger";

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  systemPrompt: string;
  tools: string[];
  exampleQueries: string[];
  requiredData: string[];
  analysisSteps: string[];
}

const SKILL_DEFINITIONS: SkillDefinition[] = AI_USE_CASES.map((uc: AIUseCase) => {
  const stepMap: Record<string, string[]> = {
    "failure-analysis": [
      "Fetch test results for the specified run",
      "Group failures by category and pattern",
      "Identify consistently failing tests",
      "Check environment-specific patterns",
      "Generate failure chart and recommendations",
    ],
    "flaky-detection": [
      "Collect test history across recent runs",
      "Compute flakiness scores from status flips",
      "Rank tests by flakiness percentage",
      "Flag tests exceeding 20% flakiness",
      "Generate flakiness bar chart",
    ],
    "anomaly-detection": [
      "Compute Z-scores for pass rate across all runs",
      "Detect runs with |Z| > 1.5 threshold",
      "Flag runs below average as anomalies",
      "Generate pass rate column chart with anomalies",
    ],
    "risk-scoring": [
      "Score pass rate contribution (40% weight)",
      "Score failure count contribution (20% weight)",
      "Score trend direction impact (20% weight)",
      "Score environment risk (20% weight)",
      "Compute composite score and risk level",
    ],
    "env-comparison": [
      "Group runs by environment ID",
      "Compute average pass rate per environment",
      "Compare pass rates across environments",
      "Detect potential environment drift",
    ],
    "category-health": [
      "Aggregate test results by category across all runs",
      "Compute pass rate per category",
      "Classify health: healthy/fair/unhealthy",
      "Sort by pass rate ascending",
    ],
    "coverage-gap": [
      "Compute test statistics by priority/severity",
      "Check for missing critical priority tests",
      "Evaluate category coverage percentage",
      "Compare automated vs manual test counts",
    ],
    "smart-alerting": [
      "Check latest run for failures",
      "Detect pass rate drops >10% from previous run",
      "Flag duration spikes >1.5x previous",
      "Count low-scoring runs below 80%",
    ],
    "run-frequency": [
      "Group runs by calendar day",
      "Compute average runs per day",
      "Find gaps between consecutive run days",
      "Assess run coverage adequacy",
    ],
    "suite-health": [
      "For each suite, aggregate test executions across runs",
      "Compute pass rate per suite",
      "Identify suites below 85% pass rate",
      "Sort by pass rate ascending",
    ],
    "quality-gate": [
      "Check pass rate >= 90% threshold",
      "Check failures < 5 threshold",
      "Check run status is not FAIL",
      "Evaluate all gates for pass/fail",
    ],
    "duration-budget": [
      "Aggregate test durations across all runs",
      "Compute average duration per test",
      "Filter tests exceeding 1000ms budget",
      "Sort by average duration descending",
    ],
    "test-redundancy": [
      "Group tests by category",
      "Find tests sharing base name patterns",
      "Identify groups with >1 similar test",
      "Flag as potential redundancy candidates",
    ],
    "regression-prediction": [
      "Track category pass rates over recent 10 runs",
      "Detect declining categories",
      "Calculate percentage decline for each category",
      "Flag declines >5% as at-risk",
    ],
    "performance-trends": [
      "Track per-test durations across runs",
      "Compute duration change percentage",
      "Identify tests with >20% duration increase",
      "Sort by change percentage descending",
    ],
    "root-cause-analysis": [
      "Find all failures in latest run",
      "Trace each failure back to first occurrence",
      "Categorize as systemic (recurring) or new",
      "Count reappearances for systemic issues",
    ],
    "failure-clustering": [
      "Collect failures from latest run",
      "Group by category::suite key",
      "Compute percentage contribution of each cluster",
      "Rank clusters by failure count",
    ],
    "cross-category-correlation": [
      "Track pass rates per category across runs",
      "Compute directional agreement between category pairs",
      "Filter pairs with >60% directional match",
      "Sort by correlation strength",
    ],
    "trend-forecasting": [
      "Extract pass rate from each chronological run",
      "Fit linear regression model to pass rates",
      "Forecast next 5 run pass rates",
      "Determine trend direction (improving/declining/stable)",
    ],
    "failure-impact": [
      "Identify all failures in latest run",
      "Map failures to affected test suites",
      "Group failures by category",
      "Compute blast radius metrics",
    ],
    "env-drift": [
      "Group test results by environment",
      "Compute per-category pass rates per environment",
      "Compare pass rates between environment pairs",
      "Flag categories with >10% pass rate difference",
    ],
    "build-risk-assessment": [
      "Score pass rate (35% weight)",
      "Score failure count (25% weight)",
      "Score trend vs previous build (25% weight)",
      "Score environment factor (15% weight)",
      "Compute composite risk level",
    ],
    "promotion-decision-support": [
      "Find latest UAT run and its pass rate",
      "Check UAT pass rate >= 95% threshold",
      "Check UAT failures < 5 threshold",
      "Check UAT/PROD parity within 5%",
      "Make promote/pending/block decision",
    ],
    "test-doc-gen": [
      "Collect all test cases and suites",
      "Group by category with automation stats",
      "Compute coverage percentages",
      "Generate comprehensive documentation",
    ],
    "release-readiness": [
      "Evaluate latest build pass rate (40%)",
      "Score healthy environment ratio (30%)",
      "Score failure impact (30%)",
      "Compute composite readiness score",
    ],
    "env-health-summary": [
      "Group runs by environment",
      "Compute average pass rate per environment",
      "Classify status as healthy/warning/unhealthy",
      "Sort by pass rate descending",
    ],
    "regression-report": [
      "Compare latest and previous run results",
      "Detect regressed tests (PASS->FAIL)",
      "Detect improved tests (FAIL->PASS)",
      "Count unchanged tests",
    ],
    "setup-guide": [
      "Provide setup steps for AWARE configuration",
      "List required GitHub secrets",
      "Explain config file formats",
      "Show common validation errors",
    ],
  };

  const dataDeps: Record<string, string[]> = {
    "failure-analysis": ["runs", "testResults"],
    "flaky-detection": ["runs", "testResults"],
    "anomaly-detection": ["runs"],
    "risk-scoring": ["runs"],
    "env-comparison": ["runs"],
    "category-health": ["runs", "testResults"],
    "coverage-gap": ["testCases"],
    "smart-alerting": ["runs"],
    "run-frequency": ["runs"],
    "suite-health": ["runs", "testResults", "suites"],
    "quality-gate": ["runs"],
    "duration-budget": ["runs", "testResults"],
    "test-redundancy": ["testCases"],
    "regression-prediction": ["runs", "testResults"],
    "performance-trends": ["runs", "testResults"],
    "root-cause-analysis": ["runs", "testResults"],
    "failure-clustering": ["testResults", "suites"],
    "cross-category-correlation": ["runs", "testResults"],
    "trend-forecasting": ["runs"],
    "failure-impact": ["testResults", "suites"],
    "env-drift": ["runs", "testResults"],
    "build-risk-assessment": ["runs"],
    "promotion-decision-support": ["runs", "promotions"],
    "test-doc-gen": ["testCases", "suites"],
    "release-readiness": ["runs"],
    "env-health-summary": ["runs"],
    "regression-report": ["runs", "testResults"],
    "setup-guide": [],
  };

  return {
    id: uc.id,
    name: uc.name,
    description: uc.description,
    category: uc.category,
    systemPrompt: uc.systemPrompt,
    tools: uc.tools,
    exampleQueries: uc.exampleQueries,
    requiredData: dataDeps[uc.id] || [],
    analysisSteps: stepMap[uc.id] || ["Analyze data", "Generate insights", "Build response"],
  };
});

export function getSkillDefinition(useCaseId: string): SkillDefinition | undefined {
  return SKILL_DEFINITIONS.find((s) => s.id === useCaseId);
}

export function getAllSkillDefinitions(): SkillDefinition[] {
  return SKILL_DEFINITIONS;
}

export function buildSkillContextPrompt(useCaseId: string, stepIndex: number): string {
  const skill = getSkillDefinition(useCaseId);
  if (!skill) return "";
  const steps = skill.analysisSteps;
  const totalSteps = steps.length;
  const currentStep = steps[stepIndex] || steps[steps.length - 1];
  const remainingSteps = steps.slice(stepIndex + 1);
  return [
    `[LANGGRAPH] Executing skill: ${skill.name}`,
    `[LANGGRAPH] Current step: ${currentStep} (${stepIndex + 1}/${totalSteps})`,
    remainingSteps.length > 0
      ? `[LANGGRAPH] Remaining: ${remainingSteps.join(" → ")}`
      : "[LANGGRAPH] Final step",
  ].join("\n");
}

export function getUseCaseForNode(nodeId: string): SkillDefinition | undefined {
  if (
    !nodeId ||
    nodeId === "data_fetch" ||
    nodeId === "context_build" ||
    nodeId === "skill_dispatch" ||
    nodeId === "chart_render" ||
    nodeId === "response"
  ) {
    return undefined;
  }
  return getSkillDefinition(nodeId);
}

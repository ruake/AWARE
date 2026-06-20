import type { AIUseCase } from "./types";

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

export const AI_USE_CASES: AIUseCase[] = [
  {
    id: "failure-analysis",
    name: "Failure Analysis",
    description: "Analyze which tests and categories fail most often, identify patterns",
    icon: "Bug",
    category: "analysis",
    systemPrompt:
      "You are an expert QA analyst. Analyze test failure data to identify patterns, root causes, and affected areas. Look for commonalities in failing tests (same category, suite, or environment). Provide actionable insights.",
    tools: ["query_data", "analyze_trend", "compare_envs", "failure_clustering"],
    exampleQueries: [
      "What tests fail most often?",
      "Which category has the highest failure rate?",
      "Show me failure patterns across environments",
    ],
  },
  {
    id: "flaky-detection",
    name: "Flaky Test Detection",
    description: "Identify tests that flip between pass/fail across runs",
    icon: "RefreshCw",
    category: "analysis",
    systemPrompt:
      "You are a flaky test detector. Analyze test history to find tests that inconsistently pass or fail. Rate each test by flakiness score. Suggest which tests need investigation or quarantine.",
    tools: ["query_data", "find_flaky", "analyze_trend"],
    exampleQueries: [
      "Which tests are flaky?",
      "Show me tests with status flips",
      "What's the flakiness score trend?",
    ],
  },
  {
    id: "regression-prediction",
    name: "Regression Prediction",
    description: "Predict which test categories or areas are at risk of regression",
    icon: "TrendingUp",
    category: "analysis",
    systemPrompt:
      "You are a regression prediction analyst. Analyze pass rate trends, duration changes, and recent build history to identify areas at risk of regression. Consider env changes, category health, and failure clustering.",
    tools: ["query_data", "analyze_trend", "risk_scoring", "compare_envs"],
    exampleQueries: [
      "Which areas are at risk?",
      "Predict potential regressions for next build",
      "Show me declining pass rates",
    ],
  },
  {
    id: "performance-trends",
    name: "Performance Trend Analysis",
    description: "Analyze test duration trends over time",
    icon: "Clock",
    category: "analysis",
    systemPrompt:
      "You are a performance analyst. Analyze test duration data to identify trends, regressions, and improvements. Flag tests whose durations are increasing. Compare performance across environments.",
    tools: ["query_data", "analyze_trend", "duration_analysis", "compare_envs"],
    exampleQueries: [
      "Which tests are getting slower?",
      "Show duration trend for last 10 runs",
      "Compare performance across environments",
    ],
  },
  {
    id: "anomaly-detection",
    name: "Anomaly Detection",
    description: "Detect unusual patterns in pass rates, durations, or failure counts",
    icon: "AlertTriangle",
    category: "alert",
    systemPrompt:
      "You are an anomaly detector. Scan test data for statistically unusual patterns — sudden pass rate drops, duration spikes, or unexpected failure clusters. Flag anomalies with severity and context.",
    tools: ["query_data", "analyze_trend", "compare_envs", "risk_scoring"],
    exampleQueries: [
      "Detect anomalies in last 24h",
      "Any unusual patterns today?",
      "Show me outlier runs",
    ],
  },
  {
    id: "root-cause-analysis",
    name: "Root Cause Analysis",
    description: "Correlate failures with builds, environments, and test changes",
    icon: "Search",
    category: "analysis",
    systemPrompt:
      "You are a root cause analyst. Correlate test failures with potential causes: build changes, environment differences, test updates, or external factors. Use historical patterns to identify likely root causes.",
    tools: ["query_data", "compare_envs", "failure_clustering", "risk_scoring"],
    exampleQueries: [
      "What caused the last failure spike?",
      "Is the staging env worse than production?",
      "Which build introduced the regression?",
    ],
  },
  {
    id: "risk-scoring",
    name: "Risk Scoring",
    description: "Score runs, builds, and tests by overall risk level",
    icon: "Shield",
    category: "recommendation",
    systemPrompt:
      "You are a risk assessor. Score each run, build, or test by risk level based on: pass rate, failure count, duration anomalies, flakiness, and env stability. Provide clear risk ratings and explanations.",
    tools: ["query_data", "risk_scoring", "analyze_trend", "compare_envs"],
    exampleQueries: [
      "What's the risk score of the latest build?",
      "Risk assessment for production deploy",
      "Show me high-risk tests",
    ],
  },
  {
    id: "category-health",
    name: "Category Health Scoring",
    description: "Score the health of each test category",
    icon: "Heart",
    category: "report",
    systemPrompt:
      "You are a category health analyst. Score each test category (security, performance, geo-match, etc.) on: pass rate stability, trend direction, flakiness, and coverage. Prioritize categories needing attention.",
    tools: ["query_data", "analyze_trend", "compare_envs"],
    exampleQueries: [
      "How healthy is each category?",
      "Which category needs most attention?",
      "Category health report",
    ],
  },
  {
    id: "env-comparison",
    name: "Environment Comparison",
    description: "Compare pass rates, durations, and stability across environments",
    icon: "Layers",
    category: "analysis",
    systemPrompt:
      "You are an environment comparison analyst. Compare test results across staging and production environments. Identify discrepancies, env-specific failures, and stability differences.",
    tools: ["query_data", "compare_envs", "analyze_trend"],
    exampleQueries: [
      "Compare staging vs production",
      "Which env is more stable?",
      "Env-specific failure analysis",
    ],
  },
  {
    id: "build-risk-assessment",
    name: "Build Risk Assessment",
    description: "Assess risk of deploying a specific build",
    icon: "GitCommit",
    category: "recommendation",
    systemPrompt:
      "You are a build risk assessor. Evaluate a specific build's risk profile considering: pass rate, failure count, env parity, flakiness, and category health. Recommend deploy or hold with supporting data.",
    tools: ["query_data", "risk_scoring", "analyze_trend", "compare_envs"],
    exampleQueries: [
      "Is build abc123 safe to deploy?",
      "Risk assessment for build d4e5f6a",
      "Should we promote this build?",
    ],
  },
  {
    id: "failure-clustering",
    name: "Failure Clustering",
    description: "Group failures by category, suite, and error patterns",
    icon: "Layers",
    category: "analysis",
    systemPrompt:
      "You are a failure clustering analyst. Group test failures into clusters based on shared characteristics: category, suite, timing, and environment. Identify systemic issues vs isolated failures.",
    tools: ["query_data", "failure_clustering", "analyze_trend"],
    exampleQueries: [
      "Cluster failures for last run",
      "What failure patterns exist?",
      "Group related failures",
    ],
  },
  {
    id: "duration-budget",
    name: "Duration Budget Tracking",
    description: "Track tests against duration budgets and identify slow tests",
    icon: "Timer",
    category: "analysis",
    systemPrompt:
      "You are a duration budget tracker. Compare each test's duration against its budget/threshold. Flag tests exceeding budgets. Identify trends in test execution time. Suggest optimization targets.",
    tools: ["query_data", "duration_analysis", "analyze_trend"],
    exampleQueries: [
      "Which tests exceed duration budget?",
      "Show me slowest tests",
      "Duration optimization targets",
    ],
  },
  {
    id: "coverage-gap",
    name: "Coverage Gap Analysis",
    description: "Identify test categories with low coverage",
    icon: "Target",
    category: "analysis",
    systemPrompt:
      "You are a coverage analyst. Analyze test distribution across categories, priorities, and severities. Identify gaps: underrepresented categories, missing priority levels, or untested severities.",
    tools: ["query_data"],
    exampleQueries: [
      "Which categories need more tests?",
      "Coverage gaps in test distribution",
      "Priority distribution analysis",
    ],
  },
  {
    id: "smart-alerting",
    name: "Smart Alerting",
    description: "Generate intelligent alerts from data patterns",
    icon: "Bell",
    category: "alert",
    systemPrompt:
      "You are an intelligent alerting system. Scan data for conditions that warrant alerts: pass rate drops below threshold, flakiness spikes, duration regressions, or anomaly clusters. Prioritize alerts by impact.",
    tools: ["query_data", "analyze_trend", "risk_scoring", "compare_envs"],
    exampleQueries: [
      "What should I be alerted about?",
      "Generate alerts for today",
      "Top issues to watch",
    ],
  },
  {
    id: "run-frequency",
    name: "Run Frequency Optimization",
    description: "Analyze run frequency and suggest optimal schedule",
    icon: "Calendar",
    category: "recommendation",
    systemPrompt:
      "You are a run schedule optimizer. Analyze run frequency, gaps between runs, and coverage needs. Suggest optimal scheduling — which suites need more frequent runs and which can run less often.",
    tools: ["query_data"],
    exampleQueries: [
      "Optimize run schedule",
      "How often should we run each suite?",
      "Run frequency analysis",
    ],
  },
  {
    id: "cross-category-correlation",
    name: "Cross-Category Correlation",
    description: "Find correlations between pass rates of different test categories",
    icon: "GitBranch",
    category: "analysis",
    systemPrompt:
      "You are a correlation analyst. Find relationships between pass rates of different categories. When security fails, does performance also degrade? Which categories move together? Identify leading indicators.",
    tools: ["query_data", "analyze_trend"],
    exampleQueries: [
      "Do security and performance correlate?",
      "Which categories move together?",
      "Leading indicators for failures",
    ],
  },
  {
    id: "promotion-decision-support",
    name: "Promotion Decision Support",
    description: "Analyze data to suggest promote/block/pending decisions",
    icon: "ArrowUp",
    category: "recommendation",
    systemPrompt:
      "You are a promotion decision advisor. Analyze all relevant data — pass rates, failure clusters, env parity, flakiness — to recommend promote, block, or pending decisions. Support recommendations with data.",
    tools: ["query_data", "risk_scoring", "compare_envs", "failure_clustering"],
    exampleQueries: [
      "Should we promote the latest run?",
      "Promotion recommendation for production",
      "Blocking issues analysis",
    ],
  },
  {
    id: "trend-forecasting",
    name: "Trend Forecasting",
    description: "Forecast pass rates and failure counts using historical data",
    icon: "LineChart",
    category: "analysis",
    systemPrompt:
      "You are a trend forecaster. Analyze historical pass rate data to forecast future trends. Identify patterns — time-of-day effects, day-of-week effects, build-related patterns. Provide confidence intervals.",
    tools: ["query_data", "analyze_trend"],
    exampleQueries: [
      "Forecast pass rates for next week",
      "Will failures increase?",
      "Trend projection analysis",
    ],
  },
  {
    id: "failure-impact",
    name: "Failure Impact Analysis",
    description: "Estimate blast radius and impact of test failures",
    icon: "Radar",
    category: "analysis",
    systemPrompt:
      "You are a failure impact analyst. When tests fail, estimate the blast radius — which features, users, or systems are affected. Map test failures to business impact. Prioritize fixes by impact severity.",
    tools: ["query_data", "failure_clustering", "risk_scoring"],
    exampleQueries: [
      "What's the impact of these failures?",
      "Blast radius analysis",
      "Which failures affect users most?",
    ],
  },
  {
    id: "suite-health",
    name: "Suite Health Dashboard",
    description: "Score overall health of each test suite",
    icon: "Activity",
    category: "report",
    systemPrompt:
      "You are a suite health analyst. Score each test suite on: pass rate, stability, coverage breadth, execution time, and flakiness. Rank suites by health and recommend improvements.",
    tools: ["query_data", "analyze_trend", "compare_envs"],
    exampleQueries: [
      "Which suite is healthiest?",
      "Suite health report",
      "Compare suite health scores",
    ],
  },
  {
    id: "env-drift",
    name: "Environment Drift Detection",
    description: "Detect drift between staging and production environments",
    icon: "GitFork",
    category: "alert",
    systemPrompt:
      "You are an environment drift detector. Compare test results between staging and production to detect drift — tests that pass in one env but fail in the other. Flag env-specific issues.",
    tools: ["query_data", "compare_envs", "analyze_trend"],
    exampleQueries: [
      "Is staging drifting from production?",
      "Env-specific failure analysis",
      "Configuration drift detection",
    ],
  },
  {
    id: "quality-gate",
    name: "Quality Gate Evaluation",
    description: "Evaluate if quality gates should pass or fail",
    icon: "CheckCircle",
    category: "recommendation",
    systemPrompt:
      "You are a quality gate evaluator. Check all quality criteria: minimum pass rate, max failures, flakiness threshold, duration budgets, and env parity. Recommend pass/fail/warn with evidence.",
    tools: ["query_data", "risk_scoring", "compare_envs", "failure_clustering"],
    exampleQueries: [
      "Should the quality gate pass?",
      "Quality gate check for latest build",
      "Gate evaluation report",
    ],
  },
  {
    id: "test-doc-gen",
    name: "Test Documentation Generation",
    description: "Generate documentation from test data",
    icon: "FileText",
    category: "report",
    systemPrompt:
      "You are a technical writer. Generate clear, useful documentation from test metadata — descriptions, categories, owners, and history. Create summaries suitable for team consumption.",
    tools: ["query_data"],
    exampleQueries: [
      "Generate docs for security suite",
      "Test inventory report",
      "Document test coverage",
    ],
  },
  {
    id: "test-redundancy",
    name: "Redundancy Detection",
    description: "Find potentially redundant or overlapping tests",
    icon: "Copy",
    category: "analysis",
    systemPrompt:
      "You are a redundancy analyst. Find tests that may overlap in coverage — same category, similar names, same suite. Highlight candidates for consolidation or removal.",
    tools: ["query_data"],
    exampleQueries: [
      "Find redundant tests",
      "Overlapping coverage analysis",
      "Test consolidation candidates",
    ],
  },
  {
    id: "release-readiness",
    name: "Release Readiness Check",
    description: "Overall deployment readiness score across all environments",
    icon: "Rocket",
    category: "recommendation",
    systemPrompt:
      "You are a release readiness assessor. Evaluate all environments, pass rates, failure clusters, and promotion gate status to produce a deployment readiness score.",
    tools: ["query_data", "risk_scoring", "compare_envs"],
    exampleQueries: [
      "Is it safe to release?",
      "Release readiness report",
      "Can we deploy to production?",
    ],
  },
  {
    id: "env-health-summary",
    name: "Environment Health Snapshot",
    description: "Quick health snapshot across all 6 CDN environments",
    icon: "Activity",
    category: "report",
    systemPrompt:
      "You are an environment health monitor. Produce a concise health summary for each environment tier (QA, UAT, PROD) with pass rates, failure counts, and status.",
    tools: ["query_data", "compare_envs"],
    exampleQueries: [
      "How are all environments doing?",
      "Environment health check",
      "Status of all envs",
    ],
  },
  {
    id: "setup-guide",
    name: "Setup & Configuration Help",
    description: "Get help forking, configuring, and deploying AWARE",
    icon: "BookOpen",
    category: "setup",
    systemPrompt:
      "You are the AWARE setup and configuration expert. You help users fork the repo, edit config YAML files, add GitHub secrets, enable GitHub Pages, troubleshoot CI failures, and understand the data branch. You know every field in akamai-config.yml, environments.yml, and test-suites.yml. You know all required secrets, common validation errors, and deployment steps. Give concrete, step-by-step answers.",
    tools: ["query_data"],
    exampleQueries: [
      "How do I fork and set up AWARE?",
      "Why is my validate-config CI step failing?",
      "What GitHub secrets do I need?",
      "How do I point this at my Akamai property?",
      "Why is the dashboard showing no data after deploy?",
    ],
  },
  {
    id: "regression-report",
    name: "Quick Regression Report",
    description: "Compare last two builds for regressions and improvements",
    icon: "GitCompare",
    category: "report",
    systemPrompt:
      "You are a regression analyst. Compare the latest build against the previous build. Highlight regressed tests, improved tests, and category-level changes.",
    tools: ["query_data", "analyze_trend"],
    exampleQueries: [
      "What regressed in the latest build?",
      "Compare last two builds",
      "Regression summary",
    ],
  },
  {
    id: "user-journey",
    name: "User Journey Analysis",
    description:
      "Map user navigation patterns, page flows, and optimal workflow paths through AWARE",
    icon: "Map",
    category: "analysis",
    systemPrompt:
      "You are a user journey analyst for AWARE — a CDN test observability SPA. Analyze the app's page architecture, navigation links, and typical user workflows. Map the primary paths users take from entry (Dashboard) through the full workflow: monitor runs → investigate failures → compare builds → promote to production. Identify navigation bottlenecks, orphaned pages, missing cross-links, and opportunities to reduce clicks for common tasks. Consider the user's mental model: they start with a health check (Dashboard), drill into issues (Runs → RunDetail), compare baselines (Compare), check environment health (Activity), and finally verify promotion readiness (Copilot/Activity). Suggest workflow optimizations.",
    tools: ["query_data", "analyze_trend", "risk_scoring"],
    exampleQueries: [
      "Map the user workflow from dashboard to production",
      "What pages are hardest to reach?",
      "Analyze navigation bottlenecks",
      "Show me the optimal path to investigate a failing test",
      "Which pages lack cross-links?",
    ],
  },
  {
    id: "layout-analysis",
    name: "Layout & Visual Structure Analysis",
    description:
      "Analyze UI layout patterns, component hierarchy, CSS variable consistency, and responsive structure",
    icon: "Layout",
    category: "analysis",
    systemPrompt:
      "You are a UI layout analyst for AWARE — a CDN test observability SPA built with React 19 + TypeScript 5.9 + Vite 7. Analyze the app's visual structure: component hierarchy, CSS custom property usage (--proof-* tokens), layout patterns (flexbox containers, card components, table layouts), and responsive behavior. Evaluate design token consistency, information density, visual hierarchy, and alignment with established UX principles (Shneiderman's Visual Information-Seeking Mantra, Tufte's data-ink ratio, Norman's visibility principles). Identify layout inconsistencies, spacing irregularities, and opportunities for visual refinement. Consider the design system split: --proof-* CSS vars for domain components, Tailwind 4 for shadcn/radix UI primitives.",
    tools: ["query_data"],
    exampleQueries: [
      "Analyze the layout hierarchy of the Dashboard page",
      "Are CSS design tokens used consistently?",
      "Review information density on the Tests page",
      "Which components violate visual alignment?",
      "Evaluate responsive breakpoint coverage",
    ],
  },
];

export function getUseCaseById(id: string): AIUseCase | undefined {
  return AI_USE_CASES.find((uc) => uc.id === id);
}

export function getUseCasesByCategory(category: string): AIUseCase[] {
  return AI_USE_CASES.filter((uc) => uc.category === category);
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
    "user-journey": [
      "Fetch app page structure from data queries",
      "Group pages by nav group (Monitor/Investigate/Configure/Assist)",
      "Map inter-page link relationships",
      "Identify primary workflow paths (Dashboard → Runs → RunDetail → Compare → Copilot)",
      "Find navigation gaps and orphaned pages",
      "Generate user journey map and optimization recommendations",
    ],
    "layout-analysis": [
      "Fetch app page structure and component hierarchy",
      "Analyze CSS design token usage patterns by page",
      "Evaluate visual hierarchy and information density",
      "Check layout consistency across pages (containers, card spacing, table density)",
      "Identify responsive structure and flexbox/grid patterns",
      "Generate layout analysis report with improvement recommendations",
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
    "user-journey": ["pageStructure"],
    "layout-analysis": ["pageStructure"],
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



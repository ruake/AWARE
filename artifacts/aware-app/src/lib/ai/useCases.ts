import type { AIUseCase } from "./types";

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
];

export function getUseCaseById(id: string): AIUseCase | undefined {
  return AI_USE_CASES.find((uc) => uc.id === id);
}

export function getUseCasesByCategory(category: string): AIUseCase[] {
  return AI_USE_CASES.filter((uc) => uc.category === category);
}

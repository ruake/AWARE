export interface UseCase {
  id: string;
  name: string;
  description: string;
  trigger: string[];
}

export const USE_CASES: UseCase[] = [
  {
    id: "analyze-failures",
    name: "Analyze Failures",
    description: "Analyze recent test failures and identify root causes",
    trigger: ["fail", "error", "broken", "regression"],
  },
  {
    id: "flakiness",
    name: "Flakiness Analysis",
    description: "Identify flaky tests based on pass/fail history",
    trigger: ["flake", "flaky", "intermittent"],
  },
  {
    id: "performance",
    name: "Performance Review",
    description: "Review test execution times and identify slow tests",
    trigger: ["slow", "performance", "timing", "duration"],
  },
  {
    id: "coverage",
    name: "Test Coverage",
    description: "Analyze test coverage across categories and environments",
    trigger: ["coverage", "coverage gap", "missing"],
  },
  {
    id: "promotion",
    name: "Promotion Gate",
    description: "Check if promotion criteria are met for production",
    trigger: ["promotion", "promote", "gate", "production"],
  },
];

export interface HelpEntry {
  id: string;
  selector: string;
  title: string;
  content: string;
  link?: string;
}

const registry = new Map<string, HelpEntry>();

export function registerHelp(id: string, entry: HelpEntry): void {
  registry.set(id, { ...entry, id });
}

export function getHelp(id: string): HelpEntry | undefined {
  return registry.get(id);
}

export function getHelpForElement(el: Element): HelpEntry | undefined {
  const id = el.getAttribute("data-help-id");
  if (id) return registry.get(id);
  const helpIds = Array.from(el.querySelectorAll("[data-help-id]")).map(
    (child) => child.getAttribute("data-help-id")
  );
  for (const hid of helpIds) {
    if (hid) {
      const entry = registry.get(hid);
      if (entry) return entry;
    }
  }
  return undefined;
}

export function getAllHelpEntries(): HelpEntry[] {
  return Array.from(registry.values());
}

export function searchHelp(query: string): HelpEntry[] {
  const q = query.toLowerCase();
  return Array.from(registry.values()).filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
  );
}

registerHelp("pass-rate", {
  id: "pass-rate",
  selector: "[data-help-id='pass-rate']",
  title: "Pass Rate",
  content:
    "Pass rate is the percentage of tests that passed in this run. Calculated as (passed / total) × 100. Rates above 95% are considered healthy.",
});

registerHelp("env-filter", {
  id: "env-filter",
  selector: "[data-help-id='env-filter']",
  title: "Environment Filter",
  content:
    "Filter runs by environment (QA, UAT, PROD) and network (staging, production). Use this to isolate test results for a specific deployment target.",
});

registerHelp("compare", {
  id: "compare",
  selector: "[data-help-id='compare']",
  title: "Compare Runs",
  content:
    "Compare two runs to see regressions, fixes, and unchanged tests. Select a baseline (before) and candidate (after) to analyze differences in test outcomes and durations.",
  link: "/compare",
});

registerHelp("flakiness", {
  id: "flakiness",
  selector: "[data-help-id='flakiness']",
  title: "Flakiness Score",
  content:
    "Flakiness score measures how often a test toggles between pass and fail across recent runs. Higher scores indicate less reliable tests that may need investigation.",
});

registerHelp("promotion", {
  id: "promotion",
  selector: "[data-help-id='promotion']",
  title: "Promotion Gate",
  content:
    "A promotion gates a property version from staging to production. UAT regression must meet a minimum pass rate threshold before promotion to PROD is allowed.",
});

registerHelp("anomaly", {
  id: "anomaly",
  selector: "[data-help-id='anomaly']",
  title: "Anomaly Detection",
  content:
    "Anomalies are detected using Z-scores over a 7-day rolling window. A test result is flagged as anomalous when its pass rate deviates significantly from its historical baseline.",
});

registerHelp("total-tests", {
  id: "total-tests",
  selector: "[data-help-id='total-tests']",
  title: "Total Tests",
  content:
    "The total number of test cases executed in this run, including passed, failed, skipped, and flaky results.",
});

registerHelp("passed-tests", {
  id: "passed-tests",
  selector: "[data-help-id='passed-tests']",
  title: "Passed Tests",
  content:
    "The number of tests that completed successfully with all assertions passing.",
});

registerHelp("failed-tests", {
  id: "failed-tests",
  selector: "[data-help-id='failed-tests']",
  title: "Failed Tests",
  content:
    "The number of tests that failed due to assertion errors, timeouts, or runtime exceptions.",
});

registerHelp("global-pass-rate", {
  id: "global-pass-rate",
  selector: "[data-help-id='global-pass-rate']",
  title: "Global Pass Rate",
  content:
    "The overall pass rate trend across all environments and runs. Use this chart to spot broad degradation or improvement in test health.",
});

registerHelp("search-diffs", {
  id: "search-diffs",
  selector: "[data-help-id='search-diffs']",
  title: "Search Diffs",
  content:
    "Search and filter through comparison results by test name or diff state (regression, fixed, unchanged, duration).",
});

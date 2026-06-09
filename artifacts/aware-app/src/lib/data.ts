// ── Data-layer barrel for @/lib/data ─────────────────────────────────
// Re-exports the core data-domain API (runs, test cases, suites,
// promotions, types, and the most-commonly-used convenience modules.
// For AI/LLM, nav, CI config, etc., import directly from their modules
// or use @/lib (the complete fan-out barrel).

export type {
  Run, TestResult, TestDetail, TestRunPoint, DiffRow,
  TestCase, TestSuite, TestTag, TestChangeLogEntry, PromotionDecision,
  Predicate, FilmstripConfig, TestStats, TestCaseFilter, SuiteNode,
  TestPriority, TestSeverity, TestStatus,
} from "./types";

export type { RunFrequency } from "./runs";

export {
  loadFromStorage,
} from "./store";

export {
  RUNS, getRunIndex, getRunById,
  DIFF_ROWS, TEST_DETAILS, ENV_SUMMARY,
  PASS_RATE_CHART, ENV_PASS_RATE_CHART, PER_ENV_PASS_RATE, getTestResultsForRun,
  computeRunFrequency,
} from "./runs";

export {
  getTestCases, getTestCaseById,
  getTestChangelog, computeTestStats, getTestCasesByFilter,
  subscribeToTestCases,
} from "./testCases";

export {
  getTestSuites, getTestSuiteById,
  buildSuiteTree,
  subscribeToTestSuites,
} from "./testSuites";

export {
  getPromotionDecision,
  getAllPromotionDecisions,
} from "./promotions";

export { getTestCasesBySuiteId } from "./operations";

export {
  ENVS, CATEGORIES, PRIORITIES, SEVERITIES, STATUSES, OWNERS,
  TAG_COLORS, CATEGORY_COLORS, TEST_TAGS, TEST_NAMES,
} from "./constants";

export { navTo, copyToClipboard, showToast, repo } from "./nav";

export { useSyncedUrlState } from "./urlState";

export {
  getEnvConfigs, getEnvLabels, getEnvConfig, getEnvConfigById,
  subscribeToEnvConfigs,
} from "./envConfig";

export {
  getAutoDiscoveredTests, getAutoDiscoverySummary,
} from "./testDiscovery";



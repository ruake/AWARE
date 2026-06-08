// ── Data-layer barrel for @/lib/data ─────────────────────────────────
// Re-exports the core data-domain API (runs, test cases, suites,
// promotions, types, and the most-commonly-used convenience modules).
// For AI/LLM, nav, CI config, etc., import directly from their modules
// or use @/lib (the complete fan-out barrel).

export type {
  Run, TestResult, TestDetail, TestRunPoint, DiffRow,
  TestCase, TestSuite, TestTag, TestChangeLogEntry, PromotionDecision,
  Predicate, FilmstripConfig, TestStats, TestCaseFilter, SuiteNode,
  GenerateParams, ImportResult,
  TestPriority, TestSeverity, TestStatus,
} from "./types";

export type { RunFrequency } from "./runs";

export {
  loadFromStorage, saveToStorage,
} from "./store";

export {
  RUNS, getRunIndex, getRunById, generateTestHistory, detectAnomaly,
  DIFF_ROWS, TEST_DETAILS, ENV_SUMMARY,
  PASS_RATE_CHART, ENV_PASS_RATE_CHART, PER_ENV_PASS_RATE, getTestResultsForRun,
  computeRunFrequency,
} from "./runs";

export {
  getTestCases, getTestCaseById,
  createTestCase, updateTestCase, deleteTestCase,
  updateTestCaseDocumentation, getTestChangelog,
  importTestCases, exportTestCases, exportTestsAsJunitXml,
  generateTestCases, computeTestStats, getTestCasesByFilter,
  resetTestCasesStore, subscribeToTestCases,
} from "./testCases";

export {
  getTestSuites, getTestSuiteById,
  createTestSuite, updateTestSuite, deleteTestSuite,
  addTestsToSuite, removeTestsFromSuite,
  buildSuiteTree,
  resetTestSuitesStore, subscribeToTestSuites,
} from "./testSuites";

export {
  getPromotionDecision, setPromotionDecision,
  getAllPromotionDecisions, resetPromotionDecisions,
} from "./promotions";

export { getTestCasesBySuiteId } from "./operations";

export {
  ENVS, CATEGORIES, PRIORITIES, SEVERITIES, STATUSES, OWNERS,
  TAG_COLORS, CATEGORY_COLORS, TEST_TAGS, TEST_NAMES,
  GENERATION_TEMPLATES,
} from "./constants";

export { navTo, copyToClipboard, showToast, repo } from "./nav";

export { useSyncedUrlState } from "./urlState";

export {
  getEnvConfigs, getEnvLabels, getEnvConfig, getEnvConfigById,
  addEnvConfig, updateEnvConfig, removeEnvConfig, resetEnvConfigs,
  subscribeToEnvConfigs,
} from "./envConfig";

export {
  reconcile, checkTestCaseInRepo, getCheckInSteps, generateYamlContent, onSyncStatusChange, fetchManifest,
} from "./gitHubSync";

export {
  getFeatureFlags, updateFeatureFlag, subscribeToFeatureFlags, resetFeatureFlags,
} from "./featureFlags";

// ── Cross-cutting ────────────────────────────────────────────────────
import { resetTestCasesStore } from "./testCases";
import { resetTestSuitesStore } from "./testSuites";
import { resetPromotionDecisions } from "./promotions";

export function resetTestStore(): void {
  resetTestCasesStore();
  resetTestSuitesStore();
  resetPromotionDecisions();
}

// Barrel re-export for backward compatibility.
// New code should import directly from domain modules.

export type {
  Run, TestResult, TestDetail, TestRunPoint, DiffRow,
  TestCase, TestSuite, TestTag, TestChangeLogEntry, PromotionDecision,
  Predicate, FilmstripConfig, TestStats, TestCaseFilter, SuiteNode,
  GenerateParams, ImportResult
} from "./types";

export {
  RUNS, getRunIndex, getRunById, generateTestHistory,
  DIFF_ROWS, TEST_DETAILS, ENV_SUMMARY,
  PASS_RATE_CHART, ENV_PASS_RATE_CHART, getTestResultsForRun,
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
  getTestCasesBySuiteId, buildSuiteTree,
  resetTestSuitesStore, subscribeToTestSuites,
} from "./testSuites";

export {
  getPromotionDecision, setPromotionDecision,
  getAllPromotionDecisions, resetPromotionDecisions,
} from "./promotions";

// Cross-cutting orchestration — resets all stores
import { resetTestCasesStore } from "./testCases";
import { resetTestSuitesStore } from "./testSuites";
import { resetPromotionDecisions } from "./promotions";

export function resetTestStore(): void {
  resetTestCasesStore();
  resetTestSuitesStore();
  resetPromotionDecisions();
}

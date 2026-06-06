// Barrel export for _shared utilities.
// Prefer named imports from this file for convenience:
//   import { AppLayout, useRuns, navTo, ColumnFilter, ErrorBoundary } from "./_shared";
// Direct imports from individual files are also supported.

// Components
export { AppLayout } from "./AppLayout";
export { ColumnFilter, type ColumnFilterState } from "./ColumnFilter";
export { CommandPalette } from "./CommandPalette";
export { ErrorBoundary } from "./ErrorBoundary";
export { Skeleton, CardSkeleton, TableSkeleton, ChartSkeleton } from "./skeleton";

// Hooks
export { useRuns, useRunById, useRunIndex, useTestResults, useDiffs, useTestDetails, useEnvSummary, useTestHistory, usePassRateData, useEnvPassRateData, useSyncRuns, useSyncDiffs, useSyncEnvSummary, useSyncTestDetails, useTestCases, useTestCaseById, useTestSuites, useTestSuiteTree, useTestTags, useFilteredTestCases, useCreateTestCase, useUpdateTestCase, useDeleteTestCase, useImportTestCases, useExportTestCases, useSyncTestCases, useSyncTestSuites, useGenerateTestCases, useTestStats, useTestChangelog, useUpdateDocumentation } from "./hooks";
export { useSyncedUrlState } from "./urlState";
export { useLiveStatus } from "./useLiveStatus";

// Utilities
export { navTo, closePanel, showToast, copyToClipboard, repo } from "./nav";

// Types & data (for advanced use)
export type { Run, TestResult, TestRunPoint, TestDetail, DiffRow, EnvSummary, StatusUpdate, Config, ServiceError, TestCase, TestSuite, TestTag, TestCaseFilter, ImportResult, ImportExportFormat, TestPriority, TestSeverity, TestStatus, SuiteNode, GenerateParams, TestStats, TestChangeLogEntry, TestSuiteConfig } from "./types";

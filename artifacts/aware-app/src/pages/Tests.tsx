import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { getAutoDiscoveredTests, getDataInitState, subscribeToDataInit } from "@/lib/data";
import { useTestData } from "@/hooks/useTestData";
import { useSyncedUrlState } from "@/lib/urlState";
import { PageTemplate } from "@/components/aware";
import type { TestSuite } from "@/lib/types";
import {
  TestFilters,
  TestList,
  SuiteDetailPanel,
  TestDetailPanel,
} from "@/components/aware";

function _getSuiteChildren(suite: TestSuite, allSuites: TestSuite[]): TestSuite[] {
  return allSuites.filter((s) => s.parentId === suite.id);
}

function _getSuiteDepth(suite: TestSuite, allSuites: TestSuite[], depth = 0): number {
  if (!suite.parentId) return depth;
  const parent = allSuites.find((s) => s.id === suite.parentId);
  return parent ? _getSuiteDepth(parent, allSuites, depth + 1) : depth;
}

export default function Tests() {
  const { tcs, suites } = useTestData();
  const [, navigate] = useLocation();
  const initState = useSyncExternalStore(subscribeToDataInit, getDataInitState);
  const rawSearch = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const suiteFilter = rawSearch.get("suite") || "";
  const detailId = rawSearch.get("detail") || "";

  const [search, setSearch] = useSyncedUrlState("q", "");
  const [testType, setTestType] = useSyncedUrlState("type", "All");
  const [category, setCategory] = useSyncedUrlState("cat", "All");
  const [status, setStatus] = useSyncedUrlState("status", "All");
  const [priority, setPriority] = useSyncedUrlState("pri", "All");
  const [page, setPage] = React.useState(1);
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);

  const allTests = React.useMemo(() => getAutoDiscoveredTests(), []);

  const filtered = React.useMemo(() => {
    let result = allTests;
    if (suiteFilter) {
      const suite = suites.find((s) => s.id === suiteFilter);
      if (suite) result = result.filter((t) => suite.testIds.includes(t.id));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }
    if (testType !== "All") result = result.filter((t) => t.testType === testType);
    if (category !== "All") result = result.filter((t) => t.category === category);
    if (status !== "All") result = result.filter((t) => t.status === status);
    if (priority !== "All") result = result.filter((t) => t.priority === priority);
    return result;
  }, [allTests, suiteFilter, search, testType, category, status, priority, suites]);

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  const typeCounts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of allTests) c[t.testType] = (c[t.testType] || 0) + 1;
    return c;
  }, [allTests]);

  const categoryCounts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of allTests) c[t.category] = (c[t.category] || 0) + 1;
    return c;
  }, [allTests]);

  const selectedSuite = suiteFilter ? (suites.find((s) => s.id === suiteFilter) ?? null) : null;
  const selectedTest = detailId ? (tcs.find((t) => t.id === detailId) ?? null) : null;

  return (
    <PageTemplate
      title="Tests"
      subtitle={`${allTests.length} total tests · ${suites.length} suites`}
      loading={initState.loading && allTests.length === 0}
      loadingRows={8}
      loadingCols={5}
      filters={
        <TestFilters
          search={search}
          onSearchChange={setSearch}
          testType={testType}
          onTestTypeChange={setTestType}
          category={category}
          onCategoryChange={setCategory}
          status={status}
          onStatusChange={setStatus}
          priority={priority}
          onPriorityChange={setPriority}
          suiteFilter={suiteFilter}
          selectedSuite={selectedSuite}
          onClearSuite={() => navigate("/tests")}
          typeCounts={typeCounts}
          categoryCounts={categoryCounts}
          filteredCount={filtered.length}
          totalCount={allTests.length}
        />
      }
      sidePanel={selectedTest ? (
        <TestDetailPanel
          test={selectedTest}
          parentSuite={selectedSuite}
          onClose={() => navigate(`/tests${suiteFilter ? `?suite=${suiteFilter}` : ""}`)}
        />
      ) : selectedSuite ? (
        <SuiteDetailPanel
          suite={selectedSuite}
          tests={tcs.filter((t) => selectedSuite.testIds.includes(t.id))}
          onClose={() => navigate("/tests")}
          onTestSelect={(testId) => navigate(`/tests?suite=${suiteFilter}&detail=${testId}`)}
        />
      ) : undefined}
      sidePanelWidth={380}
      currentPage={page}
      totalPages={totalPages}
      totalItems={filtered.length}
      pageSize={PAGE_SIZE}
      onPageChange={(p) => setPage(p)}
    >
      <TestList
        pageItems={pageItems}
        hoveredRow={hoveredRow}
        onHoverRow={setHoveredRow}
        detailId={detailId}
        suiteFilter={suiteFilter}
        page={page}
        filteredCount={filtered.length}
        onPageChange={setPage}
      />
    </PageTemplate>
  );
}

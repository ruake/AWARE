import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import {
  getAutoDiscoveredTests,
  subscribeToAutoTests,
  getDataInitState,
  subscribeToDataInit,
} from "@/lib/data";
import { useTestData } from "@/hooks/useTestData";
import { useSyncedUrlState } from "@/lib/urlState";
import { PageTemplate } from "@/components/aware";
import type { TestSuite } from "@/lib/types";
import { TestFilters, TestList, SuiteDetailPanel, TestDetailPanel } from "@/components/aware";

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
  const [suiteFilter] = useSyncedUrlState("suite", "");
  const [detailId] = useSyncedUrlState("detail", "");

  const [search, setSearch] = useSyncedUrlState("q", "");
  const [testType, setTestType] = useSyncedUrlState("type", "All");
  const [category, setCategory] = useSyncedUrlState("cat", "All");
  const [status, setStatus] = useSyncedUrlState("status", "All");
  const [priority, setPriority] = useSyncedUrlState("pri", "All");
  const [page, setPage] = React.useState(1);
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);

  const allTests = useSyncExternalStore(subscribeToAutoTests, getAutoDiscoveredTests);

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

  const statusCounts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of allTests) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [allTests]);

  const priorityCounts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of allTests) c[t.priority] = (c[t.priority] || 0) + 1;
    return c;
  }, [allTests]);

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Type", "Category", "Priority", "Status"];
    const rows = filtered.map((t) => [
      t.id,
      t.name,
      t.testType,
      t.category,
      t.priority,
      t.status,
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tests.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const avgPriority = React.useMemo(() => {
    if (allTests.length === 0) return 0;
    const priMap: Record<string, number> = { P0: 3, P1: 2, P2: 1, P3: 0 };
    const sum = allTests.reduce((acc, t) => acc + (priMap[t.priority] ?? 0), 0);
    return (sum / allTests.length).toFixed(1);
  }, [allTests]);

  const selectedSuite = suiteFilter ? (suites.find((s) => s.id === suiteFilter) ?? null) : null;
  const selectedTest = detailId ? (tcs.find((t) => t.id === detailId) ?? null) : null;

  const handleClearFilters = () => {
    setSearch("");
    setTestType("All");
    setCategory("All");
    setStatus("All");
    setPriority("All");
  };

  return (
    <PageTemplate
      title="Tests"
      subtitle={`${allTests.length} total tests · ${suites.length} suites`}
      loading={initState.loading && allTests.length === 0}
      loadingRows={8}
      loadingCols={5}
      topContent={
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            padding: "16px 16px 0 16px",
          }}
        >
          <div className="proof-card" style={{ padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Tests
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--proof-text)' }}>{allTests.length}</div>
          </div>
          <div className="proof-card" style={{ padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--proof-green)" }}>
              {statusCounts["active"] || 0}
            </div>
          </div>
          <div className="proof-card" style={{ padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Top Types
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--proof-text)', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(typeCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([k, v]) => (
                  <span key={k} style={{ background: 'var(--proof-subtle-bg)', padding: '1px 4px', borderRadius: 3, border: '1px solid var(--proof-border)' }}>
                    {k}: {v}
                  </span>
                ))}
            </div>
          </div>
          <div className="proof-card" style={{ padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Avg Priority
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--proof-text)' }}>P{avgPriority}</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="proof-button"
              onClick={handleExportCSV}
              style={{ fontSize: 11, height: 32, gap: 6 }}
            >
              Export CSV
            </button>
          </div>
        </div>
      }
      filters={
        <div className="proof-stack">
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
            statusCounts={statusCounts}
            priorityCounts={priorityCounts}
            filteredCount={filtered.length}
            totalCount={allTests.length}
          />
        </div>
      }
      sidePanel={
        selectedTest ? (
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
        ) : undefined
      }
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
        onClearFilters={handleClearFilters}
      />
    </PageTemplate>
  );
}

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
import type { TestSuite } from "@/lib/types";
import { TestFilters, TestList, SuiteDetailPanel, TestDetailPanel, Pagination, SkeletonTable } from "@/components/aware";
import { Download, Activity, ListChecks, Hash, Zap } from "lucide-react";

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
    const escape = (v: any) => {
      let s = String(v ?? "");
      if (/^[=+\-@]/.test(s)) s = `\t${s}`;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    
    const rows = filtered.map((t) => [
      escape(t.id),
      escape(t.name),
      escape(t.testType),
      escape(t.category),
      escape(t.priority),
      escape(t.status),
    ]);
    const csvContent = [headers.map(escape), ...rows].map((r) => r.join(",")).join("\n");
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

  const loading = initState.loading && allTests.length === 0;

  return (
    <div className="proof-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', animation: 'page-enter 0.3s cubic-bezier(0.2, 0, 0.2, 1) both' }}>
      <header
        style={{
          padding: "24px 32px",
          borderBottom: "1px solid var(--proof-border)",
          background: "rgba(0,0,0,0.1)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--proof-text)', letterSpacing: '-0.02em' }}>
              Tests Library
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--proof-text-secondary)', fontSize: 14 }}>
              Explore and manage your test definitions and suites
            </p>
          </div>
          <button onClick={handleExportCSV} className="proof-btn proof-btn-ghost">
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 24 }}>
          <div className="proof-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--proof-subtle-bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--proof-text-secondary)' }}>
              <Hash size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--proof-text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Tests</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{allTests.length}</div>
            </div>
          </div>
          
          <div className="proof-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--proof-green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--proof-green)' }}>
              <Activity size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--proof-text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Tests</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--proof-green)' }}>{statusCounts["active"] || 0}</div>
            </div>
          </div>
          
          <div className="proof-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--proof-yellow-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--proof-yellow)' }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--proof-text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Priority</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--proof-yellow)' }}>P{avgPriority}</div>
            </div>
          </div>
          
          <div className="proof-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--proof-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--proof-blue)' }}>
              <ListChecks size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--proof-text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Test Suites</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--proof-blue)' }}>{suites.length}</div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ padding: "12px 32px", borderBottom: "1px solid var(--proof-border-light)", background: "var(--proof-surface-2)", flexShrink: 0 }}>
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

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: "24px 32px" }}>
          {loading ? (
             <SkeletonTable rows={8} cols={5} />
          ) : (
            <>
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
              
              {totalPages > 1 && (
                <div style={{ marginTop: 24, borderTop: '1px solid var(--proof-border)', paddingTop: 16 }}>
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={filtered.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
        
        {(selectedTest || selectedSuite) && (
          <div style={{ width: 440, borderLeft: "1px solid var(--proof-border)", background: "var(--proof-surface)", flexShrink: 0, overflow: 'auto' }}>
            {selectedTest ? (
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
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

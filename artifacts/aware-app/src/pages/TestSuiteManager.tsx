import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useLocation } from "wouter";
import { GoogleBarChart, GooglePieChart } from "@/components/aware/GoogleCharts";
import { AppLayout } from "@/components/aware/AppLayout";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useTestData } from "@/hooks/useTestData";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { StatsDashboard } from "@/components/aware/StatsDashboard";
import { getGitHubUrl, cleanScriptPath } from "@/lib/utils";
import { useSyncedUrlState } from "@/lib/urlState";
import { computeTestStats, getAutoDiscoverySummary } from "@/lib/data";
import { exportAndDownload, exportAsXML, downloadFile } from "@/lib/testImportExport";
import type { TestCase, TestSuite } from "@/lib/types";
import type { ColumnFilterState } from "@/components/aware/ColumnFilter";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import {
  FolderTree,
  PlayCircle,
  Settings,
  Beaker,
  GitCompare,
  Bug,
  Code,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileJson,
  FileSpreadsheet,
  FileCode,
  History,
  Upload,
} from "lucide-react";

type FlatTreeItem =
  | { kind: "suite"; suite: TestSuite; depth: number }
  | { kind: "test"; testCase: TestCase; depth: number };

function getVisibleFlatItems(
  suites: TestSuite[],
  tcs: TestCase[],
  expandedIds: Set<string>,
  filter: string,
): FlatTreeItem[] {
  const items: FlatTreeItem[] = [];
  const q = filter.toLowerCase();

  function matchesFilter(suite: TestSuite): boolean {
    if (!filter) return true;
    if (suite.name.toLowerCase().includes(q)) return true;
    if (
      suite.testIds.some((tid) =>
        tcs
          .find((tc) => tc.id === tid)
          ?.name.toLowerCase()
          .includes(q),
      )
    )
      return true;
    const children = suites.filter((s) => s.parentId === suite.id);
    return children.some((child) => matchesFilter(child));
  }

  function walk(suite: TestSuite, depth: number): void {
    if (!matchesFilter(suite)) return;
    items.push({ kind: "suite", suite, depth });
    if (expandedIds.has(suite.id)) {
      const suiteTests = tcs.filter((tc) => suite.testIds.includes(tc.id));
      const filteredTests = filter
        ? suiteTests.filter((tc) => tc.name.toLowerCase().includes(q))
        : suiteTests;
      for (const tc of filteredTests) {
        items.push({ kind: "test", testCase: tc, depth: depth + 1 });
      }
      const children = suites.filter((s) => s.parentId === suite.id);
      for (const child of children) {
        if (matchesFilter(child)) {
          walk(child, depth + 1);
        }
      }
    }
  }

  for (const suite of suites.filter((s) => s.parentId === null)) {
    walk(suite, 0);
  }

  return items;
}

export default function TestSuiteManager() {
  const { tcs, suites } = useTestData();
  const [, navigate] = useLocation();
  const { show: toast, Toast } = useSimpleToast();

  const stats = React.useMemo(() => computeTestStats(), []);
  const discovery = React.useMemo(() => getAutoDiscoverySummary(), []);

  const [selectedSuiteId, setSelectedSuiteId] = React.useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = React.useState<string | null>(null);
  const [suiteSearch, setSuiteSearch] = React.useState("");
  const [showChanges, setShowChanges] = React.useState(false);
  const [selId, setSelId] = useSyncedUrlState<string | null>("sel", null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    new Set(suites.map((s) => s.id)),
  );

  const selected = selectedSuiteId ? (suites.find((s) => s.id === selectedSuiteId) ?? null) : null;
  const selectedTest = selectedTestId ? (tcs.find((tc) => tc.id === selectedTestId) ?? null) : null;
  const selectedTests = selected ? tcs.filter((tc) => selected.testIds.includes(tc.id)) : [];

  const catCounts: Record<string, number> = {};
  selectedTests.forEach((tc) => {
    catCounts[tc.category] = (catCounts[tc.category] || 0) + 1;
  });
  const statusCounts = {
    active: selectedTests.filter((t) => t.status === "active").length,
    disabled: selectedTests.filter((t) => t.status !== "active").length,
  };
  const priorityCounts: Record<string, number> = {};
  selectedTests.forEach((tc) => {
    priorityCounts[tc.priority] = (priorityCounts[tc.priority] || 0) + 1;
  });

  React.useEffect(() => {
    if (selId && !selectedSuiteId && !selectedTestId) {
      const tc = tcs.find((t) => t.id === selId);
      if (tc) {
        const parent = suites.find((s) => s.testIds.includes(tc.id));
        if (parent) setSelectedSuiteId(parent.id);
        else setSelectedTestId(tc.id);
      }
    }
  }, [selId, tcs, suites, selectedSuiteId, selectedTestId]);

  const handleExport = (format: "json" | "csv" | "junit_xml") => {
    if (format === "json") {
      exportAndDownload(tcs, "json");
    } else if (format === "junit_xml") {
      downloadFile(exportAsXML(tcs), "aware-tests.xml", "application/xml");
    } else {
      const csv =
        "id,name,category,priority,status,owner\n" +
        tcs
          .map((t) => `${t.id},"${t.name}",${t.category},${t.priority},${t.status},${t.owner}`)
          .join("\n");
      downloadFile(csv, "aware-tests.csv", "text/csv");
    }
    toast(`Exported as ${format.toUpperCase()}`);
  };

  const allChanges = React.useMemo(() => {
    const entries = tcs.flatMap((tc) =>
      tc.changelog.map((entry) => ({ ...entry, testId: tc.id, testName: tc.name })),
    );
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return entries;
  }, [tcs]);

  const priorityChart = Object.entries(priorityCounts)
    .sort()
    .map(([k, v]) => ({
      priority: k,
      count: v,
      color: k === "P0" ? "#ef4444" : k === "P1" ? "#f97316" : k === "P2" ? "#5b8af5" : "#9aa0a6",
    }));

  const suiteContainerRef = React.useRef<HTMLDivElement>(null);

  const flatVisibleItems = React.useMemo(
    () => getVisibleFlatItems(suites, tcs, expandedIds, suiteSearch),
    [suites, tcs, expandedIds, suiteSearch],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const suiteVirtualizer = useVirtualizer({
    count: flatVisibleItems.length,
    getScrollElement: () => suiteContainerRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  return (
    <AppLayout activeHref="/suites">
      <div
        style={{
          height: "calc(100vh - 100px)",
          display: "flex",
          maxWidth: 1600,
          margin: "0 auto",
          gap: 16,
        }}
      >
        <PanelErrorBoundary label="Suite tree" height="100%">
          <div
            className="proof-card"
            style={{
              width: 260,
              flexShrink: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: 12,
                borderBottom: "1px solid var(--proof-grey)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FolderTree size={15} /> Suites
              </h2>
            </div>
            <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--proof-grey)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  border: "1px solid var(--proof-grey)",
                  borderRadius: 4,
                  padding: "4px 8px",
                  background: "var(--proof-grey-bg)",
                }}
              >
                <Search size={12} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
                <input
                  value={suiteSearch}
                  onChange={(e) => setSuiteSearch(e.target.value)}
                  placeholder="Filter suites..."
                  style={{
                    border: "none",
                    outline: "none",
                    fontSize: 11,
                    background: "transparent",
                    flex: 1,
                    minWidth: 0,
                    color: "var(--proof-text)",
                  }}
                />
                {suiteSearch && (
                  <button
                    onClick={() => setSuiteSearch("")}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "var(--proof-text-secondary)",
                      fontSize: 13,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div
              ref={suiteContainerRef}
              style={{ flex: 1, overflow: "auto", padding: 8, position: "relative" }}
            >
              {flatVisibleItems.length > 0 ? (
                <div style={{ position: "relative", height: suiteVirtualizer.getTotalSize() }}>
                  {suiteVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = flatVisibleItems[virtualRow.index];
                    if (item.kind === "suite") {
                      const suite = item.suite;
                      const expanded = expandedIds.has(suite.id);
                      const children = suites.filter((s) => s.parentId === suite.id);
                      const suiteTests = tcs.filter((tc) => suite.testIds.includes(tc.id));
                      const hasChildren = children.length > 0 || suiteTests.length > 0;
                      return (
                        <div
                          key={suite.id}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: virtualRow.size,
                            transform: `translateY(${virtualRow.start}px)`,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 12px",
                            cursor: "pointer",
                            borderRadius: 8,
                            paddingLeft: `${12 + item.depth * 20}px`,
                            background:
                              selectedSuiteId === suite.id ? "var(--proof-blue-bg)" : "transparent",
                            boxShadow:
                              selectedSuiteId === suite.id
                                ? "inset 0 0 0 1px var(--proof-blue)"
                                : "none",
                          }}
                          onClick={() => {
                            setSelectedSuiteId(suite.id);
                            setSelectedTestId(null);
                          }}
                        >
                          {hasChildren ? (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                const n = new Set(expandedIds);
                                if (n.has(suite.id)) n.delete(suite.id);
                                else n.add(suite.id);
                                setExpandedIds(n);
                              }}
                              style={{
                                padding: 2,
                                color: "var(--proof-text-secondary)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                          ) : (
                            <span style={{ width: 14 }} />
                          )}
                          <FolderTree
                            size={14}
                            style={{ color: "var(--proof-blue)", flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {suite.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--proof-text-secondary)",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginTop: 1,
                              }}
                            >
                              <span>{suite.testIds.length} tests</span>
                              {suite.schedule && (
                                <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  <Clock size={10} />
                                  {suite.schedule}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    const tc = item.testCase;
                    return (
                      <div
                        key={tc.id}
                        onClick={() => {
                          setSelectedTestId(tc.id);
                          setSelectedSuiteId(null);
                        }}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: virtualRow.size,
                          transform: `translateY(${virtualRow.start}px)`,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 12px",
                          cursor: "pointer",
                          paddingLeft: `${26 + item.depth * 20}px`,
                          background:
                            selectedTestId === tc.id ? "var(--proof-blue-bg)" : "transparent",
                          fontSize: 12,
                          color: "var(--proof-text-secondary)",
                          borderRadius: 6,
                        }}
                        onMouseEnter={(e) => {
                          if (selectedTestId !== tc.id)
                            e.currentTarget.style.background = "var(--proof-grey-bg)";
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTestId !== tc.id)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <Bug
                          size={12}
                          style={{ flexShrink: 0, color: "var(--proof-text-secondary)" }}
                        />
                        <span
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tc.name}
                        </span>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background:
                              tc.status === "active" ? "var(--proof-green)" : "var(--proof-yellow)",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: "32px 0",
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--proof-text-secondary)",
                  }}
                >
                  No suites yet
                </div>
              )}
            </div>
          </div>
        </PanelErrorBoundary>

        <PanelErrorBoundary label="Content panel">
          <div
            className="proof-card"
            style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            {selectedTest ? (
              <>
                <div
                  style={{
                    padding: 16,
                    borderBottom: "1px solid var(--proof-grey)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Bug size={18} style={{ color: "var(--proof-blue)" }} />
                    <div>
                      <h2 style={{ fontWeight: 700, fontSize: 16 }}>{selectedTest.name}</h2>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--proof-text-secondary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {selectedTest.id}
                      </p>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div className="proof-card" style={{ padding: "10px 14px" }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--proof-text-secondary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          marginBottom: 2,
                        }}
                      >
                        Status
                      </div>
                      <span
                        className={`proof-badge ${selectedTest.status === "active" ? "proof-badge-pass" : "proof-badge-fail"}`}
                        style={{ fontSize: 11 }}
                      >
                        {selectedTest.status}
                      </span>
                    </div>
                    <div className="proof-card" style={{ padding: "10px 14px" }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--proof-text-secondary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          marginBottom: 2,
                        }}
                      >
                        Priority
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--proof-text)" }}>
                        {selectedTest.priority}
                      </div>
                    </div>
                    <div className="proof-card" style={{ padding: "10px 14px" }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--proof-text-secondary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          marginBottom: 2,
                        }}
                      >
                        Category
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background:
                              (CATEGORY_COLORS[
                                CATEGORIES.indexOf(selectedTest.category) % CATEGORY_COLORS.length
                              ] ?? "#9aa0a6") + "20",
                            border:
                              "1px solid " +
                              (CATEGORY_COLORS[
                                CATEGORIES.indexOf(selectedTest.category) % CATEGORY_COLORS.length
                              ] ?? "#9aa0a6") +
                              "40",
                            color:
                              CATEGORY_COLORS[
                                CATEGORIES.indexOf(selectedTest.category) % CATEGORY_COLORS.length
                              ] ?? "#9aa0a6",
                          }}
                        >
                          {selectedTest.category}
                        </span>
                      </div>
                    </div>
                    <div className="proof-card" style={{ padding: "10px 14px" }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--proof-text-secondary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          marginBottom: 2,
                        }}
                      >
                        Type
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background:
                              selectedTest.testType === "http"
                                ? "#00bcd420"
                                : selectedTest.testType === "web"
                                  ? "var(--proof-blue-bg)"
                                  : selectedTest.testType === "api"
                                    ? "#22c55e20"
                                    : "var(--proof-grey-bg)",
                            border:
                              "1px solid " +
                              (selectedTest.testType === "http"
                                ? "#00bcd440"
                                : selectedTest.testType === "web"
                                  ? "var(--proof-blue)"
                                  : selectedTest.testType === "api"
                                    ? "#22c55e40"
                                    : "var(--proof-grey)"),
                            color:
                              selectedTest.testType === "http"
                                ? "#00bcd4"
                                : selectedTest.testType === "web"
                                  ? "var(--proof-blue)"
                                  : selectedTest.testType === "api"
                                    ? "#22c55e"
                                    : "var(--proof-text-secondary)",
                            textTransform: "capitalize",
                          }}
                        >
                          {selectedTest.testType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div className="proof-card" style={{ padding: 12 }}>
                      <h4
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: "var(--proof-text-secondary)",
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        Description
                      </h4>
                      <p style={{ fontSize: 13, color: "var(--proof-text)", lineHeight: 1.6 }}>
                        {selectedTest.description || "No description"}
                      </p>
                    </div>
                    <div className="proof-card" style={{ padding: 12 }}>
                      <h4
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: "var(--proof-text-secondary)",
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        Script
                      </h4>
                      <a
                        href={getGitHubUrl(selectedTest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 12,
                          fontFamily: "var(--font-mono)",
                          color: "var(--proof-blue)",
                          textDecoration: "underline",
                          textUnderlineOffset: 2,
                        }}
                      >
                        {cleanScriptPath(selectedTest)}
                      </a>
                    </div>
                  </div>
                  {selectedTest.predicates.length > 0 && (
                    <div className="proof-card" style={{ padding: 12, marginBottom: 12 }}>
                      <h4
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: "var(--proof-text-secondary)",
                          fontWeight: 600,
                          marginBottom: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Code size={12} /> Predicates ({selectedTest.predicates.length})
                      </h4>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "var(--font-mono)",
                          color: "var(--proof-text)",
                          lineHeight: 1.8,
                        }}
                      >
                        {selectedTest.predicates.map((p, i) => (
                          <div key={i} style={{ padding: "4px 0" }}>
                            {p.field} {p.operator} {p.expected}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : selected ? (
              <>
                <div
                  style={{
                    padding: 16,
                    borderBottom: "1px solid var(--proof-grey)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                  }}
                >
                  <div>
                    <h2 style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</h2>
                    <p style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>
                      {selected.description}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => navigate(`/start?suite=${selected.id}`)}
                      className="proof-button proof-button-primary proof-button-sm"
                    >
                      <PlayCircle size={13} /> Run
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div className="proof-card" style={{ padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "var(--proof-blue)" }}>
                        {selected.testIds.length}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                        Tests
                      </div>
                    </div>
                    <div className="proof-card" style={{ padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "var(--proof-green)" }}>
                        {statusCounts.active}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                        Active
                      </div>
                    </div>
                    <div className="proof-card" style={{ padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "var(--proof-text)" }}>
                        {selected.config.parallelism}x
                      </div>
                      <div style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                        Parallelism
                      </div>
                    </div>
                    <div className="proof-card" style={{ padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "var(--proof-text)" }}>
                        {selected.config.retries}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                        Retries
                      </div>
                    </div>
                  </div>

                  <PanelErrorBoundary label="Charts">
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      {Object.keys(catCounts).length > 0 && (
                        <div className="proof-card" style={{ padding: 12 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "var(--proof-text-secondary)",
                              marginBottom: 4,
                            }}
                          >
                            Category Distribution
                          </div>
                          <GooglePieChart title="" data={catCounts} height="150px" />
                        </div>
                      )}
                      {priorityChart.length > 0 && (
                        <div className="proof-card" style={{ padding: 12, height: 180 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "var(--proof-text-secondary)",
                              marginBottom: 4,
                            }}
                          >
                            Priority Breakdown
                          </div>
                          <GoogleBarChart
                            title=""
                            columns={["Priority", "Count"]}
                            data={priorityChart}
                            xKey="priority"
                            yKeys={["count"]}
                            colors={["#5b8af5"]}
                            height="140px"
                            showTimeFrame={false}
                          />
                        </div>
                      )}
                    </div>
                  </PanelErrorBoundary>

                  <div className="proof-card" style={{ padding: 12, marginBottom: 16 }}>
                    <h4
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: "var(--proof-text-secondary)",
                        fontWeight: 600,
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Settings size={12} /> Configuration
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: 12,
                        fontSize: 13,
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                          Target
                        </span>
                        <div style={{ fontWeight: 500 }}>{selected.config.target}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                          Env
                        </span>
                        <div style={{ fontWeight: 500 }}>{selected.config.environment}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                          Timeout
                        </span>
                        <div style={{ fontWeight: 500 }}>{selected.config.timeoutMinutes}m</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                          Fail Fast
                        </span>
                        <div style={{ fontWeight: 500 }}>
                          {selected.config.failFast ? "Yes" : "No"}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                          Schedule
                        </span>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                          {selected.schedule ?? "Manual"}
                        </div>
                      </div>
                    </div>
                    {selected.config.integration && (
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: "1px solid var(--proof-grey)",
                        }}
                      >
                        <h5
                          style={{
                            fontSize: 10,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: "var(--proof-text-secondary)",
                            fontWeight: 600,
                            marginBottom: 6,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <GitCompare size={10} /> Integrations
                        </h5>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 8,
                            fontSize: 12,
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--proof-text-secondary)",
                                display: "block",
                              }}
                            >
                              Slack
                            </span>
                            <span
                              style={{
                                color: selected.config.integration.slackChannel
                                  ? "var(--proof-green)"
                                  : "var(--proof-text-secondary)",
                              }}
                            >
                              {selected.config.integration.slackChannel || "Not configured"}
                            </span>
                          </div>
                          <div>
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--proof-text-secondary)",
                                display: "block",
                              }}
                            >
                              GitHub
                            </span>
                            <div style={{ display: "flex", gap: 8 }}>
                              {selected.config.integration.githubCommentPr && (
                                <span
                                  className="proof-badge proof-badge-pass"
                                  style={{ fontSize: 10 }}
                                >
                                  PR Comments
                                </span>
                              )}
                              {selected.config.integration.githubDeploymentStatus && (
                                <span
                                  className="proof-badge proof-badge-pass"
                                  style={{ fontSize: 10 }}
                                >
                                  Deploy Status
                                </span>
                              )}
                              {!selected.config.integration.githubCommentPr &&
                                !selected.config.integration.githubDeploymentStatus && (
                                  <span style={{ color: "var(--proof-text-secondary)" }}>
                                    Not configured
                                  </span>
                                )}
                            </div>
                          </div>
                          <div>
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--proof-text-secondary)",
                                display: "block",
                              }}
                            >
                              Approval
                            </span>
                            <span>
                              {selected.config.integration.requireApproval
                                ? `Required (${selected.config.integration.approvers.length})`
                                : "Not required"}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                          {selected.config.integration.notifyOn.map((n) => (
                            <span
                              key={n}
                              className="proof-badge proof-badge-flaky"
                              style={{ fontSize: 10, textTransform: "capitalize" }}
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <h4
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--proof-text-secondary)",
                      fontWeight: 600,
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Beaker size={12} /> Tests ({selectedTests.length})
                  </h4>
                  <div className="proof-card" style={{ overflow: "hidden" }}>
                    <table className="proof-table" style={{ tableLayout: "fixed", width: "100%" }}>
                      <colgroup>
                        <col style={{ width: 32 }} />
                        <col style={{ width: "16%" }} />
                        <col />
                        <col style={{ width: "18%" }} />
                        <col style={{ width: "7%" }} />
                      </colgroup>
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          background: "var(--proof-surface)",
                          zIndex: 1,
                        }}
                      >
                        <tr>
                          <th />
                          <th>ID</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Pri</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTests.map((tc) => (
                          <tr
                            key={tc.id}
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate(`/suites?sel=${tc.id}`)}
                          >
                            <td style={{ verticalAlign: "middle" }}>
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  display: "inline-block",
                                  background:
                                    tc.status === "active"
                                      ? "var(--proof-green)"
                                      : tc.status === "disabled"
                                        ? "var(--proof-yellow)"
                                        : "var(--proof-red)",
                                }}
                              />
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                color: "var(--proof-blue)",
                                verticalAlign: "middle",
                              }}
                            >
                              {tc.id}
                            </td>
                            <td style={{ verticalAlign: "middle" }}>{tc.name}</td>
                            <td
                              style={{
                                fontSize: 11,
                                color: "var(--proof-text-secondary)",
                                verticalAlign: "middle",
                              }}
                            >
                              {tc.category}
                            </td>
                            <td
                              style={{
                                fontSize: 11,
                                color: "var(--proof-text-secondary)",
                                verticalAlign: "middle",
                              }}
                            >
                              {tc.priority}
                            </td>
                          </tr>
                        ))}
                        {selectedTests.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              style={{
                                textAlign: "center",
                                padding: "32px 16px",
                                color: "var(--proof-text-secondary)",
                                fontSize: 13,
                              }}
                            >
                              No tests in this suite
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  padding: 16,
                  gap: 16,
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--proof-text)",
                    marginBottom: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FolderTree size={18} /> Overview
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <div className="proof-card" style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "var(--proof-blue)" }}>
                      {suites.length}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}
                    >
                      Total Suites
                    </div>
                  </div>
                  <div className="proof-card" style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "var(--proof-blue)" }}>
                      {tcs.length}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}
                    >
                      Total Tests
                    </div>
                  </div>
                  <div className="proof-card" style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "var(--proof-green)" }}>
                      {tcs.filter((tc) => tc.status === "active").length}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}
                    >
                      Active Tests
                    </div>
                  </div>
                  <div className="proof-card" style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "var(--proof-orange)" }}>
                      {suites.filter((s) => s.schedule).length}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}
                    >
                      Scheduled Suites
                    </div>
                  </div>
                </div>
                <PanelErrorBoundary label="Stats dashboard">
                  <StatsDashboard
                    stats={stats}
                    colFilters={{} as Record<string, ColumnFilterState>}
                    onToggleFilter={() => {}}
                  />
                </PanelErrorBoundary>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      fontSize: 11,
                      color: "var(--proof-text-secondary)",
                    }}
                  >
                    {discovery.total > 0 && (
                      <>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Beaker size={12} style={{ color: "var(--proof-blue)" }} />
                          <strong style={{ color: "var(--proof-blue)" }}>
                            {discovery.total}
                          </strong>{" "}
                          auto-discovered
                        </span>
                        <span>·</span>
                        <span>{discovery.sourceFiles} pytest files</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleExport("json")}
                      className="proof-button proof-button-xs"
                    >
                      <Download size={11} /> Export
                    </button>
                    <button
                      onClick={() => setShowChanges(true)}
                      className="proof-button proof-button-xs"
                    >
                      <History size={11} /> Changes
                    </button>
                  </div>
                </div>
                <div
                  className="proof-card"
                  style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--proof-grey)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--proof-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      flexShrink: 0,
                    }}
                  >
                    All Suites
                  </div>
                  <div style={{ flex: 1, overflow: "auto" }}>
                    <table className="proof-table" style={{ tableLayout: "fixed", width: "100%" }}>
                      <colgroup>
                        <col />
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "22%" }} />
                        <col style={{ width: "28%" }} />
                        <col style={{ width: "10%" }} />
                      </colgroup>
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          background: "var(--proof-surface)",
                          zIndex: 1,
                        }}
                      >
                        <tr>
                          <th>Suite</th>
                          <th>Tests</th>
                          <th>Schedule</th>
                          <th>Categories</th>
                          <th>Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suites.map((s) => {
                          const suiteTests = tcs.filter((tc) => s.testIds.includes(tc.id));
                          const cats = [...new Set(suiteTests.map((tc) => tc.category))];
                          const activeCount = suiteTests.filter(
                            (tc) => tc.status === "active",
                          ).length;
                          return (
                            <tr
                              key={s.id}
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                setSelectedSuiteId(s.id);
                                setSelectedTestId(null);
                              }}
                            >
                              <td style={{ verticalAlign: "middle" }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: "var(--proof-text)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {s.name}
                                </div>
                                <div
                                  style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 10,
                                    color: "var(--proof-text-secondary)",
                                  }}
                                >
                                  {s.id}
                                </div>
                              </td>
                              <td
                                style={{
                                  fontWeight: 700,
                                  color: "var(--proof-blue)",
                                  verticalAlign: "middle",
                                }}
                              >
                                {s.testIds.length}
                              </td>
                              <td
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: 11,
                                  color: "var(--proof-text-secondary)",
                                  verticalAlign: "middle",
                                }}
                              >
                                {s.schedule ?? (
                                  <span style={{ color: "var(--proof-text-muted)" }}>Manual</span>
                                )}
                              </td>
                              <td style={{ verticalAlign: "middle" }}>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                                  {cats.map((cat) => (
                                    <span
                                      key={cat}
                                      className="proof-badge proof-badge-skip"
                                      style={{ fontSize: 9, textTransform: "capitalize" }}
                                    >
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td style={{ verticalAlign: "middle" }}>
                                <span
                                  className={`proof-badge ${activeCount === s.testIds.length ? "proof-badge-pass" : activeCount > 0 ? "proof-badge-flaky" : "proof-badge-fail"}`}
                                  style={{ fontSize: 10 }}
                                >
                                  {activeCount}/{s.testIds.length}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PanelErrorBoundary>

        {Toast}
      </div>
    </AppLayout>
  );
}

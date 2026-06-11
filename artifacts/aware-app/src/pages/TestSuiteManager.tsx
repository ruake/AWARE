import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useLocation } from "wouter";
import { GoogleBarChart, GooglePieChart } from "@/components/aware/GoogleCharts";
import { AppLayout } from "@/components/aware/AppLayout";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useTestData } from "@/hooks/useTestData";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { getGitHubUrl, cleanScriptPath } from "@/lib/utils";
import type { TestCase, TestSuite } from "@/lib/types";
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
  const { Toast } = useSimpleToast();

  const [selectedSuiteId, setSelectedSuiteId] = React.useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = React.useState<string | null>(null);
  const [suiteSearch, setSuiteSearch] = React.useState("");
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 4 }}>
                    {selectedTests.map((tc) => (
                      <div
                        key={tc.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background:
                              tc.status === "active"
                                ? "var(--proof-green)"
                                : tc.status === "disabled"
                                  ? "var(--proof-yellow)"
                                  : "var(--proof-red)",
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--proof-blue)",
                            cursor: "pointer",
                            textDecoration: "underline",
                            textDecorationColor: "transparent",
                            transition: "text-decoration-color 0.15s",
                          }}
                          onClick={() => navigate(`/tests?sel=${tc.id}`)}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.textDecorationColor =
                              "var(--proof-blue)")
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.textDecorationColor =
                              "transparent")
                          }
                        >
                          {tc.id}
                        </span>
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
                        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                          {tc.category}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                          {tc.priority}
                        </span>
                      </div>
                    ))}
                    {selectedTests.length === 0 && (
                      <div
                        style={{
                          padding: "24px 0",
                          textAlign: "center",
                          fontSize: 13,
                          color: "var(--proof-text-secondary)",
                        }}
                      >
                        No tests in this suite
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  padding: 16,
                  color: "var(--proof-text-secondary)",
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--proof-text)",
                    marginBottom: 16,
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="proof-card" style={{ padding: 16 }}>
                    <h3
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--proof-text)",
                        marginBottom: 12,
                      }}
                    >
                      Tests by Category
                    </h3>
                    {(() => {
                      const cats: Record<string, number> = {};
                      tcs.forEach((tc) => {
                        cats[tc.category] = (cats[tc.category] || 0) + 1;
                      });
                      return Object.entries(cats)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, count]) => (
                          <div
                            key={cat}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 0",
                              borderBottom: "1px solid var(--proof-grey)",
                              fontSize: 12,
                            }}
                          >
                            <span style={{ flex: 1, color: "var(--proof-text)" }}>{cat}</span>
                            <span style={{ fontWeight: 600, color: "var(--proof-blue)" }}>
                              {count}
                            </span>
                          </div>
                        ));
                    })()}
                  </div>
                  <div className="proof-card" style={{ padding: 16 }}>
                    <h3
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--proof-text)",
                        marginBottom: 12,
                      }}
                    >
                      Suites by Schedule
                    </h3>
                    {suites.filter((s) => s.schedule).length === 0 ? (
                      <p style={{ fontSize: 12 }}>No scheduled suites</p>
                    ) : (
                      suites
                        .filter((s) => s.schedule)
                        .map((s) => (
                          <div
                            key={s.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 0",
                              borderBottom: "1px solid var(--proof-grey)",
                              fontSize: 12,
                            }}
                          >
                            <span style={{ flex: 1, color: "var(--proof-text)" }}>{s.name}</span>
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                color: "var(--proof-text-secondary)",
                              }}
                            >
                              {s.schedule}
                            </span>
                            <span style={{ fontWeight: 600, color: "var(--proof-blue)" }}>
                              {s.testIds.length} tests
                            </span>
                          </div>
                        ))
                    )}
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

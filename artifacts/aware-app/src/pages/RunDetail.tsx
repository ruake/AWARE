import React, { useSyncExternalStore } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import {
  getRunById,
  getTestResultsForRun,
  getDataInitState,
  subscribeToDataInit,
} from "@/lib/data";
import type { TestResult } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileText,
  ChevronDown,
  X,
  Copy,
  Check as CheckIcon,
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { useSyncedUrlState } from "@/lib/urlState";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { SkeletonTable, SkeletonText } from "@/components/aware/Skeleton";
import {
  TimeWindowProvider,
  TimeWindowControls,
  TestHistoryStrip,
} from "@/components/aware/HistoryTimeline";
import { AssertionRow } from "@/components/aware/AssertionRow";
import { EvidenceViewer } from "@/components/aware/EvidenceViewer";
import { FilmstripViewer } from "@/components/aware/FilmstripViewer";
import { RunHeader } from "@/components/aware/RunHeader";

export default function RunDetail() {
  const params = useParams<{ runId: string }>();
  const [, navigate] = useLocation();
  const urlSearch = useSearch();
  const runId = params.runId ?? "";
  const { Toast } = useSimpleToast();

  const initState = useSyncExternalStore(subscribeToDataInit, getDataInitState);
  const run = getRunById(runId) ?? null;
  const results = run ? getTestResultsForRun(run.id) : [];
  const [search, setSearch] = useSyncedUrlState("q", "");
  const [statusFilter, setStatusFilter] = useSyncedUrlState("status", "all");
  const [catFilter, setCatFilter] = useSyncedUrlState("cat", "all");
  const [page, setPage] = React.useState(0);
  const [detailPanelCollapsed, setDetailPanelCollapsed] = React.useState(false);
  const PAGE_SIZE = 20;

  const filterKey = `${search}|${statusFilter}|${catFilter}`;
  const prevFilterKeyRef = React.useRef(filterKey);
  React.useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey;
      setPage(0);
    }
  }, [filterKey]);
  const urlTestId = React.useMemo(() => new URLSearchParams(urlSearch).get("testId"), [urlSearch]);
  const [selectedResult, setSelectedResult] = React.useState<TestResult | null>(null);

  // Auto-select from URL param or first test on run load
  const autoSelectedRunRef = React.useRef<string>("");
  React.useEffect(() => {
    if (!run || results.length === 0) return;
    if (autoSelectedRunRef.current === run.id && urlTestId) {
      const match = results.find((r) => r.id === urlTestId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (match && selectedResult?.id !== match.id) setSelectedResult(match);
      return;
    }
    if (autoSelectedRunRef.current === run.id) return;
    autoSelectedRunRef.current = run.id;
    if (urlTestId) {
      const match = results.find((r) => r.id === urlTestId);
      if (match) {
        setSelectedResult(match);
        return;
      }
    }
    setSelectedResult(results[0]);
  }, [run?.id, urlTestId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent, result: TestResult) => {
    if (e.key === "Enter") {
      setSelectedResultSyncUrl(selectedResult?.id === result.id ? null : result);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = filtered.findIndex((r) => r.id === result.id);
      if (idx < filtered.length - 1) {
        const nextResult = filtered[idx + 1];
        setSelectedResultSyncUrl(nextResult);
        // Focus the next row
        const nextRow = document.querySelector(`[data-row-id="${nextResult.id}"]`) as HTMLElement;
        nextRow?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = filtered.findIndex((r) => r.id === result.id);
      if (idx > 0) {
        const prevResult = filtered[idx - 1];
        setSelectedResultSyncUrl(prevResult);
        // Focus the prev row
        const prevRow = document.querySelector(`[data-row-id="${prevResult.id}"]`) as HTMLElement;
        prevRow?.focus();
      }
    }
  };

  if (!run) {
    if (initState.loading) {
      return (
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <SkeletonText lines={2} lastLineWidth="40%" />
          <SkeletonTable rows={10} cols={6} />
        </div>
      );
    }
    return (
      <div style={{ textAlign: "center", padding: 64 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text-primary)" }}>
          Run not found
        </h2>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 8 }}>
          The requested run does not exist.
        </p>
        <button
          onClick={() => navigate("/runs")}
          className="proof-button"
          style={{ fontSize: 13, marginTop: 16 }}
        >
          Back to Runs
        </button>
      </div>
    );
  }

  const filtered = results.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (catFilter !== "all" && r.category !== catFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pagedResults = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const selIdx = selectedResult ? filtered.findIndex((r) => r.id === selectedResult.id) : -1;

  const setSelectedResultSyncUrl = (r: TestResult | null) => {
    setSelectedResult(r);
    const base = `/runs/${run.id}`;
    if (r) navigate(`${base}?testId=${r.id}`, { replace: true });
    else navigate(base, { replace: true });
  };

  const navigateDetail = (dir: -1 | 1) => {
    const next = selIdx + dir;
    if (next >= 0 && next < filtered.length) setSelectedResultSyncUrl(filtered[next]);
  };

  const counts = React.useMemo(() => {
    return {
      total: results.length,
      passed: results.filter((r) => r.status === "PASS").length,
      failed: results.filter((r) => r.status === "FAIL").length,
      skipped: results.filter((r) => (r.status as string) === "SKIPPED").length,
    };
  }, [results]);

  const catBreakdown = React.useMemo(() => {
    const map: Record<string, { pass: number; total: number }> = {};
    results.forEach((r) => {
      if (!map[r.category]) map[r.category] = { pass: 0, total: 0 };
      map[r.category].total++;
      if (r.status === "PASS") map[r.category].pass++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [results]);

  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const copyTestId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", minHeight: 0 }}
    >
      <RunHeader run={run} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          padding: "16px",
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border)",
          borderRadius: "var(--proof-radius)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--proof-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Total Tests</span>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{counts.total}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--proof-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Passed</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--proof-green)" }}>{counts.passed}</span>
            <CheckCircle2 size={14} style={{ color: "var(--proof-green)" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--proof-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Failed</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--proof-red)" }}>{counts.failed}</span>
            <XCircle size={14} style={{ color: "var(--proof-red)" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--proof-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Skipped</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--proof-text-secondary)" }}>{counts.skipped}</span>
            <HelpCircle size={14} style={{ color: "var(--proof-text-secondary)" }} />
          </div>
        </div>
      </div>

      {/* Chart + results table */}
      <div style={{ display: "flex", gap: 14, flex: 1, minHeight: 0 }}>
        <PanelErrorBoundary label="Test results">
          <div
            className="proof-card"
            style={{
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
            }}
          >
            <TimeWindowProvider>
              <div
                style={{
                  padding: "6px 14px",
                  borderBottom: "1px solid var(--proof-grey)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <TimeWindowControls />
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                  <div style={{ position: "relative" }}>
                    <input
                      className="proof-input"
                      placeholder="Search tests…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ paddingLeft: 22, width: 160, height: 24, fontSize: 11 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        left: 6,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--proof-text-muted)",
                        pointerEvents: "none",
                        fontSize: 11,
                      }}
                    >
                      ⌕
                    </span>
                  </div>
                  <select
                    className="proof-input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ fontSize: 11, height: 24, padding: "0 6px" }}
                  >
                    <option value="all">All statuses</option>
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                  </select>
                  <select
                    className="proof-input"
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    style={{ fontSize: 11, height: 24, padding: "0 6px" }}
                  >
                    <option value="all">All categories</option>
                    {[...new Set(results.map((r) => r.category).filter(Boolean))]
                      .sort()
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                  {(search || statusFilter !== "all" || catFilter !== "all") && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                        setCatFilter("all");
                      }}
                      className="proof-button-ghost"
                      style={{ fontSize: 10, padding: "2px 6px" }}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {filtered.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 24px",
                      color: "var(--proof-text-secondary)",
                    }}
                  >
                    <Search size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--proof-text)", marginBottom: 6 }}>
                      No results found
                    </div>
                    <div style={{ fontSize: 13, marginBottom: 20 }}>
                      Try adjusting your filters or search terms
                    </div>
                    <button className="proof-button" onClick={() => { setSearch(""); setStatusFilter("all"); setCatFilter("all"); }}>Clear filters</button>
                  </div>
                ) : (
                  <>
                    <table className="proof-table">
                      <thead>
                        <tr>
                          <th style={{ width: "30%", fontSize: 11, fontWeight: 600, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Test Name</th>
                          <th style={{ width: 70, fontSize: 11, fontWeight: 600, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                          <th style={{ width: 100, fontSize: 11, fontWeight: 600, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                          <th style={{ width: "22%", whiteSpace: "nowrap", fontSize: 11, fontWeight: 600, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>History</th>
                          <th style={{ width: 80, textAlign: "right", fontSize: 11, fontWeight: 600, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</th>
                          <th style={{ width: 110, fontSize: 11, fontWeight: 600, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedResults.map((r) => (
                          <tr
                            key={r.id}
                            data-row-id={r.id}
                            tabIndex={0}
                            onKeyDown={(e) => handleKeyDown(e, r)}
                            onClick={() =>
                              setSelectedResultSyncUrl(selectedResult?.id === r.id ? null : r)
                            }
                            style={{
                              cursor: "pointer",
                              outline: "none",
                              background:
                                selectedResult?.id === r.id
                                  ? "var(--proof-blue-bg)"
                                  : r.status === "FAIL"
                                    ? "rgba(217,48,37,0.03)"
                                    : undefined,
                              boxShadow:
                                selectedResult?.id === r.id
                                  ? "inset 0 0 0 2px var(--proof-blue)"
                                  : undefined,
                            }}
                          >
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                              }}
                            >
                              {r.name}
                            </td>
                            <td>
                              <span
                                className={`proof-badge ${r.status === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: 11,
                                  background: "var(--proof-grey-bg)",
                                  padding: "2px 7px",
                                  borderRadius: 4,
                                  border: "1px solid var(--proof-grey)",
                                }}
                              >
                                {r.category}
                              </span>
                            </td>
                            <td style={{ width: 200, whiteSpace: "nowrap" }}>
                              <TestHistoryStrip testName={r.name} currentRunId={runId} />
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                color: "var(--proof-text-secondary)",
                              }}
                            >
                              {r.duration}ms
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => navigate(`/trends?testId=${r.id}`)}
                                className="proof-button proof-button-xs"
                                style={{ padding: "2px 7px" }}
                              >
                                Analytics
                              </button>
                              <button
                                onClick={() => navigate(`/tests?q=${r.id}`)}
                                className="proof-button proof-button-xs"
                                style={{ padding: "2px 7px", marginLeft: 4 }}
                              >
                                <FileText size={10} /> Def
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {totalPages > 1 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 12,
                          padding: "8px 14px",
                          borderTop: "1px solid var(--proof-border)",
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            disabled={page === 0}
                            onClick={() => setPage(0)}
                            className="proof-button proof-button-xs"
                            title="First Page"
                          >
                            «
                          </button>
                          <button
                            disabled={page === 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            className="proof-button proof-button-xs"
                          >
                            Prev
                          </button>
                        </div>
                        <span
                          style={{
                            color: "var(--proof-text-secondary)",
                            minWidth: 80,
                            textAlign: "center",
                          }}
                        >
                          Page {page + 1} of {totalPages}
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            className="proof-button proof-button-xs"
                          >
                            Next
                          </button>
                          <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(totalPages - 1)}
                            className="proof-button proof-button-xs"
                            title="Last Page"
                          >
                            »
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TimeWindowProvider>
          </div>
        </PanelErrorBoundary>

      {/* Test Detail Panel */}
      {selectedResult && (
        <PanelErrorBoundary label="Evidence panel">
          <div
            className="proof-card"
            style={{
              width: 380,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderLeft: `3px solid ${selectedResult.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
            }}
          >
            {/* Panel header */}
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--proof-grey)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--proof-blue-bg)",
                flexShrink: 0,
              }}
            >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    border: "1px solid var(--proof-grey)",
                    borderRadius: 4,
                    background: "var(--proof-surface)",
                  }}
                >
                  <button
                    disabled={selIdx <= 0}
                    onClick={() => navigateDetail(-1)}
                    style={{
                      padding: "4px 7px",
                      border: "none",
                      background: "transparent",
                      cursor: selIdx > 0 ? "pointer" : "not-allowed",
                      color: selIdx > 0 ? "var(--proof-blue)" : "var(--proof-grey)",
                    }}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--proof-text-secondary)",
                      padding: "0 4px",
                    }}
                  >
                    {selIdx + 1}/{filtered.length}
                  </span>
                  <button
                    disabled={selIdx >= filtered.length - 1}
                    onClick={() => navigateDetail(1)}
                    style={{
                      padding: "4px 7px",
                      border: "none",
                      background: "transparent",
                      cursor: selIdx < filtered.length - 1 ? "pointer" : "not-allowed",
                      color:
                        selIdx < filtered.length - 1 ? "var(--proof-blue)" : "var(--proof-grey)",
                    }}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color:
                      selectedResult.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
                    flex: 1,
                  }}
                >
                  {selectedResult.status}
                </span>
                <button
                  onClick={() => setDetailPanelCollapsed((c) => !c)}
                  aria-label={detailPanelCollapsed ? "Expand" : "Collapse"}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--proof-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    padding: 4,
                    transform: detailPanelCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                    transition: "transform 0.15s",
                  }}
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => setSelectedResultSyncUrl(null)}
                  aria-label="Close"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--proof-text-secondary)",
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {!detailPanelCollapsed && (
                <>
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {/* Test name */}
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          fontWeight: 600,
                          lineHeight: 1.5,
                          wordBreak: "break-all",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 6,
                        }}
                      >
                        <span style={{ flex: 1 }}>{selectedResult.name}</span>
                        <button
                          onClick={() => copyTestId(selectedResult.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: 2,
                            color:
                              copiedId === selectedResult.id
                                ? "var(--proof-green)"
                                : "var(--proof-text-muted)",
                            display: "flex",
                            flexShrink: 0,
                          }}
                          title="Copy ID"
                        >
                          {copiedId === selectedResult.id ? (
                            <CheckIcon size={12} />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <span
                          style={{
                            fontSize: 11,
                            background: "var(--proof-grey-bg)",
                            padding: "2px 8px",
                            borderRadius: 4,
                            border: "1px solid var(--proof-grey)",
                          }}
                        >
                          {selectedResult.category}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--proof-text-secondary)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {selectedResult.duration}ms
                        </span>
                      </div>
                    </div>

                    {/* Filmstrip */}
                    {selectedResult.filmstrip && selectedResult.filmstrip.length > 0 && (
                      <FilmstripViewer frames={selectedResult.filmstrip} onClose={() => {}} />
                    )}

                    <EvidenceViewer evidence={selectedResult.evidence} />

                    {/* Category Breakdown */}
                    <div style={{ marginTop: 4 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "var(--proof-text-secondary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 8,
                        }}
                      >
                        Category Pass Rates
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {catBreakdown.map(([cat, stats]) => (
                          <div
                            key={cat}
                            style={{
                              fontSize: 10,
                              background: "var(--proof-surface)",
                              border: "1px solid var(--proof-border)",
                              borderRadius: 4,
                              padding: "2px 6px",
                              display: "flex",
                              gap: 6,
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{cat}</span>
                            <span
                              style={{
                                color:
                                  stats.pass === stats.total
                                    ? "var(--proof-green)"
                                    : stats.pass === 0
                                      ? "var(--proof-red)"
                                      : "var(--proof-yellow)",
                              }}
                            >
                              {stats.pass}/{stats.total}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assertions */}
                    {selectedResult.assertions && selectedResult.assertions.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--proof-text-secondary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: 6,
                          }}
                        >
                          Assertions
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {selectedResult.assertions.map((a, i) => (
                            <AssertionRow key={i} a={a} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error message */}
                    {selectedResult.error && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--proof-text-secondary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: 6,
                          }}
                        >
                          Error
                        </div>
                        <pre
                          style={{
                            fontSize: 10,
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            background: "var(--proof-red-bg)",
                            border: "1px solid var(--proof-red)",
                            borderRadius: 4,
                            padding: 10,
                            margin: 0,
                            color: "var(--proof-red)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {selectedResult.error}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div
                    style={{
                      padding: "8px 14px",
                      borderTop: "1px solid var(--proof-grey)",
                      display: "flex",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => navigate(`/trends?testId=${selectedResult.id}`)}
                      className="proof-button proof-button-xs"
                      style={{ flex: 1 }}
                    >
                      <BarChart3 size={11} /> Analytics
                    </button>
                    <button
                      onClick={() => navigate(`/tests?q=${selectedResult.id}`)}
                      className="proof-button proof-button-xs"
                      style={{ flex: 1 }}
                    >
                      <FileText size={11} /> Definition
                    </button>
                  </div>
                </>
              )}
            </div>
          </PanelErrorBoundary>
        )}
      </div>
      {Toast}
    </div>
  );
}

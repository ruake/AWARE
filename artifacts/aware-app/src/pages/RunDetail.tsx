import React from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { GoogleBarChart } from "@/components/aware/GoogleCharts";
import {
  getRunById,
  getTestResultsForRun,
  RUNS,
  getPromotionDecision,

} from "@/lib/data";
import type { TestResult, TestAssertionResult, FilmstripFrame } from "@/lib/types";
import {
  ArrowLeft,
  GitCompare,
  XCircle,
  Github,
  Share2,
  Zap,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronLeft,
  Check,
  BarChart3,
  FileText,
  Maximize2,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function AssertionRow({ a }: { a: TestAssertionResult }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 4,
        background: a.passed ? "var(--proof-green-bg)" : "var(--proof-red-bg)",
        border: `1px solid ${a.passed ? "var(--proof-green)" : "var(--proof-red)"}`,
        fontSize: 12,
      }}
    >
      {a.passed ? (
        <Check size={13} style={{ color: "var(--proof-green)", flexShrink: 0 }} />
      ) : (
        <XCircle size={13} style={{ color: "var(--proof-red)", flexShrink: 0 }} />
      )}
      <span style={{ flex: 1, fontWeight: 500 }}>{a.assertion}</span>
      <span style={{ color: "var(--proof-text-secondary)", fontSize: 11 }}>
        Expected:{" "}
        <span
          style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--proof-text)" }}
        >
          {a.expected}
        </span>
      </span>
      {!a.passed && (
        <span style={{ color: "var(--proof-text-secondary)", fontSize: 11 }}>
          Actual:{" "}
          <span
            style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--proof-red)" }}
          >
            {a.actual}
          </span>
        </span>
      )}
    </div>
  );
}

export default function RunDetail() {
  const params = useParams<{ runId: string }>();
  const [, navigate] = useLocation();
  const urlSearch = useSearch();
  const runId = params.runId ?? "";
  const { show, Toast } = useSimpleToast();

  const run = getRunById(runId) ?? RUNS[0] ?? null;
  const results = run ? getTestResultsForRun(run.id) : [];
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [catFilter, setCatFilter] = React.useState<string>("all");
  const [decision, setDecision] = React.useState(run ? getPromotionDecision(run.id) : null);
  const [expandScreenshot, setExpandScreenshot] = React.useState<FilmstripFrame | null>(null);
  const urlTestId = React.useMemo(() => new URLSearchParams(urlSearch).get("testId"), [urlSearch]);
  const [selectedResult, setSelectedResult] = React.useState<TestResult | null>(() => {
    if (urlTestId && run) return null;
    return null;
  });

  if (!run) {
    return (
      <AppLayout activeHref="/runs">
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
      </AppLayout>
    );
  }

  const decide = (action: "promote" | "block") => {
    const d = {
      runId: run.id,
      decision: action,
      decidedBy: "you",
      decidedAt: new Date().toISOString(),
      note: action === "promote" ? "Approved via run detail" : "Blocked via run detail",
    };
    setDecision(d);
    show(
      action === "promote" ? "Promotion approved for this run" : "Promotion blocked for this run",
    );
  };

  const categories = [...new Set(results.map((r) => r.category))];
  const filtered = results.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (catFilter !== "all" && r.category !== catFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const passRate = results.length > 0 ? Math.round((passCount / results.length) * 100) : 0;
  const canPromote = run.status === "PASS";

  const catData = categories.map((cat) => {
    const catResults = results.filter((r) => r.category === cat);
    return {
      category: cat.slice(0, 8),
      pass: catResults.filter((r) => r.status === "PASS").length,
      fail: catResults.filter((r) => r.status === "FAIL").length,
    };
  });

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

  const hasDecision = decision && decision.decision !== "pending";
  const decisionIsPromote = decision?.decision === "promote";

  return (
    <AppLayout activeHref="/runs">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Top bar: breadcrumb + promotion + actions + KPI inline */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/runs")} className="proof-button proof-button-xs">
            <ArrowLeft size={11} /> Runs
          </button>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--proof-text-secondary)",
            }}
          >
            {run.id}
          </span>
          <span style={{ width: 1, height: 16, background: "var(--proof-grey)" }} />
          <span
            className={`proof-badge ${run.status === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
            style={{ fontSize: 10 }}
          >
            {run.status}
          </span>
          <span
            className={`proof-badge ${canPromote ? "proof-badge-pass" : "proof-badge-fail"}`}
            style={{ fontSize: 10 }}
          >
            {hasDecision
              ? decisionIsPromote
                ? "Approved"
                : "Blocked"
              : canPromote
                ? "Ready to Promote"
                : `${failCount} failed`}
          </span>
          <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
            Pass{" "}
            <b style={{ color: passRate === 100 ? "var(--proof-green)" : "var(--proof-red)" }}>
              {passRate}%
            </b>
          </span>
          <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
            ✓{passCount} ✗{failCount}
          </span>
          <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>{run.duration}</span>
          <span style={{ width: 1, height: 16, background: "var(--proof-grey)" }} />
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              color: "var(--proof-text-secondary)",
            }}
          >
            {run.target} · {run.env} · Build {run.build}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(window.location.href)
                  .then(() => show("Permalink copied"));
              }}
              className="proof-button proof-button-xs"
            >
              <Share2 size={11} />
            </button>
            <button
              onClick={() =>
                navigate(`/compare?candidate=${run.id}&baseline=${RUNS[RUNS.length - 1]?.id}`)
              }
              className="proof-button proof-button-xs"
            >
              <GitCompare size={11} /> Compare
            </button>
            <a
              href={`https://github.com/ruake/PROOF/actions/runs/${run.id}`}
              target="_blank"
              rel="noopener"
              className="proof-button proof-button-xs"
              style={{ textDecoration: "none" }}
            >
              <Github size={11} />
            </a>
            {!hasDecision ? (
              canPromote ? (
                <button
                  onClick={() => decide("promote")}
                  className="proof-button-success"
                  style={{ fontSize: 10, padding: "3px 8px" }}
                >
                  <Zap size={11} /> Approve
                </button>
              ) : (
                <button
                  onClick={() => decide("block")}
                  className="proof-button-danger"
                  style={{ fontSize: 10, padding: "3px 8px" }}
                >
                  <XCircle size={11} /> Block
                </button>
              )
            ) : (
              <button
                onClick={() => {
                  setDecision(undefined);
                }}
                className="proof-button proof-button-xs"
                style={{ fontSize: 10 }}
              >
                <RefreshCw size={10} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Chart + results table */}
        <div style={{ display: "flex", gap: 14 }}>
          <PanelErrorBoundary label="By category chart">
            <div className="proof-card" style={{ padding: 16, width: 260, flexShrink: 0 }}>
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--proof-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 12,
                }}
              >
                By Category
              </h3>
              <GoogleBarChart
                title=""
                columns={["Category", "Pass", "Fail"]}
                data={catData}
                xKey="category"
                yKeys={["pass", "fail"]}
                colors={["#22c55e", "#ef4444"]}
                height="220px"
                showTimeFrame={false}
                isHorizontal
                barType="grouped"
              />
            </div>
          </PanelErrorBoundary>

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
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--proof-grey)",
                  background: "var(--proof-grey-bg)",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 160 }}
                >
                  <Search size={13} style={{ color: "var(--proof-text-secondary)" }} />
                  <input
                    className="proof-input"
                    placeholder="Search tests…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1, minWidth: 0 }}
                  />
                </div>
                <select
                  className="proof-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                </select>
                <select
                  className="proof-input"
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                  {filtered.length} / {results.length}
                </span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", maxHeight: 380 }}>
                <table className="proof-table">
                  <thead>
                    <tr>
                      <th>Test Name</th>
                      <th>Status</th>
                      <th>Category</th>
                      <th style={{ textAlign: "right" }}>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() =>
                          setSelectedResultSyncUrl(selectedResult?.id === r.id ? null : r)
                        }
                        style={{
                          cursor: "pointer",
                          background:
                            selectedResult?.id === r.id
                              ? "var(--proof-blue-bg)"
                              : r.status === "FAIL"
                                ? "rgba(217,48,37,0.03)"
                                : undefined,
                          outline:
                            selectedResult?.id === r.id
                              ? "2px solid var(--proof-blue) inset"
                              : undefined,
                        }}
                      >
                        <td
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            maxWidth: 260,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
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
                            onClick={() => navigate(`/analytics?testId=${r.id}`)}
                            className="proof-button proof-button-xs"
                            style={{ padding: "2px 7px" }}
                          >
                            Analytics
                          </button>
                          <button
                            onClick={() => navigate(`/testdoc?testId=${r.id}`)}
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
              </div>
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
                        selectedResult.status === "PASS"
                          ? "var(--proof-green)"
                          : "var(--proof-red)",
                      flex: 1,
                    }}
                  >
                    {selectedResult.status}
                  </span>
                  <button
                    onClick={() => setSelectedResultSyncUrl(null)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "var(--proof-text-secondary)",
                      fontSize: 18,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>

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
                      }}
                    >
                      {selectedResult.name}
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
                        Filmstrip ({selectedResult.filmstrip.length})
                      </div>
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                        {selectedResult.filmstrip.map((f) => (
                          <div key={f.id} style={{ flexShrink: 0, width: 140 }}>
                            <button
                              onClick={() => setExpandScreenshot(f)}
                              style={{
                                padding: 0,
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                display: "block",
                                width: "100%",
                              }}
                            >
                              <img
                                src={f.dataUri}
                                alt={f.label}
                                style={{
                                  width: "100%",
                                  borderRadius: 4,
                                  border: "1px solid var(--proof-grey)",
                                  display: "block",
                                }}
                              />
                            </button>
                            <div
                              style={{
                                fontSize: 9,
                                color: "var(--proof-text-secondary)",
                                marginTop: 2,
                                textAlign: "center",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 2,
                              }}
                            >
                              {f.label}
                              <Maximize2
                                size={9}
                                style={{ color: "var(--proof-text-secondary)" }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Screenshot lightbox */}
                  <Dialog
                    open={!!expandScreenshot}
                    onOpenChange={(open) => {
                      if (!open) setExpandScreenshot(null);
                    }}
                  >
                    <DialogContent
                      style={{
                        maxWidth: "90vw",
                        width: "auto",
                        background: "var(--proof-surface)",
                        border: "1px solid var(--proof-grey)",
                        padding: 0,
                      }}
                    >
                      <DialogTitle
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "8px 12px",
                          borderBottom: "1px solid var(--proof-grey)",
                          color: "var(--proof-text-secondary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {expandScreenshot?.label ?? "Screenshot"}
                      </DialogTitle>
                      {expandScreenshot && (
                        <div
                          style={{
                            padding: 12,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            maxHeight: "80vh",
                            overflow: "auto",
                          }}
                        >
                          <img
                            src={expandScreenshot.dataUri}
                            alt={expandScreenshot.label}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "70vh",
                              borderRadius: 4,
                              display: "block",
                            }}
                          />
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* HTTP Exchange — always visible */}
                  {(() => {
                    const e = selectedResult.evidence;
                    if (!e)
                      return (
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
                            HTTP Exchange
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--proof-text-secondary)",
                              fontStyle: "italic",
                            }}
                          >
                            No HTTP data captured
                          </div>
                        </div>
                      );
                    const rows: { label: string; val: string }[] = [];
                    rows.push({ label: "Method", val: e.request.method });
                    rows.push({ label: "URL", val: e.request.url });
                    rows.push({ label: "Status", val: String(e.response.status) });
                    const ct = e.response.headers?.["Content-Type"] ?? "";
                    if (ct) rows.push({ label: "Content-Type", val: ct });
                    const cl = e.response.headers?.["Content-Length"] ?? "";
                    if (cl) rows.push({ label: "Size", val: cl + " bytes" });
                    const cache = e.response.headers?.["Cache-Control"] ?? "";
                    if (cache) rows.push({ label: "Cache", val: cache });
                    return (
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
                          HTTP Exchange
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {rows.map((r) => (
                            <div key={r.label} style={{ display: "flex", gap: 6 }}>
                              <span
                                style={{
                                  color: "var(--proof-text-secondary)",
                                  width: 80,
                                  flexShrink: 0,
                                }}
                              >
                                {r.label}
                              </span>
                              <span style={{ color: "var(--proof-text)", wordBreak: "break-all" }}>
                                {r.val}
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* Response headers */}
                        {e.response.headers && Object.keys(e.response.headers).length > 0 && (
                          <details open style={{ marginTop: 8, fontSize: 11 }}>
                            <summary
                              style={{
                                cursor: "pointer",
                                color: "var(--proof-text-secondary)",
                                fontWeight: 600,
                                fontSize: 10,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Response Headers ({Object.keys(e.response.headers).length})
                            </summary>
                            <div
                              style={{
                                marginTop: 4,
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                              }}
                            >
                              {Object.entries(e.response.headers).map(([k, v]) => (
                                <div
                                  key={k}
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 10,
                                  }}
                                >
                                  <span style={{ color: "var(--proof-blue)", minWidth: 140 }}>
                                    {k}
                                  </span>
                                  <span
                                    style={{ color: "var(--proof-text)", wordBreak: "break-all" }}
                                  >
                                    {v}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                        {/* Request headers */}
                        {e.request.headers && Object.keys(e.request.headers).length > 0 && (
                          <details open style={{ marginTop: 6, fontSize: 11 }}>
                            <summary
                              style={{
                                cursor: "pointer",
                                color: "var(--proof-text-secondary)",
                                fontWeight: 600,
                                fontSize: 10,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Request Headers ({Object.keys(e.request.headers).length})
                            </summary>
                            <div
                              style={{
                                marginTop: 4,
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                              }}
                            >
                              {Object.entries(e.request.headers).map(([k, v]) => (
                                <div
                                  key={k}
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 10,
                                  }}
                                >
                                  <span style={{ color: "var(--proof-purple)", minWidth: 140 }}>
                                    {k}
                                  </span>
                                  <span
                                    style={{ color: "var(--proof-text)", wordBreak: "break-all" }}
                                  >
                                    {v}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                        {/* Cookies */}
                        {e.response.cookies && e.response.cookies.length > 0 && (
                          <details open style={{ marginTop: 6, fontSize: 11 }}>
                            <summary
                              style={{
                                cursor: "pointer",
                                color: "var(--proof-text-secondary)",
                                fontWeight: 600,
                                fontSize: 10,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Cookies ({e.response.cookies.length})
                            </summary>
                            <div
                              style={{
                                marginTop: 4,
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                              }}
                            >
                              {e.response.cookies.map((c, i) => (
                                <div
                                  key={i}
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 10,
                                    padding: "4px 6px",
                                    background: "var(--proof-grey-bg)",
                                    borderRadius: 4,
                                  }}
                                >
                                  <span style={{ color: "var(--proof-orange)", fontWeight: 600 }}>
                                    {c.name}
                                  </span>
                                  <span
                                    style={{ color: "var(--proof-text)", wordBreak: "break-all" }}
                                  >
                                    = {c.value}
                                  </span>
                                  {c.domain && (
                                    <span style={{ color: "var(--proof-text-secondary)" }}>
                                      domain={c.domain}
                                    </span>
                                  )}
                                  {c.path && (
                                    <span style={{ color: "var(--proof-text-secondary)" }}>
                                      path={c.path}
                                    </span>
                                  )}
                                  {c.httpOnly && (
                                    <span style={{ color: "var(--proof-green)" }}>HttpOnly</span>
                                  )}
                                  {c.secure && (
                                    <span style={{ color: "var(--proof-green)" }}>Secure</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })()}

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
                    onClick={() => navigate(`/analytics?testId=${selectedResult.id}`)}
                    className="proof-button proof-button-xs"
                    style={{ flex: 1 }}
                  >
                    <BarChart3 size={11} /> Analytics
                  </button>
                  <button
                    onClick={() => navigate(`/testdoc?testId=${selectedResult.id}`)}
                    className="proof-button proof-button-xs"
                    style={{ flex: 1 }}
                  >
                    <FileText size={11} /> Definition
                  </button>
                </div>
              </div>
            </PanelErrorBoundary>
          )}
        </div>
      </div>
      {Toast}
    </AppLayout>
  );
}

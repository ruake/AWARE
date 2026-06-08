import React from "react";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { GoogleBarChart } from "@/components/aware/GoogleCharts";
import { getRunById, getTestResultsForRun, RUNS, setPromotionDecision, getPromotionDecision, getTestCases } from "@/lib/data";
import type { TestResult, TestEvidence, TestAssertionResult } from "@/lib/types";
import {
  ArrowLeft, GitCompare, CheckCircle2, XCircle, Github,
  Share2, AlertTriangle, Shield, Zap, RefreshCw,
  Search, ChevronRight, ChevronLeft, X,
  FileText, Check, AlertCircle, BarChart3,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";

function generateEvidence(result: TestResult): TestEvidence {
  const tcs = getTestCases();
  const tc = tcs.find(t => t.name === result.name) ?? tcs[0];
  const body = result.status === "PASS"
    ? JSON.stringify({ status: "ok", data: { id: 123, name: "example" } }, null, 2)
    : JSON.stringify({ error: "timeout", message: "Origin did not respond within 5000ms" }, null, 2);
  return {
    request: {
      method: "GET",
      url: `https://cdn.example.com${tc ? "/api/v1/" + tc.category.replace("-", "/") : "/api/v1/data"}`,
      headers: {
        ...(tc?.requestHeaders ?? {}),
        "Host": "cdn.example.com",
        "Accept": "application/json",
      },
    },
    response: {
      status: result.status === "PASS" ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": result.status === "PASS" ? "HIT" : "MISS",
        "X-Request-ID": `req_${result.id}_${Math.random().toString(36).slice(2, 8)}`,
        "Age": result.status === "PASS" ? "127" : "0",
        "X-Cache-Status": result.status === "PASS" ? "HIT from a72-48" : "MISS from a72-48",
      },
      body,
    },
    assertions: [
      { assertion: "Response status 200", expected: "200", actual: String(result.status === "PASS" ? 200 : 503), passed: result.status === "PASS" },
      { assertion: "Response time < 5000ms", expected: "< 5000ms", actual: `${result.duration}ms`, passed: result.duration < 5000 },
      { assertion: "X-Cache is HIT", expected: "HIT", actual: result.status === "PASS" ? "HIT" : "MISS", passed: result.status === "PASS" },
      { assertion: "X-Request-ID present", expected: "non-empty", actual: "req_" + result.id.slice(-4), passed: true },
      { assertion: "Age header > 0", expected: "> 0", actual: result.status === "PASS" ? "127" : "0", passed: result.status === "PASS" },
      { assertion: "Cache status contains HIT", expected: "contains HIT", actual: result.status === "PASS" ? "HIT from a72-48" : "MISS from a72-48", passed: result.status === "PASS" },
    ],
  };
}

function AssertionRow({ a }: { a: TestAssertionResult }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, background: a.passed ? "var(--gcp-green-bg)" : "var(--gcp-red-bg)", border: `1px solid ${a.passed ? "var(--gcp-green)" : "var(--gcp-red)"}`, fontSize: 12 }}>
      {a.passed ? <Check size={13} style={{ color: "var(--gcp-green)", flexShrink: 0 }} /> : <XCircle size={13} style={{ color: "var(--gcp-red)", flexShrink: 0 }} />}
      <span style={{ flex: 1, fontWeight: 500 }}>{a.assertion}</span>
      <span style={{ color: "var(--gcp-text-secondary)", fontSize: 11 }}>Expected: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--gcp-text)" }}>{a.expected}</span></span>
      {!a.passed && <span style={{ color: "var(--gcp-text-secondary)", fontSize: 11 }}>Actual: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--gcp-red)" }}>{a.actual}</span></span>}
    </div>
  );
}

export default function RunDetail() {
  const params = useParams<{ runId: string }>();
  const [, navigate] = useLocation();
  const runId = params.runId ?? "";
  const { show, Toast } = useSimpleToast();

  const run = getRunById(runId) ?? RUNS[0] ?? null;
  const results = run ? getTestResultsForRun(run.id) : [];
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [catFilter, setCatFilter] = React.useState<string>("all");
  const [decision, setDecision] = React.useState(run ? getPromotionDecision(run.id) : null);

  if (!run) {
    return (
      <AppLayout activeHref="/runs">
        <div style={{ textAlign: "center", padding: 64 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--gcp-text-primary)" }}>Run not found</h2>
          <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", marginTop: 8 }}>The requested run does not exist.</p>
          <button onClick={() => navigate("/runs")} className="gcp-button" style={{ fontSize: 13, marginTop: 16 }}>Back to Runs</button>
        </div>
      </AppLayout>
    );
  }

  const decide = (action: "promote" | "block") => {
    const d = { runId: run.id, decision: action, decidedBy: "you", decidedAt: new Date().toISOString(), note: action === "promote" ? "Approved via run detail" : "Blocked via run detail" };
    setPromotionDecision(d);
    setDecision(d);
    show(action === "promote" ? "Promotion approved for this run" : "Promotion blocked for this run");
  };

  const categories = [...new Set(results.map(r => r.category))];
  const filtered = results.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (catFilter !== "all" && r.category !== catFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const passCount = results.filter(r => r.status === "PASS").length;
  const failCount = results.filter(r => r.status === "FAIL").length;
  const passRate = results.length > 0 ? Math.round((passCount / results.length) * 100) : 0;
  const canPromote = run.status === "PASS";

  const catData = categories.map(cat => {
    const catResults = results.filter(r => r.category === cat);
    return { category: cat.slice(0, 8), pass: catResults.filter(r => r.status === "PASS").length, fail: catResults.filter(r => r.status === "FAIL").length };
  });

  const [selectedResult, setSelectedResult] = React.useState<TestResult | null>(null);
  const evidence = selectedResult ? generateEvidence(selectedResult) : null;
  const selIdx = selectedResult ? filtered.findIndex(r => r.id === selectedResult.id) : -1;

  const navigateDetail = (dir: -1 | 1) => {
    const next = selIdx + dir;
    if (next >= 0 && next < filtered.length) setSelectedResult(filtered[next]);
  };

  const hasDecision = decision && decision.decision !== "pending";
  const decisionIsPromote = decision?.decision === "promote";

  return (
    <AppLayout activeHref="/runs">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => navigate("/runs")} className="gcp-button" style={{ fontSize: 12 }}><ArrowLeft size={13} /> Runs</button>
          <ChevronRight size={14} style={{ color: "var(--gcp-text-secondary)" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--gcp-text-secondary)" }}>{run.id}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Run Detail</h1>
            <div style={{ fontSize: 12, color: "var(--gcp-text-secondary)", fontFamily: "var(--font-mono)", marginTop: 3 }}>
              <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 10, marginRight: 6 }}>{run.target}</span>
              <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 10, marginRight: 6 }}>{run.env}</span>
              <span className={`gcp-badge ${run.network === "production" ? "gcp-badge-pass" : "gcp-badge-flaky"}`} style={{ fontSize: 10, marginRight: 6 }}>{run.network}</span>
              <span style={{ marginRight: 6 }}>Build {run.build}</span>
              <span>Rev {run.rev}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => navigator.clipboard.writeText(window.location.href).then(() => show("Permalink copied"))} className="gcp-button" style={{ fontSize: 12 }}>
              <Share2 size={13} /> Share
            </button>
            <button onClick={() => navigate(`/compare?candidate=${run.id}&baseline=${RUNS[RUNS.length - 1]?.id}`)} className="gcp-button" style={{ fontSize: 12 }}>
              <GitCompare size={13} /> Compare to Baseline
            </button>
            <a href={`https://github.com/ruake/PROOF/actions/runs/${run.id}`} target="_blank" rel="noopener" className="gcp-button" style={{ fontSize: 12, textDecoration: "none" }}>
              <Github size={13} /> Open in GitHub
            </a>
          </div>
        </div>

        {/* Promotion banner */}
        <div style={{
          background: hasDecision ? (decisionIsPromote ? "var(--gcp-green-bg)" : "var(--gcp-red-bg)") : canPromote ? "var(--gcp-green-bg)" : "var(--gcp-red-bg)",
          border: `2px solid ${hasDecision ? (decisionIsPromote ? "var(--gcp-green)" : "var(--gcp-red)") : canPromote ? "var(--gcp-green)" : "var(--gcp-red)"}`,
          borderRadius: 6, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          {canPromote ? <Shield size={20} style={{ color: "var(--gcp-green)" }} /> : <AlertTriangle size={20} style={{ color: "var(--gcp-red)" }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: hasDecision ? (decisionIsPromote ? "var(--gcp-green)" : "var(--gcp-red)") : canPromote ? "var(--gcp-green)" : "var(--gcp-red)" }}>
              {hasDecision ? (decisionIsPromote ? "Promotion Approved" : "Promotion Blocked") : canPromote ? "Ready to Promote" : `${failCount} regression${failCount !== 1 ? "s" : ""} — Promotion Blocked`}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
              <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{run.suite}</span>
              <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{run.env}</span>
              <span className={`gcp-badge ${run.network === "production" ? "gcp-badge-pass" : "gcp-badge-flaky"}`} style={{ fontSize: 9 }}>{run.network}</span>
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)", background: "var(--gcp-grey-bg)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--gcp-grey)" }}>Build {run.build}</span>
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)", background: "var(--gcp-grey-bg)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--gcp-grey)" }}>Rev {run.rev}</span>
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)" }}>{run.duration}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!hasDecision ? (
              canPromote
                ? <button onClick={() => decide("promote")} className="gcp-button-success" style={{ fontSize: 13 }}><Zap size={14} /> Approve Promotion</button>
                : <button onClick={() => decide("block")} className="gcp-button-danger" style={{ fontSize: 13 }}><XCircle size={14} /> Confirm Block</button>
            ) : (
              <button onClick={() => { setPromotionDecision({ runId: run.id, decision: "pending" }); setDecision(undefined); }} className="gcp-button" style={{ fontSize: 12 }}>
                <RefreshCw size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
          {[
            { label: "Status", value: <span className={`gcp-badge ${run.status === "PASS" ? "gcp-badge-pass" : run.status === "FAIL" ? "gcp-badge-fail" : "gcp-badge-partial"}`} style={{ fontSize: 14, padding: "4px 10px" }}>{run.status}</span> },
            { label: "Pass Rate", value: <span style={{ fontSize: 22, fontWeight: 700, color: passRate === 100 ? "var(--gcp-green)" : passRate < 90 ? "var(--gcp-red)" : "var(--gcp-text)" }}>{passRate}%</span> },
            { label: "Tests Passed", value: <span style={{ fontSize: 22, fontWeight: 700, color: "var(--gcp-green)" }}>{passCount}</span> },
            { label: "Tests Failed", value: <span style={{ fontSize: 22, fontWeight: 700, color: failCount > 0 ? "var(--gcp-red)" : "var(--gcp-text-secondary)" }}>{failCount}</span> },
            { label: "Duration", value: <span style={{ fontSize: 18, fontWeight: 600 }}>{run.duration}</span> },
          ].map(k => (
            <div key={k.label} className="gcp-card" style={{ padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginBottom: 8, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>{k.label}</div>
              {k.value}
            </div>
          ))}
        </div>

        {/* Chart + results table */}
        <div style={{ display: "flex", gap: 14 }}>
          <div className="gcp-card" style={{ padding: 16, width: 260, flexShrink: 0 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>By Category</h3>
            <GoogleBarChart
              title=""
              columns={["Category", "Pass", "Fail"]}
              data={catData}
              xKey="category"
              yKeys={["pass", "fail"]}
              colors={["#1e8e3e", "#d93025"]}
              height="220px"
              showTimeFrame={false}
              isHorizontal
              barType="grouped"
            />
          </div>

          <div className="gcp-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 160 }}>
                <Search size={13} style={{ color: "var(--gcp-text-secondary)" }} />
                <input className="gcp-input" placeholder="Search tests…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
              </div>
              <select className="gcp-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
              <select className="gcp-input" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="all">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{filtered.length} / {results.length}</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", maxHeight: 380 }}>
              <table className="gcp-table">
                <thead><tr>
                  <th>Test Name</th><th>Status</th><th>Category</th>
                  <th style={{ textAlign: "right" }}>Duration</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}
                      onClick={() => setSelectedResult(selectedResult?.id === r.id ? null : r)}
                      style={{ cursor: "pointer", background: selectedResult?.id === r.id ? "var(--gcp-blue-bg)" : r.status === "FAIL" ? "rgba(217,48,37,0.03)" : undefined, outline: selectedResult?.id === r.id ? "2px solid var(--gcp-blue) inset" : undefined }}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</td>
                      <td><span className={`gcp-badge ${r.status === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{r.status}</span></td>
                      <td><span style={{ fontSize: 11, background: "var(--gcp-grey-bg)", padding: "2px 7px", borderRadius: 4, border: "1px solid var(--gcp-grey)" }}>{r.category}</span></td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text-secondary)" }}>{r.duration}ms</td>
                      <td onClick={e => e.stopPropagation()}>
                        <button onClick={() => navigate(`/analytics?testId=${r.id}`)} className="gcp-button" style={{ fontSize: 10, padding: "2px 7px" }}>Analytics</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test Detail Panel */}
          {selectedResult && evidence && (
            <div className="gcp-card" style={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: `3px solid ${selectedResult.status === "PASS" ? "var(--gcp-green)" : "var(--gcp-red)"}` }}>
              {/* Panel header */}
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", gap: 8, background: "var(--gcp-blue-bg)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 1, border: "1px solid var(--gcp-grey)", borderRadius: 4, background: "var(--gcp-surface)" }}>
                  <button disabled={selIdx <= 0} onClick={() => navigateDetail(-1)} style={{ padding: "4px 7px", border: "none", background: "transparent", cursor: selIdx > 0 ? "pointer" : "not-allowed", color: selIdx > 0 ? "var(--gcp-blue)" : "var(--gcp-grey)" }}><ChevronLeft size={13} /></button>
                  <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)", padding: "0 4px" }}>{selIdx + 1}/{filtered.length}</span>
                  <button disabled={selIdx >= filtered.length - 1} onClick={() => navigateDetail(1)} style={{ padding: "4px 7px", border: "none", background: "transparent", cursor: selIdx < filtered.length - 1 ? "pointer" : "not-allowed", color: selIdx < filtered.length - 1 ? "var(--gcp-blue)" : "var(--gcp-grey)" }}><ChevronRight size={13} /></button>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: selectedResult.status === "PASS" ? "var(--gcp-green)" : "var(--gcp-red)", flex: 1 }}>{selectedResult.status}</span>
                <button onClick={() => setSelectedResult(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)", fontSize: 18, lineHeight: 1 }}>×</button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Test name */}
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, lineHeight: 1.5, wordBreak: "break-all" }}>{selectedResult.name}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <span style={{ fontSize: 11, background: "var(--gcp-grey-bg)", padding: "2px 8px", borderRadius: 4, border: "1px solid var(--gcp-grey)" }}>{selectedResult.category}</span>
                    <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)", fontFamily: "var(--font-mono)" }}>{selectedResult.duration}ms</span>
                  </div>
                </div>

                {/* HTTP Request */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <FileText size={11} /> Request
                  </div>
                  <div style={{ background: "#1e293b", color: "#e2e8f0", borderRadius: 6, padding: 10, fontFamily: "var(--font-mono)", fontSize: 10, lineHeight: 1.7 }}>
                    <div><span style={{ color: "#60a5fa" }}>{evidence.request.method}</span> {evidence.request.url}</div>
                    {Object.entries(evidence.request.headers).map(([k, v]) => (
                      <div key={k}><span style={{ color: "#f59e0b" }}>{k}:</span> {v}</div>
                    ))}
                  </div>
                </div>

                {/* HTTP Response */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <FileText size={11} /> Response
                  </div>
                  <div style={{ background: "#1e293b", color: "#e2e8f0", borderRadius: 6, padding: 10, fontFamily: "var(--font-mono)", fontSize: 10, lineHeight: 1.7 }}>
                    <div><span style={{ color: evidence.response.status === 200 ? "#4ade80" : "#f87171" }}>{evidence.response.status}</span></div>
                    {Object.entries(evidence.response.headers).map(([k, v]) => (
                      <div key={k}><span style={{ color: "#f59e0b" }}>{k}:</span> {v}</div>
                    ))}
                    {evidence.response.body && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #334155", whiteSpace: "pre-wrap" }}>{evidence.response.body}</div>
                    )}
                  </div>
                </div>

                {/* Assertions */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertCircle size={11} /> Assertions ({evidence.assertions.filter(a => a.passed).length}/{evidence.assertions.length} passed)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {evidence.assertions.map((a, i) => <AssertionRow key={i} a={a} />)}
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div style={{ padding: "8px 14px", borderTop: "1px solid var(--gcp-grey)", display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => navigate(`/analytics?testId=${selectedResult.id}`)} className="gcp-button" style={{ fontSize: 10, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <BarChart3 size={11} /> Analytics
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
      {Toast}
    </AppLayout>
  );
}

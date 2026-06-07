import React from "react";
import { useParams, useLocation } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { AppLayout } from "@/components/aware/AppLayout";
import { getRunById, getTestResultsForRun, RUNS, setPromotionDecision, getPromotionDecision } from "@/lib/data";
import {
  ArrowLeft, GitCompare, CheckCircle2, XCircle, Github,
  Share2, AlertTriangle, Shield, Zap, RefreshCw,
  Search, ChevronRight,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";

export default function RunDetail() {
  const params = useParams<{ runId: string }>();
  const [, navigate] = useLocation();
  const runId = params.runId ?? "";
  const { show, Toast } = useSimpleToast();

  const run = getRunById(runId) ?? RUNS[0];
  const results = getTestResultsForRun(run.id);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [catFilter, setCatFilter] = React.useState<string>("all");
  const [decision, setDecision] = React.useState(getPromotionDecision(run.id));

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
  const passRate = Math.round((passCount / results.length) * 100);
  const canPromote = run.status === "PASS";

  const catData = categories.map(cat => {
    const catResults = results.filter(r => r.category === cat);
    return { cat: cat.slice(0, 8), pass: catResults.filter(r => r.status === "PASS").length, fail: catResults.filter(r => r.status === "FAIL").length };
  });

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
            <div style={{ fontSize: 12, color: "var(--gcp-text-secondary)", fontFamily: "var(--font-mono)", marginTop: 3 }}>{run.id}</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => navigator.clipboard.writeText(window.location.href).then(() => show("Permalink copied"))} className="gcp-button" style={{ fontSize: 12 }}>
              <Share2 size={13} /> Share
            </button>
            <button onClick={() => navigate(`/compare?candidate=${run.id}&baseline=${RUNS[RUNS.length - 1]?.id}`)} className="gcp-button" style={{ fontSize: 12 }}>
              <GitCompare size={13} /> Compare to Baseline
            </button>
            <a href={`https://github.com/salesforce/aware/actions/runs/${run.id}`} target="_blank" rel="noopener" className="gcp-button" style={{ fontSize: 12, textDecoration: "none" }}>
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
              {hasDecision ? (decisionIsPromote ? "Promotion Approved" : "Promotion Blocked") : canPromote ? "Ready to Promote to Akamai" : `${failCount} regression${failCount !== 1 ? "s" : ""} — Promotion Blocked`}
            </div>
            <div style={{ fontSize: 12, color: "var(--gcp-text-secondary)", marginTop: 2 }}>
              {run.suite} · {run.env} · PM {run.pm} · EW {run.ew} · {run.duration}
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
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 14 }}>
          <div className="gcp-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>By Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f3f4" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#5f6368" }} />
                <YAxis dataKey="cat" type="category" tick={{ fontSize: 10, fill: "#5f6368" }} width={60} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Bar dataKey="pass" fill="#1e8e3e" radius={[0,2,2,0]} name="Pass" stackId="a" />
                <Bar dataKey="fail" fill="#d93025" radius={[0,2,2,0]} name="Fail" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="gcp-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
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
                    <tr key={r.id} style={{ background: r.status === "FAIL" ? "rgba(217,48,37,0.03)" : undefined }}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</td>
                      <td><span className={`gcp-badge ${r.status === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{r.status}</span></td>
                      <td><span style={{ fontSize: 11, background: "var(--gcp-grey-bg)", padding: "2px 7px", borderRadius: 4, border: "1px solid var(--gcp-grey)" }}>{r.category}</span></td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text-secondary)" }}>{r.duration}ms</td>
                      <td>
                        <button onClick={() => navigate(`/analytics?testId=${r.id}`)} className="gcp-button" style={{ fontSize: 10, padding: "2px 7px" }}>Analytics</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
      {Toast}
    </AppLayout>
  );
}

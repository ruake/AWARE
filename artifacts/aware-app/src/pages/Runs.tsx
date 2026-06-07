import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { RUNS } from "@/lib/data";
import type { Run } from "@/lib/types";
import {
  Play, GitCompare, Search, Filter, BarChart3,
  CheckCircle2, XCircle, Clock, Share2,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";

function statusBadge(status: Run["status"]) {
  const map: Record<string, { cls: string; label: string }> = {
    PASS: { cls: "gcp-badge-pass", label: "PASS" },
    FAIL: { cls: "gcp-badge-fail", label: "FAIL" },
    PARTIAL: { cls: "gcp-badge-partial", label: "PARTIAL" },
    FLAKY: { cls: "gcp-badge-flaky", label: "FLAKY" },
    RUNNING: { cls: "gcp-badge-running", label: "RUNNING" },
  };
  const s = map[status] ?? { cls: "gcp-badge-skip", label: status };
  return <span className={`gcp-badge ${s.cls}`}>{s.label}</span>;
}

export default function Runs() {
  const [, navigate] = useLocation();
  const { show, Toast } = useSimpleToast();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [suiteFilter, setSuiteFilter] = React.useState<string>("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const suites = [...new Set(RUNS.map(r => r.suite))];
  const filtered = RUNS.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (suiteFilter !== "all" && r.suite !== suiteFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.id.toLowerCase().includes(q) && !r.env.toLowerCase().includes(q) && !r.suite.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const comparePair = selectedIds.size === 2 ? [...selectedIds] : null;

  return (
    <AppLayout activeHref="/runs">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Regression Runs</h1>
            <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", marginTop: 3 }}>{RUNS.length} runs · All GitHub Actions executions</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {comparePair && (
              <button onClick={() => navigate(`/compare?baseline=${comparePair[0]}&candidate=${comparePair[1]}`)} className="gcp-button-primary" style={{ fontSize: 13 }}>
                <GitCompare size={14} /> Compare Selected ({selectedIds.size})
              </button>
            )}
            <button onClick={() => navigate("/start")} className="gcp-button-primary" style={{ fontSize: 13 }}>
              <Play size={14} /> Start New Run
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Total Runs", value: RUNS.length, icon: BarChart3, color: "var(--gcp-blue)" },
            { label: "Passing", value: RUNS.filter(r => r.status === "PASS").length, icon: CheckCircle2, color: "var(--gcp-green)" },
            { label: "Failing", value: RUNS.filter(r => r.status === "FAIL").length, icon: XCircle, color: "var(--gcp-red)" },
            { label: "Avg Duration", value: `${Math.round(RUNS.reduce((s, r) => s + r.durationMs, 0) / RUNS.length / 60000)}m`, icon: Clock, color: "var(--gcp-text-secondary)" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="gcp-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <Icon size={20} style={{ color: s.color }} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="gcp-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 200px", minWidth: 160 }}>
            <Search size={14} style={{ color: "var(--gcp-text-secondary)", flexShrink: 0 }} />
            <input className="gcp-input" placeholder="Search run ID, env, suite…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={13} style={{ color: "var(--gcp-text-secondary)" }} />
            <select className="gcp-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
              <option value="PARTIAL">PARTIAL</option>
            </select>
          </div>
          <select className="gcp-input" value={suiteFilter} onChange={e => setSuiteFilter(e.target.value)}>
            <option value="all">All suites</option>
            {suites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)", marginLeft: "auto" }}>
            {filtered.length} of {RUNS.length} runs{selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
          </span>
        </div>

        {/* Table */}
        <div className="gcp-card" style={{ overflow: "hidden" }}>
          <table className="gcp-table">
            <thead><tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" style={{ cursor: "pointer" }}
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map(r => r.id)) : new Set())}
                />
              </th>
              <th>Run ID</th><th>Suite</th><th>Target</th><th>Env / Network</th><th>Status</th>
              <th style={{ textAlign: "right" }}>Pass %</th>
              <th style={{ textAlign: "right" }}>Failures</th>
              <th style={{ textAlign: "right" }}>Duration</th>
              <th>Started</th><th>Akamai Config</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(run => {
                const isSelected = selectedIds.has(run.id);
                return (
                  <tr key={run.id} style={{ background: isSelected ? "var(--gcp-blue-bg)" : undefined, outline: isSelected ? "2px solid var(--gcp-blue)" : "none", outlineOffset: -2 }}>
                    <td><input type="checkbox" style={{ cursor: "pointer" }} checked={isSelected} onChange={() => toggleSelect(run.id)} /></td>
                    <td>
                      <button onClick={() => navigate(`/runs/${run.id}`)} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-blue)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0, textAlign: "left" }}>
                        {run.id}
                      </button>
                    </td>
                    <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{run.suite}</span></td>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{run.target}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 12 }}>{run.env}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", background: run.network === "production" ? "var(--gcp-green-bg)" : "var(--gcp-yellow-bg)", color: run.network === "production" ? "var(--gcp-green)" : "#e37400", padding: "1px 5px", borderRadius: 3, border: `1px solid ${run.network === "production" ? "var(--gcp-green)" : "#f9ab00"}` }}>{run.network}</span>
                      </div>
                    </td>
                    <td>{statusBadge(run.status)}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: run.passPct === 100 ? "var(--gcp-green)" : run.passPct < 90 ? "var(--gcp-red)" : "var(--gcp-text)" }}>{run.passPct}%</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: run.failures > 0 ? "var(--gcp-red)" : "var(--gcp-text-secondary)" }}>{run.failures || "—"}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text-secondary)" }}>{run.duration}</td>
                    <td style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>
                      {new Date(run.started).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text)" }}>PM {run.pm}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gcp-text-secondary)" }}>EW {run.ew}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => navigate(`/runs/${run.id}`)} className="gcp-button" style={{ fontSize: 11, padding: "3px 8px" }}>Detail</button>
                        <button onClick={() => navigate(`/compare?baseline=${RUNS[RUNS.length-1]?.id}&candidate=${run.id}`)} className="gcp-button" style={{ fontSize: 11, padding: "3px 8px" }}>
                          <GitCompare size={11} /> Compare
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={11} style={{ textAlign: "center", padding: "32px", color: "var(--gcp-text-secondary)", fontSize: 13 }}>No runs match your filters</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Bulk actions */}
        {selectedIds.size >= 2 && (
          <div className="gcp-card" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedIds.size} runs selected</span>
            {comparePair && (
              <button onClick={() => navigate(`/compare?baseline=${comparePair[0]}&candidate=${comparePair[1]}`)} className="gcp-button-primary" style={{ fontSize: 12 }}>
                <GitCompare size={13} /> Compare These Runs
              </button>
            )}
            <button onClick={() => { navigator.clipboard.writeText([...selectedIds].join(", ")).then(() => show("Run IDs copied")); }} className="gcp-button" style={{ fontSize: 12 }}>
              <Share2 size={13} /> Copy Run IDs
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="gcp-button" style={{ fontSize: 12, marginLeft: "auto" }}>Clear selection</button>
          </div>
        )}
      </div>
      {Toast}
    </AppLayout>
  );
}

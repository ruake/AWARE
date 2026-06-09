import React from "react";
import { useLocation } from "wouter";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AppLayout } from "@/components/aware/AppLayout";
import { CTAStatCard } from "@/components/aware/CTAStatCard";
import { RUNS } from "@/lib/data";
import { getEnvLabels } from "@/lib/envConfig";
import { useSyncedUrlState } from "@/lib/urlState";
import type { Run } from "@/lib/types";
import {
  Play, GitCompare, Search, Filter, BarChart3,
  CheckCircle2, XCircle, Clock, Share2, X,
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
  const [search, setSearch] = useSyncedUrlState("q", "");
  const [statusFilter, setStatusFilter] = useSyncedUrlState("status", "all");
  const [suiteFilter, setSuiteFilter] = useSyncedUrlState("suite", "all");
  const [envFilter, setEnvFilter] = useSyncedUrlState("env", "all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const envs = [...new Set(RUNS.map(r => r.env))];
  const suites = [...new Set(RUNS.map(r => r.suite))];
  const envLabels = getEnvLabels();

  const filtered = RUNS.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (suiteFilter !== "all" && r.suite !== suiteFilter) return false;
    if (envFilter !== "all" && r.env !== envFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.id.toLowerCase().includes(q) && !r.env.toLowerCase().includes(q) && !r.suite.toLowerCase().includes(q) && !r.target.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const comparePair = selectedIds.size === 2 ? [...selectedIds] : null;

  const hasActiveFilters = statusFilter !== "all" || suiteFilter !== "all" || envFilter !== "all" || search !== "";

  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  return (
    <AppLayout activeHref="/runs">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", flex: 1 }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Regression Runs</h1>
            <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 3 }}>{RUNS.length} runs · All GitHub Actions executions</p>
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

        {/* Stats — clickable CTA cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <CTAStatCard label="Total Runs" value={RUNS.length} subtitle="all environments" accentColor="var(--proof-blue)" icon={<BarChart3 size={16} />} onClick={() => { setStatusFilter("all"); setEnvFilter("all"); setSuiteFilter("all"); setSearch(""); navigate("/runs"); }} active={statusFilter === "all" && envFilter === "all" && suiteFilter === "all" && search === ""} />
          <CTAStatCard label="Passing" value={RUNS.filter(r => r.status === "PASS").length} subtitle="successful runs" accentColor="var(--proof-green)" icon={<CheckCircle2 size={16} />} onClick={() => navigate(`/runs?status=PASS`)} active={statusFilter === "PASS"} />
          <CTAStatCard label="Failing" value={RUNS.filter(r => r.status === "FAIL").length} subtitle="need attention" accentColor="var(--proof-red)" icon={<XCircle size={16} />} onClick={() => navigate(`/runs?status=FAIL`)} active={statusFilter === "FAIL"} />
          <CTAStatCard label="Avg Duration" value={`${Math.round(RUNS.reduce((s, r) => s + r.durationMs, 0) / RUNS.length / 60000)}m`} subtitle="per run" accentColor="var(--proof-text-secondary)" icon={<Clock size={16} />} />
        </div>

        {/* Filters */}
        <div className="gcp-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 200px", minWidth: 160 }}>
            <Search size={14} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
            <input className="gcp-input" placeholder="Search run ID, env, suite, target…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={13} style={{ color: "var(--proof-text-secondary)" }} />
            <select className="gcp-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="FLAKY">FLAKY</option>
            </select>
          </div>
          <select className="gcp-input" value={suiteFilter} onChange={e => setSuiteFilter(e.target.value)}>
            <option value="all">All suites</option>
            {suites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="gcp-input" value={envFilter} onChange={e => setEnvFilter(e.target.value)}>
            <option value="all">All environments</option>
            {envs.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          {hasActiveFilters && (
            <button onClick={() => { setStatusFilter("all"); setSuiteFilter("all"); setEnvFilter("all"); setSearch(""); }} style={{ fontSize: 11, color: "var(--proof-red)", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}>
              <X size={12} /> Clear filters
            </button>
          )}
          <span style={{ fontSize: 12, color: "var(--proof-text-secondary)", marginLeft: "auto" }}>
            {filtered.length} of {RUNS.length} runs{selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
          </span>
        </div>

        {/* Active filter badges */}
        {(statusFilter !== "all" || suiteFilter !== "all" || envFilter !== "all") && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>Active filters:</span>
            {statusFilter !== "all" && (
              <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 10, cursor: "pointer" }} onClick={() => setStatusFilter("all")}>
                status={statusFilter} <X size={10} style={{ marginLeft: 3 }} />
              </span>
            )}
            {suiteFilter !== "all" && (
              <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 10, cursor: "pointer" }} onClick={() => setSuiteFilter("all")}>
                suite={suiteFilter} <X size={10} style={{ marginLeft: 3 }} />
              </span>
            )}
            {envFilter !== "all" && (
              <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 10, cursor: "pointer" }} onClick={() => setEnvFilter("all")}>
                env={envFilter} <X size={10} style={{ marginLeft: 3 }} />
              </span>
            )}
          </div>
        )}

        {/* Table */}
        <div className="gcp-card" style={{ overflow: "hidden", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div ref={tableContainerRef} style={{ flex: 1, overflow: "auto", position: "relative" }}>
            <table className="gcp-table" style={{ position: "relative" }}>
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
                <th>Started</th><th>Build Config</th><th>Actions</th>
              </tr></thead>
              <tbody style={{ position: "relative", height: rowVirtualizer.getTotalSize() }}>
                {rowVirtualizer.getVirtualItems().map(virtualRow => {
                  const run = filtered[virtualRow.index];
                  const isSelected = selectedIds.has(run.id);
                  return (
                    <tr key={run.id} style={{
                      position: "absolute", top: 0, left: 0, width: "100%",
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                      background: isSelected ? "var(--proof-blue-bg)" : undefined,
                      outline: isSelected ? "2px solid var(--proof-blue)" : "none",
                      outlineOffset: -2,
                    }}>
                      <td><input type="checkbox" style={{ cursor: "pointer" }} checked={isSelected} onChange={() => toggleSelect(run.id)} /></td>
                      <td>
                        <button onClick={() => navigate(`/runs/${run.id}`)} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-blue)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0, textAlign: "left" }}>
                          {run.id}
                        </button>
                      </td>
                      <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{run.suite}</span></td>
                      <td style={{ fontSize: 12, fontWeight: 500 }}>{run.target}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: 12 }}>{run.env}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", background: run.network === "production" ? "var(--proof-green-bg)" : "var(--proof-yellow-bg)", color: run.network === "production" ? "var(--proof-green)" : "#d97706", padding: "1px 5px", borderRadius: 3, border: `1px solid ${run.network === "production" ? "var(--proof-green)" : "#f59e0b"}` }}>{run.network}</span>
                        </div>
                      </td>
                      <td>{statusBadge(run.status)}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: run.passPct === 100 ? "var(--proof-green)" : run.passPct < 90 ? "var(--proof-red)" : "var(--proof-text)" }}>{run.passPct}%</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: run.failures > 0 ? "var(--proof-red)" : "var(--proof-text-secondary)" }}>{run.failures || "—"}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-text-secondary)" }}>{run.duration}</td>
                      <td style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                        {new Date(run.started).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-text)" }}>Build {run.build}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--proof-text-secondary)" }}>Rev {run.rev}</span>
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
                {filtered.length === 0 && <tr style={{ position: "absolute", top: 0, left: 0, width: "100%" }}><td colSpan={11} style={{ textAlign: "center", padding: "32px", color: "var(--proof-text-secondary)", fontSize: 13 }}>No runs match your filters</td></tr>}
              </tbody>
            </table>
          </div>
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

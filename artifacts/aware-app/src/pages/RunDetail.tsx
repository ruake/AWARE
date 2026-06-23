import React, { useSyncExternalStore } from "react";
import { useParams, useLocation } from "wouter";
import {
  getRunById,
  getTestResultsForRun,
  getDataInitState,
  subscribeToDataInit,
} from "@/lib/data";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  GitCompare,
  Clock,
  TerminalSquare,
  AlertTriangle,
  Calendar
} from "lucide-react";
import { useSyncedUrlState } from "@/lib/urlState";
import { SkeletonTable, SkeletonText } from "@/components/aware/Skeleton";
import { AssertionRow } from "@/components/aware/AssertionRow";
import { Pagination } from "@/components/aware/Pagination";
import { TestHistoryStrip } from "@/components/aware/HistoryTimeline";

export default function RunDetail() {
  const params = useParams<{ runId: string }>();
  const [, navigate] = useLocation();
  const runId = params.runId ?? "";

  const initState = useSyncExternalStore(subscribeToDataInit, getDataInitState);
  const run = getRunById(runId) ?? null;
  const results = React.useMemo(() => run ? getTestResultsForRun(run.id) : [], [run]);
  
  const [search, setSearch] = useSyncedUrlState("q", "");
  const [statusFilter, setStatusFilter] = useSyncedUrlState("status", "all");
  const [catFilter, setCatFilter] = useSyncedUrlState("cat", "all");
  const filtered = React.useMemo(() => {
    return results.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (catFilter !== "all" && r.category !== catFilter) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [results, statusFilter, catFilter, search]);

  const [page, setPage] = React.useState(1);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const PAGE_SIZE = 25;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedResults = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleRow = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const counts = {
    total: results.length,
    passed: results.filter((r) => r.status === "PASS").length,
    failed: results.filter((r) => r.status === "FAIL").length,
    skipped: results.filter((r) => (r.status as string) === "SKIPPED").length,
  };

  const getStatusColor = (status: string) => {
    if (status === "PASS") return "var(--proof-emerald)";
    if (status === "FAIL") return "var(--proof-red)";
    if (status === "SKIPPED") return "var(--proof-text-muted)";
    if (status === "FLAKY") return "var(--proof-yellow)";
    if (status === "TIMEOUT") return "var(--proof-orange)";
    return "var(--proof-text-secondary)";
  };

  const [sortKey, setSortKey] = React.useState<string>("name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const sortedResults = React.useMemo(() => {
    return [...paginatedResults].sort((a, b) => {
      const valA: string | number = a[sortKey as keyof typeof a] as string | number;
      const valB: string | number = b[sortKey as keyof typeof b] as string | number;
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [paginatedResults, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleKeyDownSort = (e: React.KeyboardEvent, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSort(key);
    }
  };

  if (initState.error && !initState.loading) {
    return (
      <div style={{ textAlign: "center", padding: 64 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "var(--proof-red-bg)", border: "1px solid var(--proof-red-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <XCircle size={20} style={{ color: "var(--proof-red)" }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text-primary)" }}>
          Failed to load data
        </h2>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 8 }}>
          Could not fetch run details. Check your network connection.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="proof-btn proof-btn-primary"
          style={{ fontSize: 13, marginTop: 16 }}
        >
          Retry
        </button>
      </div>
    );
  }

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
          className="proof-btn proof-btn-ghost"
          style={{ fontSize: 13, marginTop: 16 }}
        >
          Back to Runs
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", minHeight: 0 }}>
      {/* Sticky Header */}
      <div
        className="proof-card"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "16px 24px",
          background: "var(--proof-glass-surface)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--proof-border)",
          borderRadius: 0,
          margin: "-24px -28px 0 -28px"
        }}
      >
        <button 
          onClick={() => navigate("/runs")}
          className="proof-btn-ghost"
          aria-label="Back to runs"
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8, padding: 0,
            border: '1px solid var(--proof-border)'
          }}
        >
          <ArrowLeft size={16} />
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700 }}>
              {run.id.split("-")[0]}
            </span>
            <span className={`proof-badge ${run.env === "PROD" ? "proof-badge-critical" : run.env === "UAT" ? "proof-badge-degraded" : "proof-badge-healthy"}`}>
              {run.env} {run.network}
            </span>
            <span className="proof-badge" style={{ color: getStatusColor(run.status), borderColor: getStatusColor(run.status), background: `color-mix(in srgb, ${getStatusColor(run.status)} 10%, transparent)` }}>
              {run.status}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--proof-text-secondary)" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> {run.duration}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} /> {new Date(run.started).toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Pass rate progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: 200 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600 }}>
              <span>Pass Rate</span>
              <span style={{ color: run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)" }}>
                {run.passPct}%
              </span>
            </div>
            <div className="proof-progress-track" style={{ height: 6 }}>
              <div 
                className="proof-progress-bar" 
                style={{ 
                  width: `${run.passPct}%`,
                  background: run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)"
                }} 
              />
            </div>
          </div>
        </div>

        <button 
          className="proof-btn proof-btn-primary"
          onClick={() => navigate(`/compare?base=${run.id}`)}
        >
          <GitCompare size={14} /> Compare
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Tests", value: counts.total, icon: TerminalSquare, color: "var(--proof-text)" },
          { label: "Passed", value: counts.passed, icon: CheckCircle2, color: "var(--proof-green)" },
          { label: "Failed", value: counts.failed, icon: XCircle, color: "var(--proof-red)" },
          { label: "Skipped", value: counts.skipped, icon: HelpCircle, color: "var(--proof-text-muted)" }
        ].map(stat => (
          <div key={stat.label} className="proof-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: 10, 
              background: `color-mix(in srgb, ${stat.color} 10%, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: stat.color
            }}>
              <stat.icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--proof-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: stat.color, lineHeight: 1.2 }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content table */}
      <div className="proof-card" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* Filters */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--proof-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", width: 240 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--proof-text-muted)" }} />
            <input 
              className="proof-input" 
              placeholder="Search tests..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
          </div>
          
          <select className="proof-input" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="PASS">Passed</option>
            <option value="FAIL">Failed</option>
            <option value="SKIPPED">Skipped</option>
            <option value="FLAKY">Flaky</option>
          </select>

          <select className="proof-input" style={{ width: 160 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {[...new Set(results.map((r) => r.category).filter(Boolean))].sort().map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(search || statusFilter !== "all" || catFilter !== "all") && (
            <button onClick={() => { setSearch(""); setStatusFilter("all"); setCatFilter("all"); }} className="proof-btn proof-btn-ghost">
              Clear Filters
            </button>
          )}
          
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: "var(--proof-text-muted)" }}>
            Showing {filtered.length} tests
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="proof-table" style={{ width: "100%", minWidth: 600, borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--proof-surface)", zIndex: 5 }}>
              <tr>
                <th style={{ width: 40, padding: "12px 16px" }}></th>
                <th 
                  onClick={() => toggleSort("name")}
                  onKeyDown={(e) => handleKeyDownSort(e, "name")}
                  tabIndex={0}
                  style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--proof-text-muted)", cursor: "pointer", borderRadius: "4px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-hover-light)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  TEST {sortKey === "name" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  onClick={() => toggleSort("status")}
                  onKeyDown={(e) => handleKeyDownSort(e, "status")}
                  tabIndex={0}
                  style={{ width: 120, textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--proof-text-muted)", cursor: "pointer", borderRadius: "4px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-hover-light)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  STATUS {sortKey === "status" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  onClick={() => toggleSort("category")}
                  onKeyDown={(e) => handleKeyDownSort(e, "category")}
                  tabIndex={0}
                  style={{ width: 140, textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--proof-text-muted)", cursor: "pointer", borderRadius: "4px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-hover-light)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  CATEGORY {sortKey === "category" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th style={{ width: 180, textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--proof-text-muted)" }}>HISTORY</th>
                <th 
                  onClick={() => toggleSort("duration")}
                  onKeyDown={(e) => handleKeyDownSort(e, "duration")}
                  tabIndex={0}
                  style={{ width: 100, textAlign: "right", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--proof-text-muted)", cursor: "pointer", borderRadius: "4px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-hover-light)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  DURATION {sortKey === "duration" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((r) => {
                const isExpanded = expandedRows.has(r.id);
                return (
                  <React.Fragment key={r.id}>
                    <tr 
                      id={`row-${r.id}`}
                      onClick={() => toggleRow(r.id)}
                      style={{ 
                        cursor: "pointer", 
                        borderBottom: "1px solid var(--proof-border-light)",
                        background: isExpanded ? "var(--proof-surface-2)" : "transparent",
                        transition: "background var(--proof-transition)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = "var(--proof-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ padding: "12px 16px", color: "var(--proof-text-muted)" }}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                        {r.name}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className="proof-badge" style={{ color: getStatusColor(r.status), borderColor: getStatusColor(r.status) }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--proof-text-secondary)" }}>
                        {r.category}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div onClick={e => e.stopPropagation()}>
                          <TestHistoryStrip testName={r.name} currentRunId={run.id} />
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--proof-text-secondary)" }}>
                        {r.duration}ms
                      </td>
                    </tr>
                    
                    {/* Expanded details */}
                    {isExpanded && (
                      <tr style={{ background: "var(--proof-surface-2)", borderBottom: "1px solid var(--proof-border)" }}>
                        <td colSpan={6} style={{ padding: "20px 40px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            
                            {/* Error Details */}
                            {r.error && (
                              <div style={{ background: "var(--proof-red-bg)", border: "1px solid var(--proof-red-border)", borderRadius: 8, padding: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--proof-red)", fontWeight: 600, marginBottom: 8, fontSize: 12 }}>
                                  <AlertTriangle size={14} /> ERROR DETAILS
                                </div>
                                <pre style={{ 
                                  fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--proof-red-bright)", 
                                  whiteSpace: "pre-wrap", margin: 0 
                                }}>
                                  {r.error}
                                </pre>
                              </div>
                            )}

                            {/* Assertions */}
                            {r.assertions && r.assertions.length > 0 && (
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-text-muted)", marginBottom: 12 }}>ASSERTIONS</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {r.assertions.map((a, i) => (
                                    <AssertionRow key={a.assertion || i} a={a} />
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Actions */}
                            <div style={{ display: "flex", gap: 12 }}>
                              <button onClick={() => navigate(`/trends?testId=${r.id}`)} className="proof-btn proof-btn-ghost">
                                View Analytics
                              </button>
                              <button onClick={() => navigate(`/tests?q=${r.id}`)} className="proof-btn proof-btn-ghost">
                                View Definition
                              </button>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 64, textAlign: "center", color: "var(--proof-text-secondary)" }}>
                    No results found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--proof-border)" }}>
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

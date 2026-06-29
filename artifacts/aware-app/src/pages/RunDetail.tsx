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
  Calendar,
  Clipboard,
  PackageSearch
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
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: 64,
        minHeight: "400px"
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "var(--proof-red-bg)", border: "1px solid var(--proof-red-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "var(--proof-glow-red)"
        }}>
          <AlertTriangle size={32} style={{ color: "var(--proof-red)" }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--proof-text)" }}>
          Failed to load data
        </h2>
        <p style={{ fontSize: 14, color: "var(--proof-text-secondary)", marginTop: 8, maxWidth: 400, textAlign: "center" }}>
          Could not fetch run details. This might be due to a temporary network issue or the data might have been archived.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="proof-btn proof-btn-primary"
          style={{ marginTop: 24, padding: "10px 24px" }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!run) {
    if (initState.loading) {
      return (
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="proof-card" style={{ height: 100, display: "flex", alignItems: "center", gap: 16 }}>
            <div className="proof-skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
            <div style={{ flex: 1 }}>
              <SkeletonText lines={2} lastLineWidth="40%" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[1,2,3,4].map(i => <div key={i} className="proof-skeleton" style={{ height: 80, borderRadius: 12 }} />)}
          </div>
          <SkeletonTable rows={10} cols={6} />
        </div>
      );
    }
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: 64,
        minHeight: "400px"
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "var(--proof-surface-2)", border: "1px solid var(--proof-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px"
        }}>
          <PackageSearch size={32} style={{ color: "var(--proof-text-muted)" }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--proof-text)" }}>
          Run not found
        </h2>
        <p style={{ fontSize: 14, color: "var(--proof-text-secondary)", marginTop: 8, maxWidth: 400, textAlign: "center" }}>
          The requested run ID could not be located in the system. It may have been deleted or the ID might be incorrect.
        </p>
        <button
          onClick={() => navigate("/runs")}
          className="proof-btn proof-btn-ghost"
          style={{ marginTop: 24, border: "1px solid var(--proof-border)" }}
        >
          <ArrowLeft size={16} /> Back to Runs
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%", minHeight: 0 }}>
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
          padding: "20px 28px",
          background: "var(--proof-glass)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--proof-border)",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          borderRadius: 0,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          flexShrink: 0,
        }}
      >
        <button 
          onClick={() => navigate("/runs")}
          className="proof-btn-ghost"
          aria-label="Back to runs"
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 10, padding: 0,
            border: '1px solid var(--proof-border)',
            background: 'var(--proof-surface-2)'
          }}
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: "var(--proof-text)" }}>
              {run.id.split("-")[0]}
            </span>
            <span className={`proof-badge ${run.env === "PROD" ? "proof-badge-critical" : run.env === "UAT" ? "proof-badge-degraded" : "proof-badge-healthy"}`}>
              {run.env} {run.network}
            </span>
            <span className="proof-badge" style={{ 
              color: getStatusColor(run.status), 
              borderColor: getStatusColor(run.status), 
              background: `color-mix(in srgb, ${getStatusColor(run.status)} 10%, transparent)`,
              boxShadow: run.status === "RUNNING" ? `0 0 8px ${getStatusColor(run.status)}` : "none"
            }}>
              {run.status}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--proof-text-secondary)" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> {run.duration}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} /> {new Date(run.started).toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Pass rate progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, width: 240 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Pass Rate</span>
              <span style={{ color: run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)" }}>
                {run.passPct}%
              </span>
            </div>
            <div className="proof-progress-track" style={{ height: 8, background: 'var(--proof-surface-3)' }}>
              <div 
                className="proof-progress-bar" 
                style={{ 
                  width: `${run.passPct}%`,
                  background: run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)",
                  boxShadow: `0 0 10px ${run.passPct >= 95 ? "var(--proof-green-glow)" : run.passPct >= 80 ? "var(--proof-yellow-glow)" : "var(--proof-red-glow)"}`
                }} 
              />
            </div>
          </div>
        </div>

        <button 
          className="proof-btn proof-btn-primary"
          onClick={() => navigate(`/compare?base=${run.id}`)}
          style={{ height: 44, padding: "0 20px" }}
        >
          <GitCompare size={16} /> Compare
        </button>
      </div>

      {/* Content area with proper padding */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24, padding: "24px 28px", overflow: "auto", minHeight: 0 }}>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {[
          { label: "Total Tests", value: counts.total, icon: TerminalSquare, color: "var(--proof-text)" },
          { label: "Passed", value: counts.passed, icon: CheckCircle2, color: "var(--proof-green)" },
          { label: "Failed", value: counts.failed, icon: XCircle, color: "var(--proof-red)" },
          { label: "Skipped", value: counts.skipped, icon: HelpCircle, color: "var(--proof-text-muted)" }
        ].map(stat => (
          <div key={stat.label} className="proof-card" style={{ 
            padding: "20px", 
            display: "flex", 
            alignItems: "center", 
            gap: 20,
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = 'var(--proof-shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--proof-shadow-sm)';
          }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: 12, 
              background: `color-mix(in srgb, ${stat.color} 15%, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: stat.color,
              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${stat.color} 20%, transparent)`
            }}>
              <stat.icon size={24} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--proof-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--proof-text)", lineHeight: 1 }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content table */}
      <div className="proof-card" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: 0, overflow: 'hidden' }}>
        {/* Filters */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--proof-border)", display: "flex", alignItems: "center", gap: 16, background: 'var(--proof-surface-2)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filters:
          </div>
          <div style={{ position: "relative", width: 280 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--proof-text-muted)" }} />
            <input 
              className="proof-input" 
              placeholder="Search tests..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, height: 40 }}
            />
          </div>
          
          <select className="proof-input" style={{ width: 140, height: 40 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="PASS">Passed</option>
            <option value="FAIL">Failed</option>
            <option value="SKIPPED">Skipped</option>
            <option value="FLAKY">Flaky</option>
          </select>

          <select className="proof-input" style={{ width: 180, height: 40 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {[...new Set(results.map((r) => r.category).filter(Boolean))].sort().map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(search || statusFilter !== "all" || catFilter !== "all") && (
            <button onClick={() => { setSearch(""); setStatusFilter("all"); setCatFilter("all"); }} className="proof-btn proof-btn-ghost" style={{ height: 40 }}>
              Clear
            </button>
          )}
          
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 13, color: "var(--proof-text-secondary)", fontWeight: 500 }}>
            Showing <span style={{ color: 'var(--proof-text)', fontWeight: 700 }}>{filtered.length}</span> tests
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <table className="proof-table" style={{ width: "100%", minWidth: 800, borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--proof-surface-3)", zIndex: 5, boxShadow: '0 1px 0 var(--proof-border)' }}>
              <tr>
                <th style={{ width: 48, padding: "14px 20px" }}></th>
                <th 
                  onClick={() => toggleSort("name")}
                  onKeyDown={(e) => handleKeyDownSort(e, "name")}
                  tabIndex={0}
                  style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "var(--proof-text-muted)", cursor: "pointer", textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Test Name {sortKey === "name" && (sortDir === "asc" ? "↑" : "↓")}
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort("status")}
                  onKeyDown={(e) => handleKeyDownSort(e, "status")}
                  tabIndex={0}
                  style={{ width: 140, textAlign: "left", padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "var(--proof-text-muted)", cursor: "pointer", textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Status {sortKey === "status" && (sortDir === "asc" ? "↑" : "↓")}
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort("category")}
                  onKeyDown={(e) => handleKeyDownSort(e, "category")}
                  tabIndex={0}
                  style={{ width: 160, textAlign: "left", padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "var(--proof-text-muted)", cursor: "pointer", textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Category {sortKey === "category" && (sortDir === "asc" ? "↑" : "↓")}
                  </div>
                </th>
                <th style={{ width: 180, textAlign: "left", padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: 'uppercase', letterSpacing: '0.05em' }}>History</th>
                <th 
                  onClick={() => toggleSort("duration")}
                  onKeyDown={(e) => handleKeyDownSort(e, "duration")}
                  tabIndex={0}
                  style={{ width: 120, textAlign: "right", padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "var(--proof-text-muted)", cursor: "pointer", textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    Duration {sortKey === "duration" && (sortDir === "asc" ? "↑" : "↓")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((r) => {
                const isExpanded = expandedRows.has(r.id);
                const statusColor = getStatusColor(r.status);
                return (
                  <React.Fragment key={r.id}>
                    <tr 
                      id={`row-${r.id}`}
                      onClick={() => toggleRow(r.id)}
                      style={{ 
                        cursor: "pointer", 
                        borderBottom: "1px solid var(--proof-border-light)",
                        background: isExpanded ? "var(--proof-surface-2)" : "transparent",
                        transition: "all var(--proof-transition)",
                        borderLeft: `2px solid ${isExpanded ? 'var(--proof-blue)' : 'transparent'}`
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.background = "var(--proof-hover)";
                          e.currentTarget.style.borderLeft = "2px solid var(--proof-blue)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderLeft = "2px solid transparent";
                        }
                      }}
                    >
                      <td style={{ padding: "14px 20px", color: "var(--proof-text-muted)" }}>
                        <div style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                          <ChevronRight size={18} />
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500, color: 'var(--proof-text)' }}>
                        {r.name}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span className="proof-badge" style={{ 
                          color: statusColor, 
                          borderColor: statusColor,
                          background: `color-mix(in srgb, ${statusColor} 8%, transparent)`,
                          fontSize: 11
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "var(--proof-text-secondary)" }}>
                        {r.category}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div onClick={e => e.stopPropagation()}>
                          <TestHistoryStrip testName={r.name} currentRunId={run.id} />
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--proof-text-secondary)" }}>
                        {r.duration}ms
                      </td>
                    </tr>
                    
                    {/* Expanded details */}
                    {isExpanded && (
                      <tr style={{ background: "var(--proof-surface-2)" }}>
                        <td colSpan={6} style={{ padding: "0 20px 20px 68px" }}>
                          <div className="proof-card" style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            gap: 24, 
                            padding: 24,
                            background: 'var(--proof-surface)',
                            border: '1px solid var(--proof-border)',
                            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)'
                          }}>
                            
                            {/* Error Details */}
                            {r.error && (
                              <div style={{ background: "var(--proof-red-bg)", border: "1px solid var(--proof-red-border)", borderRadius: 8, padding: 16, position: 'relative' }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: 'space-between', marginBottom: 12 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--proof-red)", fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    <AlertTriangle size={14} /> Error Details
                                  </div>
                                  <button 
                                    className="proof-btn-ghost proof-btn-xs" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(r.error || "");
                                    }}
                                    style={{ color: 'var(--proof-red)', border: '1px solid var(--proof-red-border)' }}
                                  >
                                    <Clipboard size={12} /> Copy
                                  </button>
                                </div>
                                <pre style={{ 
                                  fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--proof-red-bright)", 
                                  whiteSpace: "pre-wrap", margin: 0,
                                  lineHeight: 1.5
                                }}>
                                  {r.error}
                                </pre>
                              </div>
                            )}

                            {/* Assertions */}
                            {r.assertions && r.assertions.length > 0 && (
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-muted)", marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                  <CheckCircle2 size={14} /> Assertions
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                  {r.assertions.map((a, i) => (
                                    <AssertionRow key={a.assertion || i} a={a} />
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Actions */}
                            <div style={{ display: "flex", gap: 12, borderTop: '1px solid var(--proof-border)', paddingTop: 20 }}>
                              <button onClick={() => navigate(`/trends?testId=${r.id}`)} className="proof-btn proof-btn-ghost" style={{ border: '1px solid var(--proof-border)' }}>
                                View Analytics
                              </button>
                              <button onClick={() => navigate(`/tests?q=${r.id}`)} className="proof-btn proof-btn-ghost" style={{ border: '1px solid var(--proof-border)' }}>
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
                  <td colSpan={6} style={{ padding: 80, textAlign: "center" }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                      <PackageSearch size={48} style={{ color: 'var(--proof-text-muted)', opacity: 0.5 }} />
                      <div style={{ color: "var(--proof-text-secondary)", fontSize: 16, fontWeight: 500 }}>
                        No results found matching your filters.
                      </div>
                      <button 
                        onClick={() => { setSearch(""); setStatusFilter("all"); setCatFilter("all"); }} 
                        className="proof-btn proof-btn-ghost"
                        style={{ border: '1px solid var(--proof-border)' }}
                      >
                        Reset All Filters
                      </button>
                    </div>
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

      </div> {/* end content area */}
    </div>
  );
}

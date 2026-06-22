import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { Pagination, StatusBadge, PageTemplate } from "@/components/aware";
import { getRuns, subscribeToRuns } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { useSyncedUrlState } from "@/lib/urlState";
import { formatRelativeTime, formatDurationMs } from "@/lib/i18n";
import type { Run } from "@/lib/types";
import {
  Play, GitCompare, Loader2, ExternalLink, Search, X, Activity,
  ChevronRight, Minus,
} from "lucide-react";
import { repo } from "@/lib/nav";

function formatDuration(ms: number | string): string {
  if (typeof ms === "string") {
    if (ms.includes("m") || ms.includes("s")) return ms;
    const parsed = parseInt(ms, 10);
    if (isNaN(parsed)) return ms;
    ms = parsed;
  }
  return formatDurationMs(ms);
}

function timeAgo(iso: string): string {
  return formatRelativeTime(iso);
}

const TierBadge = React.memo(function TierBadge({ envId }: { envId: string }) {
  const tier = envId.split("_")[0]?.toUpperCase() ?? envId.toUpperCase();
  const cfg: Record<string, { color: string; bg: string }> = {
    QA: { color: "var(--proof-blue)", bg: "var(--proof-blue-bg)" },
    UAT: { color: "var(--proof-purple)", bg: "var(--proof-purple-bg)" },
    PROD: { color: "var(--proof-green)", bg: "var(--proof-green-bg)" },
  };
  const c = cfg[tier] ?? { color: "var(--proof-text-muted)", bg: "var(--proof-subtle-bg)" };
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
      color: c.color, background: c.bg, padding: "2px 6px", borderRadius: "4px",
    }}>
      {tier}
    </span>
  );
});

const PassBar = React.memo(function PassBar({ pct }: { pct: number }) {
  const c = pct >= 95 ? "var(--proof-green)" : pct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
  return (
    <div 
      style={{ display: "flex", alignItems: "center", gap: 8 }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${pct}% passing`}
    >
      <div className="proof-progress-track" style={{ width: 48, height: 4 }}>
        <div className="proof-progress-bar" style={{ width: `${pct}%`, background: c }} />
      </div>
      <span className="proof-mono" style={{ fontSize: "12px", fontWeight: 700, color: c, minWidth: "36px", textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
});

const FilterChip = React.memo(function FilterChip({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      style={{
        display: "inline-flex", alignItems: "center", padding: "4px 12px",
        borderRadius: "var(--proof-radius-full)", cursor: "pointer",
        border: `1px solid ${active ? "var(--proof-blue-border)" : "var(--proof-border)"}`,
        background: active ? "var(--proof-blue-bg)" : "transparent",
        color: active ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
        fontSize: "12px", fontWeight: active ? 600 : 500,
        transition: "all var(--proof-transition)", whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
});

export default function Runs() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useSyncedUrlState("q", "");
  const [statusFilter, setStatusFilter] = useSyncedUrlState("status", "all");
  const [suiteFilter, setSuiteFilter] = useSyncedUrlState("suite", "all");
  const [envFilter, setEnvFilter] = useSyncedUrlState("env", "all");

  const allRuns = useSyncExternalStore(subscribeToRuns, getRuns);
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  
  const envFilteredRuns = React.useMemo(() => {
    return envSnap.envIds.length > 0
      ? allRuns.filter((r) => envSnap.envIds.includes(r.envId))
      : allRuns;
  }, [allRuns, envSnap.envIds]);

  const filtered = React.useMemo(() => {
    return envFilteredRuns.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (suiteFilter !== "all" && r.suiteId !== suiteFilter) return false;
      if (envFilter !== "all") {
        const rEnv = (r.env || "").toUpperCase();
        const fEnv = envFilter.toUpperCase();
        if (!rEnv.startsWith(fEnv)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!r.id.toLowerCase().includes(q) && !(r.env || "").toLowerCase().includes(q) && !(r.suiteId || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [envFilteredRuns, statusFilter, suiteFilter, envFilter, search]);

  type SortableRunKey = "started" | "passPct" | "failures" | "durationMs" | "env" | "id" | "status";
  const [sortKey, setSortKey] = React.useState<SortableRunKey>("started");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA: string | number = a[sortKey] ?? "";
      let valB: string | number = b[sortKey] ?? "";

      if (sortKey === "started") {
        valA = new Date((valA as string) || 0).getTime();
        valB = new Date((valB as string) || 0).getTime();
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 30;

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, suiteFilter, envFilter, sortKey]);

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortableRunKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleExportCSV = () => {
    const escape = (v: unknown): string => {
      let s = String(v ?? "");
      if (/^[=+\-@\t\r\n|]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const headers = ["ID", "Env", "Status", "Pass Rate", "Duration", "Started"];
    const rows = filtered.map(r => [
      r.id,
      r.env,
      r.status,
      `${r.passPct}%`,
      r.durationMs ? formatDuration(r.durationMs) : "",
      r.started
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(escape).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `runs_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterKey = `${search}|${statusFilter}|${suiteFilter}|${envFilter}`;
  const prevFilterKey = React.useRef(filterKey);
  React.useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      if (page !== 1) setPage(1);
    }
  }, [filterKey, page]);

  const runningCount = envFilteredRuns.filter((r) => r.status === "RUNNING").length;
  const passedCount = filtered.filter((r) => r.status === "PASS").length;
  const failedCount = filtered.filter((r) => ["FAIL", "ERROR"].includes(r.status)).length;
  const partialCount = filtered.filter((r) => r.status === "PARTIAL").length;

  const hasFilters = search || statusFilter !== "all" || suiteFilter !== "all" || envFilter !== "all";
  const resetFilters = () => {
    setSearch(""); setStatusFilter("all"); setSuiteFilter("all"); setEnvFilter("all"); setPage(1);
  };

  return (
    <PageTemplate
      title="Run History"
      subtitle={`${envFilteredRuns.length} runs · Playwright + pytest across all environments`}
      headerActions={(
        <>
          {runningCount > 0 && (
            <span className="proof-badge" style={{
              color: "var(--proof-blue-bright)", background: "var(--proof-blue-bg)", borderColor: "var(--proof-blue-border)",
            }}>
              <Loader2 size={12} className="animate-spin" /> {runningCount} running
            </span>
          )}
          <button
            onClick={() => window.open(`${repo}/actions/workflows/run-tests.yml`, "_blank")}
            className="proof-btn proof-btn-primary"
          >
            <Play size={14} /> Start Run <ExternalLink size={12} style={{ opacity: 0.7 }} />
          </button>
        </>
      )}
      filters={(
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", width: "100%" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 240px", minWidth: "180px" }}>
            <label htmlFor="run-search" className="sr-only">Search runs</label>
            <Search size={14} style={{
              position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
              color: "var(--proof-text-muted)", pointerEvents: "none",
            }} />
            <input
              id="run-search"
              name="q"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search runs by ID, env, or suite…"
              className="proof-input"
              style={{ paddingLeft: "36px" }}
              maxLength={200}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "var(--proof-text-muted)", padding: "4px", display: "flex",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ width: "1px", height: "24px", background: "var(--proof-border)", flexShrink: 0 }} />

          {/* Status chips */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["all", "PASS", "FAIL", "PARTIAL", "FLAKY"].map((s) => (
              <FilterChip key={s} label={s === "all" ? "All" : s} active={statusFilter === s} onSelect={() => setStatusFilter(s)} />
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="proof-btn proof-btn-ghost"
              style={{ padding: "4px 8px", fontSize: "12px" }}
            >
              <X size={12} /> Clear Filters
            </button>
          )}
        </div>
      )}
      currentPage={page}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
      isEmpty={paginated.length === 0}
      emptyMessage="No runs match your filters"
      emptyAction={hasFilters ? (
        <button onClick={resetFilters} className="proof-btn proof-btn-ghost">
          Clear filters
        </button>
      ) : null}
    >
      {/* Stats row */}
      <div style={{
        display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px",
        fontSize: "13px", color: "var(--proof-text-secondary)",
      }}>
        <span>Showing <strong style={{ color: "var(--proof-text)" }}>{totalItems}</strong> of {envFilteredRuns.length} runs</span>
        <span style={{ color: "var(--proof-border-strong)" }}>·</span>
        <span style={{ color: "var(--proof-green)" }}>{passedCount} passed</span>
        <span style={{ color: "var(--proof-red)" }}>{failedCount} failed</span>
        {partialCount > 0 && <span style={{ color: "var(--proof-yellow)" }}>{partialCount} partial</span>}
        
        <div style={{ flex: 1 }} />
        
        <button
          onClick={handleExportCSV}
          className="proof-btn proof-btn-ghost"
          aria-label="Export filtered runs as CSV"
        >
          Export CSV
        </button>
        <button
          onClick={() => navigate("/compare")}
          className="proof-btn proof-btn-ghost"
        >
          <GitCompare size={14} /> Compare Runs
        </button>
      </div>

      {/* Table */}
      <div className="proof-card" style={{ overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2.5fr 110px 100px 110px 100px 100px 40px",
          padding: "12px 20px",
          background: "var(--proof-surface-2)",
          borderBottom: "1px solid var(--proof-border)",
          fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.5px", color: "var(--proof-text-muted)",
        }}>
          <span 
            onClick={() => toggleSort("id")} 
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            aria-sort={sortKey === "id" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && toggleSort("id")}
          >
            Run {sortKey === "id" && (sortDir === "asc" ? "↑" : "↓")}
          </span>
          <span 
            onClick={() => toggleSort("env")} 
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            aria-sort={sortKey === "env" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && toggleSort("env")}
          >
            Env {sortKey === "env" && (sortDir === "asc" ? "↑" : "↓")}
          </span>
          <span 
            onClick={() => toggleSort("status")} 
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            aria-sort={sortKey === "status" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && toggleSort("status")}
          >
            Status {sortKey === "status" && (sortDir === "asc" ? "↑" : "↓")}
          </span>
          <span 
            onClick={() => toggleSort("passPct")} 
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            aria-sort={sortKey === "passPct" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && toggleSort("passPct")}
          >
            Pass Rate {sortKey === "passPct" && (sortDir === "asc" ? "↑" : "↓")}
          </span>
          <span 
            onClick={() => toggleSort("durationMs")} 
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            aria-sort={sortKey === "durationMs" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && toggleSort("durationMs")}
          >
            Duration {sortKey === "durationMs" && (sortDir === "asc" ? "↑" : "↓")}
          </span>
          <span 
            onClick={() => toggleSort("started")} 
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            aria-sort={sortKey === "started" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && toggleSort("started")}
          >
            When {sortKey === "started" && (sortDir === "asc" ? "↑" : "↓")}
          </span>
          <span />
        </div>

        {/* Table rows */}
        {paginated.map((run) => (
          <RunRow key={run.id} run={run} onNavigate={(id) => navigate(`/runs/${id}`)} />
        ))}
      </div>
    </PageTemplate>
  );
}

function RunRow({ run, onNavigate }: { run: Run; onNavigate: (id: string) => void }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={() => onNavigate(run.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "2.5fr 110px 100px 110px 100px 100px 40px",
        padding: "14px 20px",
        borderBottom: "1px solid var(--proof-border-light)",
        cursor: "pointer",
        background: hovered ? "var(--proof-surface-hover)" : "transparent",
        transition: "background var(--proof-transition)",
        alignItems: "center",
      }}
    >
      {/* Run ID + suite */}
      <div style={{ minWidth: 0 }}>
        <div className="proof-mono" style={{
          fontSize: "13px", fontWeight: 600, color: "var(--proof-text)",
          marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {run.id}
        </div>
        {run.suiteId && (
          <div style={{
            fontSize: "12px", color: "var(--proof-text-secondary)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {run.suiteId}
          </div>
        )}
      </div>

      {/* Env */}
      <div>
        <TierBadge envId={run.envId ?? run.env ?? ""} />
      </div>

      {/* Status */}
      <div>
        <StatusBadge status={run.status} />
      </div>

      {/* Pass rate */}
      <div>
        <PassBar pct={run.passPct} />
      </div>

      {/* Duration */}
      <div className="proof-mono" style={{ fontSize: "13px", color: "var(--proof-text-secondary)" }}>
        {run.durationMs ? formatDuration(run.durationMs) : <Minus size={12} style={{ opacity: 0.3 }} />}
      </div>

      {/* Time */}
      <div style={{ fontSize: "12px", color: "var(--proof-text-secondary)" }}>
        {run.started ? timeAgo(run.started) : "—"}
      </div>

      {/* Arrow */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChevronRight size={16} style={{
          color: hovered ? "var(--proof-text)" : "var(--proof-text-muted)",
          transform: hovered ? "translateX(2px)" : "translateX(0)",
          transition: "all var(--proof-transition)",
        }} />
      </div>
    </div>
  );
}

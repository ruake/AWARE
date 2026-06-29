import React, { useSyncExternalStore, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { StatusBadge, PageTemplate } from "@/components/aware";
import { getRuns, subscribeToRuns } from "@/lib/data";
import { useDataInit } from "@/lib/hooks/useData";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { useSyncedUrlState } from "@/lib/urlState";
import { formatRelativeTime, formatDurationMs } from "@/lib/i18n";
import type { Run } from "@/lib/types";
import {
  Play, GitCompare, Loader2, ExternalLink, Search, X,
  ChevronRight, Minus, ChevronUp, ChevronDown, Download, CheckCircle2, AlertCircle, HelpCircle
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
  const cfg: Record<string, { color: string; bg: string; border: string; glow: string }> = {
    QA: { color: "var(--proof-yellow)", bg: "var(--proof-yellow-bg)", border: "var(--proof-yellow-border)", glow: "var(--proof-glow-amber)" },
    UAT: { color: "var(--proof-blue)", bg: "var(--proof-blue-bg)", border: "var(--proof-blue-border)", glow: "var(--proof-glow-cyan)" },
    PROD: { color: "var(--proof-green)", bg: "var(--proof-green-bg)", border: "var(--proof-green-border)", glow: "var(--proof-glow-green)" },
  };
  const c = cfg[tier] ?? { color: "var(--proof-text-muted)", bg: "var(--proof-subtle-bg)", border: "var(--proof-border)", glow: "none" };
  return (
    <span style={{
      fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
      color: c.color, background: c.bg, border: `1px solid ${c.border}`, padding: "4px 8px", borderRadius: "6px",
      boxShadow: c.glow
    }}>
      {tier}
    </span>
  );
});

const PassBar = React.memo(function PassBar({ pct }: { pct: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 50);
    return () => clearTimeout(timer);
  }, [pct]);

  const c = pct >= 95 ? "var(--proof-green)" : pct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
  
  return (
    <div 
      style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--proof-surface)", padding: "4px 8px", borderRadius: 6, border: "1px solid var(--proof-border-light)" }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${pct}% passing`}
    >
      <div className="proof-progress-track" style={{ width: 48, height: 6, background: "var(--proof-surface-2)" }}>
        <div className="proof-progress-bar" style={{ width: `${width}%`, background: c, boxShadow: `0 0 8px ${c}`, transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
      </div>
      <span className="proof-mono" style={{ fontSize: "12px", fontWeight: 700, color: c, minWidth: "36px", textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
});

const FilterChip = React.memo(function FilterChip({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  const getGlow = () => {
    if (!active) return "none";
    if (label === "PASS") return "var(--proof-glow-green)";
    if (label === "FAIL") return "var(--proof-glow-red)";
    if (label === "PARTIAL") return "var(--proof-glow-amber)";
    return "var(--proof-glow-cyan)";
  };

  const getColor = () => {
    if (!active) return "var(--proof-text-secondary)";
    if (label === "PASS") return "var(--proof-green)";
    if (label === "FAIL") return "var(--proof-red)";
    if (label === "PARTIAL") return "var(--proof-yellow)";
    return "var(--proof-blue-bright)";
  };

  const getBorderColor = () => {
    if (!active) return "var(--proof-border)";
    if (label === "PASS") return "var(--proof-green-border)";
    if (label === "FAIL") return "var(--proof-red-border)";
    if (label === "PARTIAL") return "var(--proof-yellow-border)";
    return "var(--proof-blue-border)";
  };

  const getBg = () => {
    if (!active) return "var(--proof-surface-2)";
    if (label === "PASS") return "var(--proof-green-bg)";
    if (label === "FAIL") return "var(--proof-red-bg)";
    if (label === "PARTIAL") return "var(--proof-yellow-bg)";
    return "var(--proof-blue-bg)";
  };

  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      style={{
        display: "inline-flex", alignItems: "center", padding: "8px 16px",
        borderRadius: "var(--proof-radius-full)", cursor: "pointer",
        border: `1px solid ${getBorderColor()}`,
        background: getBg(),
        color: getColor(),
        fontSize: "13px", fontWeight: active ? 700 : 600,
        boxShadow: getGlow(),
        transition: "all var(--proof-transition)", whiteSpace: "nowrap",
        gap: "6px"
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--proof-surface-hover)";
          e.currentTarget.style.color = "var(--proof-text)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--proof-surface-2)";
          e.currentTarget.style.color = "var(--proof-text-secondary)";
        }
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: getColor() }} />
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

  const dataState = useDataInit();
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

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  const runningCount = envFilteredRuns.filter((r) => r.status === "RUNNING").length;
  const passedCount = filtered.filter((r) => r.status === "PASS").length;
  const failedCount = filtered.filter((r) => ["FAIL", "ERROR"].includes(r.status)).length;
  const partialCount = filtered.filter((r) => r.status === "PARTIAL").length;

  const hasFilters = search || statusFilter !== "all" || suiteFilter !== "all" || envFilter !== "all";
  const resetFilters = () => {
    setSearch(""); setStatusFilter("all"); setSuiteFilter("all"); setEnvFilter("all"); setPage(1);
  };

  const sortIcon = (key: SortableRunKey) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? <ChevronUp size={14} style={{ color: "var(--proof-blue)" }} /> : <ChevronDown size={14} style={{ color: "var(--proof-blue)" }} />;
  };

  return (
    <PageTemplate
      title="Run History"
      subtitle={`${envFilteredRuns.length} runs · Playwright + pytest across all environments`}
      loading={dataState.loading}
      error={dataState.error as Error | null}
      headerActions={(
        <>
          {runningCount > 0 && (
            <span className="proof-badge" style={{
              color: "var(--proof-blue-bright)", background: "var(--proof-blue-bg)", borderColor: "var(--proof-blue-border)",
              boxShadow: "var(--proof-glow-cyan)", padding: "8px 16px", fontSize: 13, fontWeight: 700
            }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite", marginRight: 8 }} /> {runningCount} RUNNING
            </span>
          )}
          <button
            onClick={() => window.open(`${repo}/actions/workflows/run-tests.yml`, "_blank")}
            className="proof-btn proof-btn-primary"
            style={{ padding: "8px 20px", fontSize: 13, fontWeight: 700, borderRadius: 8 }}
          >
            <Play size={16} /> Start Run <ExternalLink size={14} style={{ opacity: 0.7 }} />
          </button>
        </>
      )}
      filters={(
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", width: "100%", paddingBottom: 16 }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 300px", minWidth: "240px" }}>
            <label htmlFor="run-search" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>Search runs</label>
            <Search size={16} style={{
              position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
              color: search ? "var(--proof-blue)" : "var(--proof-text-muted)", pointerEvents: "none",
              transition: "color 0.2s"
            }} />
            <input
              id="run-search"
              name="q"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search runs by ID, env, or suite… (press "/" to search)'
              className="proof-input"
              style={{ paddingLeft: "42px", paddingRight: "36px", height: 44, borderRadius: 8, fontSize: 14, background: "var(--proof-surface-2)", border: "1px solid var(--proof-border)", boxShadow: search ? "0 0 0 3px rgba(0,196,255,0.15)" : "none", transition: "all 0.2s" }}
              maxLength={200}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,196,255,0.15)";
                e.currentTarget.style.borderColor = "var(--proof-blue)";
              }}
              onBlur={(e) => {
                if (!search) {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--proof-border)";
                }
              }}
            />
              {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "var(--proof-surface-hover)", border: "none", cursor: "pointer",
                  color: "var(--proof-text-muted)", padding: "4px", display: "flex", borderRadius: "50%"
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ width: "1px", height: "32px", background: "var(--proof-border)", flexShrink: 0 }} />

          {/* Status chips */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {["all", "PASS", "FAIL", "PARTIAL", "FLAKY"].map((s) => (
              <FilterChip key={s} label={s === "all" ? "All" : s} active={statusFilter === s} onSelect={() => setStatusFilter(s)} />
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="proof-btn proof-btn-ghost"
              style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 600 }}
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      )}
      currentPage={safePage}
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
      emptyIcon={Search}
    >
      {/* Stats row */}
      <div style={{
        display: "flex", alignItems: "center", gap: "24px", marginBottom: "28px",
        fontSize: "14px", color: "var(--proof-text-secondary)", fontWeight: 500,
        background: "var(--proof-surface-2)", padding: "16px 24px", borderRadius: 12, border: "1px solid var(--proof-border)",
        boxShadow: "var(--proof-shadow-sm)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", opacity: 0.7 }}>METRICS</span>
          <div style={{ width: "1px", height: "16px", background: "var(--proof-border-strong)", margin: "0 4px" }} />
          <span>Showing <strong style={{ color: "var(--proof-text)" }}>{totalItems}</strong> of {envFilteredRuns.length}</span>
        </div>

        <div style={{ width: "1px", height: "24px", background: "var(--proof-border-strong)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "var(--proof-green)", display: "flex", alignItems: "center", gap: 8, background: "var(--proof-green-bg)", padding: "4px 12px", borderRadius: "20px", border: "1px solid var(--proof-green-border)" }}>
            <CheckCircle2 size={14} />
            <strong style={{ fontWeight: 700 }}>{passedCount}</strong> PASSED
          </span>
          <span style={{ color: "var(--proof-red)", display: "flex", alignItems: "center", gap: 8, background: "var(--proof-red-bg)", padding: "4px 12px", borderRadius: "20px", border: "1px solid var(--proof-red-border)" }}>
            <AlertCircle size={14} />
            <strong style={{ fontWeight: 700 }}>{failedCount}</strong> FAILED
          </span>
          {partialCount > 0 && (
            <span style={{ color: "var(--proof-yellow)", display: "flex", alignItems: "center", gap: 8, background: "var(--proof-yellow-bg)", padding: "4px 12px", borderRadius: "20px", border: "1px solid var(--proof-yellow-border)" }}>
              <HelpCircle size={14} />
              <strong style={{ fontWeight: 700 }}>{partialCount}</strong> PARTIAL
            </span>
          )}
        </div>
        
        <div style={{ flex: 1 }} />
        
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleExportCSV}
            className="proof-btn proof-btn-ghost"
            aria-label="Export filtered runs as CSV"
            style={{ fontSize: 13, fontWeight: 700, gap: 8, border: "1px solid var(--proof-border)" }}
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={() => navigate("/compare")}
            className="proof-btn proof-btn-ghost"
            style={{ fontSize: 13, fontWeight: 700, border: "1px solid var(--proof-border)", background: "var(--proof-surface-3)" }}
          >
            <GitCompare size={16} /> Compare Runs
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <div className="glass-panel" style={{ minWidth: 800, borderRadius: 12, border: "1px solid var(--proof-border)", overflow: "hidden", boxShadow: "var(--proof-shadow-md)" }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2.5fr 120px 140px 140px 120px 140px 40px",
          padding: "16px 24px",
          background: "linear-gradient(to bottom, var(--proof-surface-3), var(--proof-surface-2))",
          borderBottom: "1px solid var(--proof-border-strong)",
          fontSize: "12px", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.1em", color: "var(--proof-text-muted)",
        }}>
          {[
            { key: "id", label: "Run" },
            { key: "env", label: "Env" },
            { key: "status", label: "Status" },
            { key: "passPct", label: "Pass Rate" },
            { key: "durationMs", label: "Duration" },
            { key: "started", label: "When" }
          ].map((col) => (
            <span 
              key={col.key}
              onClick={() => toggleSort(col.key as SortableRunKey)} 
              style={{ 
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6, borderRadius: "6px", padding: "4px 8px", margin: "-4px -8px",
                color: sortKey === col.key ? "var(--proof-blue)" : "inherit",
                transition: "all 0.2s"
              }}
              aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && toggleSort(col.key as SortableRunKey)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-surface-hover)"; e.currentTarget.style.color = "var(--proof-text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = sortKey === col.key ? "var(--proof-blue)" : "var(--proof-text-muted)"; }}
            >
              {col.label} {sortIcon(col.key as SortableRunKey)}
            </span>
          ))}
          <span />
        </div>

        {/* Table rows */}
        {paginated.map((run, index) => (
          <RunRow key={run.id} run={run} index={index} onNavigate={(id) => navigate(`/runs/${id}`)} />
        ))}
      </div>
      </div>
    </PageTemplate>
  );
}

function RunRow({ run, index, onNavigate }: { run: Run; index: number; onNavigate: (id: string) => void }) {
  const [hovered, setHovered] = React.useState(false);
  const tier = run.env?.split("_")[0]?.toUpperCase() ?? "UNKNOWN";
  const leftBorderColor = tier === "QA" ? "var(--proof-yellow)" : tier === "UAT" ? "var(--proof-blue)" : tier === "PROD" ? "var(--proof-green)" : "var(--proof-border)";
  const leftBorderGlow = hovered ? (tier === "QA" ? "var(--proof-glow-amber)" : tier === "UAT" ? "var(--proof-glow-cyan)" : tier === "PROD" ? "var(--proof-glow-green)" : "none") : "none";

  return (
    <div
      onClick={() => onNavigate(run.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`View run ${run.id}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(run.id); } }}
      style={{
        display: "grid",
        gridTemplateColumns: "2.5fr 120px 140px 140px 120px 140px 40px",
        padding: "16px 24px",
        borderBottom: "1px solid var(--proof-border-light)",
        cursor: "pointer",
        background: hovered ? "var(--proof-surface-hover)" : "transparent",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        alignItems: "center",
        borderLeft: `3px solid ${leftBorderColor}`,
        boxShadow: leftBorderGlow,
        transform: hovered ? "scale(1.002)" : "scale(1)",
        animation: `proof-slide-up 0.4s ease-out forwards`,
        animationDelay: `${Math.min(index * 30, 600)}ms`,
        opacity: 0, // for animation
        position: "relative",
        zIndex: hovered ? 1 : 0
      }}
    >
      {/* Run ID + suite */}
      <div style={{ minWidth: 0, paddingLeft: 12 }}>
        <div className="proof-mono" style={{
          fontSize: "15px", fontWeight: 700, color: "var(--proof-text)",
          marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          letterSpacing: "-0.02em"
        }}>
          {run.id}
        </div>
        {run.suiteId && (
          <div style={{
            fontSize: "11px", color: "var(--proof-text-secondary)", fontWeight: 700,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            display: "inline-flex", background: "var(--proof-surface-3)", padding: "2px 8px", borderRadius: "10px", border: "1px solid var(--proof-border-light)",
            textTransform: "uppercase", letterSpacing: "0.05em"
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
      <div className="proof-mono" style={{ fontSize: "14px", fontWeight: 600, color: "var(--proof-text-secondary)" }}>
        {run.durationMs ? formatDuration(run.durationMs) : <Minus size={14} style={{ opacity: 0.3 }} />}
      </div>

      {/* Time */}
      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--proof-text-secondary)" }}>
        {run.started ? timeAgo(run.started) : "—"}
      </div>

      {/* Arrow */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChevronRight size={20} style={{
          color: hovered ? "var(--proof-blue)" : "var(--proof-text-muted)",
          transform: hovered ? "translateX(4px)" : "translateX(0)",
          transition: "all var(--proof-transition)",
        }} />
      </div>
    </div>
  );
}

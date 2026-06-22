import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { Pagination } from "@/components/aware";
import { getRuns, subscribeToRuns, getEnvConfigs } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { useSyncedUrlState } from "@/lib/urlState";
import type { Run } from "@/lib/types";
import {
  Play, GitCompare, Loader2, ExternalLink, Search, X, Activity,
  ChevronRight, CheckCircle2, XCircle, AlertTriangle, Clock, Minus,
} from "lucide-react";
import { repo } from "@/lib/nav";

function formatDuration(ms: number | string): string {
  if (typeof ms === "string") {
    if (ms.includes("m") || ms.includes("s")) return ms;
    const parsed = parseInt(ms, 10);
    if (isNaN(parsed)) return ms;
    ms = parsed;
  }
  const s = Math.floor((ms / 1000) % 60);
  const m = Math.floor((ms / 60000) % 60);
  const h = Math.floor(ms / 3600000);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const STATUS_CFG: Record<Run["status"], { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  PASS: { label: "Pass", icon: <CheckCircle2 size={12} />, color: "var(--proof-green)", bg: "var(--proof-green-bg)", border: "var(--proof-green-border)" },
  FAIL: { label: "Fail", icon: <XCircle size={12} />, color: "var(--proof-red)", bg: "var(--proof-red-bg)", border: "var(--proof-red-border)" },
  PARTIAL: { label: "Partial", icon: <AlertTriangle size={12} />, color: "var(--proof-yellow)", bg: "var(--proof-yellow-bg)", border: "var(--proof-yellow-border)" },
  FLAKY: { label: "Flaky", icon: <AlertTriangle size={12} />, color: "var(--proof-orange)", bg: "var(--proof-orange-bg)", border: "var(--proof-orange-border)" },
  RUNNING: { label: "Running", icon: <Loader2 size={12} className="animate-spin" />, color: "var(--proof-blue-bright)", bg: "var(--proof-blue-bg)", border: "var(--proof-blue-border)" },
  PENDING: { label: "Pending", icon: <Clock size={12} />, color: "var(--proof-text-secondary)", bg: "var(--proof-subtle-bg)", border: "var(--proof-border)" },
  ERROR: { label: "Error", icon: <XCircle size={12} />, color: "var(--proof-red)", bg: "var(--proof-red-bg)", border: "var(--proof-red-border)" },
};

function StatusBadge({ status }: { status: Run["status"] }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.PENDING;
  return (
    <div className="proof-badge" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
      {cfg.icon} <span>{cfg.label}</span>
    </div>
  );
}

function TierBadge({ envId }: { envId: string }) {
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
}

function PassBar({ pct }: { pct: number }) {
  const c = pct >= 95 ? "var(--proof-green)" : pct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="proof-progress-track" style={{ width: 48, height: 4 }}>
        <div className="proof-progress-bar" style={{ width: `${pct}%`, background: c }} />
      </div>
      <span className="proof-mono" style={{ fontSize: "12px", fontWeight: 700, color: c, minWidth: "36px", textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

function FilterChip({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
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
}

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
      if (envFilter !== "all" && !r.env?.toUpperCase().startsWith(envFilter.toUpperCase())) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.id.toLowerCase().includes(q) && !r.env?.toLowerCase().includes(q) && !r.suiteId?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [envFilteredRuns, statusFilter, suiteFilter, envFilter, search]);

  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 30;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filterKey = `${search}|${statusFilter}|${suiteFilter}|${envFilter}`;
  const prevFilterKey = React.useRef(filterKey);
  React.useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      if (page !== 1) setPage(1);
    }
  }, [filterKey, page]);

  const runningCount = envFilteredRuns.filter((r) => r.status === "RUNNING").length;
  const failCount = envFilteredRuns.filter((r) => ["FAIL", "PARTIAL", "ERROR", "FLAKY"].includes(r.status)).length;
  const passedCount = filtered.filter((r) => r.status === "PASS").length;
  const failedCount = filtered.filter((r) => ["FAIL", "ERROR"].includes(r.status)).length;
  const partialCount = filtered.filter((r) => r.status === "PARTIAL").length;

  const hasFilters = search || statusFilter !== "all" || suiteFilter !== "all" || envFilter !== "all";
  const resetFilters = () => {
    setSearch(""); setStatusFilter("all"); setSuiteFilter("all"); setEnvFilter("all"); setPage(1);
  };

  return (
    <div className="animate-fade-in" style={{ padding: "var(--proof-page-py) var(--proof-page-px)", maxWidth: "1440px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", color: "var(--proof-text)", margin: "0 0 6px" }}>
            Run History
          </h1>
          <p style={{ fontSize: "14px", color: "var(--proof-text-secondary)", margin: 0 }}>
            {envFilteredRuns.length} runs · Playwright + pytest across all environments
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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
        </div>
      </div>

      {/* Filters card */}
      <div className="proof-card" style={{ padding: "16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 240px", minWidth: "180px" }}>
            <Search size={14} style={{
              position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
              color: "var(--proof-text-muted)", pointerEvents: "none",
            }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search runs by ID, env, or suite…"
              className="proof-input"
              style={{ paddingLeft: "36px" }}
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
      </div>

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
          onClick={() => navigate("/compare")}
          className="proof-btn proof-btn-ghost"
        >
          <GitCompare size={14} /> Compare Runs
        </button>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="proof-card" style={{
          padding: "64px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
        }}>
          <Activity size={32} style={{ color: "var(--proof-text-muted)", opacity: 0.5 }} />
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--proof-text-secondary)" }}>
            No runs match your filters
          </div>
          {hasFilters && (
            <button onClick={resetFilters} className="proof-btn proof-btn-ghost">
              Clear filters
            </button>
          )}
        </div>
      ) : (
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
            <span>Run</span>
            <span>Env</span>
            <span>Status</span>
            <span>Pass Rate</span>
            <span>Duration</span>
            <span>When</span>
            <span />
          </div>

          {/* Table rows */}
          {paginated.map((run) => (
            <RunRow key={run.id} run={run} onNavigate={(id) => navigate(`/runs/${id}`)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: "24px" }}>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
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

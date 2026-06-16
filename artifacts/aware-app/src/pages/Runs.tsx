import React, { useSyncExternalStore } from "react";
import { Link, useLocation } from "wouter";

import { ConsoleCard, ConsoleStat } from "@/components/console";
import { DataTable, type ColumnDef } from "@/components/console/DataTable";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { RUNS, getRunsByEnv } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { useSyncedUrlState } from "@/lib/urlState";
import type { Run } from "@/lib/types";
import {
  Play,
  GitCompare,
  Search,
  Filter,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Globe,
  Network,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useDataTable } from "@/hooks/useDataTable";

function statusBadge(status: Run["status"]) {
  const map: Record<string, { cls: string; label: string }> = {
    PASS:    { cls: "proof-badge-pass",    label: "PASS" },
    FAIL:    { cls: "proof-badge-fail",    label: "FAIL" },
    PARTIAL: { cls: "proof-badge-partial", label: "PARTIAL" },
    FLAKY:   { cls: "proof-badge-flaky",   label: "FLAKY" },
    RUNNING: { cls: "proof-badge-running", label: "RUNNING" },
  };
  const s = map[status] ?? { cls: "proof-badge-skip", label: status };
  return <span className={`proof-badge ${s.cls}`}>{s.label}</span>;
}

function NetworkBadge({ network }: { network?: string }) {
  if (!network) return null;
  const isProd = network === "production";
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px",
      color: isProd ? "var(--proof-green)" : "var(--proof-yellow)",
      background: isProd ? "var(--proof-green-bg)" : "var(--proof-yellow-bg)",
      border: `1px solid ${isProd ? "rgba(34,197,94,0.2)" : "rgba(217,119,6,0.2)"}`,
      padding: "1px 5px", borderRadius: 4,
      display: "inline-flex", alignItems: "center", gap: 2,
    }}>
      {isProd ? <Globe size={7} /> : <Network size={7} />}
      {network}
    </span>
  );
}

export default function Runs() {
  const [, navigate] = useLocation();
  const { Toast } = useSimpleToast();
  const [search, setSearch]             = useSyncedUrlState("q", "");
  const [statusFilter, setStatusFilter] = useSyncedUrlState("status", "all");
  const [suiteFilter, setSuiteFilter]   = useSyncedUrlState("suite", "all");
  const [envFilter, setEnvFilter]       = useSyncedUrlState("env", "all");

  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const envFilteredRuns = envSnap.envIds.length > 0 ? getRunsByEnv(envSnap.envIds) : RUNS;
  const noRunsForEnv = envSnap.envIds.length > 0 && envFilteredRuns.length === 0;

  const envs   = [...new Set(RUNS.map(r => r.env))].sort();
  const suites = [...new Set(RUNS.map(r => r.suiteId))].sort();

  const filtered = envFilteredRuns.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (suiteFilter  !== "all" && r.suiteId !== suiteFilter) return false;
    if (envFilter    !== "all" && r.env !== envFilter)       return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.id.toLowerCase().includes(q) && !r.env.toLowerCase().includes(q) && !r.suiteId.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const hasActiveFilters = statusFilter !== "all" || suiteFilter !== "all" || envFilter !== "all" || search !== "";
  const clearFilters = () => { setStatusFilter("all"); setSuiteFilter("all"); setEnvFilter("all"); setSearch(""); };

  const table = useDataTable(filtered as unknown as Record<string, unknown>[], {
    defaultPageSize: 25,
    defaultSort: { key: "started", direction: "desc" },
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      key: "id", header: "Run ID", sortable: true, width: 200,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Link href={`/runs/${run.id}`} style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--proof-blue)", fontWeight: 600, textDecoration: "none" }}>
              {run.id}
            </Link>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--proof-text-muted)" }}>
              {run.build} · {run.rev?.slice(0, 7)}
            </span>
          </div>
        );
      },
    },
    {
      key: "suiteId", header: "Suite / Env", sortable: true, width: 190,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 500, color: "var(--proof-text)" }}>{run.suiteId}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10.5, color: "var(--proof-text-secondary)" }}>{run.env}</span>
              <NetworkBadge network={run.network} />
            </div>
          </div>
        );
      },
    },
    {
      key: "status", header: "Result", sortable: true, width: 150,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {statusBadge(run.status)}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--proof-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: run.passPct === 100 ? "var(--proof-green)" : run.passPct < 90 ? "var(--proof-red)" : "var(--proof-text)", fontWeight: 700 }}>
                {run.passPct}%
              </span>
              <span style={{ color: run.failures > 0 ? "var(--proof-red-bright)" : "var(--proof-text-muted)" }}>
                {run.failures > 0 ? `${run.failures} fail` : "clean"}
              </span>
            </span>
          </div>
        );
      },
    },
    {
      key: "duration", header: "Duration", sortable: true, width: 110,
      render: (row) => {
        const run = row as unknown as Run;
        return <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--proof-text-secondary)" }}>{run.duration}</span>;
      },
    },
    {
      key: "started", header: "Date", sortable: true, width: 130,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <span style={{ fontSize: 11.5, color: "var(--proof-text-muted)" }}>
            {new Date(run.started).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        );
      },
    },
    {
      key: "actions", header: "", sortable: false, width: 150,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={(e) => { e.stopPropagation(); navigate(`/runs/${run.id}`); }} className="proof-button proof-button-xs">
              Detail
            </button>
            <button onClick={(e) => { e.stopPropagation(); navigate(`/compare?baseline=${RUNS[RUNS.length - 1]?.id}&candidate=${run.id}`); }} className="proof-button proof-button-xs" style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <GitCompare size={10} /> Diff
            </button>
          </div>
        );
      },
    },
  ];

  const passingCount = envFilteredRuns.filter(r => r.status === "PASS").length;
  const failingCount = envFilteredRuns.filter(r => r.status === "FAIL").length;
  const avgMs = envFilteredRuns.length > 0 ? envFilteredRuns.reduce((s, r) => s + r.durationMs, 0) / envFilteredRuns.length : 0;
  const avgDuration = avgMs < 60000 ? `${(avgMs / 1000).toFixed(1)}s` : `${Math.round(avgMs / 60000)}m`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "page-enter 0.22s ease-out both" }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingBottom: 18, borderBottom: "1px solid var(--proof-border)",
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--proof-text)", margin: 0, letterSpacing: "-0.6px" }}>
            Regression Runs
          </h1>
          <p style={{ fontSize: 12.5, color: "var(--proof-text-secondary)", margin: "4px 0 0", letterSpacing: "-0.1px" }}>
            {envFilteredRuns.length} runs{envSnap.envIds.length > 0 ? " (env filtered)" : ""} · GitHub Actions across QA / UAT / PROD
          </p>
        </div>
        <button onClick={() => navigate("/start")} className="proof-button-primary">
          <Play size={14} /> Start New Run
        </button>
      </div>

      {/* ── KPI strip ── */}
      <PanelErrorBoundary label="Stat cards">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Total Runs",    value: envFilteredRuns.length, icon: <BarChart3 size={15} />,    color: "var(--proof-blue)",   onClick: clearFilters },
            { label: "Passing",       value: passingCount,           icon: <CheckCircle2 size={15} />, color: "var(--proof-green)",  onClick: () => setStatusFilter("PASS") },
            { label: "Failing",       value: failingCount,           icon: <XCircle size={15} />,      color: "var(--proof-red)",    onClick: () => setStatusFilter("FAIL") },
            { label: "Avg Duration",  value: avgDuration,            icon: <Clock size={15} />,        color: "var(--proof-text-secondary)", onClick: undefined },
          ].map(tile => (
            <div
              key={tile.label}
              onClick={tile.onClick}
              style={{
                padding: "16px 18px",
                background: "var(--proof-surface)", border: "1px solid var(--proof-border)",
                borderRadius: 12, display: "flex", flexDirection: "column", gap: 10,
                cursor: tile.onClick ? "pointer" : "default",
                transition: "border-color 0.15s, transform 0.15s",
              }}
              onMouseEnter={e => { if (tile.onClick) { (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-accent)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>{tile.label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `color-mix(in srgb, ${tile.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${tile.color} 22%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", color: tile.color }}>
                  {tile.icon}
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-1.5px", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                {tile.value}
              </div>
            </div>
          ))}
        </div>
      </PanelErrorBoundary>

      {/* ── Filter bar ── */}
      <PanelErrorBoundary label="Filters">
        <div style={{
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          padding: "12px 16px", background: "var(--proof-surface)",
          border: "1px solid var(--proof-border)", borderRadius: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 200px", minWidth: 160 }}>
            <Search size={13} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
            <input
              className="proof-input"
              placeholder="Search run ID, env, suite…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", boxShadow: "none", padding: "0" }}
            />
          </div>
          <div style={{ width: 1, height: 18, background: "var(--proof-border)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={12} style={{ color: "var(--proof-text-muted)" }} />
            <select className="proof-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 12, padding: "4px 8px" }}>
              <option value="all">All statuses</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="FLAKY">FLAKY</option>
            </select>
          </div>
          <select className="proof-input" value={suiteFilter} onChange={e => setSuiteFilter(e.target.value)} style={{ fontSize: 12, padding: "4px 8px" }}>
            <option value="all">All suites</option>
            {suites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="proof-input" value={envFilter} onChange={e => setEnvFilter(e.target.value)} style={{ fontSize: 12, padding: "4px 8px" }}>
            <option value="all">All environments</option>
            {envs.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} style={{ fontSize: 11.5, color: "var(--proof-red-bright)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, padding: "4px 6px" }}>
              <X size={12} /> Clear
            </button>
          )}
          <span style={{ fontSize: 12, color: "var(--proof-text-muted)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
            {filtered.length}/{envFilteredRuns.length}
          </span>
        </div>
      </PanelErrorBoundary>

      {/* ── Active filter badges ── */}
      {hasActiveFilters && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>Active:</span>
          {statusFilter !== "all" && (
            <span className="proof-badge proof-badge-skip" style={{ cursor: "pointer" }} onClick={() => setStatusFilter("all")}>
              status={statusFilter} <X size={9} style={{ marginLeft: 3 }} />
            </span>
          )}
          {suiteFilter !== "all" && (
            <span className="proof-badge proof-badge-skip" style={{ cursor: "pointer" }} onClick={() => setSuiteFilter("all")}>
              suite={suiteFilter} <X size={9} style={{ marginLeft: 3 }} />
            </span>
          )}
          {envFilter !== "all" && (
            <span className="proof-badge proof-badge-skip" style={{ cursor: "pointer" }} onClick={() => setEnvFilter("all")}>
              env={envFilter} <X size={9} style={{ marginLeft: 3 }} />
            </span>
          )}
          {search && (
            <span className="proof-badge proof-badge-skip" style={{ cursor: "pointer" }} onClick={() => setSearch("")}>
              q="{search}" <X size={9} style={{ marginLeft: 3 }} />
            </span>
          )}
        </div>
      )}

      {/* ── DataTable ── */}
      <PanelErrorBoundary label="Runs table">
        <ConsoleCard title="Runs">
          <DataTable
            columns={columns}
            data={table.paginatedData}
            keyExtractor={r => (r as unknown as Run).id}
            sortable
            sortKey={table.sortKey}
            sortDirection={table.sortDirection}
            onSort={table.setSort}
            onRowClick={r => navigate(`/runs/${(r as unknown as Run).id}`)}
            page={table.page}
            totalPages={table.totalPages}
            totalFiltered={table.totalFiltered}
            onPageChange={table.setPage}
            pageSize={table.pageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageSizeChange={table.setPageSize}
            emptyMessage={noRunsForEnv ? "No runs for the selected environment" : "No runs match your filters"}
          />
        </ConsoleCard>
      </PanelErrorBoundary>

      <div style={{ fontSize: 11, color: "var(--proof-text-muted)", textAlign: "right" }}>
        ↑↓ / j·k navigate · Enter open
      </div>
      {Toast}
    </div>
  );
}

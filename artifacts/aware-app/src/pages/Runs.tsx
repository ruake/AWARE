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
  Network,
  Globe,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useDataTable } from "@/hooks/useDataTable";

function statusBadge(status: Run["status"]) {
  const map: Record<string, { cls: string; label: string }> = {
    PASS: { cls: "proof-badge-pass", label: "PASS" },
    FAIL: { cls: "proof-badge-fail", label: "FAIL" },
    PARTIAL: { cls: "proof-badge-partial", label: "PARTIAL" },
    FLAKY: { cls: "proof-badge-flaky", label: "FLAKY" },
    RUNNING: { cls: "proof-badge-running", label: "RUNNING" },
  };
  const s = map[status] ?? { cls: "proof-badge-skip", label: status };
  return <span className={`proof-badge ${s.cls}`}>{s.label}</span>;
}

function NetworkBadge({ network }: { network?: string }) {
  if (!network) return null;
  const isProd = network === "production";
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.3px",
        color: isProd ? "var(--proof-green)" : "var(--proof-yellow)",
        background: isProd ? "var(--proof-green-bg)" : "var(--proof-yellow-bg)",
        border: `1px solid ${isProd ? "rgba(34,197,94,0.2)" : "rgba(217,119,6,0.2)"}`,
        padding: "1px 5px",
        borderRadius: 3,
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      {isProd ? <Globe size={7} /> : <Network size={7} />}
      {network}
    </span>
  );
}

export default function Runs() {
  const [, navigate] = useLocation();
  const { Toast } = useSimpleToast();
  const [search, setSearch] = useSyncedUrlState("q", "");
  const [statusFilter, setStatusFilter] = useSyncedUrlState("status", "all");
  const [suiteFilter, setSuiteFilter] = useSyncedUrlState("suite", "all");
  const [envFilter, setEnvFilter] = useSyncedUrlState("env", "all");

  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const envFilteredRuns = envSnap.envIds.length > 0 ? getRunsByEnv(envSnap.envIds) : RUNS;
  const noRunsForEnv = envSnap.envIds.length > 0 && envFilteredRuns.length === 0;

  const envs = [...new Set(RUNS.map((r) => r.env))].sort();
  const suites = [...new Set(RUNS.map((r) => r.suiteId))].sort();

  const filtered = envFilteredRuns.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (suiteFilter !== "all" && r.suiteId !== suiteFilter) return false;
    if (envFilter !== "all" && r.env !== envFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.id.toLowerCase().includes(q) &&
        !r.env.toLowerCase().includes(q) &&
        !r.suiteId.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const hasActiveFilters =
    statusFilter !== "all" || suiteFilter !== "all" || envFilter !== "all" || search !== "";

  const table = useDataTable(filtered as unknown as Record<string, unknown>[], {
    defaultPageSize: 25,
    defaultSort: { key: "started", direction: "desc" },
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      key: "id",
      header: "Run",
      sortable: true,
      width: 200,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Link
              href={`/runs/${run.id}`}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--proof-blue)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {run.id}
            </Link>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                color: "var(--proof-text-muted)",
              }}
            >
              {run.build} · {run.rev?.slice(0, 7)}
            </span>
          </div>
        );
      },
    },
    {
      key: "suiteId",
      header: "Suite / Env",
      sortable: true,
      width: 180,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {run.suiteId}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>{run.env}</span>
              <NetworkBadge network={run.network} />
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Result",
      sortable: true,
      width: 140,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {statusBadge(run.status)}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--proof-text-secondary)",
              }}
            >
              <span
                style={{
                  color:
                    run.passPct === 100
                      ? "var(--proof-green)"
                      : run.passPct < 90
                        ? "var(--proof-red)"
                        : "var(--proof-text)",
                  fontWeight: 700,
                }}
              >
                {run.passPct}%
              </span>
              {" · "}
              <span
                style={{
                  color: run.failures > 0 ? "var(--proof-red)" : "var(--proof-text-secondary)",
                }}
              >
                {run.failures > 0 ? `${run.failures}✗` : "0 fail"}
              </span>
            </span>
          </div>
        );
      },
    },
    {
      key: "duration",
      header: "Duration",
      sortable: true,
      width: 120,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--proof-text-secondary)",
            }}
          >
            {run.duration}
          </span>
        );
      },
    },
    {
      key: "started",
      header: "Date",
      sortable: true,
      width: 140,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>
            {new Date(run.started).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      width: 160,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <div style={{ display: "flex", gap: 5 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/runs/${run.id}`);
              }}
              className="proof-button"
              style={{ fontSize: 11, padding: "3px 8px", whiteSpace: "nowrap" }}
            >
              Detail
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/compare?baseline=${RUNS[RUNS.length - 1]?.id}&candidate=${run.id}`);
              }}
              className="proof-button"
              style={{
                fontSize: 11,
                padding: "3px 8px",
                display: "flex",
                alignItems: "center",
                gap: 3,
                whiteSpace: "nowrap",
              }}
            >
              <GitCompare size={11} /> Compare
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="proof-page" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div className="proof-page-header" style={{ alignItems: "center" }}>
        <div>
          <h1 className="proof-page-title" style={{ fontSize: 20 }}>
            Regression Runs
          </h1>
          <p className="proof-page-subtitle">
            {envFilteredRuns.length} runs{envSnap.envIds.length > 0 ? ` (filtered)` : ""}{" "}
            &nbsp;·&nbsp; GitHub Actions across QA / UAT / PROD
          </p>
        </div>
        <button onClick={() => navigate("/start")} className="proof-button-primary">
          <Play size={14} /> Start New Run
        </button>
      </div>

      {/* Stat cards */}
      <PanelErrorBoundary label="Stats cards">
        <ConsoleCard>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 4,
            }}
          >
            <ConsoleStat
              label="Total Runs"
              value={envFilteredRuns.length}
              icon={<BarChart3 size={16} />}
              color="var(--proof-blue)"
              onClick={() => {
                setStatusFilter("all");
                setEnvFilter("all");
                setSuiteFilter("all");
                setSearch("");
              }}
            />
            <ConsoleStat
              label="Passing"
              value={envFilteredRuns.filter((r) => r.status === "PASS").length}
              icon={<CheckCircle2 size={16} />}
              color="var(--proof-green)"
              onClick={() => setStatusFilter("PASS")}
            />
            <ConsoleStat
              label="Failing"
              value={envFilteredRuns.filter((r) => r.status === "FAIL").length}
              icon={<XCircle size={16} />}
              color="var(--proof-red)"
              onClick={() => setStatusFilter("FAIL")}
            />
            <ConsoleStat
              label="Avg Duration"
              value={(() => {
                const avgMs =
                  envFilteredRuns.length > 0
                    ? envFilteredRuns.reduce((s, r) => s + r.durationMs, 0) / envFilteredRuns.length
                    : 0;
                if (avgMs < 60000) return `${(avgMs / 1000).toFixed(1)}s`;
                return `${Math.round(avgMs / 60000)}m`;
              })()}
              icon={<Clock size={16} />}
              color="var(--proof-text-secondary)"
            />
          </div>
        </ConsoleCard>
      </PanelErrorBoundary>

      {/* Filter bar */}
      <PanelErrorBoundary label="Filters">
        <ConsoleCard>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: "1 1 200px",
                minWidth: 160,
              }}
            >
              <Search size={14} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
              <input
                className="proof-input"
                placeholder="Search run ID, env, suite…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: 0 }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={13} style={{ color: "var(--proof-text-secondary)" }} />
              <select
                className="proof-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="FLAKY">FLAKY</option>
              </select>
            </div>
            <select
              className="proof-input"
              value={suiteFilter}
              onChange={(e) => setSuiteFilter(e.target.value)}
            >
              <option value="all">All suites</option>
              {suites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="proof-input"
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
            >
              <option value="all">All environments</option>
              {envs.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSuiteFilter("all");
                  setEnvFilter("all");
                  setSearch("");
                }}
                style={{
                  fontSize: 11,
                  color: "var(--proof-red)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <X size={12} /> Clear
              </button>
            )}
            <span
              style={{
                fontSize: 12,
                color: "var(--proof-text-secondary)",
                marginLeft: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {filtered.length} of {envFilteredRuns.length}
            </span>
          </div>
        </ConsoleCard>
      </PanelErrorBoundary>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>Filters:</span>
          {statusFilter !== "all" && (
            <span
              className="proof-badge proof-badge-skip"
              style={{ fontSize: 10, cursor: "pointer" }}
              onClick={() => setStatusFilter("all")}
            >
              status={statusFilter} <X size={10} style={{ marginLeft: 3 }} />
            </span>
          )}
          {suiteFilter !== "all" && (
            <span
              className="proof-badge proof-badge-skip"
              style={{ fontSize: 10, cursor: "pointer" }}
              onClick={() => setSuiteFilter("all")}
            >
              suite={suiteFilter} <X size={10} style={{ marginLeft: 3 }} />
            </span>
          )}
          {envFilter !== "all" && (
            <span
              className="proof-badge proof-badge-skip"
              style={{ fontSize: 10, cursor: "pointer" }}
              onClick={() => setEnvFilter("all")}
            >
              env={envFilter} <X size={10} style={{ marginLeft: 3 }} />
            </span>
          )}
        </div>
      )}

      {/* DataTable */}
      <PanelErrorBoundary label="Runs table">
        <ConsoleCard title="Runs">
          <DataTable
            columns={columns}
            data={table.paginatedData}
            keyExtractor={(r) => (r as unknown as Run).id}
            sortable
            sortKey={table.sortKey}
            sortDirection={table.sortDirection}
            onSort={table.setSort}
            onRowClick={(r) => navigate(`/runs/${(r as unknown as Run).id}`)}
            page={table.page}
            totalPages={table.totalPages}
            totalFiltered={table.totalFiltered}
            onPageChange={table.setPage}
            pageSize={table.pageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageSizeChange={table.setPageSize}
            emptyMessage={
              noRunsForEnv ? "No runs for the selected environment" : "No runs match your filters"
            }
          />
        </ConsoleCard>
      </PanelErrorBoundary>

      <div style={{ fontSize: 11, color: "var(--proof-text-muted)", textAlign: "right" }}>
        ↑↓ / j·k to navigate · Enter to open
      </div>
      {Toast}
    </div>
  );
}

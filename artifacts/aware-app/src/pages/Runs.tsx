import React, { useSyncExternalStore } from "react";
import { Link, useLocation } from "wouter";

import { ConsoleCard, ConsoleStat } from "@/components/console";
import { DataTable, type ColumnDef } from "@/components/console/DataTable";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { Pagination, CTAStatCard } from "@/components/aware";
import { RUNS, getRunsByEnv } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { useSyncedUrlState } from "@/lib/urlState";
import { useSimpleToast } from "@/hooks/useSimpleToast";
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
  Activity,
  Loader2,
  ExternalLink,
  Github,
  Check,
} from "lucide-react";

const GH_ACTIONS_URL = `https://github.com/your-org/your-repo/actions`;

const STATUS_CONFIG: Record<
  Run["status"],
  {
    label: string;
    color: string;
    bg: string;
  }
> = {
  PASS: { label: "Passed", color: "var(--proof-green)", bg: "var(--proof-green-bg)" },
  FAIL: { label: "Failed", color: "var(--proof-red)", bg: "var(--proof-red-bg)" },
  PARTIAL: {
    label: "Partial",
    color: "var(--proof-yellow)",
    bg: "var(--proof-yellow-bg)",
  },
  FLAKY: {
    label: "Flaky",
    color: "var(--proof-orange)",
    bg: "var(--proof-orange-bg)",
  },
  RUNNING: {
    label: "Running",
    color: "var(--proof-blue)",
    bg: "var(--proof-blue-bg)",
  },
  PENDING: {
    label: "Pending",
    color: "var(--proof-text-secondary)",
    bg: "rgba(126,138,158,0.10)",
  },
  ERROR: { label: "Error", color: "var(--proof-red)", bg: "var(--proof-red-bg)" },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
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
        borderRadius: 4,
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
  const [, setRefresh] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => setRefresh((n) => n + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const envFilteredRuns = envSnap.envIds.length > 0 ? getRunsByEnv(envSnap.envIds) : RUNS;
  const noRunsForEnv = envSnap.envIds.length > 0 && envFilteredRuns.length === 0;

  const running = envFilteredRuns.filter((r) => r.status === "RUNNING");
  const passed = envFilteredRuns.filter((r) => r.status === "PASS").length;
  const failed = envFilteredRuns.filter((r) => r.status === "FAIL" || r.status === "FLAKY").length;
  const total = envFilteredRuns.length;
  const avgPassRate =
    total > 0 ? Math.round(envFilteredRuns.reduce((s, r) => s + r.passPct, 0) / total) : 0;
  const avgMs = total > 0 ? envFilteredRuns.reduce((s, r) => s + r.durationMs, 0) / total : 0;
  const avgDurationStr =
    avgMs < 60000 ? `${(avgMs / 1000).toFixed(1)}s` : `${Math.round(avgMs / 60000)}m`;

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
  const clearFilters = () => {
    setStatusFilter("all");
    setSuiteFilter("all");
    setEnvFilter("all");
    setSearch("");
  };

  const [page, setPage] = React.useState(1);
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const [prevFilterKey, setPrevFilterKey] = React.useState("");
  const filterKey = `${search}|${statusFilter}|${suiteFilter}|${envFilter}`;
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    if (page !== 1) setPage(1);
  }

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      key: "id",
      header: "Run ID",
      sortable: true,
      width: 200,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Link
              href={`/runs/${run.id}`}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                color: run.status === "RUNNING" ? "var(--proof-blue)" : "var(--proof-blue)",
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {run.status === "RUNNING" && (
                <Loader2
                  size={11}
                  style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
                />
              )}
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
      width: 190,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                fontWeight: 500,
                color: "var(--proof-text)",
              }}
            >
              {run.suiteId}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10.5, color: "var(--proof-text-secondary)" }}>
                {run.env}
              </span>
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
      width: 150,
      render: (row) => {
        const run = row as unknown as Run;
        const cfg = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.ERROR;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                color: cfg.color,
                background: cfg.bg,
                width: "fit-content",
              }}
            >
              {run.status === "RUNNING" && (
                <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
              )}
              {cfg.label}
              {run.status === "RUNNING" && run.passPct > 0 && (
                <span style={{ opacity: 0.7, marginLeft: 2 }}>{run.passPct}%</span>
              )}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--proof-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {run.status !== "RUNNING" && (
                <>
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
                  <span
                    style={{
                      color:
                        run.failures > 0 ? "var(--proof-red-bright)" : "var(--proof-text-muted)",
                    }}
                  >
                    {run.failures > 0 ? `${run.failures} fail` : "clean"}
                  </span>
                </>
              )}
              {run.status === "RUNNING" && run.passPct === 0 && (
                <span style={{ color: "var(--proof-text-muted)" }}>awaiting results…</span>
              )}
            </span>
          </div>
        );
      },
    },
    {
      key: "duration",
      header: "Duration",
      sortable: true,
      width: 110,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              color: run.status === "RUNNING" ? "var(--proof-blue)" : "var(--proof-text-secondary)",
            }}
          >
            {run.status === "RUNNING" ? "in progress…" : run.duration}
          </span>
        );
      },
    },
    {
      key: "started",
      header: "When",
      sortable: true,
      width: 130,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <span style={{ fontSize: 11.5, color: "var(--proof-text-muted)" }}>
            {timeAgo(run.started)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      width: 150,
      render: (row) => {
        const run = row as unknown as Run;
        return (
          <div style={{ display: "flex", gap: 5 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/runs/${run.id}`);
              }}
              className="proof-button proof-button-xs"
            >
              Detail
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/compare?baseline=${RUNS[RUNS.length - 1]?.id}&candidate=${run.id}`);
              }}
              className="proof-button proof-button-xs"
              style={{ display: "flex", alignItems: "center", gap: 3 }}
            >
              <GitCompare size={10} /> Diff
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        animation: "page-enter 0.22s ease-out both",
      }}
    >
      {/* ── Banner: Running or Idle ── */}
      {running.length > 0 ? (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            background:
              "linear-gradient(90deg, rgba(59,130,246,0.1) 0%, rgba(91,138,245,0.06) 100%)",
            border: "1px solid rgba(59,130,246,0.25)",
            borderLeft: "3px solid var(--proof-blue-hover)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(59,130,246,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Loader2
              size={14}
              style={{ color: "var(--proof-blue-hover)", animation: "spin 1s linear infinite" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
              {running.length} workflow{running.length > 1 ? "s" : ""} currently running
            </span>
            <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginLeft: 8 }}>
              — showing partial data as available
            </span>
          </div>
          <a
            href={GH_ACTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--proof-blue-hover)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 10px",
              borderRadius: 6,
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            View on GitHub <ExternalLink size={10} />
          </a>
        </div>
      ) : (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            background:
              "linear-gradient(90deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)",
            border: "1px solid rgba(34,197,94,0.18)",
            borderLeft: "3px solid #22c55e",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(34,197,94,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Check size={14} style={{ color: "var(--proof-green)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
              All workflows idle
            </span>
            <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginLeft: 8 }}>
              No runs currently in progress
            </span>
          </div>
          <a
            href={GH_ACTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--proof-green)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 10px",
              borderRadius: 6,
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.18)",
            }}
          >
            Open GitHub Actions <ExternalLink size={10} />
          </a>
        </div>
      )}

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--proof-text)",
              margin: 0,
              letterSpacing: "-0.6px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Activity size={20} style={{ color: "var(--proof-blue)" }} />
            Activity & Runs
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: running.length > 0 ? "var(--proof-blue-hover)" : "var(--proof-green)",
                background: running.length > 0 ? "rgba(59,130,246,0.1)" : "rgba(34,197,94,0.1)",
                border: `1px solid ${running.length > 0 ? "rgba(59,130,246,0.25)" : "rgba(34,197,94,0.25)"}`,
                borderRadius: 999,
                padding: "2px 8px 2px 6px",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: running.length > 0 ? "var(--proof-blue-hover)" : "var(--proof-green)",
                  animation: running.length > 0 ? "pulseDot 1.5s ease-in-out infinite" : "none",
                  display: "inline-block",
                }}
              />
              {running.length > 0 ? `${running.length} running` : "all idle"}
            </span>
          </h1>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--proof-text-secondary)",
              margin: "4px 0 0",
              letterSpacing: "-0.1px",
            }}
          >
            {total} runs{envSnap.envIds.length > 0 ? " (env filtered)" : ""} · GitHub Actions across
            QA / UAT / PROD ·
            {running.length > 0 ? " partial data shown for active runs" : " all completed"}
          </p>
        </div>
        <button onClick={() => navigate("/start")} className="proof-button-primary">
          <Play size={14} /> Start New Run
        </button>
      </div>

      {/* ── Merged KPI strip ── */}
      <div
        className="proof-stagger"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 10,
        }}
      >
        <CTAStatCard
          label="Total Runs"
          value={total}
          subtitle="all environments"
          accentColor="var(--proof-blue)"
          icon={<Activity size={16} />}
          onClick={clearFilters}
          active={!hasActiveFilters}
        />
        <CTAStatCard
          label="Running"
          value={running.length}
          subtitle="in progress"
          accentColor="var(--proof-blue-hover)"
          icon={<Loader2 size={16} />}
          onClick={() => setStatusFilter("RUNNING")}
          active={statusFilter === "RUNNING"}
        />
        <CTAStatCard
          label="Passed"
          value={passed}
          subtitle="successful"
          accentColor="var(--proof-green)"
          icon={<CheckCircle2 size={16} />}
          onClick={() => setStatusFilter("PASS")}
          active={statusFilter === "PASS"}
        />
        <CTAStatCard
          label="Failed / Flaky"
          value={failed}
          subtitle="need attention"
          accentColor="var(--proof-red)"
          icon={<XCircle size={16} />}
          onClick={() => setStatusFilter("FAIL")}
          active={statusFilter === "FAIL"}
        />
        <CTAStatCard
          label="Avg Pass Rate"
          value={`${avgPassRate}%`}
          subtitle={`${total} workflows`}
          accentColor={
            avgPassRate >= 80
              ? "var(--proof-green)"
              : avgPassRate >= 50
                ? "var(--proof-yellow)"
                : "var(--proof-red)"
          }
          icon={<BarChart3 size={16} />}
        />
        <CTAStatCard
          label="Avg Duration"
          value={avgDurationStr}
          subtitle="per workflow"
          accentColor="var(--proof-purple)"
          icon={<Clock size={16} />}
        />
      </div>

      {/* ── Quick navigate ── */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid var(--proof-border)",
          background: "var(--proof-surface)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--proof-text-muted)",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            marginRight: 4,
          }}
        >
          Navigate
        </span>
        <div
          style={{
            width: 1,
            height: 14,
            background: "var(--proof-border-strong)",
            marginRight: 4,
          }}
        />
        {[
          { href: "/", icon: BarChart3, label: "Dashboard" },
          { href: "/compare", icon: GitCompare, label: "Compare" },
          { href: "/trends", icon: BarChart3, label: "Trends" },
        ].map(({ href, icon: Ic, label }) => (
          <Link key={href} href={href}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 11px",
                borderRadius: 6,
                border: "1px solid var(--proof-border-strong)",
                background: "var(--proof-surface-2)",
                color: "var(--proof-text-secondary)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 500,
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--proof-text)";
                e.currentTarget.style.borderColor = "rgba(91,138,245,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--proof-text-secondary)";
                e.currentTarget.style.borderColor = "var(--proof-border-strong)";
              }}
            >
              <Ic size={12} /> {label}
            </button>
          </Link>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <PanelErrorBoundary label="Filters">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            padding: "12px 16px",
            background: "var(--proof-surface)",
            border: "1px solid var(--proof-border)",
            borderRadius: 12,
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
            <Search size={13} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
            <input
              className="proof-input"
              placeholder="Search run ID, env, suite…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                boxShadow: "none",
                padding: "0",
              }}
            />
          </div>
          <div style={{ width: 1, height: 18, background: "var(--proof-border)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={12} style={{ color: "var(--proof-text-muted)" }} />
            <select
              className="proof-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: 12, padding: "4px 8px" }}
            >
              <option value="all">All statuses</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="FLAKY">FLAKY</option>
              <option value="RUNNING">RUNNING</option>
            </select>
          </div>
          <select
            className="proof-input"
            value={suiteFilter}
            onChange={(e) => setSuiteFilter(e.target.value)}
            style={{ fontSize: 12, padding: "4px 8px" }}
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
            style={{ fontSize: 12, padding: "4px 8px" }}
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
              onClick={clearFilters}
              style={{
                fontSize: 11.5,
                color: "var(--proof-red-bright)",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "4px 6px",
              }}
            >
              <X size={12} /> Clear
            </button>
          )}
          <span
            style={{
              fontSize: 12,
              color: "var(--proof-text-muted)",
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
            }}
          >
            {filtered.length}/{total}
          </span>
        </div>
      </PanelErrorBoundary>

      {/* ── Active filter badges ── */}
      {hasActiveFilters && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>Active:</span>
          {statusFilter !== "all" && (
            <span
              className="proof-badge proof-badge-skip"
              style={{ cursor: "pointer" }}
              onClick={() => setStatusFilter("all")}
            >
              status={statusFilter} <X size={9} style={{ marginLeft: 3 }} />
            </span>
          )}
          {suiteFilter !== "all" && (
            <span
              className="proof-badge proof-badge-skip"
              style={{ cursor: "pointer" }}
              onClick={() => setSuiteFilter("all")}
            >
              suite={suiteFilter} <X size={9} style={{ marginLeft: 3 }} />
            </span>
          )}
          {envFilter !== "all" && (
            <span
              className="proof-badge proof-badge-skip"
              style={{ cursor: "pointer" }}
              onClick={() => setEnvFilter("all")}
            >
              env={envFilter} <X size={9} style={{ marginLeft: 3 }} />
            </span>
          )}
          {search && (
            <span
              className="proof-badge proof-badge-skip"
              style={{ cursor: "pointer" }}
              onClick={() => setSearch("")}
            >
              q="{search}" <X size={9} style={{ marginLeft: 3 }} />
            </span>
          )}
        </div>
      )}

      {/* ── DataTable ── */}
      <PanelErrorBoundary label="Runs table">
        <ConsoleCard title="Run History">
          <DataTable
            columns={columns}
            data={paginated as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => (r as unknown as Run).id}
            onRowClick={(r) => navigate(`/runs/${(r as unknown as Run).id}`)}
            emptyMessage={
              noRunsForEnv ? "No runs for the selected environment" : "No runs match your filters"
            }
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </ConsoleCard>
      </PanelErrorBoundary>

      {/* ── GitHub Actions info ── */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: 8,
          border: "1px solid var(--proof-grey)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: "rgba(91,138,245,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Github size={20} style={{ color: "var(--proof-blue)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
            GitHub Actions
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>
            Workflows are triggered on push, PR, and schedule. Monitor live runs, review test
            results, and compare environments.
          </div>
        </div>
        <a
          href={GH_ACTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid var(--proof-blue)",
            background: "var(--proof-blue-bg)",
            color: "var(--proof-blue)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          Open Actions <ExternalLink size={12} />
        </a>
      </div>

      <div style={{ fontSize: 11, color: "var(--proof-text-muted)", textAlign: "right" }}>
        ↑↓ / j·k navigate · Enter open
      </div>
      {Toast}
    </div>
  );
}

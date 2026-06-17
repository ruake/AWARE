import React, { useSyncExternalStore } from "react";
import { Link, useLocation } from "wouter";

import { ConsoleCard, ConsolePagination, PageShell } from "@/components/console";
import { DataTable, type ColumnDef } from "@/components/console/DataTable";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { RUNS, getRuns, getRunsByEnv } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { useSyncedUrlState } from "@/lib/urlState";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import type { Run } from "@/lib/types";
import {
  Play,
  GitCompare,
  Globe,
  Network,
  Loader2,
  ExternalLink,
} from "lucide-react";

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

  const total = envFilteredRuns.length;

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
                const allRuns = getRuns();
                const latestRun = [...allRuns].sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())[0];
                navigate(`/compare?baseline=${latestRun?.id ?? ""}&candidate=${run.id}`);
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

  const failCount = envFilteredRuns.filter((r) => ["FAIL", "PARTIAL", "ERROR", "FLAKY"].includes(r.status)).length;
  const runningCount = envFilteredRuns.filter((r) => r.status === "RUNNING").length;
  const pageTitle = "Activity & Runs";
  const pageSubtitle = `${total} runs${envSnap.envIds.length > 0 ? " (env filtered)" : ""} · ${
    runningCount > 0 ? `${runningCount} running` : failCount > 0 ? `${failCount} failed` : "all passing"
  }`;

  return (
    <PageShell
      title={pageTitle}
      subtitle={pageSubtitle}
      headerActions={
        <button onClick={() => window.open("https://github.com/your-org/your-repo/actions/workflows/run-tests.yml", "_blank")} className="proof-button-primary">
          <Play size={14} /> Start New Run <ExternalLink size={11} style={{ opacity: 0.7 }} />
        </button>
      }
    >
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
        </ConsoleCard>
      </PanelErrorBoundary>
      {/* ── Page pagination ── */}
      {totalPages > 1 && (
        <ConsolePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={() => {}}
        />
      )}

      {Toast}
    </PageShell>
  );
}

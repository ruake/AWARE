import React, { useSyncExternalStore } from "react";
import { Link, useLocation } from "wouter";
import { PageTemplate } from "@/components/aware";
import { getRuns, subscribeToRuns, getEnvConfigs } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { useSyncedUrlState } from "@/lib/urlState";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import type { Run } from "@/lib/types";
import { Play, GitCompare, Loader2, ExternalLink, Search, X } from "lucide-react";
import { repo } from "@/lib/nav";

/* ── status config ─────────────────────────────────────────────── */
const STATUS_CFG: Record<
  Run["status"],
  { label: string; color: string; bg: string; border: string }
> = {
  PASS: {
    label: "Passed",
    color: "var(--proof-green)",
    bg: "var(--proof-green-bg)",
    border: "var(--proof-green-border)",
  },
  FAIL: {
    label: "Failed",
    color: "var(--proof-red)",
    bg: "var(--proof-red-bg)",
    border: "var(--proof-red-border)",
  },
  PARTIAL: {
    label: "Partial",
    color: "var(--proof-yellow)",
    bg: "var(--proof-yellow-bg)",
    border: "var(--proof-yellow-border)",
  },
  FLAKY: {
    label: "Flaky",
    color: "var(--proof-orange)",
    bg: "var(--proof-orange-bg)",
    border: "rgba(249,115,22,0.3)",
  },
  RUNNING: {
    label: "Running",
    color: "var(--proof-blue-bright)",
    bg: "var(--proof-blue-bg)",
    border: "var(--proof-blue-border)",
  },
  PENDING: {
    label: "Pending",
    color: "var(--proof-text-secondary)",
    bg: "var(--proof-hover)",
    border: "var(--proof-border)",
  },
  ERROR: {
    label: "Error",
    color: "var(--proof-red)",
    bg: "var(--proof-red-bg)",
    border: "var(--proof-red-border)",
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  const d = Math.floor(diff / 86400000);
  return `${d}d ago`;
}

/* ── Filter chip button ────────────────────────────────────────── */
function FilterChip({
  label,
  value,
  active,
  onSelect,
}: {
  label: string;
  value: string;
  active: boolean;
  onSelect: (v: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(active ? "all" : value)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: "var(--proof-radius-full)",
        border: `1px solid ${active ? "var(--proof-blue-border)" : "var(--proof-border)"}`,
        background: active ? "var(--proof-blue-bg)" : "transparent",
        color: active ? "var(--proof-blue-bright)" : "var(--proof-text-muted)",
        fontSize: 11.5,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        transition: "all var(--proof-transition)",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-sans)",
      }}
    >
      {label}
    </button>
  );
}

/* ── Env badge ─────────────────────────────────────────────────── */
function EnvBadge({ env }: { env: string }) {
  const tier = env.split(/[/ ]/)[0]?.toUpperCase() ?? env;
  const colors: Record<string, { color: string; bg: string }> = {
    QA: { color: "var(--proof-blue)", bg: "var(--proof-blue-bg)" },
    UAT: { color: "var(--proof-purple)", bg: "var(--proof-purple-bg)" },
    PROD: { color: "var(--proof-green)", bg: "var(--proof-green-bg)" },
  };
  const c = colors[tier] ?? { color: "var(--proof-text-muted)", bg: "var(--proof-hover)" };
  return (
    <span
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.3px",
        color: c.color,
        background: c.bg,
        padding: "1px 6px",
        borderRadius: 4,
        flexShrink: 0,
      }}
    >
      {tier}
    </span>
  );
}

/* ── Pass rate mini bar ────────────────────────────────────────── */
function PassBar({ pct }: { pct: number }) {
  const c =
    pct >= 95 ? "var(--proof-green)" : pct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div
        style={{
          width: 52,
          height: 3,
          background: "var(--proof-hover)",
          borderRadius: 99,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: c,
            borderRadius: 99,
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 800,
          fontFamily: "var(--font-mono)",
          color: c,
          letterSpacing: "-0.6px",
          minWidth: 34,
          textAlign: "right",
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

export default function Runs() {
  const [, navigate] = useLocation();
  const { Toast } = useSimpleToast();
  const [search, setSearch] = useSyncedUrlState("q", "");
  const [statusFilter, setStatusFilter] = useSyncedUrlState("status", "all");
  const [suiteFilter, setSuiteFilter] = useSyncedUrlState("suite", "all");
  const [envFilter, setEnvFilter] = useSyncedUrlState("env", "all");

  const allRuns = useSyncExternalStore(subscribeToRuns, getRuns);
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const envFilteredRuns =
    envSnap.envIds.length > 0 ? allRuns.filter((r) => envSnap.envIds.includes(r.envId)) : allRuns;

  const filtered = envFilteredRuns.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (suiteFilter !== "all" && r.suiteId !== suiteFilter) return false;
    if (envFilter !== "all" && !r.env.toUpperCase().startsWith(envFilter.toUpperCase()))
      return false;
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
  const PAGE_SIZE = 30;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filterKey = `${search}|${statusFilter}|${suiteFilter}|${envFilter}`;
  const prevFilterKey = React.useRef(filterKey);
  React.useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      if (page !== 1) queueMicrotask(() => setPage(1));
    }
  }, [filterKey, page]);

  const suites = [...new Set(envFilteredRuns.map((r) => r.suiteId).filter(Boolean))].sort();
  const envConfigs = getEnvConfigs();

  const failCount = envFilteredRuns.filter((r) =>
    ["FAIL", "PARTIAL", "ERROR", "FLAKY"].includes(r.status),
  ).length;
  const runningCount = envFilteredRuns.filter((r) => r.status === "RUNNING").length;

  return (
    <>
      <PageTemplate
        title="Run History"
        subtitle={`${envFilteredRuns.length} total · Playwright + pytest across all environments`}
        badges={
          <>
            <span className="proof-badge proof-badge-neutral">{filtered.length} runs</span>
            {runningCount > 0 && (
              <span className="proof-badge proof-badge-running">
                <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} />
                {runningCount} running
              </span>
            )}
            {failCount > 0 && (
              <span className="proof-badge proof-badge-fail">{failCount} failed</span>
            )}
          </>
        }
        headerActions={
          <button
            onClick={() => window.open(`${repo}/actions/workflows/run-tests.yml`, "_blank")}
            className="proof-button-primary"
          >
            <Play size={12} /> Start Run <ExternalLink size={10} style={{ opacity: 0.7 }} />
          </button>
        }
        filters={
          <>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Search
                size={12}
                style={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--proof-text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                className="proof-input"
                style={{ paddingLeft: 26, width: 180, height: 26, fontSize: 12 }}
                placeholder="Search runs…"
                aria-label="Search runs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  style={{
                    position: "absolute",
                    right: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--proof-text-muted)",
                    padding: 1,
                    display: "flex",
                    lineHeight: 1,
                  }}
                >
                  <X size={10} aria-hidden="true" />
                </button>
              )}
            </div>

            <div
              style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }}
            />

            <span
              style={{
                fontSize: 10,
                color: "var(--proof-text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                flexShrink: 0,
              }}
            >
              Status:
            </span>
            {(["PASS", "FAIL", "PARTIAL", "FLAKY", "RUNNING"] as Run["status"][]).map((s) => (
              <FilterChip
                key={s}
                label={STATUS_CFG[s].label}
                value={s}
                active={statusFilter === s}
                onSelect={setStatusFilter}
              />
            ))}

            <div
              style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }}
            />

            <span
              style={{
                fontSize: 10,
                color: "var(--proof-text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                flexShrink: 0,
              }}
            >
              Suite:
            </span>
            <select
              value={suiteFilter}
              onChange={(e) => setSuiteFilter(e.target.value)}
              style={{
                fontSize: 11.5,
                padding: "2px 6px",
                borderRadius: 6,
                border: "1px solid var(--proof-border)",
                background: "var(--proof-surface)",
                color:
                  suiteFilter !== "all" ? "var(--proof-blue-bright)" : "var(--proof-text-muted)",
                fontWeight: suiteFilter !== "all" ? 600 : 400,
                cursor: "pointer",
                maxWidth: 170,
              }}
            >
              <option value="all">All suites</option>
              {suites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div
              style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }}
            />

            <span
              style={{
                fontSize: 10,
                color: "var(--proof-text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                flexShrink: 0,
              }}
            >
              Env:
            </span>
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              style={{
                fontSize: 11.5,
                padding: "2px 6px",
                borderRadius: 6,
                border: "1px solid var(--proof-border)",
                background: "var(--proof-surface)",
                color: envFilter !== "all" ? "var(--proof-blue-bright)" : "var(--proof-text-muted)",
                fontWeight: envFilter !== "all" ? 600 : 400,
                cursor: "pointer",
                maxWidth: 170,
              }}
            >
              <option value="all">All envs</option>
              {envConfigs.map((e) => (
                <option key={e.id} value={e.target}>
                  {e.label}
                </option>
              ))}
            </select>

            {(search || statusFilter !== "all" || suiteFilter !== "all" || envFilter !== "all") && (
              <>
                <div
                  style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }}
                />
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setSuiteFilter("all");
                    setEnvFilter("all");
                  }}
                  className="proof-button-ghost"
                  style={{ fontSize: 11, color: "var(--proof-text-muted)" }}
                >
                  <X size={10} /> Clear filters
                </button>
              </>
            )}
          </>
        }
        isEmpty={paginated.length === 0}
        emptyMessage="No runs match your filters"
        emptyAction={
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setSuiteFilter("all");
              setEnvFilter("all");
            }}
            className="proof-button proof-button-sm"
          >
            Clear filters
          </button>
        }
        currentPage={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      >
        <div style={{ overflowX: "auto" }}>
        <table className="proof-table" style={{ width: "100%", tableLayout: "auto", minWidth: 640 }}>
          <colgroup>
            <col style={{ width: 3 }} />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th aria-hidden="true" />
              <th scope="col">Run ID</th>
              <th scope="col">Suite</th>
              <th scope="col">Environment</th>
              <th scope="col">Result</th>
              <th scope="col">Duration</th>
              <th scope="col">When</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((run) => {
              const cfg = STATUS_CFG[run.status] ?? STATUS_CFG.ERROR;
              const isRunning = run.status === "RUNNING";
              return (
                <tr
                  key={run.id}
                  onClick={() => navigate(`/runs/${run.id}`)}
                  role="button"
                  aria-label={`Run ${run.id} — ${cfg.label}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/runs/${run.id}`);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ padding: 0, width: 3 }} aria-hidden="true">
                    <div
                      style={{
                        width: 3,
                        height: "100%",
                        minHeight: 40,
                        background: cfg.color,
                        borderRadius: "0 2px 2px 0",
                      }}
                    />
                  </td>

                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--proof-blue-bright)",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {isRunning && (
                        <Loader2
                          size={11}
                          aria-label="Running"
                          style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
                        />
                      )}
                      {run.id}
                    </span>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--proof-text-muted)",
                        marginTop: 2,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {run.build}
                      {run.rev ? ` · ${run.rev.slice(0, 7)}` : ""}
                    </div>
                  </td>

                  <td>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        color: "var(--proof-text-secondary)",
                        fontWeight: 500,
                      }}
                    >
                      {run.suiteId}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <EnvBadge env={run.env} />
                      <span style={{ fontSize: 11.5, color: "var(--proof-text-secondary)" }}>
                        {run.env}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: "var(--proof-radius-full)",
                          fontSize: 10.5,
                          fontWeight: 700,
                          letterSpacing: "0.1px",
                          color: cfg.color,
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          width: "fit-content",
                        }}
                      >
                        {isRunning && (
                          <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} />
                        )}
                        {cfg.label}
                      </span>
                      {!isRunning && <PassBar pct={run.passPct} />}
                      {isRunning && run.passPct > 0 && <PassBar pct={run.passPct} />}
                    </div>
                  </td>

                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: isRunning
                          ? "var(--proof-blue-bright)"
                          : "var(--proof-text-secondary)",
                      }}
                    >
                      {isRunning ? "…" : run.duration}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11.5, color: "var(--proof-text-muted)" }}>
                        {timeAgo(run.started)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const allRuns = getRuns();
                          const latest = [...allRuns].sort(
                            (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
                          )[0];
                          navigate(`/compare?baseline=${latest?.id ?? ""}&candidate=${run.id}`);
                        }}
                        title="Compare to latest"
                        aria-label={`Compare run ${run.id} to latest`}
                        className="proof-button-ghost"
                        style={{ padding: "2px 5px", opacity: 0.7 }}
                      >
                        <GitCompare size={11} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </PageTemplate>
      {Toast}
    </>
  );
}

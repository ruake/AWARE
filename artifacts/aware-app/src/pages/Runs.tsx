import React, { useSyncExternalStore } from "react";
import { Link, useLocation } from "wouter";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { RUNS, getRuns, getRunsByEnv } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { useSyncedUrlState } from "@/lib/urlState";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import type { Run } from "@/lib/types";
import { Play, GitCompare, Loader2, ExternalLink, Search, X, SlidersHorizontal } from "lucide-react";

/* ── status config ─────────────────────────────────────────────── */
const STATUS_CFG: Record<Run["status"], { label: string; color: string; bg: string; border: string }> = {
  PASS:    { label: "Passed",  color: "var(--proof-green)",           bg: "var(--proof-green-bg)",   border: "var(--proof-green-border)" },
  FAIL:    { label: "Failed",  color: "var(--proof-red)",             bg: "var(--proof-red-bg)",     border: "var(--proof-red-border)" },
  PARTIAL: { label: "Partial", color: "var(--proof-yellow)",          bg: "var(--proof-yellow-bg)",  border: "var(--proof-yellow-border)" },
  FLAKY:   { label: "Flaky",   color: "var(--proof-orange)",          bg: "var(--proof-orange-bg)",  border: "rgba(249,115,22,0.3)" },
  RUNNING: { label: "Running", color: "var(--proof-blue-bright)",     bg: "var(--proof-blue-bg)",    border: "var(--proof-blue-border)" },
  PENDING: { label: "Pending", color: "var(--proof-text-secondary)",  bg: "var(--proof-hover)",      border: "var(--proof-border)" },
  ERROR:   { label: "Error",   color: "var(--proof-red)",             bg: "var(--proof-red-bg)",     border: "var(--proof-red-border)" },
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
  const d = Math.floor(diff / 86400000);
  return `${d}d ago`;
}

/* ── Filter chip button ────────────────────────────────────────── */
function FilterChip({
  label, value, active, onSelect,
}: {
  label: string; value: string; active: boolean; onSelect: (v: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(active ? "all" : value)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: "var(--proof-radius-full)",
        border: `1px solid ${active ? "var(--proof-blue-border)" : "var(--proof-border)"}`,
        background: active ? "var(--proof-blue-bg)" : "transparent",
        color: active ? "var(--proof-blue-bright)" : "var(--proof-text-muted)",
        fontSize: 11.5, fontWeight: active ? 700 : 500, cursor: "pointer",
        transition: "all var(--proof-transition)", whiteSpace: "nowrap",
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
    QA:   { color: "var(--proof-blue)",   bg: "var(--proof-blue-bg)" },
    UAT:  { color: "var(--proof-purple)", bg: "var(--proof-purple-bg)" },
    PROD: { color: "var(--proof-green)",  bg: "var(--proof-green-bg)" },
  };
  const c = colors[tier] ?? { color: "var(--proof-text-muted)", bg: "var(--proof-hover)" };
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px",
      color: c.color, background: c.bg, padding: "1px 6px", borderRadius: 4, flexShrink: 0,
    }}>
      {tier}
    </span>
  );
}

/* ── Pass rate mini bar ────────────────────────────────────────── */
function PassBar({ pct }: { pct: number }) {
  const c = pct >= 95 ? "var(--proof-green)" : pct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{
        width: 52, height: 3, background: "var(--proof-hover)",
        borderRadius: 99, overflow: "hidden", flexShrink: 0,
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: c, borderRadius: 99,
        }} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 800, fontFamily: "var(--font-mono)", color: c, letterSpacing: "-0.6px", minWidth: 34, textAlign: "right" }}>
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

  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const envFilteredRuns = envSnap.envIds.length > 0 ? getRunsByEnv(envSnap.envIds) : RUNS;

  React.useEffect(() => {
    const interval = setInterval(() => {}, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = envFilteredRuns.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (suiteFilter !== "all" && r.suiteId !== suiteFilter) return false;
    if (envFilter !== "all" && !r.env.toUpperCase().startsWith(envFilter.toUpperCase())) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.id.toLowerCase().includes(q) && !r.env.toLowerCase().includes(q) && !r.suiteId.toLowerCase().includes(q))
        return false;
    }
    return true;
  });

  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 30;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // reset page on filter change
  const filterKey = `${search}|${statusFilter}|${suiteFilter}|${envFilter}`;
  const prevFilterKey = React.useRef(filterKey);
  if (prevFilterKey.current !== filterKey) {
    prevFilterKey.current = filterKey;
    if (page !== 1) setPage(1);
  }

  // Collect unique suites + envs for filter chips
  const suites = [...new Set(envFilteredRuns.map((r) => r.suiteId).filter(Boolean))].sort();
  const envs = ["QA", "UAT", "PROD"];

  const failCount = envFilteredRuns.filter((r) => ["FAIL", "PARTIAL", "ERROR", "FLAKY"].includes(r.status)).length;
  const runningCount = envFilteredRuns.filter((r) => r.status === "RUNNING").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", animation: "page-enter 0.22s ease-out both" }}>

      {/* ── Page header ────────────────────────────────────────── */}
      <div style={{
        padding: "13px 20px 11px",
        borderBottom: "1px solid var(--proof-border)",
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: "var(--proof-text)", margin: 0, letterSpacing: "-0.5px" }}>
              Run History
            </h1>
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
          </div>
          <p style={{ fontSize: 11.5, color: "var(--proof-text-muted)", margin: "2px 0 0" }}>
            {envFilteredRuns.length} total · Playwright + pytest across all environments
          </p>
        </div>
        <button
          onClick={() => window.open("https://github.com/ruake/AWARE/actions/workflows/run-tests.yml", "_blank")}
          className="proof-button-primary"
        >
          <Play size={12} /> Start Run <ExternalLink size={10} style={{ opacity: 0.7 }} />
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div style={{
        padding: "8px 20px",
        borderBottom: "1px solid var(--proof-border)",
        flexShrink: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        background: "var(--proof-surface)",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Search size={12} style={{
            position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
            color: "var(--proof-text-muted)", pointerEvents: "none",
          }} />
          <input
            className="proof-input"
            style={{ paddingLeft: 26, width: 180, height: 26, fontSize: 12 }}
            placeholder="Search runs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "var(--proof-text-muted)",
              padding: 1, display: "flex", lineHeight: 1,
            }}>
              <X size={10} />
            </button>
          )}
        </div>

        <div style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }} />

        {/* Status filters */}
        <span style={{ fontSize: 10, color: "var(--proof-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", flexShrink: 0 }}>Status:</span>
        {(["PASS", "FAIL", "PARTIAL", "FLAKY", "RUNNING"] as Run["status"][]).map((s) => (
          <FilterChip key={s} label={STATUS_CFG[s].label} value={s} active={statusFilter === s} onSelect={setStatusFilter} />
        ))}

        <div style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }} />

        {/* Env filters */}
        <span style={{ fontSize: 10, color: "var(--proof-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", flexShrink: 0 }}>Env:</span>
        {envs.map((e) => (
          <FilterChip key={e} label={e} value={e} active={envFilter === e} onSelect={setEnvFilter} />
        ))}

        {/* Active filter clear */}
        {(search || statusFilter !== "all" || suiteFilter !== "all" || envFilter !== "all") && (
          <>
            <div style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }} />
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); setSuiteFilter("all"); setEnvFilter("all"); }}
              className="proof-button-ghost"
              style={{ fontSize: 11, color: "var(--proof-text-muted)" }}
            >
              <X size={10} /> Clear filters
            </button>
          </>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <PanelErrorBoundary label="Runs table">
          {paginated.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              height: 200, gap: 8, color: "var(--proof-text-muted)", fontSize: 13,
            }}>
              <SlidersHorizontal size={20} style={{ opacity: 0.4 }} />
              <span>No runs match your filters</span>
              <button onClick={() => { setSearch(""); setStatusFilter("all"); setSuiteFilter("all"); setEnvFilter("all"); }}
                className="proof-button proof-button-sm">Clear filters</button>
            </div>
          ) : (
            <table className="proof-table" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 24 }} />
                <col style={{ width: 210 }} />
                <col style={{ width: 170 }} />
                <col style={{ width: 170 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr>
                  <th />
                  <th>Run ID</th>
                  <th>Suite</th>
                  <th>Environment</th>
                  <th>Result</th>
                  <th>Duration</th>
                  <th>When</th>
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
                    >
                      {/* Color stripe */}
                      <td style={{ padding: 0, width: 3 }}>
                        <div style={{ width: 3, height: "100%", minHeight: 40, background: cfg.color, borderRadius: "0 2px 2px 0" }} />
                      </td>

                      {/* Run ID */}
                      <td>
                        <Link
                          href={`/runs/${run.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
                            color: "var(--proof-blue-bright)", textDecoration: "none",
                            display: "flex", alignItems: "center", gap: 5,
                          }}
                        >
                          {isRunning && <Loader2 size={11} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />}
                          {run.id}
                        </Link>
                        <div style={{ fontSize: 10, color: "var(--proof-text-muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                          {run.build}{run.rev ? ` · ${run.rev.slice(0, 7)}` : ""}
                        </div>
                      </td>

                      {/* Suite */}
                      <td>
                        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--proof-text-secondary)", fontWeight: 500 }}>
                          {run.suiteId}
                        </span>
                      </td>

                      {/* Environment */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <EnvBadge env={run.env} />
                          <span style={{ fontSize: 11.5, color: "var(--proof-text-secondary)" }}>{run.env}</span>
                        </div>
                      </td>

                      {/* Result */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: "var(--proof-radius-full)",
                            fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1px",
                            color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                            width: "fit-content",
                          }}>
                            {isRunning && <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} />}
                            {cfg.label}
                          </span>
                          {!isRunning && <PassBar pct={run.passPct} />}
                          {isRunning && run.passPct > 0 && <PassBar pct={run.passPct} />}
                        </div>
                      </td>

                      {/* Duration */}
                      <td>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: isRunning ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)" }}>
                          {isRunning ? "…" : run.duration}
                        </span>
                      </td>

                      {/* When + actions */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11.5, color: "var(--proof-text-muted)" }}>
                            {timeAgo(run.started)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const allRuns = getRuns();
                              const latest = [...allRuns].sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())[0];
                              navigate(`/compare?baseline=${latest?.id ?? ""}&candidate=${run.id}`);
                            }}
                            title="Compare to latest"
                            className="proof-button-ghost"
                            style={{ padding: "2px 5px", opacity: 0.7 }}
                          >
                            <GitCompare size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </PanelErrorBoundary>
      </div>

      {/* ── Pagination ─────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{
          padding: "8px 20px", borderTop: "1px solid var(--proof-border)",
          display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
          background: "var(--proof-surface)", fontSize: 12, color: "var(--proof-text-muted)",
        }}>
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div style={{ flex: 1 }} />
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="proof-button proof-button-sm"
            style={{ opacity: page === 1 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = totalPages <= 7 ? i + 1 : i < 3 ? i + 1 : i === 3 ? page : totalPages - 2 + (i - 4);
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={p === page ? "proof-button-primary proof-button-sm" : "proof-button proof-button-sm"}
                style={{ minWidth: 30, padding: "3px 6px" }}
              >
                {p}
              </button>
            );
          })}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="proof-button proof-button-sm"
            style={{ opacity: page === totalPages ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}

      {Toast}
    </div>
  );
}

import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { CTAStatCard } from "@/components/aware/CTAStatCard";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { RUNS } from "@/lib/data";
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

function statusBadge(status: Run["status"]) {
  const map: Record<string, { cls: string; label: string }> = {
    PASS:    { cls: "proof-badge-pass",    label: "PASS"    },
    FAIL:    { cls: "proof-badge-fail",    label: "FAIL"    },
    PARTIAL: { cls: "proof-badge-partial", label: "PARTIAL" },
    FLAKY:   { cls: "proof-badge-flaky",   label: "FLAKY"   },
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
      fontSize: 9,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.3px",
      color: isProd ? "var(--proof-green)" : "#d97706",
      background: isProd ? "var(--proof-green-bg)" : "var(--proof-yellow-bg)",
      border: `1px solid ${isProd ? "rgba(34,197,94,0.2)" : "rgba(217,119,6,0.2)"}`,
      padding: "1px 5px",
      borderRadius: 3,
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
    }}>
      {isProd ? <Globe size={7} /> : <Network size={7} />}
      {network}
    </span>
  );
}

function RunRow({
  run,
  isSelected,
  onNavigate,
}: {
  run: Run;
  isSelected: boolean;
  onNavigate: (path: string) => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected
          ? "var(--proof-blue-bg)"
          : hovered
          ? "rgba(255,255,255,0.025)"
          : undefined,
        borderLeft: isSelected ? "3px solid var(--proof-blue)" : "3px solid transparent",
        cursor: "pointer",
        transition: "background 0.12s ease",
      }}
      onClick={() => onNavigate(`/runs/${run.id}`)}
    >
      {/* Run: ID + build on two lines */}
      <td style={{ verticalAlign: "middle" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--proof-blue)",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 220,
              display: "block",
            }}
          >
            {run.id}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--proof-text-muted)", whiteSpace: "nowrap" }}>
            {run.build} · {run.rev?.slice(0, 7)}
          </span>
        </div>
      </td>

      {/* Suite / Env */}
      <td style={{ verticalAlign: "middle" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {run.suite}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "var(--proof-text-secondary)", whiteSpace: "nowrap" }}>
              {run.env}
            </span>
            <NetworkBadge network={run.network} />
          </div>
        </div>
      </td>

      {/* Result */}
      <td style={{ verticalAlign: "middle" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {statusBadge(run.status)}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--proof-text-secondary)", whiteSpace: "nowrap" }}>
            <span style={{ color: run.passPct === 100 ? "var(--proof-green)" : run.passPct < 90 ? "var(--proof-red)" : "var(--proof-text)", fontWeight: 700 }}>
              {run.passPct}%
            </span>
            {" · "}
            <span style={{ color: run.failures > 0 ? "var(--proof-red)" : "var(--proof-text-secondary)" }}>
              {run.failures > 0 ? `${run.failures}✗` : "0 fail"}
            </span>
          </span>
        </div>
      </td>

      {/* When */}
      <td style={{ verticalAlign: "middle" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-text-secondary)", whiteSpace: "nowrap" }}>
            {run.duration}
          </span>
          <span style={{ fontSize: 10, color: "var(--proof-text-muted)", whiteSpace: "nowrap" }}>
            {new Date(run.started).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td style={{ verticalAlign: "middle" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 5 }}>
          <button
            onClick={() => onNavigate(`/runs/${run.id}`)}
            className="proof-button"
            style={{ fontSize: 11, padding: "3px 8px", whiteSpace: "nowrap" }}
          >
            Detail
          </button>
          <button
            onClick={() => onNavigate(`/compare?baseline=${RUNS[RUNS.length - 1]?.id}&candidate=${run.id}`)}
            className="proof-button"
            style={{ fontSize: 11, padding: "3px 8px", display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}
          >
            <GitCompare size={11} /> Compare
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Runs() {
  const [, navigate] = useLocation();
  const { Toast } = useSimpleToast();
  const [search, setSearch] = useSyncedUrlState("q", "");
  const [statusFilter, setStatusFilter] = useSyncedUrlState("status", "all");
  const [suiteFilter, setSuiteFilter] = useSyncedUrlState("suite", "all");
  const [envFilter, setEnvFilter] = useSyncedUrlState("env", "all");
  const [selectedIdx, setSelectedIdx] = React.useState(-1);
  const selectedRunIdRef = React.useRef<string | null>(null);

  const envs = [...new Set(RUNS.map((r) => r.env))].sort();
  const suites = [...new Set(RUNS.map((r) => r.suite))].sort();

  const filtered = RUNS.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (suiteFilter !== "all" && r.suite !== suiteFilter) return false;
    if (envFilter !== "all" && r.env !== envFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.id.toLowerCase().includes(q) &&
        !r.env.toLowerCase().includes(q) &&
        !r.suite.toLowerCase().includes(q) &&
        !r.target.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const hasActiveFilters =
    statusFilter !== "all" || suiteFilter !== "all" || envFilter !== "all" || search !== "";

  // Keyboard nav (j/k/Enter)
  React.useEffect(() => {
    setSelectedIdx(-1);
  }, [filtered.length]);

  React.useEffect(() => {
    if (selectedIdx >= 0 && selectedIdx < filtered.length) {
      selectedRunIdRef.current = filtered[selectedIdx].id;
    } else {
      selectedRunIdRef.current = null;
    }
  }, [selectedIdx, filtered]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.target instanceof HTMLSelectElement) return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const id = selectedRunIdRef.current;
        if (id) navigate(`/runs/${id}`);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered.length, navigate]);

  return (
    <AppLayout activeHref="/runs">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Regression Runs</h1>
            <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 3 }}>
              {RUNS.length} runs · All GitHub Actions executions across QA / UAT / PROD
            </p>
          </div>
          <button
            onClick={() => navigate("/start")}
            className="proof-button-primary"
            style={{ fontSize: 13 }}
          >
            <Play size={14} /> Start New Run
          </button>
        </div>

        {/* Stat cards — clickable CTA filters */}
        <PanelErrorBoundary label="Stats cards">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            <CTAStatCard
              label="Total Runs"
              value={RUNS.length}
              subtitle="all environments"
              accentColor="var(--proof-blue)"
              icon={<BarChart3 size={16} />}
              onClick={() => { setStatusFilter("all"); setEnvFilter("all"); setSuiteFilter("all"); setSearch(""); }}
              active={statusFilter === "all" && envFilter === "all" && suiteFilter === "all" && search === ""}
            />
            <CTAStatCard
              label="Passing"
              value={RUNS.filter((r) => r.status === "PASS").length}
              subtitle="successful runs"
              accentColor="var(--proof-green)"
              icon={<CheckCircle2 size={16} />}
              onClick={() => setStatusFilter("PASS")}
              active={statusFilter === "PASS"}
            />
            <CTAStatCard
              label="Failing"
              value={RUNS.filter((r) => r.status === "FAIL").length}
              subtitle="need attention"
              accentColor="var(--proof-red)"
              icon={<XCircle size={16} />}
              onClick={() => setStatusFilter("FAIL")}
              active={statusFilter === "FAIL"}
            />
            <CTAStatCard
              label="Avg Duration"
              value={`${Math.round(RUNS.reduce((s, r) => s + r.durationMs, 0) / RUNS.length / 60000)}m`}
              subtitle="per run"
              accentColor="var(--proof-text-secondary)"
              icon={<Clock size={16} />}
            />
          </div>
        </PanelErrorBoundary>

        {/* Filter bar */}
        <PanelErrorBoundary label="Filters">
          <div
            className="proof-card"
            style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 200px", minWidth: 160 }}>
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
              <select className="proof-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="FLAKY">FLAKY</option>
              </select>
            </div>
            <select className="proof-input" value={suiteFilter} onChange={(e) => setSuiteFilter(e.target.value)}>
              <option value="all">All suites</option>
              {suites.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="proof-input" value={envFilter} onChange={(e) => setEnvFilter(e.target.value)}>
              <option value="all">All environments</option>
              {envs.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            {hasActiveFilters && (
              <button
                onClick={() => { setStatusFilter("all"); setSuiteFilter("all"); setEnvFilter("all"); setSearch(""); }}
                style={{ fontSize: 11, color: "var(--proof-red)", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}
              >
                <X size={12} /> Clear
              </button>
            )}
            <span style={{ fontSize: 12, color: "var(--proof-text-secondary)", marginLeft: "auto", whiteSpace: "nowrap" }}>
              {filtered.length} of {RUNS.length}
            </span>
          </div>
        </PanelErrorBoundary>

        {/* Active filter badges */}
        {hasActiveFilters && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>Filters:</span>
            {statusFilter !== "all" && (
              <span className="proof-badge proof-badge-skip" style={{ fontSize: 10, cursor: "pointer" }} onClick={() => setStatusFilter("all")}>
                status={statusFilter} <X size={10} style={{ marginLeft: 3 }} />
              </span>
            )}
            {suiteFilter !== "all" && (
              <span className="proof-badge proof-badge-skip" style={{ fontSize: 10, cursor: "pointer" }} onClick={() => setSuiteFilter("all")}>
                suite={suiteFilter} <X size={10} style={{ marginLeft: 3 }} />
              </span>
            )}
            {envFilter !== "all" && (
              <span className="proof-badge proof-badge-skip" style={{ fontSize: 10, cursor: "pointer" }} onClick={() => setEnvFilter("all")}>
                env={envFilter} <X size={10} style={{ marginLeft: 3 }} />
              </span>
            )}
          </div>
        )}

        {/* Table — normal flow (no virtualizer), table-layout: fixed for consistent column widths */}
        <PanelErrorBoundary label="Runs table">
          <div className="proof-card" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table
                className="proof-table"
                style={{ tableLayout: "fixed", width: "100%", minWidth: 820 }}
              >
                <colgroup>
                  <col />
                  <col style={{ width: 220 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 155 }} />
                </colgroup>
                <thead style={{ position: "sticky", top: 0, background: "var(--proof-surface)", zIndex: 10 }}>
                  <tr>
                    <th>Run</th>
                    <th>Suite / Env</th>
                    <th>Result</th>
                    <th>When</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((run, idx) => (
                    <RunRow
                      key={run.id}
                      run={run}
                      isSelected={selectedIdx === idx}
                      onNavigate={navigate}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "40px 32px", color: "var(--proof-text-secondary)", fontSize: 13 }}>
                        No runs match your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </PanelErrorBoundary>

        <div style={{ fontSize: 11, color: "var(--proof-text-muted)", textAlign: "right" }}>
          ↑↓ / j·k to navigate · Enter to open
        </div>
      </div>
      {Toast}
    </AppLayout>
  );
}

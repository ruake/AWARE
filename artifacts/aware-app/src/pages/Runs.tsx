import React from "react";
import { useLocation } from "wouter";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AppLayout } from "@/components/aware/AppLayout";
import { CTAStatCard } from "@/components/aware/CTAStatCard";
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
  Share2,
  X,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";

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

export default function Runs() {
  const [, navigate] = useLocation();
  const { show, Toast } = useSimpleToast();
  const [search, setSearch] = useSyncedUrlState("q", "");
  const [statusFilter, setStatusFilter] = useSyncedUrlState("status", "all");
  const [suiteFilter, setSuiteFilter] = useSyncedUrlState("suite", "all");
  const [envFilter, setEnvFilter] = useSyncedUrlState("env", "all");
  const [selectedIdx, setSelectedIdx] = React.useState(-1);
  const selectedRunIdRef = React.useRef<string | null>(null);

  const envs = [...new Set(RUNS.map((r) => r.env))];
  const suites = [...new Set(RUNS.map((r) => r.suite))];
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

  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });

  React.useEffect(() => {
    setSelectedIdx(-1);
  }, [filtered.length]);

  React.useEffect(() => {
    if (selectedIdx >= 0 && selectedIdx < filtered.length) {
      selectedRunIdRef.current = filtered[selectedIdx].id;
      rowVirtualizer.scrollToIndex(selectedIdx, { align: "center" });
    } else {
      selectedRunIdRef.current = null;
    }
  }, [selectedIdx, filtered, rowVirtualizer]);

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
      <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Regression Runs</h1>
            <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 3 }}>
              {RUNS.length} runs · All GitHub Actions executions
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
              <button
              onClick={() => navigate("/start")}
              className="proof-button-primary"
              style={{ fontSize: 13 }}
            >
              <Play size={14} /> Start New Run
            </button>
          </div>
        </div>

        {/* Stats — clickable CTA cards */}
        <PanelErrorBoundary label="Stats cards">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            <CTAStatCard
              label="Total Runs"
              value={RUNS.length}
              subtitle="all environments"
              accentColor="var(--proof-blue)"
              icon={<BarChart3 size={16} />}
              onClick={() => {
                setStatusFilter("all");
                setEnvFilter("all");
                setSuiteFilter("all");
                setSearch("");
                navigate("/runs");
              }}
              active={
                statusFilter === "all" &&
                envFilter === "all" &&
                suiteFilter === "all" &&
                search === ""
              }
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

        {/* Filters */}
        <PanelErrorBoundary label="Filters">
          <div
            className="proof-card"
            style={{
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
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
                placeholder="Search run ID, env, suite, target…"
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
                <X size={12} /> Clear filters
              </button>
            )}
            <span
              style={{ fontSize: 12, color: "var(--proof-text-secondary)", marginLeft: "auto" }}
            >
              {filtered.length} of {RUNS.length} runs
            </span>
          </div>
        </PanelErrorBoundary>

        {/* Active filter badges */}
        {(statusFilter !== "all" || suiteFilter !== "all" || envFilter !== "all") && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
              Active filters:
            </span>
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

        {/* Table */}
        <PanelErrorBoundary label="Runs table">
          <div
            className="proof-card"
            style={{
              overflow: "hidden",
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              ref={tableContainerRef}
              style={{ flex: 1, overflow: "auto", position: "relative" }}
            >
              <table className="proof-table" style={{ position: "relative" }}>
                <colgroup>
                  <col />
                  <col style={{ width: 220 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 130 }} />
                </colgroup>
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "var(--proof-surface)",
                    zIndex: 10,
                  }}
                >
                  <tr>
                    <th>Run</th>
                    <th>Suite / Env</th>
                    <th>Result</th>
                    <th>When</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ position: "relative", height: rowVirtualizer.getTotalSize() }}>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const run = filtered[virtualRow.index];
                    const isKbSelected = selectedIdx === virtualRow.index;
                    return (
                      <tr
                        key={run.id}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: virtualRow.size,
                          transform: `translateY(${virtualRow.start}px)`,
                          borderLeft: isKbSelected ? "3px solid var(--proof-blue)" : undefined,
                          background: isKbSelected ? "var(--proof-blue-bg)" : undefined,
                        }}
                      >
                        {/* Run: ID + build/rev */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <button
                              onClick={() => navigate(`/runs/${run.id}`)}
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                color: "var(--proof-blue)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 500,
                                padding: 0,
                                textAlign: "left",
                              }}
                            >
                              {run.id}
                            </button>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--proof-text-muted)" }}>
                              {run.build} · {run.rev}
                            </span>
                          </div>
                        </td>
                        {/* Suite / Env: suite on top, target·env·network below */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500 }}>{run.suite}</span>
                            <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
                              {run.target} · {run.env}
                              {run.network && (
                                <span style={{
                                  marginLeft: 5,
                                  fontSize: 9,
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  color: run.network === "production" ? "var(--proof-green)" : "#d97706",
                                  background: run.network === "production" ? "var(--proof-green-bg)" : "var(--proof-yellow-bg)",
                                  padding: "1px 4px",
                                  borderRadius: 3,
                                }}>
                                  {run.network}
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        {/* Result: status badge on top, pass%·failures below */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {statusBadge(run.status)}
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--proof-text-secondary)" }}>
                              <span style={{ color: run.passPct === 100 ? "var(--proof-green)" : run.passPct < 90 ? "var(--proof-red)" : "var(--proof-text)", fontWeight: 700 }}>
                                {run.passPct}%
                              </span>
                              {" · "}
                              <span style={{ color: run.failures > 0 ? "var(--proof-red)" : "var(--proof-text-secondary)" }}>
                                {run.failures > 0 ? `${run.failures} fail` : "0 fail"}
                              </span>
                            </span>
                          </div>
                        </td>
                        {/* When: duration on top, started below */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-text-secondary)" }}>{run.duration}</span>
                            <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>
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
                        <td>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button
                              onClick={() => navigate(`/runs/${run.id}`)}
                              className="proof-button"
                              style={{ fontSize: 11, padding: "3px 8px" }}
                            >
                              Detail
                            </button>
                            <button
                              onClick={() => navigate(`/compare?baseline=${RUNS[RUNS.length - 1]?.id}&candidate=${run.id}`)}
                              className="proof-button"
                              style={{ fontSize: 11, padding: "3px 8px" }}
                            >
                              <GitCompare size={11} /> Compare
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr style={{ position: "absolute", top: 0, left: 0, width: "100%" }}>
                      <td
                        colSpan={11}
                        style={{
                          textAlign: "center",
                          padding: "32px",
                          color: "var(--proof-text-secondary)",
                          fontSize: 13,
                        }}
                      >
                        No runs match your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </PanelErrorBoundary>

      </div>
      {Toast}
    </AppLayout>
  );
}

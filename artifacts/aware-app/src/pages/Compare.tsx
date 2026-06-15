import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { CTAStatCard } from "@/components/aware/CTAStatCard";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { CompareRunSelector } from "@/components/aware/CompareRunSelector";
import { CompareSidePanel } from "@/components/aware/CompareSidePanel";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useSyncedUrlState } from "@/lib/urlState";
import {
  RUNS,
  DIFF_ROWS,
  computeDiffRows,
  getDataInitState,
  subscribeToDataInit,
  getSelectedEnvSnapshot,
  subscribeToSelectedEnv,
  getRunsByEnv,
} from "@/lib/data";
import { loadResultsForRun } from "@/lib/runsLoader";
import type { DiffRow, TestResult } from "@/lib/types";
import {
  Link2,
  Github,
  Share2,
  Zap,
  Search,
  XCircle,
  CheckCircle2,
  Clock,
  Minus,
} from "lucide-react";
import type { Run } from "@/lib/types";

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function stateBadge(state: DiffRow["state"]) {
  const map: Record<string, { color: string; label: string }> = {
    regression: { color: "var(--proof-red)", label: "Regression" },
    fixed: { color: "var(--proof-green)", label: "Fixed" },
    duration: { color: "var(--proof-yellow)", label: "Duration ↑" },
    unchanged: { color: "var(--proof-text-secondary)", label: "Unchanged" },
    fishy: { color: "var(--proof-purple)", label: "Fishy ⚠" },
  };
  const s = map[state] ?? { color: "var(--proof-text-secondary)", label: state };
  return <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</span>;
}

export default function Compare() {
  const [, navigate] = useLocation();
  const { show, Toast } = useSimpleToast();
  const initState = useSyncExternalStore(subscribeToDataInit, getDataInitState);
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);

  const envRuns = envSnap.envIds.length > 0 ? getRunsByEnv(envSnap.envIds) : RUNS;
  const [baseline, setBaseline] = useSyncedUrlState(
    "baseline",
    envRuns[envRuns.length - 1]?.id ?? "",
  );
  const [candidate, setCandidate] = useSyncedUrlState("candidate", envRuns[0]?.id ?? "");
  const [selectedId, setSelectedId] = useSyncedUrlState<string | null>("sel", null);
  const [searchText, setSearchText] = useSyncedUrlState("q", "");
  const [regressionsOnly, setRegressionsOnly] = useSyncedUrlState("regressions", false);
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);
  const [swapped, setSwapped] = React.useState(false);
  const [selectedIdx, setSelectedIdx] = React.useState(-1);
  const [computedRows, setComputedRows] = React.useState<DiffRow[]>(DIFF_ROWS);
  const [baseResults, setBaseResults] = React.useState<TestResult[]>([]);
  const [candResults, setCandResults] = React.useState<TestResult[]>([]);
  const baselineRun = RUNS.find((r) => r.id === baseline);
  const candidateRun = RUNS.find((r) => r.id === candidate);

  React.useEffect(() => {
    if (!baseline || !candidate) return;
    Promise.all([loadResultsForRun(baseline), loadResultsForRun(candidate)]).then(([br, cr]) => {
      setBaseResults(br);
      setCandResults(cr);
      setComputedRows(computeDiffRows(baseline, candidate));
    });
  }, [baseline, candidate]);

  const diffs = React.useMemo(() => {
    const rows = computedRows;
    if (!swapped) return rows;
    return rows.map((d) => {
      const state: DiffRow["state"] =
        d.state === "regression" ? "fixed" : d.state === "fixed" ? "regression" : d.state;
      return {
        ...d,
        state,
        baseStatus: d.candStatus,
        candStatus: d.baseStatus,
        durBase: d.durCand,
        durCand: d.durBase,
      };
    });
  }, [computedRows, swapped]);

  const [colFilters, setColFilters] = React.useState<Record<string, string>>({});

  const filtered = React.useMemo(() => {
    return diffs.filter((d) => {
      if (searchText && !d.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (regressionsOnly && d.state !== "regression") return false;
      if (activeFilter && d.state !== activeFilter) return false;
      for (const [field, val] of Object.entries(colFilters)) {
        if (!val) continue;
        const cell = String((d as unknown as Record<string, unknown>)[field] ?? "").toLowerCase();
        if (!cell.includes(val.toLowerCase())) return false;
      }
      return true;
    });
  }, [diffs, searchText, regressionsOnly, activeFilter, colFilters]);

  const clampedIdx = selectedIdx >= filtered.length ? -1 : selectedIdx;

  React.useEffect(() => {
    if (clampedIdx >= 0 && clampedIdx < filtered.length) {
      setSelectedId(filtered[clampedIdx].id);
    }
  }, [clampedIdx, filtered, setSelectedId, selectedIdx]);

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
      } else if (e.key === "r") {
        setRegressionsOnly((p) => !p);
        setActiveFilter(null);
      } else if (e.key === "f") {
        setActiveFilter((p) => (p === "fixed" ? null : "fixed"));
        setRegressionsOnly(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, navigate, setRegressionsOnly, setActiveFilter, selectedIdx]);

  if (envSnap.envIds.length > 0 && envRuns.length < 2) {
    if (initState.loading) {
      return (
        <div style={{ textAlign: "center", padding: 64 }}>
          <div
            className="proof-skeleton"
            style={{ width: 48, height: 48, borderRadius: "50%", margin: "0 auto 16px" }}
          />
          <div
            className="proof-skeleton"
            style={{ width: 240, height: 16, borderRadius: 4, margin: "0 auto 8px" }}
          />
          <div
            className="proof-skeleton"
            style={{ width: 160, height: 12, borderRadius: 4, margin: "0 auto" }}
          />
          <div style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 16 }}>
            Loading comparison data...
          </div>
        </div>
      );
    }
    return (
      <div style={{ textAlign: "center", padding: 64 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text)" }}>
          Not enough runs
        </h2>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 8 }}>
          Need at least 2 runs in the selected environment to compare.
        </p>
        <button
          onClick={() => navigate("/runs")}
          className="proof-button"
          style={{ fontSize: 13, marginTop: 16 }}
        >
          View Runs
        </button>
      </div>
    );
  }

  if (!baselineRun || !candidateRun) {
    if (initState.loading) {
      return (
        <div style={{ textAlign: "center", padding: 64 }}>
          <div
            className="proof-skeleton"
            style={{ width: 48, height: 48, borderRadius: "50%", margin: "0 auto 16px" }}
          />
          <div
            className="proof-skeleton"
            style={{ width: 240, height: 16, borderRadius: 4, margin: "0 auto 8px" }}
          />
          <div
            className="proof-skeleton"
            style={{ width: 160, height: 12, borderRadius: 4, margin: "0 auto" }}
          />
          <div style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 16 }}>
            Loading comparison data...
          </div>
        </div>
      );
    }
    return (
      <div style={{ textAlign: "center", padding: 64 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text)" }}>
          No runs to compare
        </h2>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 8 }}>
          At least two runs are required for comparison.
        </p>
        <button
          onClick={() => navigate("/runs")}
          className="proof-button"
          style={{ fontSize: 13, marginTop: 16 }}
        >
          View Runs
        </button>
      </div>
    );
  }

  const regressions = diffs.filter((d) => d.state === "regression");
  const fixed = diffs.filter((d) => d.state === "fixed");
  const duration = diffs.filter((d) => d.state === "duration");
  const unchanged = diffs.filter((d) => d.state === "unchanged");
  const categories = [...new Set(DIFF_ROWS.map((d) => d.category))];

  const selectedDiff = selectedId ? (diffs.find((d) => d.id === selectedId) ?? null) : null;
  const hasActiveFilters = Object.values(colFilters).some((v) => v);

  return (
    <div className="proof-page" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PanelErrorBoundary label="Run selectors">
        <div
          className="proof-card"
          style={{
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <CompareRunSelector
            label="Baseline Run"
            labelColor="var(--proof-text-secondary)"
            value={baseline}
            onChange={(id) => {
              setBaseline(id);
              setSwapped(false);
            }}
            accentColor="var(--proof-text-secondary)"
            runs={envRuns}
          />
          <button
            onClick={() => {
              const t = baseline;
              setBaseline(candidate);
              setCandidate(t);
              setSwapped(false);
            }}
            className="proof-button proof-button-sm"
            style={{ marginTop: 16, flexShrink: 0 }}
          >
            ⇄ Swap
          </button>
          <CompareRunSelector
            label="Candidate Run"
            labelColor="var(--proof-blue)"
            value={candidate}
            onChange={(id) => {
              setCandidate(id);
              setSwapped(false);
            }}
            accentColor="var(--proof-blue)"
            runs={envRuns}
          />
          <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 16, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                copy(window.location.href);
                show("Permalink copied");
              }}
              className="proof-button proof-button-sm"
            >
              <Link2 size={13} /> Permalink
            </button>
            <button
              onClick={() => {
                copy(
                  `Comparison: ${baseline} vs ${candidate}\nNew failures: ${regressions.length}\nFixed: ${fixed.length}\nDuration regressions: ${duration.length}`,
                );
                show("Slack summary copied");
              }}
              className="proof-button proof-button-sm"
            >
              <Share2 size={13} /> Share
            </button>
            <button
              onClick={() => {
                copy(
                  `## Regression Report\n**Baseline:** ${baseline}\n**Candidate:** ${candidate}\n\n### Regressions (${regressions.length})\n${regressions.map((r) => `- ${r.name}`).join("\n")}\n\n### Fixed (${fixed.length})\n${fixed.map((r) => `- ${r.name}`).join("\n")}`,
                );
                show("Markdown report copied");
              }}
              className="proof-button proof-button-sm"
            >
              <Github size={13} /> Report
            </button>
          </div>
        </div>
      </PanelErrorBoundary>

      <PanelErrorBoundary label="Stat cards">
        <div
          className="proof-stagger"
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}
        >
          {[
            {
              label: "New Failures",
              value: `+${regressions.length}`,
              color: "var(--proof-red)",
              key: "regression",
            },
            {
              label: "Fixed",
              value: `+${fixed.length}`,
              color: "var(--proof-green)",
              key: "fixed",
            },
            {
              label: "Duration Regressions",
              value: `+${duration.length}`,
              color: "var(--proof-yellow)",
              key: "duration",
            },
            {
              label: "Unchanged",
              value: unchanged.length,
              color: "var(--proof-text-secondary)",
              key: "unchanged",
            },
          ].map((tile) => {
            const iconMap: Record<string, React.ReactNode> = {
              regression: <XCircle size={16} />,
              fixed: <CheckCircle2 size={16} />,
              duration: <Clock size={16} />,
              unchanged: <Minus size={16} />,
            };
            return (
              <CTAStatCard
                key={tile.label}
                label={tile.label}
                value={tile.value}
                accentColor={tile.color}
                icon={iconMap[tile.key]}
                active={activeFilter === tile.key}
                onClick={() => {
                  if (activeFilter === tile.key) setActiveFilter(null);
                  else {
                    setActiveFilter(tile.key);
                    setRegressionsOnly(false);
                  }
                }}
              />
            );
          })}
        </div>
      </PanelErrorBoundary>

      <div
        style={{
          background: "var(--proof-grey-bg)",
          border: "1px solid var(--proof-grey)",
          borderRadius: 4,
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 11,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: "var(--proof-text-secondary)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.3px",
          }}
        >
          Comparison
        </span>
        <span className="proof-badge proof-badge-skip" style={{ fontSize: 9 }}>
          {baselineRun.envId} / {baselineRun.env}
        </span>
        <span
          className={`proof-badge ${baselineRun.network === "production" ? "proof-badge-pass" : "proof-badge-flaky"}`}
          style={{ fontSize: 9 }}
        >
          {baselineRun.network}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--proof-text-secondary)",
          }}
        >
          Build {baselineRun.build}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--proof-text-secondary)",
          }}
        >
          Rev {baselineRun.rev}
        </span>
        <span style={{ color: "var(--proof-grey)", fontSize: 12 }}>|</span>
        <span className="proof-badge proof-badge-skip" style={{ fontSize: 9 }}>
          {candidateRun.envId} / {candidateRun.env}
        </span>
        <span
          className={`proof-badge ${candidateRun.network === "production" ? "proof-badge-pass" : "proof-badge-flaky"}`}
          style={{ fontSize: 9 }}
        >
          {candidateRun.network}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--proof-text-secondary)",
          }}
        >
          Build {candidateRun.build}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--proof-text-secondary)",
          }}
        >
          Rev {candidateRun.rev}
        </span>
        {regressions.length > 0 ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "var(--proof-red-bg)",
              border: "1px solid var(--proof-red)",
              borderRadius: 3,
              padding: "1px 6px",
              fontSize: 10,
            }}
          >
            <span
              className="proof-badge proof-badge-fail"
              style={{ fontSize: 8, padding: "0 4px" }}
            >
              {regressions.length}
            </span>{" "}
            Blocked
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              color: "var(--proof-green)",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            <Zap size={10} /> Ready to promote
          </span>
        )}
        <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
          {diffs.length} tests
        </span>
      </div>

      <PanelErrorBoundary label="Diff area">
        <div style={{ display: "flex", gap: 14 }}>
          <div
            className="proof-card"
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              minHeight: 420,
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid var(--proof-grey)",
                background: "var(--proof-grey-bg)",
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
                flexShrink: 0,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 140 }}
              >
                <Search size={13} style={{ color: "var(--proof-text-secondary)" }} />
                <input
                  className="proof-input"
                  placeholder="Search tests…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ flex: 1, minWidth: 0 }}
                />
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <input
                  type="checkbox"
                  checked={regressionsOnly}
                  onChange={(e) => {
                    setRegressionsOnly(e.target.checked);
                    setActiveFilter(null);
                  }}
                />
                Regressions only
              </label>
              {hasActiveFilters && (
                <button
                  onClick={() => setColFilters({})}
                  style={{
                    fontSize: 11,
                    color: "var(--proof-red)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Clear filters
                </button>
              )}
              <span
                style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginLeft: "auto" }}
              >
                {filtered.length}/{diffs.length} tests
              </span>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <table className="proof-table">
                <colgroup>
                  <col />
                  <col />
                  <col />
                  <col />
                  <col />
                  <col />
                </colgroup>
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    background: "var(--proof-surface)",
                  }}
                >
                  <tr>
                    <th>
                      <input
                        className="proof-input"
                        placeholder="Name"
                        value={colFilters.name ?? ""}
                        onChange={(e) => setColFilters((f) => ({ ...f, name: e.target.value }))}
                        style={{ width: "100%", fontSize: 10, padding: "2px 6px" }}
                      />
                    </th>
                    <th>
                      <select
                        className="proof-input"
                        style={{ fontSize: 10, padding: "2px 6px", width: "100%" }}
                        value={colFilters.baseStatus ?? ""}
                        onChange={(e) =>
                          setColFilters((f) => ({ ...f, baseStatus: e.target.value }))
                        }
                      >
                        <option value="">Baseline</option>
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                      </select>
                    </th>
                    <th>
                      <select
                        className="proof-input"
                        style={{ fontSize: 10, padding: "2px 6px", width: "100%" }}
                        value={colFilters.candStatus ?? ""}
                        onChange={(e) =>
                          setColFilters((f) => ({ ...f, candStatus: e.target.value }))
                        }
                      >
                        <option value="">Candidate</option>
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                      </select>
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        fontSize: 10,
                        color: "var(--proof-text-secondary)",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Δ Duration
                    </th>
                    <th>
                      <select
                        className="proof-input"
                        style={{ fontSize: 10, padding: "2px 6px", width: "100%" }}
                        value={colFilters.category ?? ""}
                        onChange={(e) => setColFilters((f) => ({ ...f, category: e.target.value }))}
                      >
                        <option value="">Category</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th>
                      <select
                        className="proof-input"
                        style={{ fontSize: 10, padding: "2px 6px", width: "100%" }}
                        value={colFilters.state ?? ""}
                        onChange={(e) => setColFilters((f) => ({ ...f, state: e.target.value }))}
                      >
                        <option value="">State</option>
                        <option value="regression">Regression</option>
                        <option value="fixed">Fixed</option>
                        <option value="duration">Duration ↑</option>
                        <option value="unchanged">Unchanged</option>
                      </select>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => {
                    const isSelected = selectedId === d.id;
                    const deltams = d.durCand - d.durBase;
                    return (
                      <tr
                        key={d.id}
                        onClick={() => {
                          setSelectedId(isSelected ? null : d.id);
                          setSelectedIdx(isSelected ? -1 : i);
                        }}
                        style={{
                          cursor: "pointer",
                          background: isSelected
                            ? "var(--proof-blue-bg)"
                            : d.state === "regression"
                              ? "rgba(217,48,37,0.04)"
                              : d.state === "fixed"
                                ? "rgba(30,142,62,0.04)"
                                : undefined,
                          outline: isSelected ? "2px solid var(--proof-blue)" : "none",
                          outlineOffset: -2,
                        }}
                      >
                        <td
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--proof-blue)",
                            fontWeight: 500,
                          }}
                        >
                          {d.name}
                        </td>
                        <td>
                          <span
                            className={`proof-badge ${d.baseStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
                          >
                            {d.baseStatus}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`proof-badge ${d.candStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
                          >
                            {d.candStatus}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                          }}
                        >
                          {Math.abs(deltams) > 20 ? (
                            <span
                              style={{
                                color: deltams > 0 ? "var(--proof-red)" : "var(--proof-green)",
                                fontWeight: 700,
                              }}
                            >
                              {deltams > 0 ? "+" : ""}
                              {deltams}ms
                            </span>
                          ) : (
                            <span style={{ color: "var(--proof-text-secondary)" }}>~0ms</span>
                          )}
                        </td>
                        <td>
                          <span className="proof-badge proof-badge-skip" style={{ fontSize: 10 }}>
                            {d.category}
                          </span>
                        </td>
                        <td>{stateBadge(d.state)}</td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && initState.loading && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "28px" }}>
                        <div
                          className="proof-skeleton"
                          style={{ width: 160, height: 14, borderRadius: 4, margin: "0 auto" }}
                        />
                      </td>
                    </tr>
                  )}
                  {filtered.length === 0 && !initState.loading && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          padding: "28px",
                          color: "var(--proof-text-secondary)",
                          fontSize: 13,
                        }}
                      >
                        No tests match your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {selectedDiff && selectedId && (
            <CompareSidePanel
              diff={selectedDiff}
              diffs={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              navigate={navigate}
              baseResult={baseResults.find((r) => r.testCaseId === selectedDiff.id) ?? null}
              candResult={candResults.find((r) => r.testCaseId === selectedDiff.id) ?? null}
            />
          )}
        </div>
      </PanelErrorBoundary>
      {Toast}
    </div>
  );
}

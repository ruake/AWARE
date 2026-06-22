import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PageTemplate, StateBadge } from "@/components/aware";
import { CompareSidePanel } from "@/components/aware/CompareSidePanel";
import { useSyncedUrlState } from "@/lib/urlState";
import {
  computeDiffRows,
  getDataInitState,
  subscribeToDataInit,
  subscribeToRuns,
  getRuns,
  subscribeToDiffRows,
  getDiffRows,
} from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { loadResultsForRun } from "@/lib/runsLoader";
import type { DiffRow, TestResult } from "@/lib/types";
import { setCompareStats } from "@/lib/sidebarData";
import { Search, ArrowLeftRight } from "lucide-react";
import { CompareRunsHeader } from "@/components/aware/CompareSummary";
import { CompareRunSelector } from "@/components/aware/CompareRunSelector";

export default function Compare() {
  const [, navigate] = useLocation();
  const initState = useSyncExternalStore(subscribeToDataInit, getDataInitState);
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const runs = useSyncExternalStore(subscribeToRuns, getRuns);
  const diffRowsSnapshot = useSyncExternalStore(subscribeToDiffRows, getDiffRows);

  const envRuns =
    envSnap.envIds.length > 0 ? runs.filter((r) => envSnap.envIds.includes(r.envId)) : runs;
  const [baseline, setBaseline] = useSyncedUrlState("baseline", "");
  const [candidate, setCandidate] = useSyncedUrlState("candidate", "");
  const [selectedName, setSelectedName] = useSyncedUrlState<string | null>("sel", null);
  const [searchText, setSearchText] = useSyncedUrlState("q", "");
  const [regressionsOnly, setRegressionsOnly] = useSyncedUrlState("regressions", false);
  const [activeFilter, setActiveFilter] = useSyncedUrlState<string | null>("filter", null);
  const [swapped, setSwapped] = React.useState(false);
  const [selectedIdx, setSelectedIdx] = React.useState(-1);
  const [computedRows, setComputedRows] = React.useState<DiffRow[]>([]);
  const [baseResults, setBaseResults] = React.useState<TestResult[]>([]);
  const [candResults, setCandResults] = React.useState<TestResult[]>([]);
  const [resultsLoading, setResultsLoading] = React.useState(false);
  const [diffPage, setDiffPage] = React.useState(1);
  const DIFF_PAGE_SIZE = 25;
  // Derive effective run IDs: use URL param if set, otherwise pick from envRuns
  const effectiveBaseline = baseline || envRuns[envRuns.length - 1]?.id || "";
  const effectiveCandidate = candidate || envRuns[0]?.id || "";
  const baselineRun = runs.find((r) => r.id === effectiveBaseline);
  const candidateRun = runs.find((r) => r.id === effectiveCandidate);

  React.useEffect(() => {
    if (!effectiveBaseline || !effectiveCandidate) return;
    setResultsLoading(true);
    Promise.all([loadResultsForRun(effectiveBaseline), loadResultsForRun(effectiveCandidate)])
      .then(([br, cr]) => {
        setBaseResults(br);
        setCandResults(cr);
        setComputedRows(computeDiffRows(effectiveBaseline, effectiveCandidate));
      })
      .catch((err: unknown) => {
        console.warn("[AWARE] Compare: failed to load run results", err);
      })
      .finally(() => {
        setResultsLoading(false);
      });
  }, [effectiveBaseline, effectiveCandidate]);

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

  const hasRegressions = diffs.some((d) => d.state === "regression");

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

  const impactScores = React.useMemo(() => {
    const scores: Record<string, number> = {
      regression: 10,
      fixed: -5,
      duration: 3,
      unchanged: 0,
      fishy: 2,
    };
    return scores;
  }, []);

  const sortedFiltered = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      const scoreA = impactScores[a.state] ?? 0;
      const scoreB = impactScores[b.state] ?? 0;
      return scoreB - scoreA;
    });
  }, [filtered, impactScores]);

  const diffTotalPages = Math.max(1, Math.ceil(sortedFiltered.length / DIFF_PAGE_SIZE));
  const safeDiffPage = Math.min(diffPage, diffTotalPages);
  const paginatedDiffs = sortedFiltered.slice(
    (safeDiffPage - 1) * DIFF_PAGE_SIZE,
    safeDiffPage * DIFF_PAGE_SIZE,
  );

  const diffStats = React.useMemo(() => {
    const regressions = diffs.filter((d) => d.state === "regression").length;
    const fixed = diffs.filter((d) => d.state === "fixed").length;
    const duration = diffs.filter((d) => d.state === "duration").length;
    const unchanged = diffs.filter((d) => d.state === "unchanged").length;
    const fishy = diffs.filter((d) => d.state === "fishy").length;
    const basePass = baseResults.filter((r) => r.status === "PASS").length;
    const candPass = candResults.filter((r) => r.status === "PASS").length;
    const basePct = baseResults.length > 0 ? Math.round((basePass / baseResults.length) * 100) : 0;
    const candPct = candResults.length > 0 ? Math.round((candPass / candResults.length) * 100) : 0;
    const delta = candPct - basePct;
    return [
      {
        label: `Total (${diffs.length})`,
        value: diffs.length.toString(),
        color: "var(--proof-text-secondary)",
        key: "total",
        count: diffs.length,
      },
      {
        label: `Regression (${regressions})`,
        value: regressions.toString(),
        color: regressions > 0 ? "var(--proof-red)" : "var(--proof-green)",
        key: "regression",
        count: regressions,
      },
      {
        label: `Fixed (${fixed})`,
        value: fixed.toString(),
        color: "var(--proof-green)",
        key: "fixed",
        count: fixed,
      },
      {
        label: `Duration (${duration})`,
        value: duration.toString(),
        color: "var(--proof-yellow)",
        key: "duration",
        count: duration,
      },
      {
        label: `Unchanged (${unchanged})`,
        value: unchanged.toString(),
        color: "var(--proof-text-muted)",
        key: "unchanged",
        count: unchanged,
      },
      {
        label: `Fishy (${fishy})`,
        value: fishy.toString(),
        color: "var(--proof-purple)",
        key: "fishy",
        count: fishy,
      },
      {
        label: "Pass Rate Δ",
        value: `${delta >= 0 ? "+" : ""}${delta}%`,
        color: delta >= 0 ? "var(--proof-green)" : "var(--proof-red)",
        key: "passRateDelta",
        count: Math.abs(delta),
      },
    ];
  }, [diffs, baseResults, candResults]);

  React.useEffect(() => {
    setCompareStats(diffStats, activeFilter);
  }, [diffStats, activeFilter]);

  const clampedIdx = selectedIdx >= filtered.length ? -1 : selectedIdx;

  React.useEffect(() => {
    if (clampedIdx >= 0 && clampedIdx < filtered.length) {
      setSelectedName(filtered[clampedIdx].name);
    }
  }, [clampedIdx, filtered, setSelectedName, selectedIdx]);

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

  const handleBaselineChange = (id: string) => {
    setBaseline(id);
    navigate(`/compare?baseline=${id}&candidate=${effectiveCandidate}`);
  };

  const handleCandidateChange = (id: string) => {
    setCandidate(id);
    navigate(`/compare?baseline=${effectiveBaseline}&candidate=${id}`);
  };

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

  if (!baselineRun || !candidateRun) return null;

  const categories = [...new Set(diffRowsSnapshot.map((d) => d.category))];

  const selectedDiff = selectedName ? (diffs.find((d) => d.name === selectedName) ?? null) : null;
  const hasActiveFilters = Object.values(colFilters).some((v) => v);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        <AnimatePresence>
          {swapped && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                background: "var(--proof-blue-bg)",
                color: "var(--proof-blue)",
                padding: "6px 16px",
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid var(--proof-blue-border)",
                overflow: "hidden",
              }}
            >
              <ArrowLeftRight size={14} />
              <span>Runs swapped — Candidate is now the baseline</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div style={{ padding: "20px 24px 16px", background: "var(--proof-surface)", borderBottom: "1px solid var(--proof-border)" }}>
          <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <CompareRunSelector
                label="Baseline Run"
                labelColor="var(--proof-text-secondary)"
                value={effectiveBaseline}
                onChange={handleBaselineChange}
                runs={envRuns}
                accentColor="var(--proof-blue)"
              />
            </div>
            <div style={{ paddingBottom: 10 }}>
              <button
                onClick={() => setSwapped((s) => !s)}
                className="proof-button-ghost"
                title="Swap baseline and candidate"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--proof-grey-bg)",
                  border: "1px solid var(--proof-border)",
                }}
              >
                <ArrowLeftRight size={14} />
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <CompareRunSelector
                label="Candidate Run"
                labelColor="var(--proof-text-secondary)"
                value={effectiveCandidate}
                onChange={handleCandidateChange}
                runs={envRuns}
                accentColor="var(--proof-blue)"
              />
            </div>
          </div>
        </div>
      </div>
      <PageTemplate
        title="Compare Runs"
        subtitle={`${baselineRun?.id ?? "—"} vs ${candidateRun?.id ?? "—"} · ${filtered.length}/${diffs.length} tests`}
        filters={
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: "1 1 200px",
                minWidth: 200,
                background: "var(--proof-grey-bg)",
                borderRadius: 8,
                padding: "0 12px",
                border: "1px solid var(--proof-border)",
              }}
            >
              <Search size={14} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
              <input
                className="proof-input"
                placeholder="Search tests…"
                aria-label="Search tests"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ border: "none", background: "transparent", padding: "8px 0", width: "100%", fontSize: 13 }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", overflowX: "auto", padding: "2px 0" }}>
              {(["regression", "fixed", "duration", "unchanged"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveFilter(activeFilter === s ? null : s)}
                  className={`proof-badge ${activeFilter === s ? `proof-badge-${s === 'regression' ? 'fail' : s === 'fixed' ? 'pass' : s === 'duration' ? 'flaky' : 'skip'}` : ''}`}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "full",
                    border: "1px solid var(--proof-border)",
                    background: activeFilter === s ? undefined : "var(--proof-surface)",
                    color: activeFilter === s ? undefined : "var(--proof-text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.1s ease",
                    whiteSpace: "nowrap"
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)} <span style={{ opacity: 0.6, marginLeft: 4 }}>{diffs.filter(d => d.state === s).length}</span>
                </button>
              ))}
            </div>
            {hasRegressions && activeFilter !== "regression" && (
              <button
                onClick={() => {
                  setActiveFilter("regression");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="proof-button-ghost"
                style={{ fontSize: 11, color: "var(--proof-red)", fontWeight: 700, padding: "4px 8px" }}
              >
                Jump to Regressions
              </button>
            )}
            {hasActiveFilters && (
              <button
                onClick={() => setColFilters({})}
                className="proof-button-ghost"
                style={{ fontSize: 11, color: "var(--proof-red)", fontWeight: 600 }}
              >
                Reset
              </button>
            )}
          </>
        }
        isEmpty={filtered.length === 0 && !initState.loading && !resultsLoading}
        emptyMessage="No differences found between these runs. Both runs have identical test outcomes."
        loading={(sortedFiltered.length === 0 && initState.loading) || resultsLoading}
        loadingCols={7}
        sidePanel={
          selectedDiff && selectedName ? (
            <CompareSidePanel
              diff={selectedDiff}
              diffs={filtered}
              selectedId={selectedDiff.id}
              onSelect={(id) =>
                setSelectedName(id ? (diffs.find((d) => d.id === id)?.name ?? null) : null)
              }
              navigate={navigate}
              baseResult={baseResults.find((r) => r.name === selectedDiff.name) ?? null}
              candResult={candResults.find((r) => r.name === selectedDiff.name) ?? null}
            />
          ) : undefined
        }
        sidePanelWidth={480}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CompareRunsHeader 
            diffs={diffs}
            baseResults={baseResults}
            candResults={candResults}
          />
        </motion.div>

        <div className="proof-card" style={{ overflow: "hidden" }}>
          <table className="proof-table">
            <colgroup>
              <col />
              <col style={{ width: 120 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ fontSize: 11, fontWeight: 700, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    Test Name
                  </div>
                </th>
                <th style={{ fontSize: 11, fontWeight: 700, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Baseline
                </th>
                <th style={{ fontSize: 11, fontWeight: 700, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Candidate
                </th>
                <th
                  style={{
                    textAlign: "right",
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--proof-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Δ Duration
                </th>
                <th
                  style={{
                    textAlign: "right",
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--proof-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Impact
                </th>
                <th style={{ fontSize: 11, fontWeight: 700, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Category
                </th>
                <th style={{ fontSize: 11, fontWeight: 700, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  State
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedDiffs.map((d, i) => {
                const isSel = selectedName === d.name;
                const rowBg = d.state === 'regression' ? 'var(--proof-red-bg)' : 
                             d.state === 'fixed' ? 'var(--proof-green-bg)' : 
                             isSel ? 'var(--proof-blue-bg)' : undefined;
                
                return (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    onClick={() => {
                      setSelectedName(d.name);
                      setSelectedIdx(filtered.findIndex(f => f.name === d.name));
                    }}
                    style={{
                      cursor: "pointer",
                      background: rowBg,
                      borderLeft: isSel ? `4px solid var(--proof-blue)` : `4px solid transparent`,
                      transition: "all 0.15s ease",
                    }}
                    className={isSel ? "" : "proof-tr-hover"}
                  >
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--proof-text)" }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{d.id}</div>
                    </td>
                    <td>
                      <StateBadge state={d.baseStatus === "PASS" ? "unchanged" : "regression"} />
                    </td>
                    <td>
                      <StateBadge state={d.candStatus === "PASS" ? "fixed" : "regression"} />
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      <span style={{ 
                        color: d.durCand - d.durBase > 50 ? "var(--proof-red)" : 
                               d.durCand - d.durBase < -50 ? "var(--proof-green)" : 
                               "var(--proof-text-secondary)" 
                      }}>
                        {d.durCand - d.durBase > 0 ? "+" : ""}{d.durCand - d.durBase}ms
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>
                        {impactScores[d.state]}
                      </div>
                    </td>
                    <td>
                      <span className="proof-badge proof-badge-skip" style={{ fontSize: 10 }}>{d.category}</span>
                    </td>
                    <td>
                      <StateBadge state={d.state} />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {diffTotalPages > 1 && (
          <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
            <button
              disabled={safeDiffPage === 1}
              onClick={() => setDiffPage(p => p - 1)}
              className="proof-button-ghost"
              style={{ padding: "6px 12px" }}
            >
              Previous
            </button>
            <span style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>
              Page {safeDiffPage} of {diffTotalPages}
            </span>
            <button
              disabled={safeDiffPage === diffTotalPages}
              onClick={() => setDiffPage(p => p + 1)}
              className="proof-button-ghost"
              style={{ padding: "6px 12px" }}
            >
              Next
            </button>
          </div>
        )}
      </PageTemplate>
    </>
  );
}

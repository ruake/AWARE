import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
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
import { Search } from "lucide-react";

export default function Compare() {
  const [, navigate] = useLocation();
  const initState = useSyncExternalStore(subscribeToDataInit, getDataInitState);
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const runs = useSyncExternalStore(subscribeToRuns, getRuns);
  const diffRowsSnapshot = useSyncExternalStore(subscribeToDiffRows, getDiffRows);

  const envRuns =
    envSnap.envIds.length > 0 ? runs.filter((r) => envSnap.envIds.includes(r.envId)) : runs;
  const [baseline] = useSyncedUrlState("baseline", "");
  const [candidate] = useSyncedUrlState("candidate", "");
  const [selectedName, setSelectedName] = useSyncedUrlState<string | null>("sel", null);
  const [searchText, setSearchText] = useSyncedUrlState("q", "");
  const [regressionsOnly, setRegressionsOnly] = useSyncedUrlState("regressions", false);
  const [activeFilter, setActiveFilter] = useSyncedUrlState<string | null>("filter", null);
  const [swapped, setSwapped] = React.useState(false);
  const [selectedIdx, setSelectedIdx] = React.useState(-1);
  const [computedRows, setComputedRows] = React.useState<DiffRow[]>([]);
  const [baseResults, setBaseResults] = React.useState<TestResult[]>([]);
  const [candResults, setCandResults] = React.useState<TestResult[]>([]);
  const [diffPage, setDiffPage] = React.useState(1);
  const DIFF_PAGE_SIZE = 25;
  // Derive effective run IDs: use URL param if set, otherwise pick from envRuns
  const effectiveBaseline = baseline || envRuns[envRuns.length - 1]?.id || "";
  const effectiveCandidate = candidate || envRuns[0]?.id || "";
  const baselineRun = runs.find((r) => r.id === effectiveBaseline);
  const candidateRun = runs.find((r) => r.id === effectiveCandidate);

  React.useEffect(() => {
    if (!effectiveBaseline || !effectiveCandidate) return;
    Promise.all([loadResultsForRun(effectiveBaseline), loadResultsForRun(effectiveCandidate)]).then(
      ([br, cr]) => {
        setBaseResults(br);
        setCandResults(cr);
        setComputedRows(computeDiffRows(effectiveBaseline, effectiveCandidate));
      },
    ).catch(() => {});
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

  const diffTotalPages = Math.max(1, Math.ceil(filtered.length / DIFF_PAGE_SIZE));
  const safeDiffPage = Math.min(diffPage, diffTotalPages);
  const paginatedDiffs = filtered.slice(
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
        label: "Total",
        value: diffs.length.toString(),
        color: "var(--proof-text-secondary)",
        key: "total",
        count: diffs.length,
      },
      {
        label: "Regressions",
        value: regressions.toString(),
        color: regressions > 0 ? "var(--proof-red)" : "var(--proof-green)",
        key: "regression",
        count: regressions,
      },
      {
        label: "Fixed",
        value: fixed.toString(),
        color: "var(--proof-green)",
        key: "fixed",
        count: fixed,
      },
      {
        label: "Duration ↑",
        value: duration.toString(),
        color: "var(--proof-yellow)",
        key: "duration",
        count: duration,
      },
      {
        label: "Unchanged",
        value: unchanged.toString(),
        color: "var(--proof-text-muted)",
        key: "unchanged",
        count: unchanged,
      },
      {
        label: "Fishy",
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
      <PageTemplate
        title="Compare Runs"
        subtitle={`${baselineRun?.id ?? "—"} vs ${candidateRun?.id ?? "—"} · ${filtered.length}/${diffs.length} tests`}
        filters={
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 200px", minWidth: 140 }}>
              <Search size={13} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
              <input
                className="proof-input"
                placeholder="Search tests…"
                aria-label="Search tests"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ flex: 1, minWidth: 0 }}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={regressionsOnly}
                onChange={(e) => { setRegressionsOnly(e.target.checked); setActiveFilter(null); }}
              />
              Regressions only
            </label>
            <button
              onClick={() => setSwapped((s) => !s)}
              className="proof-button-ghost"
              title="Swap baseline and candidate"
              style={{ fontSize: 11, whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}
            >
              ⇄ Swap
            </button>
            {hasActiveFilters && (
              <button onClick={() => setColFilters({})} className="proof-button-ghost" style={{ fontSize: 11, color: "var(--proof-red)" }}>
                Clear column filters
              </button>
            )}
            {diffStats.length > 0 && (
              <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginLeft: "auto" }}>
                {filtered.length}/{diffs.length} tests
              </span>
            )}
          </>
        }
        isEmpty={filtered.length === 0 && !initState.loading}
        emptyMessage="No tests match your filters"
        loading={filtered.length === 0 && initState.loading}
        loadingCols={6}
        sidePanel={selectedDiff && selectedName ? (
          <CompareSidePanel
            diff={selectedDiff}
            diffs={filtered}
            selectedId={selectedDiff.id}
            onSelect={(id) => setSelectedName(id ? diffs.find((d) => d.id === id)?.name ?? null : null)}
            navigate={navigate}
            baseResult={baseResults.find((r) => r.name === selectedDiff.name) ?? null}
            candResult={candResults.find((r) => r.name === selectedDiff.name) ?? null}
          />
        ) : undefined}
        sidePanelWidth={440}
      >
        <table className="proof-table">
          <colgroup>
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--proof-surface)" }}>
            <tr>
              <th>
                <input
                  className="proof-input"
                  placeholder="Name"
                  aria-label="Filter by test name"
                  value={colFilters.name ?? ""}
                  onChange={(e) => setColFilters((f) => ({ ...f, name: e.target.value }))}
                  style={{ width: "100%", fontSize: 10, padding: "2px 6px" }}
                />
              </th>
              <th>
                <select
                  className="proof-input"
                  style={{ fontSize: 10, padding: "2px 6px", width: "100%" }}
                  aria-label="Filter by baseline status"
                  value={colFilters.baseStatus ?? ""}
                  onChange={(e) => setColFilters((f) => ({ ...f, baseStatus: e.target.value }))}
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
                  aria-label="Filter by candidate status"
                  value={colFilters.candStatus ?? ""}
                  onChange={(e) => setColFilters((f) => ({ ...f, candStatus: e.target.value }))}
                >
                  <option value="">Candidate</option>
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                </select>
              </th>
              <th style={{ textAlign: "right", fontSize: 10, color: "var(--proof-text-secondary)", fontWeight: 600, whiteSpace: "nowrap" }}>
                Δ Duration
              </th>
              <th>
                <select
                  className="proof-input"
                  style={{ fontSize: 10, padding: "2px 6px", width: "100%" }}
                  aria-label="Filter by category"
                  value={colFilters.category ?? ""}
                  onChange={(e) => setColFilters((f) => ({ ...f, category: e.target.value }))}
                >
                  <option value="">Category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </th>
              <th>
                <select
                  className="proof-input"
                  style={{ fontSize: 10, padding: "2px 6px", width: "100%" }}
                  aria-label="Filter by state"
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
            {paginatedDiffs.map((d, i) => {
              const absIdx = (safeDiffPage - 1) * DIFF_PAGE_SIZE + i;
              const isSelected = selectedName === d.name;
              const deltams = d.durCand - d.durBase;
              return (
                <tr
                  key={d.id}
                  onClick={() => {
                    setSelectedName(isSelected ? null : d.name);
                    setSelectedIdx(isSelected ? -1 : absIdx);
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
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-blue)", fontWeight: 500, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={d.name}>
                    {d.name}
                  </td>
                  <td>
                    <span className={`proof-badge ${d.baseStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}>
                      {d.baseStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`proof-badge ${d.candStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}>
                      {d.candStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    {Math.abs(deltams) > 20 ? (
                      <span style={{ color: deltams > 0 ? "var(--proof-red)" : "var(--proof-green)", fontWeight: 700 }}>
                        {deltams > 0 ? "+" : ""}{deltams}ms
                      </span>
                    ) : (
                      <span style={{ color: "var(--proof-text-secondary)" }}>~0ms</span>
                    )}
                  </td>
                  <td>
                    <span className="proof-badge proof-badge-skip" style={{ fontSize: 10 }}>{d.category}</span>
                  </td>
                  <td><StateBadge state={d.state} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </PageTemplate>
      {diffTotalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 0 4px", fontSize: 12 }}>
          <button
            disabled={safeDiffPage <= 1}
            onClick={() => setDiffPage((p) => Math.max(1, p - 1))}
            className="proof-button proof-button-xs"
          >Prev</button>
          <span style={{ color: "var(--proof-text-secondary)" }}>
            Page {safeDiffPage} of {diffTotalPages}
          </span>
          <button
            disabled={safeDiffPage >= diffTotalPages}
            onClick={() => setDiffPage((p) => Math.min(diffTotalPages, p + 1))}
            className="proof-button proof-button-xs"
          >Next</button>
        </div>
      )}
    </>
  );
}

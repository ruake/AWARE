import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CompareSidePanel } from "@/components/aware/CompareSidePanel";
import { useSyncedUrlState } from "@/lib/urlState";
import {
  computeDiffRows, getDataInitState, subscribeToDataInit,
  subscribeToRuns, getRuns, subscribeToDiffRows, getDiffRows,
} from "@/lib/data";
import { loadResultsForRun } from "@/lib/runsLoader";
import type { DiffRow, TestResult } from "@/lib/types";
import {
  Search, ArrowLeftRight, CheckCircle2, XCircle, AlertTriangle,
  Clock, Minus, ChevronLeft, ChevronRight, Loader2, GitCompare, Activity,
} from "lucide-react";
import { CompareRunsHeader } from "@/components/aware/CompareSummary";
import { CompareRunSelector } from "@/components/aware/CompareRunSelector";
import { Pagination } from "@/components/aware";

const DIFF_STATE_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  regression: { label: "Regression", color: "var(--proof-red)", bg: "var(--proof-red-bg)", border: "var(--proof-red-border)", icon: <AlertTriangle size={12} /> },
  fixed: { label: "Fixed", color: "var(--proof-green)", bg: "var(--proof-green-bg)", border: "var(--proof-green-border)", icon: <CheckCircle2 size={12} /> },
  duration: { label: "Slower", color: "var(--proof-yellow)", bg: "var(--proof-yellow-bg)", border: "var(--proof-yellow-border)", icon: <Clock size={12} /> },
  fishy: { label: "Fishy", color: "var(--proof-orange)", bg: "var(--proof-orange-bg)", border: "var(--proof-orange-border)", icon: <AlertTriangle size={12} /> },
  unchanged: { label: "Unchanged", color: "var(--proof-text-muted)", bg: "var(--proof-subtle-bg)", border: "var(--proof-border)", icon: <Minus size={12} /> },
};

function StatePill({ state }: { state: string }) {
  const cfg = DIFF_STATE_CFG[state] ?? DIFF_STATE_CFG.unchanged;
  return (
    <span className="proof-badge" style={{
      color: cfg.color, background: cfg.bg, borderColor: cfg.border,
      fontFamily: "var(--font-mono)", fontSize: 10
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function StatusTag({ status }: { status: string }) {
  if (!status) return <span style={{ color: "var(--proof-text-muted)" }}>—</span>;
  const isPass = status === "PASS";
  return (
    <span className={`proof-badge ${isPass ? 'proof-badge-healthy' : 'proof-badge-critical'}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
      {status}
    </span>
  );
}

function FilterChip({ label, active, count, onClick }: { label: string; active: boolean; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
        borderRadius: "var(--proof-radius-full)",
        border: `1px solid ${active ? "var(--proof-blue-border)" : "var(--proof-border)"}`,
        background: active ? "var(--proof-blue-bg)" : "var(--proof-surface-2)",
        color: active ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
        fontSize: 12, fontWeight: active ? 600 : 500, cursor: "pointer",
        transition: "all var(--proof-transition)", fontFamily: "var(--font-sans)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--proof-hover)";
          e.currentTarget.style.color = "var(--proof-text)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--proof-surface-2)";
          e.currentTarget.style.color = "var(--proof-text-secondary)";
        }
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, fontFamily: "var(--font-mono)", paddingLeft: 2 }}>{count}</span>
      )}
    </button>
  );
}

export default function Compare() {
  const [, navigate] = useLocation();
  const initState = useSyncExternalStore(subscribeToDataInit, getDataInitState);
  const runs = useSyncExternalStore(subscribeToRuns, getRuns);

  // Compare always shows ALL runs regardless of global env filter
  // so users can compare runs across different environments
  const envRuns = runs;
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

  const effectiveBaseline = baseline || envRuns[envRuns.length - 1]?.id || "";
  const effectiveCandidate = candidate || envRuns[0]?.id || "";
  const baselineRun = runs.find((r) => r.id === effectiveBaseline);
  const candidateRun = runs.find((r) => r.id === effectiveCandidate);

  const swapRuns = () => {
    const b = effectiveBaseline;
    const c = effectiveCandidate;
    setBaseline(c);
    setCandidate(b);
    setSwapped((p) => !p);
  };

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
        if (import.meta.env.DEV) {
          console.warn("[AWARE] Compare failed:", err);
        }
      })
      .finally(() => setResultsLoading(false));
  }, [effectiveBaseline, effectiveCandidate]);

  const diffs = React.useMemo(() => {
    const rows = computedRows;
    if (!swapped) return rows;
    return rows.map((d) => ({
      ...d,
      state: d.state === "regression" ? "fixed" : d.state === "fixed" ? "regression" : d.state,
      baseStatus: d.candStatus, candStatus: d.baseStatus,
      durBase: d.durCand, durCand: d.durBase,
    } as DiffRow));
  }, [computedRows, swapped]);

  const filtered = React.useMemo(() => {
    return diffs.filter((d) => {
      if (searchText && !d.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (regressionsOnly && d.state !== "regression") return false;
      if (activeFilter && activeFilter !== "total" && d.state !== activeFilter) return false;
      return true;
    });
  }, [diffs, searchText, regressionsOnly, activeFilter]);

  const impactOrder = { regression: 3, fishy: 2, duration: 1, fixed: 0, unchanged: -1 };
  const sortedFiltered = React.useMemo(() =>
    [...filtered].sort((a, b) => ((impactOrder[b.state as keyof typeof impactOrder] ?? 0) - (impactOrder[a.state as keyof typeof impactOrder] ?? 0))),
    [filtered]);

  const diffTotalPages = Math.max(1, Math.ceil(sortedFiltered.length / DIFF_PAGE_SIZE));
  const safeDiffPage = Math.min(diffPage, diffTotalPages);
  const paginatedDiffs = sortedFiltered.slice((safeDiffPage - 1) * DIFF_PAGE_SIZE, safeDiffPage * DIFF_PAGE_SIZE);

  const counts = React.useMemo(() => ({
    total: diffs.length,
    regression: diffs.filter((d) => d.state === "regression").length,
    fixed: diffs.filter((d) => d.state === "fixed").length,
    duration: diffs.filter((d) => d.state === "duration").length,
    unchanged: diffs.filter((d) => d.state === "unchanged").length,
    fishy: diffs.filter((d) => d.state === "fishy").length,
  }), [diffs]);

  const basePass = baseResults.filter((r) => r.status === "PASS").length;
  const candPass = candResults.filter((r) => r.status === "PASS").length;
  const basePct = baseResults.length > 0 ? Math.round((basePass / baseResults.length) * 100) : (baselineRun?.passPct ?? 0);
  const candPct = candResults.length > 0 ? Math.round((candPass / candResults.length) * 100) : (candidateRun?.passPct ?? 0);
  const passRateDelta = candPct - basePct;

  const selectedRow = selectedIdx >= 0 ? sortedFiltered[selectedIdx] ?? null : null;
  const selectedTestResult = selectedRow
    ? candResults.find((r) => r.name === selectedRow.name) ?? baseResults.find((r) => r.name === selectedRow.name) ?? null
    : null;

  const filterLabels = [
    { key: "total", label: "All" },
    { key: "regression", label: "Regressions" },
    { key: "fixed", label: "Fixed" },
    { key: "duration", label: "Slower" },
    { key: "fishy", label: "Fishy" },
    { key: "unchanged", label: "Unchanged" },
  ];

  return (
    <motion.div 
      className="proof-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: "easeOut", duration: 0.2 }}
      style={{ padding: "var(--proof-page-py) var(--proof-page-px)", maxWidth: 1600, margin: "0 auto", height: "100%", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--proof-text)", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 10 }}>
          <GitCompare className="text-proof-blue" size={24} />
          Compare Runs
        </h1>
        <p style={{ fontSize: 14, color: "var(--proof-text-secondary)", margin: 0 }}>
          Side-by-side test result diff
        </p>
      </div>

      {/* Run selectors */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto 1fr",
        alignItems: "start", gap: 16, marginBottom: 16,
      }}>
        <div className="proof-card" style={{ padding: 20 }}>
          <CompareRunSelector
            runs={envRuns}
            value={effectiveBaseline}
            onChange={(v) => setBaseline(v)}
            label="Baseline"
            labelColor="var(--proof-text-muted)"
          />
          {baselineRun && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 24, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--proof-text)" }}>
                {basePct}%
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>Pass Rate</span>
                <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>{baselineRun.env} • {baselineRun.network}</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={swapRuns}
          title="Swap runs"
          style={{
            width: 44, height: 44, borderRadius: "50%", alignSelf: "center",
            background: "var(--proof-surface-2)", border: "1px solid var(--proof-border)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--proof-text-muted)", transition: "all var(--proof-transition)",
            flexShrink: 0, marginTop: 16,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-strong)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--proof-surface-2)";
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border)";
          }}
        >
          <ArrowLeftRight size={18} />
        </button>

        <div className="proof-card" style={{ padding: 20 }}>
          <CompareRunSelector
            runs={envRuns}
            value={effectiveCandidate}
            onChange={(v) => setCandidate(v)}
            label="Candidate"
            labelColor="var(--proof-text-muted)"
          />
          {candidateRun && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 24, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--proof-text)", display: "flex", alignItems: "center", gap: 8 }}>
                {candPct}%
                {passRateDelta !== 0 && (
                  <span style={{ 
                    fontSize: 14, 
                    color: passRateDelta > 0 ? "var(--proof-green)" : "var(--proof-red)",
                    background: passRateDelta > 0 ? "var(--proof-green-bg)" : "var(--proof-red-bg)",
                    padding: "2px 8px", borderRadius: "var(--proof-radius-full)",
                  }}>
                    {passRateDelta > 0 ? "+" : ""}{passRateDelta}pp
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>Pass Rate</span>
                <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>{candidateRun.env} • {candidateRun.network}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats pills */}
      {diffs.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {[
            { label: "Regressions", count: counts.regression, color: "var(--proof-red)", bg: "var(--proof-red-bg)", border: "var(--proof-red-border)" },
            { label: "Fixed", count: counts.fixed, color: "var(--proof-green)", bg: "var(--proof-green-bg)", border: "var(--proof-green-border)" },
            { label: "Slower", count: counts.duration, color: "var(--proof-yellow)", bg: "var(--proof-yellow-bg)", border: "var(--proof-yellow-border)" },
            { label: "Fishy", count: counts.fishy, color: "var(--proof-orange)", bg: "var(--proof-orange-bg)", border: "var(--proof-orange-border)" },
            { label: "Unchanged", count: counts.unchanged, color: "var(--proof-text-muted)", bg: "var(--proof-subtle-bg)", border: "var(--proof-border)" },
          ].map((s) => s.count > 0 && (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              borderRadius: "var(--proof-radius-full)", border: `1px solid ${s.border}`,
              background: s.bg, fontSize: 12, fontWeight: 600,
            }}>
              <span style={{ color: s.color, fontWeight: 800, fontFamily: "var(--font-mono)", fontSize: 13 }}>{s.count}</span>
              <span style={{ color: s.color }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main diff content */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {resultsLoading ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            flex: 1, gap: 16, color: "var(--proof-text-muted)",
          }}>
            <Loader2 size={32} className="animate-spin text-proof-blue" />
            <span style={{ fontSize: 14, fontWeight: 500 }}>Comparing test results…</span>
          </div>
        ) : diffs.length === 0 && effectiveBaseline && effectiveCandidate ? (
          <div className="proof-card" style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
          }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--proof-subtle-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GitCompare size={32} style={{ color: "var(--proof-text-muted)" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--proof-text)", marginBottom: 4 }}>No differences found</div>
              <div style={{ fontSize: 14, color: "var(--proof-text-secondary)" }}>These two runs have completely identical test results.</div>
            </div>
          </div>
        ) : diffs.length > 0 ? (
          <div style={{ display: "flex", gap: 20, flex: 1, minHeight: 0 }}>
            {/* Left side: Filters + Table */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, gap: 16 }}>
              {/* Filter bar */}
              <div className="proof-card" style={{ padding: "12px 16px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
                  <Search size={14} style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    color: "var(--proof-text-muted)", pointerEvents: "none",
                  }} />
                  <input
                    value={searchText} onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search test names…"
                    className="proof-input"
                    style={{ paddingLeft: 34, height: 36, borderRadius: "var(--proof-radius-full)" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {filterLabels.map(({ key, label }) => (
                    <FilterChip
                      key={key} label={label}
                      count={key === "total" ? undefined : counts[key as keyof typeof counts]}
                      active={activeFilter === key || (key === "total" && !activeFilter)}
                      onClick={() => setActiveFilter(key === "total" ? null : (activeFilter === key ? null : key))}
                    />
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="proof-card" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 100px 100px 120px",
                  padding: "12px 20px", background: "var(--proof-surface-2)",
                  borderBottom: "1px solid var(--proof-border)",
                  fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.5px", color: "var(--proof-text-muted)",
                }}>
                  <span>Test Name</span>
                  <span>Baseline</span>
                  <span>Candidate</span>
                  <span>State</span>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                  {paginatedDiffs.length === 0 ? (
                    <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--proof-text-muted)", fontSize: 14 }}>
                      No tests match your current filters.
                    </div>
                  ) : (
                    paginatedDiffs.map((row, i) => (
                      <DiffRow
                        key={row.name}
                        row={row}
                        isSelected={selectedName === row.name}
                        onClick={() => {
                          setSelectedName(row.name === selectedName ? null : row.name);
                          setSelectedIdx(i + (safeDiffPage - 1) * DIFF_PAGE_SIZE);
                        }}
                      />
                    ))
                  )}
                </div>
                
                {diffTotalPages > 1 && (
                  <div style={{ padding: "12px 20px", borderTop: "1px solid var(--proof-border)", background: "var(--proof-surface-2)" }}>
                    <Pagination
                      currentPage={safeDiffPage}
                      totalPages={diffTotalPages}
                      totalItems={sortedFiltered.length}
                      pageSize={DIFF_PAGE_SIZE}
                      onPageChange={setDiffPage}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Side panel */}
            <AnimatePresence>
              {selectedRow && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                  style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column" }}
                >
                  <CompareSidePanel
                    diff={selectedRow}
                    diffs={sortedFiltered}
                    selectedId={selectedRow.id ?? selectedRow.name}
                    onSelect={(id) => {
                      if (!id) { setSelectedName(null); setSelectedIdx(-1); return; }
                      const idx = sortedFiltered.findIndex((r) => (r.id ?? r.name) === id);
                      if (idx >= 0) { setSelectedName(sortedFiltered[idx].name); setSelectedIdx(idx); }
                    }}
                    navigate={(href) => { window.location.href = href; }}
                    baseResult={baseResults.find((r) => r.name === selectedRow.name) ?? null}
                    candResult={candResults.find((r) => r.name === selectedRow.name) ?? null}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function DiffRow({ row, isSelected, onClick }: { row: DiffRow; isSelected: boolean; onClick: () => void }) {
  const isReg = row.state === "regression";
  const isFixed = row.state === "fixed";
  
  return (
    <div
      onClick={onClick}
      className="group"
      style={{
        display: "grid", gridTemplateColumns: "1fr 100px 100px 120px",
        padding: "12px 20px", cursor: "pointer",
        borderBottom: "1px solid var(--proof-border-light)",
        background: isSelected ? "var(--proof-surface-active)" : isReg ? "var(--proof-red-bg)" : isFixed ? "var(--proof-green-bg)" : "transparent",
        transition: "background var(--proof-transition)",
        alignItems: "center",
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isReg && !isFixed) e.currentTarget.style.background = "var(--proof-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !isReg && !isFixed) e.currentTarget.style.background = "transparent";
      }}
    >
      <div style={{
        fontSize: 13, fontWeight: 500, color: isSelected ? "var(--proof-blue-bright)" : "var(--proof-text)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontFamily: "var(--font-mono)",
      }}>
        {row.name}
      </div>
      <div><StatusTag status={row.baseStatus} /></div>
      <div><StatusTag status={row.candStatus} /></div>
      <div><StatePill state={row.state} /></div>
    </div>
  );
}

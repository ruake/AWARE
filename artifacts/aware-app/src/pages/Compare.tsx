import React from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CompareSidePanel } from "@/components/aware/CompareSidePanel";
import { useSyncedUrlState } from "@/lib/urlState";
import { logWarn } from "@/lib/ai/debugLogger";
import {
  computeDiffRows, getDataInitState, subscribeToDataInit,
  subscribeToRuns, getRuns
} from "@/lib/data";
import { loadResultsForRun } from "@/lib/runsLoader";
import type { DiffRow, TestResult } from "@/lib/types";
import {
  Search, ArrowLeftRight, CheckCircle2, AlertTriangle,
  Clock, Minus, XCircle, GitCompare, ArrowRight
} from "lucide-react";
import { CompareRunsHeader } from "@/components/aware/CompareSummary";
import { CompareRunSelector } from "@/components/aware/CompareRunSelector";
import { Pagination } from "@/components/aware";

export default function Compare() {
  const [, navigate] = useLocation();
  const initState = React.useSyncExternalStore(subscribeToDataInit, getDataInitState);
  const runs = React.useSyncExternalStore(subscribeToRuns, getRuns);
  
  const envRuns = runs;
  const [baseline, setBaseline] = useSyncedUrlState("baseline", "");
  const [candidate, setCandidate] = useSyncedUrlState("candidate", "");
  const [selectedName, setSelectedName] = useSyncedUrlState<string | null>("sel", null);
  const [searchText, setSearchText] = useSyncedUrlState("q", "");
  const [activeFilter, setActiveFilter] = useSyncedUrlState<string | null>("filter", null);
  const [computedRows, setComputedRows] = React.useState<DiffRow[]>([]);
  const [baseResults, setBaseResults] = React.useState<TestResult[]>([]);
  const [candResults, setCandResults] = React.useState<TestResult[]>([]);

  const effectiveBaseline = baseline || envRuns[envRuns.length - 1]?.id || "";
  const effectiveCandidate = candidate || envRuns[0]?.id || "";
  
  const swapRuns = () => {
    setBaseline(effectiveCandidate);
    setCandidate(effectiveBaseline);
  };

  React.useEffect(() => {
    if (!effectiveBaseline || !effectiveCandidate) return;
    Promise.all([loadResultsForRun(effectiveBaseline), loadResultsForRun(effectiveCandidate)])
      .then(([br, cr]) => {
        setBaseResults(br);
        setCandResults(cr);
        setComputedRows(computeDiffRows(effectiveBaseline, effectiveCandidate));
      })
      .catch((err: unknown) => {
        logWarn("Compare", "Compare failed", String(err));
      });
  }, [effectiveBaseline, effectiveCandidate]);

  const diffs = computedRows;
  const filtered = React.useMemo(() => {
    return diffs.filter((d) => {
      if (searchText && !d.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (activeFilter && activeFilter !== "total" && d.state !== activeFilter) return false;
      return true;
    });
  }, [diffs, searchText, activeFilter]);

  if (initState.error) return <div className="metric-number">ERROR LOADING</div>;

  return (
    <div style={{ padding: "40px 60px", maxWidth: 1800, margin: "0 auto" }}>
      <div style={{ marginBottom: 40, display: "flex", alignItems: "center", gap: 16 }}>
        <GitCompare size={32} style={{ color: "var(--proof-blue)" }} />
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-1px", fontFamily: "var(--font-sans)" }}>FORENSIC COMPARE</h1>
          <div style={{ color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)" }}>BASELINE VS CANDIDATE ANALYSIS</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 32, marginBottom: 40, alignItems: "start" }}>
        <CompareRunSelector
          runs={envRuns}
          value={effectiveBaseline}
          onChange={(v) => setBaseline(v)}
          label="Baseline (Before)"
          labelColor="var(--proof-text-secondary)"
          accentColor="var(--proof-blue)"
        />
        <button
          onClick={swapRuns}
          className="glass-panel"
          style={{ padding: 16, marginTop: 24, cursor: "pointer", border: "1px solid var(--proof-border)" }}
        >
          <ArrowLeftRight size={24} style={{ color: "var(--proof-blue)" }} />
        </button>
        <CompareRunSelector
          runs={envRuns}
          value={effectiveCandidate}
          onChange={(v) => setCandidate(v)}
          label="Candidate (After)"
          labelColor="var(--proof-text-secondary)"
          accentColor="var(--proof-blue)"
        />
      </div>

      {diffs.length > 0 && (
        <CompareRunsHeader diffs={diffs} baseResults={baseResults} candResults={candResults} />
      )}

      <div className="glass-panel" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 24, borderBottom: "1px solid var(--proof-border)", display: "flex", gap: 16, alignItems: "center" }}>
          <input
            className="proof-input"
            placeholder="SEARCH DIFFS..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ fontFamily: "var(--font-mono)", maxWidth: 300 }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 120px", padding: "16px 24px", borderBottom: "1px solid var(--proof-border)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--proof-text-secondary)" }}>
          <span>TEST SIGNAL</span>
          <span>BASELINE</span>
          <span>CANDIDATE</span>
          <span>DELTA</span>
        </div>
        <div>
          {filtered.map((row, i) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={row.name}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 120px 120px",
                padding: "16px 24px",
                borderBottom: "1px solid var(--proof-border-light)",
                borderLeft: row.state === 'regression' ? "4px solid var(--proof-red)" : row.state === 'fixed' ? "4px solid var(--proof-green)" : "4px solid transparent",
                alignItems: "center",
                background: row.state === 'regression' ? "rgba(255,51,85,0.05)" : "transparent",
                cursor: "pointer"
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--proof-text)" }}>{row.name}</span>
              <span className={`proof-badge ${row.baseStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}>{row.baseStatus}</span>
              <span className={`proof-badge ${row.candStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}>{row.candStatus}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "var(--font-mono)", color: row.durCand - row.durBase > 0 ? "var(--proof-red)" : "var(--proof-green)" }}>
                {row.durCand - row.durBase > 0 ? "+" : ""}{row.durCand - row.durBase}ms
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

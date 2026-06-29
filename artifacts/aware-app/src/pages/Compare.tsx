import React from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useSyncedUrlState } from "@/lib/urlState";
import { logWarn } from "@/lib/ai/debugLogger";
import {
  computeDiffRows, getDataInitState, subscribeToDataInit,
  subscribeToRuns, getRuns
} from "@/lib/data";
import { loadResultsForRun } from "@/lib/runsLoader";
import type { DiffRow, TestResult } from "@/lib/types";
import { ArrowLeftRight, GitCompare, AlertCircle, RefreshCcw } from "lucide-react";
import { CompareRunsHeader } from "@/components/aware/CompareSummary";
import { CompareRunSelector } from "@/components/aware/CompareRunSelector";

export default function Compare() {
  useLocation();
  const initState = React.useSyncExternalStore(subscribeToDataInit, getDataInitState);
  const runs = React.useSyncExternalStore(subscribeToRuns, getRuns);
  
  const envRuns = runs;
  const [baseline, setBaseline] = useSyncedUrlState("baseline", "");
  const [candidate, setCandidate] = useSyncedUrlState("candidate", "");
  const [searchText, setSearchText] = useSyncedUrlState("q", "");
  const [activeFilter] = useSyncedUrlState<string | null>("filter", null);
  const [computedRows, setComputedRows] = React.useState<DiffRow[]>([]);
  const [baseResults, setBaseResults] = React.useState<TestResult[]>([]);
  const [candResults, setCandResults] = React.useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const effectiveBaseline = baseline || envRuns[envRuns.length - 1]?.id || "";
  const effectiveCandidate = candidate || envRuns[0]?.id || "";
  
  const swapRuns = () => {
    setBaseline(effectiveCandidate);
    setCandidate(effectiveBaseline);
  };

  const loadData = React.useCallback(() => {
    if (!effectiveBaseline || !effectiveCandidate) return;
    setIsLoading(true);
    setLoadError(null);
    Promise.all([loadResultsForRun(effectiveBaseline), loadResultsForRun(effectiveCandidate)])
      .then(([br, cr]) => {
        setBaseResults(br);
        setCandResults(cr);
        setComputedRows(computeDiffRows(effectiveBaseline, effectiveCandidate));
      })
      .catch((err: unknown) => {
        const msg = String(err);
        logWarn("Compare", "Compare failed", msg);
        setLoadError(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [effectiveBaseline, effectiveCandidate]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const diffs = computedRows;
  const filtered = React.useMemo(() => {
    return diffs.filter((d) => {
      if (searchText && !d.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (activeFilter && activeFilter !== "total" && d.state !== activeFilter) return false;
      return true;
    });
  }, [diffs, searchText, activeFilter]);

  if (initState.error || loadError) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 24 }}>
        <div className="glass-panel glow-border-red" style={{ padding: 40, textAlign: "center", maxWidth: 480, borderRadius: "var(--proof-radius-lg)" }}>
          <AlertCircle size={48} style={{ color: "var(--proof-red)", marginBottom: 20, display: "block", margin: "0 auto" }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: "var(--proof-text)" }}>DATA SYNC ERROR</h2>
          <p style={{ color: "var(--proof-text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
            {String(initState.error || loadError || "An unexpected error occurred while loading forensic data.")}
          </p>
          <button 
            className="proof-btn proof-btn-primary" 
            onClick={() => loadData()}
            style={{ minWidth: 160 }}
          >
            <RefreshCcw size={18} />
            RETRY SYNC
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", margin: "0 auto", position: "relative" }}>
      {/* Background Gradient */}
      <div style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        right: 0, 
        height: "40vh", 
        background: "linear-gradient(to bottom, var(--proof-blue-glow), transparent)", 
        opacity: 0.15, 
        pointerEvents: "none",
        zIndex: 0
      }} />

      <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <GitCompare size={24} style={{ color: "var(--proof-blue)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text-secondary)", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              Analysis Engine
            </span>
          </div>
          <h1 style={{ 
            fontSize: 42, 
            fontWeight: 900, 
            margin: 0, 
            letterSpacing: "-1.5px", 
            fontFamily: "var(--font-sans)",
            background: "linear-gradient(to right, var(--proof-blue), var(--proof-purple))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            FORENSIC COMPARE
          </h1>
          {(effectiveBaseline && effectiveCandidate) && (
            <div style={{ 
              marginTop: 8, 
              color: "var(--proof-text-secondary)", 
              fontFamily: "var(--font-mono)", 
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <span style={{ color: "var(--proof-blue)" }}>{effectiveBaseline.substring(0, 8)}</span>
              <span style={{ opacity: 0.5 }}>VS</span>
              <span style={{ color: "var(--proof-purple)" }}>{effectiveCandidate.substring(0, 8)}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr auto 1fr", 
        gap: 32, 
        marginBottom: 48, 
        alignItems: "center",
        position: "relative",
        zIndex: 1
      }}>
        <div className="glass-panel" style={{ padding: 2, borderRadius: "var(--proof-radius-lg)" }}>
          <div style={{ padding: 20 }}>
            <CompareRunSelector
              runs={envRuns}
              value={effectiveBaseline}
              onChange={(v) => setBaseline(v)}
              label="Baseline (Before)"
              labelColor="var(--proof-text-secondary)"
              accentColor="var(--proof-blue)"
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <button
            onClick={swapRuns}
            className="glass-panel"
            style={{ 
              width: 48,
              height: 48,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer", 
              border: "1px solid var(--proof-blue)",
              boxShadow: "0 0 15px var(--proof-blue-glow)",
              transition: "all 0.2s ease",
              background: "var(--proof-surface-2)"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "rotate(180deg)";
              e.currentTarget.style.boxShadow = "0 0 25px var(--proof-blue-glow)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "rotate(0deg)";
              e.currentTarget.style.boxShadow = "0 0 15px var(--proof-blue-glow)";
            }}
          >
            <ArrowLeftRight size={20} style={{ color: "var(--proof-blue)" }} />
          </button>
          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--proof-text-muted)", letterSpacing: "1px" }}>VS</span>
        </div>

        <div className="glass-panel" style={{ padding: 2, borderRadius: "var(--proof-radius-lg)" }}>
          <div style={{ padding: 20 }}>
            <CompareRunSelector
              runs={envRuns}
              value={effectiveCandidate}
              onChange={(v) => setCandidate(v)}
              label="Candidate (After)"
              labelColor="var(--proof-text-secondary)"
              accentColor="var(--proof-purple)"
            />
          </div>
        </div>
      </div>

      <div style={{ 
        height: 1, 
        width: "100%", 
        background: "linear-gradient(to right, transparent, var(--proof-border), transparent)", 
        marginBottom: 48 
      }} />

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80 }}>
          <div className="animate-spin" style={{ width: 40, height: 40, border: "3px solid var(--proof-surface-3)", borderTopColor: "var(--proof-blue)", borderRadius: "50%", marginBottom: 20 }} />
          <span style={{ color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)", fontSize: 14 }}>COMPUTING DELTAS...</span>
        </div>
      ) : (
        <>
          {diffs.length > 0 && (
            <CompareRunsHeader diffs={diffs} baseResults={baseResults} candResults={candResults} />
          )}

          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", borderRadius: "var(--proof-radius-lg)", overflow: "hidden", border: "1px solid var(--proof-border-strong)" }}>
            <div style={{ padding: "20px 24px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--proof-border-strong)", display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
                <input
                  className="proof-input"
                  placeholder="FILTER BY TEST SIGNAL..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  style={{ 
                    fontFamily: "var(--font-mono)", 
                    paddingLeft: 36,
                    height: 42,
                    fontSize: 13,
                    background: "var(--proof-bg)"
                  }}
                />
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}>
                  {filtered.length} RESULTS
                </span>
              </div>
            </div>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 140px 140px 140px", 
              padding: "14px 24px", 
              background: "var(--proof-surface-3)",
              borderBottom: "1px solid var(--proof-border-strong)", 
              fontFamily: "var(--font-mono)", 
              fontSize: 11, 
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              letterSpacing: "1px"
            }}>
              <span>TEST SIGNAL</span>
              <span>BASELINE</span>
              <span>CANDIDATE</span>
              <span>DELTA</span>
            </div>
            <div style={{ minHeight: 200 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", color: "var(--proof-text-muted)" }}>
                  <div style={{ fontSize: 14, fontFamily: "var(--font-mono)" }}>NO MATCHING RESULTS FOUND</div>
                </div>
              ) : (
                filtered.map((row, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    key={row.name}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 140px 140px 140px",
                      padding: "16px 24px",
                      borderBottom: "1px solid var(--proof-border-light)",
                      borderLeft: row.state === 'regression' ? "4px solid var(--proof-red)" : row.state === 'fixed' ? "4px solid var(--proof-green)" : "4px solid transparent",
                      alignItems: "center",
                      background: row.state === 'regression' ? "rgba(255,51,85,0.03)" : row.state === 'fixed' ? "rgba(0,229,160,0.03)" : "transparent",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    whileHover={{ 
                      background: "var(--proof-hover)",
                      x: 2
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--proof-text)", fontWeight: 500 }}>{row.name}</span>
                    <div>
                      <span className={`proof-badge ${row.baseStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`} style={{ minWidth: 64, justifyContent: "center" }}>
                        {row.baseStatus}
                      </span>
                    </div>
                    <div>
                      <span className={`proof-badge ${row.candStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`} style={{ minWidth: 64, justifyContent: "center" }}>
                        {row.candStatus}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      fontFamily: "var(--font-mono)", 
                      fontWeight: 700,
                      color: row.durCand - row.durBase > 20 ? "var(--proof-red)" : row.durCand - row.durBase < -20 ? "var(--proof-green)" : "var(--proof-text-muted)" 
                    }}>
                      {row.durCand - row.durBase > 0 ? "+" : ""}{row.durCand - row.durBase}ms
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

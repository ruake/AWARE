import React from "react";
import type { DiffRow, TestResult } from "@/lib/types";

export function CompareSummary({
  diff,
  deltaMs,
  size = "normal",
}: {
  diff: DiffRow;
  deltaMs: number;
  size?: "normal" | "large";
}) {
  const isLarge = size === "large";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, marginBottom: 8 }}>
      <div className="glass-panel" style={{ padding: isLarge ? "16px 20px" : 12, borderRadius: 0, borderLeft: `3px solid ${diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}` }}>
        <div style={{ fontSize: isLarge ? 11 : 10, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: isLarge ? 6 : 4 }}>
          Baseline
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={`proof-badge ${diff.baseStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}>
            {diff.baseStatus}
          </span>
          <div className="metric-number" style={{ fontSize: isLarge ? 16 : 14, color: "var(--proof-text)" }}>
            {diff.durBase}ms
          </div>
        </div>
      </div>
      <div className="glass-panel" style={{ padding: isLarge ? "16px 20px" : 12, borderRadius: 0, borderLeft: `3px solid ${diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}` }}>
        <div style={{ fontSize: isLarge ? 11 : 10, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: isLarge ? 6 : 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Candidate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={`proof-badge ${diff.candStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}>
            {diff.candStatus}
          </span>
          <div className="metric-number" style={{ fontSize: isLarge ? 16 : 14, color: "var(--proof-text)" }}>
            {diff.durCand}ms
          </div>
        </div>
      </div>
      <div className="glass-panel" style={{ padding: isLarge ? "16px 20px" : 12, borderRadius: 0, minWidth: isLarge ? 120 : 100, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: isLarge ? 11 : 10, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: isLarge ? 6 : 4 }}>
          Delta
        </div>
        <div className="metric-number" style={{ fontSize: isLarge ? 16 : 14, color: deltaMs > 20 ? "var(--proof-red)" : deltaMs < -20 ? "var(--proof-green)" : "var(--proof-text-secondary)" }}>
          {Math.abs(deltaMs) > 20 ? `${deltaMs > 0 ? "+" : ""}${deltaMs}ms` : "~0ms"}
        </div>
      </div>
    </div>
  );
}

export function CompareRunsHeader({ 
  diffs,
  baseResults,
  candResults
}: { 
  diffs: DiffRow[];
  baseResults: TestResult[];
  candResults: TestResult[];
}) {
  const regressions = diffs.filter(d => d.state === 'regression').length;
  const fixed = diffs.filter(d => d.state === 'fixed').length;
  const unchanged = diffs.filter(d => d.state === 'unchanged').length;
  const slower = diffs.filter(d => d.state === 'duration').length;
  const totalDurationChange = diffs.reduce((acc, d) => acc + (d.durCand - d.durBase), 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
      <div className="glass-panel glow-border-red" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--proof-text-secondary)', textTransform: 'uppercase', letterSpacing: "1px", marginBottom: 8 }}>
          Regressions
        </div>
        <div className="metric-number" style={{ fontSize: 42, color: regressions > 0 ? 'var(--proof-red)' : 'var(--proof-text-muted)' }}>
          {regressions}
        </div>
      </div>
      <div className="glass-panel glow-border-green" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--proof-text-secondary)', textTransform: 'uppercase', letterSpacing: "1px", marginBottom: 8 }}>
          Fixed
        </div>
        <div className="metric-number" style={{ fontSize: 42, color: fixed > 0 ? 'var(--proof-green)' : 'var(--proof-text-muted)' }}>
          {fixed}
        </div>
      </div>
      <div className="glass-panel glow-border-cyan" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--proof-text-secondary)', textTransform: 'uppercase', letterSpacing: "1px", marginBottom: 8 }}>
          Unchanged
        </div>
        <div className="metric-number" style={{ fontSize: 42, color: 'var(--proof-text)' }}>
          {unchanged}
        </div>
      </div>
      <div className="glass-panel glow-border-amber" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--proof-text-secondary)', textTransform: 'uppercase', letterSpacing: "1px", marginBottom: 8 }}>
          Slower
        </div>
        <div className="metric-number" style={{ fontSize: 42, color: slower > 0 ? 'var(--proof-yellow)' : 'var(--proof-text-muted)' }}>
          {slower}
        </div>
      </div>
      <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--proof-text-secondary)', textTransform: 'uppercase', letterSpacing: "1px", marginBottom: 8 }}>
          Duration Delta
        </div>
        <div className="metric-number" style={{ fontSize: 32, color: totalDurationChange > 0 ? 'var(--proof-red)' : 'var(--proof-green)', marginTop: "auto" }}>
          {totalDurationChange > 0 ? '+' : ''}{(totalDurationChange / 1000).toFixed(2)}s
        </div>
      </div>
    </div>
  );
}

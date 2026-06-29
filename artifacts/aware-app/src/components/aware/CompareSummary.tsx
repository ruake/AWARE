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

interface FilterCard {
  label: string;
  count: number;
  filterKey: string | null;
  accentColor: string;
  glowClass: string;
}

export function CompareRunsHeader({ 
  diffs,
  baseResults: _baseResults,
  candResults: _candResults,
  activeFilter,
  onFilter,
}: { 
  diffs: DiffRow[];
  baseResults: TestResult[];
  candResults: TestResult[];
  activeFilter?: string | null;
  onFilter?: (filter: string | null) => void;
}) {
  const regressions = diffs.filter(d => d.state === 'regression').length;
  const fixed = diffs.filter(d => d.state === 'fixed').length;
  const unchanged = diffs.filter(d => d.state === 'unchanged').length;
  const slower = diffs.filter(d => d.state === 'duration').length;
  const totalDurationChange = diffs.reduce((acc, d) => acc + (d.durCand - d.durBase), 0);

  const cards: FilterCard[] = [
    { label: "Regressions", count: regressions, filterKey: "regression", accentColor: "var(--proof-red)", glowClass: "glow-border-red" },
    { label: "Fixed", count: fixed, filterKey: "fixed", accentColor: "var(--proof-green)", glowClass: "glow-border-green" },
    { label: "Unchanged", count: unchanged, filterKey: "unchanged", accentColor: "var(--proof-blue)", glowClass: "glow-border-cyan" },
    { label: "Slower", count: slower, filterKey: "duration", accentColor: "var(--proof-yellow)", glowClass: "glow-border-amber" },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
      {cards.map((card) => {
        const isActive = activeFilter === card.filterKey;
        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onFilter?.(card.filterKey)}
            className={`glass-panel ${card.glowClass}`}
            style={{
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              textAlign: 'left',
              border: `1px solid ${isActive ? card.accentColor : "var(--proof-border)"}`,
              borderRadius: "var(--proof-radius-md)",
              background: isActive ? `color-mix(in srgb, ${card.accentColor} 8%, var(--proof-surface))` : undefined,
              transform: isActive ? "translateY(-3px)" : undefined,
              boxShadow: isActive ? `0 0 20px color-mix(in srgb, ${card.accentColor} 30%, transparent)` : undefined,
              transition: "all 0.18s ease",
              outline: "none",
            }}
            title={`Filter by ${card.label.toLowerCase()}`}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: isActive ? card.accentColor : 'var(--proof-text-secondary)', textTransform: 'uppercase', letterSpacing: "1px", marginBottom: 8 }}>
              {card.label}
              {isActive && <span style={{ marginLeft: 6, opacity: 0.7 }}>✓</span>}
            </div>
            <div className="metric-number" style={{ fontSize: 42, color: card.count > 0 ? card.accentColor : 'var(--proof-text-muted)' }}>
              {card.count}
            </div>
            {onFilter && (
              <div style={{ fontSize: 9, color: "var(--proof-text-muted)", marginTop: 6, fontFamily: "var(--font-mono)", letterSpacing: "0.5px" }}>
                {isActive ? "CLICK TO CLEAR" : "CLICK TO FILTER"}
              </div>
            )}
          </button>
        );
      })}

      {/* Duration delta — not filterable, just informational */}
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

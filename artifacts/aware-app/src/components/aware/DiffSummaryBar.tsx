import React from "react";
import type { DiffRow } from "@/lib/types";

interface DiffSummaryBarProps {
  diffs: DiffRow[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export function DiffSummaryBar({ diffs, activeFilter, onFilterChange }: DiffSummaryBarProps) {
  const regressions = diffs.filter(d => d.state === "regression").length;
  const fixes = diffs.filter(d => d.state === "fixed").length;
  const unchanged = diffs.filter(d => d.state === "unchanged").length;
  const duration = diffs.filter(d => d.state === "duration").length;
  const total = diffs.length || 1;

  const totalDurationChange = diffs.reduce((acc, d) => acc + (d.durCand - d.durBase), 0);
  const slowerCount = diffs.filter(d => d.durCand - d.durBase > 20).length;
  const fasterCount = diffs.filter(d => d.durCand - d.durBase < -20).length;

  const segments = [
    { key: "regression", label: `${regressions} Regression${regressions !== 1 ? "s" : ""}`, count: regressions, color: "var(--proof-red)", bg: "var(--proof-red-bg)", border: "var(--proof-red-border)" },
    { key: "fixed", label: `${fixes} Fixed`, count: fixes, color: "var(--proof-green)", bg: "var(--proof-green-bg)", border: "var(--proof-green-border)" },
    { key: "duration", label: `${duration} Duration`, count: duration, color: "var(--proof-yellow)", bg: "var(--proof-yellow-bg)", border: "var(--proof-yellow-border)" },
    { key: "unchanged", label: `${unchanged} Unchanged`, count: unchanged, color: "var(--proof-text-muted)", bg: "var(--proof-surface-2)", border: "var(--proof-border)" },
  ];

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)", letterSpacing: "0.5px" }}>
          SUMMARY
        </div>
        <div style={{ fontSize: 11, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}>
          {diffs.length} tests · {totalDurationChange > 0 ? "+" : ""}{(totalDurationChange / 1000).toFixed(1)}s net delta
        </div>
        <div style={{ fontSize: 11, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}>
          {slowerCount} slower · {fasterCount} faster
        </div>
      </div>

      <div style={{ display: "flex", height: 32, borderRadius: 6, overflow: "hidden", border: "1px solid var(--proof-border)" }}>
        {segments.map(seg => {
          if (seg.count === 0) return null;
          const pct = (seg.count / total) * 100;
          const isActive = activeFilter === seg.key;
          return (
            <button
              key={seg.key}
              onClick={() => onFilterChange(isActive ? null : seg.key)}
              title={seg.label}
              style={{
                width: `${pct}%`,
                minWidth: 40,
                background: isActive ? seg.color : seg.bg,
                border: "none",
                borderRight: "1px solid var(--proof-border)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "0 6px",
                transition: "all 0.2s ease",
                opacity: activeFilter && !isActive ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.opacity = "0.8"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.opacity = activeFilter ? "0.4" : "1"; }}
            >
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: isActive ? "#fff" : seg.color,
                fontFamily: "var(--font-mono)",
                whiteSpace: "nowrap",
              }}>
                {seg.label}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
        {segments.map(seg => {
          const isActive = activeFilter === seg.key;
          return (
            <button
              key={seg.key}
              onClick={() => onFilterChange(isActive ? null : seg.key)}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 12,
                background: isActive ? seg.color : seg.bg,
                border: `1px solid ${isActive ? seg.color : seg.border}`,
                color: isActive ? "#fff" : seg.color,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                transition: "all 0.15s ease",
              }}
            >
              {seg.label}
            </button>
          );
        })}
        {activeFilter && (
          <button
            onClick={() => onFilterChange(null)}
            style={{
              fontSize: 10,
              padding: "3px 10px",
              borderRadius: 12,
              background: "var(--proof-surface-2)",
              border: "1px solid var(--proof-border)",
              color: "var(--proof-text-secondary)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

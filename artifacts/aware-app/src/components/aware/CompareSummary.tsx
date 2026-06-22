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
      <div
        style={{
          padding: isLarge ? "12px 16px" : 10,
          borderRadius: 12,
          border: `1px solid ${diff.baseStatus === "PASS" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
          background: diff.baseStatus === "PASS" ? "rgba(34,197,94,0.03)" : "rgba(239,68,68,0.03)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"
        }} />
        <div
          style={{
            fontSize: isLarge ? 11 : 10,
            fontWeight: 700,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: isLarge ? 6 : 4,
          }}
        >
          Baseline
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className={`proof-badge ${diff.baseStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
            style={{ fontSize: isLarge ? 11 : 10, padding: '2px 8px' }}
          >
            {diff.baseStatus}
          </span>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: isLarge ? 14 : 12,
              color: "var(--proof-text)",
              fontWeight: 700,
            }}
          >
            {diff.durBase}ms
          </div>
        </div>
      </div>
      <div
        style={{
          padding: isLarge ? "12px 16px" : 10,
          borderRadius: 12,
          border: `1px solid ${diff.candStatus === "PASS" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
          background: diff.candStatus === "PASS" ? "rgba(34,197,94,0.03)" : "rgba(239,68,68,0.03)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"
        }} />
        <div
          style={{
            fontSize: isLarge ? 11 : 10,
            fontWeight: 700,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: isLarge ? 6 : 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Candidate</span>
          {diff.durBase > 0 && (
            <span
              style={{
                fontSize: isLarge ? 10 : 9,
                color: diff.candStatus === diff.baseStatus ? "var(--proof-text-muted)" : (diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"),
                fontWeight: 700,
              }}
            >
              {diff.candStatus === "PASS" && diff.baseStatus === "FAIL" ? "+100%pp" : diff.candStatus === "FAIL" && diff.baseStatus === "PASS" ? "-100%pp" : "0pp"}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className={`proof-badge ${diff.candStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
            style={{ fontSize: isLarge ? 11 : 10, padding: '2px 8px' }}
          >
            {diff.candStatus}
          </span>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: isLarge ? 14 : 12,
              color: "var(--proof-text)",
              fontWeight: 700,
            }}
          >
            {diff.durCand}ms
          </div>
        </div>
      </div>
      <div
        style={{
          padding: isLarge ? "10px 14px" : "8px 10px",
          borderRadius: 12,
          border: "1px solid var(--proof-border)",
          background: "var(--proof-surface-hover)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minWidth: isLarge ? 110 : 90,
        }}
      >
        <div
          style={{
            fontSize: isLarge ? 10 : 9,
            fontWeight: 700,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: isLarge ? 4 : 2,
          }}
        >
          Difference
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: isLarge ? 14 : 12,
            fontWeight: 800,
            color:
              deltaMs > 20
                ? "var(--proof-red)"
                : deltaMs < -20
                  ? "var(--proof-green)"
                  : "var(--proof-text-secondary)",
          }}
        >
          {Math.abs(deltaMs) > 20 ? `${deltaMs > 0 ? "+" : ""}${deltaMs}ms` : "~0ms"}
        </div>
        <div style={{ fontSize: isLarge ? 10 : 9, color: "var(--proof-text-muted)", fontWeight: 500 }}>
          {diff.durBase > 0 ? `${deltaMs > 0 ? "+" : ""}${((deltaMs / diff.durBase) * 100).toFixed(1)}%` : "0%"}
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
  const totalDurationChange = diffs.reduce((acc, d) => acc + (d.durCand - d.durBase), 0);

  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
      <div className="proof-card" style={{ flex: 1, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ 
          width: 32, 
          height: 32, 
          borderRadius: '50%', 
          background: regressions > 0 ? 'var(--proof-red-bg)' : 'var(--proof-green-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16
        }}>
          {regressions > 0 ? '⚠️' : '✓'}
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--proof-text-secondary)', textTransform: 'uppercase' }}>
            Regressions
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: regressions > 0 ? 'var(--proof-red)' : 'var(--proof-green)' }}>
            {regressions === 0 ? 'All clear 🎉' : regressions}
          </div>
        </div>
      </div>
      <div className="proof-card" style={{ flex: 1, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ 
          width: 32, 
          height: 32, 
          borderRadius: '50%', 
          background: 'var(--proof-blue-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16
        }}>
          ⏱️
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--proof-text-secondary)', textTransform: 'uppercase' }}>
            Duration Change
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: totalDurationChange > 0 ? 'var(--proof-red)' : 'var(--proof-green)' }}>
            {totalDurationChange > 0 ? '+' : ''}{(totalDurationChange / 1000).toFixed(2)}s total
          </div>
        </div>
      </div>
    </div>
  );
}

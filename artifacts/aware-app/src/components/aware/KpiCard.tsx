import React from "react";

export function KpiCard({ total, passRate, _failedRuns, chartColor }: any) {
  return (
    <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: 8, borderRadius: 12, border: "1px solid var(--proof-border)", padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--proof-text-secondary)" }}>Overview</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span className="metric-number" style={{ fontSize: 24, color: chartColor }}>{passRate}%</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text-muted)" }}>Pass Rate</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span className="metric-number" style={{ fontSize: 18, color: "#fff" }}>{total}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text-muted)" }}>Runs</span>
      </div>
    </div>
  );
}

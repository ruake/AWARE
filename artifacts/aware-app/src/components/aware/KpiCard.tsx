import React from "react";

interface KpiCardProps {
  total: number;
  passRate: number;
  failedRuns: number;
  chartColor: string;
}

export function KpiCard({ total, passRate, failedRuns, chartColor }: KpiCardProps) {
  return (
    <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--proof-text)" }}>{total}</span> runs ·{" "}
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: chartColor }}>{passRate}%</span> avg ·{" "}
      {failedRuns > 0 && <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--proof-red-bright)" }}>{failedRuns} failed</span>}
      {failedRuns === 0 && <span style={{ color: "var(--proof-green)", fontWeight: 600 }}>all passing</span>}
    </span>
  );
}

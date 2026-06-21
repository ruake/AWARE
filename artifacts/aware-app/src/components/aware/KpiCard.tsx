import React from "react";

interface KpiCardProps {
  total: number;
  passRate: number;
  failedRuns: number;
  chartColor: string;
}

export function KpiCard({ total, passRate, failedRuns, chartColor }: KpiCardProps) {
  const displayTotal = total ?? "—";
  const displayPassRate = passRate !== undefined && passRate !== null ? `${passRate}%` : "—%";
  const displayFailedRuns = failedRuns ?? 0;

  return (
    <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--proof-text)" }}>
        {displayTotal}
      </span>{" "}
      runs ·{" "}
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: chartColor }}>
        {displayPassRate}
      </span>{" "}
      avg ·{" "}
      {displayFailedRuns > 0 && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            color: "var(--proof-red-bright)",
          }}
        >
          {displayFailedRuns} failed
        </span>
      )}
      {displayFailedRuns === 0 && total !== undefined && total !== null && (
        <span style={{ color: "var(--proof-green)", fontWeight: 600 }}>all passing</span>
      )}
    </span>
  );
}

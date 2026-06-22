import React from "react";

interface KpiCardProps {
  total?: number;
  passRate?: number;
  failedRuns?: number;
  chartColor: string;
}

export const KpiCard = React.memo(function KpiCard({
  total,
  passRate,
  failedRuns,
  chartColor,
}: KpiCardProps) {
  const displayTotal = total !== undefined && total !== null ? total : "—";
  const hasPassRate = passRate !== undefined && passRate !== null;
  const displayPassRate = hasPassRate ? `${passRate}%` : "—%";
  const displayFailedRuns = failedRuns ?? 0;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ 
          fontSize: 13, 
          fontWeight: 800, 
          fontFamily: "var(--font-mono)", 
          color: "var(--proof-text)",
          letterSpacing: "-0.5px"
        }}>
          {displayTotal}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--proof-text-muted)", textTransform: "uppercase" }}>runs</span>
      </div>

      <div style={{ width: 1, height: 10, background: "var(--proof-border-light)" }} />

      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            color: hasPassRate ? chartColor : "var(--proof-text-muted)",
            letterSpacing: "-0.5px"
          }}
        >
          {displayPassRate}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--proof-text-muted)", textTransform: "uppercase" }}>avg</span>
      </div>

      {displayFailedRuns > 0 && (
        <>
          <div style={{ width: 1, height: 10, background: "var(--proof-border-light)" }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: "var(--proof-red)",
                letterSpacing: "-0.5px"
              }}
            >
              {displayFailedRuns}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--proof-red)", textTransform: "uppercase" }}>failed</span>
          </div>
        </>
      )}

      {displayFailedRuns === 0 && total !== undefined && total !== null && (
        <>
          <div style={{ width: 1, height: 10, background: "var(--proof-border-light)" }} />
          <span style={{ fontSize: 10, color: "var(--proof-green)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            100% Pass
          </span>
        </>
      )}
    </div>
  );
});


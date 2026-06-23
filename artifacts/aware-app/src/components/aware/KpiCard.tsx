import React from "react";

export function KpiCard({ total, passRate, failedRuns, chartColor }: any) {
  return (
    <div className="glass-panel flex flex-col gap-2 rounded-xl border border-[var(--proof-border)] p-4">
      <div className="text-xs font-bold uppercase tracking-widest text-[var(--proof-text-secondary)]">Overview</div>
      <div className="flex items-baseline gap-2">
        <span className="metric-number text-2xl" style={{ color: chartColor }}>{passRate}%</span>
        <span className="text-xs font-bold text-[var(--proof-text-muted)]">Pass Rate</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="metric-number text-lg text-white">{total}</span>
        <span className="text-xs font-bold text-[var(--proof-text-muted)]">Runs</span>
      </div>
    </div>
  );
}

import React from "react";
import { useLocation } from "wouter";

interface HeatmapCell {
  runId: string;
  label: string;
  passRate: number;
  env: string;
  date: string;
}

interface Props {
  data: HeatmapCell[];
  onCellClick?: (runId: string, env: string, date: string) => void;
}

export function PassRateHeatmap({ data, onCellClick }: Props) {
  const [, navigate] = useLocation();

  const handleClick = (cell: HeatmapCell) => {
    if (onCellClick) {
      onCellClick(cell.runId, cell.env, cell.date);
    } else {
      navigate(`/runs/${cell.runId}`);
    }
  };

  if (data.length === 0) {
    return (
      <div className="proof-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: "12px", minHeight: 200 }}>
        <div style={{ padding: "12px", background: "var(--proof-surface-2)", borderRadius: "50%", color: "var(--proof-text-muted)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--proof-text-secondary)" }}>No run data available</div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        .heatmap-cell {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          flex-shrink: 0;
          position: relative;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
        }
        .heatmap-cell:hover {
          transform: scale(1.5) translateY(-2px);
          filter: brightness(1.2) saturate(1.2);
          z-index: 10;
          box-shadow: var(--proof-shadow-md);
        }
        .heatmap-cell:focus-visible {
          outline: 2px solid var(--proof-blue);
          outline-offset: 2px;
        }
        .heatmap-cell--pass {
          background-color: var(--proof-emerald);
        }
        .heatmap-cell--warn {
          background-color: var(--proof-yellow);
        }
        .heatmap-cell--fail {
          background-color: var(--proof-red);
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.1) 2px,
            rgba(0, 0, 0, 0.1) 4px
          );
        }
        .heatmap-header {
          position: sticky;
          top: 0;
          background: var(--proof-surface-1);
          z-index: 2;
          padding: 12px 16px;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--proof-border);
          display: flex;
          gap: 16px;
          font-size: 11px;
          font-weight: 700;
          color: var(--proof-text-secondary);
          text-transform: uppercase;
          letter-spacing: "0.5px";
          border-radius: 12px 12px 0 0;
        }
      `}</style>
      
      <div style={{ background: "var(--proof-surface-1)", borderRadius: "16px", border: "1px solid var(--proof-border)", overflow: "hidden" }}>
        {/* Grouping header for sticky environments */}
        <div className="heatmap-header">
          {Array.from(new Set(data.map(d => d.env))).map(env => (
            <span key={env} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--proof-blue)' }} />
              {env}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 16px 16px 16px" }}>
          {data.map((cell) => {
            const cls =
              cell.passRate >= 95
                ? "heatmap-cell--pass"
                : cell.passRate >= 80
                  ? "heatmap-cell--warn"
                  : "heatmap-cell--fail";
            const label = `${cell.label} · ${cell.env} · ${cell.date} · ${cell.passRate}% pass rate`;
            return (
              <button
                key={cell.runId}
                className={`heatmap-cell ${cls}`}
                onClick={() => handleClick(cell)}
                title={label}
                aria-label={label}
                style={{ padding: 0 }}
              />
            );
          })}
        </div>

        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 16, 
          padding: "12px 16px",
          fontSize: 10, 
          fontWeight: 600,
          color: "var(--proof-text-muted)",
          borderTop: "1px solid var(--proof-border)",
          background: "var(--proof-surface-2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className="heatmap-cell heatmap-cell--pass" style={{ width: 10, height: 10, cursor: 'default' }} />
            <span>Optimal (95-100%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className="heatmap-cell heatmap-cell--warn" style={{ width: 10, height: 10, cursor: 'default' }} />
            <span>Degraded (80-94%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className="heatmap-cell heatmap-cell--fail" style={{ width: 10, height: 10, cursor: 'default' }} />
            <span>Critical (&lt;80%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

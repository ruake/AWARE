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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontSize: 12,
          color: "var(--proof-text-muted)",
        }}
      >
        No run data
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        .heatmap-cell {
          width: 18px;
          height: 18px;
          border-radius: 3px;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: transform 0.12s ease, filter 0.12s ease, outline 0.1s ease;
          flex-shrink: 0;
          position: relative;
        }
        .heatmap-cell:hover {
          transform: scale(1.4);
          filter: brightness(1.3);
          z-index: 1;
        }
        .heatmap-cell:focus-visible {
          outline: 2px solid var(--proof-blue);
          outline-offset: 2px;
        }
        .heatmap-cell--pass {
          background-color: var(--proof-green);
          opacity: 0.75;
        }
        .heatmap-cell--warn {
          background-color: var(--proof-yellow);
          opacity: 0.75;
        }
        .heatmap-cell--fail {
          background-color: var(--proof-red);
          opacity: 0.75;
        }
        /* Pattern overlay for colorblind-friendly distinction */
        .heatmap-cell--fail::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.15) 2px,
            rgba(0,0,0,0.15) 4px
          );
          border-radius: 3px;
        }
        .heatmap-header {
          position: sticky;
          top: 0;
          background: var(--proof-surface);
          z-index: 2;
          padding: 8px 0;
          margin-bottom: 8px;
          border-bottom: 1px solid var(--proof-border);
          display: flex;
          gap: 12px;
          font-size: 11px;
          font-weight: 600;
          color: var(--proof-text-secondary);
        }
      `}</style>
      
      {/* Grouping header for sticky environments */}
      <div className="heatmap-header">
        {Array.from(new Set(data.map(d => d.env))).map(env => (
          <span key={env}>{env}</span>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
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
        gap: 12, 
        marginTop: 12, 
        fontSize: 10, 
        color: "var(--proof-text-secondary)",
        paddingTop: 8,
        borderTop: "1px solid var(--proof-border)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="heatmap-cell heatmap-cell--pass" style={{ width: 10, height: 10, cursor: 'default' }} />
          <span>95-100%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="heatmap-cell heatmap-cell--warn" style={{ width: 10, height: 10, cursor: 'default' }} />
          <span>80-94%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="heatmap-cell heatmap-cell--fail" style={{ width: 10, height: 10, cursor: 'default' }} />
          <span>&lt;80%</span>
        </div>
      </div>
    </div>
  );
}

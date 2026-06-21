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
  onCellClick?: (runId: string) => void;
}

export function PassRateHeatmap({ data, onCellClick }: Props) {
  const [, navigate] = useLocation();

  const handleClick = (runId: string) => {
    if (onCellClick) {
      onCellClick(runId);
    } else {
      navigate(`/runs/${runId}`);
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
    <>
      <style>{`
        .heatmap-cell {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: transform 0.12s ease, filter 0.12s ease;
          flex-shrink: 0;
        }
        .heatmap-cell:hover {
          transform: scale(1.35);
          filter: brightness(1.25);
        }
        .heatmap-cell:focus-visible {
          outline: 2px solid var(--proof-blue);
          outline-offset: 2px;
        }
        .heatmap-cell--pass { background-color: rgba(34,197,94,0.72); }
        .heatmap-cell--warn { background-color: rgba(245,158,11,0.72); }
        .heatmap-cell--fail { background-color: rgba(239,68,68,0.72); }
      `}</style>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {data.map((cell) => {
          const cls =
            cell.passRate >= 95
              ? "heatmap-cell--pass"
              : cell.passRate >= 80
                ? "heatmap-cell--warn"
                : "heatmap-cell--fail";
          return (
            <button
              key={cell.runId}
              className={`heatmap-cell ${cls}`}
              onClick={() => handleClick(cell.runId)}
              title={`${cell.label} (${cell.env}) — ${cell.date}: ${cell.passRate}%`}
              aria-label={`${cell.label} ${cell.env} ${cell.date} ${cell.passRate}% pass rate`}
            />
          );
        })}
      </div>
    </>
  );
}

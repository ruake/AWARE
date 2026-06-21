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
      `}</style>
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
              onClick={() => handleClick(cell.runId)}
              title={label}
              aria-label={label}
            />
          );
        })}
      </div>
    </>
  );
}

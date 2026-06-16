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

function cellColor(passRate: number): string {
  if (passRate >= 95) return "rgba(34,197,94,0.7)";
  if (passRate >= 80) return "rgba(245,158,11,0.7)";
  return "rgba(239,68,68,0.7)";
}

function cellHoverColor(passRate: number): string {
  if (passRate >= 95) return "rgba(34,197,94,0.9)";
  if (passRate >= 80) return "rgba(245,158,11,0.9)";
  return "rgba(239,68,68,0.9)";
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
    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
      {data.map((cell) => (
        <button
          key={cell.runId}
          onClick={() => handleClick(cell.runId)}
          title={`${cell.label} (${cell.env}) — ${cell.date}: ${cell.passRate}%`}
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            backgroundColor: cellColor(cell.passRate),
            border: "none",
            padding: 0,
            cursor: "pointer",
            transition: "background-color 0.12s, transform 0.12s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = cellHoverColor(cell.passRate);
            (e.currentTarget as HTMLElement).style.transform = "scale(1.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = cellColor(cell.passRate);
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
        />
      ))}
    </div>
  );
}

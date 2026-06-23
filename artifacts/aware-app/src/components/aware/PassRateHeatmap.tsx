import React from "react";

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
  return (
    <div className="glass-panel" style={{ padding: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>
        Pass Rate Matrix
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {data.map((cell) => {
          const isCritical = cell.passRate < 80;
          const isWarn = cell.passRate < 95;
          const bg = isCritical ? "var(--proof-red)" : isWarn ? "var(--proof-yellow)" : "var(--proof-green)";
          const glow = isCritical ? "var(--proof-glow-red)" : "none";
          return (
            <button
              key={cell.runId}
              onClick={() => onCellClick?.(cell.runId, cell.env, cell.date)}
              style={{
                width: 16,
                height: 16,
                background: bg,
                boxShadow: glow,
                border: "none",
                cursor: "pointer",
                padding: 0
              }}
              title={`${cell.passRate}%`}
            />
          );
        })}
      </div>
    </div>
  );
}

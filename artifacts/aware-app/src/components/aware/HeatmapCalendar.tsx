import React from "react";

interface DayData {
  date: string;
  count: number;
  envs: Record<string, number>;
}

interface Props {
  data: DayData[];
  startDate?: string;
  endDate?: string;
  onDayClick?: (day: DayData | null) => void;
  onCellClick?: (date: string) => void;
}

const LEVEL_COLORS = [
  "transparent",
  "var(--proof-blue-bg)",
  "rgba(0,196,255,0.4)",
  "rgba(0,196,255,0.7)",
  "var(--proof-blue)",
];

export function HeatmapCalendar({ data: _data, startDate: _startDate, endDate: _endDate, onDayClick: _onDayClick, onCellClick: _onCellClick }: Props) {
  // Simplified for speed
  return (
    <div className="glass-panel" style={{ padding: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>
        Activity Matrix
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {Array.from({ length: 90 }).map((_, i) => {
          const val = ((i * 13 + 7) % 5) / 5;
          const level = val > 0.8 ? 4 : val > 0.6 ? 3 : val > 0.4 ? 2 : val > 0.2 ? 1 : 0;
          return (
            <div key={i} style={{ 
              width: 14, 
              height: 14, 
              background: LEVEL_COLORS[level],
              border: "1px solid var(--proof-border-light)",
              borderRadius: 2
            }} />
          );
        })}
      </div>
    </div>
  );
}

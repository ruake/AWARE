import React from "react";
import { Grid3x3 } from "lucide-react";

interface HeatmapCell {
  label: string;
  env: string;
  status: "PASS" | "FAIL" | "NONE";
  count: number;
}

interface CategoryHeatmapProps {
  data: { env: string; status: "PASS" | "FAIL" }[];
}

export const CategoryHeatmap = React.memo(function CategoryHeatmap({ data }: CategoryHeatmapProps) {
  const grid = React.useMemo(() => {
    const envs = [...new Set(data.map((d) => d.env))].sort();
    const groups: { label: string; cells: HeatmapCell[] }[] = [];

    for (const env of envs) {
      const envData = data.filter((d) => d.env === env);
      const passCount = envData.filter((d) => d.status === "PASS").length;
      const total = envData.length;

      if (total === 0) continue;

      const passRate = Math.round((passCount / total) * 100);
      groups.push({
        label: env,
        cells: [
          { label: "Rate", env, status: passRate >= 80 ? "PASS" : passRate > 0 ? "FAIL" : "NONE", count: passRate }
        ],
      });
    }

    return groups;
  }, [data]);

  if (grid.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: 24, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}>NO HEATMAP DATA</div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ overflow: "hidden", display: "flex", flexDirection: "column", padding: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <Grid3x3 size={14} style={{ color: "var(--proof-blue)" }} />
        Environment Thermal Map
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${grid.length}, 1fr)`, gap: 16 }}>
        {grid.map(group => {
          const passRate = group.cells[0].count;
          const isCritical = passRate < 80;
          return (
            <div key={group.label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--proof-text-muted)" }}>{group.label}</div>
              <div style={{ 
                height: 64, 
                background: isCritical ? "var(--proof-red)" : "var(--proof-green)",
                opacity: isCritical ? 1 : (passRate / 100),
                border: `1px solid ${isCritical ? "var(--proof-red-bright)" : "var(--proof-green-bright)"}`,
                boxShadow: isCritical ? "var(--proof-glow-red)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <span className="metric-number" style={{ fontSize: 24, color: isCritical ? "#fff" : "rgba(0,0,0,0.8)" }}>
                  {passRate}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
});

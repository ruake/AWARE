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
      const failCount = envData.filter((d) => d.status === "FAIL").length;
      const total = envData.length;

      if (total === 0) continue;

      const passRate = Math.round((passCount / total) * 100);
      groups.push({
        label: env,
        cells: [
          {
            label: "Pass",
            env,
            status: "PASS",
            count: passCount,
          },
          {
            label: "Fail",
            env,
            status: "FAIL",
            count: failCount,
          },
          {
            label: "Rate",
            env,
            status: passRate >= 80 ? "PASS" : passRate > 0 ? "FAIL" : "NONE",
            count: passRate,
          },
        ],
      });
    }

    return groups;
  }, [data]);

  if (grid.length === 0) {
    return (
      <div className="proof-card" style={{ padding: "14px 16px", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ padding: "12px", background: "var(--proof-surface-2)", borderRadius: "50%", color: "var(--proof-text-muted)" }}>
            <Grid3x3 size={24} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--proof-text-secondary)" }}>No heatmap data available</div>
        </div>
      </div>
    );
  }

  const cellColor = (status: "PASS" | "FAIL" | "NONE") => {
    if (status === "PASS") return "var(--proof-emerald-bg)";
    if (status === "FAIL") return "var(--proof-red-bg)";
    return "var(--proof-surface-3)";
  };

  const cellImage = (status: "PASS" | "FAIL" | "NONE") => {
    if (status === "FAIL") {
      return "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px)";
    }
    return "none";
  };

  const borderColor = (status: "PASS" | "FAIL" | "NONE") => {
    if (status === "PASS") return "var(--proof-emerald-border)";
    if (status === "FAIL") return "var(--proof-red-border)";
    return "var(--proof-border)";
  };

  const textColor = (status: "PASS" | "FAIL" | "NONE") => {
    if (status === "PASS") return "var(--proof-emerald-bright)";
    if (status === "FAIL") return "var(--proof-red-bright)";
    return "var(--proof-text-secondary)";
  };

  return (
    <div className="proof-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--proof-border)",
          background: "var(--proof-surface-2)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Grid3x3 size={18} style={{ color: "var(--proof-blue)" }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--proof-text)" }}>
          Environment Heatmap
        </span>
        <span style={{ fontSize: 12, color: "var(--proof-text-muted)", marginLeft: "auto", fontWeight: 600, background: "var(--proof-surface-3)", padding: "2px 10px", borderRadius: "12px" }}>
          {grid.length} ENVS
        </span>
      </div>

      <div style={{ padding: "20px", overflowX: "auto", background: "var(--proof-surface)", flex: 1 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `140px repeat(${grid.length > 0 ? Math.max(...grid.map((g) => g.cells.length), 1) : 1}, 1fr)`,
            gap: 8,
            fontSize: 12,
          }}
        >
          <div
            style={{ fontWeight: 600, color: "var(--proof-text-muted)", padding: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Environment
          </div>
          {grid[0]?.cells.map((cell) => (
            <div
              key={cell.label}
              style={{
                fontWeight: 600,
                color: "var(--proof-text-muted)",
                textAlign: "center",
                padding: "8px",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              {cell.label}
            </div>
          ))}

          {grid.map((group) => (
            <React.Fragment key={group.label}>
              <div
                style={{
                  padding: "12px 16px",
                  fontWeight: 600,
                  color: "var(--proof-text)",
                  display: "flex",
                  alignItems: "center",
                  fontSize: 13,
                  background: "var(--proof-surface-2)",
                  borderRadius: "var(--proof-radius) 0 0 var(--proof-radius)",
                  borderLeft: "3px solid var(--proof-blue)"
                }}
              >
                {group.label}
              </div>
              {group.cells.map((cell, i) => (
                <div
                  key={`${cell.label}-${i}`}
                  style={{
                    padding: "12px",
                    background: cellColor(cell.status),
                    backgroundImage: cellImage(cell.status),
                    border: `1px solid ${borderColor(cell.status)}`,
                    borderRadius: i === group.cells.length - 1 ? "0 var(--proof-radius) var(--proof-radius) 0" : 0,
                    textAlign: "center",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    color: textColor(cell.status),
                    fontSize: cell.label === "Rate" ? 15 : 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform var(--proof-transition)",
                    cursor: "default"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.zIndex = "1";
                    e.currentTarget.style.boxShadow = "var(--proof-shadow-sm)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.zIndex = "0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {cell.label === "Rate" ? `${cell.count}%` : cell.count}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
});

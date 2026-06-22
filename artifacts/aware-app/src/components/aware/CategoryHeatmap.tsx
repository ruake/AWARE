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
      <div className="proof-card" style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: "var(--proof-text-secondary)", textAlign: "center" }}>
          No heatmap data available
        </div>
      </div>
    );
  }

  const cellColor = (status: "PASS" | "FAIL" | "NONE") => {
    if (status === "PASS") return "rgba(16, 185, 129, 0.1)";
    if (status === "FAIL") return "rgba(239, 68, 68, 0.1)";
    return "var(--proof-surface-3)";
  };

  const borderColor = (status: "PASS" | "FAIL" | "NONE") => {
    if (status === "PASS") return "rgba(16, 185, 129, 0.2)";
    if (status === "FAIL") return "rgba(239, 68, 68, 0.2)";
    return "var(--proof-border)";
  };

  const textColor = (status: "PASS" | "FAIL" | "NONE") => {
    if (status === "PASS") return "var(--proof-green)";
    if (status === "FAIL") return "var(--proof-red)";
    return "var(--proof-text-secondary)";
  };

  return (
    <div className="proof-card" style={{ overflow: "hidden", borderRadius: "16px" }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--proof-border)",
          background: "var(--proof-surface-2)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Grid3x3 size={16} style={{ color: "var(--proof-blue)" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>
          Environment Heatmap
        </span>
        <span style={{ fontSize: 11, color: "var(--proof-text-muted)", marginLeft: "auto", fontWeight: 600 }}>
          {grid.length} ENVIRONMENTS
        </span>
      </div>

      <div style={{ padding: "16px", overflowX: "auto", background: "var(--proof-surface-1)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `140px repeat(${Math.max(...grid.map((g) => g.cells.length), 1)}, 80px)`,
            gap: 6,
            fontSize: 11,
          }}
        >
          <div
            style={{ fontWeight: 700, color: "var(--proof-text-muted)", padding: "4px 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Environment
          </div>
          {grid[0]?.cells.map((cell) => (
            <div
              key={cell.label}
              style={{
                fontWeight: 700,
                color: "var(--proof-text-muted)",
                textAlign: "center",
                padding: "4px 8px",
                fontSize: 10,
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
                  padding: "8px 12px",
                  fontWeight: 600,
                  color: "var(--proof-text)",
                  display: "flex",
                  alignItems: "center",
                  fontSize: 12,
                  background: "var(--proof-surface-2)",
                  borderRadius: "8px 0 0 8px",
                  borderLeft: "3px solid var(--proof-blue)"
                }}
              >
                {group.label}
              </div>
              {group.cells.map((cell) => (
                <div
                  key={cell.label}
                  style={{
                    padding: "8px 12px",
                    background: cellColor(cell.status),
                    border: `1px solid ${borderColor(cell.status)}`,
                    textAlign: "center",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: textColor(cell.status),
                    fontSize: cell.label === "Rate" ? 14 : 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.2s",
                    cursor: "default"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.zIndex = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.zIndex = "0";
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

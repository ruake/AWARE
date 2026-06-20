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

export function CategoryHeatmap({ data }: CategoryHeatmapProps) {
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

  const cellColor = (status: "PASS" | "FAIL" | "NONE", count: number) => {
    if (status === "PASS") {
      const intensity = Math.min(1, count / 10);
      return `rgba(34,197,94,${0.1 + intensity * 0.6})`;
    }
    if (status === "FAIL") {
      const intensity = Math.min(1, count / 5);
      return `rgba(239,68,68,${0.1 + intensity * 0.6})`;
    }
    return "var(--proof-grey-bg)";
  };

  const borderColor = (status: "PASS" | "FAIL" | "NONE") => {
    if (status === "PASS") return "rgba(34,197,94,0.3)";
    if (status === "FAIL") return "rgba(239,68,68,0.3)";
    return "var(--proof-border)";
  };

  const textColor = (status: "PASS" | "FAIL" | "NONE") => {
    if (status === "PASS") return "var(--proof-green)";
    if (status === "FAIL") return "var(--proof-red)";
    return "var(--proof-text-secondary)";
  };

  return (
    <div className="proof-card" style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--proof-grey)",
          background: "var(--proof-grey-bg)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Grid3x3 size={14} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
          Environment Heatmap
        </span>
        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginLeft: "auto" }}>
          {grid.length} environments
        </span>
      </div>

      <div style={{ padding: "12px 14px", overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `120px repeat(${Math.max(...grid.map((g) => g.cells.length), 1)}, 72px)`,
            gap: 3,
            fontSize: 11,
          }}
        >
          <div
            style={{ fontWeight: 600, color: "var(--proof-text-secondary)", padding: "4px 6px" }}
          >
            Environment
          </div>
          {grid[0]?.cells.map((cell) => (
            <div
              key={cell.label}
              style={{
                fontWeight: 600,
                color: "var(--proof-text-secondary)",
                textAlign: "center",
                padding: "4px 6px",
                fontSize: 10,
              }}
            >
              {cell.label}
            </div>
          ))}

          {grid.map((group) => (
            <React.Fragment key={group.label}>
              <div
                style={{
                  padding: "6px 8px",
                  fontWeight: 600,
                  color: "var(--proof-text)",
                  display: "flex",
                  alignItems: "center",
                  fontSize: 11,
                }}
              >
                {group.label}
              </div>
              {group.cells.map((cell) => (
                <div
                  key={cell.label}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 5,
                    background: cellColor(cell.status, cell.count),
                    border: `1px solid ${borderColor(cell.status)}`,
                    textAlign: "center",
                    fontWeight: 600,
                    fontFamily: cell.label === "Rate" ? "var(--font-mono)" : undefined,
                    color: textColor(cell.status),
                    fontSize: cell.label === "Rate" ? 13 : 11,
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
}

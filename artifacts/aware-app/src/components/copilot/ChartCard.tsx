import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { ChartData } from "@/lib/copilot/types";

interface Props {
  chartData: ChartData;
}

const DEFAULT_COLORS = ["var(--proof-blue)", "var(--proof-green)", "var(--proof-yellow)", "#a855f7", "var(--proof-red)", "#06b6d4"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TICK_STYLE: any = { fontSize: 10, fill: "var(--proof-text-secondary)" };

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--proof-surface-2)",
    border: "1px solid var(--proof-border)",
    borderRadius: 6,
    fontSize: 11,
    color: "var(--proof-text)",
  },
};

export default function ChartCard({ chartData }: Props) {
  const colors = chartData.colors ?? DEFAULT_COLORS;
  const { rows, xKey, yKeys, title, type } = chartData;

  if (!rows?.length) return null;

  return (
    <div
      style={{
        marginTop: 10,
        padding: "10px 4px 4px",
        borderRadius: 8,
        background: "var(--proof-surface-2)",
        border: "1px solid var(--proof-border)",
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--proof-text-secondary)",
            paddingLeft: 8,
            paddingBottom: 6,
          }}
        >
          {title}
        </div>
      )}

      {/* ── Line Chart (pass rate trends) ────────────────────────────────── */}
      {type === "line" && (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={rows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--proof-border)" />
            <XAxis
              dataKey={xKey}
              tick={TICK_STYLE}
              tickFormatter={(v: string) => String(v).slice(0, 8)}
            />
            <YAxis tick={TICK_STYLE} domain={[0, 100]} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "Pass Rate"]} />
            {yKeys.map((k, i) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={colors[i] ?? DEFAULT_COLORS[i]}
                strokeWidth={2}
                dot={rows.length <= 12}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* ── Bar Chart — vertical bars (column chart for env comparison) ────── */}
      {type === "column" && (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={rows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--proof-border)" />
            <XAxis dataKey={xKey} tick={TICK_STYLE} />
            <YAxis tick={TICK_STYLE} domain={[0, 100]} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, ""]} />
            {yKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={colors[i] ?? DEFAULT_COLORS[i]} radius={[3, 3, 0, 0]}>
                {rows.map((_, ri) => (
                  <Cell key={ri} fill={colors[ri] ?? DEFAULT_COLORS[ri % DEFAULT_COLORS.length]} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* ── Bar Chart — horizontal bars (for rankings / flakiness) ──────── */}
      {type === "bar" && (
        <ResponsiveContainer width="100%" height={Math.max(120, rows.length * 24)}>
          <BarChart layout="vertical" data={rows} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--proof-border)" horizontal={false} />
            <XAxis type="number" tick={TICK_STYLE} />
            <YAxis
              dataKey={xKey}
              type="category"
              width={90}
              tick={{ ...TICK_STYLE, fontSize: 9 }}
              tickFormatter={(v: string) => String(v).slice(0, 14)}
            />
            <Tooltip {...TOOLTIP_STYLE} />
            {yKeys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                fill={colors[i] ?? DEFAULT_COLORS[i]}
                radius={[0, 3, 3, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* ── Pie Chart (promotion decisions) ─────────────────────────────── */}
      {type === "pie" && (
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={rows}
              dataKey={yKeys[0]}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={60}
              innerRadius={35}
              paddingAngle={2}
            >
              {rows.map((_, i) => (
                <Cell key={i} fill={colors[i] ?? DEFAULT_COLORS[i]} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ fontSize: 10, color: "var(--proof-text-secondary)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

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
  AreaChart,
  Area,
} from "recharts";

const TICK_STYLE = { fontSize: 10, fill: "var(--proof-text-secondary)" };
const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--proof-surface-2)",
    border: "1px solid var(--proof-border)",
    borderRadius: 6,
    fontSize: 11,
    color: "var(--proof-text)",
  },
};
const DEFAULT_COLORS = ["#5b8af5", "#f59e0b", "#22c55e", "#ef4444", "#a855f7", "#06b6d4", "#ec4899"];

interface ChartConfig {
  type?: string;
  title?: string;
  headers?: string[];
  rows?: unknown[][];
  colors?: string[];
  pointSize?: number;
  curveType?: string;
  isStacked?: boolean;
  pieHole?: number;
  height?: string;
  options?: Record<string, unknown>;
}

function buildChartData(headers: string[], rows: unknown[][]): Record<string, unknown>[] {
  if (!headers || headers.length === 0) return [];
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

function guessYKeys(headers: string[]): string[] {
  return headers.slice(1);
}

export function MarkdownChart({ config }: { config: ChartConfig }) {
  const rows = config.rows || [];
  const headers = config.headers || ["X", "Y"];
  const colors = config.colors || DEFAULT_COLORS;
  const height = config.height || "200px";
  const chartData = React.useMemo(
    () => buildChartData(headers, rows),
    [headers, rows],
  );
  const yKeys = guessYKeys(headers);
  const title = config.title || "";
  const h = parseInt(height) || 200;

  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: 12,
          fontSize: 11,
          color: "var(--proof-text-secondary)",
          textAlign: "center",
        }}
      >
        No data
      </div>
    );
  }

  const type = (config.type || "ColumnChart").toLowerCase();

  const titleEl = title ? (
    <div
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "var(--proof-text-secondary)",
        paddingBottom: 6,
      }}
    >
      {title}
    </div>
  ) : null;

  if (type === "linechart" || type === "line") {
    return (
      <div style={{ margin: "6px 0" }}>
        {titleEl}
        <ResponsiveContainer width="100%" height={h}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--proof-border)" />
            <XAxis dataKey={headers[0]} tick={TICK_STYLE} />
            <YAxis tick={TICK_STYLE} />
            <Tooltip {...TOOLTIP_STYLE} />
            {yKeys.map((k, i) => (
              <Line
                key={k}
                type={config.curveType === "function" ? "monotone" : "linear"}
                dataKey={k}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                dot={(config.pointSize ?? 0) > 0 ? { r: config.pointSize } : false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "areachart" || type === "area") {
    return (
      <div style={{ margin: "6px 0" }}>
        {titleEl}
        <ResponsiveContainer width="100%" height={h}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--proof-border)" />
            <XAxis dataKey={headers[0]} tick={TICK_STYLE} />
            <YAxis tick={TICK_STYLE} />
            <Tooltip {...TOOLTIP_STYLE} />
            {yKeys.map((k, i) => (
              <Area
                key={k}
                type={config.curveType === "function" ? "monotone" : "linear"}
                dataKey={k}
                stroke={colors[i % colors.length]}
                fill={colors[i % colors.length]}
                fillOpacity={0.08}
                strokeWidth={2}
                dot={(config.pointSize ?? 0) > 0 ? { r: config.pointSize } : false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "barchart" || type === "bar") {
    return (
      <div style={{ margin: "6px 0" }}>
        {titleEl}
        <ResponsiveContainer width="100%" height={Math.max(h, rows.length * 28)}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--proof-border)" horizontal={false} />
            <XAxis type="number" tick={TICK_STYLE} />
            <YAxis
              dataKey={headers[0]}
              type="category"
              width={90}
              tick={{ ...TICK_STYLE, fontSize: 9 }}
            />
            <Tooltip {...TOOLTIP_STYLE} />
            {yKeys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                fill={colors[i % colors.length]}
                radius={[0, 3, 3, 0]}
                stackId={config.isStacked ? "stack" : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "piechart" || type === "pie") {
    const pieData = chartData.map((row) => ({
      name: row[headers[0]],
      value: row[yKeys[0]],
    }));
    const innerR = (config.pieHole ?? 0) > 0 ? 0.4 * Math.min(h / 2, 80) : 0;
    return (
      <div style={{ margin: "6px 0" }}>
        {titleEl}
        <ResponsiveContainer width="100%" height={h}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={Math.min(h / 2 - 10, 80)}
              innerRadius={innerR}
              paddingAngle={2}
              label={({ name, percent }) =>
                percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
              }
              labelLine
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
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
      </div>
    );
  }

  // Default: ColumnChart (vertical bars)
  return (
    <div style={{ margin: "6px 0" }}>
      {titleEl}
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--proof-border)" />
          <XAxis dataKey={headers[0]} tick={TICK_STYLE} />
          <YAxis tick={TICK_STYLE} />
          <Tooltip {...TOOLTIP_STYLE} />
          {yKeys.map((k, i) => (
            <Bar
              key={k}
              dataKey={k}
              fill={colors[i % colors.length]}
              radius={[3, 3, 0, 0]}
              stackId={config.isStacked ? "stack" : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

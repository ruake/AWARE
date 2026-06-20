import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { TestStats } from "@/lib/types";
import type { ColumnFilterState } from "@/components/aware/ColumnFilter";
import { CATEGORY_COLORS } from "@/lib/constants";

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

export function StatsDashboard({
  stats,
  colFilters: _colFilters,
  onToggleFilter,
}: {
  stats: TestStats;
  colFilters: Record<string, ColumnFilterState>;
  onToggleFilter: (field: string, value: string) => void;
}) {
  const statusData = Object.entries(stats.byStatus).map(([k, v]) => ({
    status: k,
    count: v,
  }));
  const priorityData = Object.entries(stats.byPriority)
    .sort()
    .map(([k, v]) => ({
      priority: k,
      count: v,
    }));
  const categoryData: Record<string, number> = Object.fromEntries(
    Object.entries(stats.byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8),
  );
  const catColors = Object.keys(categoryData).map(
    (_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  );

  const catPieData = Object.entries(categoryData).map(([k, v]) => ({
    name: k,
    value: v,
  }));

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div
          className="proof-card"
          style={{ padding: "8px 14px", cursor: "pointer", flex: 1, minWidth: 100 }}
          onClick={() => onToggleFilter("_clear", "")}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--proof-blue)" }}>
            {stats.total}
          </div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>Total Tests</div>
        </div>
        <div
          className="proof-card"
          style={{ padding: "8px 14px", cursor: "pointer", flex: 1, minWidth: 100 }}
          onClick={() => onToggleFilter("automated", "true")}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--proof-green)" }}>
            {stats.automated}
          </div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>Automated</div>
        </div>
        <div className="proof-card" style={{ padding: "8px 14px", flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--proof-text)" }}>
            {stats.coverage}%
          </div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>Coverage</div>
        </div>
        <div className="proof-card" style={{ padding: "8px 14px", flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--proof-text)" }}>
            {stats.avgVersion}
          </div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>Avg Version</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div className="proof-card" style={{ padding: "8px 10px", flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", marginBottom: 4 }}>
            By Status
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={statusData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="status" tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip {...TOOLTIP_STYLE} cursor={false} />
              <Bar
                dataKey="count"
                fill="#5b8af5"
                radius={[3, 3, 0, 0]}
                onClick={(data) => onToggleFilter("status", String(data.status))}
                style={{ cursor: "pointer" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="proof-card" style={{ padding: "8px 10px", flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", marginBottom: 4 }}>
            By Priority
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={priorityData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="priority" tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip {...TOOLTIP_STYLE} cursor={false} />
              <Bar
                dataKey="count"
                fill="#5b8af5"
                radius={[3, 3, 0, 0]}
                onClick={(data) => onToggleFilter("priority", String(data.priority))}
                style={{ cursor: "pointer" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="proof-card" style={{ padding: "8px 10px", flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", marginBottom: 4 }}>
            By Category
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <PieChart>
              <Pie
                data={catPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={35}
                innerRadius={0}
                paddingAngle={1}
              >
                {catPieData.map((_, i) => (
                  <Cell key={i} fill={catColors[i % catColors.length]} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

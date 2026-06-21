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

const STATUS_BAR_COLORS: Record<string, string> = {
  active: "var(--proof-green)",
  disabled: "var(--proof-yellow)",
  deprecated: "var(--proof-red)",
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

  const hasStatusData = statusData.length > 0;
  const hasPriorityData = priorityData.length > 0;
  const hasCategoryData = catPieData.length > 0;

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
          style={{ padding: "8px 14px", cursor: "pointer", flex: 1, minWidth: 90 }}
          onClick={() => onToggleFilter("_clear", "")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onToggleFilter("_clear", "")}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--proof-blue)", lineHeight: 1.2 }}>
            {stats.total}
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>Total Tests</div>
        </div>
        <div
          className="proof-card"
          style={{ padding: "8px 14px", cursor: "pointer", flex: 1, minWidth: 90 }}
          onClick={() => onToggleFilter("automated", "true")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onToggleFilter("automated", "true")}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--proof-green)", lineHeight: 1.2 }}>
            {stats.automated}
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>Automated</div>
        </div>
        <div className="proof-card" style={{ padding: "8px 14px", flex: 1, minWidth: 90 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--proof-text)", lineHeight: 1.2 }}>
            {stats.coverage}%
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>Coverage</div>
        </div>
        <div className="proof-card" style={{ padding: "8px 14px", flex: 1, minWidth: 90 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--proof-text)", lineHeight: 1.2 }}>
            {stats.avgVersion}
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>Avg Version</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div className="proof-card" style={{ padding: "8px 10px", flex: 1, minWidth: 200 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--proof-text-secondary)",
              marginBottom: 6,
            }}
          >
            By Status
          </div>
          {!hasStatusData && !stats.total ? (
            <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--proof-text-muted)" }}>
              No data available
            </div>
          ) : hasStatusData ? (
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={statusData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="status" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, "auto"]} />
                <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "var(--proof-subtle-bg)" }} />
                <Bar
                  dataKey="count"
                  radius={[3, 3, 0, 0]}
                  onClick={(data) => onToggleFilter("status", String(data.status))}
                  style={{ cursor: "pointer" }}
                >
                  {statusData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={STATUS_BAR_COLORS[entry.status] ?? "var(--proof-blue)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--proof-text-muted)" }}>
              No data
            </div>
          )}
        </div>
        <div className="proof-card" style={{ padding: "8px 10px", flex: 1, minWidth: 200 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--proof-text-secondary)",
              marginBottom: 6,
            }}
          >
            By Priority
          </div>
          {!hasPriorityData && !stats.total ? (
            <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--proof-text-muted)" }}>
              No data available
            </div>
          ) : hasPriorityData ? (
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={priorityData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="priority" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, "auto"]} />
                <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "var(--proof-subtle-bg)" }} />
                <Bar
                  dataKey="count"
                  fill="var(--proof-blue)"
                  radius={[3, 3, 0, 0]}
                  onClick={(data) => onToggleFilter("priority", String(data.priority))}
                  style={{ cursor: "pointer" }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--proof-text-muted)" }}>
              No data
            </div>
          )}
        </div>
        <div className="proof-card" style={{ padding: "8px 10px", flex: 1, minWidth: 200 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--proof-text-secondary)",
              marginBottom: 6,
            }}
          >
            By Category
          </div>
          {!hasCategoryData && !stats.total ? (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--proof-text-muted)" }}>
              No data available
            </div>
          ) : hasCategoryData ? (
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie
                  data={catPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={35}
                  innerRadius={14}
                  paddingAngle={2}
                  label={({ percent, name }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {catPieData.map((_, i) => (
                    <Cell key={i} fill={catColors[i % catColors.length]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--proof-text-muted)" }}>
              No data
            </div>
          )}
        </div>
      </div>
    </>
  );
}

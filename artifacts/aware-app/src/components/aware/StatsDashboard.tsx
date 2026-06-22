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
import { motion } from "framer-motion";

const TICK_STYLE = { fontSize: 10, fill: "var(--proof-text-secondary)", fontWeight: 500 };
const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--proof-surface-3)",
    border: "1px solid var(--proof-border)",
    borderRadius: 8,
    fontSize: 11,
    color: "var(--proof-text)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
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

  const cardMotionProps = {
    whileHover: { y: -3, transition: { duration: 0.2 } },
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* KPI Cards Row */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <motion.div
          {...cardMotionProps}
          transition={{ delay: 0.1 }}
          className="proof-card"
          style={{ padding: "16px 20px", cursor: "pointer", flex: 1, minWidth: 140, borderTop: "3px solid var(--proof-blue)" }}
          onClick={() => onToggleFilter("_clear", "")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onToggleFilter("_clear", "")}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--proof-blue)", lineHeight: 1, fontFamily: "var(--font-mono)", letterSpacing: "-1px" }}>
            {stats.total}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 6 }}>Total Tests</div>
        </motion.div>

        <motion.div
          {...cardMotionProps}
          transition={{ delay: 0.15 }}
          className="proof-card"
          style={{ padding: "16px 20px", cursor: "pointer", flex: 1, minWidth: 140, borderTop: "3px solid var(--proof-green)" }}
          onClick={() => onToggleFilter("automated", "true")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onToggleFilter("automated", "true")}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--proof-green)", lineHeight: 1, fontFamily: "var(--font-mono)", letterSpacing: "-1px" }}>
            {stats.automated}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 6 }}>Automated</div>
        </motion.div>

        <motion.div 
          {...cardMotionProps}
          transition={{ delay: 0.2 }}
          className="proof-card" 
          style={{ padding: "16px 20px", flex: 1, minWidth: 140, borderTop: "3px solid var(--proof-purple)" }}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--proof-text)", lineHeight: 1, fontFamily: "var(--font-mono)", letterSpacing: "-1px" }}>
            {stats.coverage}%
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 6 }}>Coverage</div>
        </motion.div>

        <motion.div 
          {...cardMotionProps}
          transition={{ delay: 0.25 }}
          className="proof-card" 
          style={{ padding: "16px 20px", flex: 1, minWidth: 140, borderTop: "3px solid var(--proof-orange)" }}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--proof-text)", lineHeight: 1, fontFamily: "var(--font-mono)", letterSpacing: "-1px" }}>
            {stats.avgVersion}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 6 }}>Avg Version</div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {/* Status Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="proof-card" 
          style={{ padding: "16px", flex: 1, minWidth: 280 }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--proof-blue)" }} />
            By Status
          </div>
          {!hasStatusData && !stats.total ? (
            <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--proof-text-muted)" }}>
              No data available
            </div>
          ) : hasStatusData ? (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={statusData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <XAxis dataKey="status" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, "auto"]} />
                <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "var(--proof-subtle-bg)" }} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
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
            <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--proof-text-muted)" }}>
              No data
            </div>
          )}
        </motion.div>

        {/* Priority Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="proof-card" 
          style={{ padding: "16px", flex: 1, minWidth: 280 }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--proof-purple)" }} />
            By Priority
          </div>
          {!hasPriorityData && !stats.total ? (
            <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--proof-text-muted)" }}>
              No data available
            </div>
          ) : hasPriorityData ? (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={priorityData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <XAxis dataKey="priority" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, "auto"]} />
                <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "var(--proof-subtle-bg)" }} />
                <Bar
                  dataKey="count"
                  fill="var(--proof-purple)"
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => onToggleFilter("priority", String(data.priority))}
                  style={{ cursor: "pointer" }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--proof-text-muted)" }}>
              No data
            </div>
          )}
        </motion.div>

        {/* Category Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="proof-card" 
          style={{ padding: "16px", flex: 1, minWidth: 280 }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--proof-green)" }} />
            By Category
          </div>
          {!hasCategoryData && !stats.total ? (
            <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--proof-text-muted)" }}>
              No data available
            </div>
          ) : hasCategoryData ? (
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={catPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={45}
                  innerRadius={25}
                  paddingAngle={4}
                  label={({ name }) => name}
                  labelLine={false}
                >
                  {catPieData.map((_, i) => (
                    <Cell key={i} fill={catColors[i % catColors.length]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--proof-text-muted)" }}>
              No data
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}


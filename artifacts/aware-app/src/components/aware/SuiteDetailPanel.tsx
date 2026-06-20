import React from "react";
import { useLocation } from "wouter";
import { FolderTree, X, Settings, PlayCircle, Beaker } from "lucide-react";
import type { TestSuite, TestCase } from "@/lib/types";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
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

function formatSchedule(sched: string | null): string {
  if (!sched) return "Manual";
  const p = sched.split(" ");
  if (p.length !== 5) return sched;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (p[2] === "*" && p[3] === "*" && p[4] !== "*")
    return `${p[4]
      .split(",")
      .map((d) => days[parseInt(d)] || d)
      .join(",")} ${p[0] === "0" ? `at ${p[1]}:00` : `*/${p[0]}h`}`;
  if (p[0] === "0" && p[2] === "*" && p[3] === "*" && p[4] === "*")
    return `Every ${p[1].replace("*/", "")} hours`;
  return sched;
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: "#ef4444",
  P1: "#f97316",
  P2: "#5b8af5",
  P3: "#9aa0a6",
};

interface SuiteDetailPanelProps {
  suite: TestSuite;
  tests: TestCase[];
  onClose: () => void;
  onTestSelect: (id: string) => void;
}

export function SuiteDetailPanel({ suite, tests, onClose, onTestSelect }: SuiteDetailPanelProps) {
  const [, navigate] = useLocation();
  const cats = [...new Set(tests.map((t) => t.category))];
  const activeCount = tests.filter((t) => t.status === "active").length;
  const priorityCounts: Record<string, number> = {};
  tests.forEach((t) => {
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
  });
  const priorityChart = Object.entries(priorityCounts)
    .sort()
    .map(([k, v]) => ({ priority: k, count: v }));
  const catCounts: Record<string, number> = {};
  tests.forEach((t) => {
    catCounts[t.category] = (catCounts[t.category] || 0) + 1;
  });
  const catChart = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => ({ category: k, count: v }));

  return (
    <div
      style={{
        width: 380,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--proof-surface)",
        borderLeft: "1px solid var(--proof-border)",
        borderTop: "1px solid var(--proof-border)",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FolderTree size={14} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {suite.name}
            </span>
          </h3>
          <p
            style={{
              fontSize: 11,
              color: "var(--proof-text-secondary)",
              margin: "2px 0 0 0",
              fontFamily: "var(--font-mono)",
            }}
          >
            {suite.id}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            padding: 2,
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {suite.description && (
          <p
            style={{
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {suite.description}
          </p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Tests", value: tests.length, color: "var(--proof-blue)" },
            { label: "Active", value: activeCount, color: "var(--proof-green)" },
            {
              label: "Parallelism",
              value: `${suite.config.parallelism}x`,
              color: "var(--proof-text)",
            },
            { label: "Retries", value: suite.config.retries, color: "var(--proof-text)" },
          ].map((s) => (
            <div
              key={s.label}
              className="proof-card"
              style={{ padding: "8px", textAlign: "center" }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div
                style={{
                  fontSize: 9,
                  color: "var(--proof-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          <span
            className="proof-badge proof-badge-pass"
            style={{ fontSize: 10, textTransform: "uppercase" }}
          >
            {suite.envIds.join(", ")}
          </span>
          <span
            className="proof-badge proof-badge-skip"
            style={{ fontSize: 10, textTransform: "capitalize" }}
          >
            {suite.runners.join(", ")}
          </span>
          {cats.map((cat) => {
            const ci = CATEGORIES.indexOf(cat) % CATEGORY_COLORS.length;
            return (
              <span
                key={cat}
                style={{
                  fontSize: 9,
                  padding: "1px 5px",
                  borderRadius: 3,
                  textTransform: "capitalize",
                  background: CATEGORY_COLORS[ci] + "18",
                  border: `1px solid ${CATEGORY_COLORS[ci]}30`,
                  color: CATEGORY_COLORS[ci],
                }}
              >
                {cat}
              </span>
            );
          })}
        </div>
        <div className="proof-card" style={{ padding: 10 }}>
          <h4
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              margin: "0 0 6px 0",
            }}
          >
            Priority Breakdown
          </h4>
          <div style={{ height: 80 }}>
            {priorityChart.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChart}>
                  <XAxis
                    dataKey="priority"
                    tick={{ fontSize: 9, fill: "var(--proof-text-secondary)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "var(--proof-surface)",
                      border: "1px solid var(--proof-border)",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    formatter={(val: number) => [val, "Tests"]}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {priorityChart.map((e) => (
                      <Cell key={e.priority} fill={PRIORITY_COLORS[e.priority] || "#9aa0a6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="proof-card" style={{ padding: 10 }}>
          <h4
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              margin: "0 0 6px 0",
            }}
          >
            Category
          </h4>
          <div
            style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {catChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catChart}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={16}
                    outerRadius={32}
                  >
                    {catChart.map((e) => {
                      const ci = CATEGORIES.indexOf(e.category) % CATEGORY_COLORS.length;
                      return <Cell key={e.category} fill={CATEGORY_COLORS[ci]} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--proof-surface)",
                      border: "1px solid var(--proof-border)",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>No data</span>
            )}
          </div>
        </div>
        <div className="proof-card" style={{ padding: 10 }}>
          <h4
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              margin: "0 0 6px 0",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Settings size={10} /> Configuration
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px 10px",
              fontSize: 11,
            }}
          >
            {[
              ["Env IDs", suite.envIds.join(", ")],
              ["Runners", suite.runners.join(", ")],
              ["Parallelism", `${suite.config.parallelism}x`],
              ["Retries", String(suite.config.retries)],
              ["Timeout", `${suite.config.timeoutMinutes}m`],
              ["Fail Fast", suite.config.failFast ? "Yes" : "No"],
              ["Schedule", formatSchedule(suite.schedule)],
            ].map(([l, v]) => (
              <div key={l!}>
                <span
                  style={{ fontSize: 9, color: "var(--proof-text-secondary)", display: "block" }}
                >
                  {l}
                </span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              margin: "0 0 6px 0",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Beaker size={10} /> Tests ({tests.length})
          </h4>
          <div className="proof-card" style={{ overflow: "hidden" }}>
            <table className="proof-table" style={{ width: "100%" }}>
              <colgroup>
                <col style={{ width: 20 }} />
                <col />
                <col />
              </colgroup>
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  background: "var(--proof-surface)",
                  zIndex: 1,
                }}
              >
                <tr>
                  <th />
                  <th>Name</th>
                  <th>Pri</th>
                </tr>
              </thead>
              <tbody>
                {tests.slice(0, 20).map((tc) => (
                  <tr key={tc.id} style={{ cursor: "pointer" }} onClick={() => onTestSelect(tc.id)}>
                    <td>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          display: "inline-block",
                          background:
                            tc.status === "active"
                              ? "var(--proof-green)"
                              : tc.status === "disabled"
                                ? "var(--proof-yellow)"
                                : "var(--proof-red)",
                        }}
                      />
                    </td>
                    <td style={{ fontSize: 12 }}>{tc.name}</td>
                    <td
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: PRIORITY_COLORS[tc.priority] || "var(--proof-text-secondary)",
                      }}
                    >
                      {tc.priority}
                    </td>
                  </tr>
                ))}
                {tests.length > 20 && (
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        textAlign: "center",
                        fontSize: 11,
                        color: "var(--proof-text-secondary)",
                        padding: "8px 0",
                      }}
                    >
                      +{tests.length - 20} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <button
          onClick={() => navigate(`/start?suite=${suite.id}`)}
          className="proof-button proof-button-primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <PlayCircle size={14} /> Run Suite
        </button>
      </div>
    </div>
  );
}

import React from "react";
import { useLocation } from "wouter";
import { FolderTree, X, Settings, PlayCircle, Beaker, Calendar, Layers, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TestSuite, TestCase } from "@/lib/types";

import { RUNS, getTestResultsForRun } from "@/lib/data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function formatSchedule(sched: string | null): string {
  if (!sched) return "Manual Only";
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
  P0: "var(--proof-red)",
  P1: "var(--proof-orange)",
  P2: "var(--proof-blue)",
  P3: "var(--proof-text-secondary)",
};

interface SuiteDetailPanelProps {
  suite: TestSuite | null;
  tests: TestCase[];
  onClose: () => void;
  onTestSelect: (id: string) => void;
}

export function SuiteDetailPanel({ suite, tests, onClose, onTestSelect }: SuiteDetailPanelProps) {
  const [, navigate] = useLocation();

  const suitePassRate = React.useMemo(() => {
    if (!suite) return null;
    const recentRuns = [...RUNS].slice(0, 5);
    let totalTests = 0;
    let passedTests = 0;

    for (const run of recentRuns) {
      const results = getTestResultsForRun(run.id);
      const suiteResults = results.filter((r) => suite.testIds.includes(r.id));
      totalTests += suiteResults.length;
      passedTests += suiteResults.filter((r) => r.status === "PASS").length;
    }

    return totalTests > 0 ? (passedTests / totalTests) * 100 : null;
  }, [suite]);

  if (!suite) return null;

  const _cats = [...new Set(tests.map((t) => t.category))];
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
  const _catChart = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => ({ category: k, count: v }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        style={{
          width: 440,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "rgba(9, 13, 20, 0.8)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(0,196,255,0.1)",
          boxShadow: "-12px 0 32px rgba(0,0,0,0.5)",
          zIndex: 10,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--proof-border)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "var(--proof-text)",
                letterSpacing: "0.5px"
              }}
            >
              <FolderTree size={20} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {suite.name}
              </span>
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "var(--proof-blue)",
                margin: "6px 0 0 0",
                fontFamily: "var(--font-mono)",
                opacity: 0.9,
              }}
            >
              {suite.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="proof-button-ghost"
            aria-label="Close"
            style={{ padding: 8, borderRadius: "50%", minWidth: "auto", background: "rgba(255,255,255,0.05)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {suite.description && (
            <p
              style={{
                fontSize: 13,
                color: "var(--proof-text-secondary)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {suite.description}
            </p>
          )}

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "Total Tests", value: tests.length, icon: <Beaker size={16} />, color: "var(--proof-blue)" },
              { label: "Active", value: activeCount, icon: <Activity size={16} />, color: "var(--proof-green)" },
              {
                label: "Pass Rate (Last 5)",
                value: suitePassRate !== null ? `${suitePassRate.toFixed(0)}%` : "--",
                icon: <Activity size={16} />,
                color:
                  suitePassRate === null
                    ? "var(--proof-text-secondary)"
                    : suitePassRate >= 95
                      ? "var(--proof-green)"
                      : suitePassRate >= 80
                        ? "var(--proof-yellow)"
                        : "var(--proof-red)",
              },
              {
                label: "Parallelism",
                value: `${suite.config.parallelism}x`,
                icon: <Layers size={16} />,
                color: "var(--proof-text)",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="glass-panel"
                style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8, borderRadius: "var(--proof-radius-md)", border: "1px solid var(--proof-border)", background: "rgba(255,255,255,0.02)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                  <span style={{ color: s.color }}>{s.icon}</span> {s.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-mono)", color: s.color, textShadow: `0 0 12px ${s.color}40` }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Quick Info Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {suite.envIds.map(env => (
              <span key={env} className="proof-badge" style={{ background: "rgba(91, 138, 245, 0.1)", color: "var(--proof-blue)", border: "1px solid rgba(91, 138, 245, 0.2)" }}>
                {env}
              </span>
            ))}
            {suite.runners.map(runner => (
              <span key={runner} className="proof-badge" style={{ background: "rgba(154, 160, 166, 0.1)", color: "var(--proof-text-secondary)", border: "1px solid rgba(154, 160, 166, 0.2)" }}>
                {runner}
              </span>
            ))}
            {suite.schedule && (
              <span className="proof-badge" style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--proof-yellow)", border: "1px solid rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar size={10} /> {formatSchedule(suite.schedule)}
              </span>
            )}
          </div>

          {/* Priority Distribution */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Priority Distribution
            </div>
            <div className="proof-card" style={{ padding: "16px 12px", height: 120 }}>
              {priorityChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChart} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis
                      dataKey="priority"
                      tick={{ fontSize: 10, fill: "var(--proof-text-secondary)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'var(--proof-surface-2)' }}
                      contentStyle={{
                        background: "var(--proof-surface)",
                        border: "1px solid var(--proof-border)",
                        borderRadius: 8,
                        fontSize: 11,
                        boxShadow: "var(--proof-shadow-md)"
                      }}
                      itemStyle={{ color: 'var(--proof-text)' }}
                      labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                      {priorityChart.map((e) => (
                        <Cell key={e.priority} fill={PRIORITY_COLORS[e.priority] || "var(--proof-text-secondary)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 12, color: "var(--proof-text-secondary)" }}>
                  No priority data
                </div>
              )}
            </div>
          </div>

          {/* Configuration List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <Settings size={12} /> Configuration
            </div>
            <div className="proof-card" style={{ padding: 0, overflow: "hidden" }}>
              {[
                ["Retries", String(suite.config.retries)],
                ["Timeout", `${suite.config.timeoutMinutes}m`],
                ["Fail Fast", suite.config.failFast ? "Yes" : "No"],
                ["Total Tests", String(tests.length)],
              ].map(([l, v], i) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    fontSize: 13,
                    borderBottom: i < 3 ? "1px solid var(--proof-border)" : "none",
                  }}
                >
                  <span style={{ color: "var(--proof-text-secondary)" }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Test List Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Test List ({tests.length})
            </div>
            <div className="proof-card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="proof-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--proof-surface-2)" }}>
                    <th style={{ width: 40, padding: "10px 12px" }}></th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11 }}>NAME</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11 }}>PRIORITY</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.slice(0, 15).map((tc) => (
                    <tr
                      key={tc.id}
                      style={{ cursor: "pointer", transition: "background 0.15s" }}
                      onClick={() => onTestSelect(tc.id)}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--proof-surface-2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background:
                              tc.status === "active"
                                ? "var(--proof-green)"
                                : tc.status === "disabled"
                                  ? "var(--proof-yellow)"
                                  : "var(--proof-red)",
                            margin: "0 auto"
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tc.name}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontSize: 11,
                          fontWeight: 700,
                          textAlign: "right",
                          color: PRIORITY_COLORS[tc.priority] || "var(--proof-text-secondary)",
                        }}
                      >
                        {tc.priority}
                      </td>
                    </tr>
                  ))}
                  {tests.length > 15 && (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          textAlign: "center",
                          fontSize: 12,
                          color: "var(--proof-text-secondary)",
                          padding: "12px 0",
                          fontStyle: "italic",
                          background: "var(--proof-surface-2)"
                        }}
                      >
                        Showing 15 of {tests.length} tests
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
            style={{ padding: "12px", fontSize: 14, marginTop: 10 }}
          >
            <PlayCircle size={18} />
            Launch Regression Suite
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

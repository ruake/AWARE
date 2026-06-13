import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useTestData } from "@/hooks/useTestData";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { useSyncedUrlState } from "@/lib/urlState";
import { computeTestStats, getAutoDiscoverySummary } from "@/lib/data";
import { exportAndDownload, exportAsXML, downloadFile } from "@/lib/testImportExport";
import type { TestCase, TestSuite } from "@/lib/types";
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
import { useLocation } from "wouter";
import {
  FolderTree,
  Beaker,
  Search,
  X,
  Download,
  Bug,
  Code,
  ExternalLink,
  PlayCircle,
  Settings,
  Clock,
} from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  P0: "#ef4444",
  P1: "#f97316",
  P2: "#5b8af5",
  P3: "#9aa0a6",
};

function formatSchedule(sched: string | null): string {
  if (!sched) return "Manual";
  const p = sched.split(" ");
  if (p.length !== 5) return sched;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (p[2] === "*" && p[3] === "*" && p[4] !== "*") {
    return `${p[4]
      .split(",")
      .map((d) => days[parseInt(d)] || d)
      .join(",")} ${p[0] === "0" ? `at ${p[1]}:00` : `*/${p[0]}h`}`;
  }
  if (p[0] === "0" && p[2] === "*" && p[3] === "*" && p[4] === "*") {
    return `Every ${p[1].replace("*/", "")} hours`;
  }
  return sched;
}

function getSuiteChildren(suite: TestSuite, allSuites: TestSuite[]): TestSuite[] {
  return allSuites.filter((s) => s.parentId === suite.id);
}

function getSuiteDepth(suite: TestSuite, allSuites: TestSuite[], depth = 0): number {
  if (!suite.parentId) return depth;
  const parent = allSuites.find((s) => s.id === suite.parentId);
  return parent ? getSuiteDepth(parent, allSuites, depth + 1) : depth;
}

function flattenSuites(suites: TestSuite[], allSuites: TestSuite[]): TestSuite[] {
  const result: TestSuite[] = [];
  function walk(s: TestSuite) {
    result.push(s);
    for (const c of getSuiteChildren(s, allSuites)) walk(c);
  }
  for (const s of suites.filter((s) => s.parentId === null)) walk(s);
  for (const s of suites.filter(
    (s) => s.parentId !== null && !allSuites.find((p) => p.id === s.parentId),
  ))
    result.push(s);
  return result;
}

export default function TestSuiteManager() {
  const { tcs, suites } = useTestData();
  const { show: toast, Toast } = useSimpleToast();
  const [selId, setSelId] = useSyncedUrlState<string | null>("sel", null);
  const [search, setSearch] = React.useState("");
  const [targetFilter, setTargetFilter] = React.useState("");
  const [scheduleFilter, setScheduleFilter] = React.useState("");

  const stats = React.useMemo(() => computeTestStats(), []);
  const discovery = React.useMemo(() => getAutoDiscoverySummary(), []);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return suites.filter((s) => {
      if (targetFilter && !s.envIds.includes(targetFilter as import("@/lib/types").AkamaiEnvId)) return false;
      if (scheduleFilter === "scheduled" && !s.schedule) return false;
      if (scheduleFilter === "manual" && s.schedule) return false;
      if (!q) return true;
      if (s.name.toLowerCase().includes(q)) return true;
      if (s.description.toLowerCase().includes(q)) return true;
      if (s.id.toLowerCase().includes(q)) return true;
      const t = tcs.filter((tc) => s.testIds.includes(tc.id));
      return t.some((tc) => tc.name.toLowerCase().includes(q));
    });
  }, [suites, tcs, search, targetFilter, scheduleFilter]);

  const flatSuites = React.useMemo(() => flattenSuites(filtered, suites), [filtered, suites]);
  const targets = React.useMemo(() => [...new Set(suites.flatMap((s) => s.envIds))], [suites]);

  const selectedSuite = selId ? (suites.find((s) => s.id === selId) ?? null) : null;
  const selectedTest = selId ? (tcs.find((tc) => tc.id === selId) ?? null) : null;
  const isTestSelected = selectedTest !== null;
  const activeSuite = isTestSelected
    ? (suites.find((s) => s.testIds.includes(selId!)) ?? null)
    : selectedSuite;

  React.useEffect(() => {
    if (selId && !activeSuite && !isTestSelected) {
      const tc = tcs.find((t) => t.id === selId);
      if (tc) {
        const parent = suites.find((s) => s.testIds.includes(tc.id));
        if (parent) setSelId(parent.id);
      }
    }
  }, [selId, tcs, suites, activeSuite, isTestSelected, setSelId]);

  const kpis = React.useMemo(
    () => [
      { label: "Total Suites", value: suites.length, color: "var(--proof-blue)" },
      { label: "Total Tests", value: tcs.length, color: "var(--proof-blue)" },
      {
        label: "Active Tests",
        value: tcs.filter((t) => t.status === "active").length,
        color: "var(--proof-green)",
      },
      {
        label: "Scheduled",
        value: suites.filter((s) => s.schedule).length,
        color: "var(--proof-orange)",
      },
      { label: "Coverage", value: `${stats.coverage}%`, color: "var(--proof-text)" },
    ],
    [suites, tcs, stats],
  );

  const handleExport = (format: "json" | "csv" | "junit_xml") => {
    if (format === "json") {
      exportAndDownload(tcs, "json");
    } else if (format === "junit_xml") {
      downloadFile(exportAsXML(tcs), "aware-tests.xml", "application/xml");
    } else {
      downloadFile(
        "id,name,category,priority,status,owner\n" +
          tcs
            .map((t) => `${t.id},"${t.name}",${t.category},${t.priority},${t.status},${t.owner}`)
            .join("\n"),
        "aware-tests.csv",
        "text/csv",
      );
    }
    toast(`Exported as ${format.toUpperCase()}`);
  };

  return (
    <AppLayout activeHref="/suites">
      <div
        style={{
          height: "calc(100vh - 100px)",
          maxWidth: 1600,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: "0 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            paddingTop: 2,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FolderTree size={20} style={{ color: "var(--proof-blue)" }} />
              Test Suites
            </h1>
            <p style={{ fontSize: 12, color: "var(--proof-text-secondary)", margin: "2px 0 0 0" }}>
              {suites.length} suites · {tcs.length} test cases
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => handleExport("json")} className="proof-button proof-button-xs">
              <Download size={11} /> Export
            </button>
            <div
              className="proof-button proof-button-xs"
              style={{ position: "relative", cursor: "pointer", padding: "4px 8px" }}
            >
              <Download size={11} />
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleExport(e.target.value as "json" | "csv" | "junit_xml");
                    e.target.value = "";
                  }
                }}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              >
                <option value="">Format...</option>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="junit_xml">JUnit XML</option>
              </select>
            </div>
          </div>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, flexShrink: 0 }}
        >
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="proof-card"
              style={{ padding: "12px", textAlign: "center" }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--proof-text-secondary)",
                  marginTop: 1,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                {kpi.label}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 4,
              border: "1px solid var(--proof-grey)",
              borderRadius: 6,
              padding: "6px 10px",
              background: "var(--proof-grey-bg)",
              maxWidth: 280,
            }}
          >
            <Search size={14} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suites..."
              style={{
                border: "none",
                outline: "none",
                fontSize: 12,
                background: "transparent",
                flex: 1,
                minWidth: 0,
                color: "var(--proof-text)",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--proof-text-secondary)",
                  fontSize: 14,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            style={{
              fontSize: 12,
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid var(--proof-grey)",
              background: "var(--proof-grey-bg)",
              color: "var(--proof-text)",
            }}
          >
            <option value="">All Targets</option>
            {targets.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value)}
            style={{
              fontSize: 12,
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid var(--proof-grey)",
              background: "var(--proof-grey-bg)",
              color: "var(--proof-text)",
            }}
          >
            <option value="">All Schedules</option>
            <option value="scheduled">Scheduled</option>
            <option value="manual">Manual</option>
          </select>
          <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
            {filtered.length} of {suites.length} suites
          </span>
          {discovery.total > 0 && (
            <span
              style={{
                fontSize: 11,
                color: "var(--proof-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Beaker size={12} style={{ color: "var(--proof-blue)" }} />
              <strong style={{ color: "var(--proof-blue)" }}>{discovery.total}</strong>{" "}
              auto-discovered · {discovery.sourceFiles} files
            </span>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", gap: 14, minHeight: 0 }}>
          <PanelErrorBoundary label="Suite table" height="100%">
            <div
              className="proof-card"
              style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              <div style={{ overflow: "auto", flex: 1 }}>
                <table className="proof-table" style={{ width: "100%" }}>
                  <colgroup>
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
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
                      <th>Suite</th>
                      <th style={{ textAlign: "center" }}>Tests</th>
                      <th>Schedule</th>
                      <th>Env IDs</th>
                      <th>Runners</th>
                      <th>Categories</th>
                      <th style={{ textAlign: "center" }}>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatSuites.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            textAlign: "center",
                            padding: "48px 16px",
                            color: "var(--proof-text-secondary)",
                            fontSize: 13,
                          }}
                        >
                          {search || targetFilter || scheduleFilter
                            ? "No suites match your filters"
                            : "No suites configured"}
                        </td>
                      </tr>
                    )}
                    {flatSuites.map((s) => {
                      const depth = getSuiteDepth(s, suites);
                      const suiteTests = tcs.filter((tc) => s.testIds.includes(tc.id));
                      const cats = [...new Set(suiteTests.map((tc) => tc.category))];
                      const activeCount = suiteTests.filter((tc) => tc.status === "active").length;
                      const isSelected = activeSuite?.id === s.id;
                      return (
                        <tr
                          key={s.id}
                          style={{
                            cursor: "pointer",
                            background: isSelected ? "var(--proof-blue-bg)" : undefined,
                          }}
                          onClick={() => {
                            setSelId(s.id);
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected)
                              e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "";
                          }}
                        >
                          <td style={{ verticalAlign: "middle" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                paddingLeft: `${depth * 16}px`,
                              }}
                            >
                              {depth > 0 && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: "var(--proof-text-muted)",
                                    fontFamily: "var(--font-mono)",
                                  }}
                                >
                                  └{" "}
                                </span>
                              )}
                              <FolderTree
                                size={13}
                                style={{ color: "var(--proof-blue)", flexShrink: 0 }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {s.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: "var(--proof-text-secondary)",
                                    fontFamily: "var(--font-mono)",
                                  }}
                                >
                                  {s.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              fontWeight: 700,
                              color: "var(--proof-blue)",
                              verticalAlign: "middle",
                              fontSize: 14,
                            }}
                          >
                            {s.testIds.length}
                          </td>
                          <td
                            style={{
                              fontSize: 11,
                              color: s.schedule ? "var(--proof-text)" : "var(--proof-text-muted)",
                              verticalAlign: "middle",
                              fontFamily: s.schedule ? "var(--font-mono)" : undefined,
                            }}
                          >
                            {s.schedule ? (
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <Clock size={11} style={{ color: "var(--proof-text-secondary)" }} />
                                {formatSchedule(s.schedule)}
                              </span>
                            ) : (
                              "Manual"
                            )}
                          </td>
                          <td style={{ verticalAlign: "middle" }}>
                            <span className="proof-badge proof-badge-pass" style={{ fontSize: 10 }}>
                              {s.envIds.join(", ")}
                            </span>
                          </td>
                          <td
                            style={{
                              fontSize: 11,
                              color: "var(--proof-text-secondary)",
                              verticalAlign: "middle",
                              textTransform: "capitalize",
                            }}
                          >
                            {s.runners.join(", ")}
                          </td>
                          <td style={{ verticalAlign: "middle" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
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
                          </td>
                          <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                            <span
                              className={`proof-badge ${activeCount === s.testIds.length ? "proof-badge-pass" : activeCount > 0 ? "proof-badge-flaky" : "proof-badge-fail"}`}
                              style={{ fontSize: 10 }}
                            >
                              {activeCount}/{s.testIds.length}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </PanelErrorBoundary>

          {activeSuite && !isTestSelected && (
            <PanelErrorBoundary label="Suite detail" height="100%">
              <SuiteDetailPanel
                suite={activeSuite}
                tests={tcs.filter((t) => activeSuite.testIds.includes(t.id))}
                onClose={() => setSelId(null)}
                onTestSelect={(testId) => setSelId(testId)}
              />
            </PanelErrorBoundary>
          )}

          {isTestSelected && selectedTest && (
            <PanelErrorBoundary label="Test detail" height="100%">
              <TestDetailPanel
                test={selectedTest}
                parentSuite={activeSuite}
                onClose={() => setSelId(null)}
              />
            </PanelErrorBoundary>
          )}
        </div>
      </div>
      {Toast}
    </AppLayout>
  );
}

function SuiteDetailPanel({
  suite,
  tests,
  onClose,
  onTestSelect,
}: {
  suite: TestSuite;
  tests: TestCase[];
  onClose: () => void;
  onTestSelect: (id: string) => void;
}) {
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
        width: 360,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--proof-surface)",
        borderRadius: 8,
        border: "1px solid var(--proof-grey)",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--proof-grey)",
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
          gap: 12,
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
                      border: "1px solid var(--proof-grey)",
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
            Category Distribution
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
                      border: "1px solid var(--proof-grey)",
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
              <div key={l}>
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

        {suite.config.integration && (
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
              Integrations
            </h4>
            <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 4 }}>
              {suite.config.integration.slackChannel && (
                <div>
                  <span style={{ color: "var(--proof-text-secondary)" }}>Slack: </span>
                  {suite.config.integration.slackChannel}
                </div>
              )}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {suite.config.integration.githubCommentPr && (
                  <span className="proof-badge proof-badge-pass" style={{ fontSize: 9 }}>
                    PR Comments
                  </span>
                )}
                {suite.config.integration.githubDeploymentStatus && (
                  <span className="proof-badge proof-badge-pass" style={{ fontSize: 9 }}>
                    Deploy Status
                  </span>
                )}
                {suite.config.integration.requireApproval && (
                  <span className="proof-badge proof-badge-flaky" style={{ fontSize: 9 }}>
                    Approval ({suite.config.integration.approvers.length})
                  </span>
                )}
              </div>
              {suite.config.integration.notifyOn.length > 0 && (
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {suite.config.integration.notifyOn.map((n) => (
                    <span
                      key={n}
                      className="proof-badge proof-badge-skip"
                      style={{ fontSize: 9, textTransform: "capitalize" }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
                    <td
                      style={{
                        fontSize: 12,
                      }}
                    >
                      {tc.name}
                    </td>
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

function TestDetailPanel({
  test,
  parentSuite,
  onClose,
}: {
  test: TestCase;
  parentSuite: TestSuite | null;
  onClose: () => void;
}) {
  const getGitHubUrl = (tc: TestCase) =>
    tc.githubUrl || `https://github.com/ruake/AWARE/blob/main/${tc.scriptPath}`;
  const cleanScriptPath = (tc: TestCase) => {
    if (!tc.scriptPath) return tc.id;
    return tc.scriptPath.split("/").slice(-2).join("/");
  };

  return (
    <div
      style={{
        width: 360,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--proof-surface)",
        borderRadius: 8,
        border: "1px solid var(--proof-grey)",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--proof-grey)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bug size={14} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {test.name}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--proof-text-secondary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {test.id}
            </div>
          </div>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div className="proof-card" style={{ padding: "8px 10px" }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 1,
              }}
            >
              Status
            </div>
            <span
              className={`proof-badge ${test.status === "active" ? "proof-badge-pass" : "proof-badge-fail"}`}
              style={{ fontSize: 10 }}
            >
              {test.status}
            </span>
          </div>
          <div className="proof-card" style={{ padding: "8px 10px" }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 1,
              }}
            >
              Priority
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: PRIORITY_COLORS[test.priority] || "var(--proof-text-secondary)",
              }}
            >
              {test.priority}
            </span>
          </div>
          <div className="proof-card" style={{ padding: "8px 10px" }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 1,
              }}
            >
              Category
            </div>
            <span
              style={{
                fontSize: 11,
                color: "var(--proof-text-secondary)",
                textTransform: "capitalize",
              }}
            >
              {test.category}
            </span>
          </div>
          <div className="proof-card" style={{ padding: "8px 10px" }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 1,
              }}
            >
              Type
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
              {test.testType}
            </span>
          </div>
        </div>

        {parentSuite && (
          <div
            style={{
              fontSize: 11,
              color: "var(--proof-text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FolderTree size={11} /> Suite: {parentSuite.name}
          </div>
        )}

        <div className="proof-card" style={{ padding: 10 }}>
          <h4
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              margin: "0 0 4px 0",
            }}
          >
            Description
          </h4>
          <p style={{ fontSize: 12, color: "var(--proof-text)", lineHeight: 1.5, margin: 0 }}>
            {test.description || "No description"}
          </p>
        </div>

        <div className="proof-card" style={{ padding: 10 }}>
          <h4
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              margin: "0 0 4px 0",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Code size={10} /> Script
          </h4>
          <a
            href={getGitHubUrl(test)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--proof-blue)",
              textDecoration: "underline",
              textUnderlineOffset: 2,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {cleanScriptPath(test)} <ExternalLink size={10} />
          </a>
        </div>

        {test.predicates.length > 0 && (
          <div className="proof-card" style={{ padding: 10 }}>
            <h4
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--proof-text-secondary)",
                fontWeight: 600,
                margin: "0 0 4px 0",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Code size={10} /> Predicates ({test.predicates.length})
            </h4>
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--proof-text)",
                lineHeight: 1.7,
              }}
            >
              {test.predicates.map((p, i) => (
                <div key={i}>
                  <span style={{ color: "var(--proof-blue)" }}>{p.field}</span> {p.operator}{" "}
                  <span style={{ color: "var(--proof-green)" }}>{p.expected}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="proof-card" style={{ padding: 10 }}>
          <h4
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              margin: "0 0 4px 0",
            }}
          >
            Assertions
          </h4>
          {test.assertions.length > 0 ? (
            <div style={{ fontSize: 11, lineHeight: 1.8 }}>
              {test.assertions.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 6 }}>
                  <span
                    style={{
                      color:
                        a.operator === "equals"
                          ? "var(--proof-green)"
                          : "var(--proof-text-secondary)",
                    }}
                  >
                    {a.operator}
                  </span>
                  <span style={{ color: "var(--proof-text-secondary)" }}>{a.field}</span>
                  <span>{a.expected}</span>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
              No assertions defined
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

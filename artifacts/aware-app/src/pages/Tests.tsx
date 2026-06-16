import React from "react";
import { useLocation } from "wouter";
import { getAutoDiscoveredTests } from "@/lib/data";
import { useTestData } from "@/hooks/useTestData";
import { ConsolePagination, PageShell } from "@/components/console";
import { Search, Globe, Server, Terminal, TestTube, Unlink, Zap, X, FolderTree, Bug, Code, ExternalLink, PlayCircle, Clock, Settings, Beaker } from "lucide-react";
import type { TestCase, TestSuite } from "@/lib/types";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const TEST_TYPES = ["All", "web", "api", "http", "edgeworker", "transaction", "pytest"] as const;
const TEST_CATEGORIES = ["All", "geo-match", "caching", "security", "performance", "functional", "general", "network", "screenshots", "url-health", "edge-routing", "http-protocol"] as const;
const STATUSES = ["All", "active", "disabled", "deprecated"] as const;
const PRIORITIES = ["All", "P0", "P1", "P2", "P3"] as const;

const TYPE_ICONS: Record<string, React.ReactNode> = {
  web: <Globe size={14} />, api: <Terminal size={14} />, http: <Server size={14} />,
  edgeworker: <Zap size={14} />, transaction: <Unlink size={14} />, pytest: <TestTube size={14} />,
};

const TYPE_COLORS: Record<string, string> = {
  web: "var(--proof-blue)", api: "var(--proof-green)", http: "var(--proof-purple)",
  edgeworker: "var(--proof-orange)", transaction: "var(--proof-cyan)", pytest: "var(--proof-yellow)",
};

const TYPE_BGS: Record<string, string> = {
  web: "rgba(59,130,246,0.12)", api: "rgba(34,197,94,0.12)", http: "rgba(168,85,247,0.12)",
  edgeworker: "rgba(245,158,11,0.12)", transaction: "rgba(6,182,212,0.12)", pytest: "rgba(234,179,8,0.12)",
};

const CAT_COLORS: Record<string, string> = {
  "geo-match": "var(--proof-blue)", caching: "var(--proof-purple)", security: "var(--proof-red)",
  performance: "var(--proof-green)", functional: "var(--proof-orange)", general: "var(--proof-text-secondary)",
  network: "var(--proof-cyan)", screenshots: "var(--proof-yellow)", "url-health": "var(--proof-pink)",
  "edge-routing": "var(--proof-indigo)", "http-protocol": "var(--proof-teal)",
};

const CAT_BGS: Record<string, string> = {
  "geo-match": "rgba(59,130,246,0.1)", caching: "rgba(168,85,247,0.1)", security: "rgba(239,68,68,0.1)",
  performance: "rgba(34,197,94,0.1)", functional: "rgba(245,158,11,0.1)", general: "rgba(154,160,166,0.1)",
  network: "rgba(6,182,212,0.1)", screenshots: "rgba(234,179,8,0.1)", "url-health": "rgba(236,72,153,0.1)",
  "edge-routing": "rgba(99,102,241,0.1)", "http-protocol": "rgba(20,184,166,0.1)",
};

const PRI_COLORS: Record<string, string> = { P0: "var(--proof-red)", P1: "var(--proof-yellow)", P2: "var(--proof-blue)", P3: "var(--proof-text-muted)" };
const PRI_BGS: Record<string, string> = { P0: "rgba(239,68,68,0.12)", P1: "rgba(234,179,8,0.12)", P2: "rgba(59,130,246,0.12)", P3: "rgba(154,160,166,0.08)" };
const STATUS_COLORS: Record<string, string> = { active: "var(--proof-green)", disabled: "var(--proof-yellow)", deprecated: "var(--proof-red)" };
const STATUS_BGS: Record<string, string> = { active: "rgba(34,197,94,0.12)", disabled: "rgba(234,179,8,0.12)", deprecated: "rgba(239,68,68,0.12)" };

const PAGE_SIZE = 25;

function formatSchedule(sched: string | null): string {
  if (!sched) return "Manual";
  const p = sched.split(" ");
  if (p.length !== 5) return sched;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (p[2] === "*" && p[3] === "*" && p[4] !== "*")
    return `${p[4].split(",").map((d) => days[parseInt(d)] || d).join(",")} ${p[0] === "0" ? `at ${p[1]}:00` : `*/${p[0]}h`}`;
  if (p[0] === "0" && p[2] === "*" && p[3] === "*" && p[4] === "*")
    return `Every ${p[1].replace("*/", "")} hours`;
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

export default function Tests() {
  const { tcs, suites } = useTestData();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const suiteFilter = params.get("suite") || "";
  const detailId = params.get("detail") || "";

  const [search, setSearch] = React.useState("");
  const [testType, setTestType] = React.useState("All");
  const [category, setCategory] = React.useState("All");
  const [status, setStatus] = React.useState("All");
  const [priority, setPriority] = React.useState("All");
  const [page, setPage] = React.useState(1);
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);

  const allTests = React.useMemo(() => getAutoDiscoveredTests(), []);

  const filtered = React.useMemo(() => {
    let result = allTests;
    if (suiteFilter) {
      const suite = suites.find((s) => s.id === suiteFilter);
      if (suite) result = result.filter((t) => suite.testIds.includes(t.id));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (testType !== "All") result = result.filter((t) => t.testType === testType);
    if (category !== "All") result = result.filter((t) => t.category === category);
    if (status !== "All") result = result.filter((t) => t.status === status);
    if (priority !== "All") result = result.filter((t) => t.priority === priority);
    return result;
  }, [allTests, suiteFilter, search, testType, category, status, priority, suites]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  const typeCounts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of allTests) c[t.testType] = (c[t.testType] || 0) + 1;
    return c;
  }, [allTests]);

  const categoryCounts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of allTests) c[t.category] = (c[t.category] || 0) + 1;
    return c;
  }, [allTests]);

  const selectedSuite = suiteFilter ? suites.find((s) => s.id === suiteFilter) ?? null : null;
  const selectedTest = detailId ? tcs.find((t) => t.id === detailId) ?? null : null;

  const getGitHubUrl = (tc: TestCase) => tc.githubUrl || `https://github.com/ruake/AWARE/blob/main/${tc.scriptPath}`;
  const cleanScriptPath = (tc: TestCase) => { if (!tc.scriptPath) return tc.id; return tc.scriptPath.split("/").slice(-2).join("/"); };

  const selectStyle: React.CSSProperties = {
    height: 32, fontSize: 12, background: "var(--proof-surface)", border: "1px solid var(--proof-border)",
    borderRadius: 4, color: "var(--proof-text)", padding: "0 8px", cursor: "pointer", outline: "none",
    fontFamily: "var(--font-sans)", minWidth: 110,
  };
  const inputStyle: React.CSSProperties = {
    height: 32, fontSize: 12, background: "var(--proof-surface)", border: "1px solid var(--proof-border)",
    borderRadius: 4, color: "var(--proof-text)", padding: "0 8px", outline: "none",
    fontFamily: "var(--font-sans)", width: 220,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px",
  };
  const cellStyle: React.CSSProperties = { padding: "8px 12px", fontSize: 12, borderBottom: "1px solid var(--proof-border)" };
  const thStyle: React.CSSProperties = {
    padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px",
    color: "var(--proof-text-secondary)", background: "var(--proof-surface-hover)", borderBottom: "1px solid var(--proof-border)",
    textAlign: "left", whiteSpace: "nowrap",
  };

  return (
    <PageShell title="Tests" subtitle={`${allTests.length} total tests · ${suites.length} suites`}>
      {/* Filter + export bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "var(--proof-sidebar-bg)", borderBottom: "1px solid var(--proof-border)", flexWrap: "wrap", flexShrink: 0 }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={14} style={{ position: "absolute", left: 8, color: "var(--proof-text-muted)", pointerEvents: "none" }} />
          <input type="text" placeholder="Search tests..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 28 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={labelStyle}>Type</span>
          <select value={testType} onChange={(e) => setTestType(e.target.value)} style={selectStyle}>
            {TEST_TYPES.map((t) => (<option key={t} value={t}>{t} {t !== "All" ? `(${typeCounts[t] || 0})` : ""}</option>))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={labelStyle}>Cat</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...selectStyle, minWidth: 100 }}>
            {TEST_CATEGORIES.map((c) => (<option key={c} value={c}>{c} {c !== "All" ? `(${categoryCounts[c] || 0})` : ""}</option>))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={labelStyle}>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...selectStyle, minWidth: 90 }}>
            {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={labelStyle}>Pri</span>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ ...selectStyle, minWidth: 75 }}>
            {PRIORITIES.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
        {suiteFilter && selectedSuite && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--proof-blue)", background: "var(--proof-blue)10", padding: "2px 8px", borderRadius: 4 }}>
            <FolderTree size={12} /> {selectedSuite.name}
            <button onClick={() => navigate("/tests")} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--proof-text-secondary)", padding: 0, lineHeight: 1 }}><X size={12} /></button>
          </div>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
            {filtered.length} of {allTests.length} tests
          </span>
        </div>
      </div>

      {/* Main area: table + optional detail panel */}
      <div style={{ flex: 1, display: "flex", gap: 0, minHeight: 0 }}>
        {/* Test table */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto", flex: 1, minHeight: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Type</th>
                  <th style={thStyle}>Category</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Priority</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Status</th>
                  <th style={thStyle}>Owner</th>
                  <th style={{ ...thStyle, textAlign: "center" }} />
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 48, color: "var(--proof-text-secondary)", fontSize: 13 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <Search size={24} style={{ opacity: 0.3 }} />
                        <span>No tests match the current filters</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((test) => (
                    <tr key={test.id} style={{ cursor: "pointer", background: hoveredRow === test.id ? "var(--proof-hover)" : "transparent", transition: "background 0.1s" }}
                      onMouseEnter={() => setHoveredRow(test.id)} onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => {
                        const filePath = test.scriptPath?.split("::")[0];
                        if (filePath) window.open(`https://github.com/ruake/AWARE/blob/main/${filePath}`, "_blank");
                      }}
                    >
                      <td style={{ ...cellStyle, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-text-secondary)", whiteSpace: "nowrap" }}>{test.id}</td>
                      <td style={{ ...cellStyle, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: "var(--proof-text)", maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ color: "var(--proof-blue)", transition: "color 0.1s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-blue-light, #60a5fa)"; (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-blue)"; (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
                        >{test.name}</span>
                      </td>
                      <td style={{ ...cellStyle, textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: TYPE_COLORS[test.testType] || "var(--proof-text-secondary)", background: TYPE_BGS[test.testType] || "rgba(154,160,166,0.08)" }}>
                          {TYPE_ICONS[test.testType] || null} {test.testType}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: CAT_COLORS[test.category] || "var(--proof-text-secondary)", background: CAT_BGS[test.category] || "rgba(154,160,166,0.08)" }}>
                          {test.category}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", padding: "1px 7px", borderRadius: 99, color: PRI_COLORS[test.priority] || "var(--proof-text-secondary)", background: PRI_BGS[test.priority] || "rgba(154,160,166,0.08)" }}>
                          {test.priority}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, color: STATUS_COLORS[test.status] || "var(--proof-text-secondary)", background: STATUS_BGS[test.status] || "rgba(154,160,166,0.08)" }}>
                          {test.status}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, fontSize: 11, color: "var(--proof-text-secondary)", whiteSpace: "nowrap" }}>{test.owner}</td>
                      <td style={{ ...cellStyle, textAlign: "center" }}>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/tests?suite=${suiteFilter}&detail=${test.id}`); }}
                          style={{ border: "none", background: "none", cursor: "pointer", color: detailId === test.id ? "var(--proof-blue)" : "var(--proof-text-muted)", padding: 2, display: "inline-flex" }}
                          title="Show details"
                        >
                          <Bug size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "0 16px", flexShrink: 0 }}>
            <ConsolePagination currentPage={clampedPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} onPageSizeChange={() => {}} pageSizeOptions={[PAGE_SIZE]} />
          </div>
        </div>

        {/* Detail panel */}
        {selectedTest && <TestDetailPanel test={selectedTest} parentSuite={selectedSuite} onClose={() => navigate(`/tests${suiteFilter ? `?suite=${suiteFilter}` : ""}`)} />}
        {!selectedTest && selectedSuite && <SuiteDetailPanel suite={selectedSuite} tests={tcs.filter((t) => selectedSuite.testIds.includes(t.id))} onClose={() => navigate("/tests")} onTestSelect={(testId) => navigate(`/tests?suite=${suiteFilter}&detail=${testId}`)} />}
      </div>
    </PageShell>
  );
}

function SuiteDetailPanel({ suite, tests, onClose, onTestSelect }: { suite: TestSuite; tests: TestCase[]; onClose: () => void; onTestSelect: (id: string) => void }) {
  const [, navigate] = useLocation();
  const cats = [...new Set(tests.map((t) => t.category))];
  const activeCount = tests.filter((t) => t.status === "active").length;
  const priorityCounts: Record<string, number> = {};
  tests.forEach((t) => { priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1; });
  const priorityChart = Object.entries(priorityCounts).sort().map(([k, v]) => ({ priority: k, count: v }));
  const catCounts: Record<string, number> = {};
  tests.forEach((t) => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
  const catChart = Object.entries(catCounts).sort(([, a], [, b]) => b - a).map(([k, v]) => ({ category: k, count: v }));
  const PRIORITY_COLORS: Record<string, string> = { P0: "#ef4444", P1: "#f97316", P2: "#5b8af5", P3: "#9aa0a6" };

  return (
    <div style={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--proof-surface)", borderLeft: "1px solid var(--proof-border)", borderTop: "1px solid var(--proof-border)" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--proof-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <FolderTree size={14} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{suite.name}</span>
          </h3>
          <p style={{ fontSize: 11, color: "var(--proof-text-secondary)", margin: "2px 0 0 0", fontFamily: "var(--font-mono)" }}>{suite.id}</p>
        </div>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--proof-text-secondary)", padding: 2, flexShrink: 0 }}><X size={16} /></button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {suite.description && <p style={{ fontSize: 12, color: "var(--proof-text-secondary)", margin: 0, lineHeight: 1.5 }}>{suite.description}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[{ label: "Tests", value: tests.length, color: "var(--proof-blue)" }, { label: "Active", value: activeCount, color: "var(--proof-green)" }, { label: "Parallelism", value: `${suite.config.parallelism}x`, color: "var(--proof-text)" }, { label: "Retries", value: suite.config.retries, color: "var(--proof-text)" }].map((s) => (
            <div key={s.label} className="proof-card" style={{ padding: "8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          <span className="proof-badge proof-badge-pass" style={{ fontSize: 10, textTransform: "uppercase" }}>{suite.envIds.join(", ")}</span>
          <span className="proof-badge proof-badge-skip" style={{ fontSize: 10, textTransform: "capitalize" }}>{suite.runners.join(", ")}</span>
          {cats.map((cat) => { const ci = CATEGORIES.indexOf(cat) % CATEGORY_COLORS.length; return <span key={cat} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, textTransform: "capitalize", background: CATEGORY_COLORS[ci] + "18", border: `1px solid ${CATEGORY_COLORS[ci]}30`, color: CATEGORY_COLORS[ci] }}>{cat}</span>; })}
        </div>
        <div className="proof-card" style={{ padding: 10 }}>
          <h4 style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--proof-text-secondary)", fontWeight: 600, margin: "0 0 6px 0" }}>Priority Breakdown</h4>
          <div style={{ height: 80 }}>
            {priorityChart.length > 0 && <ResponsiveContainer width="100%" height="100%"><BarChart data={priorityChart}><XAxis dataKey="priority" tick={{ fontSize: 9, fill: "var(--proof-text-secondary)" }} axisLine={false} tickLine={false} /><YAxis hide /><Tooltip contentStyle={{ background: "var(--proof-surface)", border: "1px solid var(--proof-border)", borderRadius: 6, fontSize: 11 }} formatter={(val: number) => [val, "Tests"]} /><Bar dataKey="count" radius={[3, 3, 0, 0]}>{priorityChart.map((e) => <Cell key={e.priority} fill={PRIORITY_COLORS[e.priority] || "#9aa0a6"} />)}</Bar></BarChart></ResponsiveContainer>}
          </div>
        </div>
        <div className="proof-card" style={{ padding: 10 }}>
          <h4 style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--proof-text-secondary)", fontWeight: 600, margin: "0 0 6px 0" }}>Category</h4>
          <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {catChart.length > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={catChart} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={16} outerRadius={32}>{catChart.map((e) => { const ci = CATEGORIES.indexOf(e.category) % CATEGORY_COLORS.length; return <Cell key={e.category} fill={CATEGORY_COLORS[ci]} />; })}</Pie><Tooltip contentStyle={{ background: "var(--proof-surface)", border: "1px solid var(--proof-border)", borderRadius: 6, fontSize: 11 }} /></PieChart></ResponsiveContainer> : <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>No data</span>}
          </div>
        </div>
        <div className="proof-card" style={{ padding: 10 }}>
          <h4 style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--proof-text-secondary)", fontWeight: 600, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: 3 }}><Settings size={10} /> Configuration</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px", fontSize: 11 }}>
            {[["Env IDs", suite.envIds.join(", ")], ["Runners", suite.runners.join(", ")], ["Parallelism", `${suite.config.parallelism}x`], ["Retries", String(suite.config.retries)], ["Timeout", `${suite.config.timeoutMinutes}m`], ["Fail Fast", suite.config.failFast ? "Yes" : "No"], ["Schedule", formatSchedule(suite.schedule)]].map(([l, v]) => (
              <div key={l!}><span style={{ fontSize: 9, color: "var(--proof-text-secondary)", display: "block" }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
            ))}
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--proof-text-secondary)", fontWeight: 600, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: 3 }}><Beaker size={10} /> Tests ({tests.length})</h4>
          <div className="proof-card" style={{ overflow: "hidden" }}>
            <table className="proof-table" style={{ width: "100%" }}>
              <colgroup><col style={{ width: 20 }} /><col /><col /></colgroup>
              <thead style={{ position: "sticky", top: 0, background: "var(--proof-surface)", zIndex: 1 }}>
                <tr><th /><th>Name</th><th>Pri</th></tr>
              </thead>
              <tbody>
                {tests.slice(0, 20).map((tc) => (
                  <tr key={tc.id} style={{ cursor: "pointer" }} onClick={() => onTestSelect(tc.id)}>
                    <td><span style={{ width: 7, height: 7, borderRadius: "50%", display: "inline-block", background: tc.status === "active" ? "var(--proof-green)" : tc.status === "disabled" ? "var(--proof-yellow)" : "var(--proof-red)" }} /></td>
                    <td style={{ fontSize: 12 }}>{tc.name}</td>
                    <td style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLORS[tc.priority] || "var(--proof-text-secondary)" }}>{tc.priority}</td>
                  </tr>
                ))}
                {tests.length > 20 && <tr><td colSpan={3} style={{ textAlign: "center", fontSize: 11, color: "var(--proof-text-secondary)", padding: "8px 0" }}>+{tests.length - 20} more</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <button onClick={() => navigate(`/start?suite=${suite.id}`)} className="proof-button proof-button-primary" style={{ width: "100%", justifyContent: "center" }}><PlayCircle size={14} /> Run Suite</button>
      </div>
    </div>
  );
}

function TestDetailPanel({ test, parentSuite, onClose }: { test: TestCase; parentSuite: TestSuite | null; onClose: () => void }) {
  const getGitHubUrl = (tc: TestCase) => tc.githubUrl || `https://github.com/ruake/AWARE/blob/main/${tc.scriptPath}`;
  const cleanScriptPath = (tc: TestCase) => { if (!tc.scriptPath) return tc.id; return tc.scriptPath.split("/").slice(-2).join("/"); };

  return (
    <div style={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--proof-surface)", borderLeft: "1px solid var(--proof-border)", borderTop: "1px solid var(--proof-border)" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--proof-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bug size={14} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{test.name}</div>
            <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)" }}>{test.id}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--proof-text-secondary)", padding: 2, flexShrink: 0 }}><X size={16} /></button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div className="proof-card" style={{ padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Status</div>
            <span className={`proof-badge ${test.status === "active" ? "proof-badge-pass" : "proof-badge-fail"}`} style={{ fontSize: 10 }}>{test.status}</span>
          </div>
          <div className="proof-card" style={{ padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Priority</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: PRI_COLORS[test.priority] || "var(--proof-text-secondary)" }}>{test.priority}</span>
          </div>
          <div className="proof-card" style={{ padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Category</div>
            <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", textTransform: "capitalize" }}>{test.category}</span>
          </div>
          <div className="proof-card" style={{ padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Type</div>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{test.testType}</span>
          </div>
        </div>
        {parentSuite && <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}><FolderTree size={11} /> Suite: {parentSuite.name}</div>}
        <div className="proof-card" style={{ padding: 10 }}>
          <h4 style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--proof-text-secondary)", fontWeight: 600, margin: "0 0 4px 0" }}>Description</h4>
          <p style={{ fontSize: 12, color: "var(--proof-text)", lineHeight: 1.5, margin: 0 }}>{test.description || "No description"}</p>
        </div>
        <div className="proof-card" style={{ padding: 10 }}>
          <h4 style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--proof-text-secondary)", fontWeight: 600, margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: 3 }}><Code size={10} /> Script</h4>
          <a href={getGitHubUrl(test)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--proof-blue)", textDecoration: "underline", textUnderlineOffset: 2, display: "flex", alignItems: "center", gap: 3 }}>{cleanScriptPath(test)} <ExternalLink size={10} /></a>
        </div>
        {test.predicates.length > 0 && (
          <div className="proof-card" style={{ padding: 10 }}>
            <h4 style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--proof-text-secondary)", fontWeight: 600, margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: 3 }}><Code size={10} /> Predicates ({test.predicates.length})</h4>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--proof-text)", lineHeight: 1.7 }}>
              {test.predicates.map((p, i) => (<div key={i}><span style={{ color: "var(--proof-blue)" }}>{p.field}</span> {p.operator} <span style={{ color: "var(--proof-green)" }}>{p.expected}</span></div>))}
            </div>
          </div>
        )}
        <div className="proof-card" style={{ padding: 10 }}>
          <h4 style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--proof-text-secondary)", fontWeight: 600, margin: "0 0 4px 0" }}>Assertions</h4>
          {test.assertions.length > 0 ? (
            <div style={{ fontSize: 11, lineHeight: 1.8 }}>
              {test.assertions.map((a, i) => (<div key={i} style={{ display: "flex", gap: 6 }}><span style={{ color: a.operator === "equals" ? "var(--proof-green)" : "var(--proof-text-secondary)" }}>{a.operator}</span><span style={{ color: "var(--proof-text-secondary)" }}>{a.field}</span><span>{a.expected}</span></div>))}
            </div>
          ) : (<span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>No assertions defined</span>)}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { AppLayout } from "@/components/aware/AppLayout";
import { DIFF_ROWS, TEST_DETAILS, generateTestHistory, getTestCases } from "@/lib/data";
import { ENVS } from "@/lib/constants";
import { useTestData } from "@/hooks/useTestData";
import {
  ArrowLeft, BarChart3, Clock, Activity, AlertTriangle,
  FileText, Search, Share2, ChevronRight, Zap,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";

export default function TestAnalytics() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();
  const { show, Toast } = useSimpleToast();
  const { tcs } = useTestData();

  const rawTestId = params.get("testId") ?? "";
  const rawDiffId = params.get("diffId") ?? "diff_0";
  const isTcMode = rawTestId.startsWith("tc_");

  const testCase = isTcMode ? tcs.find(t => t.id === rawTestId) : null;
  const selectedTestId = isTcMode ? rawTestId : rawDiffId;

  const idx = isTcMode ? Math.abs((testCase ? parseInt(testCase.id.replace("tc_", "")) : 0) % DIFF_ROWS.length) : Number(selectedTestId.replace("diff_", ""));
  const diffs = DIFF_ROWS;
  const diff = diffs[Math.min(idx, diffs.length - 1)] ?? diffs[0];
  const detail = TEST_DETAILS[idx % TEST_DETAILS.length] ?? generateTestHistory(idx);
  const selectorItems = isTcMode
    ? tcs.map(t => ({ id: t.id, name: t.name }))
    : diffs.map(d => ({ id: d.id, name: d.name }));

  const handleSelectChange = (id: string) => {
    const key = isTcMode ? "testId" : "diffId";
    navigate(`/analytics?${key}=${encodeURIComponent(id)}`, { replace: true });
  };

  const envStatus = ENVS.map(env => {
    const runs = detail.history.filter(h => h.env === env);
    const pass = runs.filter(r => r.status === "PASS").length;
    const fail = runs.filter(r => r.status === "FAIL").length;
    return { env: env.split("/")[0] + "/" + env.split("/")[1], pass, fail, total: runs.length };
  });

  const historyChartData = detail.history.map((h, i) => ({
    run: `R${1000 + i}`,
    status: h.status === "PASS" ? 1 : 0,
    duration: h.duration,
    env: h.env,
  }));

  const isFlaky = detail.flakinessScore > 20;
  const trend = detail.history.slice(-3).every(h => h.status === "FAIL") ? "degrading" :
    detail.history.slice(-3).every(h => h.status === "PASS") ? "stable" : "flaky";

  return (
    <AppLayout activeHref="/compare">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={isTcMode ? "/tests" : "/compare"}>
            <a className="gcp-button" style={{ fontSize: 12 }}><ArrowLeft size={13} /> {isTcMode ? "Tests" : "Compare"}</a>
          </Link>
          <ChevronRight size={14} style={{ color: "var(--gcp-text-secondary)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Search size={13} style={{ color: "var(--gcp-text-secondary)" }} />
            <select className="gcp-input" style={{ fontFamily: "var(--font-mono)", fontSize: 11, maxWidth: 340 }}
              value={selectedTestId} onChange={e => handleSelectChange(e.target.value)}>
              {selectorItems.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--gcp-text)", maxWidth: 700 }}>
              {isTcMode && testCase ? testCase.name : diff.name}
              {isTcMode && testCase && <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)", fontWeight: 400, marginLeft: 8, fontFamily: "var(--font-mono)" }}>{testCase.id} · v{testCase.version}</span>}
            </h1>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 11, background: "var(--gcp-grey-bg)", padding: "2px 8px", borderRadius: 4, border: "1px solid var(--gcp-grey)" }}>{isTcMode && testCase ? testCase.category : diff.category}</span>
              {isTcMode && testCase && <span style={{ fontSize: 11, fontWeight: 600, color: testCase.priority === "P0" ? "var(--gcp-red)" : "var(--gcp-text-secondary)" }}>{testCase.priority}</span>}
              {!isTcMode && <span style={{ fontSize: 11, fontWeight: 600, color: isFlaky ? "var(--gcp-yellow)" : "var(--gcp-green)" }}>
                {isFlaky ? "⚠ Flaky" : "✓ Stable"}
              </span>}
              <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{detail.history.length} runs tracked</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href).then(() => show("Permalink copied")); }}
              className="gcp-button" style={{ fontSize: 12 }}>
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>

        {/* Trend alert */}
        {trend === "degrading" && (
          <div style={{ background: "var(--gcp-red-bg)", border: "1px solid var(--gcp-red)", borderRadius: 4, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
            <AlertTriangle size={14} style={{ color: "var(--gcp-red)" }} />
            <strong>Degrading trend</strong> — last 3 runs all FAIL. Investigate before promoting Akamai changes.
            <button onClick={() => { navigator.clipboard.writeText(`Test degrading: ${diff.name}\nLast 3 runs: FAIL\nPass Rate: ${detail.passRate}%`).then(() => show("Alert copied")); }}
              className="gcp-button" style={{ fontSize: 11, marginLeft: "auto" }}>
              Copy Alert
            </button>
          </div>
        )}

        {/* KPI tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Pass Rate", value: `${detail.passRate}%`, sub: `${detail.history.length} runs`, color: "var(--gcp-blue)", bg: "var(--gcp-blue-bg)" },
            { label: "Flakiness", value: `${detail.flakinessScore}%`, sub: "status changes", color: isFlaky ? "var(--gcp-yellow)" : "var(--gcp-green)", bg: isFlaky ? "var(--gcp-yellow-bg)" : "var(--gcp-green-bg)" },
            { label: "Avg Duration", value: `${detail.avgDuration}ms`, sub: "across all runs", color: "var(--gcp-green)", bg: "var(--gcp-green-bg)" },
            { label: "Environments", value: ENVS.length, sub: "tested across", color: "var(--gcp-text-secondary)", bg: "var(--gcp-grey-bg)" },
          ].map(k => (
            <div key={k.label} className="gcp-card" style={{ padding: "16px 18px", background: k.bg, borderLeft: `4px solid ${k.color}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 6 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          <div className="gcp-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Activity size={13} /> Pass/Fail Across Runs
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={historyChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                <XAxis dataKey="run" tick={{ fontSize: 9, fill: "#5f6368" }} />
                <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={v => v === 1 ? "PASS" : "FAIL"} tick={{ fontSize: 9, fill: "#5f6368" }} />
                <Tooltip formatter={(v: number) => [v === 1 ? "PASS" : "FAIL", "Status"]} contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Bar dataKey="status" radius={[3,3,0,0]}>
                  {historyChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.status === 1 ? "#1e8e3e" : "#d93025"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="gcp-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={13} /> Duration Trend (ms)
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={historyChartData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                <XAxis dataKey="run" tick={{ fontSize: 9, fill: "#5f6368" }} />
                <YAxis tick={{ fontSize: 9, fill: "#5f6368" }} />
                <Tooltip formatter={(v: number) => [`${v}ms`, "Duration"]} contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Line type="monotone" dataKey="duration" stroke="#1e8e3e" strokeWidth={2} dot={{ r: 3, fill: "#1e8e3e" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Env breakdown */}
          <div className="gcp-card" style={{ padding: 16, gridColumn: "1 / -1" }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <BarChart3 size={13} /> Pass/Fail by Environment
            </h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={envStatus} layout="vertical" margin={{ top: 0, right: 20, left: 90, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f3f4" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#5f6368" }} />
                <YAxis dataKey="env" type="category" tick={{ fontSize: 10, fill: "#5f6368" }} width={90} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Bar dataKey="pass" fill="#1e8e3e" name="Pass" stackId="a" radius={[0,2,2,0]} />
                <Bar dataKey="fail" fill="#d93025" name="Fail" stackId="a" radius={[0,2,2,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Run history table */}
        <div className="gcp-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--gcp-text)" }}>Run History</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="gcp-table">
              <thead><tr>
                <th>Run ID</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Duration</th>
                <th>Environment</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {detail.history.map(h => (
                  <tr key={h.runId} style={{ cursor: "pointer" }}>
                    <td>
                      <Link href={`/runs/${h.runId}`}>
                        <a style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-blue)", textDecoration: "none" }}>{h.runId}</a>
                      </Link>
                    </td>
                    <td><span className={`gcp-badge ${h.status === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{h.status}</span></td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text-secondary)" }}>{h.duration}ms</td>
                    <td style={{ fontSize: 12 }}>{h.env}</td>
                    <td>
                      <Link href={`/runs/${h.runId}`}>
                        <a className="gcp-button" style={{ fontSize: 10, padding: "2px 7px" }}>View Run</a>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {Toast}
    </AppLayout>
  );
}

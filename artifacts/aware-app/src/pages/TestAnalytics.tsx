import React from "react";
import { Link, useLocation, useSearch } from "wouter";
import { GoogleBarChart, GoogleAreaChart } from "@/components/aware/GoogleCharts";
import { AppLayout } from "@/components/aware/AppLayout";
import { CTAStatCard } from "@/components/aware/CTAStatCard";
import { DIFF_ROWS, TEST_DETAILS, generateTestHistory, RUNS, getTestResultsForRun } from "@/lib/data";
import { getEnvLabels } from "@/lib/envConfig";
import { ENVS } from "@/lib/constants";
import { useTestData } from "@/hooks/useTestData";
import {
  ArrowLeft, BarChart3, Clock, Activity, AlertTriangle,
  Search, Share2, ChevronRight,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";

export default function TestAnalytics() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();
  const { show, Toast } = useSimpleToast();
  const { tcs } = useTestData();

  const rawTestId = (() => {
    const id = params.get("testId") ?? "";
    // Resolve tr_* test result IDs to the matching test case
    if (id.startsWith("tr_")) {
      const parts = id.replace("tr_", "").split("_");
      const runIdx = Math.min(parseInt(parts[0] ?? "0", 10), RUNS.length - 1);
      const resultIdx = parseInt(parts[1] ?? "0", 10);
      const results = getTestResultsForRun(RUNS[runIdx]?.id ?? "");
      const result = results[Math.min(resultIdx, results.length - 1)];
      if (result) {
        const tc = tcs.find(t => t.name === result.name);
        if (tc) return tc.id;
      }
    }
    return id;
  })();
  const rawDiffId = params.get("diffId") ?? "diff_0";
  const isTcMode = rawTestId.startsWith("tc_");

  const testCase = isTcMode ? tcs.find(t => t.id === rawTestId) : null;
  const selectedTestId = isTcMode ? rawTestId : rawDiffId;

  const idx = isTcMode ? Math.abs((testCase ? parseInt(testCase.id.replace("tc_", "")) : 0) % DIFF_ROWS.length) : Number(selectedTestId.replace("diff_", ""));
  const diffs = DIFF_ROWS;
  if (diffs.length === 0) {
    return (
      <AppLayout activeHref="/analytics">
        <div style={{ textAlign: "center", padding: 64 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--gcp-text-primary)" }}>No test data available</h2>
          <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", marginTop: 8 }}>Run a comparison first to see analytics.</p>
          <button onClick={() => navigate("/compare")} className="gcp-button" style={{ fontSize: 13, marginTop: 16 }}>Go to Compare</button>
        </div>
      </AppLayout>
    );
  }
  const diff = diffs[Math.min(idx, diffs.length - 1)] ?? diffs[0];
  const detail = TEST_DETAILS.length > 0 ? (TEST_DETAILS[idx % TEST_DETAILS.length] ?? generateTestHistory(idx)) : generateTestHistory(idx);
  const selectorItems = isTcMode
    ? tcs.map(t => ({ id: t.id, name: t.name }))
    : diffs.map(d => ({ id: d.id, name: d.name }));

  const handleSelectChange = (id: string) => {
    const key = isTcMode ? "testId" : "diffId";
    navigate(`/analytics?${key}=${encodeURIComponent(id)}`, { replace: true });
  };

  const envLabels = getEnvLabels();
  const envStatus = (envLabels.length > 0 ? envLabels : ENVS).map(env => {
    const runs = detail.history.filter(h => h.env === env);
    const pass = runs.filter(r => r.status === "PASS").length;
    const fail = runs.filter(r => r.status === "FAIL").length;
    return { env: env.split("/")[0] + "/" + env.split("/")[1], pass, fail, total: runs.length };
  });

  const historyChartData = detail.history.map((h, i) => ({
    runId: `R${1000 + i}`,
    pass: h.status === "PASS" ? 1 : 0,
    fail: h.status === "FAIL" ? 1 : 0,
    duration: h.duration,
    env: h.env,
  }));

  const isFlaky = detail.flakinessScore > 20;
  const trend = detail.history.slice(-3).every(h => h.status === "FAIL") ? "degrading" :
    detail.history.slice(-3).every(h => h.status === "PASS") ? "stable" : "flaky";

  return (
    <AppLayout activeHref="/analytics">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={isTcMode ? "/tests" : "/compare"}>
            <a className="gcp-button gcp-button-sm"><ArrowLeft size={13} /> {isTcMode ? "Tests" : "Compare"}</a>
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
              className="gcp-button gcp-button-sm">
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>

        {/* Trend alert */}
        {trend === "degrading" && (
          <div style={{ background: "var(--gcp-red-bg)", border: "1px solid var(--gcp-red)", borderRadius: 4, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
            <AlertTriangle size={14} style={{ color: "var(--gcp-red)" }} />
            <strong>Degrading trend</strong> — last 3 runs all FAIL. Investigate before promoting changes.
            <button onClick={() => { navigator.clipboard.writeText(`Test degrading: ${diff.name}\nLast 3 runs: FAIL\nPass Rate: ${detail.passRate}%`).then(() => show("Alert copied")); }}
              className="gcp-button gcp-button-xs" style={{ marginLeft: "auto" }}>
              Copy Alert
            </button>
          </div>
        )}

        {/* KPI tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <CTAStatCard label="Pass Rate" value={`${detail.passRate}%`} subtitle={`${detail.history.length} runs`} accentColor="var(--gcp-blue)" />
          <CTAStatCard label="Flakiness" value={`${detail.flakinessScore}%`} subtitle="status changes" accentColor={isFlaky ? "var(--gcp-yellow)" : "var(--gcp-green)"} />
          <CTAStatCard label="Avg Duration" value={`${detail.avgDuration}ms`} subtitle="across all runs" accentColor="var(--gcp-green)" />
          <CTAStatCard label="Environments" value={ENVS.length} subtitle="tested across" accentColor="var(--gcp-text-secondary)" />
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          <div className="gcp-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Activity size={13} /> Pass/Fail Across Runs
            </h3>
            <GoogleBarChart
              title=""
              columns={["Run", "Pass", "Fail"]}
              data={historyChartData}
              xKey="runId"
              yKeys={["pass", "fail"]}
              colors={["#1e8e3e", "#d93025"]}
              height="180px"
              showTimeFrame={false}
            />
          </div>

          <div className="gcp-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={13} /> Duration Trend (ms)
            </h3>
            <GoogleAreaChart
              title=""
              columns={["Run", "Duration"]}
              data={historyChartData}
              xKey="runId"
              yKeys={["duration"]}
              colors={["#1a73e8"]}
              height="180px"
              showTimeFrame={false}
            />
          </div>

          {/* Env breakdown */}
          <div className="gcp-card" style={{ padding: 16, gridColumn: "1 / -1" }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <BarChart3 size={13} /> Pass/Fail by Environment
            </h3>
            <GoogleBarChart
              title=""
              columns={["Environment", "Pass", "Fail"]}
              data={envStatus}
              xKey="env"
              yKeys={["pass", "fail"]}
              colors={["#1e8e3e", "#d93025"]}
              height="140px"
              showTimeFrame={false}
              isHorizontal={true}
            />
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
                        <a className="gcp-button gcp-button-xs" style={{ padding: "2px 7px" }}>View Run</a>
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

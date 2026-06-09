import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  RUNS, DIFF_ROWS, ENV_SUMMARY, ENV_PASS_RATE_CHART, PER_ENV_PASS_RATE,
  computeRunFrequency,
} from "@/lib/data";
import type { Run } from "@/lib/types";
import { getLatestAnomalies } from "@/lib/anomaly";
import {
  CheckCircle2, XCircle, AlertTriangle, Play, GitCompare,
  TrendingDown, TrendingUp, Github,
  BarChart3, Share2, Activity,
  ChevronRight, RefreshCw, Clock,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { CTAStatCard } from "@/components/aware/CTAStatCard";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";

import { GoogleFilterableTable, GoogleAreaChart } from "@/components/aware/GoogleCharts";

function statusBadge(status: Run["status"]) {
  const map: Record<string, { cls: string; label: string }> = {
    PASS: { cls: "gcp-badge-pass", label: "PASS" },
    FAIL: { cls: "gcp-badge-fail", label: "FAIL" },
    PARTIAL: { cls: "gcp-badge-partial", label: "PARTIAL" },
    FLAKY: { cls: "gcp-badge-flaky", label: "FLAKY" },
    RUNNING: { cls: "gcp-badge-running", label: "RUNNING" },
  };
  const s = map[status] ?? { cls: "gcp-badge-skip", label: status };
  return <span className={`gcp-badge ${s.cls}`}>{s.label}</span>;
}


export default function Dashboard() {
  const [, navigate] = useLocation();
  const latestRun = RUNS[0] ?? null;
  const { show, Toast } = useSimpleToast();
  const runFreq = React.useMemo(() => computeRunFrequency(), []);
  const recentRuns = RUNS.slice(0, 6);
  const overallPassRate = RUNS.length > 0 ? Math.round(RUNS.reduce((s, r) => s + r.passPct, 0) / RUNS.length) : 0;
  const anomalies = React.useMemo(() => getLatestAnomalies(), []);

  if (!latestRun) {
    return (
      <AppLayout activeHref="/">
        <div style={{ textAlign: "center", padding: 64 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text-primary)" }}>No runs available</h2>
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 8 }}>Start a new regression run to see data here.</p>
          <button onClick={() => navigate("/start")} className="gcp-button-primary" style={{ fontSize: 13, marginTop: 16 }}>
            <Play size={14} /> New Regression Run
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeHref="/">
      <div style={{ display: "flex", gap: 18 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.6px", lineHeight: 1.2 }}>
              Regression Dashboard
            </h1>
            <p style={{ fontSize: 12.5, color: "var(--proof-text-secondary)", marginTop: 4, letterSpacing: "-0.1px" }}>
              Test analytics &amp; promotion readiness · Powered by GitHub Actions
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => show("Run data refreshed")} className="gcp-button gcp-button-sm">
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => navigate("/start")} className="gcp-button-primary">
              <Play size={14} /> New Regression Run
            </button>
          </div>
        </div>

        {/* Anomaly Alert Cards */}
        {anomalies.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-red)", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} /> Anomalies Detected
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {anomalies.map(a => {
                const run = RUNS.find(r => r.id === a.runId);
                return (
                  <div key={a.runId} className="gcp-card" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4, borderLeft: `3px solid ${a.overallAnomaly > 0.7 ? "var(--proof-red)" : "var(--proof-yellow)"}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text)", fontFamily: "var(--font-mono)" }}>{a.runId}</div>
                    <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {a.flags.includes("critical-pass-rate-drop") && <span style={{ color: "var(--proof-red)", display: "flex", alignItems: "center", gap: 3 }}><TrendingDown size={11} /> Pass rate critical</span>}
                      {a.flags.includes("pass-rate-drop") && <span style={{ color: "var(--proof-yellow)", display: "flex", alignItems: "center", gap: 3 }}><TrendingDown size={11} /> Pass rate drop</span>}
                      {a.flags.includes("slow-run") && <span style={{ color: "var(--proof-orange)", display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> Slow run</span>}
                      {a.flags.includes("high-failures") && <span style={{ color: "var(--proof-red)", display: "flex", alignItems: "center", gap: 3 }}><AlertTriangle size={11} /> High failures</span>}
                      {a.flags.length === 0 && <span style={{ color: "var(--proof-text-secondary)" }}>Slightly anomalous (score: {a.overallAnomaly.toFixed(2)})</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comparison Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[
            { label: "Pass Rate Trend", value: `${overallPassRate}%`, sub: `avg across ${RUNS.length} runs`, color: "var(--proof-blue)", icon: BarChart3, href: "/runs" },
            { label: "Active Regressions", value: DIFF_ROWS.filter(d => d.state === "regression").length, sub: "needs attention", color: "var(--proof-red)", icon: XCircle, href: "/compare?regressions=1" },
            { label: "Fixed", value: DIFF_ROWS.filter(d => d.state === "fixed").length, sub: "since last comparison", color: "var(--proof-green)", icon: CheckCircle2, href: "/compare" },
            { label: "Run Frequency", value: `${runFreq.runsPerDay}/day`, sub: `${runFreq.totalRuns} total · ${runFreq.avgIntervalHours}h avg`, color: "var(--proof-purple)", icon: Activity, href: "/runs" },
          ].map(kpi => (
            <CTAStatCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              subtitle={kpi.sub}
              accentColor={kpi.color}
              icon={<kpi.icon size={16} />}
              onClick={() => navigate(kpi.href)}
            />
          ))}
        </div>

        {/* Pass rate chart */}
        <PanelErrorBoundary label="Pass rate chart">
          <div className="gcp-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 3, height: 16, borderRadius: 2, background: "linear-gradient(180deg, var(--proof-blue) 0%, var(--proof-purple) 100%)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "0.3px", textTransform: "uppercase" }}>Pass Rate by Environment</span>
            </div>
            {PER_ENV_PASS_RATE.length > 0 ? (
              <GoogleAreaChart
                title=""
                columns={["Day", ...PER_ENV_PASS_RATE.map(e => e.env)]}
                data={ENV_PASS_RATE_CHART}
                xKey="day"
                yKeys={PER_ENV_PASS_RATE.map(e => e.env)}
                colors={PER_ENV_PASS_RATE.map(e => e.color)}
                height="220px"
                showTimeFrame
                onPointClick={p => { if (p.runId) navigate(`/runs/${String(p.runId)}`); }}
              />
            ) : (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--proof-text-secondary)", fontSize: 13 }}>
                No run data yet
              </div>
            )}
          </div>
        </PanelErrorBoundary>

        {/* Env health + Recent runs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
          <div className="gcp-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--proof-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: "linear-gradient(180deg, var(--proof-green) 0%, var(--proof-blue) 100%)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "0.3px", textTransform: "uppercase" }}>Environment Health</span>
              </div>
            </div>
            {ENV_SUMMARY.map((env, i) => (
              <div key={env.label} onClick={() => navigate(`/runs?env=${encodeURIComponent(env.label)}`)}
                style={{ cursor: "pointer", padding: "13px 16px", borderBottom: i < ENV_SUMMARY.length - 1 ? "1px solid var(--proof-border)" : "none", display: "flex", flexDirection: "column", gap: 7, transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--proof-text)" }}>{env.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {env.trend !== 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: env.trend < 0 ? "var(--proof-red)" : "var(--proof-green)", display: "flex", alignItems: "center", gap: 2 }}>
                        {env.trend < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                        {Math.abs(env.trend)}%
                      </span>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 800, color: env.color, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>{env.passRate}%</span>
                  </div>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${env.passRate}%`,
                    background: `linear-gradient(90deg, ${env.color}cc, ${env.color})`,
                    borderRadius: 99,
                    boxShadow: `0 0 8px ${env.color}50`,
                  }} />
                </div>
                {env.alert && (
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--proof-red)", display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={10} /> {env.alert}
                  </div>
                )}
                {env.failures > 0 && <div style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>{env.failures} test{env.failures !== 1 ? "s" : ""} failing</div>}
              </div>
            ))}
          </div>

          <PanelErrorBoundary label="Recent runs table">
            <div className="gcp-card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 3, height: 14, borderRadius: 2, background: "linear-gradient(180deg, var(--proof-blue) 0%, var(--proof-purple) 100%)" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "0.3px", textTransform: "uppercase" }}>Recent Runs</span>
                </div>
                <button onClick={() => navigate("/runs")} style={{ fontSize: 12, color: "var(--proof-blue)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                  View all <ChevronRight size={12} />
                </button>
              </div>
              <GoogleFilterableTable
                columns={[
                  { label: "Run ID", field: "id", format: v => `<span style="font-family:var(--font-mono);font-size:11px;color:var(--proof-blue);font-weight:500">${String(v).slice(-12)}</span>` },
                  { label: "Suite", field: "suite" },
                  { label: "Env", field: "env" },
                  { label: "Status", field: "status", format: v => { const s = v === "PASS" ? "gcp-badge-pass" : v === "FAIL" ? "gcp-badge-fail" : v === "PARTIAL" ? "gcp-badge-partial" : v === "FLAKY" ? "gcp-badge-flaky" : "gcp-badge-skip"; return `<span class="gcp-badge ${s}">${v}</span>`; } },
                  { label: "Pass %", field: "passPct", type: "number", format: v => { const n = Number(v); const c = n === 100 ? "var(--proof-green)" : n < 90 ? "var(--proof-red)" : "var(--proof-text)"; return `<span style="font-family:var(--font-mono);font-weight:700;color:${c}">${n}%</span>`; } },
                  { label: "Failures", field: "failures", type: "number", format: v => { const n = Number(v); return n > 0 ? `<span style="font-family:var(--font-mono);color:var(--proof-red)">${n}</span>` : `<span style="font-family:var(--font-mono);color:var(--proof-text-secondary)">—</span>`; } },
                  { label: "Duration", field: "duration" },
                ]}
                rows={recentRuns.map(r => ({ ...r, id: r.id }))}
                height="260px"
                pageSize={10}
                onRowClick={row => navigate(`/runs/${row.id}`)}
                searchPlaceholder="Search runs…"
              />
            </div>
          </PanelErrorBoundary>
        </div>

        {/* Quick actions */}
        <div className="gcp-card" style={{ padding: "13px 18px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderTop: "3px solid rgba(91,138,245,0.2)" }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--proof-text-secondary)", letterSpacing: "0.6px", textTransform: "uppercase", marginRight: 2 }}>Quick Actions</span>
          <div style={{ width: 1, height: 16, background: "var(--proof-border)", marginRight: 2 }} />
          <button onClick={() => navigate("/start")} className="gcp-button-primary" style={{ padding: "6px 14px" }}>
            <Play size={13} /> Run Full Regression Suite
          </button>
          <button onClick={() => navigate("/compare")} className="gcp-button gcp-button-sm">
            <GitCompare size={13} /> Compare Latest to Baseline
          </button>
          <button onClick={() => {
            const summary = `PROOF Regression Report\nOverall Pass Rate: ${overallPassRate}%\nActive Regressions: ${DIFF_ROWS.filter(d => d.state === "regression").length}\nLatest Run: ${latestRun.id}`;
            navigator.clipboard.writeText(summary).then(() => show("Summary copied — paste into Slack/JIRA"));
          }} className="gcp-button gcp-button-sm">
            <Share2 size={13} /> Export to Slack
          </button>
          <a href="https://github.com/ruake/PROOF/actions" target="_blank" rel="noopener noreferrer" className="gcp-button gcp-button-sm" style={{ textDecoration: "none" }}>
            <Github size={13} /> Open GitHub Actions
          </a>
        </div>

      </div>
      </div>
      {Toast}
    </AppLayout>
  );
}

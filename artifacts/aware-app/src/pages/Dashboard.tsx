import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  RUNS, DIFF_ROWS, ENV_SUMMARY, ENV_PASS_RATE_CHART,
  computeRunFrequency,
} from "@/lib/data";
import type { Run } from "@/lib/types";
import {
  CheckCircle2, XCircle, AlertTriangle, Play, GitCompare,
  TrendingDown, TrendingUp, Github,
  BarChart3, Share2, Activity,
  ChevronRight, RefreshCw,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { CTAStatCard } from "@/components/aware/CTAStatCard";

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

  if (!latestRun) {
    return (
      <AppLayout activeHref="/">
        <div style={{ textAlign: "center", padding: 64 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--gcp-text-primary)" }}>No runs available</h2>
          <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", marginTop: 8 }}>Start a new regression run to see data here.</p>
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
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--gcp-text)", letterSpacing: "-0.3px" }}>PROOF — Regression Dashboard</h1>
            <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", marginTop: 3 }}>Test analytics &amp; promotion readiness · Powered by GitHub Actions</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => show("Run data refreshed")} className="gcp-button gcp-button-sm">
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => navigate("/start")} className="gcp-button-primary" style={{ fontSize: 13 }}>
              <Play size={14} /> New Regression Run
            </button>
          </div>
        </div>

        {/* Comparison Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[
            { label: "Pass Rate Trend", value: `${overallPassRate}%`, sub: `avg across ${RUNS.length} runs`, color: "var(--gcp-blue)", icon: BarChart3, href: "/runs" },
            { label: "Active Regressions", value: DIFF_ROWS.filter(d => d.state === "regression").length, sub: "needs attention", color: "var(--gcp-red)", icon: XCircle, href: "/compare?regressions=1" },
            { label: "Fixed", value: DIFF_ROWS.filter(d => d.state === "fixed").length, sub: "since last comparison", color: "var(--gcp-green)", icon: CheckCircle2, href: "/compare" },
            { label: "Run Frequency", value: `${runFreq.runsPerDay}/day`, sub: `${runFreq.totalRuns} total · ${runFreq.avgIntervalHours}h avg`, color: "var(--gcp-purple)", icon: Activity, href: "/runs" },
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
        <div className="gcp-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Pass Rate by Environment</h3>
          <GoogleAreaChart
            title=""
            columns={["Day", "Prod/Production", "Prod/Staging", "UAT/Production"]}
            data={ENV_PASS_RATE_CHART}
            xKey="day"
            yKeys={["Prod/Production", "Prod/Staging", "UAT/Production"]}
            colors={["#1a73e8", "#f9ab00", "#1e8e3e"]}
            height="220px"
            showTimeFrame
            onPointClick={p => { if (p.runId) navigate(`/runs/${p.runId}`); }}
          />
        </div>

        {/* Env health + Recent runs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
          <div className="gcp-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--gcp-text)" }}>Environment Health</h3>
            </div>
            {ENV_SUMMARY.map(env => (
              <div key={env.label} onClick={() => navigate(`/runs?env=${encodeURIComponent(env.label)}`)} style={{ cursor: "pointer", padding: "12px 16px", borderBottom: "1px solid var(--gcp-grey)", display: "flex", flexDirection: "column", gap: 6, transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--gcp-grey-bg)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{env.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {env.trend !== 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: env.trend < 0 ? "var(--gcp-red)" : "var(--gcp-green)", display: "flex", alignItems: "center", gap: 2 }}>
                        {env.trend < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                        {env.trend}%
                      </span>
                    )}
                    <span style={{ fontSize: 14, fontWeight: 700, color: env.color }}>{env.passRate}%</span>
                  </div>
                </div>
                <div style={{ height: 6, background: "var(--gcp-grey-bg)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${env.passRate}%`, background: env.color, borderRadius: 3 }} />
                </div>
                {env.alert && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-red)", display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={10} /> {env.alert}
                  </div>
                )}
                {env.failures > 0 && <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{env.failures} test{env.failures !== 1 ? "s" : ""} failing</div>}
              </div>
            ))}
          </div>

          <div className="gcp-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600 }}>Recent Runs</h3>
              <button onClick={() => navigate("/runs")} style={{ fontSize: 12, color: "var(--gcp-blue)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                View all <ChevronRight size={12} />
              </button>
            </div>
            <GoogleFilterableTable
              columns={[
                { label: "Run ID", field: "id", format: v => `<span style="font-family:var(--font-mono);font-size:11px;color:var(--gcp-blue);font-weight:500">${String(v).slice(-12)}</span>` },
                { label: "Suite", field: "suite" },
                { label: "Env", field: "env" },
                { label: "Status", field: "status", format: v => { const s = v === "PASS" ? "gcp-badge-pass" : v === "FAIL" ? "gcp-badge-fail" : v === "PARTIAL" ? "gcp-badge-partial" : v === "FLAKY" ? "gcp-badge-flaky" : "gcp-badge-skip"; return `<span class="gcp-badge ${s}">${v}</span>`; } },
                { label: "Pass %", field: "passPct", type: "number", format: v => { const n = Number(v); const c = n === 100 ? "var(--gcp-green)" : n < 90 ? "var(--gcp-red)" : "var(--gcp-text)"; return `<span style="font-family:var(--font-mono);font-weight:700;color:${c}">${n}%</span>`; } },
                { label: "Failures", field: "failures", type: "number", format: v => { const n = Number(v); return n > 0 ? `<span style="font-family:var(--font-mono);color:var(--gcp-red)">${n}</span>` : `<span style="font-family:var(--font-mono);color:var(--gcp-text-secondary)">—</span>`; } },
                { label: "Duration", field: "duration" },
              ]}
              rows={recentRuns.map(r => ({ ...r, id: r.id }))}
              height="260px"
              pageSize={10}
              onRowClick={row => navigate(`/runs/${row.id}`)}
              searchPlaceholder="Search runs…"
            />
          </div>
        </div>

        {/* Quick actions */}
        <div className="gcp-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-text-secondary)", marginRight: 4 }}>QUICK ACTIONS:</span>
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

import React from "react";
import { useLocation } from "wouter";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  RUNS, ENV_SUMMARY, PASS_RATE_CHART, ENV_PASS_RATE_CHART,
  getAllPromotionDecisions, setPromotionDecision,
} from "@/lib/data";
import type { Run } from "@/lib/types";
import {
  CheckCircle2, XCircle, AlertTriangle, Play, GitCompare,
  TrendingDown, TrendingUp, Github,
  Clock, Zap, Shield, BarChart3, Share2,
  ChevronRight, RefreshCw,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";

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

function PromotionBanner({ latestRun }: { latestRun: Run }) {
  const [, navigate] = useLocation();
  const [decisions, setDecisions] = React.useState(getAllPromotionDecisions());
  const existing = decisions.find(d => d.runId === latestRun.id);
  const { show, Toast } = useSimpleToast();

  const decide = (action: "promote" | "block") => {
    const d = {
      runId: latestRun.id, decision: action,
      decidedBy: "you", decidedAt: new Date().toISOString(),
      note: action === "promote" ? "Approved via AWARE portal" : "Blocked via AWARE portal",
    };
    setPromotionDecision(d);
    setDecisions(getAllPromotionDecisions());
    show(action === "promote" ? "✓ Promotion approved — Akamai config can be deployed" : "✗ Promotion blocked — regressions must be fixed first");
  };

  const canPromote = latestRun.status === "PASS";

  if (existing && existing.decision !== "pending") {
    const isPromoted = existing.decision === "promote";
    return (
      <div style={{ background: isPromoted ? "var(--gcp-green-bg)" : "var(--gcp-red-bg)", border: `2px solid ${isPromoted ? "var(--gcp-green)" : "var(--gcp-red)"}`, borderRadius: 6, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        {isPromoted ? <CheckCircle2 size={22} style={{ color: "var(--gcp-green)", flexShrink: 0 }} /> : <XCircle size={22} style={{ color: "var(--gcp-red)", flexShrink: 0 }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: isPromoted ? "var(--gcp-green)" : "var(--gcp-red)" }}>
            {isPromoted ? "Promotion Approved" : "Promotion Blocked"}
          </div>
          <div style={{ fontSize: 12, color: "var(--gcp-text-secondary)", marginTop: 2 }}>
            {existing.note} · {new Date(existing.decidedAt!).toLocaleString()}
          </div>
        </div>
        <button onClick={() => { setPromotionDecision({ runId: latestRun.id, decision: "pending" }); setDecisions(getAllPromotionDecisions()); }} className="gcp-button" style={{ fontSize: 12 }}>
          <RefreshCw size={12} /> Reset Decision
        </button>
        {Toast}
      </div>
    );
  }

  return (
    <div style={{ background: canPromote ? "var(--gcp-green-bg)" : "var(--gcp-red-bg)", border: `2px solid ${canPromote ? "var(--gcp-green)" : "var(--gcp-red)"}`, borderRadius: 6, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      {canPromote
        ? <Shield size={24} style={{ color: "var(--gcp-green)", flexShrink: 0 }} />
        : <AlertTriangle size={24} style={{ color: "var(--gcp-red)", flexShrink: 0 }} />
      }
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: canPromote ? "var(--gcp-green)" : "var(--gcp-red)" }}>
          {canPromote
            ? `✓ Ready to Promote — ${latestRun.passPct}% pass rate, 0 regressions`
            : `✗ Promotion Blocked — ${latestRun.failures} regression${latestRun.failures !== 1 ? "s" : ""} detected`
          }
        </div>
        <div style={{ fontSize: 12, color: "var(--gcp-text-secondary)", marginTop: 3, fontFamily: "var(--font-mono)" }}>
          {latestRun.id}
          <span style={{ fontFamily: "var(--font-sans)" }}> · {latestRun.suite} · {latestRun.env}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
        <button onClick={() => navigate("/compare")} className="gcp-button" style={{ fontSize: 12 }}>
          <GitCompare size={13} /> View Diff
        </button>
        {canPromote
          ? <button onClick={() => decide("promote")} className="gcp-button-success" style={{ fontSize: 13 }}>
              <Zap size={14} /> Approve Promotion
            </button>
          : <button onClick={() => decide("block")} className="gcp-button-danger" style={{ fontSize: 13 }}>
              <XCircle size={14} /> Confirm Block
            </button>
        }
      </div>
      {Toast}
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const latestRun = RUNS[0];
  const { show, Toast } = useSimpleToast();

  const recentRuns = RUNS.slice(0, 6);
  const overallPassRate = Math.round(RUNS.reduce((s, r) => s + r.passPct, 0) / RUNS.length);
  const passRuns = RUNS.filter(r => r.status === "PASS").length;
  const failRuns = RUNS.filter(r => r.status === "FAIL").length;

  return (
    <AppLayout activeHref="/">
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--gcp-text)", letterSpacing: "-0.3px" }}>Akamai CDN — Regression Dashboard</h1>
            <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", marginTop: 3 }}>Test analytics &amp; promotion readiness · Powered by GitHub Actions</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => show("Run data refreshed")} className="gcp-button" style={{ fontSize: 12 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => navigate("/start")} className="gcp-button-primary" style={{ fontSize: 13 }}>
              <Play size={14} /> New Regression Run
            </button>
          </div>
        </div>

        {/* Promotion Banner */}
        <PromotionBanner latestRun={latestRun} />

        {/* KPI tiles — clickable */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[
            { label: "Overall Pass Rate", value: `${overallPassRate}%`, sub: `${RUNS.length} runs`, color: "var(--gcp-blue)", bg: "var(--gcp-blue-bg)", icon: BarChart3, href: "/runs" },
            { label: "Passing Runs (PASS)", value: passRuns, sub: "click to view", color: "var(--gcp-green)", bg: "var(--gcp-green-bg)", icon: CheckCircle2, href: "/runs?status=PASS" },
            { label: "Failing Runs (FAIL)", value: failRuns, sub: "needs attention", color: "var(--gcp-red)", bg: "var(--gcp-red-bg)", icon: XCircle, href: "/runs?status=FAIL" },
            { label: "Active Regressions", value: "7", sub: "Prod/Production", color: "var(--gcp-yellow)", bg: "var(--gcp-yellow-bg)", icon: AlertTriangle, href: "/compare?regressions=true" },
          ].map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} onClick={() => navigate(kpi.href)} style={{ cursor: "pointer", padding: "16px 18px", borderLeft: `4px solid ${kpi.color}`, background: "var(--gcp-surface)", borderRadius: 6, border: "1px solid var(--gcp-grey)", transition: "box-shadow 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.1)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{kpi.label}</span>
                  <div style={{ background: kpi.bg, borderRadius: 6, padding: 6 }}><Icon size={14} style={{ color: kpi.color }} /></div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 6 }}>{kpi.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="gcp-card" style={{ padding: 16 }}>
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pass Rate Trend</h3>
                <p style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>Last 12 GitHub Actions runs</p>
              </div>
              <TrendingDown size={16} style={{ color: "var(--gcp-red)" }} />
            </div>
            <div style={{ cursor: "pointer" }} onClick={() => navigate("/runs")}>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={PASS_RATE_CHART} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5f6368" }} />
                  <YAxis domain={[40, 105]} tick={{ fontSize: 10, fill: "#5f6368" }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4, border: "1px solid var(--gcp-grey)" }} formatter={(v: number) => [`${v}%`, "Pass Rate"]} labelFormatter={(label) => `Day: ${label}`} />
                  <Area type="monotone" dataKey="passRate" stroke="#1a73e8" strokeWidth={2} fill="url(#blueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="gcp-card" style={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pass Rate by Environment</h3>
              <p style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>Last 10 days</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ENV_PASS_RATE_CHART} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#5f6368" }} />
                <YAxis domain={[60, 105]} tick={{ fontSize: 10, fill: "#5f6368" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Prod/Production" fill="#1a73e8" radius={[2,2,0,0]} cursor="pointer" />
                <Bar dataKey="Prod/Staging" fill="#f9ab00" radius={[2,2,0,0]} cursor="pointer" />
                <Bar dataKey="UAT/Production" fill="#1e8e3e" radius={[2,2,0,0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
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

          <div className="gcp-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 13, fontWeight: 600 }}>Recent Runs</h3>
              <button onClick={() => navigate("/runs")} style={{ fontSize: 12, color: "var(--gcp-blue)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                View all <ChevronRight size={12} />
              </button>
            </div>
            <table className="gcp-table">
              <thead><tr>
                <th>Run ID</th><th>Suite</th><th>Env</th><th>Status</th>
                <th style={{ textAlign: "right" }}>Pass %</th>
                <th style={{ textAlign: "right" }}>Failures</th>
                <th style={{ textAlign: "right" }}>Duration</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {recentRuns.map(run => (
                  <tr key={run.id} onClick={() => navigate(`/runs/${run.id}`)} style={{ cursor: "pointer" }}
                    onMouseEnter={e => { const tds = e.currentTarget.querySelectorAll("td"); tds.forEach(td => td.style.background = "var(--gcp-grey-bg)"); }}
                    onMouseLeave={e => { const tds = e.currentTarget.querySelectorAll("td"); tds.forEach(td => td.style.background = ""); }}>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-blue)", fontWeight: 500 }}>
                        {run.id.slice(-12)}
                      </span>
                    </td>
                    <td><span style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>{run.suite}</span></td>
                    <td><span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{run.env}</span></td>
                    <td>{statusBadge(run.status)}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: run.passPct === 100 ? "var(--gcp-green)" : run.passPct < 90 ? "var(--gcp-red)" : "var(--gcp-text)" }}>{run.passPct}%</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: run.failures > 0 ? "var(--gcp-red)" : "var(--gcp-text-secondary)" }}>{run.failures}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text-secondary)" }}>{run.duration}</td>
                    <td>
                      <button onClick={() => navigate(`/compare?baseline=${RUNS[RUNS.length-1]?.id}&candidate=${run.id}`)} className="gcp-button" style={{ fontSize: 11, padding: "3px 8px" }}>
                        <GitCompare size={11} /> Compare
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions */}
        <div className="gcp-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-text-secondary)", marginRight: 4 }}>QUICK ACTIONS:</span>
          <button onClick={() => navigate("/start")} className="gcp-button-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
            <Play size={13} /> Run Full Regression Suite
          </button>
          <button onClick={() => navigate("/compare")} className="gcp-button" style={{ fontSize: 12 }}>
            <GitCompare size={13} /> Compare Latest to Baseline
          </button>
          <button onClick={() => {
            const summary = `AWARE CDN Report\nOverall Pass Rate: ${overallPassRate}%\nProd/Production: ${ENV_SUMMARY[0].passRate}% (${ENV_SUMMARY[0].trend}%)\nActive Regressions: 7\nLatest Run: ${latestRun.id}`;
            navigator.clipboard.writeText(summary).then(() => show("Summary copied — paste into Slack/JIRA"));
          }} className="gcp-button" style={{ fontSize: 12 }}>
            <Share2 size={13} /> Export to Slack
          </button>
          <a href="https://github.com/salesforce/aware/actions" target="_blank" rel="noopener noreferrer" className="gcp-button" style={{ fontSize: 12, textDecoration: "none" }}>
            <Github size={13} /> Open GitHub Actions
          </a>
        </div>

      </div>
      {Toast}
    </AppLayout>
  );
}

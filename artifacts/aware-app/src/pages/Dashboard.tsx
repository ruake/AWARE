import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  RUNS,
  DIFF_ROWS,
  ENV_SUMMARY,
  ENV_PASS_RATE_CHART,
  PER_ENV_PASS_RATE,
  computeRunFrequency,
} from "@/lib/data";

import { getLatestAnomalies } from "@/lib/anomaly";
import { getLatestAnomalyBanner } from "@/lib/anomalyDetection";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  GitCompare,
  TrendingDown,
  TrendingUp,
  Github,
  BarChart3,
  Share2,
  Activity,
  ChevronRight,
  RefreshCw,
  Clock,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { CTAStatCard } from "@/components/aware/CTAStatCard";
import { PropertyStatusBar } from "@/components/aware/PropertyStatusBar";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";

import { GoogleAreaChart } from "@/components/aware/GoogleCharts";
import { PassRateHeatmap } from "@/components/aware/PassRateHeatmap";
import { Chart } from "react-google-charts";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const latestRun = RUNS[0] ?? null;
  const { show, Toast } = useSimpleToast();
  const runFreq = React.useMemo(() => computeRunFrequency(), []);
  const recentRuns = RUNS.slice(0, 6);
  const overallPassRate =
    RUNS.length > 0 ? Math.round(RUNS.reduce((s, r) => s + r.passPct, 0) / RUNS.length) : 0;
  const [animatedPassRate, setAnimatedPassRate] = React.useState(0);
  React.useEffect(() => {
    let start: number | null = null;
    const duration = 800;
    const from = 0;
    const to = overallPassRate;
    function step(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPassRate(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [overallPassRate]);
  const visibleRuns = recentRuns;
  const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setCollapsedSections((p) => ({ ...p, [key]: !p[key] }));
  const anomalies = React.useMemo(() => getLatestAnomalies(), []);
  const dailyData = React.useMemo(() => {
    const map = new Map<string, { totalPassPct: number; count: number }>();
    RUNS.forEach((r) => {
      const day = r.started.slice(0, 10);
      if (!map.has(day)) map.set(day, { totalPassPct: 0, count: 0 });
      const entry = map.get(day)!;
      entry.totalPassPct += r.passPct;
      entry.count++;
    });
    return Array.from(map.entries()).map(([date, data]) => ({
      date,
      passRate: Math.round(data.totalPassPct / data.count),
      runCount: data.count,
    }));
  }, []);
  const anomalyBanner = React.useMemo(() => getLatestAnomalyBanner(), []);

  if (!latestRun) {
    return (
      <AppLayout activeHref="/">
        <div style={{ textAlign: "center", padding: 64 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text)" }}>
            No runs available
          </h2>
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 8 }}>
            Start a new regression run to see data here.
          </p>
          <button
            onClick={() => navigate("/start")}
            className="proof-button-primary"
            style={{ fontSize: 13, marginTop: 16 }}
          >
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
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--proof-text)",
                  letterSpacing: "-0.6px",
                  lineHeight: 1.2,
                }}
              >
                Regression Dashboard
              </h1>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--proof-text-secondary)",
                  marginTop: 4,
                  letterSpacing: "-0.1px",
                }}
              >
                Akamai CDN · Playwright + pytest · GitHub Actions
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => show("Run data refreshed")}
                className="proof-button proof-button-sm"
              >
                <RefreshCw size={13} /> Refresh
              </button>
              <button onClick={() => navigate("/start")} className="proof-button-primary">
                <Play size={14} /> New Regression Run
              </button>
            </div>
          </div>

          {/* Akamai Property Status — always visible */}
          <div className="proof-card" style={{ padding: "0 16px 12px" }}>
            <PropertyStatusBar />
          </div>

          {/* Anomaly Detection Banner */}
          {anomalyBanner && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 8,
                background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.1))",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <AlertTriangle size={16} style={{ color: "var(--proof-red)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 12,
                    color: "var(--proof-red)",
                  }}
                >
                  {anomalyBanner.message}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--proof-text-secondary)",
                    marginLeft: 8,
                  }}
                >
                  {anomalyBanner.lastValue.toFixed(0)}ms vs {anomalyBanner.avgValue.toFixed(0)}ms
                  avg · {anomalyBanner.zScore.toFixed(1)}σ
                </span>
              </div>
              <button
                onClick={() => navigate("/runs")}
                style={{
                  fontSize: 11,
                  color: "var(--proof-blue)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                View Runs →
              </button>
            </div>
          )}

          {/* Anomaly Alert Cards */}
          {anomalies.length > 0 && (
            <PanelErrorBoundary label="Anomaly alerts">
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--proof-red)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={14} /> Anomalies Detected
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {anomalies.map((a) => {
                    return (
                      <div
                        key={a.runId}
                        className="proof-card"
                        style={{
                          padding: "10px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          borderLeft: `3px solid ${a.overallAnomaly > 0.7 ? "var(--proof-red)" : "var(--proof-yellow)"}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--proof-text)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {a.runId}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--proof-text-secondary)",
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          {a.flags.includes("critical-pass-rate-drop") && (
                            <span
                              style={{
                                color: "var(--proof-red)",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <TrendingDown size={11} /> Pass rate critical
                            </span>
                          )}
                          {a.flags.includes("pass-rate-drop") && (
                            <span
                              style={{
                                color: "var(--proof-yellow)",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <TrendingDown size={11} /> Pass rate drop
                            </span>
                          )}
                          {a.flags.includes("slow-run") && (
                            <span
                              style={{
                                color: "var(--proof-orange)",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <Clock size={11} /> Slow run
                            </span>
                          )}
                          {a.flags.includes("high-failures") && (
                            <span
                              style={{
                                color: "var(--proof-red)",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <AlertTriangle size={11} /> High failures
                            </span>
                          )}
                          {a.flags.length === 0 && (
                            <span style={{ color: "var(--proof-text-secondary)" }}>
                              Slightly anomalous (score: {a.overallAnomaly.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PanelErrorBoundary>
          )}

          {/* Comparison Summary */}
          <PanelErrorBoundary label="Comparison summary">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
              {[
                {
                  label: "Pass Rate Trend",
                  value: `${animatedPassRate}%`,
                  sub: `avg across ${RUNS.length} runs`,
                  color: "var(--proof-blue)",
                  icon: BarChart3,
                  href: "/runs",
                },
                {
                  label: "Active Regressions",
                  value: DIFF_ROWS.filter((d) => d.state === "regression").length,
                  sub: "needs attention",
                  color: "var(--proof-red)",
                  icon: XCircle,
                  href: "/compare?regressions=1",
                },
                {
                  label: "Fixed",
                  value: DIFF_ROWS.filter((d) => d.state === "fixed").length,
                  sub: "since last comparison",
                  color: "var(--proof-green)",
                  icon: CheckCircle2,
                  href: "/compare",
                },
                {
                  label: "Run Frequency",
                  value: `${runFreq.runsPerDay}/day`,
                  sub: `${runFreq.totalRuns} total · ${runFreq.avgIntervalHours}h avg`,
                  color: "var(--proof-purple)",
                  icon: Activity,
                  href: "/runs",
                },
              ].map((kpi) => (
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
          </PanelErrorBoundary>

          {/* Pass rate chart */}
          <PanelErrorBoundary label="Pass rate chart">
            <div className="proof-card" style={{ padding: 16 }}>
              <div
                onClick={() => toggleSection("passRate")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: collapsedSections.passRate ? 0 : 12,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 16,
                    borderRadius: 2,
                    background:
                      "linear-gradient(180deg, var(--proof-blue) 0%, var(--proof-purple) 100%)",
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--proof-text)",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                    flex: 1,
                  }}
                >
                  Pass Rate by Environment
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--proof-text-secondary)",
                    transition: "transform 0.2s",
                  }}
                >
                  {collapsedSections.passRate ? "▶" : "▼"}
                </span>
              </div>
              {!collapsedSections.passRate && (
                <>
                  {PER_ENV_PASS_RATE.length > 0 ? (
                    <GoogleAreaChart
                      title=""
                      columns={["Day", ...PER_ENV_PASS_RATE.map((e) => e.env)]}
                      data={ENV_PASS_RATE_CHART}
                      xKey="day"
                      yKeys={PER_ENV_PASS_RATE.map((e) => e.env)}
                      colors={PER_ENV_PASS_RATE.map((e) => e.color)}
                      height="220px"
                      showTimeFrame
                      onPointClick={(p) => {
                        if (p.runId) navigate(`/runs/${String(p.runId)}`);
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 220,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--proof-text-secondary)",
                        fontSize: 13,
                      }}
                    >
                      No run data yet
                    </div>
                  )}
                </>
              )}
            </div>
          </PanelErrorBoundary>

          {/* Pass rate heatmap */}
          <PanelErrorBoundary label="Pass rate heatmap">
            <div className="proof-card" style={{ padding: 16 }}>
              <div
                onClick={() => toggleSection("heatmap")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: collapsedSections.heatmap ? 0 : 12,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 16,
                    borderRadius: 2,
                    background: "linear-gradient(180deg, #22c55e 0%, #ef4444 100%)",
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--proof-text)",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                    flex: 1,
                  }}
                >
                  Daily Pass Rate · Last 365 Days
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--proof-text-secondary)",
                  }}
                >
                  {collapsedSections.heatmap ? "▶" : "▼"}
                </span>
              </div>
              {!collapsedSections.heatmap && <PassRateHeatmap data={dailyData} />}
            </div>
          </PanelErrorBoundary>

          {/* Env health + Recent runs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
            <PanelErrorBoundary label="Environment health">
              <div className="proof-card" style={{ padding: 0, overflow: "hidden" }}>
                <div
                  onClick={() => toggleSection("envHealth")}
                  style={{
                    padding: "13px 16px",
                    borderBottom: collapsedSections.envHealth
                      ? "none"
                      : "1px solid var(--proof-border)",
                    cursor: "pointer",
                    userSelect: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 3,
                        height: 14,
                        borderRadius: 2,
                        background:
                          "linear-gradient(180deg, var(--proof-green) 0%, var(--proof-blue) 100%)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--proof-text)",
                        letterSpacing: "0.3px",
                        textTransform: "uppercase",
                      }}
                    >
                      Environment Health
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--proof-text-secondary)",
                    }}
                  >
                    {collapsedSections.envHealth ? "▶" : "▼"}
                  </span>
                </div>
                {!collapsedSections.envHealth &&
                  ENV_SUMMARY.map((env, i) => (
                    <div
                      key={env.label}
                      onClick={() => navigate(`/runs?env=${encodeURIComponent(env.label)}`)}
                      style={{
                        cursor: "pointer",
                        padding: "13px 16px",
                        borderBottom:
                          i < ENV_SUMMARY.length - 1 ? "1px solid var(--proof-border)" : "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(255,255,255,0.025)")
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          style={{ fontSize: 12.5, fontWeight: 500, color: "var(--proof-text)" }}
                        >
                          {env.label}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {env.trend !== 0 && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: env.trend < 0 ? "var(--proof-red)" : "var(--proof-green)",
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              {env.trend < 0 ? (
                                <TrendingDown size={11} />
                              ) : (
                                <TrendingUp size={11} />
                              )}
                              {Math.abs(env.trend)}%
                            </span>
                          )}
                          {(() => {
                            const envChart = PER_ENV_PASS_RATE.find((e) => e.env === env.label);
                            if (!envChart || envChart.data.length < 2) return null;
                            return (
                              <div
                                style={{
                                  width: 80,
                                  height: 26,
                                  flexShrink: 0,
                                }}
                              >
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={envChart.data}
                                    margin={{
                                      top: 0,
                                      right: 0,
                                      bottom: 0,
                                      left: 0,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id={`sg-${env.label.replace(/\s+/g, "")}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop offset="5%" stopColor={env.color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={env.color} stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <Area
                                      type="monotone"
                                      dataKey="passRate"
                                      stroke={env.color}
                                      fill={`url(#sg-${env.label.replace(/\s+/g, "")})`}
                                      strokeWidth={1.5}
                                      dot={false}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            );
                          })()}
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: env.color,
                              letterSpacing: "-0.5px",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {env.passRate}%
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: 99,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${env.passRate}%`,
                            background: `linear-gradient(90deg, ${env.color}cc, ${env.color})`,
                            borderRadius: 99,
                            boxShadow: `0 0 8px ${env.color}50`,
                          }}
                        />
                      </div>
                      {env.alert && (
                        <div
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: "var(--proof-red)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <AlertTriangle size={10} /> {env.alert}
                        </div>
                      )}
                      {env.failures > 0 && (
                        <div style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                          {env.failures} test{env.failures !== 1 ? "s" : ""} failing
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </PanelErrorBoundary>

            <PanelErrorBoundary label="Recent runs table">
              <div className="proof-card" style={{ padding: 16 }}>
                <div
                  onClick={() => toggleSection("recentRuns")}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: collapsedSections.recentRuns ? 0 : 12,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 3,
                        height: 14,
                        borderRadius: 2,
                        background:
                          "linear-gradient(180deg, var(--proof-blue) 0%, var(--proof-purple) 100%)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--proof-text)",
                        letterSpacing: "0.3px",
                        textTransform: "uppercase",
                      }}
                    >
                      Recent Runs
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--proof-text-secondary)",
                        marginLeft: 4,
                      }}
                    >
                      {collapsedSections.recentRuns ? "▶" : "▼"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/runs");
                    }}
                    style={{
                      fontSize: 12,
                      color: "var(--proof-blue)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontWeight: 500,
                    }}
                  >
                    View all <ChevronRight size={12} />
                  </button>
                </div>
                {!collapsedSections.recentRuns && (
                  <>
                    <table className="proof-table">
                      <colgroup>
                        <col style={{ width: 148 }} />
                        <col style={{ width: 130 }} />
                        <col style={{ width: 100 }} />
                        <col style={{ width: 90 }} />
                        <col style={{ width: 68 }} />
                        <col style={{ width: 68 }} />
                        <col />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Run ID</th>
                          <th>Suite</th>
                          <th>Env</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Pass %</th>
                          <th style={{ textAlign: "right" }}>Failures</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRuns.map((r) => (
                          <tr
                            key={r.id}
                            onClick={() => navigate(`/runs/${r.id}`)}
                            style={{ cursor: "pointer" }}
                          >
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <span
                                  style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 11,
                                    color: "var(--proof-blue)",
                                    fontWeight: 500,
                                  }}
                                >
                                  {r.id}
                                </span>
                                <span
                                  style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 10,
                                    color: "var(--proof-text-secondary)",
                                  }}
                                >
                                  {r.build} · {r.rev}
                                </span>
                              </div>
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                              {r.suite}
                            </td>
                            <td style={{ fontSize: 12 }}>{r.env}</td>
                            <td>
                              <span
                                className={`proof-badge proof-badge-${r.status === "PASS" ? "pass" : r.status === "FAIL" ? "fail" : r.status === "PARTIAL" ? "partial" : r.status === "FLAKY" ? "flaky" : "skip"}`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                fontSize: 13,
                                color:
                                  r.passPct === 100
                                    ? "var(--proof-green)"
                                    : r.passPct < 90
                                      ? "var(--proof-red)"
                                      : "var(--proof-text)",
                              }}
                            >
                              {r.passPct}%
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                fontFamily: "var(--font-mono)",
                                fontSize: 12,
                                color:
                                  r.failures > 0
                                    ? "var(--proof-red)"
                                    : "var(--proof-text-secondary)",
                              }}
                            >
                              {r.failures || "—"}
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                color: "var(--proof-text-secondary)",
                              }}
                            >
                              {r.duration}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </PanelErrorBoundary>
          </div>

          {/* Regression funnel */}
          <PanelErrorBoundary label="Regression funnel">
            <div className="proof-card" style={{ padding: 16 }}>
              <div
                onClick={() => toggleSection("funnel")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: collapsedSections.funnel ? 0 : 12,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 16,
                    borderRadius: 2,
                    background: "linear-gradient(180deg, #a855f7 0%, #5b8af5 100%)",
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--proof-text)",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                    flex: 1,
                  }}
                >
                  Regression Funnel
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--proof-text-secondary)",
                  }}
                >
                  {collapsedSections.funnel ? "▶" : "▼"}
                </span>
              </div>
              {!collapsedSections.funnel && (
                <>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--proof-text-secondary)",
                      margin: "0 0 12px 0",
                    }}
                  >
                    Tests flowing through the pipeline
                  </p>
                  {(() => {
                    const sumFailures = RUNS.reduce((s, r) => s + r.failures, 0);
                    const estimatedTotal = RUNS.reduce((sum, r) => {
                      if (r.passPct === 100) return sum + (r.failures || 25);
                      return sum + Math.round(r.failures / (1 - r.passPct / 100));
                    }, 0);
                    const estimatedPassed = estimatedTotal - sumFailures;
                    const promotedTests = RUNS.filter((r) => r.status === "PASS").reduce(
                      (sum, r) => {
                        if (r.passPct === 100) return sum + (r.failures || 25);
                        return sum + Math.round(r.failures / (1 - r.passPct / 100)) - r.failures;
                      },
                      0,
                    );
                    const funnelData = [
                      ["From", "To", "Count"],
                      ["All Tests", "Executed", estimatedTotal],
                      ["Executed", "Passed", estimatedPassed],
                      ["Passed", "Promoted", promotedTests],
                    ];
                    const funnelOptions = {
                      sankey: {
                        node: {
                          colors: ["#5b8af5", "#22c55e", "#f59e0b", "#a855f7"],
                        },
                        link: { colorMode: "gradient" },
                      },
                      legend: "none",
                      backgroundColor: "transparent",
                    };
                    return (
                      <Chart
                        chartType="Sankey"
                        data={funnelData}
                        options={funnelOptions}
                        width="100%"
                        height="200px"
                        chartPackages={["sankey"]}
                        chartLanguage="en"
                      />
                    );
                  })()}
                </>
              )}
            </div>
          </PanelErrorBoundary>

          {/* Quick actions */}
          <div
            className="proof-card"
            style={{
              padding: "13px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              borderTop: "3px solid rgba(91,138,245,0.2)",
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "var(--proof-text-secondary)",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                marginRight: 2,
              }}
            >
              Quick Actions
            </span>
            <div
              style={{ width: 1, height: 16, background: "var(--proof-border)", marginRight: 2 }}
            />
            <button
              onClick={() => navigate("/start")}
              className="proof-button-primary"
              style={{ padding: "6px 14px" }}
            >
              <Play size={13} /> Run Full Regression Suite
            </button>
            <button onClick={() => navigate("/compare")} className="proof-button proof-button-sm">
              <GitCompare size={13} /> Compare Latest to Baseline
            </button>
            <button
              onClick={() => {
                const summary = `A.W.A.R.E. Regression Report\nOverall Pass Rate: ${overallPassRate}%\nActive Regressions: ${DIFF_ROWS.filter((d) => d.state === "regression").length}\nLatest Run: ${latestRun.id}`;
                navigator.clipboard
                  .writeText(summary)
                  .then(() => show("Summary copied — paste into Slack/JIRA"));
              }}
              className="proof-button proof-button-sm"
            >
              <Share2 size={13} /> Export to Slack
            </button>
            <a
              href="https://github.com/ruake/AWARE/actions"
              target="_blank"
              rel="noopener noreferrer"
              className="proof-button proof-button-sm"
              style={{ textDecoration: "none" }}
            >
              <Github size={13} /> Open GitHub Actions
            </a>
          </div>
        </div>
      </div>
      {Toast}
    </AppLayout>
  );
}

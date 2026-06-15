import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import {
  RUNS,
  DIFF_ROWS,
  PASS_RATE_CHART,
  getRunsByEnv,
  getSelectedEnvSnapshot,
  subscribeToSelectedEnv,
} from "@/lib/data";
import { getEnvConfigs } from "@/lib/envConfig";
import { getTestCases, getTestSuites } from "@/lib/data";
import type { Run } from "@/lib/types";
import {
  Play,
  Bot,
  Activity,
  TestTube,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  AlertTriangle,
  GitCompare,
  Shield,
  Zap,
  ChevronRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function statusConfig(passPct: number) {
  if (passPct >= 95)
    return {
      color: "var(--proof-green)",
      bright: "#34d399",
      label: "healthy",
      accent: "rgba(16,185,129,0.08)",
    };
  if (passPct >= 80)
    return {
      color: "var(--proof-yellow)",
      bright: "#fbbf24",
      label: "degraded",
      accent: "rgba(245,158,11,0.08)",
    };
  return {
    color: "var(--proof-red)",
    bright: "#f87171",
    label: "critical",
    accent: "rgba(239,68,68,0.08)",
  };
}

function trendInfo(trend: number) {
  if (trend > 0) return { Icon: TrendingUp, color: "#34d399" };
  if (trend < 0) return { Icon: TrendingDown, color: "#f87171" };
  return { Icon: Minus, color: "var(--proof-text-muted)" };
}

interface EnvHealthItem {
  id: string;
  label: string;
  passRate: number;
  trend: number;
  failures: number;
  runCount: number;
  lastRun?: string;
}

function computeEnvHealth(runsList: Run[], selectedEnvIds?: string[]): EnvHealthItem[] {
  const groups = new Map<string, Run[]>();
  for (const run of runsList) {
    if (!groups.has(run.envId)) groups.set(run.envId, []);
    groups.get(run.envId)!.push(run);
  }
  let configs = getEnvConfigs();
  if (selectedEnvIds && selectedEnvIds.length > 0) {
    configs = configs.filter((c) => selectedEnvIds.includes(c.id));
  }
  return configs.map((cfg) => {
    const runs = groups.get(cfg.id) ?? [];
    const sorted = [...runs].sort(
      (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
    );
    const latest = sorted[0];
    const previous = sorted[1];
    const avgPassRate =
      sorted.length > 0 ? Math.round(sorted.reduce((s, r) => s + r.passPct, 0) / sorted.length) : 0;
    const trend = previous && latest ? Math.round(latest.passPct - previous.passPct) : 0;
    return {
      id: cfg.id,
      label: cfg.label,
      passRate: avgPassRate,
      trend,
      failures: latest?.failures ?? 0,
      runCount: sorted.length,
      lastRun: latest?.started,
    };
  });
}

function StatCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        padding: "20px 22px",
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.15s, transform 0.15s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.25)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border)";
        (e.currentTarget as HTMLElement).style.transform = "none";
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.015) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--proof-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.7px",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
          }}
        >
          {icon}
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: "var(--proof-text)",
            letterSpacing: "-1.5px",
            fontFamily: "var(--font-mono)",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "var(--proof-text-muted)", marginTop: 4 }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const effectiveRuns = envSnap.envIds.length > 0 ? getRunsByEnv(envSnap.envIds) : RUNS;
  const latestRun = effectiveRuns[0] ?? null;

  const overallPassRate = React.useMemo(
    () =>
      effectiveRuns.length > 0
        ? Math.round(effectiveRuns.reduce((s, r) => s + r.passPct, 0) / effectiveRuns.length)
        : 0,
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    [effectiveRuns],
  );

  const envHealth = React.useMemo(
    () => computeEnvHealth(effectiveRuns, envSnap.envIds),
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    [effectiveRuns, envSnap.envIds],
  );

  const effectivePassRateChart = React.useMemo(() => {
    if (effectiveRuns === RUNS) return PASS_RATE_CHART;
    const sorted = [...effectiveRuns].sort(
      (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
    );
    return sorted.map((r) => ({ label: r.started.slice(0, 10), passRate: r.passPct, runId: r.id }));
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
  }, [effectiveRuns]);

  const testCasesList = getTestCases();
  const totalTests = testCasesList.length;
  const regressions = DIFF_ROWS.filter((d) => d.state === "regression").length;
  const failingEnvs = envHealth.filter((e) => e.passRate < 80);
  const hasAlerts = regressions > 0 || failingEnvs.length > 0;

  if (!latestRun) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "var(--proof-blue-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TestTube size={24} style={{ color: "var(--proof-blue)" }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--proof-text)", margin: 0 }}>
          No runs yet
        </h2>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", margin: 0 }}>
          Start your first regression run to see data here.
        </p>
        <button
          onClick={() => navigate("/start")}
          className="proof-button-primary"
          style={{ marginTop: 8 }}
        >
          <Play size={13} /> Start Run
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        animation: "page-enter 0.25s ease-out both",
      }}
    >
      {/* ── Alert banner ── */}
      {hasAlerts && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderLeft: "3px solid #f87171",
            animation: "slide-up 0.2s ease-out both",
          }}
        >
          <AlertTriangle size={15} style={{ color: "#f87171", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#f87171" }}>
            {regressions > 0 && `${regressions} regression${regressions !== 1 ? "s" : ""} detected`}
            {regressions > 0 && failingEnvs.length > 0 && " · "}
            {failingEnvs.length > 0 && `${failingEnvs.map((e) => e.label).join(", ")} below 80%`}
          </span>
          <button
            onClick={() => navigate("/runs")}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#f87171",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            View Runs
          </button>
        </div>
      )}

      {/* ── Quick actions bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderRadius: 12,
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.08))",
              border: "1px solid rgba(59,130,246,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={15} style={{ color: "var(--proof-blue-bright)" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
              {effectiveRuns.length} runs across {envHealth.filter((e) => e.runCount > 0).length}{" "}
              environments
            </div>
            <div style={{ fontSize: 11, color: "var(--proof-text-muted)", marginTop: 1 }}>
              Last run{" "}
              {latestRun?.started
                ? new Date(latestRun.started).toLocaleString([], {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "—"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => navigate("/start")}
            className="proof-button-primary"
            style={{ padding: "6px 14px", fontSize: 12 }}
          >
            <Play size={12} /> Start Run
          </button>
          <button
            onClick={() => navigate("/compare")}
            className="proof-button"
            style={{ padding: "6px 12px", fontSize: 12 }}
          >
            <GitCompare size={12} /> Compare
          </button>
          <button
            onClick={() => navigate("/copilot")}
            className="proof-button"
            style={{ padding: "6px 12px", fontSize: 12 }}
          >
            <Bot size={12} /> Copilot
          </button>
        </div>
      </div>

      {/* ── Key metrics ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard
          label="Total Tests"
          value={totalTests}
          icon={<TestTube size={14} />}
          color="var(--proof-blue)"
          sub={`across ${getTestSuites().length} suites`}
        />
        <StatCard
          label="Pass Rate"
          value={`${overallPassRate}%`}
          icon={<Activity size={14} />}
          color={
            overallPassRate >= 90
              ? "var(--proof-green)"
              : overallPassRate >= 70
                ? "var(--proof-yellow)"
                : "var(--proof-red)"
          }
          sub="overall average"
        />
        <StatCard
          label="Regressions"
          value={regressions}
          icon={<AlertTriangle size={14} />}
          color={regressions > 0 ? "var(--proof-red)" : "var(--proof-green)"}
          sub={regressions > 0 ? "needs attention" : "all clear"}
        />
      </div>

      {/* ── Environment Health ── */}
      <div
        style={{
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 18px 12px",
            borderBottom: "1px solid var(--proof-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 2,
                height: 16,
                borderRadius: 2,
                background: "var(--proof-blue)",
                boxShadow: "0 0 8px rgba(59,130,246,0.5)",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>
              Environment Health
            </span>
            <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>
              {envHealth.length} environments
            </span>
          </div>
          <button
            onClick={() => navigate("/runs")}
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--proof-blue-bright)",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            All Runs <ChevronRight size={12} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {envHealth.map((env, i) => {
            const { color, bright, label, accent } = statusConfig(env.passRate);
            const { Icon: TrendIcon, color: trendColor } = trendInfo(env.trend);
            const col = i % 3;
            const row = Math.floor(i / 3);
            const totalRows = Math.ceil(envHealth.length / 3);
            return (
              <div
                key={env.id}
                onClick={() => navigate(`/runs?env=${encodeURIComponent(env.label)}`)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  padding: "16px 18px",
                  borderRight:
                    col < 2 && i < envHealth.length - 1 ? "1px solid var(--proof-border)" : "none",
                  borderBottom: row < totalRows - 1 ? "1px solid var(--proof-border)" : "none",
                  cursor: "pointer",
                  transition: "background 0.12s",
                  background: "transparent",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: color,
                        boxShadow: `0 0 6px ${color}`,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--proof-text)" }}>
                      {env.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "-1px",
                      color: bright,
                    }}
                  >
                    {env.passRate}%
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      fontSize: 11,
                      color: trendColor,
                      fontWeight: 600,
                    }}
                  >
                    <TrendIcon size={11} />
                    {env.trend > 0 ? "+" : ""}
                    {env.trend}%
                  </div>
                  {env.failures > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        fontSize: 11,
                        color: "var(--proof-text-muted)",
                      }}
                    >
                      <XCircle size={10} style={{ color: "#f87171" }} />
                      {env.failures} failed
                    </div>
                  )}
                  {env.runCount === 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--proof-text-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      No runs
                    </span>
                  )}
                  <div
                    style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}
                  >
                    {label === "healthy" ? (
                      <CheckCircle2 size={12} style={{ color: "#34d399" }} />
                    ) : label === "degraded" ? (
                      <AlertTriangle size={12} style={{ color: "#fbbf24" }} />
                    ) : (
                      <XCircle size={12} style={{ color: "#f87171" }} />
                    )}
                    <span
                      style={{
                        fontSize: 10,
                        color,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    height: 3,
                    background: "var(--proof-hover-light)",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${env.passRate}%`,
                      background: `linear-gradient(90deg, ${color}, ${bright})`,
                      borderRadius: 99,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pass rate chart ── */}
      <div
        style={{
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 18px 12px",
            borderBottom: "1px solid var(--proof-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 2,
                height: 16,
                borderRadius: 2,
                background: "var(--proof-green)",
                boxShadow: "0 0 8px rgba(16,185,129,0.5)",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>
              Pass Rate Trend
            </span>
            <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>Last 14 days</span>
          </div>
          <button
            onClick={() => navigate("/trends")}
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--proof-blue-bright)",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            Full Trends <ArrowUpRight size={12} />
          </button>
        </div>
        <div style={{ padding: "16px 18px", height: 130 }}>
          {effectivePassRateChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={effectivePassRateChart}
                margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
              >
                <defs>
                  <linearGradient id="db-sparkline-new" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.08)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={
                    {
                      fontSize: 9,
                      fill: "var(--proof-text-muted)",
                    } as React.SVGAttributes<SVGTextElement>
                  }
                  axisLine={{ stroke: "var(--proof-border)" }}
                  tickLine={false}
                  minTickGap={50}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={
                    {
                      fontSize: 9,
                      fill: "var(--proof-text-muted)",
                    } as React.SVGAttributes<SVGTextElement>
                  }
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--proof-overlay-strong)",
                    border: "1px solid var(--proof-border-accent)",
                    borderRadius: 8,
                    fontSize: 11,
                    boxShadow: "var(--proof-shadow-lg)",
                  }}
                  formatter={(value: number) => [`${value}%`, "Pass Rate"]}
                />
                <Area
                  type="monotone"
                  dataKey="passRate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#db-sparkline-new)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                fontSize: 12,
                color: "var(--proof-text-muted)",
              }}
            >
              No trend data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Promotion status ── */}
      <div
        style={{
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border)",
          borderRadius: 12,
          padding: "14px 18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 2,
                height: 16,
                borderRadius: 2,
                background: "var(--proof-purple)",
                boxShadow: "0 0 8px rgba(139,92,246,0.5)",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>
              Promotion Gate
            </span>
          </div>
          <button
            onClick={() => navigate("/copilot")}
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--proof-purple)",
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Bot size={11} /> Ask Copilot
          </button>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {[
            { from: "QA", to: "UAT" },
            { from: "UAT", to: "PROD" },
          ].map(({ from, to }) => {
            const fromEnv = envHealth.find((e) => e.label.startsWith(from));
            const rate = fromEnv?.passRate ?? 0;
            const gate = 95;
            const passes = rate >= gate;
            return (
              <div
                key={from}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  background: passes ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                  border: `1px solid ${passes ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}`,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Shield
                  size={16}
                  style={{ color: passes ? "#34d399" : "#f87171", flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-text)" }}>
                    {from} → {to}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>
                    {rate}% / {gate}% required
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: passes ? "#34d399" : "#f87171",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  {passes ? "GO" : "HOLD"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

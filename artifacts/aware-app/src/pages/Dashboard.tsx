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
import {
  getLayoutSettings,
  getLayoutSnapshot,
  setLayoutSettings,
  subscribeToLayout,
} from "@/lib/filters";
import type { Run } from "@/lib/types";
import {
  Play,
  Bot,
  Activity,
  TestTube,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  AlertTriangle,
  GitCompare,
  CheckCircle2,
  XCircle,
  Zap,
  ChevronRight,
  Clock,
  ExternalLink,
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
import { ConsolePagination } from "@/components/console/ConsolePagination";

function statusConfig(passPct: number) {
  if (passPct >= 95)
    return {
      color: "var(--proof-green)",
      bright: "var(--proof-green-bright)",
      label: "Healthy",
      ring: "rgba(34,197,94,0.15)",
    };
  if (passPct >= 80)
    return {
      color: "var(--proof-yellow)",
      bright: "var(--proof-yellow-bright)",
      label: "Degraded",
      ring: "rgba(245,158,11,0.15)",
    };
  return {
    color: "var(--proof-red)",
    bright: "var(--proof-red-bright)",
    label: "Critical",
    ring: "rgba(239,68,68,0.15)",
  };
}

function trendInfo(trend: number) {
  if (trend > 0) return { Icon: TrendingUp, color: "var(--proof-green)" };
  if (trend < 0) return { Icon: TrendingDown, color: "var(--proof-red)" };
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
  if (selectedEnvIds && selectedEnvIds.length > 0)
    configs = configs.filter((c) => selectedEnvIds.includes(c.id));
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

function CollapsibleSection({
  title,
  subtitle,
  count,
  collapsed,
  onToggle,
  children,
  accentColor = "var(--proof-blue)",
  glowColor,
}: {
  title: string;
  subtitle?: string;
  count?: string | number;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accentColor?: string;
  glowColor?: string;
}) {
  return (
    <div
      style={{
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          padding: "16px 20px 14px",
          borderBottom: collapsed ? "none" : "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
          transition: "background 0.13s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--proof-hover-light)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 3,
              height: 18,
              borderRadius: 99,
              background: accentColor,
              boxShadow: glowColor ? `0 0 8px ${glowColor}` : "none",
              transition: "opacity 0.2s",
              opacity: collapsed ? 0.4 : 1,
            }}
          />
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--proof-text)",
              letterSpacing: "-0.2px",
            }}
          >
            {title}
          </span>
          {subtitle && (
            <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>{subtitle}</span>
          )}
          {count !== undefined && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--proof-text-muted)",
                background: "var(--proof-subtle-bg2)",
                border: "1px solid var(--proof-border)",
                borderRadius: 999,
                padding: "2px 8px",
                letterSpacing: "0.3px",
              }}
            >
              {count}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-text-muted)",
            transition: "transform 0.2s",
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </div>
      <div
        style={{
          display: collapsed ? "none" : "block",
          animation: collapsed ? undefined : "page-enter 0.18s ease-out both",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const isAllRuns = envSnap.envIds.length === 0;
  const effectiveRuns = React.useMemo(
    () => (isAllRuns ? [...RUNS] : getRunsByEnv(envSnap.envIds)),
    [isAllRuns, envSnap.envIds],
  );
  const latestRun = effectiveRuns[0] ?? null;

  const overallPassRate = React.useMemo(
    () =>
      effectiveRuns.length > 0
        ? Math.round(effectiveRuns.reduce((s, r) => s + r.passPct, 0) / effectiveRuns.length)
        : 0,
    [effectiveRuns],
  );

  const envHealth = React.useMemo(
    () => computeEnvHealth(effectiveRuns, envSnap.envIds),
    [effectiveRuns, envSnap.envIds],
  );

  const effectivePassRateChart = React.useMemo(() => {
    if (isAllRuns) return PASS_RATE_CHART;
    const sorted = [...effectiveRuns].sort(
      (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
    );
    return sorted.map((r) => ({ label: r.started.slice(0, 10), passRate: r.passPct, runId: r.id }));
  }, [effectiveRuns, isAllRuns]);

  const testCasesList = getTestCases();
  const totalTests = testCasesList.length;
  const regressions = DIFF_ROWS.filter((d) => d.state === "regression").length;
  const failingEnvs = envHealth.filter((e) => e.passRate < 80);
  const hasAlerts = regressions > 0 || failingEnvs.length > 0;
  const healthyEnvs = envHealth.filter((e) => e.passRate >= 95).length;

  const layoutSnap = useSyncExternalStore(subscribeToLayout, getLayoutSnapshot);
  const [chartPanelCollapsed, setChartCollapsed] = React.useState(layoutSnap.chartPanelCollapsed);
  const [envPanelCollapsed, setEnvCollapsed] = React.useState(layoutSnap.envHealthCollapsed);
  React.useEffect(() => {
    setLayoutSettings({ chartPanelCollapsed });
  }, [chartPanelCollapsed]);
  React.useEffect(() => {
    setLayoutSettings({ envHealthCollapsed: envPanelCollapsed });
  }, [envPanelCollapsed]);

  const [runsPage, setRunsPage] = React.useState(1);
  const RUNS_PAGE_SIZE = 8;
  const runsTotalPages = Math.max(1, Math.ceil(effectiveRuns.length / RUNS_PAGE_SIZE));
  const safeRunsPage = Math.min(runsPage, runsTotalPages);
  const paginatedRuns = effectiveRuns.slice(
    (safeRunsPage - 1) * RUNS_PAGE_SIZE,
    safeRunsPage * RUNS_PAGE_SIZE,
  );

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
            border: "1px solid var(--proof-border-accent)",
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

  const passRateColor =
    overallPassRate >= 95
      ? "var(--proof-green)"
      : overallPassRate >= 80
        ? "var(--proof-yellow)"
        : "var(--proof-red)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        animation: "page-enter 0.22s ease-out both",
      }}
    >
      {/* ── Alert banner ── */}
      {hasAlerts && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "11px 16px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.18)",
            borderLeft: "3px solid var(--proof-red)",
          }}
        >
          <AlertTriangle size={14} style={{ color: "var(--proof-red-bright)", flexShrink: 0 }} />
          <span
            style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--proof-red-bright)" }}
          >
            {regressions > 0 && `${regressions} regression${regressions !== 1 ? "s" : ""} detected`}
            {regressions > 0 && failingEnvs.length > 0 && " · "}
            {failingEnvs.length > 0 &&
              `${failingEnvs.map((e) => e.label).join(", ")} below threshold`}
          </span>
          <button
            onClick={() => navigate("/runs")}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--proof-red-bright)",
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.22)",
              borderRadius: 7,
              padding: "4px 12px",
              cursor: "pointer",
            }}
          >
            Investigate →
          </button>
        </div>
      )}

      {/* ── System status bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderRadius: 14,
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--proof-blue-bg)",
              border: "1px solid var(--proof-border-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={16} style={{ color: "var(--proof-blue)" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--proof-text)",
                letterSpacing: "-0.2px",
              }}
            >
              {effectiveRuns.length} runs · {envHealth.filter((e) => e.runCount > 0).length} active
              environments
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--proof-text-muted)",
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Clock size={10} />
              Last run{" "}
              {latestRun?.started
                ? new Date(latestRun.started).toLocaleString([], {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "—"}
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "var(--proof-border-strong)",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  color:
                    healthyEnvs === envHealth.length ? "var(--proof-green)" : "var(--proof-yellow)",
                }}
              >
                {healthyEnvs}/{envHealth.length} healthy
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button
            onClick={() => window.open("https://github.com/your-org/your-repo/actions/workflows/run-tests.yml", "_blank")}
            className="proof-button-primary"
            style={{ fontSize: 12.5 }}
          >
            <Play size={12} /> Start Run <ExternalLink size={10} style={{ opacity: 0.7 }} />
          </button>
          <button
            onClick={() => navigate("/compare")}
            className="proof-button"
            style={{ fontSize: 12.5 }}
          >
            <GitCompare size={12} /> Compare
          </button>
          <button
            onClick={() => navigate("/copilot")}
            className="proof-button"
            style={{ fontSize: 12.5 }}
          >
            <Bot size={12} /> Copilot
          </button>
        </div>
      </div>

      {/* ── Environment Health Grid ── */}
      <CollapsibleSection
        title="Environment Health"
        count={`${envHealth.length} envs`}
        collapsed={envPanelCollapsed}
        onToggle={() => setEnvCollapsed((p) => !p)}
        accentColor="var(--proof-blue)"
        glowColor="var(--proof-blue-glow)"
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {envHealth.map((env, i) => {
            const { color, bright, label, ring } = statusConfig(env.passRate);
            const { Icon: TrendIcon, color: trendColor } = trendInfo(env.trend);
            const col = i % 3;
            const row = Math.floor(i / 3);
            const totalRows = Math.ceil(envHealth.length / 3);
            const isLastCol = col === 2 || i === envHealth.length - 1;
            const isLastRow = row === totalRows - 1;

            return (
              <div
                key={env.id}
                onClick={() => navigate(`/runs?env=${encodeURIComponent(env.label)}`)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: "18px 20px",
                  borderRight: !isLastCol ? "1px solid var(--proof-border)" : "none",
                  borderBottom: !isLastRow ? "1px solid var(--proof-border)" : "none",
                  cursor: "pointer",
                  transition: "background 0.13s",
                  background: "transparent",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = ring;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Top: name + pass rate */}
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: color,
                        flexShrink: 0,
                        boxShadow: `0 0 0 2px ${ring}`,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
                      {env.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "-1px",
                      color: bright,
                    }}
                  >
                    {env.passRate}%
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: 4,
                    background: "var(--proof-bar-track)",
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
                      transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  />
                </div>

                {/* Bottom: trend + status */}
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 11,
                        color: trendColor,
                        fontWeight: 600,
                      }}
                    >
                      <TrendIcon size={11} />
                      {env.trend > 0 ? "+" : ""}
                      {env.trend}%
                    </span>
                    {env.failures > 0 && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 11,
                          color: "var(--proof-red-bright)",
                        }}
                      >
                        <XCircle size={10} />
                        {env.failures} fail{env.failures !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10.5,
                      fontWeight: 600,
                      color,
                    }}
                  >
                    {label === "Healthy" ? (
                      <CheckCircle2 size={11} />
                    ) : label === "Degraded" ? (
                      <AlertTriangle size={11} />
                    ) : (
                      <XCircle size={11} />
                    )}
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* ── Pass rate chart + Recents ── */}
      <CollapsibleSection
        title="Pass Rate Trend"
        subtitle="Last 14 days"
        collapsed={chartPanelCollapsed}
        onToggle={() => setChartCollapsed((p) => !p)}
        accentColor="var(--proof-green)"
        glowColor="rgba(34,197,94,0.4)"
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }}>
          {/* Trend chart */}
          <div
            style={{
              background: "var(--proof-surface)",
              border: "1px solid var(--proof-border)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "6px 16px",
                borderBottom: "1px solid var(--proof-border)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => navigate("/trends")}
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: "var(--proof-blue-bright)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 6,
                  transition: "background 0.13s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--proof-blue-bg)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "none";
                }}
              >
                Full Trends <ArrowUpRight size={11} />
              </button>
            </div>
            <div style={{ padding: "16px 20px 12px", height: 160 }}>
              {effectivePassRateChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={effectivePassRateChart}
                    margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                  >
                    <defs>
                      <linearGradient id="dash-trend-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--proof-green)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="var(--proof-green)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--proof-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={
                        {
                          fontSize: 9,
                          fill: "var(--proof-text-muted)",
                        } as React.SVGProps<SVGTextElement>
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[80, 100]}
                      tick={
                        {
                          fontSize: 9,
                          fill: "var(--proof-text-muted)",
                        } as React.SVGProps<SVGTextElement>
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--proof-surface)",
                        border: "1px solid var(--proof-border)",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      labelStyle={{ color: "var(--proof-text-muted)" }}
                      itemStyle={{ color: "var(--proof-green-bright)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="passRate"
                      stroke="var(--proof-green)"
                      strokeWidth={2}
                      fill="url(#dash-trend-fill)"
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: "var(--proof-green)",
                        stroke: "var(--proof-surface)",
                        strokeWidth: 2,
                      }}
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
                    color: "var(--proof-text-muted)",
                    fontSize: 13,
                  }}
                >
                  No chart data available
                </div>
              )}
            </div>
          </div>

          {/* Recent runs */}
          <div
            style={{
              background: "var(--proof-surface)",
              border: "1px solid var(--proof-border)",
              borderRadius: 14,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "16px 20px 14px",
                borderBottom: "1px solid var(--proof-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 3,
                    height: 18,
                    borderRadius: 99,
                    background: "var(--proof-purple)",
                    boxShadow: "0 0 8px rgba(139,92,246,0.4)",
                  }}
                />
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "var(--proof-text)",
                    letterSpacing: "-0.2px",
                  }}
                >
                  Recent Runs
                </span>
              </div>
              <button
                onClick={() => navigate("/runs")}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--proof-blue-bright)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "4px 8px",
                  borderRadius: 7,
                  transition: "background 0.13s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--proof-blue-bg)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "none";
                }}
              >
                All <ChevronRight size={13} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {paginatedRuns.map((run, i) => {
                const isPass = run.passPct === 100;
                const isFail = run.passPct < 90;
                const runColor = isPass
                  ? "var(--proof-green)"
                  : isFail
                    ? "var(--proof-red)"
                    : "var(--proof-yellow)";
                return (
                  <div
                    key={run.id}
                    onClick={() => navigate(`/runs/${run.id}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 16px",
                      borderBottom:
                        i < paginatedRuns.length - 1 ? "1px solid var(--proof-border)" : "none",
                      cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--proof-console-table-row-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: runColor,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--proof-text)",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {run.id}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--proof-text-muted)", marginTop: 1 }}>
                        {run.env}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        color: runColor,
                      }}
                    >
                      {run.passPct}%
                    </span>
                  </div>
                );
              })}
            </div>
            {runsTotalPages > 1 && (
              <div
                style={{
                  borderTop: "1px solid var(--proof-border)",
                  padding: "0 16px",
                }}
              >
                <ConsolePagination
                  currentPage={safeRunsPage}
                  totalPages={runsTotalPages}
                  totalItems={effectiveRuns.length}
                  pageSize={RUNS_PAGE_SIZE}
                  onPageChange={setRunsPage}
                  onPageSizeChange={() => {}}
                  showTotal={false}
                />
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

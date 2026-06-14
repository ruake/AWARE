import React from "react";
import { useLocation } from "wouter";
import { ConsoleCard } from "@/components/console/ConsoleCard";
import { ConsoleStat } from "@/components/console/ConsoleStat";
import { ConsoleChart } from "@/components/console/ConsoleChart";
import { DataTable, type ColumnDef } from "@/components/console/DataTable";
import { RUNS, DIFF_ROWS, PASS_RATE_CHART, computeRunFrequency } from "@/lib/data";
import { getEnvConfigs } from "@/lib/envConfig";
import { getTestCases } from "@/lib/data";
import { getTestSuites } from "@/lib/data";
import type { Run } from "@/lib/types";
import {
  Play,
  List,
  Bot,
  Activity,
  Beaker,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  Clock,
  BarChart3,
  AlertTriangle,
  GitCompare,
  Share2,
} from "lucide-react";
import { AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const TREND_VALUES = { up: "up" as const, down: "down" as const, neutral: "neutral" as const };

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function statusDot(passPct: number): { color: string; label: string } {
  if (passPct >= 95) return { color: "#22c55e", label: "healthy" };
  if (passPct >= 80) return { color: "#f59e0b", label: "degraded" };
  return { color: "#ef4444", label: "critical" };
}

function trendIcon(trend: number) {
  if (trend > 0)
    return { icon: TrendingUp, color: "var(--proof-green)", dir: TREND_VALUES.up };
  if (trend < 0)
    return { icon: TrendingDown, color: "var(--proof-red)", dir: TREND_VALUES.down };
  return { icon: Minus, color: "var(--proof-text-muted)", dir: TREND_VALUES.neutral };
}

interface EnvHealthItem {
  id: string;
  label: string;
  shortLabel: string;
  passRate: number;
  trend: number;
  failures: number;
  runCount: number;
}

function computeEnvHealth(): EnvHealthItem[] {
  const groups = new Map<string, Run[]>();
  for (const run of RUNS) {
    if (!groups.has(run.envId)) groups.set(run.envId, []);
    groups.get(run.envId)!.push(run);
  }
  const configs = getEnvConfigs();
  return configs.map((cfg) => {
    const runs = groups.get(cfg.id) ?? [];
    const sorted = [...runs].sort(
      (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
    );
    const latest = sorted[0];
    const previous = sorted[1];
    const avgPassRate =
      sorted.length > 0
        ? Math.round(sorted.reduce((s, r) => s + r.passPct, 0) / sorted.length)
        : 0;
    const trend = previous && latest ? Math.round(latest.passPct - previous.passPct) : 0;
    return {
      id: cfg.id,
      label: cfg.label,
      shortLabel: cfg.target,
      passRate: avgPassRate,
      trend,
      failures: latest?.failures ?? 0,
      runCount: sorted.length,
    };
  });
}

const RECENT_RUN_COLUMNS: ColumnDef<Record<string, unknown>>[] = [
  {
    key: "runId",
    header: "Run ID",
    width: 100,
    render: (item) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--proof-blue)",
            fontWeight: 600,
          }}
        >
          {String(item.runId)}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            color: "var(--proof-text-muted)",
          }}
        >
          {String(item.build ?? "")} · {String(item.rev ?? "").slice(0, 7)}
        </span>
      </div>
    ),
  },
  {
    key: "env",
    header: "Env",
    width: 80,
    render: (item) => {
      const network = String(item.network ?? "");
      return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500 }}>{String(item.env)}</span>
        {network && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              color: network === "production" ? "var(--proof-green)" : "#d97706",
              background:
                network === "production"
                  ? "var(--proof-green-bg)"
                  : "var(--proof-yellow-bg)",
              border: `1px solid ${
                network === "production"
                  ? "rgba(34,197,94,0.2)"
                  : "rgba(217,119,6,0.2)"
              }`,
              padding: "1px 5px",
              borderRadius: 3,
              display: "inline-block",
              width: "fit-content",
            }}
          >
            {network}
          </span>
        )}
      </div>
      );
    },
  },
  {
    key: "status",
    header: "Status",
    width: 80,
    render: (item) => {
      const status = String(item.status);
      const cls =
        status === "PASS"
          ? "proof-badge-pass"
          : status === "FAIL"
            ? "proof-badge-fail"
            : status === "PARTIAL"
              ? "proof-badge-partial"
              : status === "FLAKY"
                ? "proof-badge-flaky"
                : "proof-badge-skip";
      return <span className={`proof-badge ${cls}`}>{status}</span>;
    },
  },
  {
    key: "passPct",
    header: "Pass %",
    width: 80,
    align: "right",
    cellStyle: { fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 },
    render: (item) => {
      const pct = Number(item.passPct);
      const color =
        pct === 100
          ? "var(--proof-green)"
          : pct < 90
            ? "var(--proof-red)"
            : "var(--proof-text)";
      return <span style={{ color }}>{pct}%</span>;
    },
  },
  {
    key: "duration",
    header: "Duration",
    width: 90,
    align: "right",
    cellStyle: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-text-secondary)" },
  },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const latestRun = RUNS[0] ?? null;
  const runFreq = React.useMemo(() => computeRunFrequency(), []);

  const overallPassRate = React.useMemo(
    () =>
      RUNS.length > 0
        ? Math.round(RUNS.reduce((s, r) => s + r.passPct, 0) / RUNS.length)
        : 0,
    [],
  );

  const envHealth = React.useMemo(() => computeEnvHealth(), []);

  const recentRunsData = React.useMemo(
    () =>
      RUNS.slice(0, 5).map((r) => ({
        runId: r.id,
        build: r.build,
        rev: r.rev,
        env: r.env,
        network: r.network,
        status: r.status,
        passPct: r.passPct,
        failures: r.failures,
        duration: r.duration,
      })),
    [],
  );

  const testCasesList = getTestCases();
  const testSuitesList = getTestSuites();
  const totalTests = testCasesList.length;
  const activeSuites = testSuitesList.length;
  const flakyCount = DIFF_ROWS.filter((d) => d.state === "regression").length;
  const avgDurationMs = React.useMemo(() => {
    const withDur = RUNS.filter((r) => r.durationMs > 0);
    if (withDur.length === 0) return 0;
    return Math.round(withDur.reduce((s, r) => s + r.durationMs, 0) / withDur.length);
  }, []);

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
          <Beaker
            style={{ width: 48, height: 48, color: "var(--proof-text-muted)", opacity: 0.3 }}
          />
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text)", margin: 0 }}>
            No runs available
          </h2>
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", margin: 0 }}>
            Start a new regression run to see data here.
          </p>
          <button
            onClick={() => navigate("/start")}
            style={{
              marginTop: 8,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 600,
              background: "var(--proof-blue)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Play size={14} /> New Regression Run
          </button>
        </div>
    );
  }

  return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* ── Section 1: Welcome Banner ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "18px 22px",
            borderRadius: 8,
            background: "var(--proof-surface)",
            border: "1px solid var(--proof-border)",
            borderLeft: "4px solid var(--proof-blue)",
            boxShadow: "var(--proof-shadow-sm)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--proof-text)",
                marginBottom: 4,
              }}
            >
              {getGreeting()}, Operator
            </div>
            <div style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>
              Here's your Akamai CDN observability summary —{" "}
              {RUNS.length} runs across {envHealth.filter((e) => e.runCount > 0).length} environments
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexShrink: 0,
              alignItems: "center",
            }}
          >
            <button
              onClick={() => navigate("/start")}
              style={{
                padding: "7px 16px",
                fontSize: 12.5,
                fontWeight: 600,
                background: "var(--proof-blue)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <Play size={13} /> Start a Run
            </button>
            <button
              onClick={() => navigate("/runs")}
              style={{
                padding: "7px 16px",
                fontSize: 12.5,
                fontWeight: 500,
                background: "transparent",
                color: "var(--proof-text)",
                border: "1px solid var(--proof-border)",
                borderRadius: 6,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <List size={13} /> View Runs
            </button>
            <button
              onClick={() => navigate("/copilot")}
              style={{
                padding: "7px 16px",
                fontSize: 12.5,
                fontWeight: 500,
                background: "transparent",
                color: "var(--proof-text)",
                border: "1px solid var(--proof-border)",
                borderRadius: 6,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <Bot size={13} /> Open Copilot
            </button>
          </div>
        </div>

        {/* ── Section 2: Environment Health Cards (3×2 grid) ── */}
        <ConsoleCard title="Environment Health" accent="blue">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 0,
            }}
          >
            {envHealth.map((env, i) => {
              const TrendIcon = trendIcon(env.trend).icon;
              const trendColor = trendIcon(env.trend).color;
              const dot = statusDot(env.passRate);
              return (
                <div
                  key={env.id}
                  onClick={() => navigate(`/runs?env=${encodeURIComponent(env.label)}`)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: "14px 16px",
                    borderRight:
                      i % 3 < 2 ? "1px solid var(--proof-border)" : "none",
                    borderBottom:
                      i < envHealth.length - 3
                        ? "1px solid var(--proof-border)"
                        : "none",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--proof-surface-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: dot.color,
                          boxShadow: `0 0 6px ${dot.color}60`,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "var(--proof-text)",
                        }}
                      >
                        {env.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "-0.5px",
                        color:
                          env.passRate >= 90
                            ? "var(--proof-green)"
                            : env.passRate >= 70
                              ? "var(--proof-yellow)"
                              : "var(--proof-red)",
                      }}
                    >
                      {env.passRate}%
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 2,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 11.5,
                        color: trendColor,
                        fontWeight: 600,
                      }}
                    >
                      <TrendIcon
                        style={{ width: 13, height: 13, flexShrink: 0 }}
                      />
                      {env.trend > 0 ? "+" : ""}
                      {env.trend}%
                    </div>
                    {env.failures > 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 11,
                          color: "var(--proof-text-secondary)",
                        }}
                      >
                        <XCircle size={11} style={{ color: "var(--proof-red)" }} />
                        {env.failures} failing
                      </div>
                    )}
                    {env.runCount === 0 && (
                      <span
                        style={{
                          fontSize: 10.5,
                          color: "var(--proof-text-muted)",
                          fontStyle: "italic",
                        }}
                      >
                        No runs
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ConsoleCard>

        {/* ── Section 3: Quick Stats Row ── */}
        <ConsoleCard padding="0">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 0,
            }}
          >
            <ConsoleStat
              label="Total Tests"
              value={totalTests}
              icon={<Beaker size={14} />}
              color="var(--proof-blue)"
              size="lg"
            />
            <div
              style={{
                width: "100%",
                height: 1,
                background: "var(--proof-border)",
                gridColumn: "1 / -1",
                display: "none",
              }}
            />
            <ConsoleStat
              label="Pass Rate"
              value={`${overallPassRate}%`}
              trend={{
                value: runFreq.runsPerDay,
                direction: overallPassRate >= 90 ? TREND_VALUES.up : TREND_VALUES.down,
                label: "7d avg",
              }}
              icon={<Activity size={14} />}
              color={
                overallPassRate >= 90
                  ? "var(--proof-green)"
                  : overallPassRate >= 70
                    ? "var(--proof-yellow)"
                    : "var(--proof-red)"
              }
              size="lg"
            />
            <ConsoleStat
              label="Active Suites"
              value={activeSuites}
              icon={<BarChart3 size={14} />}
              color="var(--proof-purple)"
              size="lg"
            />
            <ConsoleStat
              label="Avg Duration"
              value={avgDurationMs > 0 ? `${Math.round(avgDurationMs / 1000)}s` : "—"}
              icon={<Clock size={14} />}
              color="var(--proof-yellow)"
              size="lg"
            />
            <ConsoleStat
              label="Regressions"
              value={flakyCount}
              icon={<AlertTriangle size={14} />}
              color={flakyCount > 0 ? "var(--proof-red)" : "var(--proof-green)"}
              size="lg"
              trend={
                flakyCount > 0
                  ? { value: flakyCount, direction: TREND_VALUES.down, label: "needs attention" }
                  : undefined
              }
            />
          </div>
        </ConsoleCard>

        {/* ── Section 4: Recent Runs Table ── */}
        <ConsoleCard
          title="Recent CI Runs"
          subtitle="Last 7 days"
          actions={
            <button
              onClick={() => navigate("/runs")}
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--proof-blue)",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: 0,
              }}
            >
              View All <ArrowUpRight size={12} />
            </button>
          }
          padding="0"
          accent="blue"
        >
          <DataTable
            columns={RECENT_RUN_COLUMNS}
            data={recentRunsData}
            keyExtractor={(item) => String(item.runId)}
            sortable={false}
            onRowClick={(item) => navigate(`/runs/${String(item.runId)}`)}
            emptyMessage="No recent runs"
          />
        </ConsoleCard>

        {/* ── Section 5: Pass Rate Trend Chart ── */}
        <ConsoleChart
          title="Pass Rate Trend"
          subtitle="Last 14 days"
          height={240}
          empty={PASS_RATE_CHART.length === 0}
          emptyMessage="No run data yet"
        >
          <AreaChart
            data={PASS_RATE_CHART}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <defs>
              <linearGradient id="dashboard-pass-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--proof-blue)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--proof-blue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--proof-border)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--proof-text-muted)" }}
              axisLine={{ stroke: "var(--proof-border)" }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "var(--proof-text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--proof-surface)",
                border: "1px solid var(--proof-border)",
                borderRadius: 6,
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
              formatter={(value: number) => [`${value}%`, "Pass Rate"]}
              labelFormatter={(label: string) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="passRate"
              stroke="var(--proof-blue)"
              strokeWidth={2}
              fill="url(#dashboard-pass-gradient)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--proof-blue)", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ConsoleChart>
      </div>
  );
}

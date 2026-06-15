import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { ConsoleCard } from "@/components/console/ConsoleCard";
import { ConsoleStat } from "@/components/console/ConsoleStat";
import {
  RUNS,
  DIFF_ROWS,
  PASS_RATE_CHART,
  getRunsByEnv,
  getSelectedEnvSnapshot,
  subscribeToSelectedEnv,
} from "@/lib/data";
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
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  AlertTriangle,
  GitCompare,
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

/* ── Per Few (2006): Dashboard shows SIGNAL, not noise ───────────────────
 *   - Removed: greeting banner (personality ≠ signal)
 *   - Removed: full Recent Runs table (belongs on /runs — Shneiderman's
 *     "zoom and filter" phase, not the "overview first" phase)
 *   - Removed: 5 stat cards → 3 (total tests, pass rate, regressions)
 *   - Kept: Environment Health grid (primary signal — what needs attention)
 *   - Kept: Pass rate sparkline (compact, links to /trends for details)
 *   - Added: "Needs Attention" widget (progressive disclosure — only when
 *     there are regressions/failures)
 */

function statusDot(passPct: number): { color: string; label: string } {
  if (passPct >= 95) return { color: "var(--proof-green)", label: "healthy" };
  if (passPct >= 80) return { color: "var(--proof-yellow)", label: "degraded" };
  return { color: "var(--proof-red)", label: "critical" };
}

function trendIcon(trend: number) {
  if (trend > 0) return { icon: TrendingUp, color: "var(--proof-green)" };
  if (trend < 0) return { icon: TrendingDown, color: "var(--proof-red)" };
  return { icon: Minus, color: "var(--proof-text-muted)" };
}

interface EnvHealthItem {
  id: string;
  label: string;
  passRate: number;
  trend: number;
  failures: number;
  runCount: number;
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
    };
  });
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
    [effectiveRuns],
  );

  const envHealth = React.useMemo(
    () => computeEnvHealth(effectiveRuns, envSnap.envIds),
    [effectiveRuns, envSnap.envIds],
  );

  const effectivePassRateChart = React.useMemo(() => {
    if (effectiveRuns === RUNS) return PASS_RATE_CHART;
    const sorted = [...effectiveRuns].sort(
      (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
    );
    return sorted.map((r) => ({ label: r.started.slice(0, 10), passRate: r.passPct, runId: r.id }));
  }, [effectiveRuns]);

  const testCasesList = getTestCases();
  const totalTests = testCasesList.length;
  const activeSuites = getTestSuites().length;
  const regressions = DIFF_ROWS.filter((d) => d.state === "regression").length;

  /* ── "Needs Attention" items (progressive disclosure) ── */
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
        <Beaker style={{ width: 48, height: 48, color: "var(--proof-text-muted)", opacity: 0.3 }} />
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text)", margin: 0 }}>
          {envSnap.envIds.length > 0 ? "No data for this environment" : "No runs available"}
        </h2>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", margin: 0 }}>
          {envSnap.envIds.length > 0
            ? "The selected environment has no runs yet."
            : "Start a new regression run to see data here."}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Needs Attention (progressive disclosure: only when issues exist) ── */}
      {hasAlerts && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderLeft: "3px solid var(--proof-red)",
          }}
        >
          <AlertTriangle size={16} style={{ color: "var(--proof-red)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--proof-red)" }}>
            {regressions > 0 && `${regressions} regression${regressions > 1 ? "s" : ""}`}
            {regressions > 0 && failingEnvs.length > 0 && " · "}
            {failingEnvs.length > 0 &&
              `${failingEnvs.map((e) => e.label).join(", ")} below 80% pass rate`}
          </span>
          <button
            onClick={() => navigate("/runs")}
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--proof-red)",
              background: "rgba(239,68,68,0.12)",
              border: "none",
              borderRadius: 5,
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            View Runs
          </button>
        </div>
      )}

      {/* ── Action Bar (compact, no greeting per Nielsen #8) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderRadius: 8,
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Beaker size={18} style={{ color: "var(--proof-blue)", opacity: 0.7 }} />
          <span style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>
            {effectiveRuns.length} runs across {envHealth.filter((e) => e.runCount > 0).length}{" "}
            environments
          </span>
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
            onClick={() => navigate("/runs")}
            className="proof-button"
            style={{ padding: "6px 14px", fontSize: 12 }}
          >
            <List size={12} /> Runs
          </button>
          <button
            onClick={() => navigate("/copilot")}
            className="proof-button"
            style={{ padding: "6px 14px", fontSize: 12 }}
          >
            <Bot size={12} /> Copilot
          </button>
        </div>
      </div>

      {/* ── Environment Health Grid (primary signal) ── */}
      <ConsoleCard title="Environment Health" accent="blue">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
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
                  padding: "12px 14px",
                  borderRight: i % 3 < 2 ? "1px solid var(--proof-border)" : "none",
                  borderBottom: i < envHealth.length - 3 ? "1px solid var(--proof-border)" : "none",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--proof-surface-hover)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
                        background: dot.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-text)" }}>
                      {env.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 16,
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 1 }}>
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
                    <TrendIcon size={12} />
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
                        color: "var(--proof-text-secondary)",
                      }}
                    >
                      <XCircle size={10} style={{ color: "var(--proof-red)" }} />
                      {env.failures}
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
                </div>
              </div>
            );
          })}
        </div>
      </ConsoleCard>

      {/* ── Key Metrics (3 essential stats per Few) ── */}
      <ConsoleCard padding="0">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
          <ConsoleStat
            label="Total Tests"
            value={totalTests}
            icon={<Beaker size={14} />}
            color="var(--proof-blue)"
            size="lg"
          />
          <ConsoleStat
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
            size="lg"
          />
          <ConsoleStat
            label="Regressions"
            value={regressions}
            icon={<AlertTriangle size={14} />}
            color={regressions > 0 ? "var(--proof-red)" : "var(--proof-green)"}
            size="lg"
            trend={
              regressions > 0
                ? { value: regressions, direction: "down" as const, label: "needs attention" }
                : undefined
            }
          />
        </div>
      </ConsoleCard>

      {/* ── Pass Rate Sparkline (compact — Tufte high data-ink ratio) ── */}
      <ConsoleCard
        title="Pass Rate"
        subtitle="Last 14 days"
        actions={
          <button
            onClick={() => navigate("/trends")}
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
            Full Trends <ArrowUpRight size={12} />
          </button>
        }
        accent="blue"
      >
        <div style={{ height: 100 }}>
          {effectivePassRateChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={effectivePassRateChart}
                margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
              >
                <defs>
                  <linearGradient id="db-sparkline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--proof-blue)" stopOpacity={0.15} />
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
                  tick={{ fontSize: 9, fill: "var(--proof-text-muted)" }}
                  axisLine={{ stroke: "var(--proof-border)" }}
                  tickLine={false}
                  minTickGap={50}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: "var(--proof-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--proof-surface)",
                    border: "1px solid var(--proof-border)",
                    borderRadius: 6,
                    fontSize: 11,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  formatter={(value: number) => [`${value}%`, "Pass Rate"]}
                />
                <Area
                  type="monotone"
                  dataKey="passRate"
                  stroke="var(--proof-blue)"
                  strokeWidth={1.5}
                  fill="url(#db-sparkline)"
                  dot={false}
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
      </ConsoleCard>
    </div>
  );
}

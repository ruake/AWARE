import React from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useFilteredRuns,
  useEnvHealth,
  useDashboardKPIs,
  usePassRateChart,
  useSchedulerStatus,
  useDataInit,
} from "@/lib/hooks/useData";
import {
  Activity,
  Zap,
  Clock,
  Calendar,
  Play,
  GitCompare,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { AnomalyBanner, HeroKpiCard, TierCard, RunRibbonCard } from "@/components/aware";
import type { TierGroup } from "@/components/aware/TierCard";
import {
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

/* ── Chart tooltip ─────────────────────────────────────────────── */
function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload?: { runId?: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  const c = v >= 95 ? "var(--proof-green)" : v >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
  return (
    <div style={{
      background: "var(--proof-surface-3)",
      border: "1px solid var(--proof-border-strong)",
      borderRadius: "var(--proof-radius-lg)",
      padding: "10px 14px",
      boxShadow: "var(--proof-shadow-md)",
      fontSize: 12,
      animation: "scale-in 0.12s ease-out both",
      minWidth: 130,
    }}>
      <div style={{
        color: "var(--proof-text-muted)", marginBottom: 4,
        fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px",
      }}>
        {label}
      </div>
      <div style={{ fontWeight: 800, fontSize: 20, color: c, fontFamily: "var(--font-mono)", letterSpacing: "-1px" }}>
        {v}%
      </div>
    </div>
  );
}

/* ── Section header ────────────────────────────────────────────── */
function SectionHeader({
  title,
  accent,
  action,
  badge,
}: {
  title: string;
  accent?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      {accent && (
        <div style={{
          width: 3, height: 16, borderRadius: 99,
          background: accent, flexShrink: 0,
          boxShadow: `0 0 8px ${accent}`,
        }} />
      )}
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
        {title}
      </span>
      {badge}
      <div style={{ flex: 1 }} />
      {action}
    </div>
  );
}

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
};
const containerVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const kpis = useDashboardKPIs();
  const envHealthData = useEnvHealth();
  const chartData = usePassRateChart();
  const filteredRuns = useFilteredRuns();
  const scheduler = useSchedulerStatus();
  const dataState = useDataInit();

  const sortedRuns = [...filteredRuns].sort(
    (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
  );
  const latestRun = sortedRuns[0] ?? null;
  const prevRun = sortedRuns[1] ?? null;

  // Group envs by tier for TierCard
  const tierMap = new Map<string, TierGroup>();
  for (const env of envHealthData) {
    const rawTier = env.tier.toUpperCase();
    const tier: "QA" | "UAT" | "PROD" =
      rawTier === "QA" ? "QA" : rawTier === "UAT" ? "UAT" : "PROD";
    if (!tierMap.has(tier)) {
      tierMap.set(tier, {
        tier,
        envs: [],
        avgPassRate: env.passRate,
        status: env.status,
      });
    }
    const group = tierMap.get(tier)!;
    group.envs.push({
      id: env.id,
      label: env.label ?? env.id,
      passRate: env.passRate,
      trend: env.trend,
      failures: env.failures,
      status: env.status,
    });
    // Overall status = worst of all envs in tier
    const statusPriority = { critical: 2, degraded: 1, healthy: 0 };
    if ((statusPriority[env.status] ?? 0) > (statusPriority[group.status] ?? 0)) {
      group.status = env.status;
    }
    group.avgPassRate = Math.round(
      group.envs.reduce((s, e) => s + e.passRate, 0) / group.envs.length,
    );
  }
  const tierGroups: TierGroup[] = [...tierMap.values()];

  const hasAlert = kpis.regressions > 0;
  const hasDegradation = tierGroups.some((t) => t.status !== "healthy");

  const chartColor =
    kpis.passRate >= 95
      ? "var(--proof-green)"
      : kpis.passRate >= 80
        ? "var(--proof-yellow)"
        : "var(--proof-red)";

  const sparkData = chartData.slice(-8).map((d) => d.passRate);

  const failureSparkData = sortedRuns
    .slice(0, 8)
    .reverse()
    .map((r) => r.failures ?? 0);
  const regressionSparkData = kpis.latestRun ? [kpis.regressions] : [0];

  const totalDelta = kpis.passTrend;
  const failureDelta =
    sortedRuns.length >= 2
      ? (sortedRuns[0]?.failures ?? 0) - (sortedRuns[1]?.failures ?? 0)
      : 0;
  const regressionDelta = kpis.regressions;

  const nextScheduled = scheduler.suites?.[0] ?? null;

  const lastSynced = React.useMemo(() => {
    if (!latestRun?.started) return "—";
    const d = new Date(latestRun.started);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }, [latestRun]);

  /* ── Empty state ─────────────────────────────────────────────── */
  if (!dataState.loading && filteredRuns.length === 0) {
    return (
      <main style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100%", flexDirection: "column", gap: 16, padding: 40,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: "var(--proof-surface-2)",
          border: "1px solid var(--proof-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Activity size={22} style={{ color: "var(--proof-text-muted)" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--proof-text)", marginBottom: 6 }}>
            No runs yet
          </div>
          <div style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>
            Trigger a CI run to see your first results here.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            onClick={() => navigate("/runs")}
            className="proof-btn proof-btn-ghost"
          >
            <Play size={12} /> View Runs
          </button>
          <button
            onClick={() => navigate("/compare")}
            className="proof-btn proof-btn-primary"
          >
            <GitCompare size={12} /> Compare Runs
          </button>
        </div>
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "flex", flexDirection: "column", gap: 16,
        padding: "20px 24px 24px",
        minHeight: "100%", boxSizing: "border-box",
      }}
    >
      {/* ── Anomaly banner ─────────────────────────────────────── */}
      {(hasAlert || hasDegradation) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <AnomalyBanner
            hasAlert={hasAlert}
            hasDegradation={hasDegradation}
            regressions={kpis.regressions}
            degradedTiers={tierGroups
              .filter((t) => t.status !== "healthy")
              .map((t) => t.tier)
              .join(", ")}
            onInvestigate={() => navigate("/compare")}
          />
        </motion.div>
      )}

      {/* ── KPI cards ──────────────────────────────────────────── */}
      <section aria-label="Key metrics" style={{ marginBottom: 0 }}>
        <SectionHeader title="Signal" accent="var(--proof-blue)" />
        <motion.div
          variants={containerVariant}
          initial="hidden"
          animate="show"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
          }}
        >
          {[
            {
              label: "Pass Rate",
              value: kpis.passRate,
              suffix: "%",
              delta: totalDelta,
              deltaLabel: "vs prev run",
              spark: sparkData,
              accent: chartColor,
              icon: <Activity size={12} />,
              href: "/trends",
            },
            {
              label: "Total Runs",
              value: kpis.total,
              delta: sortedRuns.length >= 2 ? 1 : 0,
              deltaLabel: `${sortedRuns.length} total`,
              spark: sortedRuns.slice(0, 8).reverse().map(() => 1),
              accent: "var(--proof-blue)",
              icon: <Zap size={12} />,
              href: "/runs",
            },
            {
              label: "Failures",
              value: kpis.failedRuns,
              delta: failureDelta,
              deltaLabel: "vs prev run",
              spark: failureSparkData,
              accent: kpis.failedRuns > 0 ? "var(--proof-red)" : "var(--proof-green)",
              icon: <XCircle size={12} />,
              href: "/runs",
              invert: true,
            },
            {
              label: "Regressions",
              value: kpis.regressions,
              delta: regressionDelta,
              deltaLabel: "detected",
              spark: regressionSparkData,
              accent: kpis.regressions > 0 ? "var(--proof-red)" : "var(--proof-green)",
              icon: <AlertTriangle size={12} />,
              href: "/compare",
              invert: true,
            },
          ].map((card, i) => (
            <motion.div key={card.label} variants={itemVariant}>
              <HeroKpiCard
                label={card.label}
                value={card.value}
                suffix={card.suffix}
                delta={card.delta}
                deltaLabel={card.deltaLabel}
                sparkData={card.spark}
                accentColor={card.accent}
                icon={card.icon}
                onClick={() => navigate(card.href)}
                invertDelta={card.invert}
                delay={0}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Run ribbon ──────────────────────────────────────────── */}
      <section aria-label="Temporal context" style={{ marginBottom: 0 }}>
        <SectionHeader
          title="Timeline"
          accent="var(--proof-purple)"
          action={
            <button
              onClick={() => navigate("/runs")}
              style={{
                display: "flex", alignItems: "center", gap: 4, background: "transparent",
                border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                color: "var(--proof-text-muted)", padding: "3px 6px", borderRadius: "var(--proof-radius-sm)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)"; }}
            >
              All runs <ArrowRight size={11} />
            </button>
          }
        />
        <motion.div
          variants={containerVariant}
          initial="hidden"
          animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}
        >
          <motion.div variants={itemVariant}>
            <RunRibbonCard
              label="Latest Run"
              run={latestRun ?? undefined}
              icon={<Zap size={14} style={{ color: chartColor }} />}
              accent={chartColor}
              onClick={latestRun ? () => navigate(`/runs/${latestRun.id}`) : undefined}
              index={0}
            />
          </motion.div>
          <motion.div variants={itemVariant}>
            <RunRibbonCard
              label="Previous Run"
              run={prevRun ?? undefined}
              icon={<Clock size={14} style={{ color: "var(--proof-text-muted)" }} />}
              accent="var(--proof-border-strong)"
              onClick={prevRun ? () => navigate(`/runs/${prevRun.id}`) : undefined}
              index={0}
            />
          </motion.div>
          <motion.div variants={itemVariant}>
            <RunRibbonCard
              label="Upcoming"
              nextDue={nextScheduled?.nextDue ?? undefined}
              icon={<Calendar size={14} style={{ color: "var(--proof-blue)" }} />}
              accent="var(--proof-blue)"
              index={0}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Tier health cards ───────────────────────────────────── */}
      <section aria-label="Environment tiers" style={{ marginBottom: 0 }}>
        <SectionHeader
          title="Environments"
          accent="var(--proof-green)"
          badge={
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "1px 7px",
              borderRadius: "var(--proof-radius-full)",
              background: "var(--proof-subtle-bg)", border: "1px solid var(--proof-border)",
              color: "var(--proof-text-muted)",
            }}>
              QA · UAT · PROD
            </span>
          }
        />
        <motion.div
          variants={containerVariant}
          initial="hidden"
          animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}
        >
          {tierGroups.map((group) => (
            <motion.div key={group.tier} variants={itemVariant}>
              <TierCard
                group={group}
                onClick={() => navigate(`/runs?env=${group.tier}`)}
                index={0}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Pass rate trend ─────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        aria-label="Pass rate trend"
        style={{
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border)",
          borderRadius: "var(--proof-radius-xl)",
          boxShadow: "var(--proof-shadow-sm), var(--proof-shadow-inset)",
          display: "flex", flexDirection: "column", minHeight: 280,
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px 12px",
          borderBottom: "1px solid var(--proof-border)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TrendingUp size={14} style={{ color: chartColor }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>
              Pass Rate Trend
            </span>
            {kpis.regressions > 0 && (
              <span style={{
                padding: "2px 8px", borderRadius: "var(--proof-radius-full)",
                background: "var(--proof-red-bg)", border: "1px solid var(--proof-red-border)",
                fontSize: 10, fontWeight: 700, color: "var(--proof-red)",
              }}>
                {kpis.regressions} anomaly{kpis.regressions !== 1 ? "ies" : ""} detected
              </span>
            )}
            <span style={{
              padding: "2px 8px", borderRadius: "var(--proof-radius-full)",
              background: "var(--proof-subtle-bg)", border: "1px solid var(--proof-border)",
              fontSize: 10, fontWeight: 600, color: "var(--proof-text-muted)",
            }}>
              Last 14 days
            </span>
          </div>
          <button
            onClick={() => navigate("/trends")}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 600, color: "var(--proof-text-muted)",
              padding: "4px 8px", borderRadius: "var(--proof-radius-sm)",
              transition: "all var(--proof-transition)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)"; }}
          >
            Full trends <ArrowRight size={11} />
          </button>
        </div>

        {/* Chart */}
        <div style={{ flex: 1, minHeight: 0, padding: "16px 12px 8px" }}>
          {chartData.length === 0 ? (
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8,
              color: "var(--proof-text-muted)",
            }}>
              <Activity size={24} style={{ opacity: 0.4 }} />
              <div style={{ fontSize: 12, fontWeight: 500 }}>No data for selected filters</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor === "var(--proof-green)" ? "#00dc82" : chartColor === "var(--proof-yellow)" ? "#f59e0b" : "#ff4d6b"} stopOpacity={0.35} />
                    <stop offset="70%" stopColor={chartColor === "var(--proof-green)" ? "#00dc82" : chartColor === "var(--proof-yellow)" ? "#f59e0b" : "#ff4d6b"} stopOpacity={0} />
                  </linearGradient>
                  <filter id="lineGlow">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fontWeight: 500, fill: "var(--proof-text-muted)" } as React.SVGProps<SVGTextElement>}
                  tickLine={false} axisLine={false}
                  interval="preserveStartEnd" minTickGap={40}
                />
                <YAxis
                  domain={[
                    chartData.length > 0 
                      ? Math.max(0, Math.floor(((Math.min(...chartData.map((d) => d.passRate)) || 80) - 10) / 10) * 10)
                      : 0, 
                    100
                  ]}
                  tick={{ fontSize: 10, fontWeight: 500, fill: "var(--proof-text-muted)" } as React.SVGProps<SVGTextElement>}
                  tickLine={false} axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  width={36}
                />
                <ReferenceArea y1={0} y2={80} fill="rgba(255,77,107,0.04)" ifOverflow="extendDomain" />
                <ReferenceArea y1={80} y2={95} fill="rgba(245,158,11,0.04)" ifOverflow="extendDomain" />
                <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.4}
                  label={{ value: "80%", fontSize: 9, fontWeight: 700, fill: "#f59e0b", position: "insideTopRight", dx: -8, dy: 8 }}
                />
                <ReferenceLine y={95} stroke="#00dc82" strokeDasharray="6 3" strokeOpacity={0.5}
                  label={{ value: "Gate 95%", fontSize: 9, fontWeight: 700, fill: "#00dc82", position: "insideTopRight", dx: -8, dy: 8 }}
                />
                <Tooltip content={<ChartTip />} />
                <Area
                  type="monotone" dataKey="passRate"
                  stroke={chartColor} strokeWidth={2}
                  fill="url(#prGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor === "var(--proof-green)" ? "#00dc82" : chartColor === "var(--proof-yellow)" ? "#f59e0b" : "#ff4d6b", stroke: "var(--proof-surface)", strokeWidth: 2 }}
                  isAnimationActive animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "8px 18px", borderTop: "1px solid var(--proof-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 2, borderRadius: 1, background: "#00dc82" }} />
              <span style={{ fontSize: 10, color: "var(--proof-text-muted)", fontWeight: 500 }}>Promotion gate 95%</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 2, borderRadius: 1, background: "#f59e0b" }} />
              <span style={{ fontSize: 10, color: "var(--proof-text-muted)", fontWeight: 500 }}>Warning 80%</span>
            </div>
          </div>
          <span style={{ fontSize: 10, color: "var(--proof-text-muted)", fontWeight: 500 }}>
            Last synced: {lastSynced}
          </span>
        </div>
      </motion.section>
    </motion.main>
  );
}

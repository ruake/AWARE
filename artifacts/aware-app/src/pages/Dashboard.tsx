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
} from "lucide-react";
import { AnomalyBanner, HeroKpiCard } from "@/components/aware";
import { TierCard } from "@/components/aware/TierCard";
import type { TierGroup } from "@/components/aware/TierCard";
import { RunRibbonCard } from "@/components/aware/RunRibbonCard";
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

/* ── Chart tooltip ───────────────────────────────────────────────── */
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
  const runId = payload[0]?.payload?.runId;
  const c = v >= 95 ? "var(--proof-green)" : v >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
  return (
    <div
      style={{
        background: "var(--proof-surface-3)",
        border: "1px solid var(--proof-border-strong)",
        borderRadius: "var(--proof-radius-lg)",
        padding: "10px 14px",
        boxShadow: "var(--proof-shadow-md)",
        fontSize: 12,
        animation: "scale-in 0.12s ease-out both",
        minWidth: 140,
      }}
    >
      <div
        style={{
          color: "var(--proof-text-muted)",
          marginBottom: 4,
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.4px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 22,
          color: c,
          fontFamily: "var(--font-mono)",
          letterSpacing: "-1px",
          lineHeight: 1,
        }}
      >
        {v}%
      </div>
      {runId && (
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            color: "var(--proof-blue-bright)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {runId}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD PAGE — Mission Control
   ══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [, navigate] = useLocation();
  const init = useDataInit();
  const filteredRuns = useFilteredRuns();
  const envHealth = useEnvHealth();
  const kpis = useDashboardKPIs();
  const chartData = usePassRateChart();
  const scheduler = useSchedulerStatus();

  // Sort runs newest-first for the ribbon
  const sortedRuns = React.useMemo(
    () =>
      [...filteredRuns].sort(
        (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
      ),
    [filteredRuns],
  );

  const latestRun = sortedRuns[0];
  const prevRun = sortedRuns[1];

  // Find the earliest nextDue across all scheduler suites
  const nextScheduled = React.useMemo(() => {
    const dues = scheduler.suites
      .filter((s) => s.nextDue)
      .map((s) => ({ suite: s.name, nextDue: s.nextDue! }));
    dues.sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime());
    return dues[0] ?? null;
  }, [scheduler]);

  // Group envs into 3 tiers
  const tierGroups = React.useMemo((): TierGroup[] => {
    const TIERS = [
      { key: "QA" as const, prefixes: ["qa-", "QA/", "QA "] },
      { key: "UAT" as const, prefixes: ["uat-", "UAT/", "UAT "] },
      { key: "PROD" as const, prefixes: ["prod-", "PROD/", "PROD "] },
    ];
    return TIERS.map(({ key, prefixes }) => {
      const envs = envHealth.filter(
        (e) =>
          prefixes.some((p) => e.id.toLowerCase().startsWith(p.toLowerCase().replace(" ", "-"))) ||
          e.label.toUpperCase().startsWith(key),
      );
      if (envs.length === 0)
        return { tier: key, envs: [], avgPassRate: 0, status: "critical" as const };
      const avg = Math.round(envs.reduce((s, e) => s + e.passRate, 0) / envs.length);
      const min = Math.min(...envs.map((e) => e.passRate));
      const status = min >= 95 ? "healthy" : min >= 80 ? "degraded" : "critical";
      return { tier: key, envs, avgPassRate: avg, status };
    });
  }, [envHealth]);

  // Spark data: last 7 days of daily aggregated pass rates
  const sparkData = React.useMemo(() => {
    const days = 7;
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - (days - 1 - i));
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayRuns = filteredRuns.filter((r) => {
        const t = new Date(r.started).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      });
      return dayRuns.length > 0
        ? Math.round(dayRuns.reduce((s, r) => s + r.passPct, 0) / dayRuns.length)
        : 0;
    });
  }, [filteredRuns]);

  // Per-card spark data: differentiated per KPI
  const runCountSparkData = React.useMemo(() => {
    const days = 7;
    const now = new Date();
    let cumulative = 0;
    return Array.from({ length: days }, (_, i) => {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - (days - 1 - i));
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayRuns = filteredRuns.filter((r) => {
        const t = new Date(r.started).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      });
      // eslint-disable-next-line react-hooks/immutability
      cumulative += dayRuns.length;
      return cumulative;
    });
  }, [filteredRuns]);

  const failureSparkData = React.useMemo(() => {
    const days = 7;
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - (days - 1 - i));
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayRuns = filteredRuns.filter((r) => {
        const t = new Date(r.started).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      });
      return dayRuns.reduce((s, r) => s + r.failures, 0);
    });
  }, [filteredRuns]);

  // Regressions sparkline: per-day regression count based on filtered runs delta
  const regressionSparkData = React.useMemo(() => {
    const days = 7;
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - (days - 1 - i));
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayRuns = filteredRuns.filter((r) => {
        const t = new Date(r.started).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      });
      return dayRuns.reduce((s, r) => s + (r.failures ?? 0), 0);
    });
  }, [filteredRuns]);

  // Delta calculations
  const totalDelta = React.useMemo(() => {
    if (sortedRuns.length < 2) return 0;
    const latest = sortedRuns[0];
    const previous = sortedRuns[1];
    return latest.passPct - previous.passPct;
  }, [sortedRuns]);

  const failureDelta = React.useMemo(() => {
    if (sortedRuns.length < 2) return 0;
    return (latestRun?.failures ?? 0) - (prevRun?.failures ?? 0);
  }, [sortedRuns, latestRun, prevRun]);

  const regressionDelta = kpis.regressions;

  const hasAlert = kpis.regressions > 0 || tierGroups.some((t) => t.status === "critical");
  const hasDegradation = !hasAlert && tierGroups.some((t) => t.status === "degraded");
  const chartColor =
    kpis.passRate >= 95
      ? "var(--proof-green)"
      : kpis.passRate >= 80
        ? "var(--proof-yellow)"
        : "var(--proof-red)";

  // ── Hero KPI row ───────────────────────────────────────
  const lastSynced = React.useMemo(() => new Date().toLocaleTimeString(), []);

  if (filteredRuns.length === 0 || init.loading) {
    return (
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "12px 24px 16px",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
           <div className="proof-skeleton" style={{ width: 300, height: 24, borderRadius: 4 }} />
           <div className="proof-skeleton" style={{ width: 150, height: 12, borderRadius: 4 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="proof-skeleton" style={{ height: 100, borderRadius: "var(--proof-radius-lg)" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="proof-skeleton" style={{ height: 64, borderRadius: "var(--proof-radius-lg)" }} />
          ))}
        </div>
        {!init.loading && filteredRuns.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 20,
              padding: "48px 24px",
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            <div style={{ display: "flex", gap: 24, marginBottom: 8 }}>
              {[Activity, Zap, GitCompare].map((Icon, i) => (
                <div
                  key={i}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "var(--proof-blue-bg)",
                    border: "1px solid var(--proof-blue-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={18} style={{ color: "var(--proof-blue)" }} />
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <h2
                style={{ fontSize: 20, fontWeight: 700, color: "var(--proof-text)", margin: "0 0 6px" }}
              >
                No test runs yet
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--proof-text-secondary)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Results from your Akamai CDN regression suite will appear here once a test run
                completes.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                onClick={() => navigate("/start")}
                className="proof-button-primary"
                style={{ gap: 5 }}
              >
                <Play size={12} /> Start a Run
              </button>
              <button onClick={() => navigate("/compare")} className="proof-button" style={{ gap: 5 }}>
                <GitCompare size={12} /> Compare Runs
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "12px 24px 16px",
        height: "100%",
        minHeight: 0,
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      {/* ── Anomaly Banner ───────────────────────────────────── */}
      {(hasAlert || hasDegradation) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnomalyBanner
            hasAlert={hasAlert}
            hasDegradation={hasDegradation}
            regressions={kpis.regressions}
            degradedTiers={tierGroups
              .filter((t) => t.status === "degraded")
              .map((t) => t.tier)
              .join(", ")}
            onInvestigate={() => navigate("/compare")}
          />
        </motion.div>
      )}

      {/* ── Hero KPI row ─────────────────────────────────────── */}
      <motion.section
        aria-label="Key metrics"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        <motion.div variants={itemVariants}>
          <HeroKpiCard
            label="Pass Rate"
            value={kpis.passRate}
            suffix="%"
            delta={totalDelta}
            deltaLabel="vs prev run"
            sparkData={sparkData}
            accentColor={chartColor}
            icon={<Activity size={12} />}
            onClick={() => navigate("/trends")}
            delay={0}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <HeroKpiCard
            label="Total Runs"
            value={kpis.total}
            delta={sortedRuns.length >= 2 ? 1 : 0}
            deltaLabel={`${sortedRuns.length} total`}
            sparkData={runCountSparkData}
            accentColor="var(--proof-blue)"
            icon={<Zap size={12} />}
            onClick={() => navigate("/runs")}
            delay={0}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <HeroKpiCard
            label="Failures"
            value={kpis.failedRuns}
            delta={failureDelta}
            deltaLabel="vs prev run"
            sparkData={failureSparkData}
            accentColor={kpis.failedRuns > 0 ? "var(--proof-red)" : "var(--proof-green)"}
            icon={<XCircle size={12} />}
            onClick={() => navigate("/runs")}
            invertDelta
            delay={0}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <HeroKpiCard
            label="Regressions"
            value={kpis.regressions}
            delta={regressionDelta}
            deltaLabel="detected"
            sparkData={regressionSparkData}
            accentColor={kpis.regressions > 0 ? "var(--proof-red)" : "var(--proof-green)"}
            icon={<AlertTriangle size={12} />}
            onClick={() => navigate("/compare")}
            invertDelta
            delay={0}
          />
        </motion.div>
      </motion.section>

      {/* ── Run ribbon ────────────────────────────────────────── */}
      <motion.section
        aria-label="Temporal context"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        transition={{ delayChildren: 0.04 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}
      >
        <motion.div variants={itemVariants}>
          <RunRibbonCard
            label="Latest Run"
            run={latestRun}
            icon={<Zap size={14} style={{ color: chartColor }} />}
            accent={chartColor}
            onClick={latestRun ? () => navigate(`/runs/${latestRun.id}`) : undefined}
            index={0}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <RunRibbonCard
            label="Previous Run"
            run={prevRun}
            icon={<Clock size={14} style={{ color: "var(--proof-text-muted)" }} />}
            accent="var(--proof-border-strong)"
            onClick={prevRun ? () => navigate(`/runs/${prevRun.id}`) : undefined}
            index={0}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <RunRibbonCard
            label="Upcoming"
            nextDue={nextScheduled?.nextDue}
            icon={<Calendar size={14} style={{ color: "var(--proof-blue)" }} />}
            accent="var(--proof-blue)"
            index={0}
          />
        </motion.div>
      </motion.section>

      {/* ── Tier cards (horizontal) ───────────────────────────── */}
      <motion.section
        aria-label="Environment tiers"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        transition={{ delayChildren: 0.08 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
        }}
      >
        {tierGroups.map((group, i) => (
          <motion.div key={group.tier} variants={itemVariants}>
            <TierCard
              group={group}
              onClick={() => navigate(`/runs?env=${group.tier}`)}
              index={0}
            />
          </motion.div>
        ))}
      </motion.section>

      {/* ── Trend chart (full width) ────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="proof-section-card"
        style={{ display: "flex", flexDirection: "column", minHeight: 300 }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--proof-border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 3,
                height: 14,
                borderRadius: 99,
                background: chartColor,
                flexShrink: 0,
              }}
            />
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>Pass Rate Trend</div>
            {kpis.regressions > 0 && (
              <span className="proof-badge" style={{ background: 'var(--proof-red-bg)', color: 'var(--proof-red)', border: '1px solid var(--proof-red-border)', fontSize: 10, fontWeight: 700 }}>
                {kpis.regressions} {kpis.regressions === 1 ? 'anomaly' : 'anomalies'} detected
              </span>
            )}
            <span className="proof-badge proof-badge-neutral" style={{ fontSize: 10, fontWeight: 600 }}>
              Last 14 days
            </span>
          </div>
          <button
            onClick={() => navigate("/trends")}
            className="proof-button-ghost"
            style={{ fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
          >
            Full trends <ArrowRight size={12} />
          </button>
        </div>

        {/* Chart area */}
        <div
          className="proof-chart-area"
          style={{ flex: 1, minHeight: 0, padding: "16px 12px 12px", position: 'relative' }}
        >
          {chartData.length === 0 ? (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--proof-text-muted)'
            }}>
              <Activity size={24} style={{ opacity: 0.5 }} />
              <div style={{ fontSize: 12, fontWeight: 500 }}>No run data for selected filters</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                    <stop offset="40%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dangerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--proof-red)" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="var(--proof-red)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="warnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--proof-yellow)" stopOpacity={0.06} />
                    <stop offset="100%" stopColor="var(--proof-yellow)" stopOpacity={0} />
                  </linearGradient>
                  <filter id="lineGlow" x="-20%" y="-30%" width="140%" height="160%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--proof-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={
                    {
                      fontSize: 10,
                      fontWeight: 500,
                      fill: "var(--proof-text-muted)",
                    } as React.SVGProps<SVGTextElement>
                  }
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  domain={[
                    Math.max(
                      0,
                      Math.floor(((Math.min(...chartData.map((d) => d.passRate)) || 80) - 10) / 10) * 10,
                    ),
                    100,
                  ]}
                  tick={
                    {
                      fontSize: 10,
                      fontWeight: 500,
                      fill: "var(--proof-text-muted)",
                    } as React.SVGProps<SVGTextElement>
                  }
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                {/* Reference Areas with visual labels */}
                <ReferenceArea
                  y1={0}
                  y2={80}
                  fill="url(#dangerGrad)"
                  ifOverflow="extendDomain"
                />
                <ReferenceArea
                  y1={80}
                  y2={95}
                  fill="url(#warnGrad)"
                  ifOverflow="extendDomain"
                />
                
                {/* Threshold lines */}
                <ReferenceLine
                  y={80}
                  stroke="var(--proof-yellow)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{
                    value: "MIN 80%",
                    fontSize: 9,
                    fontWeight: 800,
                    fill: "var(--proof-yellow)",
                    position: "insideTopRight",
                    dx: -10,
                    dy: 10
                  }}
                />
                <ReferenceLine
                  y={95}
                  stroke="var(--proof-green)"
                  strokeDasharray="6 3"
                  strokeOpacity={0.7}
                  label={{
                    value: "GATE 95%",
                    fontSize: 9,
                    fontWeight: 800,
                    fill: "var(--proof-green)",
                    position: "insideTopRight",
                    dx: -10,
                    dy: 10
                  }}
                />

                <Tooltip content={<ChartTip />} />
                <Area
                  type="monotone"
                  dataKey="passRate"
                  stroke={chartColor}
                  strokeWidth={2.5}
                  fill="url(#prGrad)"
                  dot={false}
                  filter="url(#lineGlow)"
                  activeDot={{
                    r: 5,
                    fill: chartColor,
                    stroke: "var(--proof-surface)",
                    strokeWidth: 2,
                  }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Footer */}
        <div style={{ padding: "8px 16px", borderTop: "1px solid var(--proof-border)", display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 10, color: "var(--proof-text-muted)", fontWeight: 500 }}>
            Last synced: {lastSynced}
          </span>
        </div>
      </motion.section>
    </main>
  );
}

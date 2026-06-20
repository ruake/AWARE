import React from "react";
import { useLocation } from "wouter";
import {
  useFilteredRuns,
  useEnvHealth,
  useDashboardKPIs,
  usePassRateChart,
  useSchedulerStatus,
} from "@/lib/hooks/useData";
import {
  Activity,
  Zap,
  Clock,
  Calendar,
  Play,
  GitCompare,
  History,
  Bot,
  XCircle,
  AlertTriangle,
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

  // Regressions are computed from diff rows, not per-run — show flat sparkline
  const regressionSparkData = React.useMemo(
    () => Array(7).fill(kpis.regressions > 0 ? 1 : 0),
    [kpis.regressions],
  );

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

  if (filteredRuns.length === 0) {
    return (
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 20,
          padding: "48px 24px",
          maxWidth: 520,
          margin: "0 auto",
          animation: "page-enter 0.22s ease-out both",
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
                animation: `card-enter 0.3s cubic-bezier(0.2,0,0,1) ${i * 80}ms both`,
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
      </main>
    );
  }

  return (
    <main
      style={{
        display: "grid",
        gridTemplateRows: `${hasAlert || hasDegradation ? "auto " : ""}auto auto auto 1fr`,
        gap: 12,
        padding: "12px 24px 16px",
        height: "100%",
        minHeight: 0,
        animation: "page-enter 0.22s ease-out both",
        boxSizing: "border-box",
      }}
    >
      <h1 className="sr-only">Dashboard</h1>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
          {!hasAlert && !hasDegradation && (
            <nav aria-label="Quick actions" style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => navigate("/start")}
                className="proof-button-primary proof-button-sm"
                style={{ gap: 4 }}
              >
                <Play size={11} /> Start Run
              </button>
              <button
                onClick={() => navigate("/compare")}
                className="proof-button proof-button-sm"
                style={{ gap: 4 }}
              >
                <GitCompare size={11} /> Compare
              </button>
              <button
                onClick={() => navigate("/runs")}
                className="proof-button-ghost proof-button-sm"
                style={{ gap: 4 }}
              >
                <History size={11} /> All Runs
              </button>
              <button
                onClick={() => navigate("/copilot")}
                className="proof-button-ghost proof-button-sm"
                style={{ gap: 4 }}
              >
                <Bot size={11} /> Copilot
              </button>
            </nav>
          )}
        </div>
        <span style={{ fontSize: 10, color: "var(--proof-text-muted)", whiteSpace: "nowrap" }}>
          Updated{" "}
          {latestRun
            ? new Date(latestRun.started).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </span>
      </div>

      {/* ── Hero KPI row ─────────────────────────────────────── */}
      <section
        aria-label="Key metrics"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
        }}
      >
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
        <HeroKpiCard
          label="Total Runs"
          value={kpis.total}
          delta={sortedRuns.length >= 2 ? 1 : 0}
          deltaLabel={`${sortedRuns.length} total`}
          sparkData={runCountSparkData}
          accentColor="var(--proof-blue)"
          icon={<Zap size={12} />}
          onClick={() => navigate("/runs")}
          delay={60}
        />
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
          delay={120}
        />
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
          delay={180}
        />
      </section>

      {/* ── Run ribbon (temporal context — above tiers) ──────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <RunRibbonCard
          label="Latest Run"
          run={latestRun}
          icon={<Zap size={14} style={{ color: chartColor }} />}
          accent={chartColor}
          onClick={latestRun ? () => navigate(`/runs/${latestRun.id}`) : undefined}
          index={0}
        />
        <RunRibbonCard
          label="Previous Run"
          run={prevRun}
          icon={<Clock size={14} style={{ color: "var(--proof-text-muted)" }} />}
          accent="var(--proof-border-strong)"
          onClick={prevRun ? () => navigate(`/runs/${prevRun.id}`) : undefined}
          index={1}
        />
        <RunRibbonCard
          label="Next Scheduled"
          nextDue={nextScheduled?.nextDue}
          icon={<Calendar size={14} style={{ color: "var(--proof-blue)" }} />}
          accent="var(--proof-blue)"
          index={2}
        />
      </div>

      {/* ── Tier cards (horizontal) ───────────────────────────── */}
      <section
        aria-label="Environment tiers"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
        }}
      >
        {tierGroups.map((group, i) => (
          <TierCard
            key={group.tier}
            group={group}
            onClick={() => navigate(`/runs?env=${group.tier}`)}
            index={i}
          />
        ))}
      </section>

      {/* ── Trend chart (full width) ────────────────────────── */}
      <div
        className="proof-section-card"
        style={{ display: "flex", flexDirection: "column", minHeight: 200 }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderBottom: "1px solid var(--proof-border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 3,
                height: 13,
                borderRadius: 99,
                background: chartColor,
                flexShrink: 0,
              }}
            />
            <span className="proof-section-title">Pass Rate Trend</span>
            <span className="proof-badge proof-badge-neutral" style={{ fontSize: 10 }}>
              14 days
            </span>
          </div>
          <button
            onClick={() => navigate("/trends")}
            className="proof-button-ghost"
            style={{ fontSize: 11 }}
          >
            Full trends →
          </button>
        </div>

        {/* Chart fills remaining height */}
        <div
          className="proof-chart-area"
          style={{ flex: 1, minHeight: 0, padding: "12px 8px 8px" }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="40%" stopColor={chartColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
                </linearGradient>
                <filter id="lineGlow" x="-20%" y="-30%" width="140%" height="160%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="4 6" stroke="var(--proof-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={
                  {
                    fontSize: 10,
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
                    Math.floor(((Math.min(...chartData.map((d) => d.passRate)) || 80) - 5) / 5) * 5,
                  ),
                  100,
                ]}
                tick={
                  {
                    fontSize: 10,
                    fill: "var(--proof-text-muted)",
                  } as React.SVGProps<SVGTextElement>
                }
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              {/* Danger zone — visible */}
              <ReferenceArea
                y1={0}
                y2={80}
                fill="var(--proof-red)"
                fillOpacity={0.07}
                ifOverflow="extendDomain"
              />
              <ReferenceArea
                y1={80}
                y2={95}
                fill="var(--proof-yellow)"
                fillOpacity={0.04}
                ifOverflow="extendDomain"
              />
              {/* Thresholds — visible labels */}
              <ReferenceLine
                y={80}
                stroke="var(--proof-yellow)"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{
                  value: "80%",
                  fontSize: 10,
                  fill: "var(--proof-yellow)",
                  opacity: 0.7,
                  position: "insideTopRight",
                }}
              />
              <ReferenceLine
                y={95}
                stroke="var(--proof-green)"
                strokeDasharray="6 3"
                strokeOpacity={0.6}
                label={{
                  value: "95% gate",
                  fontSize: 10,
                  fill: "var(--proof-green)",
                  opacity: 0.85,
                  position: "insideTopRight",
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
                  strokeWidth: 2.5,
                }}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
                animationBegin={200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}

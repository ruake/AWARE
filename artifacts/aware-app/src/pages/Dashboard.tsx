import React, { useMemo } from "react";
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
import { Activity, Zap, Clock, Calendar, Play, GitCompare, XCircle, AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import { AnomalyBanner, HeroKpiCard, TierCard, RunRibbonCard, KpiCard, TrendChart, StatsDashboard, CTAStatCard } from "@/components/aware";
import type { TierGroup } from "@/components/aware/TierCard";

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
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
    (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime()
  );

  const tierMap = new Map<string, TierGroup>();
  for (const env of envHealthData) {
    const rawTier = env.tier.toUpperCase();
    const tier = rawTier === "QA" ? "QA" : rawTier === "UAT" ? "UAT" : "PROD";
    if (!tierMap.has(tier)) {
      tierMap.set(tier, { tier, envs: [], avgPassRate: env.passRate, status: env.status });
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
    const statusPriority = { critical: 2, degraded: 1, healthy: 0 };
    if ((statusPriority[env.status] ?? 0) > (statusPriority[group.status] ?? 0)) {
      group.status = env.status;
    }
    group.avgPassRate = Math.round(group.envs.reduce((s, e) => s + e.passRate, 0) / group.envs.length);
  }
  const tierGroups = [...tierMap.values()];

  const hasAlert = kpis.regressions > 0;
  const hasDegradation = tierGroups.some((t) => t.status !== "healthy");
  const chartColor = kpis.passRate >= 95 ? "var(--proof-green)" : kpis.passRate >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";

  if (dataState.loading) {
    return (
      <main className="flex h-full flex-col items-center justify-center gap-4 p-10">
        <Activity size={32} className="animate-spin text-[var(--proof-blue)]" />
        <div className="text-sm font-semibold text-[var(--proof-text-secondary)]">Loading command center...</div>
      </main>
    );
  }

  if (dataState.error) {
    return (
      <main className="flex h-full flex-col items-center justify-center gap-4 p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--proof-red-bg)] border border-[var(--proof-red-border)]">
          <XCircle size={22} className="text-[var(--proof-red)]" />
        </div>
        <div className="text-center">
          <div className="mb-2 text-base font-bold text-[var(--proof-text)]">System Failure</div>
          <div className="max-w-[400px] text-sm text-[var(--proof-text-secondary)] leading-relaxed">Could not establish connection to the edge nodes. Check network relays and retry.</div>
        </div>
        <button onClick={() => window.location.reload()} className="proof-btn proof-btn-primary">Retry Connection</button>
      </main>
    );
  }

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-full flex-col gap-6 p-6">
      {(hasAlert || hasDegradation) && (
        <AnomalyBanner
          hasAlert={hasAlert}
          hasDegradation={hasDegradation}
          regressions={kpis.regressions}
          degradedTiers={tierGroups.filter((t) => t.status !== "healthy").map((t) => t.tier).join(", ")}
          onInvestigate={() => navigate("/compare")}
        />
      )}

      {/* Hero KPIs - Horizontal Strip */}
      <motion.section variants={containerVariant} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroKpiCard label="Pass Rate" value={kpis.passRate} suffix="%" delta={kpis.passTrend} accentColor={chartColor} icon={<Activity />} onClick={() => navigate("/trends")} />
        <HeroKpiCard label="Total Runs" value={kpis.total} delta={1} deltaLabel="new" accentColor="var(--proof-blue)" icon={<Zap />} onClick={() => navigate("/runs")} />
        <HeroKpiCard label="Failures" value={kpis.failedRuns} delta={sortedRuns.length >= 2 ? (sortedRuns[0]?.failures ?? 0) - (sortedRuns[1]?.failures ?? 0) : 0} invertDelta accentColor={kpis.failedRuns > 0 ? "var(--proof-red)" : "var(--proof-green)"} icon={<XCircle />} onClick={() => navigate("/runs")} />
        <HeroKpiCard label="Regressions" value={kpis.regressions} delta={kpis.regressions} invertDelta accentColor={kpis.regressions > 0 ? "var(--proof-red)" : "var(--proof-green)"} icon={<AlertTriangle />} onClick={() => navigate("/compare")} />
      </motion.section>

      {/* Tier Cards - Visually Dominant 3-Column */}
      <motion.section variants={containerVariant} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tierGroups.map((group, i) => (
          <TierCard key={group.tier} group={group} onClick={() => navigate(`/runs?env=${group.tier}`)} index={i} />
        ))}
      </motion.section>

      {/* Trend Chart Area */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full">
        <TrendChart passRate={kpis.passRate} flakinessScore={12} avgDuration={1450} history={chartData.map((d, i) => ({ runId: `R-${i}`, status: d.passRate > 80 ? "PASS" : "FAIL", env: "QA", passRate: d.passRate, date: d.label, duration: 1000 }))} />
      </motion.section>
    </motion.main>
  );
}

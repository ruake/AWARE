import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useFilteredRuns,
  useEnvHealth,
  useDashboardKPIs,
  usePassRateChart,
  useDataInit,
} from "@/lib/hooks/useData";
import { Activity, Zap, XCircle, AlertTriangle } from "lucide-react";
import { AnomalyBanner, HeroKpiCard, TierCard, TrendChart } from "@/components/aware";
import type { TierGroup } from "@/components/aware/TierCard";

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
      <main style={{ display: "flex", height: "100%", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
        <Activity size={32} style={{ color: "var(--proof-blue)", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--proof-text-secondary)" }}>Loading command center...</div>
      </main>
    );
  }

  if (dataState.error) {
    return (
      <main style={{ display: "flex", height: "100%", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
        <div style={{ display: "flex", height: 48, width: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, background: "var(--proof-red-bg)", border: "1px solid var(--proof-red-border)" }}>
          <XCircle size={22} style={{ color: "var(--proof-red)" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 8, fontSize: 16, fontWeight: 700, color: "var(--proof-text)" }}>System Failure</div>
          <div style={{ maxWidth: 400, fontSize: 14, color: "var(--proof-text-secondary)", lineHeight: 1.6 }}>Could not establish connection to the edge nodes. Check network relays and retry.</div>
        </div>
        <button onClick={() => window.location.reload()} className="proof-btn proof-btn-primary">Retry Connection</button>
      </main>
    );
  }

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 24, padding: 24, minHeight: "100%" }}>
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
      <motion.section variants={containerVariant} initial="hidden" animate="show" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <HeroKpiCard label="Pass Rate" value={kpis.passRate} suffix="%" delta={kpis.passTrend} accentColor={chartColor} icon={<Activity />} onClick={() => navigate("/trends")} />
        <HeroKpiCard label="Total Runs" value={kpis.total} delta={1} deltaLabel="new" accentColor="var(--proof-blue)" icon={<Zap />} onClick={() => navigate("/runs")} />
        <HeroKpiCard label="Failures" value={kpis.failedRuns} delta={sortedRuns.length >= 2 ? (sortedRuns[0]?.failures ?? 0) - (sortedRuns[1]?.failures ?? 0) : 0} invertDelta accentColor={kpis.failedRuns > 0 ? "var(--proof-red)" : "var(--proof-green)"} icon={<XCircle />} onClick={() => navigate("/runs")} />
        <HeroKpiCard label="Regressions" value={kpis.regressions} delta={kpis.regressions} invertDelta accentColor={kpis.regressions > 0 ? "var(--proof-red)" : "var(--proof-green)"} icon={<AlertTriangle />} onClick={() => navigate("/compare")} />
      </motion.section>

      {/* Tier Cards - Visually Dominant 3-Column */}
      <motion.section variants={containerVariant} initial="hidden" animate="show" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {tierGroups.map((group, i) => (
          <TierCard key={group.tier} group={group} onClick={() => navigate(`/runs?env=${group.tier}`)} index={i} />
        ))}
      </motion.section>

      {/* Trend Chart Area */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ width: "100%" }}>
        <TrendChart passRate={kpis.passRate} flakinessScore={12} avgDuration={1450} history={chartData.map((d, i) => ({ runId: `R-${i}`, status: d.passRate > 80 ? "PASS" : "FAIL", env: "QA", passRate: d.passRate, date: d.label, duration: 1000 }))} />
      </motion.section>
    </motion.main>
  );
}

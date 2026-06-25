import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useFilteredRuns,
  useEnvHealth,
  useDashboardKPIs,
  usePassRateChart,
  useDataInit,
} from "@/lib/hooks/useData";
import { Activity, Zap, XCircle, AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import { AnomalyBanner, HeroKpiCard, TierCard, TrendChart, SkeletonCard, SkeletonChart } from "@/components/aware";
import type { TierGroup } from "@/components/aware/TierCard";

const containerVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
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
      <main style={{ display: "flex", flexDirection: "column", gap: 28, padding: 28, minHeight: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
        <SkeletonChart />
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
    <motion.main 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 28, 
        padding: 28, 
        minHeight: "100%",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Immersive Page Background Overlay */}
      <div style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        right: 0, 
        height: "40%", 
        background: "linear-gradient(180deg, rgba(0, 196, 255, 0.03) 0%, transparent 100%)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {(hasAlert || hasDegradation) && (
        <div style={{ zIndex: 10 }}>
          <AnomalyBanner
            hasAlert={hasAlert}
            hasDegradation={hasDegradation}
            regressions={kpis.regressions}
            degradedTiers={tierGroups.filter((t) => t.status !== "healthy").map((t) => t.tier).join(", ")}
            onInvestigate={() => navigate("/compare")}
          />
        </div>
      )}

      {/* Hero KPIs Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(9, 13, 20, 0.4)", backdropFilter: "blur(8px)", borderRadius: 8, border: "1px solid var(--proof-border-light)", width: "fit-content" }}>
          <div className="proof-live-dot" />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "var(--proof-text-secondary)" }}>SYSTEM STATUS</span>
        </div>
        
        <motion.section 
          variants={containerVariant} 
          initial="hidden" 
          animate="show" 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
            gap: 20 
          }}
        >
          <HeroKpiCard label="Pass Rate" value={kpis.passRate} suffix="%" delta={kpis.passTrend} accentColor={chartColor} icon={<Activity />} onClick={() => navigate("/trends")} />
          <HeroKpiCard label="Total Runs" value={kpis.total} delta={1} deltaLabel="new" accentColor="var(--proof-blue)" icon={<Zap />} onClick={() => navigate("/runs")} />
          <HeroKpiCard label="Failures" value={kpis.failedRuns} delta={sortedRuns.length >= 2 ? (sortedRuns[0]?.failures ?? 0) - (sortedRuns[1]?.failures ?? 0) : 0} invertDelta accentColor={kpis.failedRuns > 0 ? "var(--proof-red)" : "var(--proof-green)"} icon={<XCircle />} onClick={() => navigate("/runs?status=FAIL")} />
          <HeroKpiCard label="Regressions" value={kpis.regressions} delta={kpis.regressions} invertDelta accentColor={kpis.regressions > 0 ? "var(--proof-red)" : "var(--proof-green)"} icon={<AlertTriangle />} onClick={() => navigate("/compare")} />
        </motion.section>
      </div>

      {/* Tier Cards Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ShieldCheck size={20} style={{ color: "var(--proof-blue)" }} />
            <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", color: "var(--proof-text)" }}>ENVIRONMENT HEALTH</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--proof-text-muted)", fontSize: 12 }}>
            <Clock size={14} />
            <span>Last checked: just now</span>
          </div>
        </div>

        <motion.section 
          variants={containerVariant} 
          initial="hidden" 
          animate="show" 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
            gap: 28 
          }}
        >
          {tierGroups.map((group, i) => (
            <TierCard key={group.tier} group={group} onClick={() => navigate(`/runs?env=${group.tier}`)} index={i} />
          ))}
        </motion.section>
      </div>

      {/* Trend Chart Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, zIndex: 10, borderTop: "1px solid var(--proof-border-light)", paddingTop: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Activity size={20} style={{ color: "var(--proof-blue)" }} />
          <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", color: "var(--proof-text)" }}>PASS RATE TIMELINE</h2>
          <span style={{ fontSize: 11, color: "var(--proof-text-muted)", fontWeight: 400 }}>(Aggregated across all active environments)</span>
        </div>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ width: "100%" }}>
          <TrendChart passRate={kpis.passRate} flakinessScore={12} avgDuration={1450} history={chartData.map((d, i) => ({ runId: `R-${i}`, status: d.passRate > 80 ? "PASS" : "FAIL", env: "QA", passRate: d.passRate, date: d.label, duration: 1000 }))} />
        </motion.section>
      </div>
    </motion.main>
  );
}

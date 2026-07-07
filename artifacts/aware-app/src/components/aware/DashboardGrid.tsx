import React from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Activity, Zap, XCircle, AlertTriangle, GripVertical } from "lucide-react";
import {
  useFilteredRuns,
  useEnvHealth,
  useDashboardKPIs,
  usePassRateChart,
  useDataInit,
  useRuns,
} from "@/lib/hooks/useData";
import { AnomalyBanner, HeroKpiCard, TierCard, TrendChart, PassRateHeatmap } from "@/components/aware";
import { getRuns } from "@/lib/runs";
import { getEnvConfigs } from "@/lib/envConfig";
import type { WidgetConfig, WidgetType } from "@/lib/dashboardConfig";
import { WIDGET_META } from "@/lib/dashboardConfig";
import type { TierGroup } from "@/components/aware/TierCard";

interface DashboardGridProps {
  widgets: WidgetConfig[];
  onDragEnd: (widgets: WidgetConfig[]) => void;
}

const SIZE_CLASSES: Record<string, { gridColumn: string; minHeight: number }> = {
  small: { gridColumn: "span 1", minHeight: 160 },
  medium: { gridColumn: "span 2", minHeight: 220 },
  large: { gridColumn: "span 3", minHeight: 300 },
  full: { gridColumn: "1 / -1", minHeight: 200 },
};

function WidgetWrapper({ widget, children, onDragStart, onDragOver, onDrop }: {
  widget: WidgetConfig;
  children: React.ReactNode;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const size = SIZE_CLASSES[widget.size] ?? SIZE_CLASSES.medium;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      data-widget-id={widget.id}
      style={{
        gridColumn: size.gridColumn,
        minHeight: size.minHeight,
        position: "relative",
      }}
    >
      <div
        className="glass-panel"
        style={{
          height: "100%",
          borderRadius: 12,
          border: "1px solid var(--proof-border)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderBottom: "1px solid var(--proof-border-light)",
            cursor: "grab",
            userSelect: "none",
            background: "rgba(0,0,0,0.2)",
          }}
          onMouseDown={e => { const t = e.currentTarget.parentElement?.parentElement; if (t) t.draggable = true; }}
        >
          <GripVertical size={14} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--proof-text-secondary)" }}>
            {widget.title}
          </span>
        </div>
        <div style={{ flex: 1, padding: 12, overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function KpiSummaryWidget() {
  const kpis = useDashboardKPIs();
  const filteredRuns = useFilteredRuns();
  const [, navigate] = useLocation();
  const sortedRuns = [...filteredRuns].sort(
    (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime()
  );
  const chartColor = kpis.passRate >= 95 ? "var(--proof-green)" : kpis.passRate >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
  const containerVariant = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  return (
    <motion.div variants={containerVariant} initial="hidden" animate="show" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, height: "100%" }}>
      <HeroKpiCard label="Pass Rate" value={kpis.passRate} suffix="%" delta={kpis.passTrend} accentColor={chartColor} icon={<Activity />} onClick={() => navigate("/trends")} delay={0} />
      <HeroKpiCard label="Total Runs" value={kpis.total} delta={1} deltaLabel="new" accentColor="var(--proof-blue)" icon={<Zap />} onClick={() => navigate("/runs")} delay={50} />
      <HeroKpiCard label="Failures" value={kpis.failedRuns} delta={sortedRuns.length >= 2 ? (sortedRuns[0]?.failures ?? 0) - (sortedRuns[1]?.failures ?? 0) : 0} invertDelta accentColor={kpis.failedRuns > 0 ? "var(--proof-red)" : "var(--proof-green)"} icon={<XCircle />} onClick={() => navigate("/runs?status=FAIL")} delay={100} />
      <HeroKpiCard label="Regressions" value={kpis.regressions} delta={kpis.regressions} invertDelta accentColor={kpis.regressions > 0 ? "var(--proof-red)" : "var(--proof-green)"} icon={<AlertTriangle />} onClick={() => navigate("/compare")} delay={150} />
    </motion.div>
  );
}

function EnvHealthWidget() {
  const envHealthData = useEnvHealth();
  const [, navigate] = useLocation();
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
    const statusPriority = { critical: 2, degraded: 1, healthy: 0 } as const;
    if ((statusPriority[env.status] ?? 0) > (statusPriority[group.status] ?? 0)) {
      group.status = env.status;
    }
    group.avgPassRate = Math.round(group.envs.reduce((s, e) => s + e.passRate, 0) / group.envs.length);
  }
  const tierGroups = [...tierMap.values()];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, height: "100%" }}>
      {tierGroups.map((group, i) => (
        <TierCard key={group.tier} group={group} onClick={() => navigate(`/runs?env=${group.tier}`)} index={i} />
      ))}
    </div>
  );
}

function PassRateChartWidget() {
  const kpis = useDashboardKPIs();
  const chartData = usePassRateChart();
  return (
    <TrendChart
      passRate={kpis.passRate}
      flakinessScore={12}
      avgDuration={1450}
      history={chartData.map((d, i) => ({
        runId: `R-${i}`,
        status: d.passRate > 80 ? "PASS" : "FAIL",
        env: "QA",
        passRate: d.passRate,
        date: d.label,
        duration: 1000,
      }))}
    />
  );
}

function AnomalyBannerWidget() {
  const kpis = useDashboardKPIs();
  const envHealthData = useEnvHealth();
  const [, navigate] = useLocation();
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
    const statusPriority = { critical: 2, degraded: 1, healthy: 0 } as const;
    if ((statusPriority[env.status] ?? 0) > (statusPriority[group.status] ?? 0)) {
      group.status = env.status;
    }
    group.avgPassRate = Math.round(group.envs.reduce((s, e) => s + e.passRate, 0) / group.envs.length);
  }
  const tierGroups = [...tierMap.values()];
  const hasAlert = kpis.regressions > 0;
  const hasDegradation = tierGroups.some((t) => t.status !== "healthy");
  if (!hasAlert && !hasDegradation) return null;
  return (
    <AnomalyBanner
      hasAlert={hasAlert}
      hasDegradation={hasDegradation}
      regressions={kpis.regressions}
      degradedTiers={tierGroups.filter((t) => t.status !== "healthy").map((t) => t.tier).join(", ")}
      onInvestigate={() => navigate("/compare")}
    />
  );
}

function HeatmapWidget() {
  const runs = useRuns();
  const data = runs.slice(-50).map(r => ({
    runId: r.id,
    label: r.label,
    passRate: r.passPct,
    env: r.env,
    date: r.started.slice(0, 10),
  }));
  return <PassRateHeatmap data={data} />;
}

function RunHistoryWidget() {
  const filteredRuns = useFilteredRuns();
  const [, navigate] = useLocation();
  const sorted = [...filteredRuns].sort(
    (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime()
  ).slice(0, 20);
  if (sorted.length === 0) {
    return <div style={{ fontSize: 13, color: "var(--proof-text-muted)", padding: 16, textAlign: "center" }}>No runs found</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {sorted.map(run => {
        const color = run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
        return (
          <button
            key={run.id}
            onClick={() => navigate(`/runs/${run.id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "6px 8px",
              borderRadius: 6, border: "none", cursor: "pointer", background: "transparent",
              fontSize: 12, color: "var(--proof-text)", textAlign: "left", width: "100%",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontWeight: 600, minWidth: 60 }}>{run.id}</span>
            <span style={{ flex: 1, color: "var(--proof-text-secondary)" }}>{run.label}</span>
            <span style={{ fontWeight: 700, color }}>{run.passPct}%</span>
          </button>
        );
      })}
    </div>
  );
}

function FlakinessLeaderboardWidget() {
  const runs = useRuns();
  const flakyRuns = runs.filter(r => r.status === "FLAKY" || (r.failures ?? 0) > 0).slice(0, 15);
  if (flakyRuns.length === 0) {
    return <div style={{ fontSize: 13, color: "var(--proof-text-muted)", padding: 16, textAlign: "center" }}>No flaky runs detected</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {flakyRuns.map(run => (
        <div key={run.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
          <span style={{ fontWeight: 600, minWidth: 60, color: "var(--proof-text)" }}>{run.id}</span>
          <span style={{ flex: 1, color: "var(--proof-text-secondary)" }}>{run.label}</span>
          <span style={{ color: "var(--proof-red)", fontWeight: 700 }}>{run.failures ?? 0} failures</span>
        </div>
      ))}
    </div>
  );
}

function PropertyStatusWidget() {
  const configs = getEnvConfigs();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {configs.map(cfg => (
        <div key={cfg.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "4px 0" }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
            background: cfg.active !== false ? "var(--proof-green)" : "var(--proof-red)",
          }} />
          <span style={{ fontWeight: 600 }}>{cfg.label}</span>
          <span style={{ color: "var(--proof-text-muted)", marginLeft: "auto" }}>{cfg.target}</span>
        </div>
      ))}
    </div>
  );
}

function RecentFailuresWidget() {
  const filteredRuns = useFilteredRuns();
  const failures = [...filteredRuns]
    .filter(r => (r.failures ?? 0) > 0)
    .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
    .slice(0, 15);
  if (failures.length === 0) {
    return <div style={{ fontSize: 13, color: "var(--proof-text-muted)", padding: 16, textAlign: "center" }}>No recent failures</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {failures.map(run => (
        <div key={run.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
          <span style={{ fontWeight: 600, minWidth: 60, color: "var(--proof-text)" }}>{run.id}</span>
          <span style={{ flex: 1, color: "var(--proof-text-secondary)" }}>{run.env} · {run.label}</span>
          <span style={{ color: "var(--proof-red)", fontWeight: 700 }}>{run.failures} failed</span>
        </div>
      ))}
    </div>
  );
}

function CiPipelineWidget() {
  const runs = useRuns();
  const pipelineRuns = [...runs].filter(r => r.status === "RUNNING" || r.status === "PENDING").slice(0, 10);
  if (pipelineRuns.length === 0) {
    return <div style={{ fontSize: 13, color: "var(--proof-text-muted)", padding: 16, textAlign: "center" }}>All pipelines idle</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {pipelineRuns.map(run => (
        <div key={run.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
            background: run.status === "RUNNING" ? "var(--proof-blue)" : "var(--proof-yellow)",
            animation: run.status === "RUNNING" ? "pulse 1.5s infinite" : undefined,
          }} />
          <span style={{ fontWeight: 600, color: "var(--proof-text)" }}>{run.id}</span>
          <span style={{ color: "var(--proof-text-secondary)", marginLeft: "auto" }}>{run.status}</span>
        </div>
      ))}
    </div>
  );
}

const WIDGET_RENDERERS: Record<WidgetType, React.ComponentType> = {
  "kpi-summary": KpiSummaryWidget,
  "pass-rate-chart": PassRateChartWidget,
  "env-health": EnvHealthWidget,
  "anomaly-banner": AnomalyBannerWidget,
  "heatmap": HeatmapWidget,
  "run-history": RunHistoryWidget,
  "flakiness-leaderboard": FlakinessLeaderboardWidget,
  "property-status": PropertyStatusWidget,
  "recent-failures": RecentFailuresWidget,
  "ci-pipeline": CiPipelineWidget,
};

export function DashboardGrid({ widgets, onDragEnd }: DashboardGridProps) {
  const visibleWidgets = widgets.filter(w => w.visible);

  const handleDragStart = (e: React.DragEvent, widget: WidgetConfig) => {
    e.dataTransfer.setData("text/plain", widget.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    const targetEl = (e.target as HTMLElement).closest("[data-widget-id]");
    if (!targetEl) return;
    const targetId = targetEl.getAttribute("data-widget-id");
    if (!draggedId || !targetId || draggedId === targetId) return;

    const updated = [...widgets];
    const draggedIdx = updated.findIndex(w => w.id === draggedId);
    const targetIdx = updated.findIndex(w => w.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const dragged = updated[draggedIdx];
    updated.splice(draggedIdx, 1);
    const newTargetIdx = updated.findIndex(w => w.id === targetId);
    updated.splice(newTargetIdx, 0, dragged);

    const reindexed = updated.map((w, i) => ({
      ...w,
      position: { x: i % 3, y: Math.floor(i / 3) },
    }));

    onDragEnd(reindexed);
  };

  if (visibleWidgets.length === 0) {
    return (
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 16, padding: 48, borderRadius: 12, border: "2px dashed var(--proof-border)",
          color: "var(--proof-text-muted)", fontSize: 14, textAlign: "center",
        }}
      >
        <Activity size={32} style={{ opacity: 0.4 }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Dashboard is empty</div>
          <div style={{ fontSize: 13 }}>Open the customize menu to add widgets</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        width: "100%",
      }}
    >
      {visibleWidgets.map(widget => {
        const Component = WIDGET_RENDERERS[widget.type];
        if (!Component) return null;
        return (
          <WidgetWrapper
            key={widget.id}
            widget={widget}
            onDragStart={e => handleDragStart(e, widget)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Component />
          </WidgetWrapper>
        );
      })}
    </div>
  );
}

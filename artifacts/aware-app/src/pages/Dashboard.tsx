import React from "react";
import { useLocation } from "wouter";
import {
  useFilteredRuns,
  useEnvHealth,
  useDashboardKPIs,
  usePassRateChart,
  useRelativeTime,
} from "@/lib/hooks/useData";
import {
  Play, Bot, GitCompare, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle2, XCircle, Activity,
  ExternalLink, Zap, Clock,
} from "lucide-react";
import {
  AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

/* ── helpers ─────────────────────────────────────────────────────── */

function statusConfig(status: "healthy" | "degraded" | "critical") {
  if (status === "healthy") return {
    color: "var(--proof-green)", bright: "var(--proof-green-bright)",
    bg: "var(--proof-green-bg)", bgStrong: "var(--proof-green-bg-strong)",
    border: "var(--proof-green-border)", glow: "var(--proof-green-glow)",
    label: "Healthy", Icon: CheckCircle2,
  };
  if (status === "degraded") return {
    color: "var(--proof-yellow)", bright: "var(--proof-yellow-bright)",
    bg: "var(--proof-yellow-bg)", bgStrong: "var(--proof-yellow-bg-strong)",
    border: "var(--proof-yellow-border)", glow: "rgba(245,158,11,0.20)",
    label: "Degraded", Icon: AlertTriangle,
  };
  return {
    color: "var(--proof-red)", bright: "var(--proof-red-bright)",
    bg: "var(--proof-red-bg)", bgStrong: "var(--proof-red-bg-strong)",
    border: "var(--proof-red-border)", glow: "var(--proof-red-glow)",
    label: "Critical", Icon: XCircle,
  };
}

function TrendBadge({ value }: { value: number }) {
  if (value > 0) return (
    <span style={{ color: "var(--proof-green)", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11 }}>
      <TrendingUp size={10} />+{value}%
    </span>
  );
  if (value < 0) return (
    <span style={{ color: "var(--proof-red)", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11 }}>
      <TrendingDown size={10} />{value}%
    </span>
  );
  return (
    <span style={{ color: "var(--proof-text-muted)", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11 }}>
      <Minus size={10} />—
    </span>
  );
}

/* ── Chart tooltip ───────────────────────────────────────────────── */
function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  const c = v >= 95 ? "var(--proof-green)" : v >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
  return (
    <div style={{
      background: "var(--proof-surface-3)", border: "1px solid var(--proof-border-strong)",
      borderRadius: "var(--proof-radius-lg)", padding: "7px 12px",
      boxShadow: "var(--proof-shadow-md)", fontSize: 12,
    }}>
      <div style={{ color: "var(--proof-text-secondary)", marginBottom: 2, fontSize: 11 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 18, color: c, fontFamily: "var(--font-mono)", letterSpacing: "-1px" }}>{v}%</div>
    </div>
  );
}

/* ── Tier column card ────────────────────────────────────────────── */
interface TierEnv {
  id: string;
  label: string;
  passRate: number;
  trend: number;
  failures: number;
  status: "healthy" | "degraded" | "critical";
}

interface TierGroup {
  tier: "QA" | "UAT" | "PROD";
  envs: TierEnv[];
  avgPassRate: number;
  status: "healthy" | "degraded" | "critical";
}

function TierCard({ group, onClick }: { group: TierGroup; onClick: () => void }) {
  const cfg = statusConfig(group.status);
  const { Icon } = cfg;

  const TIER_COLORS: Record<string, string> = {
    QA: "var(--proof-blue)",
    UAT: "var(--proof-purple)",
    PROD: "var(--proof-green)",
  };
  const tierColor = TIER_COLORS[group.tier] ?? "var(--proof-blue)";

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--proof-surface)",
        border: `1px solid var(--proof-border)`,
        borderRadius: "var(--proof-radius-xl)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color var(--proof-transition), box-shadow var(--proof-transition), transform var(--proof-transition)",
        boxShadow: "var(--proof-shadow-card)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = cfg.border;
        el.style.boxShadow = `var(--proof-shadow-card-hover), 0 0 20px ${cfg.glow}`;
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--proof-border)";
        el.style.boxShadow = "var(--proof-shadow-card)";
        el.style.transform = "";
      }}
    >
      {/* Top accent gradient */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${tierColor}, ${cfg.color})`,
      }} />

      {/* Radial background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 80% 0%, ${cfg.glow} 0%, transparent 60%)`,
        opacity: 0.4,
      }} />

      {/* Header */}
      <div style={{ padding: "14px 16px 8px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: `${tierColor}18`,
              border: `1px solid ${tierColor}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: tierColor, letterSpacing: "-0.3px" }}>
                {group.tier}
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.2px" }}>
              {group.tier === "QA" ? "Quality Assurance" : group.tier === "UAT" ? "User Acceptance" : "Production"}
            </span>
          </div>
          {/* Status chip */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "2px 8px", borderRadius: "var(--proof-radius-full)",
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: "0.1px",
          }}>
            <Icon size={9} />{cfg.label}
          </span>
        </div>

        {/* Big pass rate number */}
        <div style={{ marginTop: 10, display: "flex", alignItems: "flex-end", gap: 8 }}>
          <span style={{
            fontSize: 40, fontWeight: 900, fontFamily: "var(--font-mono)",
            letterSpacing: "-2.5px", lineHeight: 1, color: cfg.bright,
          }}>
            {group.avgPassRate}%
          </span>
          <span style={{ fontSize: 11, color: "var(--proof-text-muted)", marginBottom: 4 }}>
            avg pass rate
          </span>
        </div>

        {/* Overall progress bar */}
        <div style={{ marginTop: 8 }}>
          <div className="proof-progress-track" style={{ height: 5 }}>
            <div className="proof-progress-bar" style={{
              width: `${group.avgPassRate}%`,
              background: `linear-gradient(90deg, ${cfg.color}, ${cfg.bright})`,
              boxShadow: group.avgPassRate >= 95 ? `0 0 6px ${cfg.glow}` : "none",
            }} />
          </div>
        </div>
      </div>

      {/* Env sub-rows */}
      <div style={{ borderTop: "1px solid var(--proof-border)", marginTop: 4 }}>
        {group.envs.map((env, i) => {
          const envCfg = statusConfig(env.status);
          const networkLabel = env.label.split(" / ")[1] ?? env.label;
          return (
            <div
              key={env.id}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px",
                borderBottom: i < group.envs.length - 1 ? "1px solid var(--proof-border-light)" : "none",
              }}
            >
              <span className="proof-dot" style={{
                background: envCfg.color,
                boxShadow: env.status !== "healthy" ? `0 0 5px ${envCfg.color}` : undefined,
              }} />
              <span style={{ fontSize: 11.5, color: "var(--proof-text-secondary)", flex: 0, minWidth: 72 }}>
                {networkLabel}
              </span>
              <div className="proof-progress-track" style={{ flex: 1, height: 3 }}>
                <div className="proof-progress-bar" style={{
                  width: `${env.passRate}%`,
                  background: envCfg.color,
                }} />
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)",
                color: envCfg.bright, letterSpacing: "-0.5px", minWidth: 38, textAlign: "right",
              }}>
                {env.passRate}%
              </span>
              {env.failures > 0 && (
                <span style={{ fontSize: 10, color: "var(--proof-red-bright)", display: "flex", alignItems: "center", gap: 2 }}>
                  <XCircle size={9} />{env.failures}
                </span>
              )}
              <TrendBadge value={env.trend} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [, navigate] = useLocation();
  const filteredRuns = useFilteredRuns();
  const envHealth = useEnvHealth();
  const kpis = useDashboardKPIs();
  const chartData = usePassRateChart();
  const lastRunAge = useRelativeTime(kpis.latestRun?.started);

  // Group envs into 3 tiers
  const tierGroups = React.useMemo((): TierGroup[] => {
    const TIERS = [
      { key: "QA" as const, prefixes: ["qa-", "QA/", "QA "] },
      { key: "UAT" as const, prefixes: ["uat-", "UAT/", "UAT "] },
      { key: "PROD" as const, prefixes: ["prod-", "PROD/", "PROD "] },
    ];
    return TIERS.map(({ key, prefixes }) => {
      const envs = envHealth.filter((e) =>
        prefixes.some((p) => e.id.toLowerCase().startsWith(p.toLowerCase().replace(" ", "-")))
        || e.label.toUpperCase().startsWith(key)
      );
      if (envs.length === 0) return { tier: key, envs: [], avgPassRate: 0, status: "critical" as const };
      const avg = Math.round(envs.reduce((s, e) => s + e.passRate, 0) / envs.length);
      const min = Math.min(...envs.map((e) => e.passRate));
      const status = min >= 95 ? "healthy" : min >= 80 ? "degraded" : "critical";
      return { tier: key, envs, avgPassRate: avg, status };
    });
  }, [envHealth]);

  const hasAlert = kpis.regressions > 0 || tierGroups.some((t) => t.status === "critical");
  const hasDegradation = !hasAlert && tierGroups.some((t) => t.status === "degraded");

  const recentRuns = filteredRuns.slice(0, 15);
  const chartColor = kpis.passRate >= 95 ? "var(--proof-green)" : kpis.passRate >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";

  if (filteredRuns.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100%", gap: 16, padding: 60, animation: "page-enter 0.2s ease-out both",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "var(--proof-radius-xl)",
          background: "var(--proof-blue-bg)", border: "1px solid var(--proof-blue-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Activity size={26} style={{ color: "var(--proof-blue)" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--proof-text)", margin: "0 0 5px" }}>No test runs yet</h2>
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", margin: 0 }}>Trigger a CI run to see data.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateRows: `${hasAlert || hasDegradation ? "auto " : ""}auto 1fr`,
      gap: 10,
      padding: "12px 16px 12px",
      height: "100%",
      minHeight: 0,
      animation: "page-enter 0.22s ease-out both",
      boxSizing: "border-box",
    }}>

      {/* ── Alert banner ─────────────────────────────────────── */}
      {(hasAlert || hasDegradation) && (
        <div className="animate-slide-down" style={{
          display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
          borderRadius: "var(--proof-radius-lg)",
          background: hasAlert ? "var(--proof-red-bg)" : "var(--proof-yellow-bg)",
          border: `1px solid ${hasAlert ? "var(--proof-red-border)" : "var(--proof-yellow-border)"}`,
          borderLeft: `3px solid ${hasAlert ? "var(--proof-red)" : "var(--proof-yellow)"}`,
        }}>
          <AlertTriangle size={13} style={{ color: hasAlert ? "var(--proof-red-bright)" : "var(--proof-yellow-bright)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: hasAlert ? "var(--proof-red-bright)" : "var(--proof-yellow-bright)" }}>
            {hasAlert
              ? `${kpis.regressions > 0 ? `${kpis.regressions} regression${kpis.regressions !== 1 ? "s" : ""}` : "Critical environment"} detected`
              : `${tierGroups.filter((t) => t.status === "degraded").map((t) => t.tier).join(", ")} degraded — pass rate below threshold`}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => navigate("/compare")} className="proof-button proof-button-sm"
              style={{ color: hasAlert ? "var(--proof-red-bright)" : "var(--proof-yellow-bright)", borderColor: hasAlert ? "var(--proof-red-border)" : "var(--proof-yellow-border)" }}>
              Investigate →
            </button>
          </div>
        </div>
      )}

      {/* ── Tier hero section ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {tierGroups.map((group) => (
          <TierCard
            key={group.tier}
            group={group}
            onClick={() => navigate(`/runs?env=${group.tier}`)}
          />
        ))}
      </div>

      {/* ── Bottom: chart (65%) + runs (35%) ──────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 10, minHeight: 0 }}>

        {/* Trend chart */}
        <div className="proof-section-card" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderBottom: "1px solid var(--proof-border)", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 3, height: 13, borderRadius: 99, background: chartColor, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.15px" }}>Pass Rate Trend</span>
              <span className="proof-badge proof-badge-neutral" style={{ fontSize: 10 }}>14 days</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Global KPI strip inside the chart header */}
              <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--proof-text)" }}>{kpis.total}</span> runs ·{" "}
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: chartColor }}>{kpis.passRate}%</span> avg ·{" "}
                {kpis.failedRuns > 0 && <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--proof-red-bright)" }}>{kpis.failedRuns} failed</span>}
                {kpis.failedRuns === 0 && <span style={{ color: "var(--proof-green)", fontWeight: 600 }}>all passing</span>}
              </span>
              <button onClick={() => navigate("/trends")} className="proof-button-ghost" style={{ fontSize: 11 }}>
                Full trends →
              </button>
            </div>
          </div>

          {/* Chart fills remaining height */}
          <div style={{ flex: 1, minHeight: 0, padding: "12px 8px 8px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.30} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 5" stroke="var(--proof-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--proof-text-muted)" } as React.SVGProps<SVGTextElement>}
                  tickLine={false} axisLine={false} interval="preserveStartEnd"
                />
                <YAxis
                  domain={[Math.max(0, (kpis.passRate || 80) - 18), 100]}
                  tick={{ fontSize: 10, fill: "var(--proof-text-muted)" } as React.SVGProps<SVGTextElement>}
                  tickLine={false} axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <ReferenceLine y={95} stroke="var(--proof-green)" strokeDasharray="4 3" strokeOpacity={0.4}
                  label={{ value: "95% threshold", fontSize: 9, fill: "var(--proof-green)", opacity: 0.55, position: "insideTopRight" }}
                />
                <Tooltip content={<ChartTip />} />
                <Area
                  type="monotone" dataKey="passRate" stroke={chartColor} strokeWidth={2.5}
                  fill="url(#prGrad)" dot={false}
                  activeDot={{ r: 4, fill: chartColor, stroke: "var(--proof-surface)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent runs */}
        <div className="proof-section-card" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderBottom: "1px solid var(--proof-border)", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 3, height: 13, borderRadius: 99, background: "var(--proof-purple)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.15px" }}>Recent Runs</span>
              <span className="proof-badge proof-badge-neutral" style={{ fontSize: 10 }}>{filteredRuns.length}</span>
            </div>
            <button onClick={() => navigate("/runs")} className="proof-button-ghost" style={{ fontSize: 11 }}>All →</button>
          </div>

          {/* Run list */}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {recentRuns.map((run, i) => {
              const c = run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
              const tierTag = (run.env || "").split("/")[0]?.trim() || run.env || "";
              return (
                <div
                  key={run.id}
                  onClick={() => navigate(`/runs/${run.id}`)}
                  style={{
                    display: "flex", alignItems: "center",
                    padding: "7px 14px",
                    borderBottom: i < recentRuns.length - 1 ? "1px solid var(--proof-border-light)" : "none",
                    cursor: "pointer", gap: 8,
                    transition: "background var(--proof-transition)",
                    borderLeft: `2px solid ${c}`,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 11.5, fontWeight: 600, color: "var(--proof-text)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontFamily: "var(--font-mono)", letterSpacing: "-0.2px",
                    }}>
                      {run.id}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>{run.env}</span>
                      {run.suiteId && (
                        <>
                          <span style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--proof-border-strong)", display: "inline-block" }} />
                          <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>{run.suiteId}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 800, fontFamily: "var(--font-mono)",
                    color: c, letterSpacing: "-0.8px", flexShrink: 0,
                  }}>
                    {run.passPct}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: "8px 14px", borderTop: "1px solid var(--proof-border)",
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
          }}>
            <Clock size={10} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color: "var(--proof-text-muted)" }}>
              Last run {lastRunAge}
            </span>
            <span style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
              <button onClick={() => navigate("/compare")} className="proof-button-ghost" style={{ fontSize: 10 }}>
                <GitCompare size={9} /> Compare
              </button>
              <button
                onClick={() => window.open("https://github.com/ruake/AWARE/actions/workflows/run-tests.yml", "_blank")}
                className="proof-button proof-button-xs"
              >
                <Play size={9} /> Run <ExternalLink size={8} style={{ opacity: 0.6 }} />
              </button>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

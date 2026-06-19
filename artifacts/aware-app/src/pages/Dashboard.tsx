import React from "react";
import { useLocation } from "wouter";
import {
  useFilteredRuns,
  useDiffRows,
  useEnvHealth,
  useDashboardKPIs,
  usePassRateChart,
  useRelativeTime,
} from "@/lib/hooks/useData";
import {
  Play,
  Bot,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  ChevronRight,
  ExternalLink,
  Zap,
  Clock,
  BarChart2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

/* ── helpers ─────────────────────────────────────────────────────── */

function statusTheme(status: "healthy" | "degraded" | "critical") {
  if (status === "healthy")
    return {
      color: "var(--proof-green)",
      bright: "var(--proof-green-bright)",
      bg: "var(--proof-green-bg)",
      bgStrong: "var(--proof-green-bg-strong)",
      border: "var(--proof-green-border)",
      label: "Healthy",
      Icon: CheckCircle2,
    };
  if (status === "degraded")
    return {
      color: "var(--proof-yellow)",
      bright: "var(--proof-yellow-bright)",
      bg: "var(--proof-yellow-bg)",
      bgStrong: "var(--proof-yellow-bg-strong)",
      border: "var(--proof-yellow-border)",
      label: "Degraded",
      Icon: AlertTriangle,
    };
  return {
    color: "var(--proof-red)",
    bright: "var(--proof-red-bright)",
    bg: "var(--proof-red-bg)",
    bgStrong: "var(--proof-red-bg-strong)",
    border: "var(--proof-red-border)",
    label: "Critical",
    Icon: XCircle,
  };
}

function Trend({ value }: { value: number }) {
  if (value > 0)
    return (
      <span style={{ color: "var(--proof-green)", display: "inline-flex", alignItems: "center", gap: 2 }}>
        <TrendingUp size={10} />+{value}%
      </span>
    );
  if (value < 0)
    return (
      <span style={{ color: "var(--proof-red)", display: "inline-flex", alignItems: "center", gap: 2 }}>
        <TrendingDown size={10} />{value}%
      </span>
    );
  return (
    <span style={{ color: "var(--proof-text-muted)", display: "inline-flex", alignItems: "center", gap: 2 }}>
      <Minus size={10} />—
    </span>
  );
}

/* ── KPI card ────────────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  sub,
  accentColor = "var(--proof-blue)",
  glow = "transparent",
  delay = 0,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  accentColor?: string;
  glow?: string;
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <div
      className="animate-fade-in-up"
      onClick={onClick}
      style={{
        animationDelay: `${delay}ms`,
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: "var(--proof-radius-xl)",
        padding: "14px 18px 13px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color var(--proof-transition), box-shadow var(--proof-transition), transform var(--proof-transition)",
        boxShadow: "var(--proof-shadow-card)",
        position: "relative",
        overflow: "hidden",
        ["--card-glow" as string]: glow,
      }}
      onMouseEnter={onClick ? (e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--proof-border-strong)";
        el.style.transform = "translateY(-1px)";
        el.style.boxShadow = "var(--proof-shadow-card-hover)";
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--proof-border)";
        el.style.transform = "";
        el.style.boxShadow = "var(--proof-shadow-card)";
      } : undefined}
    >
      {/* top accent */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          borderRadius: "var(--proof-radius-xl) var(--proof-radius-xl) 0 0",
          opacity: 0.75,
        }}
      />
      {/* radial glow */}
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "inherit",
          background: `radial-gradient(circle at 75% 0%, var(--card-glow) 0%, transparent 55%)`,
          opacity: 0.5,
        }}
      />
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.7px" }}>
        {label}
      </div>
      <div style={{
        fontSize: 34,
        fontWeight: 800,
        letterSpacing: "-2px",
        lineHeight: 1,
        fontFamily: "var(--font-mono)",
        color: "var(--proof-text)",
        animation: `count-up 0.3s ease-out both ${delay + 60}ms`,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, color: "var(--proof-text-secondary)", marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ── section header ──────────────────────────────────────────────── */
function SectionHead({
  title, badge, action, accentColor = "var(--proof-blue)", collapsed, onToggle,
}: {
  title: string; badge?: React.ReactNode; action?: React.ReactNode;
  accentColor?: string; collapsed?: boolean; onToggle?: () => void;
}) {
  return (
    <div
      className="proof-section-card-header"
      onClick={onToggle}
      style={{ cursor: onToggle ? "pointer" : "default", userSelect: "none", padding: "10px 16px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <div style={{ width: 3, height: 13, borderRadius: 99, background: accentColor, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.15px" }}>{title}</span>
        {badge !== undefined && (
          <span className="proof-badge proof-badge-neutral" style={{ fontSize: 10 }}>{badge}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {action}
        {onToggle && (
          <span style={{
            fontSize: 9, color: "var(--proof-text-muted)",
            display: "inline-block",
            transition: "transform var(--proof-transition)",
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          }}>▼</span>
        )}
      </div>
    </div>
  );
}

/* ── env cell ────────────────────────────────────────────────────── */
function EnvCell({
  label, passRate, trend, failures, status,
  borderRight, borderBottom, onClick,
}: {
  label: string; passRate: number; trend: number; failures: number;
  status: "healthy" | "degraded" | "critical";
  borderRight: boolean; borderBottom: boolean; onClick: () => void;
}) {
  const th = statusTheme(status);
  const { Icon } = th;
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 16px",
        borderRight: borderRight ? "1px solid var(--proof-border)" : "none",
        borderBottom: borderBottom ? "1px solid var(--proof-border)" : "none",
        cursor: "pointer",
        transition: "background var(--proof-transition)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = th.bgStrong; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="proof-dot" style={{ background: th.color, boxShadow: `0 0 0 3px ${th.bg}` }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-text)", letterSpacing: "-0.1px" }}>{label}</span>
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-1px", color: th.bright, lineHeight: 1 }}>
          {passRate}%
        </span>
      </div>
      {/* progress bar */}
      <div className="proof-progress-track" style={{ height: 4, marginBottom: 7 }}>
        <div className="proof-progress-bar" style={{
          width: `${passRate}%`, height: "100%",
          background: `linear-gradient(90deg, ${th.color}, ${th.bright})`,
          boxShadow: passRate >= 95 ? `0 0 5px ${th.color}40` : "none",
        }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trend value={trend} />
          {failures > 0 && (
            <span style={{ fontSize: 11, color: "var(--proof-red-bright)", display: "flex", alignItems: "center", gap: 3 }}>
              <XCircle size={10} />{failures} fail{failures !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: th.color, display: "flex", alignItems: "center", gap: 3 }}>
          <Icon size={10} />{th.label}
        </span>
      </div>
    </div>
  );
}

/* ── chart tooltip ───────────────────────────────────────────────── */
function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  const c = v >= 95 ? "var(--proof-green)" : v >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
  return (
    <div style={{
      background: "var(--proof-surface-3)", border: "1px solid var(--proof-border-strong)",
      borderRadius: "var(--proof-radius-lg)", padding: "7px 11px",
      boxShadow: "var(--proof-shadow-md)", fontSize: 12,
    }}>
      <div style={{ color: "var(--proof-text-secondary)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: c, fontFamily: "var(--font-mono)" }}>{v}%</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [, navigate] = useLocation();
  const filteredRuns = useFilteredRuns();
  const diffRows = useDiffRows();
  const envHealth = useEnvHealth();
  const kpis = useDashboardKPIs();
  const chartData = usePassRateChart();
  const lastRunAge = useRelativeTime(kpis.latestRun?.started);

  const [envCollapsed, setEnvCollapsed] = React.useState(false);

  const hasAlert = kpis.regressions > 0 || envHealth.some((e) => e.status === "critical");
  const hasDegradation = !hasAlert && envHealth.some((e) => e.status === "degraded");

  const cols = Math.min(3, Math.max(1, envHealth.length));
  const recentRuns = filteredRuns.slice(0, 12);

  const chartColor =
    kpis.passRate >= 95 ? "var(--proof-green)" : kpis.passRate >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";

  if (filteredRuns.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, padding: 60, animation: "page-enter 0.2s ease-out both" }}>
        <div style={{ width: 56, height: 56, borderRadius: "var(--proof-radius-xl)", background: "var(--proof-blue-bg)", border: "1px solid var(--proof-blue-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Activity size={26} style={{ color: "var(--proof-blue)" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--proof-text)", margin: "0 0 5px" }}>No test runs yet</h2>
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", margin: 0 }}>Trigger a CI run to start seeing data here.</p>
        </div>
        <button onClick={() => window.open("https://github.com/ruake/AWARE/actions/workflows/run-tests.yml", "_blank")} className="proof-button-primary">
          <Play size={12} /> Start First Run <ExternalLink size={10} style={{ opacity: 0.7 }} />
        </button>
      </div>
    );
  }

  return (
    /* Full-height grid: alerts? | hero | kpi-row | env-health | bottom-row(1fr) */
    <div
      style={{
        display: "grid",
        gridTemplateRows: `${hasAlert || hasDegradation ? "auto " : ""}auto auto auto 1fr`,
        gap: 8,
        padding: "10px 16px 10px",
        height: "100%",
        minHeight: 0,
        animation: "page-enter 0.22s ease-out both",
        boxSizing: "border-box",
      }}
    >
      {/* ── alert banner ─────────────────────────────────────── */}
      {(hasAlert || hasDegradation) && (
        <div
          className="animate-slide-down"
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 14px",
            borderRadius: "var(--proof-radius-lg)",
            background: hasAlert ? "var(--proof-red-bg)" : "var(--proof-yellow-bg)",
            border: `1px solid ${hasAlert ? "var(--proof-red-border)" : "var(--proof-yellow-border)"}`,
            borderLeft: `3px solid ${hasAlert ? "var(--proof-red)" : "var(--proof-yellow)"}`,
          }}
        >
          <AlertTriangle size={13} style={{ color: hasAlert ? "var(--proof-red-bright)" : "var(--proof-yellow-bright)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: hasAlert ? "var(--proof-red-bright)" : "var(--proof-yellow-bright)" }}>
            {hasAlert
              ? `${kpis.regressions > 0 ? `${kpis.regressions} regression${kpis.regressions !== 1 ? "s" : ""}` : ""}${kpis.regressions > 0 && envHealth.some((e) => e.status === "critical") ? " · " : ""}${envHealth.filter((e) => e.status === "critical").map((e) => e.label).join(", ")} critical`
              : `${envHealth.filter((e) => e.status === "degraded").map((e) => e.label).join(", ")} degraded — pass rate below 95%`}
          </span>
          {hasAlert && (
            <button onClick={() => navigate("/compare")} className="proof-button proof-button-sm"
              style={{ color: "var(--proof-red-bright)", borderColor: "var(--proof-red-border)", background: "var(--proof-red-bg-strong)", fontSize: 11.5 }}>
              Investigate <ChevronRight size={11} />
            </button>
          )}
        </div>
      )}

      {/* ── hero row ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "var(--proof-radius-lg)", background: "var(--proof-blue-bg)", border: "1px solid var(--proof-blue-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={15} style={{ color: "var(--proof-blue)" }} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.25px" }}>
              {filteredRuns.length} runs ·{" "}
              <span style={{ color: "var(--proof-text-secondary)", fontWeight: 500 }}>
                {envHealth.filter((e) => e.passRate > 0).length} environments active
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--proof-text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={9} />
              Last run {lastRunAge}
              <span style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--proof-border-strong)", display: "inline-block" }} />
              <span style={{ color: envHealth.filter((e) => e.status === "healthy").length === envHealth.length ? "var(--proof-green)" : "var(--proof-yellow)" }}>
                {envHealth.filter((e) => e.status === "healthy").length}/{envHealth.length} healthy
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <button onClick={() => window.open("https://github.com/ruake/AWARE/actions/workflows/run-tests.yml", "_blank")} className="proof-button-primary proof-button-sm">
            <Play size={11} /> Start Run <ExternalLink size={9} style={{ opacity: 0.7 }} />
          </button>
          <button onClick={() => navigate("/compare")} className="proof-button proof-button-sm">
            <GitCompare size={11} /> Compare
          </button>
          <button onClick={() => navigate("/copilot")} className="proof-button proof-button-sm">
            <Bot size={11} /> Copilot
          </button>
        </div>
      </div>

      {/* ── KPI row ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <KpiCard label="Total Runs" value={kpis.total}
          sub={<><BarChart2 size={10} />all environments</>}
          accentColor="var(--proof-blue)" glow="rgba(0,122,204,0.08)" delay={0} />
        <KpiCard label="Pass Rate" value={`${kpis.passRate}%`}
          sub={<Trend value={kpis.passTrend} />}
          accentColor={chartColor}
          glow={kpis.passRate >= 95 ? "rgba(78,201,176,0.1)" : kpis.passRate >= 80 ? "rgba(232,184,76,0.1)" : "rgba(244,71,71,0.1)"}
          delay={30} />
        <KpiCard label="Failed Runs" value={kpis.failedRuns}
          sub={kpis.failedRuns === 0
            ? <><CheckCircle2 size={10} style={{ color: "var(--proof-green)" }} />all passing</>
            : <><XCircle size={10} style={{ color: "var(--proof-red)" }} /><span style={{ color: "var(--proof-red)" }}>needs attention</span></>}
          accentColor={kpis.failedRuns > 0 ? "var(--proof-red)" : "var(--proof-green)"}
          glow={kpis.failedRuns > 0 ? "rgba(244,71,71,0.08)" : "rgba(78,201,176,0.06)"}
          onClick={kpis.failedRuns > 0 ? () => navigate("/runs") : undefined}
          delay={60} />
        <KpiCard label="Regressions" value={kpis.regressions}
          sub={kpis.regressions === 0
            ? <><CheckCircle2 size={10} style={{ color: "var(--proof-green)" }} />no regressions</>
            : <><AlertTriangle size={10} style={{ color: "var(--proof-red)" }} /><span style={{ color: "var(--proof-red)" }}>vs previous run</span></>}
          accentColor={kpis.regressions > 0 ? "var(--proof-red)" : "var(--proof-green)"}
          glow={kpis.regressions > 0 ? "rgba(244,71,71,0.08)" : "rgba(78,201,176,0.06)"}
          onClick={kpis.regressions > 0 ? () => navigate("/compare") : undefined}
          delay={90} />
      </div>

      {/* ── environment health ───────────────────────────────── */}
      <div className="proof-section-card animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <SectionHead
          title="Environment Health" badge={`${envHealth.length} envs`}
          collapsed={envCollapsed} onToggle={() => setEnvCollapsed((p) => !p)}
          accentColor="var(--proof-blue)"
          action={
            <button onClick={(e) => { e.stopPropagation(); navigate("/runs"); }} className="proof-button-ghost proof-button-sm" style={{ fontSize: 11 }}>
              View all <ChevronRight size={10} />
            </button>
          }
        />
        {!envCollapsed && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {envHealth.map((env, i) => {
              const col = i % cols;
              const totalRows = Math.ceil(envHealth.length / cols);
              const row = Math.floor(i / cols);
              return (
                <EnvCell
                  key={env.id}
                  label={env.label}
                  passRate={env.passRate}
                  trend={env.trend}
                  failures={env.failures}
                  status={env.status}
                  borderRight={col < cols - 1 && i < envHealth.length - 1}
                  borderBottom={row < totalRows - 1}
                  onClick={() => navigate(`/runs?env=${encodeURIComponent(env.label)}`)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── bottom: chart (flex-1) + recent runs ─────────────── */}
      <div
        className="animate-fade-in-up"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 8,
          animationDelay: "100ms",
          minHeight: 0,
        }}
      >
        {/* trend chart — fills remaining height */}
        <div className="proof-section-card" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <SectionHead
            title="Pass Rate Trend" badge="14 days"
            accentColor="var(--proof-green)"
            action={
              <button onClick={() => navigate("/trends")} className="proof-button-ghost proof-button-sm" style={{ fontSize: 11 }}>
                Full trends <ChevronRight size={10} />
              </button>
            }
          />
          <div style={{ flex: 1, minHeight: 0, padding: "10px 8px 8px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--proof-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9.5, fill: "var(--proof-text-muted)" } as React.SVGProps<SVGTextElement>} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis domain={[Math.max(0, (kpis.passRate || 80) - 15), 100]} tick={{ fontSize: 9.5, fill: "var(--proof-text-muted)" } as React.SVGProps<SVGTextElement>} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                <ReferenceLine y={95} stroke="var(--proof-green)" strokeDasharray="4 3" strokeOpacity={0.35} label={{ value: "95%", fontSize: 9, fill: "var(--proof-green)", opacity: 0.6, position: "insideTopRight" }} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="passRate" stroke={chartColor} strokeWidth={2} fill="url(#prGrad)" dot={false} activeDot={{ r: 3.5, fill: chartColor, stroke: "var(--proof-surface)", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* recent runs — scrollable list */}
        <div className="proof-section-card" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <SectionHead
            title="Recent Runs" badge={filteredRuns.length}
            accentColor="var(--proof-purple)"
            action={
              <button onClick={() => navigate("/runs")} className="proof-button-ghost proof-button-sm" style={{ fontSize: 11 }}>
                All <ChevronRight size={10} />
              </button>
            }
          />
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {recentRuns.map((run, i) => {
              const c = run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
              return (
                <div
                  key={run.id}
                  onClick={() => navigate(`/runs/${run.id}`)}
                  style={{
                    display: "flex", alignItems: "center",
                    padding: "8px 14px",
                    borderBottom: i < recentRuns.length - 1 ? "1px solid var(--proof-border)" : "none",
                    cursor: "pointer", gap: 8,
                    transition: "background var(--proof-transition)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span className="proof-dot" style={{ background: c, boxShadow: `0 0 0 2px ${c}22`, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {run.id}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--proof-text-muted)", marginTop: 1 }}>{run.env}</div>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-mono)", color: c, letterSpacing: "-0.5px", flexShrink: 0 }}>
                    {run.passPct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  RefreshCw,
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

/* ── Helpers ─────────────────────────────────────────────────────── */

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

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <TrendingUp size={11} style={{ color: "var(--proof-green)" }} />;
  if (value < 0) return <TrendingDown size={11} style={{ color: "var(--proof-red)" }} />;
  return <Minus size={11} style={{ color: "var(--proof-text-muted)" }} />;
}

/* ── Metric Card ─────────────────────────────────────────────────── */
interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  glow?: string;
  accentColor?: string;
  onClick?: () => void;
  animDelay?: number;
}

function MetricCard({ label, value, sub, glow, accentColor = "var(--proof-blue)", onClick, animDelay = 0 }: MetricCardProps) {
  return (
    <div
      className="proof-metric-card animate-fade-in-up"
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        animationDelay: `${animDelay}ms`,
        "--card-glow": glow ?? "transparent",
      } as React.CSSProperties}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          borderRadius: "var(--proof-radius-xl) var(--proof-radius-xl) 0 0",
          opacity: 0.7,
        }}
      />
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: "var(--proof-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.7px",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "var(--font-size-4xl)",
          fontWeight: 800,
          color: "var(--proof-text)",
          letterSpacing: "-2px",
          lineHeight: 1,
          fontFamily: "var(--font-mono)",
          animation: "count-up 0.3s ease-out both",
          animationDelay: `${animDelay + 80}ms`,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11.5,
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "var(--proof-text-secondary)",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* ── Section Header ──────────────────────────────────────────────── */
function SectionHeader({
  title,
  badge,
  action,
  collapsed,
  onToggle,
  accentColor = "var(--proof-blue)",
}: {
  title: string;
  badge?: string | number;
  action?: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
  accentColor?: string;
}) {
  return (
    <div
      className="proof-section-card-header"
      onClick={onToggle}
      style={{ cursor: onToggle ? "pointer" : "default", userSelect: "none" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 3,
            height: 14,
            borderRadius: "var(--proof-radius-full)",
            background: accentColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--proof-text)",
            letterSpacing: "-0.2px",
          }}
        >
          {title}
        </span>
        {badge !== undefined && (
          <span className="proof-badge proof-badge-neutral" style={{ fontSize: 10 }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {action}
        {onToggle && (
          <span
            style={{
              color: "var(--proof-text-muted)",
              fontSize: 10,
              transition: "transform var(--proof-transition)",
              transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
              display: "inline-block",
            }}
          >
            ▼
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Environment Health Card ─────────────────────────────────────── */
interface EnvCardProps {
  id: string;
  label: string;
  passRate: number;
  trend: number;
  failures: number;
  status: "healthy" | "degraded" | "critical";
  isLast: boolean;
  col: number;
  totalCols: number;
  isLastRow: boolean;
  onClick: () => void;
}

function EnvCard({ id, label, passRate, trend, failures, status, isLast, col, totalCols, isLastRow, onClick }: EnvCardProps) {
  const theme = statusTheme(status);
  const { Icon: StatusIcon } = theme;
  const isLastCol = col === totalCols - 1 || isLast;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "18px 20px",
        borderRight: !isLastCol ? "1px solid var(--proof-border)" : "none",
        borderBottom: !isLastRow ? "1px solid var(--proof-border)" : "none",
        cursor: "pointer",
        transition: "background var(--proof-transition)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = theme.bgStrong;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            className="proof-dot"
            style={{
              background: theme.color,
              boxShadow: `0 0 0 3px ${theme.bg}`,
              marginTop: 1,
            }}
          />
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--proof-text)",
              letterSpacing: "-0.2px",
            }}
          >
            {label}
          </span>
        </div>
        <span
          style={{
            fontSize: 26,
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            letterSpacing: "-1.5px",
            color: theme.bright,
            lineHeight: 1,
          }}
        >
          {passRate}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="proof-progress-track"
        style={{ height: 5, marginBottom: 10, borderRadius: "var(--proof-radius-full)" }}
      >
        <div
          className="proof-progress-bar"
          style={{
            width: `${passRate}%`,
            background: `linear-gradient(90deg, ${theme.color}, ${theme.bright})`,
            height: "100%",
            borderRadius: "var(--proof-radius-full)",
            boxShadow: passRate >= 95 ? `0 0 6px ${theme.color}40` : "none",
          }}
        />
      </div>

      {/* Footer row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 11.5,
              fontWeight: 600,
              color:
                trend > 0
                  ? "var(--proof-green)"
                  : trend < 0
                    ? "var(--proof-red)"
                    : "var(--proof-text-muted)",
            }}
          >
            <TrendIcon value={trend} />
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
          {failures > 0 && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 11,
                color: "var(--proof-red-bright)",
                fontWeight: 500,
              }}
            >
              <XCircle size={10} />
              {failures} fail{failures !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            color: theme.color,
          }}
        >
          <StatusIcon size={11} />
          {theme.label}
        </span>
      </div>
    </div>
  );
}

/* ── Custom chart tooltip ────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  const color = val >= 95 ? "var(--proof-green)" : val >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
  return (
    <div
      style={{
        background: "var(--proof-surface-3)",
        border: "1px solid var(--proof-border-strong)",
        borderRadius: "var(--proof-radius-lg)",
        padding: "8px 12px",
        boxShadow: "var(--proof-shadow-md)",
        fontSize: 12,
      }}
    >
      <div style={{ color: "var(--proof-text-secondary)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color, fontFamily: "var(--font-mono)" }}>
        {val}%
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [, navigate] = useLocation();
  const filteredRuns = useFilteredRuns();
  const diffRows = useDiffRows();
  const envHealth = useEnvHealth();
  const kpis = useDashboardKPIs();
  const chartData = usePassRateChart();
  const lastRunAge = useRelativeTime(kpis.latestRun?.started);

  const [envCollapsed, setEnvCollapsed] = React.useState(false);
  const [chartCollapsed, setChartCollapsed] = React.useState(false);

  const hasAlerts = kpis.regressions > 0 || envHealth.some((e) => e.status === "critical");
  const hasDegradations = envHealth.some((e) => e.status === "degraded");
  const cols = Math.min(3, Math.max(1, envHealth.length));
  const RUNS_PER_PAGE = 10;
  const recentRuns = filteredRuns.slice(0, RUNS_PER_PAGE);

  /* Determine pass rate color for chart fill */
  const chartColor =
    kpis.passRate >= 95
      ? "var(--proof-green)"
      : kpis.passRate >= 80
        ? "var(--proof-yellow)"
        : "var(--proof-red)";

  if (filteredRuns.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 18,
          padding: 60,
          animation: "page-enter 0.2s ease-out both",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "var(--proof-radius-xl)",
            background: "var(--proof-blue-bg)",
            border: "1px solid var(--proof-blue-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Activity size={28} style={{ color: "var(--proof-blue)" }} />
        </div>
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--proof-text)",
              margin: "0 0 6px",
              textAlign: "center",
            }}
          >
            No test runs yet
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--proof-text-secondary)",
              margin: 0,
              textAlign: "center",
            }}
          >
            Trigger a CI run to start seeing data here.
          </p>
        </div>
        <button
          onClick={() =>
            window.open("https://github.com/ruake/AWARE/actions/workflows/run-tests.yml", "_blank")
          }
          className="proof-button-primary"
        >
          <Play size={13} /> Start First Run <ExternalLink size={11} style={{ opacity: 0.7 }} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: "18px 20px 28px",
        maxWidth: 1400,
        animation: "page-enter 0.22s ease-out both",
      }}
    >
      {/* ── Alert banner ───────────────────────────────────────── */}
      {hasAlerts && (
        <div
          className="animate-slide-down"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "11px 16px",
            borderRadius: "var(--proof-radius-lg)",
            background: "var(--proof-red-bg)",
            border: "1px solid var(--proof-red-border)",
            borderLeft: "3px solid var(--proof-red)",
          }}
        >
          <AlertTriangle size={14} style={{ color: "var(--proof-red-bright)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--proof-red-bright)" }}>
            {kpis.regressions > 0 && `${kpis.regressions} regression${kpis.regressions !== 1 ? "s" : ""} detected`}
            {kpis.regressions > 0 && envHealth.some((e) => e.status === "critical") && " · "}
            {envHealth.filter((e) => e.status === "critical").length > 0 &&
              `${envHealth
                .filter((e) => e.status === "critical")
                .map((e) => e.label)
                .join(", ")} critical`}
          </span>
          <button
            onClick={() => navigate("/compare")}
            className="proof-button"
            style={{
              fontSize: 12,
              color: "var(--proof-red-bright)",
              borderColor: "var(--proof-red-border)",
              background: "var(--proof-red-bg-strong)",
            }}
          >
            Investigate <ChevronRight size={12} />
          </button>
        </div>
      )}

      {hasDegradations && !hasAlerts && (
        <div
          className="animate-slide-down"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            borderRadius: "var(--proof-radius-lg)",
            background: "var(--proof-yellow-bg)",
            border: "1px solid var(--proof-yellow-border)",
            borderLeft: "3px solid var(--proof-yellow)",
          }}
        >
          <AlertTriangle size={13} style={{ color: "var(--proof-yellow-bright)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: "var(--proof-yellow-bright)" }}>
            {envHealth.filter((e) => e.status === "degraded").map((e) => e.label).join(", ")} degraded — pass rate below 95%
          </span>
        </div>
      )}

      {/* ── Hero row: status + actions ─────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--proof-radius-lg)",
              background: "var(--proof-blue-bg)",
              border: "1px solid var(--proof-blue-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Zap size={17} style={{ color: "var(--proof-blue)" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--proof-text)",
                letterSpacing: "-0.3px",
              }}
            >
              {filteredRuns.length} runs ·{" "}
              <span style={{ color: "var(--proof-text-secondary)", fontWeight: 500 }}>
                {envHealth.filter((e) => e.passRate > 0).length} environments active
              </span>
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--proof-text-muted)",
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Clock size={10} />
              Last run {lastRunAge}
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--proof-border-strong)", display: "inline-block" }} />
              <span
                style={{
                  color:
                    envHealth.filter((e) => e.status === "healthy").length === envHealth.length
                      ? "var(--proof-green)"
                      : "var(--proof-yellow)",
                }}
              >
                {envHealth.filter((e) => e.status === "healthy").length}/{envHealth.length} healthy
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() =>
              window.open(
                "https://github.com/ruake/AWARE/actions/workflows/run-tests.yml",
                "_blank",
              )
            }
            className="proof-button-primary"
          >
            <Play size={12} /> Start Run <ExternalLink size={10} style={{ opacity: 0.7 }} />
          </button>
          <button onClick={() => navigate("/compare")} className="proof-button">
            <GitCompare size={12} /> Compare
          </button>
          <button onClick={() => navigate("/copilot")} className="proof-button">
            <Bot size={12} /> Copilot
          </button>
        </div>
      </div>

      {/* ── KPI metrics row ────────────────────────────────────── */}
      <div
        className="stagger"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        <MetricCard
          label="Total Runs"
          value={kpis.total}
          sub={
            <>
              <BarChart2 size={11} />
              all environments
            </>
          }
          accentColor="var(--proof-blue)"
          glow="rgba(0,122,204,0.08)"
          animDelay={0}
        />
        <MetricCard
          label="Pass Rate"
          value={`${kpis.passRate}%`}
          sub={
            <>
              <TrendIcon value={kpis.passTrend} />
              <span
                style={{
                  color:
                    kpis.passTrend > 0
                      ? "var(--proof-green)"
                      : kpis.passTrend < 0
                        ? "var(--proof-red)"
                        : "var(--proof-text-muted)",
                }}
              >
                {kpis.passTrend > 0 ? "+" : ""}
                {kpis.passTrend}% from prev
              </span>
            </>
          }
          accentColor={chartColor}
          glow={
            kpis.passRate >= 95
              ? "rgba(78,201,176,0.1)"
              : kpis.passRate >= 80
                ? "rgba(232,184,76,0.1)"
                : "rgba(244,71,71,0.1)"
          }
          animDelay={40}
        />
        <MetricCard
          label="Failed Runs"
          value={kpis.failedRuns}
          sub={
            kpis.failedRuns === 0
              ? <><CheckCircle2 size={11} style={{ color: "var(--proof-green)" }} /> all passing</>
              : <><XCircle size={11} style={{ color: "var(--proof-red)" }} /> <span style={{ color: "var(--proof-red)" }}>needs attention</span></>
          }
          accentColor={kpis.failedRuns > 0 ? "var(--proof-red)" : "var(--proof-green)"}
          glow={kpis.failedRuns > 0 ? "rgba(244,71,71,0.08)" : "rgba(78,201,176,0.06)"}
          onClick={kpis.failedRuns > 0 ? () => navigate("/runs") : undefined}
          animDelay={80}
        />
        <MetricCard
          label="Regressions"
          value={kpis.regressions}
          sub={
            kpis.regressions === 0
              ? <><CheckCircle2 size={11} style={{ color: "var(--proof-green)" }} /> no regressions</>
              : <><AlertTriangle size={11} style={{ color: "var(--proof-red)" }} /> <span style={{ color: "var(--proof-red)" }}>vs previous run</span></>
          }
          accentColor={kpis.regressions > 0 ? "var(--proof-red)" : "var(--proof-green)"}
          glow={kpis.regressions > 0 ? "rgba(244,71,71,0.08)" : "rgba(78,201,176,0.06)"}
          onClick={kpis.regressions > 0 ? () => navigate("/compare") : undefined}
          animDelay={120}
        />
      </div>

      {/* ── Environment Health ──────────────────────────────────── */}
      <div className="proof-section-card animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <SectionHeader
          title="Environment Health"
          badge={`${envHealth.length} envs`}
          collapsed={envCollapsed}
          onToggle={() => setEnvCollapsed((p) => !p)}
          accentColor="var(--proof-blue)"
          action={
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/runs");
              }}
              className="proof-button-ghost proof-button-sm"
            >
              View all <ChevronRight size={11} />
            </button>
          }
        />
        {!envCollapsed && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
            }}
          >
            {envHealth.map((env, i) => {
              const col = i % cols;
              const totalRows = Math.ceil(envHealth.length / cols);
              const row = Math.floor(i / cols);
              const isLastRow = row === totalRows - 1;
              return (
                <EnvCard
                  key={env.id}
                  {...env}
                  isLast={i === envHealth.length - 1}
                  col={col}
                  totalCols={cols}
                  isLastRow={isLastRow}
                  onClick={() =>
                    navigate(`/runs?env=${encodeURIComponent(env.label)}`)
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pass rate trend + Recent runs ──────────────────────── */}
      <div
        className="animate-fade-in-up"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 316px",
          gap: 14,
          animationDelay: "120ms",
        }}
      >
        {/* Trend chart */}
        <div className="proof-section-card">
          <SectionHeader
            title="Pass Rate Trend"
            badge="14 days"
            collapsed={chartCollapsed}
            onToggle={() => setChartCollapsed((p) => !p)}
            accentColor="var(--proof-green)"
            action={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/trends");
                }}
                className="proof-button-ghost proof-button-sm"
              >
                Full trends <ChevronRight size={11} />
              </button>
            }
          />
          {!chartCollapsed && (
            <div style={{ padding: "14px 10px 10px", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="passRateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke="var(--proof-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--proof-text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[Math.max(0, (kpis.passRate || 80) - 15), 100]}
                    tick={{ fontSize: 10, fill: "var(--proof-text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <ReferenceLine
                    y={95}
                    stroke="var(--proof-green)"
                    strokeDasharray="4 3"
                    strokeOpacity={0.4}
                    label={{ value: "95%", fontSize: 9, fill: "var(--proof-green)", opacity: 0.7, position: "insideTopRight" }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="passRate"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill="url(#passRateGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: chartColor, stroke: "var(--proof-surface)", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent runs */}
        <div className="proof-section-card">
          <SectionHeader
            title="Recent Runs"
            badge={filteredRuns.length}
            accentColor="var(--proof-purple)"
            action={
              <button
                onClick={() => navigate("/runs")}
                className="proof-button-ghost proof-button-sm"
              >
                All <ChevronRight size={11} />
              </button>
            }
          />
          <div style={{ overflowY: "auto", maxHeight: chartCollapsed ? "auto" : 236 }}>
            {recentRuns.map((run, i) => {
              const color =
                run.passPct >= 95
                  ? "var(--proof-green)"
                  : run.passPct >= 80
                    ? "var(--proof-yellow)"
                    : "var(--proof-red)";
              return (
                <div
                  key={run.id}
                  onClick={() => navigate(`/runs/${run.id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "9px 16px",
                    borderBottom: i < recentRuns.length - 1 ? "1px solid var(--proof-border)" : "none",
                    cursor: "pointer",
                    gap: 10,
                    transition: "background var(--proof-transition)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <span
                    className="proof-dot"
                    style={{ background: color, boxShadow: `0 0 0 2px ${color}22` }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--proof-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {run.id}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--proof-text-muted)", marginTop: 1 }}>
                      {run.env}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color,
                      letterSpacing: "-0.5px",
                      flexShrink: 0,
                    }}
                  >
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

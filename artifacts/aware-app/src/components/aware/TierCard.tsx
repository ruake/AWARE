import React from "react";
import { RUNS } from "@/lib/data";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
} from "lucide-react";

export interface TierEnv {
  id: string;
  label: string;
  passRate: number;
  trend: number;
  failures: number;
  status: "healthy" | "degraded" | "critical";
}

export interface TierGroup {
  tier: "QA" | "UAT" | "PROD";
  envs: TierEnv[];
  avgPassRate: number;
  status: "healthy" | "degraded" | "critical";
}

export function statusConfig(status: "healthy" | "degraded" | "critical") {
  if (status === "healthy")
    return {
      color: "var(--proof-green)",
      bright: "var(--proof-green-bright)",
      bg: "var(--proof-green-bg)",
      bgStrong: "var(--proof-green-bg-strong)",
      border: "var(--proof-green-border)",
      glow: "var(--proof-green-glow)",
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
      glow: "var(--proof-yellow-glow)",
      label: "Degraded",
      Icon: AlertTriangle,
    };
  return {
    color: "var(--proof-red)",
    bright: "var(--proof-red-bright)",
    bg: "var(--proof-red-bg)",
    bgStrong: "var(--proof-red-bg-strong)",
    border: "var(--proof-red-border)",
    glow: "var(--proof-red-glow)",
    label: "Critical",
    Icon: XCircle,
  };
}

function TrendBadge({ value }: { value: number }) {
  if (value > 0)
    return (
      <span style={{ color: "var(--proof-green)", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10.5 }}>
        <TrendingUp size={11} />+{value}%
      </span>
    );
  if (value < 0)
    return (
      <span style={{ color: "var(--proof-red)", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10.5 }}>
        <TrendingDown size={11} />{value}%
      </span>
    );
  return (
    <span style={{ color: "var(--proof-text-muted)", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10.5 }}>
      <Minus size={11} />—
    </span>
  );
}

/* SVG circular progress ring */
function RingGauge({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--proof-bar-track)"
        strokeWidth={5}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.4s ease" }}
        filter={`drop-shadow(0 0 4px ${color}60)`}
      />
      {/* Center label */}
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={pct >= 100 ? 13 : 14}
        fontWeight={800}
        fontFamily="var(--font-mono)"
        letterSpacing="-1"
      >
        {pct === 0 ? "--" : `${pct}%`}
      </text>
    </svg>
  );
}

const TIER_META: Record<string, { color: string; label: string }> = {
  QA: { color: "var(--proof-blue)", label: "Quality Assurance" },
  UAT: { color: "var(--proof-purple)", label: "User Acceptance" },
  PROD: { color: "var(--proof-green)", label: "Production" },
};

export function TierCard({
  group,
  onClick,
  index,
}: {
  group: TierGroup;
  onClick: () => void;
  index: number;
}) {
  const cfg = statusConfig(group.status);
  const { Icon } = cfg;
  const meta = TIER_META[group.tier] ?? { color: "var(--proof-blue)", label: group.tier };
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${group.tier} tier: ${group.avgPassRate}% avg pass rate, ${cfg.label}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        appearance: "none",
        textAlign: "left",
        width: "100%",
        background: hovered
          ? `linear-gradient(145deg, var(--proof-surface-2) 0%, ${cfg.glow} 100%)`
          : `linear-gradient(145deg, var(--proof-surface) 0%, ${meta.color}06 100%)`,
        border: `1px solid ${hovered ? cfg.border : "var(--proof-border)"}`,
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 180ms cubic-bezier(0.2,0,0,1)",
        boxShadow: hovered
          ? `0 0 0 1px ${cfg.border}, 0 12px 40px rgba(0,0,0,0.55), 0 0 32px ${cfg.glow}`
          : "0 0 0 1px rgba(99,130,178,0.1), 0 2px 12px rgba(0,0,0,0.4)",
        transform: hovered ? "translateY(-3px) scale(1.005)" : "none",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: 0,
        animation: `card-enter 0.4s cubic-bezier(0.2,0,0,1) ${120 + index * 80}ms both`,
      }}
    >
      {/* Top gradient stripe — tier color → status color */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${meta.color} 0%, ${cfg.color} 100%)`,
          opacity: hovered ? 1 : 0.75,
          transition: "opacity 180ms ease",
        }}
      />

      {/* Main header area */}
      <div style={{ padding: "16px 18px 14px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          {/* Left: tier badge + name + status pill */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {/* Tier badge */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${meta.color}28 0%, ${meta.color}14 100%)`,
                  border: `1px solid ${meta.color}35`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 0 12px ${meta.color}18`,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: meta.color,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {group.tier}
                </span>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "var(--proof-text)",
                    letterSpacing: "-0.3px",
                    lineHeight: 1.2,
                  }}
                >
                  {meta.label}
                </div>
                <div style={{ marginTop: 3 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 7px",
                      borderRadius: 99,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: cfg.color,
                      letterSpacing: "0.3px",
                    }}
                  >
                    <Icon size={9} />
                    {cfg.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: circular gauge */}
          <RingGauge pct={group.avgPassRate} color={cfg.color} size={64} />
        </div>

        {/* Full-width progress bar */}
        <div
          style={{
            height: 4,
            borderRadius: 99,
            background: "var(--proof-bar-track)",
            overflow: "hidden",
            marginTop: 4,
          }}
        >
          <div
            style={{
              width: `${group.avgPassRate}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${meta.color}80, ${cfg.color})`,
              borderRadius: 99,
              transition: "width 0.6s ease",
              boxShadow: group.avgPassRate >= 95 ? `0 0 6px ${cfg.glow}` : "none",
            }}
          />
        </div>
      </div>

      {/* Environment rows */}
      <div
        style={{
          borderTop: "1px solid var(--proof-border)",
          background: "rgba(0,0,0,0.12)",
        }}
      >
        {group.envs.map((env, i) => {
          const envCfg = statusConfig(env.status);
          const networkLabel = env.label.split(" / ")[1] ?? env.label;
          const last5 = RUNS.filter(r => r.env === env.id).slice(0, 5);

          return (
            <div
              key={env.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 18px",
                borderBottom:
                  i < group.envs.length - 1 ? "1px solid var(--proof-border-light)" : "none",
                transition: "background 100ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-hover-light)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
            >
              {/* Micro-sparkline */}
              <div style={{ display: 'flex', gap: 3, width: 42, flexShrink: 0 }}>
                {last5.map(r => (
                  <div
                    key={r.id}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: r.passPct >= 95 ? 'var(--proof-green)' : 'var(--proof-red)',
                      boxShadow: `0 0 4px ${r.passPct >= 95 ? 'var(--proof-green)' : 'var(--proof-red)'}40`
                    }}
                  />
                ))}
                {last5.length === 0 && <div style={{ fontSize: 9, color: 'var(--proof-text-muted)' }}>—</div>}
              </div>

              {/* Env status dot */}
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: envCfg.color,
                  flexShrink: 0,
                  boxShadow: env.status !== "healthy" ? `0 0 6px ${envCfg.color}` : "none",
                }}
              />

              {/* Network label */}
              <span
                style={{
                  fontSize: 11.5,
                  color: "var(--proof-text-secondary)",
                  flex: 0,
                  minWidth: 72,
                  fontWeight: 500,
                }}
              >
                {networkLabel}
              </span>

              {/* Progress bar */}
              <div
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 99,
                  background: "var(--proof-bar-track)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${env.passRate}%`,
                    height: "100%",
                    background: envCfg.color,
                    borderRadius: 99,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              {/* Pass rate */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: envCfg.bright,
                  letterSpacing: "-0.5px",
                  minWidth: 38,
                  textAlign: "right",
                }}
              >
                {env.passRate}%
              </span>

              {/* Failures */}
              {env.failures > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--proof-red-bright)",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    background: "var(--proof-red-bg)",
                    border: "1px solid var(--proof-red-border)",
                    borderRadius: 6,
                    padding: "1px 5px",
                  }}
                >
                  <XCircle size={9} />
                  {env.failures}
                </span>
              )}

              <TrendBadge value={env.trend} />
            </div>
          );
        })}
      </div>
    </button>
  );
}

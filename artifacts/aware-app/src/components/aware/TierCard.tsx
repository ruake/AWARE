import React from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

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
      <TrendingUp size={12} />+{value}%
    </span>
  );
  if (value < 0) return (
    <span style={{ color: "var(--proof-red)", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11 }}>
      <TrendingDown size={12} />{value}%
    </span>
  );
  return (
    <span style={{ color: "var(--proof-text-muted)", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11 }}>
      <Minus size={12} />—
    </span>
  );
}

export function TierCard({ group, onClick, index }: { group: TierGroup; onClick: () => void; index: number }) {
  const cfg = statusConfig(group.status);
  const { Icon } = cfg;

  const TIER_COLORS: Record<string, string> = {
    QA: "var(--proof-blue)",
    UAT: "var(--proof-purple)",
    PROD: "var(--proof-green)",
  };
  const tierColor = TIER_COLORS[group.tier] ?? "var(--proof-blue)";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${group.tier} tier: ${group.avgPassRate}% avg pass rate, ${cfg.label}`}
      style={{
        appearance: "none",
        textAlign: "left",
        width: "100%",
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
        padding: 0,
        animation: `card-enter 0.35s cubic-bezier(0.2,0,0,1) ${120 + index * 80}ms both`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = cfg.border;
        el.style.boxShadow = `var(--proof-shadow-card-hover), 0 0 24px ${cfg.glow}`;
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--proof-border)";
        el.style.boxShadow = "var(--proof-shadow-card)";
        el.style.transform = "";
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(0) scale(0.985)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${tierColor}, ${cfg.color})`,
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 80% 0%, ${cfg.glow} 0%, transparent 55%)`,
        opacity: 0.6,
      }} />
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
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.2px" }}>
              {group.tier === "QA" ? "Quality Assurance" : group.tier === "UAT" ? "User Acceptance" : "Production"}
            </span>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "2px 8px", borderRadius: "var(--proof-radius-full)",
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: "0.1px",
          }}>
            <Icon size={10} />{cfg.label}
          </span>
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "flex-end", gap: 8 }}>
          <span className="proof-hero-number" style={{ fontSize: 30, color: cfg.bright }}>
            {group.avgPassRate}%
          </span>
          <span style={{ fontSize: 10, color: "var(--proof-text-muted)", marginBottom: 3 }}>
            avg pass rate
          </span>
        </div>
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
                transition: "background var(--proof-transition-fast)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-hover-light)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
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
                  <XCircle size={12} />{env.failures}
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

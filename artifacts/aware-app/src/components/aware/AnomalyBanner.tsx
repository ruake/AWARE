import React from "react";
import { AlertTriangle, AlertCircle, X, ArrowRight } from "lucide-react";

interface AnomalyBannerProps {
  hasAlert: boolean;
  hasDegradation: boolean;
  regressions: number;
  degradedTiers: string;
  onInvestigate: () => void;
  onDismiss?: () => void;
}

export function AnomalyBanner({
  hasAlert,
  hasDegradation,
  regressions,
  degradedTiers,
  onInvestigate,
  onDismiss,
}: AnomalyBannerProps) {
  if (!hasAlert && !hasDegradation) return null;
  const isCritical = hasAlert;

  const color = isCritical ? "var(--proof-red)" : "var(--proof-yellow)";
  const colorBright = isCritical ? "var(--proof-red-bright)" : "var(--proof-yellow-bright)";
  const colorBg = isCritical ? "var(--proof-red-bg-strong)" : "var(--proof-yellow-bg)";
  const colorBorder = isCritical ? "var(--proof-red-border)" : "var(--proof-yellow-border)";
  const colorIconBg = isCritical ? "var(--proof-red-bg)" : "var(--proof-yellow-bg)";
  const Icon = isCritical ? AlertCircle : AlertTriangle;

  const message = isCritical
    ? regressions > 0
      ? `${regressions} regression${regressions !== 1 ? "s" : ""} detected — immediate action required`
      : "Critical environment failure — pass rate below minimum threshold"
    : `${degradedTiers} degraded — pass rate below promotion gate`;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={isCritical ? "animate-anomaly-glow" : "animate-slide-down"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 16px",
        borderRadius: "var(--proof-radius-lg)",
        background: colorBg,
        border: `1px solid ${colorBorder}`,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: colorIconBg,
          border: `1px solid ${colorBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={15} style={{ color: colorBright }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: colorBright,
            lineHeight: 1.4,
          }}
        >
          {message}
        </div>
        {isCritical && regressions > 0 && (
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>
            Review the Compare page to identify affected tests and determine root cause.
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
        <button
          onClick={onInvestigate}
          className="proof-button-primary proof-button-sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          Investigate <ArrowRight size={11} />
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss banner"
            style={{
              background: colorIconBg,
              border: `1px solid ${colorBorder}`,
              borderRadius: 6,
              cursor: "pointer",
              padding: "5px 6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colorBright,
              transition: "background 0.15s, opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = colorBorder;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = colorIconBg;
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

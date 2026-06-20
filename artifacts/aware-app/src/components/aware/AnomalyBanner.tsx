import React from "react";
import { AlertTriangle } from "lucide-react";

interface AnomalyBannerProps {
  hasAlert: boolean;
  hasDegradation: boolean;
  regressions: number;
  degradedTiers: string;
  onInvestigate: () => void;
}

export function AnomalyBanner({
  hasAlert,
  hasDegradation,
  regressions,
  degradedTiers,
  onInvestigate,
}: AnomalyBannerProps) {
  if (!hasAlert && !hasDegradation) return null;
  const isCritical = hasAlert;
  return (
    <div
      role="alert"
      className={isCritical ? "animate-anomaly-glow" : "animate-slide-down"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: "var(--proof-radius-lg)",
        background: isCritical ? "var(--proof-red-bg-strong)" : "var(--proof-yellow-bg)",
        border: `1px solid ${isCritical ? "var(--proof-red-border)" : "var(--proof-yellow-border)"}`,
        borderLeft: `4px solid ${isCritical ? "var(--proof-red)" : "var(--proof-yellow)"}`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: isCritical ? "rgba(248,68,90,0.15)" : "rgba(245,158,11,0.15)",
          border: `1px solid ${isCritical ? "rgba(248,68,90,0.30)" : "rgba(245,158,11,0.30)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AlertTriangle
          size={16}
          style={{ color: isCritical ? "var(--proof-red-bright)" : "var(--proof-yellow-bright)" }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: isCritical ? "var(--proof-red-bright)" : "var(--proof-yellow-bright)",
          }}
        >
          {isCritical
            ? `${regressions > 0 ? `${regressions} regression${regressions !== 1 ? "s" : ""}` : "Critical environment"} detected`
            : `${degradedTiers} degraded — pass rate below threshold`}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={onInvestigate}
          className="proof-button-primary proof-button-sm"
          style={{ color: "#fff" }}
        >
          Investigate →
        </button>
      </div>
    </div>
  );
}

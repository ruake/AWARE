import React from "react";
import { useRuns, useSelectedEnv } from "@/lib/hooks/useData";
import { getEnvConfigs } from "@/lib/envConfig";
import { Wifi, WifiOff } from "lucide-react";

export function StatusBar() {
  const runs = useRuns();
  const { envIds, isAll } = useSelectedEnv();

  const totalRuns = runs.length;
  const envConfigs = getEnvConfigs();

  const activeEnvLabel = React.useMemo(() => {
    if (isAll) return "ALL ENVIRONMENTS";
    const labels = envConfigs.filter((c) => envIds.includes(c.id)).map((c) => c.label);
    if (labels.length === 0) return "ALL ENVIRONMENTS";
    if (labels.length === 1) return labels[0].toUpperCase();
    return `${labels[0].toUpperCase()} + ${labels.length - 1} MORE`;
  }, [envIds, isAll, envConfigs]);

  const passPct = React.useMemo(() => {
    if (totalRuns === 0) return 0;
    return Math.round(runs.reduce((s, r) => s + (r.passPct ?? 0), 0) / totalRuns);
  }, [runs, totalRuns]);

  const failedRuns = React.useMemo(() => runs.filter((r) => (r.failures ?? 0) > 0).length, [runs]);

  const healthState =
    passPct >= 95 ? "healthy" : passPct >= 80 ? "degraded" : passPct > 0 ? "critical" : "unknown";

  const healthColor =
    healthState === "healthy"
      ? "var(--proof-green)"
      : healthState === "degraded"
        ? "var(--proof-yellow)"
        : healthState === "critical"
          ? "var(--proof-red)"
          : "var(--proof-text-muted)";

  return (
    <footer
      style={{
        height: 22,
        minHeight: 22,
        background: "var(--proof-status-bar-bg)",
        color: "var(--proof-text-muted)",
        display: "flex",
        alignItems: "center",
        paddingLeft: 8,
        paddingRight: 8,
        fontSize: 10,
        gap: 0,
        flexShrink: 0,
        userSelect: "none",
        fontFamily: "var(--font-mono)",
        borderTop: "1px solid var(--proof-border-strong)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Health bar underline */}
      {totalRuns > 0 && (
        <span
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 1,
            width: `${passPct}%`,
            background: `linear-gradient(90deg, ${healthColor}80, ${healthColor}30)`,
            transition: "width 1s ease, background 0.5s ease",
          }}
        />
      )}

      {/* Left — env + status */}
      <StatusChip>
        <div
          style={{
            position: "relative",
            width: 6,
            height: 6,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: healthColor,
              opacity: healthState !== "unknown" ? 0.4 : 0,
              animation: healthState === "healthy" ? "none" : "pulse-dot 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              position: "relative",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: healthColor,
              boxShadow: healthState !== "unknown" ? `0 0 6px ${healthColor}` : "none",
            }}
          />
        </div>
        <span style={{ color: "var(--proof-text)" }}>{activeEnvLabel}</span>
      </StatusChip>

      <div style={{ flex: 1 }} />

      {/* Right cluster */}
      {totalRuns > 0 && (
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          <StatusChip>
            <span style={{ color: "var(--proof-text)" }}>{totalRuns}</span> RUNS
          </StatusChip>

          {passPct > 0 && (
            <StatusChip
              style={{
                color: healthColor,
              }}
            >
              {healthState === "healthy" ? (
                <Wifi size={10} aria-hidden="true" style={{ opacity: 0.8 }} />
              ) : (
                <WifiOff size={10} aria-hidden="true" style={{ opacity: 0.8 }} />
              )}
              {passPct}% PASS
            </StatusChip>
          )}

          {failedRuns > 0 && (
            <StatusChip
              style={{
                color: "var(--proof-red)",
              }}
            >
              <span style={{ fontSize: 10, marginRight: 2 }}>✕</span> {failedRuns} FAILED
            </StatusChip>
          )}
        </div>
      )}

      <StatusChip style={{ opacity: 0.5, borderRight: "none" }}>
        AWARE_V1.0
      </StatusChip>
    </footer>
  );
}

function StatusChip({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "0 10px",
        height: "100%",
        borderRight: "1px solid var(--proof-border-strong)",
        transition: "color 0.3s ease",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

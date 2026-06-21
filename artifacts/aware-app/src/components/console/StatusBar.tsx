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
    if (isAll) return "All environments";
    const labels = envConfigs.filter((c) => envIds.includes(c.id)).map((c) => c.label);
    if (labels.length === 0) return "All environments";
    if (labels.length === 1) return labels[0];
    return `${labels[0]} + ${labels.length - 1} more`;
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

  const healthBg =
    healthState === "healthy"
      ? "rgba(34,211,160,0.06)"
      : healthState === "degraded"
        ? "rgba(245,158,11,0.06)"
        : healthState === "critical"
          ? "rgba(248,68,90,0.06)"
          : "transparent";

  return (
    <footer
      style={{
        height: 26,
        minHeight: 26,
        background: "var(--proof-status-bar-bg)",
        color: "var(--proof-status-bar-text)",
        display: "flex",
        alignItems: "center",
        paddingLeft: 12,
        paddingRight: 12,
        fontSize: 11,
        gap: 0,
        flexShrink: 0,
        userSelect: "none",
        fontFamily: "var(--font-sans)",
        borderTop: "1px solid var(--proof-border)",
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
            height: 2,
            width: `${passPct}%`,
            background: `linear-gradient(90deg, ${healthColor}80, ${healthColor}30)`,
            transition: "width 1s ease, background 0.5s ease",
            borderRadius: "0 99px 0 0",
          }}
        />
      )}

      {/* Left — env + status */}
      <StatusChip>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: healthColor,
            boxShadow: healthState !== "unknown" ? `0 0 6px ${healthColor}` : "none",
            display: "inline-block",
            flexShrink: 0,
            animation: healthState === "healthy" ? "none" : "badge-pulse 2s ease-in-out infinite",
          }}
        />
        {activeEnvLabel}
      </StatusChip>

      <div style={{ flex: 1 }} />

      {/* Right cluster */}
      {totalRuns > 0 && (
        <>
          <StatusChip>
            <span style={{ opacity: 0.5, marginRight: 2 }}>⬡</span>
            {totalRuns} run{totalRuns !== 1 ? "s" : ""}
          </StatusChip>

          {passPct > 0 && (
            <StatusChip
              style={{
                background: healthBg,
                color: healthColor,
                fontWeight: 600,
                borderLeft: "1px solid var(--proof-border)",
              }}
            >
              {healthState === "healthy" ? (
                <Wifi size={9} aria-hidden="true" />
              ) : (
                <WifiOff size={9} aria-hidden="true" />
              )}
              {passPct}% pass
            </StatusChip>
          )}

          {failedRuns > 0 && (
            <StatusChip
              style={{
                color: "var(--proof-red-bright)",
                background: "rgba(248,68,90,0.07)",
                borderLeft: "1px solid var(--proof-border)",
              }}
            >
              ✕ {failedRuns} failed
            </StatusChip>
          )}
        </>
      )}

      {/* Version tag */}
      <StatusChip style={{ opacity: 0.35, borderLeft: "1px solid var(--proof-border)" }}>
        v1.0
      </StatusChip>
    </footer>
  );
}

function StatusItem({
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
        gap: 5,
        padding: "0 8px",
        opacity: 0.9,
        borderRight: "1px solid var(--proof-border)",
        height: "100%",
        ...style,
      }}
    >
      {children}
    </span>
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
        gap: 4,
        padding: "0 10px",
        height: "100%",
        borderRight: "1px solid var(--proof-border)",
        fontSize: 10.5,
        transition: "color 0.3s ease",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export { StatusItem };

import React from "react";
import { useRuns, useSelectedEnv } from "@/lib/hooks/useData";
import { getEnvConfigs } from "@/lib/envConfig";

export function StatusBar() {
  const runs = useRuns();
  const { envIds, isAll } = useSelectedEnv();

  const totalRuns = runs.length;
  const envConfigs = getEnvConfigs();

  const activeEnvLabel = React.useMemo(() => {
    if (isAll) return "All environments";
    const labels = envConfigs
      .filter((c) => envIds.includes(c.id))
      .map((c) => c.label);
    if (labels.length === 0) return "All environments";
    if (labels.length === 1) return labels[0];
    return `${labels[0]} + ${labels.length - 1} more`;
  }, [envIds, isAll, envConfigs]);

  const passPct = React.useMemo(() => {
    if (totalRuns === 0) return 0;
    return Math.round(runs.reduce((s, r) => s + (r.passPct ?? 0), 0) / totalRuns);
  }, [runs, totalRuns]);

  const failedRuns = React.useMemo(
    () => runs.filter((r) => (r.failures ?? 0) > 0).length,
    [runs],
  );

  const statusColor =
    passPct >= 95
      ? "var(--proof-green)"
      : passPct >= 80
        ? "var(--proof-yellow)"
        : "var(--proof-red)";

  return (
    <footer
      style={{
        height: "var(--proof-status-bar-height)",
        minHeight: "var(--proof-status-bar-height)",
        background: "var(--proof-status-bar-bg)",
        color: "var(--proof-status-bar-text)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        fontSize: 11.5,
        gap: 0,
        flexShrink: 0,
        userSelect: "none",
        fontFamily: "var(--font-sans)",
        borderTop: "1px solid var(--proof-border)",
      }}
    >
      <StatusItem>{activeEnvLabel}</StatusItem>

      <div style={{ flex: 1 }} />

      {totalRuns > 0 && (
        <>
          <StatusItem>
            {totalRuns} run{totalRuns !== 1 ? "s" : ""}
          </StatusItem>

          {passPct > 0 && (
            <StatusItem>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: statusColor,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              {passPct}% pass
            </StatusItem>
          )}

          {failedRuns > 0 && (
            <StatusItem style={{ color: "var(--proof-red-bright)" }}>
              {failedRuns} failed
            </StatusItem>
          )}
        </>
      )}
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

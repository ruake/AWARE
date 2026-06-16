import React from "react";
import { useSyncExternalStore } from "react";
import { RUNS } from "@/lib/runs";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { getSelectedSuiteSnapshot, subscribeToSelectedSuites } from "@/lib/filters";
import { getEnvConfigs } from "@/lib/envConfig";

export function StatusBar() {
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const suiteSnap = useSyncExternalStore(subscribeToSelectedSuites, getSelectedSuiteSnapshot);

  const totalRuns = RUNS.length;
  const envConfigs = getEnvConfigs();
  const activeEnvLabels =
    envSnap.envIds.length > 0
      ? envConfigs
          .filter((c) => envSnap.envIds.includes(c.id))
          .map((c) => c.label)
          .join(", ")
      : "All environments";

  const passPct =
    totalRuns > 0 ? Math.round(RUNS.reduce((s, r) => s + (r.passPct ?? 0), 0) / totalRuns) : 0;

  const failedRuns = RUNS.filter((r) => (r.passPct ?? 100) < 90).length;

  return (
    <footer
      style={{
        height: "var(--proof-status-bar-height)",
        minHeight: "var(--proof-status-bar-height)",
        background: "var(--proof-status-bar-bg)",
        color: "var(--proof-status-bar-text)",
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
        fontSize: 12,
        gap: 12,
        flexShrink: 0,
        userSelect: "none",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Left section */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <span style={{ opacity: 0.9 }}>{totalRuns} runs</span>
        {suiteSnap.suiteIds.length > 0 && (
          <span style={{ opacity: 0.7, fontSize: 11 }}>
            {suiteSnap.suiteIds.length} suite{suiteSnap.suiteIds.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Right section */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {passPct > 0 && (
          <span style={{ opacity: 0.9, display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background:
                  passPct >= 95
                    ? "var(--proof-green)"
                    : passPct >= 80
                      ? "var(--proof-yellow)"
                      : "var(--proof-red)",
                flexShrink: 0,
              }}
            />
            {passPct}% pass
          </span>
        )}
        {failedRuns > 0 && (
          <span style={{ opacity: 0.9, color: "#ffb0b0" }}>{failedRuns} failed</span>
        )}
        <span style={{ opacity: 0.6, fontSize: 11 }}>{activeEnvLabels}</span>
      </div>
    </footer>
  );
}

import React from "react";
import { useSyncExternalStore } from "react";
import {
  getAutoRefreshState,
  subscribeToAutoRefresh,
  startAutoRefresh,
  stopAutoRefresh,
} from "@/lib/autoRefresh";

function formatTime(s: number): string {
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s ago`;
}

export function LiveIndicator() {
  const state = useSyncExternalStore(subscribeToAutoRefresh, getAutoRefreshState);
  const [, triggerRender] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => triggerRender(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const secondsAgo = state.lastUpdate
    ? Math.floor((now - state.lastUpdate.getTime()) / 1000)
    : null;

  const isActive = state.enabled;

  return (
    <button
      onClick={() => {
        if (isActive) {
          import("@/lib/initData").then((m) => m.loadAllData(true));
        } else {
          startAutoRefresh();
        }
      }}
      title={
        isActive
          ? `Live updates active. Click to force refresh.`
          : `Polling paused. Click to resume.`
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: "var(--proof-radius-sm)",
        border: "1px solid var(--proof-border)",
        background: "transparent",
        cursor: "pointer",
        color: "var(--proof-text-muted)",
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        transition: "all 120ms ease",
        flexShrink: 0,
        height: 28,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--proof-blue-border)";
        el.style.color = "var(--proof-text)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--proof-border)";
        el.style.color = "var(--proof-text-muted)";
      }}
    >
      <span
        className={isActive ? "proof-live-dot" : "proof-live-dot proof-live-dot-warning"}
        style={{
          width: 6,
          height: 6,
          minWidth: 6,
          display: "inline-block",
          background: isActive ? "var(--proof-green)" : "var(--proof-grey)",
          animation: isActive ? "pulse-dot 1.5s ease-in-out infinite" : "none",
        }}
      />
      <span>
        {secondsAgo !== null ? formatTime(secondsAgo) : "waiting..."}
      </span>
    </button>
  );
}

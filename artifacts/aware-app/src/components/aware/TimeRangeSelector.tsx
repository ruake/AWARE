import React, { useSyncExternalStore } from "react";
import {
  getTimeRange,
  setTimeRange,
  subscribeToTimeRange,
  getPresetLabels,
} from "@/lib/timeRange";
import type { PresetRange } from "@/lib/timeRange";

const PRESET_LABELS: Record<PresetRange, string> = {
  "1h": "1H",
  "6h": "6H",
  "24h": "24H",
  "7d": "7D",
  "14d": "14D",
  "30d": "30D",
  "90d": "90D",
  all: "ALL",
};

export function TimeRangeSelector() {
  const range = useSyncExternalStore(subscribeToTimeRange, getTimeRange);
  const presets = getPresetLabels();

  return (
    <div
      role="group"
      aria-label="Time range"
      style={{
        display: "flex",
        gap: 4,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        padding: "2px",
        background: "var(--proof-surface-2)",
        borderRadius: "var(--proof-radius-full)",
        border: "1px solid var(--proof-border)",
        flexShrink: 0,
      }}
    >
      {presets.map((preset) => {
        const active = range.preset === preset;
        return (
          <button
            key={preset}
            onClick={() => setTimeRange(preset)}
            aria-pressed={active}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 14px",
              borderRadius: "var(--proof-radius-full)",
              cursor: "pointer",
              border: `1px solid ${active ? "var(--proof-blue-border)" : "transparent"}`,
              background: active ? "var(--proof-blue-bg)" : "transparent",
              color: active ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
              fontSize: "12px",
              fontWeight: active ? 700 : 600,
              boxShadow: active ? "var(--proof-glow-cyan)" : "none",
              transition: "all var(--proof-transition)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = "var(--proof-surface-hover)";
                e.currentTarget.style.color = "var(--proof-text)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--proof-text-secondary)";
              }
            }}
          >
            {PRESET_LABELS[preset]}
          </button>
        );
      })}
    </div>
  );
}

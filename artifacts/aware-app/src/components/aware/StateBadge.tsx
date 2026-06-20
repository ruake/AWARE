import React from "react";
import type { DiffRow } from "@/lib/types";

const STATE_MAP: Record<string, { color: string; label: string }> = {
  regression: { color: "var(--proof-red)", label: "Regression" },
  fixed: { color: "var(--proof-green)", label: "Fixed" },
  duration: { color: "var(--proof-yellow)", label: "Duration ↑" },
  unchanged: { color: "var(--proof-text-secondary)", label: "Unchanged" },
  fishy: { color: "var(--proof-purple)", label: "Fishy ⚠" },
};

export function StateBadge({ state }: { state: DiffRow["state"] }) {
  const s = STATE_MAP[state] ?? { color: "var(--proof-text-secondary)", label: state };
  return <span style={{ fontSize: 11, fontWeight: 600, color: s.color }} aria-label={s.label}>{s.label}</span>;
}

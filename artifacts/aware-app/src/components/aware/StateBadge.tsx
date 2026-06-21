import React from "react";
import type { DiffRow } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Check, Minus, Clock } from "lucide-react";

const STATE_MAP: Record<string, { color: string; label: string; icon: LucideIcon }> = {
  regression: { color: "var(--proof-red)", label: "Regression", icon: AlertTriangle },
  fixed: { color: "var(--proof-green)", label: "Fixed", icon: Check },
  duration: { color: "var(--proof-yellow)", label: "Duration ↑", icon: Clock },
  unchanged: { color: "var(--proof-text-secondary)", label: "Unchanged", icon: Minus },
  fishy: { color: "var(--proof-purple)", label: "Fishy ⚠", icon: AlertTriangle },
};

export function StateBadge({ state }: { state: DiffRow["state"] }) {
  const s = STATE_MAP[state] ?? {
    color: "var(--proof-text-secondary)",
    label: state,
    icon: Minus,
  };
  const Icon = s.icon;

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: s.color,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
      aria-label={s.label}
      title={s.label}
    >
      <Icon size={12} />
      {s.label}
    </span>
  );
}

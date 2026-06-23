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
  const isRegression = state === "regression";
  const isFixed = state === "fixed";
  const glow = isRegression ? "var(--proof-glow-red)" : isFixed ? "var(--proof-glow-green)" : "none";
  const bg = isRegression ? "var(--proof-red-bg)" : isFixed ? "var(--proof-green-bg)" : "var(--proof-surface-2)";

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 800,
        fontFamily: "var(--font-mono)",
        color: s.color,
        background: bg,
        padding: "4px 8px",
        borderRadius: 4,
        border: `1px solid ${s.color}40`,
        boxShadow: glow,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
      aria-label={s.label}
      title={s.label}
    >
      <Icon size={12} />
      {s.label}
    </span>
  );
}

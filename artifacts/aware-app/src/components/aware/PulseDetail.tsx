import React from "react";
import {
  Check,
  X,
  AlertTriangle,
  Loader2,
  Clock,
} from "lucide-react";
import type { Run } from "@/lib/types";

const STATUS_CONFIG: Record<
  Run["status"],
  {
    label: string;
    color: string;
    bg: string;
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  }
> = {
  PASS: { label: "Passed", color: "var(--proof-green)", bg: "var(--proof-green-bg)", icon: Check },
  FAIL: { label: "Failed", color: "var(--proof-red)", bg: "var(--proof-red-bg)", icon: X },
  PARTIAL: {
    label: "Partial",
    color: "var(--proof-yellow)",
    bg: "var(--proof-yellow-bg)",
    icon: AlertTriangle,
  },
  FLAKY: {
    label: "Flaky",
    color: "var(--proof-orange)",
    bg: "var(--proof-orange-bg)",
    icon: AlertTriangle,
  },
  RUNNING: {
    label: "Running",
    color: "var(--proof-blue)",
    bg: "var(--proof-blue-bg)",
    icon: Loader2,
  },
  PENDING: {
    label: "Pending",
    color: "var(--proof-text-secondary)",
    bg: "rgba(126,138,158,0.10)",
    icon: Clock,
  },
  ERROR: { label: "Error", color: "var(--proof-red)", bg: "var(--proof-red-bg)", icon: X },
};

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function StatusBadge({ status }: { status: Run["status"] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
      }}
    >
      <Icon
        size={11}
        style={status === "RUNNING" ? { animation: "spin 1s linear infinite" } : undefined}
      />
      {cfg.label}
    </span>
  );
}

export function RunRow({ run, onClick }: { run: Run; onClick: (id: string) => void }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <tr
      onClick={() => onClick(run.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        background: hovered ? "rgba(255,255,255,0.025)" : undefined,
        transition: "background 0.1s ease",
      }}
    >
      {/* Workflow: label + short ID */}
      <td style={{ verticalAlign: "middle" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--proof-text)",
            }}
          >
            {run.label}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--proof-text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {run.id.slice(-12)}
          </span>
        </div>
      </td>
      {/* Status */}
      <td style={{ verticalAlign: "middle" }}>
        <StatusBadge status={run.status} />
      </td>
      {/* Pass % */}
      <td style={{ verticalAlign: "middle" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 700,
            color:
              run.passPct === 100
                ? "var(--proof-green)"
                : run.passPct < 90
                  ? "var(--proof-red)"
                  : "var(--proof-text)",
          }}
        >
          {run.passPct}%
        </span>
      </td>
      {/* Suite · Env */}
      <td style={{ verticalAlign: "middle" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {run.suiteId}
          </span>
          <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
            {run.env}
            {run.network && (
              <span
                style={{
                  marginLeft: 5,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color:
                    run.network === "production" ? "var(--proof-green)" : "var(--proof-yellow)",
                  background:
                    run.network === "production"
                      ? "var(--proof-green-bg)"
                      : "var(--proof-yellow-bg)",
                  padding: "1px 4px",
                  borderRadius: 3,
                }}
              >
                {run.network}
              </span>
            )}
          </span>
        </div>
      </td>
      {/* Duration */}
      <td style={{ verticalAlign: "middle" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--proof-text-secondary)",
          }}
        >
          {formatDuration(run.durationMs)}
        </span>
      </td>
      {/* When */}
      <td style={{ verticalAlign: "middle" }}>
        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
          {timeAgo(run.started)}
        </span>
      </td>
      {/* Build */}
      <td style={{ verticalAlign: "middle" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--proof-text-secondary)",
            background: "var(--proof-grey-bg)",
            border: "1px solid var(--proof-border)",
            padding: "2px 6px",
            borderRadius: 3,
          }}
        >
          {run.build?.slice(0, 7) || "—"}
        </span>
      </td>
    </tr>
  );
}

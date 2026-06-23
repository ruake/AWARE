import React from "react";

type StatusType =
  | "PASS"
  | "FAIL"
  | "FLAKY"
  | "WARNING"
  | "SKIP"
  | "RUNNING"
  | "PARTIAL"
  | "ERROR"
  | "PENDING"
  | "TIMEOUT"
  | "CANCELLED"
  | "DISABLED";

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  icon?: React.ReactNode;
  size?: "xs" | "sm" | "md";
}

const STATUS_MAP: Record<string, string> = {
  PASS: "proof-badge-pass",
  FAIL: "proof-badge-fail",
  FLAKY: "proof-badge-flaky",
  WARNING: "proof-badge-warning",
  SKIP: "proof-badge-skip",
  RUNNING: "proof-badge-running",
  PARTIAL: "proof-badge-partial",
  ERROR: "proof-badge-error",
  PENDING: "proof-badge-pending",
  TIMEOUT: "proof-badge-timeout",
  CANCELLED: "proof-badge-skip",
  DISABLED: "proof-badge-skip",
  SUCCESS: "proof-badge-pass",
  REGRESSION: "proof-badge-fail",
};

const STATUS_DISPLAY: Record<string, string> = {
  PASS: "Pass",
  FAIL: "Fail",
  FLAKY: "Flaky",
  WARNING: "Warning",
  SKIP: "Skip",
  RUNNING: "Running",
  PARTIAL: "Partial",
  ERROR: "Error",
  PENDING: "Pending",
  TIMEOUT: "Timeout",
  CANCELLED: "Cancelled",
  DISABLED: "Disabled",
  SUCCESS: "Success",
  REGRESSION: "Regression",
};

export const StatusBadge = React.memo(function StatusBadge({
  status,
  label,
  icon,
  size = "sm",
}: StatusBadgeProps) {
  const key = String(status).toUpperCase();
  const cls = STATUS_MAP[key] ?? "proof-badge-skip";
  const display = label ?? STATUS_DISPLAY[key] ?? status;

  const sizeStyles: Record<string, React.CSSProperties> = {
    xs: { fontSize: 10, padding: "2px 6px" },
    sm: { fontSize: 11, padding: "4px 8px" },
    md: { fontSize: 12, padding: "6px 12px" },
  };

  const getGlowStyle = (key: string) => {
    switch (key) {
      case "PASS": return { boxShadow: "0 0 12px rgba(0, 229, 160, 0.4)", borderColor: "rgba(0, 229, 160, 0.8)", background: "rgba(0, 229, 160, 0.15)", color: "#00e5a0" };
      case "SUCCESS": return { boxShadow: "0 0 12px rgba(0, 229, 160, 0.4)", borderColor: "rgba(0, 229, 160, 0.8)", background: "rgba(0, 229, 160, 0.15)", color: "#00e5a0" };
      case "FAIL": return { boxShadow: "0 0 12px rgba(255, 51, 85, 0.4)", borderColor: "rgba(255, 51, 85, 0.8)", background: "rgba(255, 51, 85, 0.15)", color: "#ff3355" };
      case "ERROR": return { boxShadow: "0 0 12px rgba(255, 51, 85, 0.4)", borderColor: "rgba(255, 51, 85, 0.8)", background: "rgba(255, 51, 85, 0.15)", color: "#ff3355" };
      case "REGRESSION": return { boxShadow: "0 0 12px rgba(255, 51, 85, 0.4)", borderColor: "rgba(255, 51, 85, 0.8)", background: "rgba(255, 51, 85, 0.15)", color: "#ff3355" };
      case "FLAKY": return { boxShadow: "0 0 12px rgba(245, 158, 11, 0.4)", borderColor: "rgba(245, 158, 11, 0.8)", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" };
      case "WARNING": return { boxShadow: "0 0 12px rgba(245, 158, 11, 0.4)", borderColor: "rgba(245, 158, 11, 0.8)", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" };
      case "RUNNING": return { boxShadow: "0 0 16px rgba(0, 196, 255, 0.6)", borderColor: "rgba(0, 196, 255, 0.8)", background: "rgba(0, 196, 255, 0.15)", color: "#00c4ff", animation: "pulse-glow 2s infinite" };
      case "PARTIAL": return { boxShadow: "0 0 12px rgba(245, 158, 11, 0.4)", borderColor: "rgba(245, 158, 11, 0.8)", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" };
      default: return { boxShadow: "0 0 12px rgba(255, 255, 255, 0.1)", borderColor: "rgba(255, 255, 255, 0.3)", background: "rgba(255, 255, 255, 0.05)", color: "var(--proof-text-secondary)" };
    }
  };

  const glowStyle = getGlowStyle(key);

  return (
    <span
      className={`proof-badge ${cls}`}
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontWeight: 800,
        letterSpacing: "0.05em",
        border: "1px solid",
        ...sizeStyles[size],
        ...glowStyle
      }}
      aria-label={`${display} status`}
      aria-live="polite"
      aria-atomic="true"
    >
      {key === "RUNNING" && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "currentColor",
            marginRight: 6,
            animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            boxShadow: "0 0 8px currentColor"
          }}
          aria-hidden="true"
        />
      )}
      {icon && <span style={{ marginRight: 6, display: "flex", alignItems: "center" }} aria-hidden="true">{icon}</span>}
      {display.toUpperCase()}
    </span>
  );
});

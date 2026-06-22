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
    xs: { fontSize: 9, padding: "1px 4px" },
    sm: { fontSize: 11, padding: "2px 6px" },
    md: { fontSize: 12, padding: "3px 8px" },
  };

  return (
    <span
      className={`proof-badge ${cls}`}
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        ...sizeStyles[size],
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
            marginRight: 4,
            animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
          aria-hidden="true"
        />
      )}
      {icon && <span style={{ marginRight: 4, display: "flex", alignItems: "center" }} aria-hidden="true">{icon}</span>}
      {display}
    </span>
  );
});

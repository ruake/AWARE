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
  TIMEOUT: "proof-badge-error",
  CANCELLED: "proof-badge-skip",
  DISABLED: "proof-badge-skip",
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
};

export const StatusBadge = React.memo(function StatusBadge({ status, label }: StatusBadgeProps) {
  const key = String(status).toUpperCase();
  const cls = STATUS_MAP[key] ?? "proof-badge-skip";
  const display = label ?? STATUS_DISPLAY[key] ?? status;
  return (
    <span
      className={`proof-badge ${cls}`}
      aria-label={display}
      aria-live="polite"
      aria-atomic="true"
    >
      {display}
    </span>
  );
});

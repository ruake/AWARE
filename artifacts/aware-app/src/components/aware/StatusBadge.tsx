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
  | "PENDING";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const STATUS_MAP: Record<string, string> = {
  PASS: "proof-badge-pass",
  FAIL: "proof-badge-fail",
  FLAKY: "proof-badge-flaky",
  WARNING: "proof-badge-flaky",
  SKIP: "proof-badge-skip",
  RUNNING: "proof-badge-running",
  PARTIAL: "proof-badge-partial",
  ERROR: "proof-badge-error",
  PENDING: "proof-badge-skip",
};

export const StatusBadge = React.memo(function StatusBadge({ status, label }: StatusBadgeProps) {
  const cls = STATUS_MAP[status] ?? "proof-badge-skip";
  return (
    <span
      className={`proof-badge ${cls}`}
      aria-label={label ?? status}
      aria-live="polite"
      aria-atomic="true"
    >
      {label ?? status}
    </span>
  );
});

import React from "react";

type StatusType = "PASS" | "FAIL" | "FLAKY" | "WARNING" | "SKIP" | "RUNNING" | "PARTIAL";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const STATUS_MAP: Record<string, string> = {
  PASS: "gcp-badge-pass",
  FAIL: "gcp-badge-fail",
  FLAKY: "gcp-badge-flaky",
  WARNING: "gcp-badge-flaky",
  SKIP: "gcp-badge-skip",
  RUNNING: "gcp-badge-running",
  PARTIAL: "gcp-badge-partial",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const cls = STATUS_MAP[status] ?? "gcp-badge-skip";
  return (
    <span className={`gcp-badge ${cls}`}>
      {label ?? status}
    </span>
  );
}

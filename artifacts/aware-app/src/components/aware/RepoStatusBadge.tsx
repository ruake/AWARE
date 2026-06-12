import React from "react";
import type { TestCase } from "@/lib/types";

const STATUS_STYLES: Record<string, { className: string; label: string }> = {
  synced: { className: "proof-badge-pass", label: "In Repo" },
  missing: { className: "proof-badge-fail", label: "Missing" },
  modified: { className: "proof-badge-flaky", label: "Modified" },
  not_checked: { className: "proof-badge-skip", label: "Not Checked" },
};

export function RepoStatusBadge({ status }: { status?: TestCase["repoStatus"] }) {
  const s = status ?? "not_checked";
  const style = STATUS_STYLES[s] ?? STATUS_STYLES.not_checked;
  return <span className={`proof-badge ${style.className}`}>{style.label}</span>;
}

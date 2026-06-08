import React from "react";
import type { TestCase } from "@/lib/types";

const STATUS_STYLES: Record<string, { className: string; label: string }> = {
  synced: { className: "gcp-badge-pass", label: "In Repo" },
  missing: { className: "gcp-badge-fail", label: "Missing" },
  modified: { className: "gcp-badge-flaky", label: "Modified" },
  not_checked: { className: "gcp-badge-skip", label: "Not Checked" },
};

export function RepoStatusBadge({ status }: { status?: TestCase["repoStatus"] }) {
  const s = status ?? "not_checked";
  const style = STATUS_STYLES[s] ?? STATUS_STYLES.not_checked;
  return <span className={`gcp-badge ${style.className}`}>{style.label}</span>;
}

import React from "react";
import type { TestCase } from "@/lib/types";

export function RepoStatusBadge({ status }: { status?: TestCase["repoStatus"] }) {
  const s = status ?? "not_checked";
  
  let dotColor = "var(--proof-grey)";
  let dotGlow = "none";
  let bg = "rgba(255,255,255,0.05)";
  let border = "rgba(255,255,255,0.1)";
  let text = "var(--proof-text-muted)";
  let label = "Not Checked";

  if (s === "synced") {
    dotColor = "var(--proof-green)";
    dotGlow = "var(--proof-glow-green)";
    bg = "var(--proof-green-bg)";
    border = "var(--proof-green-border)";
    text = "var(--proof-green)";
    label = "In Repo";
  } else if (s === "missing") {
    dotColor = "var(--proof-red)";
    dotGlow = "var(--proof-glow-red)";
    bg = "var(--proof-red-bg)";
    border = "var(--proof-red-border)";
    text = "var(--proof-red)";
    label = "Missing";
  } else if (s === "modified") {
    dotColor = "var(--proof-yellow)";
    dotGlow = "var(--proof-glow-amber)";
    bg = "var(--proof-yellow-bg)";
    border = "var(--proof-yellow-border)";
    text = "var(--proof-yellow)";
    label = "Modified";
  }

  return (
    <div 
      className="glass-panel"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 9999,
        background: bg,
        border: `1px solid ${border}`,
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: text,
      }}
    >
      <div 
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: dotColor,
          boxShadow: dotGlow,
          animation: s === "synced" ? "pulse-dot 2s infinite" : "none"
        }}
      />
      {label}
    </div>
  );
}

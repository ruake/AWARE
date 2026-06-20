import React from "react";
import type { DiffRow } from "@/lib/types";

export function CompareSummary({
  diff,
  deltaMs,
  size = "normal",
}: {
  diff: DiffRow;
  deltaMs: number;
  size?: "normal" | "large";
}) {
  const isLarge = size === "large";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
      <div
        style={{
          padding: isLarge ? "10px 14px" : 8,
          borderRadius: 6,
          border: `1px solid ${diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
          background: diff.baseStatus === "PASS" ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
        }}
      >
        <div
          style={{
            fontSize: isLarge ? 10 : 9,
            fontWeight: 700,
            color: diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
            textTransform: "uppercase",
            letterSpacing: "0.3px",
            marginBottom: isLarge ? 4 : 3,
          }}
        >
          Baseline
        </div>
        <span
          className={`proof-badge ${diff.baseStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
          style={{ fontSize: isLarge ? 11 : 10 }}
        >
          {diff.baseStatus}
        </span>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: isLarge ? 13 : 11,
            color: "var(--proof-text)",
            marginTop: isLarge ? 6 : 4,
            fontWeight: 600,
          }}
        >
          {diff.durBase}ms
        </div>
      </div>
      <div
        style={{
          padding: isLarge ? "10px 14px" : 8,
          borderRadius: 6,
          border: `1px solid ${diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
          background: diff.candStatus === "PASS" ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
        }}
      >
        <div
          style={{
            fontSize: isLarge ? 10 : 9,
            fontWeight: 700,
            color: diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
            textTransform: "uppercase",
            letterSpacing: "0.3px",
            marginBottom: isLarge ? 4 : 3,
          }}
        >
          Candidate
        </div>
        <span
          className={`proof-badge ${diff.candStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
          style={{ fontSize: isLarge ? 11 : 10 }}
        >
          {diff.candStatus}
        </span>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: isLarge ? 13 : 11,
            color: "var(--proof-text)",
            marginTop: isLarge ? 6 : 4,
            fontWeight: 600,
          }}
        >
          {diff.durCand}ms
        </div>
      </div>
      <div
        style={{
          padding: isLarge ? "8px 12px" : "6px 8px",
          borderRadius: 6,
          border: "1px solid var(--proof-grey)",
          background: "var(--proof-grey-bg)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minWidth: isLarge ? 100 : 80,
        }}
      >
        <div
          style={{
            fontSize: isLarge ? 10 : 9,
            fontWeight: 700,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.3px",
            marginBottom: isLarge ? 3 : 2,
          }}
        >
          Δ
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: isLarge ? 13 : 11,
            fontWeight: 700,
            color:
              deltaMs > 20
                ? "var(--proof-red)"
                : deltaMs < -20
                  ? "var(--proof-green)"
                  : "var(--proof-text-secondary)",
          }}
        >
          {Math.abs(deltaMs) > 20 ? `${deltaMs > 0 ? "+" : ""}${deltaMs}ms` : "~0ms"}
        </div>
        <div style={{ fontSize: isLarge ? 10 : 9, color: "var(--proof-text-muted)" }}>
          {diff.baseStatus !== diff.candStatus ? `${diff.baseStatus}→${diff.candStatus}` : "same"}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { ChevronLeft, ChevronRight, X, BarChart3, ArrowUpRight, Link2, Github } from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { CompareWaterfall } from "./CompareWaterfall";
import type { DiffRow, TestResult } from "@/lib/types";

function stateBadge(state: DiffRow["state"]) {
  const map: Record<string, { color: string; label: string }> = {
    regression: { color: "var(--proof-red)", label: "Regression" },
    fixed: { color: "var(--proof-green)", label: "Fixed" },
    duration: { color: "var(--proof-yellow)", label: "Duration ↑" },
    unchanged: { color: "var(--proof-text-secondary)", label: "Unchanged" },
    fishy: { color: "var(--proof-purple)", label: "Fishy ⚠" },
  };
  const s = map[state] ?? { color: "var(--proof-text-secondary)", label: state };
  return <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</span>;
}

export function CompareSidePanel({
  diff,
  diffs,
  selectedId,
  onSelect,
  navigate,
  baseResult,
  candResult,
}: {
  diff: DiffRow;
  diffs: DiffRow[];
  selectedId: string;
  onSelect: (id: string | null) => void;
  navigate: (href: string) => void;
  baseResult: TestResult | null;
  candResult: TestResult | null;
}) {
  const { show, Toast } = useSimpleToast();
  const idx = diffs.findIndex((d) => d.id === selectedId);
  const deltaMs = diff.durCand - diff.durBase;

  return (
    <div
      className="proof-card"
      style={{
        width: 340,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderLeft: `3px solid ${diff.state === "regression" ? "var(--proof-red)" : diff.state === "fixed" ? "var(--proof-green)" : "var(--proof-blue)"}`,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--proof-grey)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--proof-blue-bg)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            border: "1px solid var(--proof-grey)",
            borderRadius: 4,
            background: "var(--proof-surface)",
          }}
        >
          <button
            disabled={idx <= 0}
            onClick={() => onSelect(diffs[idx - 1]?.id)}
            style={{
              padding: "4px 7px",
              border: "none",
              background: "transparent",
              cursor: idx > 0 ? "pointer" : "not-allowed",
              color: idx > 0 ? "var(--proof-blue)" : "var(--proof-grey)",
            }}
          >
            <ChevronLeft size={13} />
          </button>
          <span style={{ fontSize: 10, color: "var(--proof-text-secondary)", padding: "0 4px" }}>
            {idx + 1}/{diffs.length}
          </span>
          <button
            disabled={idx >= diffs.length - 1}
            onClick={() => onSelect(diffs[idx + 1]?.id)}
            style={{
              padding: "4px 7px",
              border: "none",
              background: "transparent",
              cursor: idx < diffs.length - 1 ? "pointer" : "not-allowed",
              color: idx < diffs.length - 1 ? "var(--proof-blue)" : "var(--proof-grey)",
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-blue)", flex: 1 }}>
          Comparison Detail
        </span>
        <button
          onClick={() => onSelect(null)}
          aria-label="Close"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          <X size={14} />
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--proof-text)",
              lineHeight: 1.5,
              wordBreak: "break-all",
            }}
          >
            {diff.name}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
            <span className="proof-badge proof-badge-skip" style={{ fontSize: 10 }}>
              {diff.category}
            </span>
            {stateBadge(diff.state)}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div
            style={{
              padding: 10,
              background: `var(--${diff.baseStatus === "PASS" ? "gcp-green-bg" : "gcp-red-bg"})`,
              borderRadius: 6,
              border: `1px solid ${diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 4,
              }}
            >
              Baseline
            </div>
            <span
              className={`proof-badge ${diff.baseStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
              style={{ fontSize: 10 }}
            >
              {diff.baseStatus}
            </span>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--proof-text)",
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              {diff.durBase}ms
            </div>
          </div>
          <div
            style={{
              padding: 10,
              background: `var(--${diff.candStatus === "PASS" ? "gcp-green-bg" : "gcp-red-bg"})`,
              borderRadius: 6,
              border: `1px solid ${diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 4,
              }}
            >
              Candidate
            </div>
            <span
              className={`proof-badge ${diff.candStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
              style={{ fontSize: 10 }}
            >
              {diff.candStatus}
            </span>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--proof-text)",
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              {diff.durCand}ms
            </div>
          </div>
        </div>
        <div
          style={{
            padding: 10,
            borderRadius: 6,
            border: "1px solid var(--proof-grey)",
            background:
              deltaMs > 20
                ? "var(--proof-red-bg)"
                : deltaMs < -20
                  ? "var(--proof-green-bg)"
                  : "var(--proof-grey-bg)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color:
                deltaMs > 20
                  ? "var(--proof-red)"
                  : deltaMs < -20
                    ? "var(--proof-green)"
                    : "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              marginBottom: 4,
            }}
          >
            Delta
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>Status: </span>
              {diff.baseStatus === diff.candStatus ? (
                <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>—</span>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: diff.state === "regression" ? "var(--proof-red)" : "var(--proof-green)",
                  }}
                >
                  {diff.baseStatus} → {diff.candStatus}
                </span>
              )}
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>Duration: </span>
              {Math.abs(deltaMs) > 20 ? (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 700,
                    color: deltaMs > 0 ? "var(--proof-red)" : "var(--proof-green)",
                  }}
                >
                  {deltaMs > 0 ? "+" : ""}
                  {deltaMs}ms
                </span>
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--proof-text-secondary)",
                  }}
                >
                  ~0ms
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="proof-card" style={{ padding: 10 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>HTTP Waterfall</span>
            <span
              style={{
                fontSize: 8,
                fontWeight: 400,
                color: "var(--proof-text-secondary)",
                textTransform: "none",
              }}
            >
              DNS · TCP · TLS · TTFB · Download
            </span>
          </div>
          <CompareWaterfall baseResult={baseResult} candResult={candResult} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={() => navigate(`/trends?testId=${diff.id}`)}
            className="proof-button proof-button-xs"
            style={{ justifyContent: "center" }}
          >
            <BarChart3 size={12} /> View Analytics <ArrowUpRight size={10} />
          </button>
          <button
            onClick={() => {
              navigator.clipboard
                .writeText(`${window.location.origin}/trends?diffId=${diff.id}`)
                .catch(() => {});
              show("Test permalink copied");
            }}
            className="proof-button proof-button-xs"
            style={{ justifyContent: "center" }}
          >
            <Link2 size={12} /> Copy Test Permalink
          </button>
          <button
            onClick={() => {
              navigator.clipboard
                .writeText(
                  `GitHub issue: Regression in ${diff.name}\nBaseline: ${diff.baseStatus} (${diff.durBase}ms)\nCandidate: ${diff.candStatus} (${diff.durCand}ms)`,
                )
                .catch(() => {});
              show("GitHub issue template copied");
            }}
            className="proof-button proof-button-xs"
            style={{ justifyContent: "center" }}
          >
            <Github size={12} /> File GitHub Issue
          </button>
        </div>
      </div>
      {Toast}
    </div>
  );
}

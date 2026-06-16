import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  BarChart3,
  ArrowUpRight,
  Link2,
  Github,
  Activity,
  Clock,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { CompareWaterfall } from "./CompareWaterfall";
import type { DiffRow, TestResult, HttpTimings } from "@/lib/types";

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

function compareHeaders(
  base: Record<string, string> | undefined,
  cand: Record<string, string> | undefined,
) {
  const allKeys = [...new Set([...Object.keys(base ?? {}), ...Object.keys(cand ?? {})])].sort();
  return allKeys.map((key) => {
    const b = (base ?? {})[key] ?? "—";
    const c = (cand ?? {})[key] ?? "—";
    return { key, base: b, cand: c, changed: b !== c };
  });
}

function compareCookies(
  base:
    | {
        name: string;
        value: string;
        domain?: string;
        path?: string;
        httpOnly?: boolean;
        secure?: boolean;
      }[]
    | undefined,
  cand:
    | {
        name: string;
        value: string;
        domain?: string;
        path?: string;
        httpOnly?: boolean;
        secure?: boolean;
      }[]
    | undefined,
) {
  const allNames = [
    ...new Set([...(base ?? []).map((c) => c.name), ...(cand ?? []).map((c) => c.name)]),
  ].sort();
  return allNames.map((name) => {
    const b = (base ?? []).find((c) => c.name === name);
    const c = (cand ?? []).find((c) => c.name === name);
    return { name, base: b, cand: c, changed: JSON.stringify(b) !== JSON.stringify(c) };
  });
}

function DiffRowItem({
  label,
  base,
  cand,
  changed,
  indent,
}: {
  label: string;
  base: string;
  cand: string;
  changed: boolean;
  indent?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 4,
        padding: "3px 0",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        background: changed ? "rgba(239,68,68,0.04)" : "transparent",
        borderRadius: changed ? 3 : 0,
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        marginLeft: indent ? 8 : 0,
      }}
    >
      <span
        style={{
          color: "var(--proof-text-secondary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: changed ? 600 : 400,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: changed ? "var(--proof-red)" : "var(--proof-text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {base}
      </span>
      <span
        style={{
          color: changed ? "var(--proof-red)" : "var(--proof-text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {cand}
      </span>
    </div>
  );
}

function SectionHeader({ label, count, color }: { label: string; count: number; color?: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: color ?? "var(--proof-text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.3px",
        padding: "6px 0 3px",
        borderBottom: "1px solid var(--proof-grey)",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {label}
      <span style={{ fontSize: 9, color: "var(--proof-text-muted)", fontWeight: 400 }}>
        ({count})
      </span>
    </div>
  );
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
  const [fullView, setFullView] = React.useState(false);
  const idx = diffs.findIndex((d) => d.id === selectedId);
  const deltaMs = diff.durCand - diff.durBase;

  const baseEvidence = baseResult?.evidence;
  const candEvidence = candResult?.evidence;

  const reqHeaders = compareHeaders(baseEvidence?.request.headers, candEvidence?.request.headers);
  const resHeaders = compareHeaders(baseEvidence?.response.headers, candEvidence?.response.headers);
  const cookies = compareCookies(baseEvidence?.response.cookies, candEvidence?.response.cookies);

  const baseBody = baseEvidence?.request.body;
  const candBody = candEvidence?.request.body;
  const baseResBody = baseEvidence?.response.body;
  const candResBody = candEvidence?.response.body;
  const bodyChanged = baseBody !== candBody;
  const resBodyChanged = baseResBody !== candResBody;
  const urlChanged = baseEvidence?.request.url !== candEvidence?.request.url;

  const baseTimings = baseEvidence?.response.timings;
  const candTimings = candEvidence?.response.timings;

  const baseAssertions = baseResult?.assertions ?? baseEvidence?.assertions ?? [];
  const candAssertions = candResult?.assertions ?? candEvidence?.assertions ?? [];

  const timingKeys: { key: keyof HttpTimings; label: string }[] = [
    { key: "dnsLookup", label: "DNS" },
    { key: "tcpConnect", label: "TCP" },
    { key: "tlsHandshake", label: "TLS" },
    { key: "ttfb", label: "TTFB" },
    { key: "download", label: "Download" },
    { key: "total", label: "Total" },
  ];

  return (
    <div
      className="proof-card"
      style={{
        width: 480,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderLeft: `3px solid ${diff.state === "regression" ? "var(--proof-red)" : diff.state === "fixed" ? "var(--proof-green)" : "var(--proof-blue)"}`,
      }}
    >
      {/* Header */}
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
          Full Comparison
        </span>
        <button
          onClick={() => setFullView(true)}
          aria-label="Full view"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            display: "flex",
            alignItems: "center",
            padding: 4,
          }}
        >
          <Maximize2 size={13} />
        </button>
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

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Test info */}
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

        {/* Status + Duration summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
          <div
            style={{
              padding: 8,
              borderRadius: 6,
              border: `1px solid ${diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
              background:
                diff.baseStatus === "PASS" ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 3,
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
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              {diff.durBase}ms
            </div>
          </div>
          <div
            style={{
              padding: 8,
              borderRadius: 6,
              border: `1px solid ${diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
              background:
                diff.candStatus === "PASS" ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 3,
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
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              {diff.durCand}ms
            </div>
          </div>
          <div
            style={{
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid var(--proof-grey)",
              background: "var(--proof-grey-bg)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 80,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 2,
              }}
            >
              Δ
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
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
            <div style={{ fontSize: 9, color: "var(--proof-text-muted)" }}>
              {diff.baseStatus !== diff.candStatus
                ? `${diff.baseStatus}→${diff.candStatus}`
                : "same"}
            </div>
          </div>
        </div>

        {/* HTTP Waterfall */}
        <div style={{ padding: 10, border: "1px solid var(--proof-grey)", borderRadius: 6 }}>
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
            <Clock size={12} /> HTTP Waterfall
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

        {/* ── Detailed Comparison Tables ── */}

        {/* Request URL */}
        {baseEvidence?.request.url || candEvidence?.request.url ? (
          <div>
            <SectionHeader label="Request URL" count={1} />
            <DiffRowItem
              label="URL"
              base={baseEvidence?.request.url ?? "—"}
              cand={candEvidence?.request.url ?? "—"}
              changed={urlChanged}
            />
            <DiffRowItem
              label="Method"
              base={baseEvidence?.request.method ?? "—"}
              cand={candEvidence?.request.method ?? "—"}
              changed={baseEvidence?.request.method !== candEvidence?.request.method}
            />
          </div>
        ) : null}

        {/* Request Headers */}
        {reqHeaders.length > 0 ? (
          <div>
            <SectionHeader
              label="Request Headers"
              count={reqHeaders.length}
              color="var(--proof-blue)"
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 4,
                padding: "2px 0",
                fontSize: 9,
                color: "var(--proof-text-muted)",
                fontFamily: "var(--font-mono)",
                borderBottom: "1px solid var(--proof-border)",
              }}
            >
              <span>Header</span>
              <span>Baseline</span>
              <span>Candidate</span>
            </div>
            {reqHeaders.map((h) => (
              <DiffRowItem
                key={h.key}
                label={h.key}
                base={h.base}
                cand={h.cand}
                changed={h.changed}
              />
            ))}
          </div>
        ) : null}

        {/* Response Headers */}
        {resHeaders.length > 0 ? (
          <div>
            <SectionHeader
              label="Response Headers"
              count={resHeaders.length}
              color="var(--proof-green)"
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 4,
                padding: "2px 0",
                fontSize: 9,
                color: "var(--proof-text-muted)",
                fontFamily: "var(--font-mono)",
                borderBottom: "1px solid var(--proof-border)",
              }}
            >
              <span>Header</span>
              <span>Baseline</span>
              <span>Candidate</span>
            </div>
            {resHeaders.map((h) => (
              <DiffRowItem
                key={h.key}
                label={h.key}
                base={h.base}
                cand={h.cand}
                changed={h.changed}
              />
            ))}
          </div>
        ) : null}

        {/* Cookies */}
        {cookies.length > 0 ? (
          <div>
            <SectionHeader label="Cookies" count={cookies.length} color="var(--proof-yellow)" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 4,
                padding: "2px 0",
                fontSize: 9,
                color: "var(--proof-text-muted)",
                fontFamily: "var(--font-mono)",
                borderBottom: "1px solid var(--proof-border)",
              }}
            >
              <span>Cookie</span>
              <span>Baseline</span>
              <span>Candidate</span>
            </div>
            {cookies.map((c) => (
              <div key={c.name}>
                <DiffRowItem
                  label={c.name}
                  base={c.base?.value ?? "—"}
                  cand={c.cand?.value ?? "—"}
                  changed={c.changed}
                />
                {c.changed && (c.base || c.cand) ? (
                  <div
                    style={{
                      marginLeft: 8,
                      fontSize: 9,
                      color: "var(--proof-text-muted)",
                      fontFamily: "var(--font-mono)",
                      padding: "1px 0",
                    }}
                  >
                    <span>
                      Domain: {c.base?.domain ?? "—"} → {c.cand?.domain ?? "—"} | Path:{" "}
                      {c.base?.path ?? "—"} → {c.cand?.path ?? "—"} | Secure:{" "}
                      {String(c.base?.secure ?? "—")} → {String(c.cand?.secure ?? "—")}
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {/* Timings */}
        {baseTimings || candTimings ? (
          <div>
            <SectionHeader
              label="Timings (ms)"
              count={timingKeys.length}
              color="var(--proof-purple)"
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 4,
                padding: "2px 0",
                fontSize: 9,
                color: "var(--proof-text-muted)",
                fontFamily: "var(--font-mono)",
                borderBottom: "1px solid var(--proof-border)",
              }}
            >
              <span>Phase</span>
              <span>Baseline</span>
              <span>Candidate</span>
            </div>
            {timingKeys.map(({ key, label }) => {
              const bVal = baseTimings?.[key] ?? 0;
              const cVal = candTimings?.[key] ?? 0;
              const changed = Math.abs(bVal - cVal) > 5;
              return (
                <DiffRowItem
                  key={key}
                  label={label}
                  base={`${bVal}ms`}
                  cand={`${cVal}ms`}
                  changed={changed}
                />
              );
            })}
          </div>
        ) : null}

        {/* Request Body */}
        {baseBody || candBody ? (
          <div>
            <SectionHeader label="Request Body" count={1} color="var(--proof-blue)" />
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  maxHeight: 80,
                  overflow: "auto",
                  padding: 6,
                  borderRadius: 4,
                  background: "var(--proof-grey-bg)",
                  border: `1px solid ${bodyChanged ? "var(--proof-red)" : "var(--proof-grey)"}`,
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {baseBody ?? "—"}
              </div>
              <div
                style={{
                  flex: 1,
                  maxHeight: 80,
                  overflow: "auto",
                  padding: 6,
                  borderRadius: 4,
                  background: "var(--proof-grey-bg)",
                  border: `1px solid ${bodyChanged ? "var(--proof-red)" : "var(--proof-grey)"}`,
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {candBody ?? "—"}
              </div>
            </div>
          </div>
        ) : null}

        {/* Response Body */}
        {baseResBody || candResBody ? (
          <div>
            <SectionHeader label="Response Body" count={1} color="var(--proof-green)" />
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  maxHeight: 80,
                  overflow: "auto",
                  padding: 6,
                  borderRadius: 4,
                  background: "var(--proof-grey-bg)",
                  border: `1px solid ${resBodyChanged ? "var(--proof-red)" : "var(--proof-grey)"}`,
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {baseResBody?.slice(0, 200) ?? "—"}
                {(baseResBody?.length ?? 0) > 200 ? "\n…" : ""}
              </div>
              <div
                style={{
                  flex: 1,
                  maxHeight: 80,
                  overflow: "auto",
                  padding: 6,
                  borderRadius: 4,
                  background: "var(--proof-grey-bg)",
                  border: `1px solid ${resBodyChanged ? "var(--proof-red)" : "var(--proof-grey)"}`,
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {candResBody?.slice(0, 200) ?? "—"}
                {(candResBody?.length ?? 0) > 200 ? "\n…" : ""}
              </div>
            </div>
          </div>
        ) : null}

        {/* Assertions */}
        {baseAssertions.length > 0 || candAssertions.length > 0 ? (
          <div>
            <SectionHeader
              label="Assertions"
              count={Math.max(baseAssertions.length, candAssertions.length)}
              color="var(--proof-red)"
            />
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Baseline
                </div>
                {baseAssertions.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "3px 6px",
                      marginBottom: 2,
                      borderRadius: 3,
                      fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      background: a.passed ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.08)",
                      border: `1px solid ${a.passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.2)"}`,
                      borderLeft: `2px solid ${a.passed ? "var(--proof-green)" : "var(--proof-red)"}`,
                    }}
                  >
                    {a.passed ? "✓" : "✗"} {a.assertion}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Candidate
                </div>
                {candAssertions.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "3px 6px",
                      marginBottom: 2,
                      borderRadius: 3,
                      fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      background: a.passed ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.08)",
                      border: `1px solid ${a.passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.2)"}`,
                      borderLeft: `2px solid ${a.passed ? "var(--proof-green)" : "var(--proof-red)"}`,
                    }}
                  >
                    {a.passed ? "✓" : "✗"} {a.assertion}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
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

      {/* Fullscreen overlay */}
      {fullView && (
        <div
          onClick={() => setFullView(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="proof-card"
            style={{
              width: "90vw",
              maxWidth: 1200,
              height: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderLeft: `4px solid ${diff.state === "regression" ? "var(--proof-red)" : diff.state === "fixed" ? "var(--proof-green)" : "var(--proof-blue)"}`,
            }}
          >
            {/* Full view header */}
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid var(--proof-grey)",
                display: "flex",
                alignItems: "center",
                gap: 10,
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
                  <ChevronLeft size={14} />
                </button>
                <span
                  style={{ fontSize: 11, color: "var(--proof-text-secondary)", padding: "0 6px" }}
                >
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
                  <ChevronRight size={14} />
                </button>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--proof-blue)", flex: 1 }}>
                Full Comparison — {diff.name}
              </span>
              <button
                onClick={() => setFullView(false)}
                aria-label="Minimize"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--proof-text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                }}
              >
                <Minimize2 size={14} />
              </button>
              <button
                onClick={() => {
                  setFullView(false);
                  onSelect(null);
                }}
                aria-label="Close"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--proof-text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Full view scrollable body */}
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Status + Duration summary - wider */}
              <div style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: `1px solid ${diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
                    background:
                      diff.baseStatus === "PASS" ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
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
                    style={{ fontSize: 11 }}
                  >
                    {diff.baseStatus}
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
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
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: `1px solid ${diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
                    background:
                      diff.candStatus === "PASS" ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
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
                    style={{ fontSize: 11 }}
                  >
                    {diff.candStatus}
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      color: "var(--proof-text)",
                      marginTop: 6,
                      fontWeight: 600,
                    }}
                  >
                    {diff.durCand}ms
                  </div>
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--proof-grey)",
                    background: "var(--proof-grey-bg)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    minWidth: 100,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--proof-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                      marginBottom: 3,
                    }}
                  >
                    Δ
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
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
                  <div style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>
                    {diff.baseStatus !== diff.candStatus
                      ? `${diff.baseStatus}→${diff.candStatus}`
                      : "same"}
                  </div>
                </div>
              </div>

              {/* HTTP Waterfall */}
              <div style={{ padding: 12, border: "1px solid var(--proof-grey)", borderRadius: 6 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--proof-text-secondary)",
                    textTransform: "uppercase",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Clock size={14} /> HTTP Waterfall
                  <span
                    style={{
                      fontSize: 9,
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

              {/* Two-column detail layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Left column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Request URL */}
                  {baseEvidence?.request.url || candEvidence?.request.url ? (
                    <div>
                      <SectionHeader label="Request URL" count={1} />
                      <DiffRowItem
                        label="URL"
                        base={baseEvidence?.request.url ?? "—"}
                        cand={candEvidence?.request.url ?? "—"}
                        changed={urlChanged}
                      />
                      <DiffRowItem
                        label="Method"
                        base={baseEvidence?.request.method ?? "—"}
                        cand={candEvidence?.request.method ?? "—"}
                        changed={baseEvidence?.request.method !== candEvidence?.request.method}
                      />
                    </div>
                  ) : null}

                  {/* Request Headers */}
                  {reqHeaders.length > 0 ? (
                    <div>
                      <SectionHeader
                        label="Request Headers"
                        count={reqHeaders.length}
                        color="var(--proof-blue)"
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 6,
                          padding: "3px 0",
                          fontSize: 10,
                          color: "var(--proof-text-muted)",
                          fontFamily: "var(--font-mono)",
                          borderBottom: "1px solid var(--proof-border)",
                        }}
                      >
                        <span>Header</span>
                        <span>Baseline</span>
                        <span>Candidate</span>
                      </div>
                      {reqHeaders.map((h) => (
                        <DiffRowItem
                          key={h.key}
                          label={h.key}
                          base={h.base}
                          cand={h.cand}
                          changed={h.changed}
                        />
                      ))}
                    </div>
                  ) : null}

                  {/* Request Body */}
                  {baseBody || candBody ? (
                    <div>
                      <SectionHeader label="Request Body" count={1} color="var(--proof-blue)" />
                      <div style={{ display: "flex", gap: 10 }}>
                        <div
                          style={{
                            flex: 1,
                            maxHeight: 120,
                            overflow: "auto",
                            padding: 8,
                            borderRadius: 4,
                            background: "var(--proof-grey-bg)",
                            border: `1px solid ${bodyChanged ? "var(--proof-red)" : "var(--proof-grey)"}`,
                            fontSize: 10,
                            fontFamily: "var(--font-mono)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                          }}
                        >
                          {baseBody ?? "—"}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            maxHeight: 120,
                            overflow: "auto",
                            padding: 8,
                            borderRadius: 4,
                            background: "var(--proof-grey-bg)",
                            border: `1px solid ${bodyChanged ? "var(--proof-red)" : "var(--proof-grey)"}`,
                            fontSize: 10,
                            fontFamily: "var(--font-mono)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                          }}
                        >
                          {candBody ?? "—"}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Response Headers */}
                  {resHeaders.length > 0 ? (
                    <div>
                      <SectionHeader
                        label="Response Headers"
                        count={resHeaders.length}
                        color="var(--proof-green)"
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 6,
                          padding: "3px 0",
                          fontSize: 10,
                          color: "var(--proof-text-muted)",
                          fontFamily: "var(--font-mono)",
                          borderBottom: "1px solid var(--proof-border)",
                        }}
                      >
                        <span>Header</span>
                        <span>Baseline</span>
                        <span>Candidate</span>
                      </div>
                      {resHeaders.map((h) => (
                        <DiffRowItem
                          key={h.key}
                          label={h.key}
                          base={h.base}
                          cand={h.cand}
                          changed={h.changed}
                        />
                      ))}
                    </div>
                  ) : null}

                  {/* Cookies */}
                  {cookies.length > 0 ? (
                    <div>
                      <SectionHeader
                        label="Cookies"
                        count={cookies.length}
                        color="var(--proof-yellow)"
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 6,
                          padding: "3px 0",
                          fontSize: 10,
                          color: "var(--proof-text-muted)",
                          fontFamily: "var(--font-mono)",
                          borderBottom: "1px solid var(--proof-border)",
                        }}
                      >
                        <span>Cookie</span>
                        <span>Baseline</span>
                        <span>Candidate</span>
                      </div>
                      {cookies.map((c) => (
                        <div key={c.name}>
                          <DiffRowItem
                            label={c.name}
                            base={c.base?.value ?? "—"}
                            cand={c.cand?.value ?? "—"}
                            changed={c.changed}
                          />
                          {c.changed && (c.base || c.cand) ? (
                            <div
                              style={{
                                marginLeft: 12,
                                fontSize: 10,
                                color: "var(--proof-text-muted)",
                                fontFamily: "var(--font-mono)",
                                padding: "1px 0",
                              }}
                            >
                              Domain: {c.base?.domain ?? "—"} → {c.cand?.domain ?? "—"} | Path:{" "}
                              {c.base?.path ?? "—"} → {c.cand?.path ?? "—"} | Secure:{" "}
                              {String(c.base?.secure ?? "—")} → {String(c.cand?.secure ?? "—")}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Timings */}
                  {baseTimings || candTimings ? (
                    <div>
                      <SectionHeader
                        label="Timings (ms)"
                        count={timingKeys.length}
                        color="var(--proof-purple)"
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 6,
                          padding: "3px 0",
                          fontSize: 10,
                          color: "var(--proof-text-muted)",
                          fontFamily: "var(--font-mono)",
                          borderBottom: "1px solid var(--proof-border)",
                        }}
                      >
                        <span>Phase</span>
                        <span>Baseline</span>
                        <span>Candidate</span>
                      </div>
                      {timingKeys.map(({ key, label }) => {
                        const bVal = baseTimings?.[key] ?? 0;
                        const cVal = candTimings?.[key] ?? 0;
                        return (
                          <DiffRowItem
                            key={key}
                            label={label}
                            base={`${bVal}ms`}
                            cand={`${cVal}ms`}
                            changed={Math.abs(bVal - cVal) > 5}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Response Body */}
              {baseResBody || candResBody ? (
                <div>
                  <SectionHeader label="Response Body" count={1} color="var(--proof-green)" />
                  <div style={{ display: "flex", gap: 10 }}>
                    <div
                      style={{
                        flex: 1,
                        maxHeight: 160,
                        overflow: "auto",
                        padding: 8,
                        borderRadius: 4,
                        background: "var(--proof-grey-bg)",
                        border: `1px solid ${resBodyChanged ? "var(--proof-red)" : "var(--proof-grey)"}`,
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {baseResBody ?? "—"}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        maxHeight: 160,
                        overflow: "auto",
                        padding: 8,
                        borderRadius: 4,
                        background: "var(--proof-grey-bg)",
                        border: `1px solid ${resBodyChanged ? "var(--proof-red)" : "var(--proof-grey)"}`,
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {candResBody ?? "—"}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Assertions */}
              {baseAssertions.length > 0 || candAssertions.length > 0 ? (
                <div>
                  <SectionHeader
                    label="Assertions"
                    count={Math.max(baseAssertions.length, candAssertions.length)}
                    color="var(--proof-red)"
                  />
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color:
                            diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Baseline
                      </div>
                      {baseAssertions.map((a, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "4px 8px",
                            marginBottom: 3,
                            borderRadius: 3,
                            fontSize: 10,
                            fontFamily: "var(--font-mono)",
                            background: a.passed ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.08)",
                            border: `1px solid ${a.passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.2)"}`,
                            borderLeft: `2px solid ${a.passed ? "var(--proof-green)" : "var(--proof-red)"}`,
                          }}
                        >
                          {a.passed ? "✓" : "✗"} {a.assertion}
                        </div>
                      ))}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color:
                            diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Candidate
                      </div>
                      {candAssertions.map((a, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "4px 8px",
                            marginBottom: 3,
                            borderRadius: 3,
                            fontSize: 10,
                            fontFamily: "var(--font-mono)",
                            background: a.passed ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.08)",
                            border: `1px solid ${a.passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.2)"}`,
                            borderLeft: `2px solid ${a.passed ? "var(--proof-green)" : "var(--proof-red)"}`,
                          }}
                        >
                          {a.passed ? "✓" : "✗"} {a.assertion}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => navigate(`/trends?testId=${diff.id}`)}
                  className="proof-button proof-button-sm"
                  style={{ justifyContent: "center" }}
                >
                  <BarChart3 size={13} /> View Analytics <ArrowUpRight size={11} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard
                      .writeText(`${window.location.origin}/trends?diffId=${diff.id}`)
                      .catch(() => {});
                    show("Test permalink copied");
                  }}
                  className="proof-button proof-button-sm"
                  style={{ justifyContent: "center" }}
                >
                  <Link2 size={13} /> Copy Permalink
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
                  className="proof-button proof-button-sm"
                  style={{ justifyContent: "center" }}
                >
                  <Github size={13} /> File GitHub Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

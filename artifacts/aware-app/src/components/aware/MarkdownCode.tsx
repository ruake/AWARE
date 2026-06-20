import React from "react";
import { MarkdownChart } from "./MarkdownChart";

export const STATUS_COLORS: Record<string, string> = {
  pass: "var(--proof-green)",
  passed: "var(--proof-green)",
  success: "var(--proof-green)",
  ok: "var(--proof-green)",
  healthy: "var(--proof-green)",
  stable: "var(--proof-green)",
  good: "var(--proof-green)",
  fail: "var(--proof-red)",
  failed: "var(--proof-red)",
  error: "var(--proof-red)",
  critical: "var(--proof-red)",
  broken: "var(--proof-red)",
  down: "var(--proof-red)",
  warning: "var(--proof-yellow)",
  warn: "var(--proof-yellow)",
  flaky: "var(--proof-yellow)",
  unstable: "var(--proof-yellow)",
  degraded: "var(--proof-yellow)",
  slow: "var(--proof-yellow)",
  high: "var(--proof-yellow)",
  skip: "#9ca3af",
  skipped: "#9ca3af",
  pending: "#9ca3af",
  disabled: "#9ca3af",
  "n/a": "#9ca3af",
  none: "#9ca3af",
  low: "var(--proof-green)",
  medium: "var(--proof-yellow)",
};

export function MarkdownCode({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const lang = className?.replace(/^language-/, "");
  // ── Chart blocks ──────────────────────────────────────────────────────────
  if (lang === "chart") {
    let chartConfig: Record<string, unknown> | null = null;
    try {
      chartConfig = JSON.parse(String(children).trim());
    } catch {
      /* ignore parse errors */
    }
    if (chartConfig) {
      return <MarkdownChart config={chartConfig} />;
    }
  }
  // ── Inline code (status badges or plain inline code) ──────────────────────
  const isInline = !className;
  if (isInline) {
    const text = String(children).trim();
    const statusKey = text.toLowerCase();
    const statusColor = STATUS_COLORS[statusKey];
    if (statusColor) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "1px 8px",
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.35px",
            background: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
            color: statusColor,
            border: `1px solid color-mix(in srgb, ${statusColor} 20%, transparent)`,
            lineHeight: 1.5,
          }}
        >
          {text}
        </span>
      );
    }
    return (
      <code
        style={{
          background: "var(--proof-grey-bg)",
          padding: "1px 5px",
          borderRadius: 3,
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          color: "var(--proof-blue)",
        }}
        {...props}
      >
        {children}
      </code>
    );
  }
  // ── Block code ────────────────────────────────────────────────────────────
  return (
    <pre
      style={{
        background: "var(--proof-grey-bg)",
        padding: 12,
        borderRadius: 6,
        overflowX: "auto",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        lineHeight: 1.5,
        border: "1px solid var(--proof-grey)",
        margin: "8px 0",
      }}
    >
      <code {...props}>{children}</code>
    </pre>
  );
}

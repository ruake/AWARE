import React from "react";

interface ContextIndicatorProps {
  usedTokens: number;
  maxTokens: number;
  messageCount: number;
}

function getColor(pct: number): string {
  if (pct < 50) return "#22c55e";
  if (pct < 80) return "#f59e0b";
  return "#ef4444";
}

export default function ContextIndicator({ usedTokens, maxTokens, messageCount }: ContextIndicatorProps) {
  const pct = maxTokens > 0 ? Math.min((usedTokens / maxTokens) * 100, 100) : 0;
  const color = getColor(pct);
  const [hovered, setHovered] = React.useState(false);
  const tokenLabel = `${usedTokens.toLocaleString()} / ${maxTokens.toLocaleString()} tokens`;
  const tooltipLabel = `${tokenLabel} (${Math.round(pct)}%) · ${messageCount} message${messageCount !== 1 ? "s" : ""} in context`;

  return (
    <div
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Context window: ${tooltipLabel}`}
      style={{ position: "relative", userSelect: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          marginBottom: 2,
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: "var(--proof-text-muted)",
            fontWeight: 500,
            letterSpacing: "0.2px",
            textTransform: "uppercase",
          }}
        >
          Context
        </span>
        <span
          style={{
            fontSize: 9,
            fontFamily: "'JetBrains Mono', monospace",
            color: color,
            fontWeight: 700,
            transition: "color 0.2s",
            animation: pct > 80 ? "contextPulse 1.5s ease-in-out infinite" : "none",
          }}
        >
          {Math.round(pct)}%
        </span>
      </div>

      <div
        style={{
          width: 80,
          height: 3,
          background: "var(--proof-border)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            transition: "width 0.4s ease, background 0.4s ease",
            boxShadow: pct > 80 ? `0 0 6px ${color}66` : "none",
          }}
        />
      </div>

      {hovered && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
            background: "var(--proof-surface-2)",
            border: "1px solid var(--proof-border)",
            borderRadius: 6,
            padding: "7px 11px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
            zIndex: 60,
            whiteSpace: "nowrap",
            fontSize: 11,
            lineHeight: 1.6,
            color: "var(--proof-text-secondary)",
            minWidth: 180,
          }}
        >
          <div style={{ color: "var(--proof-text)", fontWeight: 600, marginBottom: 2 }}>
            {tokenLabel}
          </div>
          <div>{Math.round(pct)}% of context window used</div>
          <div>{messageCount} message{messageCount !== 1 ? "s" : ""} in context</div>
        </div>
      )}
    </div>
  );
}

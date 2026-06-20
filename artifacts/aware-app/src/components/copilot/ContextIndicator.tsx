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
  const label = `${usedTokens.toLocaleString()} / ${maxTokens.toLocaleString()} tokens used (${Math.round(pct)}%)`;

  return (
    <div
      style={{ position: "relative", width: 100, userSelect: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 2,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontFamily: "'JetBrains Mono', monospace",
            color: color,
            fontWeight: 600,
            transition: "color 0.2s",
            animation: pct > 80 ? "contextPulse 1.5s ease-in-out infinite" : "none",
          }}
        >
          {Math.round(pct)}%
        </span>
      </div>

      <div
        style={{
          width: "100%",
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
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            right: 0,
            background: "var(--proof-surface-2)",
            border: "1px solid var(--proof-border)",
            borderRadius: 6,
            padding: "6px 10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 60,
            whiteSpace: "nowrap",
            fontSize: 10.5,
            lineHeight: 1.5,
            color: "var(--proof-text-secondary)",
          }}
        >
          <div style={{ color: "var(--proof-text)" }}>{label}</div>
          <div>{messageCount} message{messageCount !== 1 ? "s" : ""} in context</div>
        </div>
      )}

      <style>{`
        @keyframes contextPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

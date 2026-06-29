import React from "react";
import { Bot, MessageSquare } from "lucide-react";

interface CopilotSidebarProps {
  onNewChat: () => void;
  onSend: (msg: string) => void;
  style?: React.CSSProperties;
}

export function CopilotSidebar({ onNewChat, onSend, style }: CopilotSidebarProps) {
  const sessions = [
    "UAT Promotion Check",
    "Flaky tests in auth suite",
    "Regression analysis: checkout",
    "Status of critical endpoints"
  ];

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        background: "var(--proof-surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRight: "1px solid var(--proof-border)",
        ...style,
      }}
    >
      <div style={{ padding: 20 }}>
        <button
          onClick={onNewChat}
          className="glass-panel"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "var(--proof-radius-md)",
            border: "1px solid rgba(0,196,255,0.3)",
            background: "rgba(0,196,255,0.05)",
            color: "var(--proof-blue-bright)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "var(--proof-glow-cyan)",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,196,255,0.15)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,196,255,0.05)"}
        >
          <Bot size={16} /> New Session
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--proof-text-muted)", marginBottom: 12 }}>
          Recent Sessions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sessions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSend(s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: "var(--proof-radius-md)",
                background: "transparent",
                border: "none",
                color: "var(--proof-text)",
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--proof-surface-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <MessageSquare size={14} style={{ color: "var(--proof-text-secondary)" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

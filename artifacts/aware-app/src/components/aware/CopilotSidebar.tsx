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
        width: 280,
        flexShrink: 0,
        background: "var(--proof-surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRight: "1px solid var(--proof-border)",
        position: "relative",
        ...style,
      }}
    >
      {/* Animated gradient edge */}
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 1, background: "linear-gradient(to bottom, var(--proof-blue), transparent)", opacity: 0.2 }} />

      <div style={{ padding: 20 }}>
        <button
          onClick={onNewChat}
          className="proof-btn"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "var(--proof-radius-lg)",
            border: "1px solid var(--proof-blue-border)",
            background: "var(--proof-blue-bg)",
            color: "var(--proof-blue)",
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
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(0,196,255,0.15)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(0,196,255,0.3)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "var(--proof-blue-bg)";
            e.currentTarget.style.boxShadow = "var(--proof-glow-cyan)";
          }}
        >
          <Bot size={16} /> New Session
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
        <div style={{ 
          fontSize: 11, 
          fontWeight: 700, 
          textTransform: "uppercase", 
          letterSpacing: "1px", 
          color: "var(--proof-text-muted)", 
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span style={{ flex: 1 }}>Recent Sessions</span>
          <div style={{ height: 1, flex: 2, background: "var(--proof-border-light)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {sessions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSend(s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: "var(--proof-radius-md)",
                background: "transparent",
                border: "none",
                color: "var(--proof-text-secondary)",
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
                position: "relative"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "var(--proof-surface-2)";
                e.currentTarget.style.color = "var(--proof-text)";
                e.currentTarget.style.paddingLeft = "16px";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--proof-text-secondary)";
                e.currentTarget.style.paddingLeft = "12px";
              }}
            >
              <MessageSquare size={14} style={{ opacity: 0.7 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ padding: 20, borderTop: "1px solid var(--proof-border-light)" }}>
        <div style={{ fontSize: 10, color: "var(--proof-text-muted)", textAlign: "center", fontFamily: "var(--font-mono)" }}>
          A.W.A.R.E. OS v2.4.0
        </div>
      </div>
    </div>
  );
}

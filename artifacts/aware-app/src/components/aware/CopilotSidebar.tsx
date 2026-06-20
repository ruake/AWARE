import React from "react";
import { Bot, Plus, MessageSquare } from "lucide-react";
import { QUICK_ACTIONS } from "@/lib/copilot/quickActions";

interface CopilotSidebarProps {
  onNewChat: () => void;
  onSend: (msg: string) => void;
  style?: React.CSSProperties;
}

export function CopilotSidebar({ onNewChat, onSend, style }: CopilotSidebarProps) {
  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        background: "var(--proof-overlay)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px",
          borderBottom: "1px solid var(--proof-border)",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1))",
            border: "1px solid rgba(59,130,246,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bot size={14} style={{ color: "#60a5fa" }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>
          A.W.A.R.E.
        </span>
      </div>

      {/* New Chat */}
      <div style={{ padding: "10px 12px" }}>
        <button
          onClick={onNewChat}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "7px 0",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            border: "1px solid var(--proof-border)",
            background: "rgba(255,255,255,0.03)",
            color: "var(--proof-text-secondary)",
            transition: "all 0.15s",
          }}
        >
          <Plus size={13} /> New Chat
        </button>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 8px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.7px",
            color: "var(--proof-text-muted)",
            padding: "10px 8px 6px",
          }}
        >
          Quick Actions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => onSend(action.message)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                borderRadius: 7,
                fontSize: 11.5,
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                background: "transparent",
                color: "var(--proof-text-secondary)",
                textAlign: "left",
                transition: "all 0.12s",
              }}
            >
              <action.icon size={14} style={{ color: action.color, flexShrink: 0 }} />
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Suggestions */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.7px",
            color: "var(--proof-text-muted)",
            padding: "14px 8px 6px",
          }}
        >
          Try asking
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {[
            "What's failing in the latest run?",
            "Show pass rate trend over 15 runs",
            "Which tests are flakiest?",
            "Is UAT ready to promote to PROD?",
            "Compare suite health across environments",
            "Are there any duration regressions?",
            "What's the Akamai property version in PROD?",
            "Summarize all environment health",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSend(prompt)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 7,
                fontSize: 11,
                cursor: "pointer",
                border: "none",
                background: "transparent",
                color: "var(--proof-text-muted)",
                textAlign: "left",
                lineHeight: 1.4,
                transition: "all 0.12s",
              }}
            >
              <MessageSquare size={10} style={{ flexShrink: 0, opacity: 0.5 }} />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

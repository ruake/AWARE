import React from "react";
import { Bot, User, Copy, Check } from "lucide-react";
import { Markdown } from "./Markdown";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  id: string;
}

interface Props {
  msg: ChatMsg;
  index: number;
}

export default function ChatMessage({ msg, index }: Props) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "24px 0",
        borderBottom: "1px solid var(--proof-border-light)",
        animation: "fade-in-up 0.4s ease-out both",
        animationDelay: `${index * 50}ms`,
        flexDirection: isUser ? "row-reverse" : "row"
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: isUser ? "var(--proof-surface-2)" : "rgba(0,196,255,0.1)",
          border: isUser ? "1px solid var(--proof-border)" : "1px solid rgba(0,196,255,0.3)",
          boxShadow: isUser ? "none" : "var(--proof-glow-cyan)"
        }}
      >
        {isUser ? <User size={18} style={{ color: "var(--proof-text-secondary)" }} /> : <Bot size={18} style={{ color: "var(--proof-blue)" }} />}
      </div>
      
      <div style={{ flex: 1, minWidth: 0, maxWidth: "80%" }}>
        <div
          className="glass-panel"
          style={{
            padding: "16px 20px",
            borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
            background: isUser ? "var(--proof-surface-2)" : "rgba(9, 13, 20, 0.6)",
            borderLeft: !isUser ? "3px solid var(--proof-blue)" : "1px solid var(--proof-border)",
            border: isUser ? "1px solid var(--proof-border)" : undefined,
            color: "var(--proof-text)",
            fontSize: 14,
            lineHeight: 1.6
          }}
        >
          <Markdown content={msg.content} />
        </div>
        {!isUser && (
          <button
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 8,
              padding: "4px 8px",
              background: "transparent",
              border: "none",
              color: "var(--proof-text-muted)",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "var(--font-mono)"
            }}
          >
            {copied ? <Check size={12} style={{ color: "var(--proof-green)" }} /> : <Copy size={12} />}
            {copied ? "COPIED" : "COPY"}
          </button>
        )}
      </div>
    </div>
  );
}

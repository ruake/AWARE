import React from "react";
import { Bot, User, Copy, Check, ChevronUp, ChevronDown, RefreshCw, Zap } from "lucide-react";
import type { AIUseCase } from "@/lib/ai";
import { Markdown } from "./Markdown";

export interface ChatMsg {
  role: string;
  content: string;
  type?: string;
  followUps?: { id: string; name: string }[];
  timestamp?: number;
  charts?: unknown[];
}

interface Props {
  msg: ChatMsg;
  index: number;
  isLastInGroup: boolean;
  isFirstInGroup: boolean;
  showAvatar: boolean;
  expanded: boolean;
  copied: boolean;
  useCases: AIUseCase[];
  useCaseIcons: Record<string, React.ReactNode>;
  onToggleExpand: () => void;
  onCopy: () => void;
  onNewChat: () => void;
  onFollowUp: (uc: AIUseCase) => void;
  MAX_PREVIEW: number;
}

const CAT_COLORS: Record<string, string> = {
  analysis: "#5b8af5",
  alert: "#ef4444",
  recommendation: "#22c55e",
  report: "#a855f7",
  setup: "#f59e0b",
};

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatMessage({
  msg, index, isLastInGroup, isFirstInGroup, showAvatar,
  expanded, copied, useCases, useCaseIcons,
  onToggleExpand, onCopy, onNewChat, onFollowUp, MAX_PREVIEW,
}: Props) {
  const isUser = msg.role === "user";
  const isAssistant = msg.role === "assistant";
  const isError = msg.type === "error";
  const isCapabilities = msg.type === "capabilities";
  const [fallbackTs] = React.useState(() => Date.now());
  const ts = msg.timestamp ?? fallbackTs;

  return (
    <div
      className="chat-slide-in"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: isUser ? "78%" : "94%",
        marginBottom: isLastInGroup ? 8 : 1,
        marginTop: isFirstInGroup ? 2 : 0,
        flexDirection: isUser ? "row-reverse" : "row",
        animationDelay: `${index * 30}ms`,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
          opacity: showAvatar ? 1 : 0,
          transition: "opacity 0.15s",
          pointerEvents: "none",
          ...(isAssistant
            ? {
                background: "linear-gradient(135deg, #3d6ff5 0%, #7c6af5 100%)",
                boxShadow: "0 0 0 2px rgba(91,138,245,0.2), 0 2px 8px rgba(91,138,245,0.3)",
              }
            : {
                background: "var(--proof-surface-3)",
                border: "1px solid var(--proof-border-strong)",
              }),
        }}
      >
        {isAssistant ? (
          <Bot size={14} style={{ color: "white" }} />
        ) : (
          <User size={13} style={{ color: "var(--proof-text-secondary)" }} />
        )}
      </div>

      <div style={{ position: "relative", minWidth: 0, flex: "0 1 auto" }}>
        <div
          style={{
            padding: isUser ? "10px 15px" : "14px 18px",
            borderRadius: isUser
              ? "16px 16px 4px 16px"
              : "4px 16px 16px 16px",
            fontSize: 13,
            lineHeight: 1.7,
            background: isUser
              ? "linear-gradient(135deg, #5b8af5 0%, #7c6af5 100%)"
              : isError
                ? "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.06))"
                : "var(--proof-surface-2)",
            color: isUser ? "white" : "var(--proof-text)",
            border: isUser
              ? "none"
              : isError
                ? "1px solid rgba(239,68,68,0.3)"
                : "1px solid var(--proof-border)",
            boxShadow: isUser
              ? "0 2px 12px rgba(91,138,245,0.25)"
              : "0 1px 3px rgba(0,0,0,0.15)",
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          {isUser ? (
            <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {msg.content}
            </span>
          ) : isCapabilities ? (
            <CapabilitiesContent useCases={useCases} useCaseIcons={useCaseIcons} />
          ) : (
            <>
              {isError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                    color: "#ef4444",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <RefreshCw size={13} />
                  Error
                </div>
              )}
              <Markdown
                content={
                  expanded || msg.content.length <= MAX_PREVIEW
                    ? msg.content
                    : msg.content.slice(0, MAX_PREVIEW) + "\n\n*…response truncated*"
                }
                mono={msg.type === "analysis"}
              />
              {msg.content.length > MAX_PREVIEW && (
                <button
                  onClick={onToggleExpand}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 8,
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid var(--proof-grey)",
                    background: "rgba(255,255,255,0.04)",
                    color: "var(--proof-blue)",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(91,138,245,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                >
                  {expanded ? (
                    <><ChevronUp size={12} /> Show less</>
                  ) : (
                    <><ChevronDown size={12} /> Show full ({msg.content.length} chars)</>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 4,
            padding: "0 4px",
            opacity: 0,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0"; }}
        >
          <span
            style={{ fontSize: 10, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}
            title={fmtTime(ts)}
          >
            {relTime(ts)}
          </span>
          {isAssistant && !isCapabilities && (
            <button
              onClick={onCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 9,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: "transparent",
                color: copied ? "var(--proof-green)" : "var(--proof-text-muted)",
                transition: "color 0.12s",
              }}
            >
              {copied ? <Check size={9} /> : <Copy size={9} />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>

        {isError && (
          <button
            onClick={onNewChat}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 6,
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid rgba(239,68,68,0.25)",
              background: "rgba(239,68,68,0.08)",
              color: "#ef4444",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          >
            <RefreshCw size={11} /> Clear & Try Again
          </button>
        )}

        {msg.followUps && msg.followUps.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--proof-border)" }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--proof-text-muted)",
                marginBottom: 6,
              }}
            >
              Quick Next Steps
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {msg.followUps.map((f) => {
                const uc = useCases.find((u) => u.id === f.id);
                const cat = uc?.category || "analysis";
                const c = CAT_COLORS[cat] || "#5b8af5";
                return (
                  <button
                    key={f.id}
                    onClick={() => { if (uc) onFollowUp(uc); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      padding: "3px 9px",
                      borderRadius: 14,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: `1px solid ${c}35`,
                      background: `${c}0f`,
                      color: c,
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${c}20`;
                      e.currentTarget.style.borderColor = `${c}60`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${c}0f`;
                      e.currentTarget.style.borderColor = `${c}35`;
                    }}
                  >
                    {useCaseIcons[f.id] || <Zap size={10} />}
                    {f.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Capabilities section ──────────────────────────────────────────────

function CapabilitiesContent({
  useCases,
  useCaseIcons,
}: {
  useCases: AIUseCase[];
  useCaseIcons: Record<string, React.ReactNode>;
}) {
  const catOrder = ["analysis", "alert", "recommendation", "report", "setup"] as const;
  const catLabels: Record<string, string> = {
    analysis: "Analysis",
    alert: "Alerts & Detection",
    recommendation: "Recommendations",
    report: "Reports",
    setup: "Setup & Config",
  };
  return (
    <div style={{ minWidth: 300 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)", marginBottom: 12 }}>
        Here's what I can do with your test data:
      </div>
      {catOrder.map((cat) => {
        const catUcs = useCases.filter((uc) => uc.category === cat);
        if (!catUcs.length) return null;
        const c = CAT_COLORS[cat] || "#5b8af5";
        return (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: c,
                marginBottom: 6,
              }}
            >
              {catLabels[cat]}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {catUcs.map((uc) => (
                <button
                  key={uc.id}
                  title={uc.description}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: `1px solid ${c}30`,
                    background: `${c}0d`,
                    color: "var(--proof-text)",
                    transition: "all 0.12s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${c}20`;
                    e.currentTarget.style.borderColor = `${c}55`;
                    e.currentTarget.style.color = c;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${c}0d`;
                    e.currentTarget.style.borderColor = `${c}30`;
                    e.currentTarget.style.color = "var(--proof-text)";
                  }}
                >
                  {useCaseIcons[uc.id] || <Zap size={10} />}
                  {uc.name}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 12, fontSize: 11, color: "var(--proof-text-muted)" }}>
        Or just type a question about your runs, tests, or environments.
      </div>
    </div>
  );
}

import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useLocation } from "wouter";
import type { Message } from "@/lib/copilot/types";
import { UserBubble, AssistantBubble } from "./Bubble";
import {
  Zap,
  Shield,
  TrendingUp,
  AlertTriangle,
  Activity,
  Clock,
  BarChart3,
  Globe,
} from "lucide-react";

interface Props {
  messages: Message[];
  onRetry?: (messageId: string) => void;
  onSend?: (msg: string) => void;
}

const QUICK_ACTIONS = [
  {
    label: "Status",
    query: "What's the current health status across all environments?",
    icon: Activity,
    color: "var(--proof-green)",
  },
  { label: "Flaky", query: "Show me the flakiest tests", icon: Zap, color: "var(--proof-yellow)" },
  { label: "Fails", query: "What are the latest failures?", icon: AlertTriangle, color: "var(--proof-red)" },
  { label: "Promote", query: "Can we promote to PROD?", icon: Shield, color: "var(--proof-purple)" },
  { label: "Trends", query: "Show pass rate trends", icon: TrendingUp, color: "var(--proof-blue)" },
  { label: "Durations", query: "What are the slowest tests?", icon: Clock, color: "#ec4899" },
  { label: "Suites", query: "Show suite health breakdown", icon: BarChart3, color: "var(--proof-teal)" },
  { label: "Akamai", query: "What's the Akamai property status?", icon: Globe, color: "var(--proof-orange)" },
];

function MessageFeedInner({ messages, onRetry, onSend }: Props) {
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const atBottomRef = React.useRef(true);
  const prevLenRef = React.useRef(messages.length);
  const [, _navigate] = useLocation();

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const msg = messages[index];
      const base = 80;
      const content = msg.content ?? "";
      // Account for markdown formatting: code blocks are tall, tables have rows, plain text wraps
      const codeBlocks = Math.floor(((content.match(/```/g) ?? []).length) / 2);
      const tableRows = (content.match(/^\|/gm) ?? []).length;
      const textLines = Math.ceil(content.length / 60);
      const contentHeight = Math.min(900, codeBlocks * 140 + tableRows * 26 + textLines * 20);
      const toolCardHeight = (msg.toolCalls?.length ?? 0) * 90;
      return base + contentHeight + toolCardHeight;
    },
    overscan: 4,
  });

  // Track user scroll position
  React.useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const onScroll = () => {
      atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll to latest message on new messages or streaming content
  const lastMsg = messages[messages.length - 1];
  React.useEffect(() => {
    const index = messages.length - 1;
    if (index < 0) return;
    // Always scroll on new messages; respect atBottomRef only for streaming updates
    const isNewMessage = messages.length !== prevLenRef.current;
    prevLenRef.current = messages.length;
    if (!isNewMessage && !atBottomRef.current) return;
    requestAnimationFrame(() => {
      virtualizer.scrollToIndex(index, { align: "end" });
    });
  }, [messages.length, lastMsg?.content, lastMsg?.toolCalls?.length, virtualizer]);

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{
        flex: 1,
        overflowY: "auto",
        position: "relative",
        scrollbarWidth: "thin",
        scrollbarColor: "var(--proof-border) transparent",
      }}
    >
      {messages.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 20,
            padding: 32,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))",
              border: "1px solid rgba(59,130,246,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px var(--proof-blue-glow)",
            }}
          >
            <span style={{ fontSize: 28 }}>🤖</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: 17, fontWeight: 700, color: "var(--proof-text)", marginBottom: 8 }}
            >
              A.W.A.R.E. Copilot
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--proof-text-secondary)",
                maxWidth: 400,
                lineHeight: 1.6,
              }}
            >
              Ask about test failures, flakiness, promotion status, or analyze runs.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
              maxWidth: 500,
              marginTop: 12,
            }}
          >
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => onSend?.(action.query)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid var(--proof-border)",
                    background: "var(--proof-surface-2)",
                    color: "var(--proof-text-secondary)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--proof-surface-hover)";
                    (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
                    (e.currentTarget as HTMLElement).style.borderColor = action.color + "80";
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${action.color}33`;
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--proof-surface-2)";
                    (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLElement).style.transform = "none";
                  }}
                >
                  <Icon size={14} style={{ color: action.color }} />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: "relative",
          }}
        >
          {items.map((vItem) => {
            const msg = messages[vItem.index];
            return (
              <div
                key={vItem.key}
                data-index={vItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vItem.start}px)`,
                  padding: "2px 16px",
                  boxSizing: "border-box",
                }}
              >
                {msg.role === "user" ? (
                  <UserBubble message={msg} />
                ) : (
                  <AssistantBubble message={msg} onRetry={onRetry} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default React.memo(MessageFeedInner);

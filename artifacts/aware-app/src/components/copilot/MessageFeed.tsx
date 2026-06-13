import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Message } from "@/lib/copilot/types";
import { UserBubble, AssistantBubble } from "./Bubble";

interface Props {
  messages: Message[];
}

export default function MessageFeed({ messages }: Props) {
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const atBottomRef = React.useRef(true);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const msg = messages[index];
      const base = 80;
      const contentHeight = Math.min(600, Math.ceil(msg.content.length / 60) * 22);
      const toolCardHeight = (msg.toolCalls?.length ?? 0) * 80;
      return base + contentHeight + toolCardHeight;
    },
    overscan: 4,
  });

  // Track user scroll position — only auto-scroll when already at bottom
  React.useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const onScroll = () => {
      atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll on new messages or streaming content growth
  const lastMsg = messages[messages.length - 1];
  React.useEffect(() => {
    if (!atBottomRef.current) return;
    const el = parentRef.current;
    if (el) {
      // Use requestAnimationFrame to let the virtualizer re-measure first
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages.length, lastMsg?.content, lastMsg?.toolCalls?.length]);

  // Scroll to bottom on initial load
  React.useEffect(() => {
    const el = parentRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

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
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "var(--proof-text-secondary)",
            fontSize: 13,
          }}
        >
          No messages yet — ask something or use a Quick Action.
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
                  <AssistantBubble message={msg} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

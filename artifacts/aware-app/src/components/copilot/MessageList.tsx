import React from "react";
import { Bot } from "lucide-react";
import ChatMessage, { type ChatMsg } from "@/components/aware/ChatMessage";
import ThinkingStepFeed from "./ThinkingStepFeed";
import type { LangGraphExecutionState } from "@/lib/ai/langGraphTypes";
import type { AIUseCase } from "@/lib/ai";

interface Props {
  messages: ChatMsg[];
  busy: boolean;
  lgState: LangGraphExecutionState | null;
  lgHistory: LangGraphExecutionState[];
  expandedMsgs: Set<number>;
  copiedIndex: number | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  useCaseIcons: Record<string, React.ReactNode>;
  useCases: AIUseCase[];
  online: boolean;
  onToggleExpand: (idx: number) => void;
  onCopy: (idx: number, content: string) => void;
  onFollowUp: (uc: AIUseCase) => void;
  onNewChat: () => void;
}

const MAX_PREVIEW = 320;

export default function MessageList({
  messages,
  busy,
  lgState,
  lgHistory,
  expandedMsgs,
  copiedIndex,
  messagesEndRef,
  useCaseIcons,
  useCases,
  online,
  onToggleExpand,
  onCopy,
  onFollowUp,
  onNewChat,
}: Props) {
  // Compute message grouping metadata
  const msgMeta = messages.map((m, i) => {
    const prev = messages[i - 1];
    const tsDiff = m.timestamp && prev?.timestamp ? m.timestamp - prev.timestamp > 60000 : false;
    const isFirstInGroup = !prev || prev.role !== m.role || tsDiff;
    const isLastInGroup = i === messages.length - 1 || messages[i + 1].role !== m.role;
    const showAvatar = m.role === "assistant" && isFirstInGroup;
    return { isFirstInGroup, isLastInGroup, showAvatar };
  });

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
      {messages.map((msg, i) => {
        if (msg.type === "capabilities") {
          return (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "12px 16px", borderRadius: 10, background: "var(--proof-surface-2)", border: "1px solid var(--proof-border-strong)", fontSize: 12, color: "var(--proof-text-secondary)" }}>
              <Bot size={18} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
              <span>
                I can analyze test runs, detect flaky tests, compare environments, assess deployment risk, generate reports, and more. Try a <strong>Quick Analysis</strong> from the sidebar or just ask a question.
              </span>
            </div>
          );
        }
        return (
          <ChatMessage
            key={i}
            msg={msg}
            index={i}
            isFirstInGroup={msgMeta[i].isFirstInGroup}
            isLastInGroup={msgMeta[i].isLastInGroup}
            showAvatar={msgMeta[i].showAvatar}
            expanded={expandedMsgs.has(i)}
            copied={copiedIndex === i}
            useCases={useCases}
            useCaseIcons={useCaseIcons}
            onToggleExpand={() => onToggleExpand(i)}
            onCopy={() => onCopy(i, msg.content)}
            onNewChat={onNewChat}
            onFollowUp={onFollowUp}
            MAX_PREVIEW={MAX_PREVIEW}
          />
        );
      })}
      {busy && <ThinkingStepFeed lgState={lgState} lgHistory={lgHistory} busy={busy} />}
      <div ref={messagesEndRef} />
    </div>
  );
}

import React from "react";
import { Send } from "lucide-react";

interface Props {
  input: string;
  busy: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onInput: (val: string) => void;
}

export default function InputBar({ input, busy, textareaRef, onSend, onKeyDown, onInput }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "12px 0 2px",
        borderTop: "1px solid var(--proof-border)",
      }}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => onInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask about tests, environments, suites…"
        rows={1}
        style={{
          flex: 1,
          resize: "none",
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid var(--proof-border)",
          background: "var(--proof-surface)",
          color: "var(--proof-text)",
          fontSize: 13,
          lineHeight: 1.5,
          outline: "none",
          minHeight: 42,
          maxHeight: 120,
        }}
      />
      <button
        onClick={onSend}
        disabled={!input.trim() || busy}
        title="Send"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 42,
          height: 42,
          borderRadius: 10,
          border: "none",
          cursor: !input.trim() || busy ? "not-allowed" : "pointer",
          opacity: !input.trim() || busy ? 0.5 : 1,
          background: "var(--proof-blue)",
          color: "white",
          flexShrink: 0,
        }}
      >
        <Send size={16} />
      </button>
    </div>
  );
}

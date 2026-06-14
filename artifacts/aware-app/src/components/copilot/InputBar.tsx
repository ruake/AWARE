import React from "react";
import { Send, Square } from "lucide-react";

interface Props {
  input: string;
  busy: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onSend: () => void;
  onStop?: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onInput: (val: string) => void;
}

export default function InputBar({ input, busy, textareaRef, onSend, onStop, onKeyDown, onInput }: Props) {
  const canSend = input.trim().length > 0 && !busy;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  return (
    <div
      style={{
        borderTop: "1px solid var(--proof-border)",
        padding: "8px 12px 10px",
        background: "var(--proof-surface)",
      }}
    >
      {/* Streaming status bar — Amershi G4: show timing/progress */}
      {busy && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 2px 6px",
            fontSize: 11,
            color: "var(--proof-blue)",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--proof-blue)",
              animation: "pulse 1.2s ease-in-out infinite",
            }}
          />
          Generating response…
          <button
            onClick={onStop}
            title="Stop generation"
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: 4,
              border: "1px solid #ef444440",
              background: "#ef444410",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Square size={10} fill="currentColor" /> Stop
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          background: "var(--proof-surface-2)",
          border: `1px solid ${busy ? "var(--proof-blue)" : "var(--proof-border)"}`,
          borderRadius: 10,
          padding: "6px 6px 6px 12px",
          transition: "border-color 0.2s",
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          placeholder={busy ? "Waiting for response…" : "Ask about test runs, failures, flakiness, promotion status…"}
          rows={1}
          disabled={busy}
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--proof-text)",
            fontFamily: "inherit",
            minHeight: 24,
            maxHeight: 140,
            overflowY: "auto",
            padding: 0,
            opacity: busy ? 0.5 : 1,
          }}
        />
        <button
          onClick={busy ? undefined : onSend}
          disabled={!canSend}
          title={busy ? "Generating…" : canSend ? "Send (Enter)" : "Type a message"}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "none",
            background: canSend ? "var(--proof-blue)" : "var(--proof-border)",
            color: canSend ? "#fff" : "var(--proof-text-secondary)",
            cursor: canSend ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <Send size={14} />
        </button>
      </div>
      <div
        style={{
          fontSize: 10,
          color: "var(--proof-text-secondary)",
          marginTop: 4,
          textAlign: "center",
        }}
      >
        Enter to send · Shift+Enter for newline
      </div>
    </div>
  );
}

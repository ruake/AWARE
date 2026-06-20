import React from "react";
import { Edit3, Save, X, GitBranch } from "lucide-react";
import type { Message } from "@/lib/copilot/types";

interface EditBranchProps {
  message: Message;
  onSave: (messageId: string, newContent: string) => void;
  onCancel: () => void;
  onBranch: (messageId: string) => void;
}

export default function EditBranch({ message, onSave, onCancel, onBranch }: EditBranchProps) {
  const [value, setValue] = React.useState(message.content);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed.length > 0 && trimmed !== message.content) {
      onSave(message.id, trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        padding: "4px 0",
      }}
    >
      <div
        style={{
          flex: 1,
          maxWidth: "88%",
          background: "rgba(59,130,246,0.04)",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 14,
          padding: "10px 12px 8px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom: "1px solid var(--proof-border)",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(59,130,246,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Edit3 size={12} style={{ color: "var(--proof-blue-bright)" }} />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--proof-blue-bright)",
              letterSpacing: "0.2px",
              textTransform: "uppercase",
            }}
          >
            Editing message
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10.5,
              color: "var(--proof-text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {value.length}
          </span>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{
            width: "100%",
            resize: "none",
            border: "1px solid var(--proof-border)",
            background: "rgba(2, 8, 23, 0.6)",
            outline: "none",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--proof-text)",
            fontFamily: "var(--font-sans)",
            minHeight: 60,
            maxHeight: 200,
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        />

        {/* History note */}
        <div
          style={{
            fontSize: 10.5,
            color: "var(--proof-text-muted)",
            marginTop: 6,
            lineHeight: 1.4,
          }}
        >
          Editing message &mdash; new responses will branch from this point
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
            justifyContent: "flex-end",
          }}
        >
          {/* Branch button */}
          <button
            onClick={() => onBranch(message.id)}
            title="Branch from here"
            style={{
              marginRight: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 10px",
              borderRadius: 7,
              border: "1px solid rgba(139,92,246,0.2)",
              background: "rgba(139,92,246,0.06)",
              color: "#a78bfa",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            <GitBranch size={12} />
            Branch
          </button>

          {/* Cancel */}
          <button
            onClick={onCancel}
            title="Cancel (Esc)"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 10px",
              borderRadius: 7,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-hover-light)",
              color: "var(--proof-text-secondary)",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            <X size={12} />
            Cancel
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={value.trim().length === 0}
            title="Save (Enter)"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 7,
              border: "none",
              background:
                value.trim().length > 0
                  ? "linear-gradient(135deg, #059669, #0891b2)"
                  : "rgba(255,255,255,0.05)",
              color: value.trim().length > 0 ? "#fff" : "var(--proof-text-muted)",
              cursor: value.trim().length > 0 ? "pointer" : "not-allowed",
              fontSize: 11,
              fontWeight: 600,
              transition: "all 0.15s",
              opacity: value.trim().length > 0 ? 1 : 0.5,
            }}
          >
            <Save size={12} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

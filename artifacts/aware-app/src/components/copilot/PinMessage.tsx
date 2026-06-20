import React from "react";
import { Pin, Check, X } from "lucide-react";
import type { Message, Bookmark } from "@/lib/copilot/types";
import { addBookmark, removeBookmark } from "@/lib/copilot/storage";

interface PinMessageProps {
  message: Message;
  threadId: string;
  bookmarks: Bookmark[];
  onBookmarkChange: () => void;
}

export function PinMessage({ message, threadId, bookmarks, onBookmarkChange }: PinMessageProps) {
  const [showLabelInput, setShowLabelInput] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const bookmark = bookmarks.find(
    (b) => b.threadId === threadId && b.messageId === message.id
  );
  const isPinned = !!bookmark;

  const handleToggle = () => {
    if (isPinned && bookmark) {
      removeBookmark(bookmark.id);
      onBookmarkChange();
    } else {
      setLabel(message.content.slice(0, 80));
      setShowLabelInput(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSave = () => {
    const newBookmark: Bookmark = {
      id: `bm_${Date.now()}`,
      threadId,
      messageId: message.id,
      label: label || message.content.slice(0, 80),
      createdAt: Date.now(),
      contentPreview: message.content.slice(0, 120),
    };
    addBookmark(newBookmark);
    setShowLabelInput(false);
    onBookmarkChange();
  };

  const handleCancel = () => {
    setShowLabelInput(false);
    setLabel("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (showLabelInput) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          ref={inputRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Bookmark label..."
          style={{
            padding: "2px 6px",
            borderRadius: 4,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            fontSize: 11,
            width: 140,
            outline: "none",
          }}
        />
        <button
          onClick={handleSave}
          title="Save"
          style={{
            padding: 2,
            borderRadius: 4,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#34d399",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <Check size={12} />
        </button>
        <button
          onClick={handleCancel}
          title="Cancel"
          style={{
            padding: 2,
            borderRadius: 4,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-muted)",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      title={isPinned ? "Remove bookmark" : "Bookmark this message"}
      style={{
        padding: 3,
        borderRadius: 4,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: isPinned ? "#f59e0b" : "var(--proof-text-muted)",
        display: "inline-flex",
        alignItems: "center",
        opacity: isPinned ? 1 : 0.5,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!isPinned) e.currentTarget.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        if (!isPinned) e.currentTarget.style.opacity = "0.5";
      }}
    >
      <Pin size={11} />
    </button>
  );
}

export function PinBadge({
  bookmarks,
  threadId,
  messageId,
}: {
  bookmarks: Bookmark[];
  threadId: string;
  messageId: string;
}) {
  const isPinned = bookmarks.some(
    (b) => b.threadId === threadId && b.messageId === messageId
  );
  if (!isPinned) return null;
  return (
    <span
      title="Bookmarked"
      style={{
        display: "inline-flex",
        alignItems: "center",
        color: "#f59e0b",
        marginLeft: 4,
      }}
    >
      <Pin size={10} />
    </span>
  );
}

import React from "react";
import {
  MessageSquare, Plus, Trash2, Search, Pin, PinOff,
  ChevronLeft, ChevronRight, Edit3, Check, X, MoreHorizontal,
} from "lucide-react";
import type { Thread } from "@/lib/copilot/types";

interface ThreadSidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onThreadCreate: (title?: string) => void;
  onThreadDelete: (threadId: string) => void;
  onThreadRename: (threadId: string, title: string) => void;
  onThreadsReorder: (threads: Thread[]) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

function ThreadItem({
  thread,
  isActive,
  isPinned,
  isFirst,
  isLast,
  onSelect,
  onDelete,
  onRename,
  onMoveUp,
  onMoveDown,
}: {
  thread: Thread;
  isActive: boolean;
  isPinned: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(thread.title);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleRename = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== thread.title) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  const handleCancelRename = () => {
    setEditValue(thread.title);
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
        }}
      >
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") handleCancelRename();
          }}
          onBlur={handleRename}
          style={{
            flex: 1,
            background: "var(--proof-surface-3)",
            border: "1px solid var(--proof-border-focus)",
            borderRadius: 5,
            padding: "3px 7px",
            fontSize: 12,
            color: "var(--proof-text)",
            outline: "none",
            minWidth: 0,
          }}
        />
        <button
          onClick={handleRename}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            color: "var(--proof-green)",
          }}
        >
          <Check size={12} />
        </button>
        <button
          onClick={handleCancelRename}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            color: "var(--proof-text-muted)",
          }}
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  if (confirmingDelete) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--proof-red-bright)",
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Delete?
        </span>
        <button
          onClick={() => {
            onDelete();
            setConfirmingDelete(false);
          }}
          style={{
            background: "rgba(248,68,90,0.15)",
            border: "1px solid var(--proof-red-border)",
            borderRadius: 4,
            cursor: "pointer",
            padding: "2px 6px",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-red-bright)",
          }}
        >
          Delete
        </button>
        <button
          onClick={() => setConfirmingDelete(false)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            color: "var(--proof-text-muted)",
          }}
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      onMouseDown={(e) => {
        if (e.button === 1) {
          e.preventDefault();
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 10px",
        cursor: "pointer",
        borderRadius: 7,
        background: isActive
          ? "var(--proof-blue-bg)"
          : isPinned
          ? "rgba(99,130,178,0.04)"
          : "transparent",
        border: isActive ? "1px solid var(--proof-blue-border)" : "1px solid transparent",
        transition: "background 0.1s, border-color 0.1s",
        position: "relative",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "var(--proof-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = isPinned
            ? "rgba(99,130,178,0.04)"
            : "transparent";
        }
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          borderRadius: 5,
          background: isActive
            ? "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.1))"
            : "var(--proof-surface-3)",
          border: isActive
            ? "1px solid var(--proof-blue-border)"
            : "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MessageSquare
          size={10}
          style={{
            color: isActive ? "var(--proof-blue-bright)" : "var(--proof-text-muted)",
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? "var(--proof-text)" : "var(--proof-text-secondary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.3,
          }}
        >
          {thread.title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 1,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "var(--proof-text-muted)",
            }}
          >
            {thread.messageCount === 0 ? "Empty" : `${thread.messageCount} msg${thread.messageCount !== 1 ? "s" : ""}`}
          </span>
          <span style={{ fontSize: 8, color: "var(--proof-text-tertiary)" }}>·</span>
          <span
            style={{
              fontSize: 10,
              color: "var(--proof-text-muted)",
            }}
          >
            {relTime(thread.updatedAt)}
          </span>
        </div>
      </div>

      <div
        className="thread-actions"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          opacity: 0,
          transition: "opacity 0.1s",
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isFirst && (
          <button
            onClick={onMoveUp}
            title="Move up"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 2,
              display: "flex",
              color: "var(--proof-text-muted)",
              borderRadius: 3,
            }}
          >
            <ChevronLeft size={11} style={{ transform: "rotate(90deg)" }} />
          </button>
        )}
        {!isLast && (
          <button
            onClick={onMoveDown}
            title="Move down"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 2,
              display: "flex",
              color: "var(--proof-text-muted)",
              borderRadius: 3,
            }}
          >
            <ChevronRight size={11} style={{ transform: "rotate(90deg)" }} />
          </button>
        )}
        <button
          onClick={() => {
            setEditValue(thread.title);
            setEditing(true);
          }}
          title="Rename"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            color: "var(--proof-text-muted)",
            borderRadius: 3,
          }}
        >
          <Edit3 size={11} />
        </button>
        <button
          onClick={() => setConfirmingDelete(true)}
          title="Delete"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            color: "var(--proof-text-muted)",
            borderRadius: 3,
          }}
        >
          <Trash2 size={11} />
        </button>
      </div>

    </div>
  );
}

export function ThreadSidebar({
  threads,
  activeThreadId,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
  onThreadRename,
  onThreadsReorder,
  collapsed,
  onToggleCollapse,
}: ThreadSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const normalized = threads.map((t) => ({
    ...t,
    pinned: t.pinned ?? false,
  }));

  const filtered = searchQuery.trim()
    ? normalized.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : normalized;

  const pinned = filtered.filter((t) => t.pinned);
  const unpinned = filtered.filter((t) => !t.pinned);

  const pinThread = (threadId: string) => {
    const updated = normalized.map((t) =>
      t.id === threadId ? { ...t, pinned: !t.pinned } : t
    );
    onThreadsReorder(updated);
  };

  const moveThread = (index: number, direction: -1 | 1) => {
    const arr = [...filtered];
    const target = index + direction;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    const reordered = arr.map((moved) => {
      const original = normalized.find((n) => n.id === moved.id)!;
      return original;
    });
    const remaining = normalized.filter((n) => !filtered.some((f) => f.id === n.id));
    onThreadsReorder([...reordered, ...remaining]);
  };

  const handleCreate = () => {
    onThreadCreate();
    setSearchQuery("");
  };

  if (collapsed) {
    return (
      <div
        style={{
          width: 50,
          flexShrink: 0,
          borderRight: "1px solid var(--proof-border)",
          background: "var(--proof-sidebar-bg)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          padding: "8px 0",
          overflow: "hidden",
        }}
      >
        <button
          onClick={onToggleCollapse}
          title="Expand sidebar"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 6,
            borderRadius: 6,
            display: "flex",
            color: "var(--proof-text-muted)",
            transition: "color 0.1s, background 0.1s",
          }}
        >
          <ChevronRight size={16} />
        </button>

        <div
          style={{
            width: 24,
            height: 1,
            background: "var(--proof-border)",
            margin: "4px 0",
          }}
        />

        {threads.slice(0, 8).map((thread) => (
          <button
            key={thread.id}
            onClick={() => onThreadSelect(thread.id)}
            title={thread.title}
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              background:
                thread.id === activeThreadId
                  ? "var(--proof-blue-bg)"
                  : "transparent",
              border:
                thread.id === activeThreadId
                  ? "1px solid var(--proof-blue-border)"
                  : "1px solid transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.1s",
              color:
                thread.id === activeThreadId
                  ? "var(--proof-blue-bright)"
                  : "var(--proof-text-muted)",
            }}
          >
            <MessageSquare size={14} />
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <button
          onClick={handleCreate}
          title="New chat"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 6,
            borderRadius: 6,
            display: "flex",
            color: "var(--proof-blue-bright)",
            transition: "color 0.1s, background 0.1s",
          }}
        >
          <Plus size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 280,
        maxWidth: 280,
        flexShrink: 0,
        borderRight: "1px solid var(--proof-border)",
        background: "var(--proof-sidebar-bg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px 8px",
          borderBottom: "1px solid var(--proof-border)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--proof-text)",
            letterSpacing: "-0.2px",
          }}
        >
          Threads
        </span>
        <button
          onClick={onToggleCollapse}
          title="Collapse sidebar"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 4,
            borderRadius: 5,
            display: "flex",
            color: "var(--proof-text-muted)",
            transition: "color 0.1s, background 0.1s",
          }}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <div
        style={{
          padding: "8px 10px 4px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 8,
              color: "var(--proof-text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads..."
            style={{
              width: "100%",
              height: 28,
              padding: "0 8px 0 28px",
              background: "var(--proof-surface-2)",
              border: "1px solid var(--proof-border)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--proof-text)",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 6,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 2,
                display: "flex",
                color: "var(--proof-text-muted)",
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div
        className="thread-sidebar-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 8px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {filtered.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "32px 16px",
              textAlign: "center",
            }}
          >
            <MessageSquare
              size={24}
              style={{ color: "var(--proof-text-tertiary)" }}
            />
            <span
              style={{
                fontSize: 12,
                color: "var(--proof-text-muted)",
                lineHeight: 1.4,
              }}
            >
              {searchQuery.trim()
                ? "No threads match your search"
                : "No chats yet"}
            </span>
            {!searchQuery.trim() && (
              <button
                onClick={handleCreate}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid var(--proof-blue-border)",
                  background: "var(--proof-blue-bg)",
                  color: "var(--proof-blue-bright)",
                  marginTop: 4,
                }}
              >
                <Plus size={12} />
                Start a chat
              </button>
            )}
          </div>
        )}

        {pinned.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 10px 2px",
              }}
            >
              <Pin
                size={10}
                style={{ color: "var(--proof-text-muted)", transform: "rotate(45deg)" }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--proof-text-muted)",
                }}
              >
                Pinned
              </span>
            </div>
            {pinned.map((thread, idx) => {
              const globalIdx = filtered.indexOf(thread);
              const isFirst = globalIdx === 0;
              const isLast = globalIdx === filtered.length - 1;
              return (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={thread.id === activeThreadId}
                  isPinned={true}
                  isFirst={isFirst}
                  isLast={isLast}
                  onSelect={() => onThreadSelect(thread.id)}
                  onDelete={() => onThreadDelete(thread.id)}
                  onRename={(title) => onThreadRename(thread.id, title)}
                  onMoveUp={() => moveThread(globalIdx, -1)}
                  onMoveDown={() => moveThread(globalIdx, 1)}
                />
              );
            })}
            <div
              style={{
                height: 1,
                background: "var(--proof-border-light)",
                margin: "4px 10px",
              }}
            />
          </>
        )}

        {unpinned.map((thread, idx) => {
          const globalIdx = filtered.indexOf(thread);
          const isFirst = globalIdx === 0;
          const isLast = globalIdx === filtered.length - 1;
          return (
            <ThreadItem
              key={thread.id}
              thread={thread}
              isActive={thread.id === activeThreadId}
              isPinned={false}
              isFirst={isFirst}
              isLast={isLast}
              onSelect={() => onThreadSelect(thread.id)}
              onDelete={() => onThreadDelete(thread.id)}
              onRename={(title) => onThreadRename(thread.id, title)}
              onMoveUp={() => moveThread(globalIdx, -1)}
              onMoveDown={() => moveThread(globalIdx, 1)}
            />
          );
        })}
      </div>

      <div
        style={{
          padding: "8px 10px 10px",
          borderTop: "1px solid var(--proof-border)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleCreate}
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
          <Plus size={14} />
          New Chat
        </button>
      </div>
    </div>
  );
}

import React from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Search,
  Pin,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Check,
  X} from "lucide-react";
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
  isFocused,
  isTabStop,
  itemId,
  itemRef,
  onSelect,
  onDelete,
  onRename,
  onMoveUp,
  onMoveDown}: {
  thread: Thread;
  isActive: boolean;
  isPinned: boolean;
  isFirst: boolean;
  isLast: boolean;
  isFocused: boolean;
  isTabStop: boolean;
  itemId: string;
  itemRef?: React.RefObject<HTMLDivElement | null>;
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
          padding: "6px 10px"}}
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
            minWidth: 0}}
        />
        <button
          onClick={handleRename}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            color: "var(--proof-green)"}}
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
            color: "var(--proof-text-muted)"}}
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
          padding: "6px 10px"}}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--proof-red-bright)",
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"}}
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
            color: "var(--proof-red-bright)"}}
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
            color: "var(--proof-text-muted)"}}
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={itemRef as React.RefObject<HTMLDivElement>}
      id={itemId}
      role="option"
      aria-selected={isActive}
      tabIndex={isTabStop ? 0 : -1}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          setConfirmingDelete(true);
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        cursor: "pointer",
        borderRadius: 12,
        background: isActive
          ? "var(--proof-blue-bg)"
          : isPinned
            ? "rgba(99,130,178,0.04)"
            : "transparent",
        border: isActive
          ? "1px solid var(--proof-blue-border)"
          : isFocused
            ? "1px solid var(--proof-border-focus)"
            : "1px solid transparent",
        transition: "all 0.2s",
        position: "relative",
        userSelect: "none",
        margin: "0 4px"}}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "var(--proof-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = isPinned ? "rgba(99,130,178,0.04)" : "transparent";
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
          border: isActive ? "1px solid var(--proof-blue-border)" : "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"}}
      >
        <MessageSquare
          size={10}
          style={{
            color: isActive ? "var(--proof-blue-bright)" : "var(--proof-text-muted)"}}
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
            lineHeight: 1.3}}
        >
          {thread.title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 1}}
        >
          <span
            style={{
              fontSize: 10,
              color: "var(--proof-text-muted)"}}
          >
            {thread.messageCount === 0
              ? "Empty"
              : `${thread.messageCount} msg${thread.messageCount !== 1 ? "s" : ""}`}
          </span>
          <span style={{ fontSize: 8, color: "var(--proof-text-tertiary)" }}>·</span>
          <span
            style={{
              fontSize: 10,
              color: "var(--proof-text-muted)"}}
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
          flexShrink: 0}}
        onClick={(e) => e.stopPropagation()}
      >
        {!isFirst && (
          <button
            onClick={onMoveUp}
            title="Move up"
            tabIndex={-1}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 2,
              display: "flex",
              color: "var(--proof-text-muted)",
              borderRadius: 3}}
          >
            <ChevronLeft size={11} style={{ transform: "rotate(90deg)" }} />
          </button>
        )}
        {!isLast && (
          <button
            onClick={onMoveDown}
            title="Move down"
            tabIndex={-1}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 2,
              display: "flex",
              color: "var(--proof-text-muted)",
              borderRadius: 3}}
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
          tabIndex={-1}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            color: "var(--proof-text-muted)",
            borderRadius: 3}}
        >
          <Edit3 size={11} />
        </button>
        <button
          onClick={() => setConfirmingDelete(true)}
          title="Delete (Del)"
          tabIndex={-1}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            color: "var(--proof-text-muted)",
            borderRadius: 3}}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

const MemoThreadItem = React.memo(ThreadItem);

export function ThreadSidebar({
  threads,
  activeThreadId,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
  onThreadRename,
  onThreadsReorder,
  collapsed,
  onToggleCollapse}: ThreadSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Map<number, React.RefObject<HTMLDivElement | null>>>(new Map());

  const normalized = threads.map((t) => ({
    ...t,
    pinned: t.pinned ?? false}));

  const filtered = searchQuery.trim()
    ? normalized.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : normalized;

  const pinned = filtered.filter((t) => t.pinned);
  const unpinned = filtered.filter((t) => !t.pinned);
  const unpinnedCount = normalized.filter((t) => !t.pinned).length;

  const getOrCreateRef = (idx: number) => {
    if (!itemRefs.current.has(idx)) {
      itemRefs.current.set(idx, React.createRef<HTMLDivElement>());
    }
    return itemRefs.current.get(idx)!;
  };

  const _pinThread = (threadId: string) => {
    const updated = normalized.map((t) => (t.id === threadId ? { ...t, pinned: !t.pinned } : t));
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

  const handleClearAll = () => {
    const pinnedOnly = normalized.filter((t) => t.pinned);
    onThreadsReorder(pinnedOnly);
    setShowClearConfirm(false);
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    const len = filtered.length;
    if (len === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = focusedIndex < len - 1 ? focusedIndex + 1 : 0;
      setFocusedIndex(next);
      itemRefs.current.get(next)?.current?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = focusedIndex > 0 ? focusedIndex - 1 : len - 1;
      setFocusedIndex(prev);
      itemRefs.current.get(prev)?.current?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusedIndex(0);
      itemRefs.current.get(0)?.current?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      setFocusedIndex(len - 1);
      itemRefs.current.get(len - 1)?.current?.focus();
    }
  };

  const activeIdx = filtered.findIndex((t) => t.id === activeThreadId);
  // Roving tabIndex: exactly ONE item always has tabIndex=0 for Tab entry.
  const defaultTabbableIdx = activeIdx >= 0 ? activeIdx : 0;
  const tabbableIdx = focusedIndex >= 0 ? focusedIndex : defaultTabbableIdx;
  const _activedescendant = focusedIndex >= 0 ? `thread-item-${focusedIndex}` : undefined;

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
          overflow: "hidden"}}
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
            transition: "color 0.1s, background 0.1s"}}
        >
          <ChevronRight size={16} />
        </button>

        <div
          style={{
            width: 24,
            height: 1,
            background: "var(--proof-border)",
            margin: "4px 0"}}
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
              background: thread.id === activeThreadId ? "var(--proof-blue-bg)" : "transparent",
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
                  : "var(--proof-text-muted)"}}
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
            transition: "color 0.1s, background 0.1s"}}
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
        overflow: "hidden"}}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px 8px",
          borderBottom: "1px solid var(--proof-border)",
          flexShrink: 0}}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--proof-text)",
            letterSpacing: "-0.2px"}}
        >
          Threads
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {unpinnedCount > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              title="Clear unpinned threads"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: 5,
                display: "flex",
                color: "var(--proof-text-muted)",
                transition: "color 0.1s, background 0.1s"}}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--proof-red-bright)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)";
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
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
              transition: "color 0.1s, background 0.1s"}}
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <div
          style={{
            margin: "8px 10px 0",
            padding: "8px 10px",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 7,
            fontSize: 11,
            color: "var(--proof-text-secondary)"}}
        >
          <div style={{ fontWeight: 600, color: "var(--proof-red-bright)", marginBottom: 6 }}>
            Delete {unpinnedCount} conversation{unpinnedCount !== 1 ? "s" : ""}?
          </div>
          <div style={{ marginBottom: 8, fontSize: 10.5, color: "var(--proof-text-muted)" }}>
            Pinned threads are kept.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleClearAll}
              style={{
                flex: 1,
                padding: "4px 0",
                borderRadius: 5,
                border: "1px solid var(--proof-red-border)",
                background: "rgba(239,68,68,0.12)",
                color: "var(--proof-red-bright)",
                cursor: "pointer",
                fontSize: 10.5,
                fontWeight: 600}}
            >
              Delete all
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              style={{
                flex: 1,
                padding: "4px 0",
                borderRadius: 5,
                border: "1px solid var(--proof-border)",
                background: "transparent",
                color: "var(--proof-text-muted)",
                cursor: "pointer",
                fontSize: 10.5}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          padding: "8px 10px 4px",
          flexShrink: 0}}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center"}}
        >
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 8,
              color: "var(--proof-text-muted)",
              pointerEvents: "none"}}
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
              color: "var(--proof-text)"}}
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
                color: "var(--proof-text-muted)"}}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div
        ref={listRef}
        role="listbox"
        aria-label="Conversation threads"
        aria-activedescendant={focusedIndex >= 0 ? `thread-item-${focusedIndex}` : undefined}
        className="thread-sidebar-scroll"
        onKeyDown={handleListKeyDown}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 8px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2}}
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
              textAlign: "center"}}
          >
            <MessageSquare size={24} style={{ color: "var(--proof-text-tertiary)" }} />
            <span
              style={{
                fontSize: 12,
                color: "var(--proof-text-muted)",
                lineHeight: 1.4}}
            >
              {searchQuery.trim()
                ? "No threads match your search"
                : "Start your first conversation with the AWARE Copilot"}
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
                  marginTop: 4}}
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
                padding: "6px 10px 2px"}}
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
                  color: "var(--proof-text-muted)"}}
              >
                Pinned
              </span>
            </div>
            {pinned.map((thread) => { // eslint-disable-line react-hooks/refs
              const globalIdx = filtered.indexOf(thread);
              const isFirst = globalIdx === 0;
              const isLast = globalIdx === filtered.length - 1;
              const pinnedRef = getOrCreateRef(globalIdx);
              return (
                <MemoThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={thread.id === activeThreadId}
                  isPinned={true}
                  isFirst={isFirst}
                  isLast={isLast}
                  isFocused={globalIdx === focusedIndex}
                  isTabStop={globalIdx === tabbableIdx}
                  itemId={`thread-item-${globalIdx}`}
                  itemRef={pinnedRef}
                  onSelect={() => {
                    setFocusedIndex(globalIdx);
                    onThreadSelect(thread.id);
                  }}
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
                margin: "4px 10px"}}
            />
          </>
        )}

        {unpinned.map((thread) => { // eslint-disable-line react-hooks/refs
          const globalIdx = filtered.indexOf(thread);
          const isFirst = globalIdx === 0;
          const isLast = globalIdx === filtered.length - 1;
          const unpinnedRef = getOrCreateRef(globalIdx);
          return (
            <MemoThreadItem
              key={thread.id}
              thread={thread}
              isActive={thread.id === activeThreadId}
              isPinned={false}
              isFirst={isFirst}
              isLast={isLast}
              isFocused={globalIdx === focusedIndex}
              isTabStop={globalIdx === tabbableIdx}
              itemId={`thread-item-${globalIdx}`}
              itemRef={unpinnedRef}
              onSelect={() => {
                setFocusedIndex(globalIdx);
                onThreadSelect(thread.id);
              }}
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
          flexShrink: 0}}
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
            transition: "all 0.15s"}}
        >
          <Plus size={14} />
          New Chat
        </button>
      </div>

      <style>{`
        .thread-actions { opacity: 0 !important; }
        [role="option"]:hover .thread-actions,
        [role="option"]:focus .thread-actions,
        [role="option"]:focus-within .thread-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

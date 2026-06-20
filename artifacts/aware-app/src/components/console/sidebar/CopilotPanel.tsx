import React from "react";
import { useLocation } from "wouter";
import { useSyncedUrlState } from "@/lib/urlState";
import { QUICK_ACTIONS } from "@/lib/copilot/quickActions";
import {
  loadThreads, saveThreads, deleteThreadFromList, updateThreadInList,
  getActiveThreadId, setActiveThreadId,
} from "@/lib/copilot/storage";
import type { Thread } from "@/lib/copilot/types";
import { Plus, Bot, Zap, MessageSquare, Trash2, Edit3, Check, X, Search } from "lucide-react";

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

export function CopilotPanel() {
  const [, navigate] = useLocation();
  const [, setAction] = useSyncedUrlState<string | null>("copilotAction", null);
  const [, setNewChat] = useSyncedUrlState<number | null>("copilotNew", null);
  const [threads, setThreads] = React.useState<Thread[]>(() => loadThreads());
  const [search, setSearch] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
  const listRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Map<number, HTMLDivElement>>(new Map());
  const editInputRef = React.useRef<HTMLInputElement>(null);

  const activeId = getActiveThreadId();

  const filtered = search.trim()
    ? threads.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : threads;

  const unpinnedCount = threads.filter((t) => !t.pinned).length;

  const refresh = () => setThreads(loadThreads());

  const handleNewChat = () => {
    setNewChat(Date.now());
    navigate("/copilot");
  };

  const handleSelect = (id: string, idx: number) => {
    setFocusedIndex(idx);
    setActiveThreadId(id);
    navigate("/copilot");
  };

  const handleDelete = (e: React.MouseEvent | null, id: string) => {
    e?.stopPropagation();
    if (confirmDelete === id) {
      if (activeId === id) {
        const updated = deleteThreadFromList(threads, id);
        const next = updated[0] ?? null;
        setActiveThreadId(next?.id ?? null);
        saveThreads(updated);
      } else {
        const updated = deleteThreadFromList(threads, id);
        saveThreads(updated);
      }
      setConfirmDelete(null);
      refresh();
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleDeleteKey = (id: string) => {
    if (confirmDelete === id) {
      if (activeId === id) {
        const updated = deleteThreadFromList(threads, id);
        const next = updated[0] ?? null;
        setActiveThreadId(next?.id ?? null);
        saveThreads(updated);
      } else {
        const updated = deleteThreadFromList(threads, id);
        saveThreads(updated);
      }
      setConfirmDelete(null);
      refresh();
      // Move focus to previous item
      setFocusedIndex((prev) => Math.max(0, prev - 1));
    } else {
      setConfirmDelete(id);
    }
  };

  const handleRename = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed) {
      const updated = updateThreadInList(threads, id, { title: trimmed });
      saveThreads(updated);
      refresh();
    }
    setEditingId(null);
  };

  const handleClearAll = () => {
    const pinned = threads.filter((t) => t.pinned);
    saveThreads(pinned);
    setThreads(pinned);
    setConfirmClearAll(false);
    setFocusedIndex(-1);
  };

  const handleAction = (message: string) => {
    setAction(message);
    navigate("/copilot");
  };

  const focusItem = React.useCallback((idx: number) => {
    setFocusedIndex(idx);
    itemRefs.current.get(idx)?.focus();
  }, []);

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    const len = filtered.length;
    if (len === 0) return;
    if (editingId) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusItem(focusedIndex < len - 1 ? focusedIndex + 1 : 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusItem(focusedIndex > 0 ? focusedIndex - 1 : len - 1);
        break;
      case "Home":
        e.preventDefault();
        focusItem(0);
        break;
      case "End":
        e.preventDefault();
        focusItem(len - 1);
        break;
      case "Enter":
        if (focusedIndex >= 0 && focusedIndex < len) {
          e.preventDefault();
          handleSelect(filtered[focusedIndex].id, focusedIndex);
        }
        break;
      case "Delete":
      case "Backspace":
        if (focusedIndex >= 0 && focusedIndex < len) {
          e.preventDefault();
          handleDeleteKey(filtered[focusedIndex].id);
        }
        break;
    }
  };

  React.useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  React.useEffect(() => {
    setFocusedIndex(-1);
  }, [search]);

  const activeIdx = filtered.findIndex((t) => t.id === activeId);
  // Roving tabIndex: exactly ONE item always has tabIndex=0 so Tab can enter the list.
  // When nothing is programmatically focused yet, default to the active thread or first item.
  const defaultTabbableIdx = activeIdx >= 0 ? activeIdx : 0;
  const tabbableIdx = focusedIndex >= 0 ? focusedIndex : defaultTabbableIdx;
  const activedescendant = focusedIndex >= 0 ? `copilot-thread-${focusedIndex}` : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* New Chat button */}
      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
        <button
          onClick={handleNewChat}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            width: "100%",
            padding: "6px 10px",
            borderRadius: 5,
            background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))",
            border: "1px solid rgba(59,130,246,0.2)",
            cursor: "pointer",
            color: "var(--proof-blue-bright)",
            fontSize: 11,
            fontWeight: 600,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.2)";
          }}
        >
          <Plus size={12} />
          <Bot size={12} />
          New Chat
        </button>
      </div>

      {/* Thread search */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--proof-border)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--proof-surface-2)",
            border: "1px solid var(--proof-border)",
            borderRadius: 5,
            padding: "0 7px",
          }}
        >
          <Search size={10} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search threads..."
            aria-label="Search threads"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--proof-text)",
              fontSize: 10.5,
              padding: "5px 0",
              fontFamily: "var(--font-sans)",
              minWidth: 0,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              style={{
                background: "none", border: "none", color: "var(--proof-text-muted)",
                cursor: "pointer", padding: 2, display: "inline-flex",
              }}
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Thread list */}
      <div
        style={{
          flex: "0 1 auto",
          overflowY: "auto",
          maxHeight: 260,
          borderBottom: "1px solid var(--proof-border)",
        }}
      >
        {/* Threads header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 10px 3px",
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
              color: "var(--proof-text-muted)",
            }}
          >
            Threads
          </span>
          {unpinnedCount > 0 && !confirmClearAll && (
            <button
              onClick={() => setConfirmClearAll(true)}
              title="Clear all unpinned threads"
              aria-label="Clear all unpinned threads"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 2,
                display: "inline-flex",
                color: "var(--proof-text-muted)",
                borderRadius: 3,
                transition: "color 0.12s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-red-bright)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)"; }}
            >
              <Trash2 size={9} />
            </button>
          )}
        </div>

        {/* Clear all confirm */}
        {confirmClearAll && (
          <div
            style={{
              margin: "0 8px 5px",
              padding: "6px 8px",
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 5,
              fontSize: 10,
            }}
          >
            <div style={{ color: "var(--proof-text-secondary)", marginBottom: 5 }}>
              Delete {unpinnedCount} unpinned thread{unpinnedCount !== 1 ? "s" : ""}?
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={handleClearAll}
                style={{
                  flex: 1, padding: "3px 0", borderRadius: 4,
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.12)", color: "#f87171",
                  cursor: "pointer", fontSize: 10, fontWeight: 600,
                }}
              >
                Delete all
              </button>
              <button
                onClick={() => setConfirmClearAll(false)}
                style={{
                  flex: 1, padding: "3px 0", borderRadius: 4,
                  border: "1px solid var(--proof-border)",
                  background: "transparent", color: "var(--proof-text-muted)",
                  cursor: "pointer", fontSize: 10,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ padding: "12px 10px", fontSize: 10, color: "var(--proof-text-muted)", textAlign: "center" }}>
            {search.trim() ? "No threads match" : "No conversations yet"}
          </div>
        )}

        {/* Keyboard-navigable thread listbox — container is not a tab stop; items use roving tabIndex */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Conversation threads"
          aria-activedescendant={activedescendant}
          onKeyDown={handleListKeyDown}
          style={{ outline: "none" }}
          tabIndex={-1}
        >
          {filtered.map((t, idx) => {
            const isActive = t.id === activeId;
            const isEditing = editingId === t.id;
            const isConfirming = confirmDelete === t.id;
            const isFocused = focusedIndex === idx;

            return (
              <div
                key={t.id}
                id={`copilot-thread-${idx}`}
                role="option"
                aria-selected={isActive}
                tabIndex={idx === tabbableIdx ? 0 : -1}
                ref={(el) => {
                  if (el) itemRefs.current.set(idx, el);
                  else itemRefs.current.delete(idx);
                }}
                onClick={() => handleSelect(t.id, idx)}
                onFocus={() => setFocusedIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(t.id, idx);
                  }
                  if (e.key === "Delete" || e.key === "Backspace") {
                    e.preventDefault();
                    handleDeleteKey(t.id);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  cursor: "pointer",
                  background: isActive
                    ? "rgba(59,130,246,0.08)"
                    : isFocused
                      ? "var(--proof-hover)"
                      : "transparent",
                  borderLeft: isActive ? "2px solid var(--proof-blue)" : "2px solid transparent",
                  outline: isFocused && !isActive ? "1px solid var(--proof-border-focus)" : "none",
                  outlineOffset: -1,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !isFocused) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {isEditing ? (
                  <>
                    <input
                      ref={editInputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") handleRename(t.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Rename thread"
                      style={{
                        flex: 1,
                        background: "var(--proof-surface-3)",
                        border: "1px solid var(--proof-border-focus)",
                        borderRadius: 4,
                        padding: "2px 6px",
                        fontSize: 10.5,
                        color: "var(--proof-text)",
                        outline: "none",
                        minWidth: 0,
                      }}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRename(t.id); }}
                      aria-label="Save rename"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", color: "var(--proof-green)" }}
                    >
                      <Check size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                      aria-label="Cancel rename"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", color: "var(--proof-text-muted)" }}
                    >
                      <X size={10} />
                    </button>
                  </>
                ) : (
                  <>
                    <MessageSquare
                      size={10}
                      style={{ flexShrink: 0, color: isActive ? "var(--proof-blue-bright)" : "var(--proof-text-muted)" }}
                    />
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 10.5,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "var(--proof-text)" : "var(--proof-text-secondary)",
                      }}
                    >
                      {t.title}
                    </span>
                    {isConfirming ? (
                      <span style={{ fontSize: 8.5, color: "var(--proof-red-bright)", fontWeight: 600, flexShrink: 0 }}>
                        Del again?
                      </span>
                    ) : (
                      <span style={{ fontSize: 8, color: "var(--proof-text-muted)", flexShrink: 0, marginRight: 2 }}>
                        {relTime(t.updatedAt)}
                      </span>
                    )}
                    <div
                      className="copilot-sidebar-actions"
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: "flex", gap: 1, opacity: 0, transition: "opacity 0.12s" }}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditValue(t.title); setEditingId(t.id); }}
                        tabIndex={-1}
                        aria-label="Rename thread"
                        title="Rename"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", color: "var(--proof-text-muted)", borderRadius: 3 }}
                      >
                        <Edit3 size={9} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, t.id)}
                        tabIndex={-1}
                        aria-label={isConfirming ? "Confirm delete" : "Delete thread (Del)"}
                        title={isConfirming ? "Click again to confirm" : "Delete (Del)"}
                        style={{
                          background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex",
                          color: isConfirming ? "var(--proof-red-bright)" : "var(--proof-text-muted)",
                          borderRadius: 3,
                        }}
                      >
                        <Trash2 size={9} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <style>{`
          div:hover > .copilot-sidebar-actions,
          [role="option"]:focus > .copilot-sidebar-actions,
          [role="option"]:focus-within > .copilot-sidebar-actions {
            opacity: 1 !important;
          }
        `}</style>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "6px 10px", flex: 1, overflowY: "auto" }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            color: "var(--proof-text-muted)",
            marginBottom: 5,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Zap size={10} />
          Quick Actions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => handleAction(a.message)}
                title={a.message}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 10.5,
                  fontWeight: 500,
                  color: "var(--proof-text-secondary)",
                  textAlign: "left",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = `${a.color}12`;
                  (e.currentTarget as HTMLElement).style.color = a.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
                }}
              >
                <Icon size={11} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider info */}
      <div
        style={{
          padding: "6px 10px",
          fontSize: 8.5,
          color: "var(--proof-text-muted)",
          borderTop: "1px solid var(--proof-border)",
          lineHeight: 1.4,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600 }}>AI:</span> Chrome · WebLLM · OpenAI
      </div>
    </div>
  );
}

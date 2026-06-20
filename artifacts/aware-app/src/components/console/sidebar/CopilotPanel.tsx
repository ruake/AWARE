import React from "react";
import { useLocation } from "wouter";
import { useSyncedUrlState } from "@/lib/urlState";
import { QUICK_ACTIONS } from "@/lib/copilot/quickActions";
import {
  loadThreads, saveThreads, deleteThreadFromList, updateThreadInList,
  getActiveThreadId, setActiveThreadId,
} from "@/lib/copilot/storage";
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
  const [threads, setThreads] = React.useState(() => loadThreads());
  const [search, setSearch] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  const activeId = getActiveThreadId();

  const filtered = search.trim()
    ? threads.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : threads;

  const refresh = () => setThreads(loadThreads());

  const handleNewChat = () => {
    setNewChat(Date.now());
    navigate("/copilot");
  };

  const handleSelect = (id: string) => {
    setActiveThreadId(id);
    navigate("/copilot");
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDelete === id) {
      if (activeId === id) {
        const updated = deleteThreadFromList(threads, id);
        const next = updated[0] ?? null;
        setActiveThreadId(next?.id ?? null);
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

  const handleRename = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed) {
      const updated = updateThreadInList(threads, id, { title: trimmed });
      saveThreads(updated);
      refresh();
    }
    setEditingId(null);
  };

  const handleAction = (message: string) => {
    setAction(message);
    navigate("/copilot");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(59,130,246,0.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.2)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
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
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            color: "var(--proof-text-muted)",
            padding: "6px 10px 3px",
          }}
        >
          Threads
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: "12px 10px", fontSize: 10, color: "var(--proof-text-muted)", textAlign: "center" }}>
            {search.trim() ? "No threads match" : "No conversations yet"}
          </div>
        )}
        {filtered.map((t) => {
          const isActive = t.id === activeId;
          const isEditing = editingId === t.id;
          const isConfirming = confirmDelete === t.id;
          return (
            <div
              key={t.id}
              onClick={() => handleSelect(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                cursor: "pointer",
                background: isActive
                  ? "rgba(59,130,246,0.08)"
                  : "transparent",
                borderLeft: isActive ? "2px solid var(--proof-blue)" : "2px solid transparent",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {isEditing ? (
                <>
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(t.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
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
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", color: "var(--proof-green)" }}
                  >
                    <Check size={10} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", color: "var(--proof-text-muted)" }}
                  >
                    <X size={10} />
                  </button>
                </>
              ) : (
                <>
                  <MessageSquare size={10} style={{ flexShrink: 0, color: isActive ? "var(--proof-blue-bright)" : "var(--proof-text-muted)" }} />
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
                  <span style={{ fontSize: 8, color: "var(--proof-text-muted)", flexShrink: 0, marginRight: 2 }}>
                    {relTime(t.updatedAt)}
                  </span>
                  <div
                    style={{ display: "flex", gap: 1, opacity: 0 }}
                    className="copilot-sidebar-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditValue(t.title); setEditingId(t.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", color: "var(--proof-text-muted)" }}
                    >
                      <Edit3 size={9} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, t.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex",
                        color: isConfirming ? "var(--proof-red-bright)" : "var(--proof-text-muted)",
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
        <style>{`
          div:hover > .copilot-sidebar-actions,
          div:focus-within > .copilot-sidebar-actions {
            opacity: 1 !important;
          }
        `}</style>
      </div>

      {/* Skills section */}
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
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
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

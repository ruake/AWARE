import React from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useSyncedUrlState } from "@/lib/urlState";
import { QUICK_ACTIONS } from "@/lib/copilot/quickActions";
import {
  loadThreads,
  saveThreads,
  deleteThreadFromList,
  updateThreadInList,
  getActiveThreadId,
  setActiveThreadId,
} from "@/lib/copilot/storage";
import type { Thread } from "@/lib/copilot/types";
import { Plus, Bot, Zap, MessageSquare, Trash2, Edit3, Check, X, Search, Clock, ChevronRight, PlusCircle, History } from "lucide-react";

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
  
  const editInputRef = React.useRef<HTMLInputElement>(null);
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
      const updated = deleteThreadFromList(threads, id);
      if (activeId === id) {
        const next = updated[0] ?? null;
        setActiveThreadId(next?.id ?? null);
      }
      saveThreads(updated);
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

  React.useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--proof-sidebar-bg)" }}>
      {/* Search Header */}
      <div style={{ padding: "12px", borderBottom: "1px solid var(--proof-border)", background: "var(--proof-surface-subtle)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--proof-surface)",
            border: "1px solid var(--proof-border)",
            borderRadius: 8,
            padding: "6px 10px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Search size={14} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history..."
            style={{
              border: "none",
              outline: "none",
              fontSize: 12,
              background: "transparent",
              flex: 1,
              minWidth: 0,
              color: "var(--proof-text)",
            }}
          />
          {search && <X size={12} style={{ color: "var(--proof-text-muted)", cursor: "pointer" }} onClick={() => setSearch("")} />}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {/* New Chat Header */}
        <div style={{ padding: "16px 12px 8px", fontSize: 10, fontWeight: 700, color: "var(--proof-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
           <span>Recent History</span>
           <motion.button
             whileHover={{ scale: 1.1, color: "var(--proof-blue-bright)" }}
             whileTap={{ scale: 0.9 }}
             onClick={handleNewChat}
             style={{ border: "none", background: "none", cursor: "pointer", color: "var(--proof-text-muted)", display: "flex" }}
           >
             <PlusCircle size={14} />
           </motion.button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 4px" }}>
           <AnimatePresence initial={false}>
             {filtered.map((t, idx) => {
               const isActive = t.id === activeId;
               const isEditing = editingId === t.id;
               const isConfirming = confirmDelete === t.id;

               return (
                 <motion.div
                   key={t.id}
                   initial={{ opacity: 0, x: -4 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ delay: idx * 0.03 }}
                   onClick={() => !isEditing && handleSelect(t.id)}
                   whileHover={{ background: "var(--proof-surface-hover)" }}
                   style={{
                     display: "flex",
                     alignItems: "center",
                     gap: 10,
                     padding: "10px 12px",
                     borderRadius: 8,
                     cursor: "pointer",
                     background: isActive ? "var(--proof-surface-active)" : "transparent",
                     position: "relative",
                     transition: "background 0.2s ease",
                   }}
                 >
                   {isActive && (
                     <motion.div
                       layoutId="active-thread-indicator"
                       style={{
                         position: "absolute",
                         left: 0,
                         top: 8,
                         bottom: 8,
                         width: 3,
                         background: "var(--proof-blue)",
                         borderRadius: "0 4px 4px 0",
                       }}
                     />
                   )}

                   <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--proof-surface-3)", display: "flex", alignItems: "center", justifyItems: "center", flexShrink: 0 }}>
                      <MessageSquare size={12} style={{ margin: "0 auto", color: isActive ? "var(--proof-blue-bright)" : "var(--proof-text-muted)" }} />
                   </div>

                   <div style={{ flex: 1, minWidth: 0 }}>
                     {isEditing ? (
                       <input
                         ref={editInputRef}
                         value={editValue}
                         onChange={(e) => setEditValue(e.target.value)}
                         onKeyDown={(e) => {
                           if (e.key === "Enter") handleRename(t.id);
                           if (e.key === "Escape") setEditingId(null);
                         }}
                         onClick={(e) => e.stopPropagation()}
                         style={{
                           width: "100%",
                           background: "var(--proof-surface)",
                           border: "1px solid var(--proof-blue-bright)",
                           borderRadius: 4,
                           padding: "2px 6px",
                           fontSize: 12,
                           color: "var(--proof-text)",
                           outline: "none",
                         }}
                       />
                     ) : (
                       <>
                         <div style={{ fontSize: 12, color: isActive ? "var(--proof-text)" : "var(--proof-text-secondary)", fontWeight: isActive ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                           {t.title}
                         </div>
                         <div style={{ fontSize: 9, color: "var(--proof-text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <Clock size={10} /> {relTime(t.updatedAt)}
                         </div>
                       </>
                     )}
                   </div>

                   <div 
                     style={{ display: "flex", gap: 2, opacity: 0 }} 
                     className="thread-actions"
                     onClick={e => e.stopPropagation()}
                   >
                      <motion.button
                        whileHover={{ color: "var(--proof-blue-bright)" }}
                        onClick={() => { setEditValue(t.title); setEditingId(t.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--proof-text-muted)", padding: 4 }}
                      >
                        <Edit3 size={12} />
                      </motion.button>
                      <motion.button
                        whileHover={{ color: isConfirming ? "var(--proof-red)" : "var(--proof-text-secondary)" }}
                        onClick={(e) => handleDelete(e, t.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: isConfirming ? "var(--proof-red)" : "var(--proof-text-muted)", padding: 4 }}
                      >
                        <Trash2 size={12} />
                      </motion.button>
                   </div>
                 </motion.div>
               );
             })}
           </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--proof-text-muted)" }}>
             <History size={24} style={{ opacity: 0.1, marginBottom: 12 }} />
             <div style={{ fontSize: 11 }}>No conversation history found</div>
          </div>
        )}

        {/* Suggested Actions Section */}
        <div style={{ marginTop: "auto", padding: "16px 12px", borderTop: "1px solid var(--proof-border)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--proof-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={12} /> Suggested Actions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {QUICK_ACTIONS.slice(0, 3).map((a) => {
              const Icon = a.icon;
              return (
                <motion.button
                  key={a.label}
                  whileHover={{ background: "var(--proof-surface-hover)", x: 4 }}
                  onClick={() => handleAction(a.message)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--proof-border)",
                    background: "var(--proof-surface)",
                    color: "var(--proof-text-secondary)",
                    cursor: "pointer",
                    fontSize: 11,
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon size={14} style={{ color: "var(--proof-blue-bright)" }} />
                  <span style={{ flex: 1 }}>{a.label}</span>
                  <ChevronRight size={12} style={{ opacity: 0.3 }} />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
      
      <style>{`
        div:hover > .thread-actions {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

import React, { useState, useMemo, useCallback, useRef } from "react";
import { Search, X, Star, Pin, Trash2, FileText, Sparkles, Bookmark } from "lucide-react";
import type { PromptTemplate } from "../../lib/copilot/types";
import { loadTemplates, saveTemplates, deleteTemplate } from "../../lib/copilot/storage";

interface TemplateLibraryProps {
  onSelect: (content: string) => void;
  onClose: () => void;
}

const CATEGORIES = ["All", "analysis", "deployment", "report", "performance"] as const;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  analysis: <Sparkles size={12} />,
  deployment: <Bookmark size={12} />,
  report: <FileText size={12} />,
  performance: <Star size={12} />,
};

const CATEGORY_LABELS: Record<string, string> = {
  analysis: "Analysis",
  deployment: "Deployment",
  report: "Report",
  performance: "Performance",
};

const CARD_STYLE: React.CSSProperties = {
  background: "var(--proof-surface)",
  border: "1px solid var(--proof-border)",
  borderRadius: "var(--proof-radius)",
  padding: "10px 12px",
  cursor: "pointer",
  transition: "all var(--proof-transition)",
  position: "relative",
  outline: "none",
};

export default function TemplateLibrary({ onSelect, onClose }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>(() => loadTemplates());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = templates;
    if (category !== "All") {
      list = list.filter((t) => t.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }
    const pinned = list.filter((t) => t.pinned);
    const unpinned = list.filter((t) => !t.pinned);
    return [...pinned, ...unpinned];
  }, [templates, search, category]);

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirmDelete === id) {
        deleteTemplate(id);
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        setConfirmDelete(null);
      } else {
        setConfirmDelete(id);
      }
    },
    [confirmDelete],
  );

  const handleUse = useCallback(
    (content: string) => {
      onSelect(content);
      onClose();
    },
    [onSelect, onClose],
  );

  const focusItem = useCallback((idx: number) => {
    setFocusedIndex(idx);
    itemRefs.current.get(idx)?.focus();
  }, []);

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const len = filtered.length;
      if (len === 0) return;

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
            handleUse(filtered[focusedIndex].content);
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    },
    [filtered, focusedIndex, focusItem, handleUse, onClose],
  );

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  React.useEffect(() => {
    setFocusedIndex(-1);
  }, [search, category]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          height: "100%",
          background: "var(--proof-bg-elevated)",
          borderLeft: "1px solid var(--proof-border)",
          display: "flex",
          flexDirection: "column",
          animation: "fadeSlideIn 180ms ease-out",
        }}
        onKeyDown={handleListKeyDown}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid var(--proof-border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} color="var(--proof-blue-bright)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--proof-text)" }}>
              Prompt Templates
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--proof-text-muted)",
                background: "var(--proof-surface)",
                borderRadius: "var(--proof-radius-full)",
                padding: "1px 7px",
                fontWeight: 600,
              }}
            >
              {templates.length}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close template library"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: "var(--proof-radius-sm)",
              border: "none",
              background: "transparent",
              color: "var(--proof-text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 16px", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--proof-surface)",
              border: "1px solid var(--proof-border)",
              borderRadius: "var(--proof-radius)",
              padding: "0 10px",
            }}
          >
            <Search size={13} color="var(--proof-text-muted)" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates... (↑↓ to navigate)"
              aria-label="Search templates"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--proof-text)",
                fontSize: 12.5,
                padding: "8px 0",
                fontFamily: "var(--font-sans)",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--proof-text-muted)",
                  cursor: "pointer",
                  padding: 4,
                  display: "inline-flex",
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "0 16px 10px",
            flexWrap: "wrap",
            flexShrink: 0,
          }}
          role="tablist"
          aria-label="Template categories"
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(cat)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: "var(--proof-radius-full)",
                  border: active
                    ? "1px solid var(--proof-blue-border)"
                    : "1px solid var(--proof-border)",
                  background: active ? "var(--proof-blue-bg)" : "var(--proof-surface)",
                  color: active ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
                  cursor: "pointer",
                  fontSize: 10.5,
                  fontWeight: 600,
                  transition: "all var(--proof-transition)",
                }}
              >
                {cat !== "All" && CATEGORY_ICONS[cat]}
                {cat === "All" ? "All" : CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Template list"
          aria-activedescendant={focusedIndex >= 0 ? `template-item-${focusedIndex}` : undefined}
          style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 16px",
                textAlign: "center",
                gap: 8,
              }}
            >
              <FileText size={32} color="var(--proof-text-tertiary)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text-secondary)" }}>
                No templates match your search
              </span>
              <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>
                Try a different search term or category
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.some((t) => t.pinned) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 0",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--proof-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <Pin size={10} />
                  Pinned
                </div>
              )}
              {filtered.map((template, idx) => {
                const isFirstUnpinned = idx > 0 && !template.pinned && filtered[idx - 1]?.pinned;
                const isFocused = focusedIndex === idx;
                return (
                  <React.Fragment key={template.id}>
                    {isFirstUnpinned && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "8px 0 4px",
                          fontSize: 10,
                          fontWeight: 600,
                          color: "var(--proof-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        <FileText size={10} />
                        All Templates
                      </div>
                    )}
                    <div
                      id={`template-item-${idx}`}
                      role="option"
                      aria-selected={isFocused}
                      tabIndex={isFocused ? 0 : -1}
                      ref={(el) => {
                        if (el) itemRefs.current.set(idx, el);
                        else itemRefs.current.delete(idx);
                      }}
                      onClick={() => handleUse(template.content)}
                      onFocus={() => setFocusedIndex(idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleUse(template.content);
                        }
                      }}
                      style={{
                        ...CARD_STYLE,
                        border: isFocused
                          ? "1px solid var(--proof-blue-border)"
                          : "1px solid var(--proof-border)",
                        background: isFocused
                          ? "var(--proof-surface-hover)"
                          : "var(--proof-surface)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--proof-border-accent)";
                        e.currentTarget.style.background = "var(--proof-surface-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isFocused) {
                          e.currentTarget.style.borderColor = "var(--proof-border)";
                          e.currentTarget.style.background = "var(--proof-surface)";
                        }
                      }}
                    >
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(e, template.id)}
                        tabIndex={-1}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 20,
                          height: 20,
                          borderRadius: "var(--proof-radius-sm)",
                          border: "none",
                          background:
                            confirmDelete === template.id ? "var(--proof-red-bg)" : "transparent",
                          color:
                            confirmDelete === template.id
                              ? "var(--proof-red)"
                              : "var(--proof-text-tertiary)",
                          cursor: "pointer",
                          opacity: 0,
                          transition: "opacity var(--proof-transition-fast)",
                        }}
                        className="template-delete-btn"
                        title={
                          confirmDelete === template.id
                            ? "Click again to confirm"
                            : "Delete template"
                        }
                      >
                        <Trash2 size={11} />
                      </button>

                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "var(--proof-radius-sm)",
                            background: "var(--proof-blue-bg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 15,
                            flexShrink: 0,
                          }}
                        >
                          {template.icon}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              style={{
                                fontSize: 12.5,
                                fontWeight: 700,
                                color: "var(--proof-text)",
                                lineHeight: 1.3,
                              }}
                            >
                              {template.name}
                            </span>
                            {template.pinned && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 2,
                                  fontSize: 8.5,
                                  fontWeight: 600,
                                  color: "var(--proof-blue-bright)",
                                  background: "var(--proof-blue-bg)",
                                  borderRadius: "var(--proof-radius-full)",
                                  padding: "1px 6px",
                                  lineHeight: "16px",
                                }}
                              >
                                <Pin size={8} />
                                Pinned
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: 10.5,
                              color: "var(--proof-text-secondary)",
                              lineHeight: 1.4,
                              marginTop: 2,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {template.description}
                          </div>

                          <div
                            style={{
                              marginTop: 6,
                              padding: "5px 7px",
                              background: "rgba(0,0,0,0.2)",
                              borderRadius: "var(--proof-radius-xs)",
                              fontSize: 10,
                              fontFamily: "var(--font-mono)",
                              color: "var(--proof-text-muted)",
                              lineHeight: 1.45,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {template.content}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginTop: 8,
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUse(template.content);
                          }}
                          tabIndex={-1}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 12px",
                            borderRadius: "var(--proof-radius-sm)",
                            border: "1px solid var(--proof-blue-border)",
                            background: "var(--proof-blue-bg)",
                            color: "var(--proof-blue-bright)",
                            cursor: "pointer",
                            fontSize: 10.5,
                            fontWeight: 600,
                            transition: "all var(--proof-transition)",
                          }}
                        >
                          Use ↵
                        </button>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid var(--proof-border)",
            fontSize: 10,
            color: "var(--proof-text-tertiary)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
          }}
        >
          <Pin size={9} />
          ↑↓ navigate · Enter to use · Esc to close
        </div>
      </div>

      <style>{`
        .template-delete-btn {
          opacity: 0 !important;
        }
        div:hover > .template-delete-btn,
        div:focus > .template-delete-btn,
        div:focus-within > .template-delete-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

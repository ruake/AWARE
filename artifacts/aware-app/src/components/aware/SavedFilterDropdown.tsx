import React, { useState, useEffect, useRef } from "react";
import { Bookmark, Check, Trash2, ChevronDown, Save, X } from "lucide-react";
import {
  getSavedFilters,
  saveCurrentFilter,
  loadSavedFilter,
  deleteSavedFilter,
} from "@/lib/filterStore";
import type { SavedFilter } from "@/lib/filterStore";

interface SavedFilterDropdownProps {
  onLoad: () => void;
}

export function SavedFilterDropdown({ onLoad }: SavedFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [saved, setSaved] = useState<SavedFilter[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSaved(getSavedFilters());
  }, [open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSaving(false);
        setFilterName("");
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSave = () => {
    const trimmed = filterName.trim();
    if (!trimmed) return;
    saveCurrentFilter(trimmed);
    setFilterName("");
    setSaving(false);
    setSaved(getSavedFilters());
  };

  const handleLoad = (id: string) => {
    loadSavedFilter(id);
    setOpen(false);
    onLoad();
  };

  const handleDelete = (id: string) => {
    deleteSavedFilter(id);
    setSaved(getSavedFilters());
  };

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        className="proof-btn proof-btn-ghost"
        aria-label="Saved filters"
        aria-haspopup="true"
        aria-expanded={open}
        style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600, gap: 6 }}
      >
        <Bookmark size={14} /> Saved <ChevronDown size={12} style={{ opacity: 0.6 }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            minWidth: 260, maxWidth: 320,
            background: "var(--proof-surface-2)", border: "1px solid var(--proof-border-strong)",
            borderRadius: "var(--proof-radius-lg)", boxShadow: "var(--proof-shadow-lg)",
            zIndex: 50, padding: "8px", display: "flex", flexDirection: "column", gap: 4,
          }}
        >
          {saving ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Save current filter
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  autoFocus
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setSaving(false); setFilterName(""); } }}
                  placeholder="Filter name…"
                  className="proof-input"
                  style={{ flex: 1, padding: "6px 10px", fontSize: 13, borderRadius: 6 }}
                  maxLength={100}
                />
                <button onClick={handleSave} className="proof-btn proof-btn-primary" style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, borderRadius: 6 }}>
                  <Check size={14} />
                </button>
                <button onClick={() => { setSaving(false); setFilterName(""); }} className="proof-btn proof-btn-ghost" style={{ padding: "6px 10px", fontSize: 12, borderRadius: 6 }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setSaving(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: "var(--proof-radius-md)",
                background: "transparent", border: "1px dashed var(--proof-border-strong)",
                color: "var(--proof-text-secondary)", fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-surface-hover)"; e.currentTarget.style.color = "var(--proof-text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--proof-text-secondary)"; }}
            >
              <Save size={14} /> Save current filter
            </button>
          )}

          {saved.length > 0 && (
            <>
              <div style={{ height: 1, background: "var(--proof-border)", margin: "4px 0" }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "var(--proof-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 8px" }}>
                Saved filters
              </span>
              {saved.map((sf) => (
                <div
                  key={sf.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    borderRadius: "var(--proof-radius-md)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-surface-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <button
                    onClick={() => handleLoad(sf.id)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px",
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--proof-text)", fontSize: 13, fontWeight: 500,
                      textAlign: "left", borderRadius: "var(--proof-radius-md)",
                    }}
                  >
                    <Bookmark size={12} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sf.name}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(sf.id)}
                    aria-label={`Delete saved filter ${sf.name}`}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--proof-text-muted)", padding: "8px",
                      display: "flex", borderRadius: "var(--proof-radius-md)",
                      transition: "all 0.15s", flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--proof-red)"; e.currentTarget.style.background = "var(--proof-red-bg)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--proof-text-muted)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

import React from "react";
import { Search, X, RotateCcw, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { WIDGET_META } from "@/lib/dashboardConfig";
import type { WidgetConfig, WidgetType } from "@/lib/dashboardConfig";

interface WidgetPickerProps {
  open: boolean;
  widgets: WidgetConfig[];
  onToggle: (id: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export function WidgetPicker({ open, widgets, onToggle, onReset, onClose }: WidgetPickerProps) {
  const [search, setSearch] = React.useState("");

  if (!open) return null;

  const typeOrder = Object.keys(WIDGET_META) as WidgetType[];
  const filtered = search.trim()
    ? typeOrder.filter(t => {
        const meta = WIDGET_META[t];
        return meta.label.toLowerCase().includes(search.toLowerCase()) ||
               meta.description.toLowerCase().includes(search.toLowerCase());
      })
    : typeOrder;

  const visibleCount = widgets.filter(w => w.visible).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="glass-panel"
        style={{
          width: 520, maxHeight: "80vh", display: "flex", flexDirection: "column",
          borderRadius: 16, border: "1px solid var(--proof-border)", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--proof-border-light)",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--proof-text)" }}>
              Customize Dashboard
            </div>
            <div style={{ fontSize: 12, color: "var(--proof-text-muted)", marginTop: 2 }}>
              {visibleCount} of {widgets.length} widgets visible
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={onReset}
              title="Reset to default layout"
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                borderRadius: 8, border: "1px solid var(--proof-border)", cursor: "pointer",
                fontSize: 12, fontWeight: 600, color: "var(--proof-text-secondary)",
                background: "rgba(255,255,255,0.04)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                color: "var(--proof-text-secondary)", background: "transparent",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--proof-border-light)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
            borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid var(--proof-border)",
            transition: "border-color 0.15s",
          }}>
            <Search size={14} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
            <input
              type="search"
              placeholder="Search widgets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                fontSize: 13, color: "var(--proof-text)", fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Widget List */}
        <div style={{ flex: 1, overflow: "auto", padding: "8px 20px 20px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--proof-text-muted)", fontSize: 13 }}>
              No widgets match &ldquo;{search}&rdquo;
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {filtered.map(type => {
                const meta = WIDGET_META[type];
                const widget = widgets.find(w => w.type === type);
                const visible = widget?.visible ?? false;
                return (
                  <label
                    key={type}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                      transition: "background 0.15s",
                      background: visible ? "rgba(0,196,255,0.04)" : "transparent",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = visible ? "rgba(0,196,255,0.08)" : "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = visible ? "rgba(0,196,255,0.04)" : "transparent"; }}
                  >
                    <button
                      type="button"
                      role="switch"
                      aria-checked={visible}
                      onClick={() => onToggle(widget?.id ?? type)}
                      style={{
                        width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
                        position: "relative", flexShrink: 0, transition: "background 0.2s",
                        background: visible ? "var(--proof-blue)" : "rgba(255,255,255,0.15)",
                      }}
                    >
                      <span style={{
                        position: "absolute", top: 2, left: visible ? 18 : 2,
                        width: 16, height: 16, borderRadius: "50%", background: "#fff",
                        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }} />
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>
                        {meta.label}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--proof-text-muted)", marginTop: 2 }}>
                        {meta.description}
                      </div>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4,
                      fontSize: 11, color: "var(--proof-text-muted)",
                    }}>
                      {visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      {meta.defaultSize}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

import React from "react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { exportToCsv, exportToJson, copyToClipboard } from "@/lib/export";
import { Download, FileJson, Clipboard } from "lucide-react";

interface ExportMenuProps {
  data: Record<string, unknown>[];
  filename: string;
  columns?: { key: string; label: string }[];
  jsonData?: unknown;
  clipboardText?: string;
}

export function ExportMenu({ data, filename, columns, jsonData, clipboardText }: ExportMenuProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const { show: showToast, Toast } = useSimpleToast();

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCsv = () => {
    exportToCsv(data, filename, columns);
    setOpen(false);
  };

  const handleJson = () => {
    exportToJson(jsonData ?? data, filename);
    setOpen(false);
  };

  const handleCopy = async () => {
    const text = clipboardText ?? JSON.stringify(data, null, 2);
    try {
      await copyToClipboard(text);
      showToast("Copied to clipboard");
    } catch {
      showToast("Failed to copy");
    }
    setOpen(false);
  };

  return (
    <div ref={menuRef} style={{ position: "relative", display: "inline-block" }}>
      {Toast}
      <button
        onClick={() => setOpen(!open)}
        className="proof-btn"
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 8,
          border: "1px solid var(--proof-border)",
          background: open ? "var(--proof-surface-hover)" : "var(--proof-surface-2)",
          color: "var(--proof-text-secondary)",
          cursor: "pointer",
          transition: "all var(--proof-transition)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-surface-hover)"; e.currentTarget.style.color = "var(--proof-text)"; }}
        onMouseLeave={(e) => { if (!open) { e.currentTarget.style.background = "var(--proof-surface-2)"; e.currentTarget.style.color = "var(--proof-text-secondary)"; } }}
      >
        <Download size={14} /> Export <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute", right: 0, top: "calc(100% + 4px)",
            minWidth: 180,
            background: "var(--proof-surface-3)",
            border: "1px solid var(--proof-border)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <button
            role="menuitem"
            onClick={handleCsv}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "10px 14px", fontSize: 12, fontWeight: 600,
              border: "none", background: "transparent", color: "var(--proof-text)",
              cursor: "pointer", textAlign: "left",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-surface-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            role="menuitem"
            onClick={handleJson}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "10px 14px", fontSize: 12, fontWeight: 600,
              border: "none", background: "transparent", color: "var(--proof-text)",
              cursor: "pointer", textAlign: "left",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-surface-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <FileJson size={14} /> Export JSON
          </button>
          <button
            role="menuitem"
            onClick={handleCopy}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "10px 14px", fontSize: 12, fontWeight: 600,
              border: "none", background: "transparent", color: "var(--proof-text)",
              cursor: "pointer", textAlign: "left",
              transition: "background 0.15s",
              borderTop: "1px solid var(--proof-border-light)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-surface-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Clipboard size={14} /> Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}

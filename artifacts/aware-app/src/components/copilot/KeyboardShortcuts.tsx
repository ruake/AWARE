import React, { useEffect, useRef } from "react";
import { Keyboard, X } from "lucide-react";
import { KEYBOARD_SHORTCUTS, type KeyboardShortcut } from "../../lib/copilot/types";

interface Props {
  onClose: () => void;
}

const isMac = typeof navigator !== "undefined" && navigator.platform?.includes("Mac");

function modSymbol(mod: "ctrl" | "meta" | "alt" | "shift"): string {
  if (isMac) {
    switch (mod) {
      case "meta":
        return "⌘";
      case "alt":
        return "⌥";
      case "shift":
        return "⇧";
      case "ctrl":
        return "⌃";
    }
  }
  switch (mod) {
    case "meta":
      return "Cmd";
    case "alt":
      return "Alt";
    case "shift":
      return "⇧";
    case "ctrl":
      return "Ctrl";
  }
}

function keyLabel(key: string): string {
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function getParts(s: KeyboardShortcut): string[] {
  const parts: string[] = [];
  if (s.ctrl) parts.push(modSymbol("ctrl"));
  if (s.meta) parts.push(modSymbol("meta"));
  if (s.alt) parts.push(modSymbol("alt"));
  if (s.shift) parts.push(modSymbol("shift"));
  parts.push(keyLabel(s.key));
  return parts;
}

type Category = "Navigation" | "Messaging" | "General";

const CATEGORY_ORDER: Category[] = ["Navigation", "Messaging", "General"];

const ACTION_CATEGORY: Record<string, Category> = {
  "command-palette": "Navigation",
  "new-chat": "Navigation",
  search: "Navigation",
  "toggle-sidebar": "Navigation",
  send: "Messaging",
  newline: "Messaging",
  "edit-last": "Messaging",
  close: "General",
  export: "General",
};

function groupByCategory(): { label: Category; items: KeyboardShortcut[] }[] {
  const map = new Map<Category, KeyboardShortcut[]>();
  for (const s of KEYBOARD_SHORTCUTS) {
    const cat = ACTION_CATEGORY[s.action] ?? "General";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(s);
  }
  return CATEGORY_ORDER.filter((c) => map.has(c)).map((label) => ({
    label,
    items: map.get(label)!,
  }));
}

export default function KeyboardShortcuts({ onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const groups = groupByCategory();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(2, 8, 23, 0.7)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "70vh",
          overflowY: "auto",
          background: "var(--proof-bg-elevated)",
          border: "1px solid var(--proof-border)",
          borderRadius: 12,
          boxShadow: "var(--proof-shadow-lg), 0 0 0 1px rgba(59,130,246,0.08)",
          padding: 0,
          outline: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 12px",
            borderBottom: "1px solid var(--proof-border-light)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--proof-blue-bg)",
                color: "var(--proof-blue-bright)",
              }}
            >
              <Keyboard size={16} />
            </div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--proof-text)",
                letterSpacing: "0.2px",
              }}
            >
              Keyboard Shortcuts
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              color: "var(--proof-text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: "8px 0" }}>
          {groups.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && (
                <div
                  style={{
                    height: 1,
                    background: "var(--proof-border-light)",
                    margin: "4px 20px",
                  }}
                />
              )}
              {group.items.map((shortcut, si) => {
                const parts = getParts(shortcut);
                const altRow = (gi + si) % 2 === 1;
                return (
                  <div
                    key={`${shortcut.action}-${si}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 20px",
                      background: altRow ? "var(--proof-hover-light)" : "transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      {parts.map((part, pi) => (
                        <React.Fragment key={pi}>
                          {pi > 0 && (
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--proof-text-muted)",
                                userSelect: "none",
                              }}
                            >
                              +
                            </span>
                          )}
                          <kbd
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: 22,
                              minWidth: 22,
                              padding: "0 6px",
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              fontWeight: 500,
                              color: "var(--proof-text)",
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid var(--proof-border)",
                              borderRadius: 5,
                              lineHeight: 1,
                              userSelect: "none",
                            }}
                          >
                            {part}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: 12.5,
                        color: "var(--proof-text-secondary)",
                        marginLeft: 16,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {shortcut.description}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import type { SearchResult } from "./CommandPalette";

import { motion } from "framer-motion";

function typeColor(type: string) {
  if (type === "test") return { bg: "rgba(168,85,247,0.15)", color: "var(--proof-purple)" };
  if (type === "suite") return { bg: "rgba(245,158,11,0.15)", color: "var(--proof-yellow)" };
  if (type === "run") return { bg: "rgba(0,196,255,0.15)", color: "var(--proof-blue)" };
  if (type === "action") return { bg: "rgba(0,229,160,0.15)", color: "var(--proof-green)" };
  return { bg: "rgba(154,160,166,0.15)", color: "var(--proof-text-secondary)" };
}

const FOOTER_KEYS: [string, string][] = [
  ["↑↓", "Navigate"],
  ["↵", "Open"],
  ["ESC", "Close"],
];

export function CommandResults({
  filtered,
  query,
  activeIdx,
  onSelect,
  onHover,
}: {
  filtered: SearchResult[];
  query: string;
  activeIdx: number;
  onSelect: (r: SearchResult) => void;
  onHover: (i: number) => void;
}) {
  return (
    <>
      <div 
        id="command-results-list"
        role="listbox"
        style={{ maxHeight: 420, overflowY: "auto", padding: "8px 0" }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "var(--proof-text-secondary)",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 12, opacity: 0.5 }}>∅</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {query.startsWith(">")
                ? `No actions matching "${query.slice(1).trim()}"`
                : `No results found for "${query}"`}
            </div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>Try a different search term</div>
          </div>
        ) : (
          filtered.map((r, i) => {
            const tc = typeColor(r.type);
            const isActive = i === activeIdx;
            return (
              <motion.div
                key={r.id}
                initial={false}
                role="option"
                aria-selected={isActive}
                animate={{ 
                  background: isActive ? "rgba(0,196,255,0.15)" : "transparent",
                  borderLeftColor: isActive ? "var(--proof-blue)" : "transparent",
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 20px",
                  cursor: "pointer",
                  margin: "4px 8px",
                  borderRadius: 8,
                  borderLeft: "3px solid transparent",
                  boxShadow: isActive ? "inset 0 0 12px rgba(0,196,255,0.1)" : "none",
                }}
                onClick={() => onSelect(r)}
                onMouseEnter={() => onHover(i)}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: isActive ? "var(--proof-blue)" : tc.bg,
                    color: isActive ? "white" : tc.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                    transition: "all 0.2s",
                    boxShadow: isActive ? "var(--proof-glow-cyan)" : "none",
                  }}
                >
                  {r.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: isActive ? "var(--proof-blue-bright)" : "var(--proof-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--proof-text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      opacity: isActive ? 1 : 0.7,
                    }}
                  >
                    {r.description}
                  </div>
                </div>
                {isActive && r.type === "action" && (
                   <span style={{ fontSize: 10, color: "var(--proof-blue-bright)", opacity: 0.8 }}>↵ RUN</span>
                )}
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    background: isActive ? "rgba(0,196,255,0.2)" : tc.bg,
                    color: isActive ? "var(--proof-blue-bright)" : tc.color,
                    flexShrink: 0,
                  }}
                >
                  {r.type}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "center",
          gap: 20,
          fontSize: 11,
          color: "var(--proof-text-secondary)",
          background: "transparent",
        }}
      >
        {FOOTER_KEYS.map(([key, label]) => (
          <span key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <kbd
              style={{
                padding: "2px 6px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 700,
                color: "var(--proof-text)",
              }}
            >
              {key}
            </kbd>
            <span style={{ opacity: 0.7 }}>{label}</span>
          </span>
        ))}
      </div>
    </>
  );
}

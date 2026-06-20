import React from "react";
import type { SearchResult } from "./CommandPalette";

function typeColor(type: string) {
  if (type === "test") return { bg: "rgba(168,85,247,0.15)", color: "var(--proof-purple)" };
  if (type === "suite") return { bg: "rgba(245,158,11,0.15)", color: "var(--proof-yellow)" };
  if (type === "run") return { bg: "rgba(91,138,245,0.15)", color: "var(--proof-blue)" };
  return { bg: "rgba(34,197,94,0.15)", color: "var(--proof-green)" };
}

const FOOTER_KEYS: [string, string][] = [
  ["↑↓", "Navigate"],
  ["↵", "Open"],
  ["⌘K", "Toggle"],
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
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "40px 18px",
              textAlign: "center",
              color: "var(--proof-text-secondary)",
              fontSize: 13,
            }}
          >
            {query.startsWith(">")
              ? `No actions for "${query.slice(1).trim()}"`
              : `No results for "${query}"`}
          </div>
        ) : (
          filtered.map((r, i) => {
            const tc = typeColor(r.type);
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 18px",
                  cursor: "pointer",
                  background: i === activeIdx ? "var(--proof-blue-bg)" : "transparent",
                  transition: "background 0.1s",
                }}
                onClick={() => onSelect(r)}
                onMouseEnter={() => onHover(i)}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: tc.bg,
                    color: tc.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {r.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--proof-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--proof-text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.description}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 4,
                    fontWeight: 600,
                    background: tc.bg,
                    color: tc.color,
                    flexShrink: 0,
                  }}
                >
                  {r.type}
                </span>
              </div>
            );
          })
        )}
      </div>
      <div
        style={{
          padding: "8px 18px",
          borderTop: "1px solid var(--proof-grey)",
          display: "flex",
          gap: 14,
          fontSize: 11,
          color: "var(--proof-text-secondary)",
        }}
      >
        {FOOTER_KEYS.map(([key, label]) => (
          <span key={key}>
            <kbd
              style={{
                padding: "1px 5px",
                background: "var(--proof-grey-bg)",
                border: "1px solid var(--proof-grey)",
                borderRadius: 3,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
              }}
            >
              {key}
            </kbd>{" "}
            {label}
          </span>
        ))}
      </div>
    </>
  );
}

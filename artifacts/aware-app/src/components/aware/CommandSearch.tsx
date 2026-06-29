import React from "react";

export function CommandSearch({
  query,
  typeFilter,
  typeCounts,
  inputRef,
  onQueryChange,
  onTypeFilterChange,
  onKeyDown
}: {
  query: string;
  typeFilter: string | null;
  typeCounts: Record<string, number>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onTypeFilterChange: (type: string | null) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          background: "transparent",
        }}
      >
        <span style={{ fontSize: 18, color: "var(--proof-blue)", opacity: 0.8, textShadow: "var(--proof-glow-cyan)" }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          id="command-palette-search"
          aria-label="Search commands"
          aria-controls="command-results-list"
          placeholder="Search commands, runs, tests..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            fontSize: 18,
            fontWeight: 500,
            color: "var(--proof-text)",
            fontFamily: "var(--font-sans)",
            caretColor: "var(--proof-blue)",
          }}
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
          }}
          onKeyDown={onKeyDown}
        />
        <div style={{ display: "flex", gap: 6 }}>
          <kbd
            style={{
              fontSize: 10,
              padding: "3px 8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: "var(--proof-text-secondary)",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
            }}
          >
            ESC
          </kbd>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.02)",
          flexWrap: "wrap",
        }}
      >
        {(["test", "suite", "run", "compare", "action"] as const).map((type) => (
          <button
            key={type}
            onClick={() => onTypeFilterChange(typeFilter === type ? null : type)}
            className="proof-button"
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 20,
              fontWeight: 700,
              border: typeFilter === type ? "1px solid var(--proof-blue)" : "1px solid rgba(255,255,255,0.1)",
              background: typeFilter === type ? "rgba(0,196,255,0.15)" : "transparent",
              color: typeFilter === type ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
              boxShadow: typeFilter === type ? "var(--proof-glow-cyan)" : "none",
              transition: "all 0.2s",
              minWidth: "auto",
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}s
            <span style={{ marginLeft: 6, opacity: 0.6 }}>{typeCounts[type]}</span>
          </button>
        ))}
        {typeFilter && (
          <button
            onClick={() => onTypeFilterChange(null)}
            style={{
              fontSize: 11,
              padding: "3px 10px",
              color: "var(--proof-red)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>
    </>
  );
}

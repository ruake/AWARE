import React from "react";

export function CommandSearch({
  query,
  typeFilter,
  typeCounts,
  inputRef,
  onQueryChange,
  onTypeFilterChange,
  onKeyDown,
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
          borderBottom: "1px solid var(--proof-border)",
          background: "var(--proof-surface-2)",
        }}
      >
        <span style={{ fontSize: 18, color: "var(--proof-blue)", opacity: 0.8 }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          aria-label="Search tests, runs, suites, or type > for actions"
          placeholder="Search for anything... (type > for actions)"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 16,
            fontWeight: 500,
            color: "var(--proof-text)",
            fontFamily: "var(--font-sans)",
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
              background: "var(--proof-surface-3)",
              border: "1px solid var(--proof-border)",
              borderRadius: 6,
              color: "var(--proof-text-secondary)",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              boxShadow: "0 2px 0 var(--proof-border)",
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
          borderBottom: "1px solid var(--proof-border)",
          background: "var(--proof-surface-2)",
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
              border: "1px solid var(--proof-border)",
              background: typeFilter === type ? "var(--proof-blue)" : "var(--proof-surface)",
              color: typeFilter === type ? "white" : "var(--proof-text-secondary)",
              borderColor: typeFilter === type ? "var(--proof-blue)" : "var(--proof-border)",
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

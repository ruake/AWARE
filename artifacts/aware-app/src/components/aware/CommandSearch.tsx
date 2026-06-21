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
          gap: 10,
          padding: "14px 18px",
          borderBottom: "1px solid var(--proof-grey)",
        }}
      >
        <span style={{ fontSize: 16, color: "var(--proof-text-secondary)" }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          aria-label="Search tests, runs, suites, or type > for actions"
          placeholder="Search tests, runs, suites, or type &gt; for actions..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 15,
            color: "var(--proof-text)",
            fontFamily: "var(--font-sans)",
          }}
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
          }}
          onKeyDown={onKeyDown}
        />
        <kbd
          style={{
            fontSize: 11,
            padding: "2px 6px",
            background: "var(--proof-grey-bg)",
            border: "1px solid var(--proof-grey)",
            borderRadius: 4,
            color: "var(--proof-text-secondary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ESC
        </kbd>
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "8px 18px",
          borderBottom: "1px solid var(--proof-grey)",
          background: "var(--proof-grey-bg)",
          flexWrap: "wrap",
        }}
      >
        {(["test", "suite", "run", "compare", "action"] as const).map((type) => (
          <button
            key={type}
            onClick={() => onTypeFilterChange(typeFilter === type ? null : type)}
            style={{
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid",
              background: typeFilter === type ? "var(--proof-blue)" : "var(--proof-surface)",
              color: typeFilter === type ? "white" : "var(--proof-text-secondary)",
              borderColor: typeFilter === type ? "var(--proof-blue)" : "var(--proof-grey)",
              transition: "all 0.15s",
            }}
          >
            {type === "test"
              ? "Tests"
              : type === "run"
                ? "Runs"
                : type === "compare"
                  ? "Compare"
                  : type === "action"
                    ? "Actions"
                    : "Suites"}{" "}
            ({typeCounts[type]})
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

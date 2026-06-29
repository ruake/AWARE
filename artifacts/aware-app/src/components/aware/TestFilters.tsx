import React from "react";
import { Search } from "lucide-react";

export function TestFilters({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (s: string) => void;
}) {
  const chips = ["All", "Flaky", "Failed", "Critical", "Slow"];
  const [activeChip, setActiveChip] = React.useState("All");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 32px", borderBottom: "1px solid var(--proof-border)", background: "var(--proof-surface)" }}>
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--proof-blue)" }} />
        <input
          type="text"
          placeholder="Search tests, assertions, tags..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="proof-input"
          style={{
            paddingLeft: 40,
            height: 48,
            fontSize: 15,
            background: "rgba(9,13,20,0.8)",
            border: "1px solid rgba(0,196,255,0.3)",
            boxShadow: "0 0 16px rgba(0,196,255,0.1)",
            color: "white",
            fontFamily: "var(--font-mono)"
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {chips.map(chip => (
          <button
            key={chip}
            onClick={() => setActiveChip(chip)}
            className="glass-panel"
            style={{
              padding: "6px 16px",
              borderRadius: "var(--proof-radius-full)",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              border: activeChip === chip ? "1px solid rgba(0,196,255,0.5)" : "1px solid var(--proof-border)",
              color: activeChip === chip ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
              boxShadow: activeChip === chip ? "var(--proof-glow-cyan)" : "none",
              cursor: "pointer",
              background: activeChip === chip ? "rgba(0,196,255,0.1)" : "transparent"
            }}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

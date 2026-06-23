import React from "react";
import { ChevronDown } from "lucide-react";
import type { Run } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  PASS: "var(--proof-green)",
  FAIL: "var(--proof-red)",
  PARTIAL: "var(--proof-yellow)",
  FLAKY: "var(--proof-yellow)",
  RUNNING: "var(--proof-blue)"
};

export function CompareRunSelector({
  label,
  labelColor,
  value,
  onChange,
  accentColor = "var(--proof-blue)",
  runs
}: {
  label: string;
  labelColor: string;
  value: string;
  onChange: (id: string) => void;
  accentColor?: string;
  runs: Run[];
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedRun = runs.find((r) => r.id === value);

  const filtered = runs.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.id.toLowerCase().includes(q) &&
        !(r.env || "").toLowerCase().includes(q) &&
        !(r.suiteId || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: labelColor, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
        {label}
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="glass-panel"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          border: `1px solid ${open ? accentColor : "var(--proof-border)"}`,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {selectedRun ? (
          <>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS[selectedRun.status] || "var(--proof-text-muted)" }} />
            <span className="metric-number" style={{ fontSize: 16, color: "var(--proof-text)", flex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {selectedRun.id}
            </span>
          </>
        ) : (
          <span style={{ color: "var(--proof-text-muted)", flex: 1, fontFamily: "var(--font-mono)", fontSize: 16 }}>SELECT RUN...</span>
        )}
        <ChevronDown size={16} style={{ color: "var(--proof-text-muted)" }} />
      </button>

      {open && (
        <div className="glass-panel" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, marginTop: 8, maxHeight: 400, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 12, borderBottom: "1px solid var(--proof-border)" }}>
            <input
              autoFocus
              className="proof-input"
              style={{ background: "transparent" }}
              placeholder="SEARCH RUNS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  onChange(r.id);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px",
                  background: r.id === value ? "rgba(0,196,255,0.1)" : "transparent",
                  border: "none",
                  borderLeft: r.id === value ? `3px solid var(--proof-blue)` : "3px solid transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--proof-text)",
                  fontFamily: "var(--font-mono)"
                }}
                onMouseEnter={e => { if (r.id !== value) e.currentTarget.style.background = "var(--proof-hover)"; }}
                onMouseLeave={e => { if (r.id !== value) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[r.status] }} />
                <span style={{ flex: 1 }}>{r.id}</span>
                <span style={{ color: "var(--proof-text-muted)" }}>{r.env}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

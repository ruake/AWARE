import React from "react";
import type { TestCase } from "@/lib/types";

export function AddTestsModal({ suiteId, allTestCases, onClose, onAdd }: {
  suiteId: string; allTestCases: TestCase[]; onClose: () => void; onAdd: (suiteId: string, testIds: string[]) => void;
}) {
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ position: "relative", width: "100%", maxWidth: 560, maxHeight: "70vh", overflow: "auto", background: "var(--gcp-surface)", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "1px solid var(--gcp-grey)", padding: 24, display: "flex", flexDirection: "column", gap: 12 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontWeight: 700, fontSize: 16 }}>Add Tests to Suite</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {allTestCases.filter(tc => tc.status === "active").map(tc => (
            <div key={tc.id} onClick={() => setSelected(prev => { const n = new Set(prev); if (n.has(tc.id)) n.delete(tc.id); else n.add(tc.id); return n; })}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                background: selected.has(tc.id) ? "var(--gcp-blue-bg)" : "transparent",
              }}>
              <input type="checkbox" checked={selected.has(tc.id)} readOnly style={{ accentColor: "var(--gcp-blue)" }} />
              <span style={{ flex: 1 }}>{tc.name}</span>
              <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{tc.category} · {tc.priority}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8 }}>
          <button onClick={onClose} className="gcp-button">Cancel</button>
          <button onClick={() => onAdd(suiteId, [...selected])} disabled={selected.size === 0}
            className="gcp-button gcp-button-primary" style={{ opacity: selected.size === 0 ? 0.5 : 1 }}>Add Selected</button>
        </div>
      </div>
    </div>
  );
}

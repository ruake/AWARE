import React from "react";
import { X, Terminal, Activity, FileText } from "lucide-react";
import type { TestCase, TestSuite } from "@/lib/types";


interface TestDetailPanelProps {
  test: TestCase | null;
  parentSuite: TestSuite | null;
  onClose: () => void;
}

export function TestDetailPanel({ test, parentSuite: _parentSuite, onClose }: TestDetailPanelProps) {
  if (!test) return null;

  return (
    <div
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderLeft: "1px solid var(--proof-border)",
        background: "var(--proof-surface)",
        animation: "fade-in-up 0.3s ease-out"
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--proof-surface-2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(0, 196, 255, 0.1)",
              color: "var(--proof-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "var(--proof-glow-cyan)",
              border: "1px solid rgba(0,196,255,0.3)"
            }}
          >
            <Terminal size={14} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--proof-text)",
                fontFamily: "var(--font-mono)"
              }}
            >
              {test.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--proof-text-secondary)",
                fontFamily: "var(--font-mono)",
                opacity: 0.7,
              }}
            >
              {test.id}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ padding: 6, borderRadius: "50%", background: "transparent", border: "none", color: "var(--proof-text-muted)", cursor: "pointer" }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Recent Runs Timeline */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={14} /> Recent Runs
          </div>
          <div style={{ display: "flex", gap: 4 }}>
             {Array.from({ length: 15 }).map((_, i) => {
                const isPass = ((i * 13 + 7) % 100) / 100 > 0.2;
               const color = isPass ? "var(--proof-green)" : "var(--proof-red)";
               return (
                 <div key={i} style={{ flex: 1, height: 24, borderRadius: 4, background: color, opacity: isPass ? 0.6 : 1, boxShadow: !isPass ? `0 0 8px ${color}` : 'none' }} title={isPass ? "Passed" : "Failed"} />
               )
             })}
          </div>
        </div>

        {/* Flakiness */}
        <div className="glass-panel" style={{ padding: 16, borderRadius: "var(--proof-radius-lg)", border: "1px solid var(--proof-border-light)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
            Flakiness History
          </div>
          {/* Sparkline placeholder */}
          <div style={{ height: 40, width: "100%", background: "linear-gradient(to right, rgba(0,229,160,0.1), rgba(255,51,85,0.2))", borderRadius: 4, position: "relative", overflow: "hidden" }}>
             <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
               <path d="M0 30 Q 25 10, 50 20 T 100 10" fill="none" stroke="var(--proof-red)" strokeWidth="2" filter="drop-shadow(0px 0px 4px var(--proof-red))" />
             </svg>
          </div>
        </div>

        {/* Assertions */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} /> Assertions ({test.assertions.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {test.assertions.map((a, i) => (
              <div key={i} className="glass-panel" style={{ padding: "12px", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-mono)", borderLeft: "2px solid var(--proof-blue)" }}>
                <span style={{ color: "var(--proof-blue)" }}>expect</span>(<span style={{ color: "var(--proof-text)" }}>{a.field}</span>).<span style={{ color: "var(--proof-green)" }}>{a.operator}</span>(<span style={{ color: "var(--proof-yellow)" }}>{a.expected}</span>)
              </div>
            ))}
            {test.assertions.length === 0 && <div style={{ color: "var(--proof-text-muted)", fontSize: 12 }}>No assertions defined.</div>}
          </div>
        </div>
        
        {/* Tags */}
        <div>
           <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
            Tags
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {test.tags.map(tag => (
              <span key={tag} className="glass-panel" style={{ padding: "4px 10px", borderRadius: "var(--proof-radius-full)", fontSize: 11, fontWeight: 600, color: "var(--proof-blue)", border: "1px solid rgba(0,196,255,0.3)", boxShadow: "0 0 8px rgba(0,196,255,0.15)" }}>#{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

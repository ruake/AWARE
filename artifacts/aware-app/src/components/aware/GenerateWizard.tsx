import React from "react";
import { generateTestCases } from "@/lib/data";
import { generateTestsWithLLM } from "@/lib/llm";
import { navTo } from "@/lib/nav";
import { CATEGORIES, PRIORITIES, STATUSES, OWNERS } from "@/lib/constants";
import type { TestSuite, GenerateParams } from "@/lib/types";
import { Sparkles, FileCode, X } from "lucide-react";

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{children}</label>;
}

export function GenerateWizard({ allSuites, onClose, toast }: { allSuites: TestSuite[]; onClose: () => void; toast: (m: string) => void }) {
  const [mode, setMode] = React.useState<"template" | "ai">("template");
  const [params, setParams] = React.useState<GenerateParams>({ count: 10, category: "geo-match", status: "active", priority: "P2", owner: OWNERS[0], suites: [] });
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiCount, setAiCount] = React.useState(3);
  const [loading, setLoading] = React.useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (mode === "template") {
        const result = generateTestCases(params);
        toast(`Generated ${result.length} test cases`);
      } else {
        if (!aiPrompt.trim()) { toast("Please enter a description"); setLoading(false); return; }
        const result = await generateTestsWithLLM({ count: aiCount, category: params.category, description: aiPrompt, suites: params.suites });
        toast(`AI generated ${result.length} test cases`);
      }
      onClose();
    } catch (e) {
      toast(`Generation failed: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--gcp-surface)", borderRadius: 10, width: "min(520px, 92vw)", padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: 16 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Sparkles size={18} style={{ color: "#f9ab00" }} /> Bulk Generate</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)" }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMode("template")} className="gcp-button" style={{ flex: 1, fontSize: 12, padding: "6px 0", background: mode === "template" ? "var(--gcp-blue)" : undefined, color: mode === "template" ? "white" : undefined, borderColor: mode === "template" ? "var(--gcp-blue)" : "var(--gcp-grey)" }}><FileCode size={12} style={{ marginRight: 4 }} /> Templates</button>
          <button onClick={() => setMode("ai")} className="gcp-button" style={{ flex: 1, fontSize: 12, padding: "6px 0", background: mode === "ai" ? "var(--gcp-blue)" : undefined, color: mode === "ai" ? "white" : undefined, borderColor: mode === "ai" ? "var(--gcp-blue)" : "var(--gcp-grey)" }}><Sparkles size={12} style={{ marginRight: 4 }} /> AI-Powered</button>
        </div>

        {mode === "template" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label>Count</Label>
              <input type="number" min={1} max={100} className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={params.count} onChange={e => setParams(p => ({ ...p, count: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Category</Label>
              <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={params.category} onChange={e => setParams(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Priority</Label>
              <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={params.priority} onChange={e => setParams(p => ({ ...p, priority: e.target.value as GenerateParams["priority"] }))}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={params.status} onChange={e => setParams(p => ({ ...p, status: e.target.value as GenerateParams["status"] }))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label>Owner</Label>
              <input className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={params.owner} onChange={e => setParams(p => ({ ...p, owner: e.target.value }))} />
            </div>
            <div>
              <Label>Assign to Suites</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {allSuites.slice(0, 6).map(s => (
                  <span key={s.id} onClick={() => setParams(p => ({ ...p, suites: p.suites.includes(s.id) ? p.suites.filter(x => x !== s.id) : [...p.suites, s.id] }))}
                    style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer", border: "1px solid",
                      background: params.suites.includes(s.id) ? "var(--gcp-blue)" : "transparent",
                      color: params.suites.includes(s.id) ? "white" : "var(--gcp-text-secondary)",
                      borderColor: params.suites.includes(s.id) ? "var(--gcp-blue)" : "var(--gcp-grey)",
                    }}>{s.name.split(" ")[0]}</span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Label>Describe the tests to generate</Label>
              <textarea className="gcp-input" style={{ width: "100%", marginTop: 4, minHeight: 80, resize: "vertical", fontFamily: "var(--font-sans)", fontSize: 12 }}
                value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. Generate cache validation tests for static assets including edge routing, origin shield, and purge propagation across APAC and US regions" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label>Count</Label>
                <input type="number" min={1} max={20} className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={aiCount} onChange={e => setAiCount(Number(e.target.value))} />
              </div>
              <div>
                <Label>Category</Label>
                <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={params.category} onChange={e => setParams(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Assign to Suites</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {allSuites.slice(0, 6).map(s => (
                  <span key={s.id} onClick={() => setParams(p => ({ ...p, suites: p.suites.includes(s.id) ? p.suites.filter(x => x !== s.id) : [...p.suites, s.id] }))}
                    style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer", border: "1px solid",
                      background: params.suites.includes(s.id) ? "var(--gcp-blue)" : "transparent",
                      color: params.suites.includes(s.id) ? "white" : "var(--gcp-text-secondary)",
                      borderColor: params.suites.includes(s.id) ? "var(--gcp-blue)" : "var(--gcp-grey)",
                    }}>{s.name.split(" ")[0]}</span>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", background: "var(--gcp-blue-bg)", padding: "8px 10px", borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={12} style={{ color: "var(--gcp-blue)" }} />
              Uses the configured AI provider. Go to <span style={{ color: "var(--gcp-blue)", cursor: "pointer", textDecoration: "underline" }} onClick={() => { onClose(); navTo("/copilot"); }}>AI Copilot</span> to configure API keys and models.
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} className="gcp-button" style={{ fontSize: 13 }}>Cancel</button>
          <button onClick={handleGenerate} disabled={loading} className="gcp-button gcp-button-primary" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={14} /> {loading ? "Generating..." : mode === "ai" ? "Generate with AI" : `Generate ${params.count} Tests`}
          </button>
        </div>
      </div>
    </div>
  );
}

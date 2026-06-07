import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { CiConfigBanner } from "@/components/aware/CiConfigBanner";
import { ColumnFilter, type ColumnFilterState } from "@/components/aware/ColumnFilter";
import { useSyncedUrlState } from "@/lib/urlState";
import { decodeTestConfigFromNav, getPendingTestConfig } from "@/lib/llm";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useTestData } from "@/hooks/useTestData";
import { EMPTY_FILTER, TagBadge, StatusBadge, priorityColor } from "@/components/aware/TestCard";
import { StatsDashboard } from "@/components/aware/StatsDashboard";
import { GenerateWizard } from "@/components/aware/GenerateWizard";
import { TestManagerSidePanel } from "@/components/aware/TestManagerSidePanel";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/constants";
import {
  getTestCases, getTestSuites,
  createTestCase, updateTestCase, deleteTestCase, resetTestStore,
  exportTestCases, exportTestsAsJunitXml,
  computeTestStats,
} from "@/lib/data";
import { importAuto } from "@/lib/testImportExport";
import type { TestCase, TestSuite, TestStats } from "@/lib/types";
import {
  Plus, Search, Check, Edit3, Trash2, Tag,
  RotateCcw, Upload, Download, FileJson, FileSpreadsheet, FileCode,
  X, Beaker, BarChart3, Clock, FileText, Sparkles, FolderTree,
} from "lucide-react";

const EMPTY_FORM: Omit<TestCase, "id" | "createdAt" | "updatedAt"> = {
  name: "", description: "", category: "geo-match", priority: "P2",
  severity: "minor", status: "active", tags: [], owner: "alice@co.com",
  suiteIds: [], automated: true, scriptPath: "",
  preconditions: "", expectedBehavior: "", documentation: "", relatedTestIds: [],
  requestHeaders: {}, cookies: {}, expectedStatus: 200,
  captureResponseHeaders: [], filmstrip: { enabled: false, threshold: 0.99 },
  testType: "web", config: {}, assertions: [],
  predicates: [], version: 1, changelog: [],
};

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{children}</label>;
}

function TestCaseModal({ initial, allSuites, onSave, onCancel }: {
  initial: Omit<TestCase, "id" | "createdAt" | "updatedAt">;
  allSuites: TestSuite[];
  onSave: (data: Omit<TestCase, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState(initial);
  const [activeTab, setActiveTab] = React.useState<"basic" | "docs" | "http">("basic");
  const u = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const tabStyle = (tab: string) => ({
    padding: "10px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer",
    border: "none", background: activeTab === tab ? "var(--gcp-surface)" : "transparent",
    borderBottom: `2px solid ${activeTab === tab ? "var(--gcp-blue)" : "transparent"}`,
    color: activeTab === tab ? "var(--gcp-blue)" : "var(--gcp-text-secondary)",
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onCancel}>
      <div style={{ background: "var(--gcp-surface)", borderRadius: 10, width: "min(860px, 94vw)", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>{initial.name ? "Edit Test Case" : "New Test Case"}</h2>
            {initial.version > 1 && <span style={{ fontSize: 11, background: "var(--gcp-grey-bg)", border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "1px 7px", fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)" }}>v{initial.version}</span>}
          </div>
          <button onClick={onCancel} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)", flexShrink: 0 }}>
          <button style={tabStyle("basic")} onClick={() => setActiveTab("basic")}>Basic Info</button>
          <button style={tabStyle("docs")} onClick={() => setActiveTab("docs")}>Documentation</button>
          <button style={tabStyle("http")} onClick={() => setActiveTab("http")}>HTTP &amp; Predicates</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {activeTab === "basic" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <Label>Name *</Label>
                <input className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.name} onChange={e => u("name", e.target.value)} placeholder="Verify Geo match for /api/v1/…" />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <Label>Description</Label>
                <textarea className="gcp-input" style={{ width: "100%", marginTop: 4, height: 60, resize: "vertical" }} value={form.description} onChange={e => u("description", e.target.value)} />
              </div>
              <div>
                <Label>Category</Label>
                <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.category} onChange={e => u("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>Priority</Label>
                <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.priority} onChange={e => u("priority", e.target.value)}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <Label>Severity</Label>
                <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.severity} onChange={e => u("severity", e.target.value)}>
                  {["critical", "major", "minor", "trivial"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.status} onChange={e => u("status", e.target.value as TestCase["status"])}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Owner</Label>
                <input className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.owner} onChange={e => u("owner", e.target.value)} placeholder="email@co.com" />
              </div>
              <div>
                <Label>Script Path</Label>
                <input className="gcp-input" style={{ width: "100%", marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 12 }} value={form.scriptPath} onChange={e => u("scriptPath", e.target.value)} placeholder="tests/geo/tc.yaml" />
              </div>
              <div>
                <Label>Automated</Label>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {[["Yes", true], ["No", false]].map(([label, val]) => (
                    <span key={String(label)} onClick={() => u("automated", val)}
                      style={{ padding: "4px 14px", borderRadius: 4, fontSize: 11, cursor: "pointer", border: "1px solid", fontWeight: 600,
                        background: form.automated === val ? (val ? "var(--gcp-green)" : "var(--gcp-yellow)") : "transparent",
                        color: form.automated === val ? "white" : "var(--gcp-text-secondary)",
                        borderColor: form.automated === val ? (val ? "var(--gcp-green)" : "var(--gcp-yellow)") : "var(--gcp-grey)",
                      }}>{label}</span>
                  ))}
                </div>
              </div>
              <div>
                <Label>Suites</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {allSuites.map(s => (
                    <span key={s.id} onClick={() => u("suiteIds", form.suiteIds.includes(s.id) ? form.suiteIds.filter((x: string) => x !== s.id) : [...form.suiteIds, s.id])}
                      style={{ padding: "3px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer", border: "1px solid", fontWeight: 500,
                        background: form.suiteIds.includes(s.id) ? "var(--gcp-blue)" : "transparent",
                        color: form.suiteIds.includes(s.id) ? "white" : "var(--gcp-text-secondary)",
                        borderColor: form.suiteIds.includes(s.id) ? "var(--gcp-blue)" : "var(--gcp-grey)",
                      }}>{s.name}</span>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <Label>Preconditions</Label>
                <textarea className="gcp-input" style={{ width: "100%", marginTop: 4, height: 50, resize: "vertical", fontFamily: "var(--font-mono)", fontSize: 12 }} value={form.preconditions} onChange={e => u("preconditions", e.target.value)} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <Label>Expected Behavior</Label>
                <textarea className="gcp-input" style={{ width: "100%", marginTop: 4, height: 50, resize: "vertical", fontFamily: "var(--font-mono)", fontSize: 12 }} value={form.expectedBehavior} onChange={e => u("expectedBehavior", e.target.value)} />
              </div>
            </div>
          )}

          {activeTab === "docs" && (
            <div>
              <Label>Markdown Documentation</Label>
              <textarea className="gcp-input" style={{ width: "100%", marginTop: 6, minHeight: 280, fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6, resize: "vertical" }} value={form.documentation} onChange={e => u("documentation", e.target.value)} />
              {form.documentation && (
                <div className="gcp-card" style={{ padding: 16, marginTop: 12, fontSize: 13, lineHeight: 1.7, color: "var(--gcp-text-secondary)" }}>
                  {form.documentation.split("\n").map((line: string, i: number) => (
                    <p key={i} style={{ margin: "2px 0", fontWeight: line.startsWith("##") ? 700 : 400, fontSize: line.startsWith("##") ? 15 : 13, color: line.startsWith("##") ? "var(--gcp-text)" : "var(--gcp-text-secondary)" }}>
                      {line.replace(/^#{1,3}\s*/, "")}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "http" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <Label>Expected Status Code</Label>
                <input type="number" className="gcp-input" style={{ width: 100, marginTop: 6 }} value={form.expectedStatus} onChange={e => u("expectedStatus", Number(e.target.value))} />
              </div>
              <div>
                <Label>Request Headers</Label>
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(form.requestHeaders).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input className="gcp-input" style={{ width: 180, fontFamily: "var(--font-mono)", fontSize: 12 }} value={k} onChange={e => {
                        const h = { ...form.requestHeaders }; delete h[k]; h[e.target.value] = v as string;
                        u("requestHeaders", h);
                      }} placeholder="Header-Name" />
                      <span style={{ color: "var(--gcp-text-secondary)" }}>:</span>
                      <input className="gcp-input" style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 12 }} value={v as string} onChange={e => u("requestHeaders", { ...form.requestHeaders, [k]: e.target.value })} placeholder="value" />
                      <button onClick={() => { const h = { ...form.requestHeaders }; delete h[k]; u("requestHeaders", h); }} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-red)" }}><X size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => u("requestHeaders", { ...form.requestHeaders, "": "" })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gcp-blue)", fontSize: 12, textAlign: "left", display: "flex", alignItems: "center", gap: 4 }}>
                    <Plus size={12} /> Add Header
                  </button>
                </div>
              </div>
              <div>
                <Label>Cookies</Label>
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(form.cookies).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input className="gcp-input" style={{ width: 180, fontFamily: "var(--font-mono)", fontSize: 12 }} value={k} onChange={e => {
                        const c = { ...form.cookies }; delete c[k]; c[e.target.value] = v as string;
                        u("cookies", c);
                      }} placeholder="cookie-name" />
                      <span style={{ color: "var(--gcp-text-secondary)" }}>:</span>
                      <input className="gcp-input" style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 12 }} value={v as string} onChange={e => u("cookies", { ...form.cookies, [k]: e.target.value })} placeholder="value" />
                      <button onClick={() => { const c = { ...form.cookies }; delete c[k]; u("cookies", c); }} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-red)" }}><X size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => u("cookies", { ...form.cookies, "": "" })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gcp-blue)", fontSize: 12, textAlign: "left", display: "flex", alignItems: "center", gap: 4 }}>
                    <Plus size={12} /> Add Cookie
                  </button>
                </div>
              </div>
              <div>
                <Label>Capture Response Headers</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {form.captureResponseHeaders.map((h: string) => (
                    <span key={h} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 12, fontSize: 11, background: "var(--gcp-blue)", color: "white" }}>
                      {h}
                      <button onClick={() => u("captureResponseHeaders", form.captureResponseHeaders.filter((x: string) => x !== h))} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                  <input className="gcp-input" style={{ width: 140, fontSize: 12 }} placeholder="Add header + Enter" onKeyDown={e => {
                    if (e.key === "Enter") {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v && !form.captureResponseHeaders.includes(v)) u("captureResponseHeaders", [...form.captureResponseHeaders, v]);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }} />
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--gcp-grey)", paddingTop: 16 }}>
                <Label>Filmstrip Visual Comparison</Label>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {[["Enabled", true], ["Disabled", false]].map(([label, val]) => (
                    <span key={String(label)} onClick={() => u("filmstrip", { ...form.filmstrip, enabled: val })}
                      style={{ padding: "4px 14px", borderRadius: 4, fontSize: 11, cursor: "pointer", border: "1px solid", fontWeight: 600,
                        background: form.filmstrip.enabled === val ? (val ? "var(--gcp-green)" : "var(--gcp-yellow)") : "transparent",
                        color: form.filmstrip.enabled === val ? "white" : "var(--gcp-text-secondary)",
                        borderColor: form.filmstrip.enabled === val ? (val ? "var(--gcp-green)" : "var(--gcp-yellow)") : "var(--gcp-grey)",
                      }}>{label}</span>
                  ))}
                </div>
                {form.filmstrip.enabled && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Similarity Threshold ({Math.round(form.filmstrip.threshold * 100)}%)</label>
                      <input type="range" min={0.5} max={1} step={0.01} style={{ width: "100%", marginTop: 4 }} value={form.filmstrip.threshold} onChange={e => u("filmstrip", { ...form.filmstrip, threshold: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Region</label>
                      <select className="gcp-input" style={{ marginTop: 4, width: 180 }} value={form.filmstrip.region ?? "full"} onChange={e => u("filmstrip", { ...form.filmstrip, region: e.target.value })}>
                        <option value="full">Full Page</option>
                        <option value="viewport">Viewport</option>
                        <option value="element">Element</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ borderTop: "1px solid var(--gcp-grey)", paddingTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <Label>Predicates ({form.predicates.length})</Label>
                  <button onClick={() => {
                    const newP = { id: `pred_${Date.now()}`, type: "statusCode" as const, field: "", expected: "200", operator: "equals" as const, description: "Assertion" };
                    u("predicates", [...form.predicates, newP]);
                  }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gcp-blue)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <Plus size={12} /> Add Predicate
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {form.predicates.map((p: TestCase["predicates"][0], pi: number) => (
                    <div key={p.id} className="gcp-card" style={{ padding: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)" }}>#{pi + 1}</span>
                        <button onClick={() => u("predicates", form.predicates.filter((x: typeof p) => x.id !== p.id))} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-red)" }}><X size={12} /></button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Type</label>
                          <select className="gcp-input" style={{ width: "100%", marginTop: 3, fontSize: 12 }} value={p.type} onChange={e => u("predicates", form.predicates.map((x: typeof p) => x.id === p.id ? { ...x, type: e.target.value } : x))}>
                            <option value="statusCode">Status Code</option>
                            <option value="headerEquals">Header Equals</option>
                            <option value="headerContains">Header Contains</option>
                            <option value="responseTime">Response Time</option>
                            <option value="cookieEquals">Cookie Equals</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Operator</label>
                          <select className="gcp-input" style={{ width: "100%", marginTop: 3, fontSize: 12 }} value={p.operator} onChange={e => u("predicates", form.predicates.map((x: typeof p) => x.id === p.id ? { ...x, operator: e.target.value } : x))}>
                            <option value="equals">Equals</option>
                            <option value="contains">Contains</option>
                            <option value="gt">Greater Than</option>
                            <option value="lt">Less Than</option>
                            <option value="exists">Exists</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Field</label>
                          <input className="gcp-input" style={{ width: "100%", marginTop: 3, fontSize: 12, fontFamily: "var(--font-mono)" }} value={p.field} onChange={e => u("predicates", form.predicates.map((x: typeof p) => x.id === p.id ? { ...x, field: e.target.value } : x))} placeholder={p.type === "statusCode" ? "(auto)" : "e.g. X-Cache"} />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Expected Value</label>
                          <input className="gcp-input" style={{ width: "100%", marginTop: 3, fontSize: 12, fontFamily: "var(--font-mono)" }} value={p.expected} onChange={e => u("predicates", form.predicates.map((x: typeof p) => x.id === p.id ? { ...x, expected: e.target.value } : x))} placeholder={p.type === "statusCode" ? "200" : "value"} />
                        </div>
                        <div style={{ gridColumn: "1/-1" }}>
                          <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Description</label>
                          <input className="gcp-input" style={{ width: "100%", marginTop: 3, fontSize: 12 }} value={p.description} onChange={e => u("predicates", form.predicates.map((x: typeof p) => x.id === p.id ? { ...x, description: e.target.value } : x))} placeholder="Assertion description" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--gcp-grey)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onCancel} className="gcp-button" style={{ fontSize: 13 }}>Cancel</button>
          <button onClick={() => { if (!form.name.trim()) return; onSave(form); }} className="gcp-button gcp-button-primary" disabled={!form.name.trim()} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <Check size={13} /> {initial.name ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ onClose, toast }: { onClose: () => void; toast: (m: string) => void }) {
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<{ tests: TestCase[]; errors: string[]; format: string } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleImport = () => {
    setLoading(true);
    try {
      const res = importAuto(text);
      const count = res.tests.length;
      setResult(res);
      if (count > 0) toast(`Imported ${count} test cases from ${res.format}`);
      if (res.errors.length > 0) toast(`${res.errors.length} issues during import`);
    } catch (e) { toast(`Import failed: ${e instanceof Error ? e.message : String(e)}`); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--gcp-surface)", borderRadius: 10, width: "min(600px, 92vw)", padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: 14 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Upload size={18} /> Import Test Cases</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)" }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>Paste JSON, YAML, or JUnit XML — format is auto-detected. Required: <code style={{ background: "var(--gcp-grey-bg)", padding: "1px 5px", borderRadius: 3 }}>name</code>, <code style={{ background: "var(--gcp-grey-bg)", padding: "1px 5px", borderRadius: 3 }}>category</code></p>
        <textarea className="gcp-input" style={{ width: "100%", minHeight: 180, fontFamily: "var(--font-mono)", fontSize: 12 }} value={text} onChange={e => setText(e.target.value)} placeholder='[{"name":"...","category":"geo-match",...}] or YAML or JUnit XML...' />
        {result && (
          <div style={{ padding: 12, background: "var(--gcp-grey-bg)", borderRadius: 6, fontSize: 13 }}>
            <span style={{ color: "var(--gcp-green)", fontWeight: 600 }}>✓ {result.tests.length} imported</span>
            {result.errors.length > 0 && <span style={{ color: "var(--gcp-red)", marginLeft: 12 }}>{result.errors.length} issues</span>}
            <span style={{ color: "var(--gcp-text-secondary)", marginLeft: 12, fontSize: 11 }}>Format: {result.format}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} className="gcp-button" style={{ fontSize: 13 }}>Close</button>
          <button onClick={handleImport} disabled={loading || !text.trim()} className="gcp-button gcp-button-primary" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <Upload size={14} /> {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkActionsBar({ selected, onClear, onDelete, onExport, onStatusChange, onPriorityChange, onAddToSuite, suites }: {
  selected: Set<string>; onClear: () => void; onDelete: () => void;
  onExport: (format: "json" | "csv" | "junit_xml") => void;
  onStatusChange: (s: TestCase["status"]) => void;
  onPriorityChange?: (p: TestCase["priority"]) => void;
  onAddToSuite?: (suiteId: string) => void;
  suites?: TestSuite[];
}) {
  const [showSuitePicker, setShowSuitePicker] = React.useState(false);
  if (selected.size === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--gcp-blue-bg)", border: "1px solid var(--gcp-blue)", borderRadius: 6, fontSize: 13, flexWrap: "wrap" }}>
      <Check size={14} style={{ color: "var(--gcp-blue)" }} />
      <span style={{ fontWeight: 600, color: "var(--gcp-blue)" }}>{selected.size} selected</span>
      <div style={{ width: 1, height: 16, background: "var(--gcp-grey)", margin: "0 4px" }} />
      <button onClick={onDelete} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", color: "var(--gcp-red)", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}><Trash2 size={12} /> Delete</button>
      <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Status:</span>
      {STATUSES.map(s => <button key={s} onClick={() => onStatusChange(s)} style={{ padding: "3px 8px", fontSize: 12, border: "none", background: "none", cursor: "pointer", textTransform: "capitalize" }}>{s}</button>)}
      {onPriorityChange && (<><span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Priority:</span>
        {(["P0", "P1", "P2", "P3"] as TestCase["priority"][]).map(p => <button key={p} onClick={() => onPriorityChange(p)} style={{ padding: "3px 8px", fontSize: 12, border: "none", background: "none", cursor: "pointer" }}>{p}</button>)}
      </>)}
      {onAddToSuite && suites && (
        <div style={{ position: "relative", display: "inline-block" }}>
          <button onClick={() => setShowSuitePicker(v => !v)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", fontSize: 12, border: "none", background: "none", cursor: "pointer" }}><FolderTree size={12} /> Suite</button>
          {showSuitePicker && (
            <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "var(--gcp-surface)", border: "1px solid var(--gcp-grey)", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 50, minWidth: 200, padding: 4 }}>
              {suites.map(s => (
                <div key={s.id} onClick={() => { onAddToSuite(s.id); setShowSuitePicker(false); }} style={{ padding: "6px 10px", cursor: "pointer", borderRadius: 4, fontSize: 12 }} onMouseEnter={e => e.currentTarget.style.background = "var(--gcp-grey-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {s.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <button onClick={() => onExport("json")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", fontSize: 12, border: "none", background: "none", cursor: "pointer" }}><FileJson size={12} /> JSON</button>
      <button onClick={() => onExport("csv")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", fontSize: 12, border: "none", background: "none", cursor: "pointer" }}><FileSpreadsheet size={12} /> CSV</button>
      <button onClick={() => onExport("junit_xml")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", fontSize: 12, border: "none", background: "none", cursor: "pointer" }}><FileCode size={12} /> JUnit</button>
      <button onClick={onClear} style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)" }}><X size={14} /></button>
    </div>
  );
}

function applyFilters(tcs: TestCase[], colFilters: Record<string, ColumnFilterState>, searchText: string) {
  return tcs.filter(tc => {
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!tc.name.toLowerCase().includes(q) && !tc.description.toLowerCase().includes(q) && !tc.id.toLowerCase().includes(q)) return false;
    }
    for (const [field, f] of Object.entries(colFilters)) {
      if (!f.text && f.selected.length === 0) continue;
      const raw = String((tc as unknown as Record<string, unknown>)[field] ?? "");
      if (f.text && !raw.toLowerCase().includes(f.text.toLowerCase())) return false;
      if (f.selected.length > 0 && !f.selected.includes(raw)) return false;
    }
    return true;
  });
}

function downloadString(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default function TestManager() {
  const [, navigate] = useLocation();
  const { tcs, suites } = useTestData();
  const stats = React.useMemo(() => computeTestStats(), [tcs]);
  const { show: toast, Toast } = useSimpleToast();

  const [searchText, setSearchText] = React.useState("");
  const [colFilters, setColFilters] = useSyncedUrlState<Record<string, ColumnFilterState>>("filters", {});
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [createInitial, setCreateInitial] = React.useState<Omit<TestCase, "id" | "createdAt" | "updatedAt">>(EMPTY_FORM);
  const [showCreate, setShowCreate] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);
  const [showGenerate, setShowGenerate] = React.useState(false);
  const [selectedPanelId, setSelectedPanelId] = useSyncedUrlState<string | null>("sel", null);
  const [configChanged, setConfigChanged] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("newTestConfig");
    if (raw) {
      try {
        const config = decodeTestConfigFromNav(raw);
        const merged = { ...EMPTY_FORM, ...config };
        setCreateInitial(merged);
        setShowCreate(true);
        const url = new URL(window.location.href);
        url.searchParams.delete("newTestConfig");
        window.history.replaceState({}, "", url.toString());
        return;
      } catch {
        console.warn("Failed to decode newTestConfig param");
      }
    }
    const pending = getPendingTestConfig();
    if (pending) {
      const merged = { ...EMPTY_FORM, ...pending };
      setCreateInitial(merged);
      setShowCreate(true);
    }
  }, []);

  const markConfigChanged = () => { if (!configChanged) setConfigChanged(true); };

  const updateColFilter = (field: string) => (f: ColumnFilterState) => setColFilters(prev => ({ ...prev, [field]: f }));

  const handleStatFilter = (field: string, value: string) => {
    if (field === "_clear") { setColFilters({}); return; }
    setColFilters(prev => {
      const cur = prev[field];
      const isActive = cur?.selected.includes(value);
      if (isActive) {
        const next = { ...prev };
        if (next[field]) next[field] = { ...next[field], selected: next[field].selected.filter(v => v !== value) };
        return next;
      }
      return { ...prev, [field]: { text: "", selected: [...(cur?.selected ?? []), value] } };
    });
  };

  const filtered = React.useMemo(() => applyFilters(tcs, colFilters, searchText), [tcs, colFilters, searchText]);

  const selectedPanel = selectedPanelId ? tcs.find(t => t.id === selectedPanelId) ?? null : null;
  const editingTc = editingId ? tcs.find(t => t.id === editingId) : null;

  const handleCreate = (data: Omit<TestCase, "id" | "createdAt" | "updatedAt">) => {
    createTestCase(data);
    setShowCreate(false);
    markConfigChanged();
    toast("Test case created");
  };

  const handleUpdate = (data: Omit<TestCase, "id" | "createdAt" | "updatedAt">) => {
    if (!editingId) return;
    updateTestCase(editingId, data);
    setEditingId(null);
    markConfigChanged();
    toast("Test case updated");
  };

  const handleDelete = (ids: string[]) => {
    ids.forEach(id => deleteTestCase(id));
    setSelectedIds(new Set());
    if (selectedPanelId && ids.includes(selectedPanelId)) setSelectedPanelId(null);
    markConfigChanged();
    toast(`Deleted ${ids.length} test case${ids.length > 1 ? "s" : ""}`);
  };

  const handleExport = (format: "json" | "csv" | "junit_xml") => {
    if (format === "junit_xml") {
      downloadString(exportTestsAsJunitXml(), "aware-tests.xml");
    } else {
      downloadString(exportTestCases(format), `aware-tests.${format === "json" ? "json" : "csv"}`);
    }
    toast(`Exported as ${format.toUpperCase()}`);
  };

  const handleBulkStatusChange = (status: TestCase["status"]) => {
    selectedIds.forEach(id => updateTestCase(id, { status }));
    setSelectedIds(new Set());
    toast(`Updated ${selectedIds.size} tests to "${status}"`);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(t => t.id)));
  };

  const allValues = {
    status: STATUSES as unknown as string[],
    priority: PRIORITIES as string[],
    category: ["geo-match", "locale-split", "url-health", "security", "performance", "caching", "routing", "tls", "ddos"],
    automated: ["true", "false"],
  };

  return (
    <AppLayout activeHref="/tests">
      {Toast}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "calc(100vh - 100px)", maxWidth: 1600, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--gcp-text)", marginBottom: 2 }}>Test Manager</h1>
            <p style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>{tcs.length} test cases across {suites.length} suites</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowImport(true)} className="gcp-button" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}><Upload size={13} /> Import</button>
            <button onClick={() => handleExport("json")} className="gcp-button" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}><Download size={13} /> Export</button>
            <button onClick={() => setShowGenerate(true)} className="gcp-button" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, color: "var(--gcp-yellow)" }}><Sparkles size={13} /> Generate</button>
            <button onClick={() => { if (confirm("Reset all test data to defaults?")) { resetTestStore(); toast("Store reset"); } }} className="gcp-button" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}><RotateCcw size={13} /> Reset</button>
            <button onClick={() => setShowCreate(true)} className="gcp-button gcp-button-primary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}><Plus size={13} /> New Test</button>
          </div>
        </div>
        <StatsDashboard stats={stats} colFilters={colFilters} onToggleFilter={handleStatFilter} />
        <CiConfigBanner show={configChanged} onDismiss={() => setConfigChanged(false)} />
        <BulkActionsBar
          selected={selectedIds}
          onClear={() => setSelectedIds(new Set())}
          onDelete={() => handleDelete(Array.from(selectedIds))}
          onExport={handleExport}
          suites={suites}
          onStatusChange={handleBulkStatusChange}
          onPriorityChange={(p: TestCase["priority"]) => { selectedIds.forEach(id => updateTestCase(id, { priority: p })); setSelectedIds(new Set()); toast(`Updated ${selectedIds.size} tests to ${p}`); }}
          onAddToSuite={suiteId => { selectedIds.forEach(id => { const tc = tcs.find(t => t.id === id); if (tc && !tc.suiteIds.includes(suiteId)) updateTestCase(id, { suiteIds: [...tc.suiteIds, suiteId] }); }); setSelectedIds(new Set()); toast(`Added ${selectedIds.size} tests to suite`); }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gcp-text-secondary)", pointerEvents: "none" }} />
            <input className="gcp-input" style={{ width: "100%", paddingLeft: 32 }} placeholder="Search test name, description, ID…" value={searchText} onChange={e => setSearchText(e.target.value)} />
          </div>
          <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)", whiteSpace: "nowrap" }}>{filtered.length} / {tcs.length} shown</span>
          {Object.values(colFilters).some(f => f.text || f.selected.length > 0) && (
            <button onClick={() => setColFilters({})} style={{ fontSize: 12, color: "var(--gcp-red)", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>Clear filters</button>
          )}
        </div>
        <div style={{ flex: 1, display: "flex", gap: 14, overflow: "hidden" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }} className="gcp-card">
            <div style={{ flex: 1, overflowY: "auto" }}>
              <table className="gcp-table" style={{ margin: 0 }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--gcp-surface)", zIndex: 10 }}>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ accentColor: "var(--gcp-blue)" }} />
                    </th>
                    <th><ColumnFilter label="Name" filter={colFilters.name ?? EMPTY_FILTER} onFilterChange={updateColFilter("name")} /></th>
                    <th><ColumnFilter label="Status" allValues={allValues.status} filter={colFilters.status ?? EMPTY_FILTER} onFilterChange={updateColFilter("status")} /></th>
                    <th><ColumnFilter label="Priority" allValues={allValues.priority} filter={colFilters.priority ?? EMPTY_FILTER} onFilterChange={updateColFilter("priority")} /></th>
                    <th><ColumnFilter label="Category" allValues={allValues.category} filter={colFilters.category ?? EMPTY_FILTER} onFilterChange={updateColFilter("category")} /></th>
                    <th>Tags</th>
                    <th>Owner</th>
                    <th style={{ width: 80, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(tc => {
                    const isSelected = selectedIds.has(tc.id);
                    const isPanelOpen = selectedPanelId === tc.id;
                    return (
                      <tr key={tc.id}
                        onClick={() => setSelectedPanelId(isPanelOpen ? null : tc.id)}
                        style={{
                          cursor: "pointer",
                          background: isPanelOpen ? "var(--gcp-blue-bg)" : isSelected ? "var(--gcp-grey-bg)" : undefined,
                          outline: isPanelOpen ? "2px solid var(--gcp-blue) inset" : undefined,
                        }}
                      >
                        <td onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isSelected} onChange={e => {
                            const next = new Set(selectedIds);
                            e.target.checked ? next.add(tc.id) : next.delete(tc.id);
                            setSelectedIds(next);
                          }} style={{ accentColor: "var(--gcp-blue)" }} />
                        </td>
                        <td>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-blue)", fontWeight: 600, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tc.name}>{tc.name}</div>
                          <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", fontFamily: "var(--font-mono)" }}>{tc.id} · v{tc.version}</div>
                        </td>
                        <td><StatusBadge s={tc.status} /></td>
                        <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: priorityColor(tc.priority) }}>{tc.priority}</span></td>
                        <td><span style={{ fontSize: 11, padding: "2px 8px", background: "var(--gcp-surface)", border: "1px solid var(--gcp-grey)", borderRadius: 4 }}>{tc.category}</span></td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                            {tc.tags.slice(0, 2).map(t => <TagBadge key={t} tagId={t} />)}
                            {tc.tags.length > 2 && <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>+{tc.tags.length - 2}</span>}
                          </div>
                        </td>
                        <td style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{tc.owner.split("@")[0]}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                            <button onClick={() => setEditingId(tc.id)} title="Edit" style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)" }}><Edit3 size={13} /></button>
                            <button onClick={() => { if (confirm(`Delete "${tc.name}"?`)) handleDelete([tc.id]); }} title="Delete" style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-red)" }}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--gcp-text-secondary)", fontSize: 13 }}>No test cases match your filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "8px 14px", borderTop: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--gcp-text-secondary)", flexShrink: 0 }}>
              <span>{filtered.length} of {tcs.length} test cases</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleExport("csv")} style={{ fontSize: 11, color: "var(--gcp-blue)", background: "none", border: "none", cursor: "pointer" }}>Export CSV</button>
                <button onClick={() => handleExport("junit_xml")} style={{ fontSize: 11, color: "var(--gcp-blue)", background: "none", border: "none", cursor: "pointer" }}>Export JUnit XML</button>
              </div>
            </div>
          </div>
          {selectedPanel && (
            <TestManagerSidePanel tc={selectedPanel} onClose={() => setSelectedPanelId(null)} toast={toast} navigate={navigate} />
          )}
        </div>
      </div>
      {showCreate && <TestCaseModal initial={createInitial} allSuites={suites} onSave={handleCreate} onCancel={() => { setShowCreate(false); setCreateInitial(EMPTY_FORM); }} />}
      {editingTc && editingId && <TestCaseModal initial={editingTc} allSuites={suites} onSave={handleUpdate} onCancel={() => setEditingId(null)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} toast={toast} />}
      {showGenerate && <GenerateWizard allSuites={suites} onClose={() => setShowGenerate(false)} toast={toast} />}
    </AppLayout>
  );
}

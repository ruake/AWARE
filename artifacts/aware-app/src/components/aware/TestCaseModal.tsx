import React from "react";
import type { TestCase, TestSuite } from "@/lib/types";
import { CATEGORIES, PRIORITIES, STATUSES, OWNERS } from "@/lib/constants";
import { testCaseToDraft, formatTestCaseDraftAsYaml, REQUIRED_FIELDS } from "@/lib/formUtils";
import yaml from "js-yaml";
import { X, Plus, Code, Check } from "lucide-react";

type FormMode = "form" | "yaml" | "json";

export function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{children}</label>;
}

export function LabelReq({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {children}
      {required && <span style={{ color: "var(--gcp-red)", marginLeft: 2 }}>*</span>}
    </label>
  );
}

export function TestCaseModal({ initial, allSuites, onSave, onCancel }: {
  initial: Omit<TestCase, "id" | "createdAt" | "updatedAt">;
  allSuites: TestSuite[];
  onSave: (data: Omit<TestCase, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState(initial);
  const [activeTab, setActiveTab] = React.useState<"basic" | "docs" | "http">("basic");
  const [formMode, setFormMode] = React.useState<FormMode>("form");
  const u = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const reqFields = REQUIRED_FIELDS[form.testType] || REQUIRED_FIELDS.web;

  const tabStyle = (tab: string) => ({
    padding: "10px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer",
    border: "none", background: activeTab === tab ? "var(--gcp-surface)" : "transparent",
    borderBottom: `2px solid ${activeTab === tab ? "var(--gcp-blue)" : "transparent"}`,
    color: activeTab === tab ? "var(--gcp-blue)" : "var(--gcp-text-secondary)",
  });

  const modeBtnStyle = (mode: FormMode) => ({
    padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer",
    border: `1px solid ${formMode === mode ? "var(--gcp-blue)" : "var(--gcp-grey)"}`,
    background: formMode === mode ? "var(--gcp-blue)" : "transparent",
    color: formMode === mode ? "white" : "var(--gcp-text-secondary)",
    borderRadius: 4, transition: "all 0.15s",
  });

  const draft = React.useMemo(() => testCaseToDraft(form), [form]);

  const [codeText, setCodeText] = React.useState(() => formatTestCaseDraftAsYaml(testCaseToDraft(form)));

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);

  React.useEffect(() => {
    if (formMode === "yaml") setCodeText(formatTestCaseDraftAsYaml(draft));
    else if (formMode === "json") setCodeText(JSON.stringify(draft, null, 2));
  }, [formMode, draft, form]);

  const handleCodeApply = () => {
    try {
      let parsed: Record<string, unknown>;
      if (formMode === "yaml") {
        parsed = yaml.load(codeText) as Record<string, unknown>;
      } else {
        parsed = JSON.parse(codeText);
      }
      if (!parsed || typeof parsed !== "object") return;
      const newForm = { ...form };
      if (parsed.name) newForm.name = String(parsed.name);
      if (parsed.description) newForm.description = String(parsed.description);
      if (parsed.testType) newForm.testType = parsed.testType as TestCase["testType"];
      if (parsed.category) newForm.category = String(parsed.category);
      if (parsed.priority) newForm.priority = parsed.priority as TestCase["priority"];
      if (parsed.severity) newForm.severity = parsed.severity as TestCase["severity"];
      if (parsed.status) newForm.status = parsed.status as TestCase["status"];
      if (parsed.tags) newForm.tags = (parsed.tags as string[]).map(String);
      if (parsed.owner) newForm.owner = String(parsed.owner);
      if (parsed.automated !== undefined) newForm.automated = Boolean(parsed.automated);
      if (parsed.scriptPath) newForm.scriptPath = String(parsed.scriptPath);
      if (parsed.preconditions) newForm.preconditions = String(parsed.preconditions);
      if (parsed.expectedBehavior) newForm.expectedBehavior = String(parsed.expectedBehavior);
      if (parsed.expectedStatus !== undefined) newForm.expectedStatus = Number(parsed.expectedStatus);
      if (parsed.requestHeaders) newForm.requestHeaders = parsed.requestHeaders as Record<string, string>;
      if (parsed.cookies) newForm.cookies = parsed.cookies as Record<string, string>;
      if (parsed.captureResponseHeaders) newForm.captureResponseHeaders = (parsed.captureResponseHeaders as string[]).map(String);
      if (parsed.filmstrip) newForm.filmstrip = {
        ...newForm.filmstrip,
        enabled: (parsed.filmstrip as Record<string, unknown>).enabled === true,
        threshold: Number((parsed.filmstrip as Record<string, unknown>).threshold ?? 0.99),
        region: String((parsed.filmstrip as Record<string, unknown>).region || "full"),
      };
      if (parsed.predicates) newForm.predicates = (parsed.predicates as Array<Record<string, unknown>>).map(p => ({
        id: `pred_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: (String(p.type || "statusCode")) as TestCase["predicates"][0]["type"],
        field: String(p.field || ""),
        expected: String(p.expected || ""),
        operator: (String(p.operator || "equals")) as TestCase["predicates"][0]["operator"],
        description: String(p.description || ""),
      }));
      setForm(newForm);
    } catch {
      // parse error - ignore
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onCancel}>
      <div style={{ background: "var(--gcp-surface)", borderRadius: 10, width: "min(860px, 94vw)", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>{initial.name ? "Edit Test Case" : "New Test Case"}</h2>
            {initial.version > 1 && <span style={{ fontSize: 11, background: "var(--gcp-grey-bg)", border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "1px 7px", fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)" }}>v{initial.version}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={modeBtnStyle("form")} onClick={() => setFormMode("form")}><Code size={11} style={{ marginRight: 4 }} />Form</button>
            <button style={modeBtnStyle("yaml")} onClick={() => setFormMode("yaml")}>YAML</button>
            <button style={modeBtnStyle("json")} onClick={() => setFormMode("json")}>JSON</button>
            <div style={{ width: 1, height: 18, background: "var(--gcp-grey)", margin: "0 4px" }} />
            <button onClick={onCancel} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)" }}><X size={18} /></button>
          </div>
        </div>

        {formMode !== "form" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 400 }}>
            <div style={{ padding: "8px 14px", background: "var(--gcp-grey-bg)", borderBottom: "1px solid var(--gcp-grey)", fontSize: 11, color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>Edit test case in {formMode.toUpperCase()} format. All fields are directly editable.</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--gcp-blue)", cursor: "pointer" }} onClick={handleCodeApply}>Apply changes</span>
            </div>
            <textarea
              className="gcp-input"
              style={{
                flex: 1, width: "100%", minHeight: 400, resize: "none", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6, border: "none", borderRadius: 0, padding: 16,
              }}
              value={codeText}
              onChange={e => setCodeText(e.target.value)}
              spellCheck={false}
            />
            <div style={{ padding: "8px 14px", borderTop: "1px solid var(--gcp-grey)", fontSize: 10, color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center", gap: 12 }}>
              <span>Edit and click "Apply changes" to sync back to the form — then Save.</span>
              <button onClick={() => setFormMode("form")} className="gcp-button gcp-button-xs" style={{ marginLeft: "auto" }}>Back to Form</button>
            </div>
          </div>
        )}

        {formMode === "form" && <div style={{ display: "flex", borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)", flexShrink: 0 }}>
          <button style={tabStyle("basic")} onClick={() => setActiveTab("basic")}>Basic Info</button>
          <button style={tabStyle("docs")} onClick={() => setActiveTab("docs")}>Documentation</button>
          <button style={tabStyle("http")} onClick={() => setActiveTab("http")}>HTTP &amp; Predicates</button>
        </div>}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {formMode !== "form" ? null : activeTab === "basic" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <LabelReq required>Name</LabelReq>
                <input className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.name} onChange={e => u("name", e.target.value)} placeholder="Verify Geo match for /api/v1/…" />
              </div>
              <div>
                <LabelReq required>Test Type</LabelReq>
                <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.testType} onChange={e => {
                  const newType = e.target.value as TestCase["testType"];
                  u("testType", newType);
                  const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "unnamed";
                  if (newType === "transaction") u("scriptPath", `tests/transaction/${slug}.yaml`);
                  else if (newType === "edgeworker") u("scriptPath", `tests/edgeworker/${slug}.yaml`);
                  else u("scriptPath", `tests/${form.category}/${slug}.yaml`);
                }}>
                  <option value="web">Web</option>
                  <option value="api">API</option>
                  <option value="edgeworker">EdgeWorker</option>
                  <option value="transaction">Transaction</option>
                </select>
              </div>
              <div>
                <LabelReq required={reqFields.includes("expectedStatus")}>Expected Status</LabelReq>
                <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.expectedStatus} onChange={e => u("expectedStatus", Number(e.target.value))}>
                  {[200, 201, 204, 301, 302, 304, 400, 401, 403, 404, 429, 500, 502, 503].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <LabelReq required>Description</LabelReq>
                <textarea className="gcp-input" style={{ width: "100%", marginTop: 4, height: 60, resize: "vertical" }} value={form.description} onChange={e => u("description", e.target.value)} placeholder="What does this test validate?" />
              </div>
              <div>
                <LabelReq required={reqFields.includes("category")}>Category</LabelReq>
                <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.category} onChange={e => u("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <LabelReq required={reqFields.includes("priority")}>Priority</LabelReq>
                <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.priority} onChange={e => u("priority", e.target.value)}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <LabelReq required={reqFields.includes("severity")}>Severity</LabelReq>
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
                <LabelReq required={reqFields.includes("owner")}>Owner</LabelReq>
                <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.owner} onChange={e => u("owner", e.target.value)}>
                  {OWNERS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <LabelReq required={reqFields.includes("scriptPath")}>Script Path</LabelReq>
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
          <button onClick={onCancel} className="gcp-button">Cancel</button>
          <button onClick={() => { if (!form.name.trim()) return; onSave(form); }} className="gcp-button gcp-button-primary" disabled={!form.name.trim()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Check size={13} /> {initial.name ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

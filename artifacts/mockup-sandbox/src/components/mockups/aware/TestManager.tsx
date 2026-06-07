import React from "react";
import { Chart } from "react-google-charts";
import { AppLayout } from "./_shared/AppLayout";
import { useSyncTestCases, useSyncTestSuites, useDeleteTestCase, useCreateTestCase, useUpdateTestCase, useImportTestCases, useExportTestCases, useGenerateTestCases, useTestStats, useTestChangelog, useUpdateDocumentation } from "./_shared/hooks";
import type { TestCase, TestPriority, TestSeverity, TestStatus, GenerateParams, TestStats } from "./_shared/types";
import { getServices } from "./_shared/services";
import { navTo, showToast, copyToClipboard } from "./_shared/nav";
import { useSyncedUrlState } from "./_shared/urlState";
import { ColumnFilter, type ColumnFilterState } from "./_shared/ColumnFilter";
import "./_group.css";
import {
  Plus, Search, Upload, Download, FileJson, FileSpreadsheet, FileCode,
  Check, X, Edit3, Trash2, Tag, Beaker, ExternalLink,
  FolderTree, BarChart3, Clock, Bug, FileText,
  Sparkles,
} from "lucide-react";

const EMPTY_FILTER: ColumnFilterState = { text: "", selected: [] };
const PRIORITIES: TestPriority[] = ["P0", "P1", "P2", "P3"];
const STATUSES: TestStatus[] = ["active", "disabled", "deprecated"];
const SEVERITIES = ["critical", "major", "minor", "trivial"];

const TAG_COLORS: Record<string, string> = {
  geo: "#1a73e8", locale: "#9334e6", health: "#e8710a",
  security: "#d93025", performance: "#1e8e3e", regression: "#f9ab00",
  smoke: "#185abc", e2e: "#c5221f", automated: "#1e8e3e",
};

function TagBadge({ tag }: { tag: string }) {
  const color = TAG_COLORS[tag] ?? "#5f6368";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: color + "18", color }}>
      <Tag size={10} /> {tag.replace("tag_", "")}
    </span>
  );
}

function PriorityBadge({ p }: { p: TestPriority }) {
  const colors: Record<TestPriority, string> = { P0: "#d93025", P1: "#e8710a", P2: "#1a73e8", P3: "#5f6368" };
  return <span className="text-[11px] font-bold font-mono" style={{ color: colors[p] }}>{p}</span>;
}

function StatusBadge({ s }: { s: TestStatus }) {
  const cfg: Record<TestStatus, { cls: string; label: string }> = {
    active: { cls: "gcp-badge-pass", label: "Active" },
    disabled: { cls: "gcp-badge-flaky", label: "Disabled" },
    deprecated: { cls: "gcp-badge-fail", label: "Deprecated" },
  };
  return <span className={`gcp-badge ${cfg[s].cls}`}>{cfg[s].label}</span>;
}

function applyFilters(tcs: TestCase[], filters: Record<string, ColumnFilterState>, searchText: string) {
  return tcs.filter(tc => {
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!tc.name.toLowerCase().includes(q) && !tc.description.toLowerCase().includes(q) && !tc.id.toLowerCase().includes(q)) return false;
    }
    for (const [field, f] of Object.entries(filters)) {
      const raw = String((tc as unknown as Record<string, unknown>)[field] ?? "");
      const textMatch = !f.text || raw.toLowerCase().includes(f.text.toLowerCase());
      const selMatch = f.selected.length === 0 || f.selected.includes(raw);
      if (!textMatch || !selMatch) return false;
    }
    return true;
  });
}

const EMPTY_FORM: Omit<TestCase, "id" | "createdAt" | "updatedAt"> = {
  name: "", description: "", category: "geo-match", priority: "P2",
  severity: "minor", status: "active", tags: [], owner: "",
  suiteIds: [], automated: true, scriptPath: "",
  preconditions: "", expectedBehavior: "", documentation: "", relatedTestIds: [],
  requestHeaders: {}, cookies: {}, expectedStatus: 200,
  captureResponseHeaders: [],
  filmstrip: { enabled: false, threshold: 0.99 },
  predicates: [],
  version: 1, changelog: [],
};

function TestCaseForm({ initial, onSave, onCancel }: {
  initial: Omit<TestCase, "id" | "createdAt" | "updatedAt">;
  onSave: (data: Omit<TestCase, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState(initial);
  const allSuites = useSyncTestSuites();
  const [activeTab, setActiveTab] = React.useState<"basic" | "docs" | "http">("basic");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-[var(--gcp-surface)] rounded-xl shadow-2xl border border-[var(--gcp-grey)]" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[var(--gcp-surface)] z-10 flex items-center justify-between p-5 border-b border-[var(--gcp-grey)]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">{initial.name ? "Edit Test Case" : "New Test Case"}</h2>
            {initial.version > 1 && <span className="text-[11px] text-[var(--gcp-text-secondary)] bg-[var(--gcp-grey-bg)] px-2 py-0.5 rounded font-mono">v{initial.version}</span>}
          </div>
          <button onClick={onCancel} className="p-1 text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)] rounded"><X size={18} /></button>
        </div>

        <div className="flex border-b border-[var(--gcp-grey)] bg-[var(--gcp-grey-bg)]">
          <button onClick={() => setActiveTab("basic")} className={`px-5 py-2.5 text-sm font-medium ${activeTab === "basic" ? "bg-[var(--gcp-surface)] border-b-2 border-[var(--gcp-blue)] text-[var(--gcp-blue)]" : "text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)]"}`}>Basic Info</button>
          <button onClick={() => setActiveTab("docs")} className={`px-5 py-2.5 text-sm font-medium ${activeTab === "docs" ? "bg-[var(--gcp-surface)] border-b-2 border-[var(--gcp-blue)] text-[var(--gcp-blue)]" : "text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)]"}`}>Documentation</button>
          <button onClick={() => setActiveTab("http")} className={`px-5 py-2.5 text-sm font-medium ${activeTab === "http" ? "bg-[var(--gcp-surface)] border-b-2 border-[var(--gcp-blue)] text-[var(--gcp-blue)]" : "text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)]"}`}>HTTP & Predicates</button>
        </div>

        <div className="p-5 space-y-4">
          {activeTab === "basic" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Name</label>
                <input className="gcp-input w-full mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Test case name" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Description</label>
                <textarea className="gcp-input w-full mt-1 min-h-[60px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the test case" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Category</label>
                <select className="gcp-input w-full mt-1" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {["geo-match", "locale-split", "url-health", "security", "performance", "caching", "routing", "tls", "ddos"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Priority</label>
                <select className="gcp-input w-full mt-1" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TestPriority }))}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Severity</label>
                <select className="gcp-input w-full mt-1" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as TestSeverity }))}>
                  {SEVERITIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Status</label>
                <select className="gcp-input w-full mt-1" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TestStatus }))}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Owner</label>
                <input className="gcp-input w-full mt-1" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="email@co.com" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Script Path</label>
                <input className="gcp-input w-full mt-1" value={form.scriptPath} onChange={e => setForm(f => ({ ...f, scriptPath: e.target.value }))} placeholder="tests/geo-match/tc.spec.ts" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Automated</label>
                <div className="flex items-center gap-3 mt-2">
                  <span onClick={() => setForm(f => ({ ...f, automated: true }))} className={`px-3 py-1 rounded text-[11px] cursor-pointer border ${form.automated ? "bg-[var(--gcp-green)] text-white border-[var(--gcp-green)]" : "border-[var(--gcp-grey)] text-[var(--gcp-text-secondary)]"}`}>Yes</span>
                  <span onClick={() => setForm(f => ({ ...f, automated: false }))} className={`px-3 py-1 rounded text-[11px] cursor-pointer border ${!form.automated ? "bg-[var(--gcp-yellow)] text-white border-[var(--gcp-yellow)]" : "border-[var(--gcp-grey)] text-[var(--gcp-text-secondary)]"}`}>No</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Suites</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {allSuites.map(s => (
                    <span key={s.id} onClick={() => setForm(f => ({ ...f, suiteIds: f.suiteIds.includes(s.id) ? f.suiteIds.filter(x => x !== s.id) : [...f.suiteIds, s.id] }))}
                      className={`px-2 py-1 rounded text-[11px] cursor-pointer border transition-colors ${form.suiteIds.includes(s.id) ? "bg-[var(--gcp-blue)] text-white border-[var(--gcp-blue)]" : "border-[var(--gcp-grey)] text-[var(--gcp-text-secondary)] hover:border-[var(--gcp-blue)]"}`}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Preconditions</label>
                <textarea className="gcp-input w-full mt-1 min-h-[50px] font-mono text-[12px]" value={form.preconditions} onChange={e => setForm(f => ({ ...f, preconditions: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Expected Behavior</label>
                <textarea className="gcp-input w-full mt-1 min-h-[50px] font-mono text-[12px]" value={form.expectedBehavior} onChange={e => setForm(f => ({ ...f, expectedBehavior: e.target.value }))} />
              </div>
            </div>
          )}

          {activeTab === "docs" && (
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Markdown Documentation</label>
              <textarea className="gcp-input w-full min-h-[300px] font-mono text-[12px] leading-relaxed" value={form.documentation} onChange={e => setForm(f => ({ ...f, documentation: e.target.value }))} />
              {form.documentation && (
                <div className="gcp-card p-4 text-sm prose prose-sm max-w-none">
                  {form.documentation.split("\n").map((line, i) => (
                    <p key={i} className={line.startsWith("##") ? "font-bold text-base mt-3 mb-1" : line.startsWith("###") ? "font-semibold text-sm mt-2 mb-1" : "text-[var(--gcp-text-secondary)] mb-0.5"}>{line.replace(/^#{1,3}\s*/, "")}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "http" && (
            <div className="space-y-5">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium mb-1 block">Expected Status Code</label>
                <input type="number" className="gcp-input w-32 mt-1" value={form.expectedStatus} onChange={e => setForm(f => ({ ...f, expectedStatus: Number(e.target.value) }))} />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium mb-1 block">Request Headers</label>
                <div className="space-y-1.5">
                  {Object.entries(form.requestHeaders).map(([k, v]) => (
                    <div key={k} className="flex gap-2 items-center">
                      <input className="gcp-input w-48 text-[12px] font-mono" value={k} onChange={e => {
                        const newHeaders = { ...form.requestHeaders };
                        delete newHeaders[k];
                        newHeaders[e.target.value] = v;
                        setForm(f => ({ ...f, requestHeaders: newHeaders }));
                      }} placeholder="Header name" />
                      <span className="text-[var(--gcp-text-secondary)]">:</span>
                      <input className="gcp-input flex-1 text-[12px] font-mono" value={v} onChange={e => setForm(f => ({ ...f, requestHeaders: { ...f.requestHeaders, [k]: e.target.value } }))} placeholder="Value" />
                      <button onClick={() => { const h = { ...form.requestHeaders }; delete h[k]; setForm(f => ({ ...f, requestHeaders: h })); }} className="p-1 text-[var(--gcp-red)] hover:bg-red-50 rounded"><X size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => setForm(f => ({ ...f, requestHeaders: { ...f.requestHeaders, "": "" } }))} className="text-[12px] text-[var(--gcp-blue)] hover:underline flex items-center gap-1"><Plus size={12} /> Add Header</button>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium mb-1 block">Cookies</label>
                <div className="space-y-1.5">
                  {Object.entries(form.cookies).map(([k, v]) => (
                    <div key={k} className="flex gap-2 items-center">
                      <input className="gcp-input w-48 text-[12px] font-mono" value={k} onChange={e => {
                        const c = { ...form.cookies };
                        delete c[k];
                        c[e.target.value] = v;
                        setForm(f => ({ ...f, cookies: c }));
                      }} placeholder="Cookie name" />
                      <span className="text-[var(--gcp-text-secondary)]">:</span>
                      <input className="gcp-input flex-1 text-[12px] font-mono" value={v} onChange={e => setForm(f => ({ ...f, cookies: { ...f.cookies, [k]: e.target.value } }))} placeholder="Value" />
                      <button onClick={() => { const c = { ...form.cookies }; delete c[k]; setForm(f => ({ ...f, cookies: c })); }} className="p-1 text-[var(--gcp-red)] hover:bg-red-50 rounded"><X size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => setForm(f => ({ ...f, cookies: { ...f.cookies, "": "" } }))} className="text-[12px] text-[var(--gcp-blue)] hover:underline flex items-center gap-1"><Plus size={12} /> Add Cookie</button>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium mb-1 block">Capture Response Headers</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {form.captureResponseHeaders.map(h => (
                    <span key={h} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[var(--gcp-blue)] text-white">
                      {h}
                      <button onClick={() => setForm(f => ({ ...f, captureResponseHeaders: f.captureResponseHeaders.filter(x => x !== h) }))} className="hover:text-red-200"><X size={10} /></button>
                    </span>
                  ))}
                  <input className="gcp-input w-40 text-[12px]" placeholder="Add header…" onKeyDown={e => {
                    if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (!form.captureResponseHeaders.includes(v)) setForm(f => ({ ...f, captureResponseHeaders: [...f.captureResponseHeaders, v] }));
                      (e.target as HTMLInputElement).value = "";
                    }
                  }} />
                </div>
              </div>

              <div className="border-t border-[var(--gcp-grey)] pt-4">
                <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium mb-2 block">Filmstrip Visual Comparison</label>
                <div className="flex items-center gap-3">
                  <span onClick={() => setForm(f => ({ ...f, filmstrip: { ...f.filmstrip, enabled: true } }))} className={`px-3 py-1 rounded text-[11px] cursor-pointer border ${form.filmstrip.enabled ? "bg-[var(--gcp-green)] text-white border-[var(--gcp-green)]" : "border-[var(--gcp-grey)] text-[var(--gcp-text-secondary)]"}`}>Enabled</span>
                  <span onClick={() => setForm(f => ({ ...f, filmstrip: { ...f.filmstrip, enabled: false } }))} className={`px-3 py-1 rounded text-[11px] cursor-pointer border ${!form.filmstrip.enabled ? "bg-[var(--gcp-yellow)] text-white border-[var(--gcp-yellow)]" : "border-[var(--gcp-grey)] text-[var(--gcp-text-secondary)]"}`}>Disabled</span>
                </div>
                {form.filmstrip.enabled && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-[11px] text-[var(--gcp-text-secondary)]">Similarity Threshold ({Math.round(form.filmstrip.threshold * 100)}%)</label>
                      <input type="range" min={0.5} max={1} step={0.01} className="w-full mt-1" value={form.filmstrip.threshold} onChange={e => setForm(f => ({ ...f, filmstrip: { ...f.filmstrip, threshold: Number(e.target.value) } }))} />
                    </div>
                    <div>
                      <label className="text-[11px] text-[var(--gcp-text-secondary)]">Region</label>
                      <select className="gcp-input w-full mt-1" value={form.filmstrip.region ?? "full"} onChange={e => setForm(f => ({ ...f, filmstrip: { ...f.filmstrip, region: e.target.value } }))}>
                        <option value="full">Full Page</option>
                        <option value="viewport">Viewport</option>
                        <option value="element">Element</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--gcp-grey)] pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium">Predicates ({form.predicates.length})</label>
                  <button onClick={() => {
                    const newPred = { id: `pred_${Date.now()}`, type: "statusCode" as const, field: "", expected: "200", operator: "equals" as const, description: "Assertion" };
                    setForm(f => ({ ...f, predicates: [...f.predicates, newPred] }));
                  }} className="text-[12px] text-[var(--gcp-blue)] hover:underline flex items-center gap-1"><Plus size={12} /> Add Predicate</button>
                </div>
                <div className="space-y-2">
                  {form.predicates.map((p, pi) => (
                    <div key={p.id} className="gcp-card p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[var(--gcp-text-secondary)]">#{pi + 1}</span>
                        <button onClick={() => setForm(f => ({ ...f, predicates: f.predicates.filter(x => x.id !== p.id) }))} className="text-[var(--gcp-red)] hover:bg-red-50 rounded p-0.5"><X size={12} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[var(--gcp-text-secondary)]">Type</label>
                          <select className="gcp-input w-full mt-0.5 text-[12px]" value={p.type} onChange={e => setForm(f => ({ ...f, predicates: f.predicates.map(x => x.id === p.id ? { ...x, type: e.target.value as typeof p.type } : x) }))}>
                            <option value="statusCode">Status Code</option>
                            <option value="headerEquals">Header Equals</option>
                            <option value="headerContains">Header Contains</option>
                            <option value="bodyContains">Body Contains</option>
                            <option value="bodyJsonPath">Body JSON Path</option>
                            <option value="responseTime">Response Time</option>
                            <option value="cookieEquals">Cookie Equals</option>
                            <option value="capturedHeader">Captured Header</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--gcp-text-secondary)]">Operator</label>
                          <select className="gcp-input w-full mt-0.5 text-[12px]" value={p.operator} onChange={e => setForm(f => ({ ...f, predicates: f.predicates.map(x => x.id === p.id ? { ...x, operator: e.target.value as typeof p.operator } : x) }))}>
                            <option value="equals">Equals</option>
                            <option value="notEquals">Not Equals</option>
                            <option value="contains">Contains</option>
                            <option value="notContains">Not Contains</option>
                            <option value="gt">Greater Than</option>
                            <option value="gte">Greater or Equal</option>
                            <option value="lt">Less Than</option>
                            <option value="lte">Less or Equal</option>
                            <option value="regex">Regex</option>
                            <option value="exists">Exists</option>
                            <option value="notExists">Not Exists</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[var(--gcp-text-secondary)]">Field</label>
                          <input className="gcp-input w-full mt-0.5 text-[12px] font-mono" value={p.field} onChange={e => setForm(f => ({ ...f, predicates: f.predicates.map(x => x.id === p.id ? { ...x, field: e.target.value } : x) }))} placeholder={p.type === "statusCode" ? "(auto)" : "e.g. X-Cache"} />
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--gcp-text-secondary)]">Expected Value</label>
                          <input className="gcp-input w-full mt-0.5 text-[12px] font-mono" value={p.expected} onChange={e => setForm(f => ({ ...f, predicates: f.predicates.map(x => x.id === p.id ? { ...x, expected: e.target.value } : x) }))} placeholder={p.type === "statusCode" ? "200" : "value"} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--gcp-text-secondary)]">Description</label>
                        <input className="gcp-input w-full mt-0.5 text-[12px]" value={p.description} onChange={e => setForm(f => ({ ...f, predicates: f.predicates.map(x => x.id === p.id ? { ...x, description: e.target.value } : x) }))} placeholder="Assertion description" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-[var(--gcp-surface)] border-t border-[var(--gcp-grey)] p-4 flex justify-end gap-2">
          <button onClick={onCancel} className="gcp-button text-sm px-4 py-2">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name} className="gcp-button gcp-button-primary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
            <Check size={14} /> {initial.name ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkActionsBar({ selected, onClear, onDelete, onAssignSuite, onExport, onStatusChange }: {
  selected: Set<string>; onClear: () => void; onDelete: () => void;
  onAssignSuite: () => void; onExport: (format: "json" | "csv" | "junit_xml") => void;
  onStatusChange: (s: TestStatus) => void;
}) {
  if (selected.size === 0) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--gcp-blue-bg)] border border-[var(--gcp-blue)] rounded-lg text-sm">
      <Check size={14} className="text-[var(--gcp-blue)]" />
      <span className="font-medium text-[var(--gcp-blue)]">{selected.size} selected</span>
      <div className="h-4 w-px bg-[var(--gcp-grey)] mx-1" />
      <button onClick={onDelete} className="px-2 py-1 text-[var(--gcp-red)] hover:bg-red-50 rounded text-[12px] font-medium"><Trash2 size={13} className="inline mr-1" />Delete</button>
      <button onClick={onAssignSuite} className="px-2 py-1 text-[var(--gcp-blue)] hover:bg-blue-50 rounded text-[12px] font-medium"><FolderTree size={13} className="inline mr-1" />Assign Suite</button>
      <span className="text-[11px] text-[var(--gcp-text-secondary)]">Status:</span>
      {STATUSES.map(s => (
        <button key={s} onClick={() => onStatusChange(s)} className="px-2 py-1 hover:bg-[var(--gcp-surface-hover)] rounded text-[12px] capitalize">{s}</button>
      ))}
      <div className="flex-1" />
      <button onClick={() => onExport("json")} className="px-2 py-1 text-[12px] hover:bg-[var(--gcp-surface-hover)] rounded"><FileJson size={13} className="inline mr-1" />JSON</button>
      <button onClick={() => onExport("csv")} className="px-2 py-1 text-[12px] hover:bg-[var(--gcp-surface-hover)] rounded"><FileSpreadsheet size={13} className="inline mr-1" />CSV</button>
      <button onClick={() => onExport("junit_xml")} className="px-2 py-1 text-[12px] hover:bg-[var(--gcp-surface-hover)] rounded"><FileCode size={13} className="inline mr-1" />JUnit</button>
      <button onClick={onClear} className="ml-2 p-1 text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)] rounded"><X size={14} /></button>
    </div>
  );
}

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const importCases = useImportTestCases();
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<{ imported: number; skipped: number; errors: { line: number; message: string }[] } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleImport = async () => {
    setLoading(true);
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) { showToast("Must be a JSON array"); setLoading(false); return; }
      const res = await importCases(data as TestCase[]);
      setResult(res);
      if (res.imported > 0) { showToast(`Imported ${res.imported} test cases`); onImported(); }
    } catch { showToast("Invalid JSON"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-[var(--gcp-surface)] rounded-xl shadow-2xl border border-[var(--gcp-grey)] p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2"><Upload size={18} /> Import Test Cases</h2>
          <button onClick={onClose} className="p-1 text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)] rounded"><X size={18} /></button>
        </div>
        <p className="text-sm text-[var(--gcp-text-secondary)]">Paste a JSON array of test case objects. Required: <code className="bg-[var(--gcp-grey-bg)] px-1 rounded">name</code>, <code className="bg-[var(--gcp-grey-bg)] px-1 rounded">category</code></p>
        <textarea className="gcp-input w-full min-h-[200px] font-mono text-[12px]" value={text} onChange={e => setText(e.target.value)} placeholder='[{"name":"...","category":"geo-match",...}]' />
        {result && (
          <div className="p-3 rounded-lg bg-[var(--gcp-grey-bg)] text-sm space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-[var(--gcp-green)] font-medium">✓ {result.imported} imported</span>
              {result.skipped > 0 && <span className="text-[var(--gcp-yellow)] font-medium">⏭ {result.skipped} skipped</span>}
            </div>
            {result.errors.length > 0 && <div className="text-[var(--gcp-red)] text-[12px]">{result.errors.length} errors</div>}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="gcp-button text-sm">Close</button>
          <button onClick={handleImport} disabled={loading || !text.trim()} className="gcp-button gcp-button-primary text-sm flex items-center gap-1.5">
            <Upload size={14} /> {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GenerateWizard({ onClose, onGenerated }: { onClose: () => void; onGenerated: () => void }) {
  const generate = useGenerateTestCases();
  const [params, setParams] = React.useState<GenerateParams>({
    count: 10, category: "geo-match", status: "active",
    priority: "P2", owner: "system@aware", prefix: "gen", suites: [],
  });
  const [loading, setLoading] = React.useState(false);
  const allSuites = useSyncTestSuites();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generate(params);
      showToast(`Generated ${result.length} test cases`);
      onGenerated();
      onClose();
    } catch (e) { showToast("Generation failed"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-[var(--gcp-surface)] rounded-xl shadow-2xl border border-[var(--gcp-grey)] p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles size={18} className="text-[var(--gcp-yellow)]" /> Bulk Generate</h2>
          <button onClick={onClose} className="p-1 text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)] rounded"><X size={18} /></button>
        </div>
        <p className="text-sm text-[var(--gcp-text-secondary)]">Generate multiple test cases from templates.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-[var(--gcp-text-secondary)]">Count</label>
            <input type="number" min={1} max={100} className="gcp-input w-full mt-1" value={params.count} onChange={e => setParams(p => ({ ...p, count: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="text-[11px] text-[var(--gcp-text-secondary)]">Category</label>
            <select className="gcp-input w-full mt-1" value={params.category} onChange={e => setParams(p => ({ ...p, category: e.target.value }))}>
              {["geo-match", "locale-split", "url-health", "security", "performance", "caching", "routing", "tls", "ddos"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-[var(--gcp-text-secondary)]">Priority</label>
            <select className="gcp-input w-full mt-1" value={params.priority} onChange={e => setParams(p => ({ ...p, priority: e.target.value as TestPriority }))}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-[var(--gcp-text-secondary)]">Status</label>
            <select className="gcp-input w-full mt-1" value={params.status} onChange={e => setParams(p => ({ ...p, status: e.target.value as TestStatus }))}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-[var(--gcp-text-secondary)]">Owner</label>
            <input className="gcp-input w-full mt-1" value={params.owner} onChange={e => setParams(p => ({ ...p, owner: e.target.value }))} />
          </div>
          <div>
            <label className="text-[11px] text-[var(--gcp-text-secondary)]">Name Prefix</label>
            <input className="gcp-input w-full mt-1" value={params.prefix} onChange={e => setParams(p => ({ ...p, prefix: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="text-[11px] text-[var(--gcp-text-secondary)]">Assign to Suites</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {allSuites.map(s => (
                <span key={s.id} onClick={() => setParams(p => ({ ...p, suites: p.suites.includes(s.id) ? p.suites.filter(x => x !== s.id) : [...p.suites, s.id] }))}
                  className={`px-2 py-1 rounded text-[11px] cursor-pointer border ${params.suites.includes(s.id) ? "bg-[var(--gcp-blue)] text-white border-[var(--gcp-blue)]" : "border-[var(--gcp-grey)] text-[var(--gcp-text-secondary)]"}`}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="gcp-button text-sm">Cancel</button>
          <button onClick={handleGenerate} disabled={loading} className="gcp-button gcp-button-primary text-sm flex items-center gap-1.5 disabled:opacity-50">
            <Sparkles size={14} /> {loading ? "Generating..." : `Generate ${params.count} Tests`}
          </button>
        </div>
      </div>
    </div>
  );
}

function isFilterActive(colFilters: Record<string, ColumnFilterState>, field: string, value: string) {
  const cur = colFilters[field];
  return cur?.selected.includes(value) ?? false;
}

function activeFilterClass(active: boolean) {
  return active ? "ring-2 ring-inset ring-[var(--gcp-blue)] bg-[var(--gcp-blue-bg)]" : "";
}

function StatsDashboard({ stats, colFilters, onToggleFilter }: {
  stats: TestStats | null;
  colFilters: Record<string, ColumnFilterState>;
  onToggleFilter: (field: string, value: string) => void;
}) {
  if (!stats) return null;

  const statusData = [["Status", "Count", { role: "style" }], ...Object.entries(stats.byStatus).map(([k, v]) => [k, v, k === "active" ? "#1e8e3e" : k === "disabled" ? "#f9ab00" : "#d93025"])];
  const priorityData = [["Priority", "Count", { role: "style" }], ...Object.entries(stats.byPriority).sort().map(([k, v]) => [k, v, k === "P0" ? "#d93025" : k === "P1" ? "#e8710a" : k === "P2" ? "#1a73e8" : "#5f6368"])];

  const statusNames: Record<string, string> = { active: "Active", disabled: "Disabled", deprecated: "Deprecated" };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
      <div className={`gcp-card p-3 text-center cursor-pointer transition-colors hover:bg-[var(--gcp-surface-hover)] ${activeFilterClass(Object.keys(colFilters).length === 0)}`}
        onClick={() => onToggleFilter("_clear", "")} title="Click to clear all filters">
        <div className="text-2xl font-bold text-[var(--gcp-blue)]">{stats.total}</div>
        <div className="text-[11px] text-[var(--gcp-text-secondary)]">Total Tests</div>
      </div>
      <div className={`gcp-card p-3 text-center cursor-pointer transition-colors hover:bg-[var(--gcp-surface-hover)] ${activeFilterClass(isFilterActive(colFilters, "automated", "true"))}`}
        onClick={() => onToggleFilter("automated", "true")}>
        <div className="text-2xl font-bold text-[var(--gcp-green)]">{stats.automated}</div>
        <div className="text-[11px] text-[var(--gcp-text-secondary)]">Automated</div>
      </div>
      <div className="gcp-card p-3 text-center">
        <div className="text-2xl font-bold text-[var(--gcp-text)]">{stats.coverage}%</div>
        <div className="text-[11px] text-[var(--gcp-text-secondary)]">Category Coverage</div>
      </div>
      <div className="gcp-card p-3 text-center">
        <div className="text-2xl font-bold text-[var(--gcp-purple-bg)]">{stats.avgVersion}</div>
        <div className="text-[11px] text-[var(--gcp-text-secondary)]">Avg Version</div>
      </div>
      <div className="col-span-2 gcp-card p-3" style={{ height: 180 }}>
        <div className="text-[11px] font-medium text-[var(--gcp-text-secondary)] mb-1">By Status</div>
        <Chart chartType="ColumnChart" data={statusData}
          options={{ backgroundColor: "transparent", legend: "none", chartArea: { width: "80%", height: "75%" }, bar: { groupWidth: "60%" } }}
          width="100%" height="140px"
          chartEvents={[{
            eventName: "select",
            callback: ({ chartWrapper }) => {
              if (!chartWrapper) return;
              const chart = chartWrapper.getChart();
              if (!chart) return;
              const sel = chart.getSelection();
              if (sel.length > 0 && sel[0].row !== undefined && sel[0].row >= 0) {
                const statusKey = (statusData[sel[0].row + 1]?.[0] as string) ?? "";
                if (statusKey) onToggleFilter("status", statusKey);
              }
            },
          }]}
        />
      </div>
      <div className="col-span-2 gcp-card p-3" style={{ height: 180 }}>
        <div className="text-[11px] font-medium text-[var(--gcp-text-secondary)] mb-1">By Priority</div>
        <Chart chartType="ColumnChart" data={priorityData}
          options={{ backgroundColor: "transparent", legend: "none", chartArea: { width: "80%", height: "75%" }, bar: { groupWidth: "60%" } }}
          width="100%" height="140px"
          chartEvents={[{
            eventName: "select",
            callback: ({ chartWrapper }) => {
              if (!chartWrapper) return;
              const chart = chartWrapper.getChart();
              if (!chart) return;
              const sel = chart.getSelection();
              if (sel.length > 0 && sel[0].row !== undefined && sel[0].row >= 0) {
                const priorityKey = (priorityData[sel[0].row + 1]?.[0] as string) ?? "";
                if (priorityKey) onToggleFilter("priority", priorityKey);
              }
            },
          }]}
        />
      </div>
      {/* Clickable status pills */}
      <div className="col-span-2 flex flex-wrap gap-1.5 items-center">
        {Object.entries(stats.byStatus).map(([k, v]) => {
          const active = isFilterActive(colFilters, "status", k);
          const color = k === "active" ? "#1e8e3e" : k === "disabled" ? "#f9ab00" : "#d93025";
          return (
            <button key={k} onClick={() => onToggleFilter("status", k)}
              className={`gcp-card px-3 py-2 text-center cursor-pointer transition-all hover:shadow-md ${active ? "ring-2 ring-inset" : ""}`}
              style={active ? { boxShadow: `inset 0 0 0 2px ${color}` } : {}}>
              <div className="text-lg font-bold" style={{ color }}>{v}</div>
              <div className="text-[10px] text-[var(--gcp-text-secondary)]">{statusNames[k] ?? k}</div>
            </button>
          );
        })}
      </div>
      <div className="col-span-2 flex flex-wrap gap-1.5 items-center">
        {Object.entries(stats.byPriority).sort().map(([k, v]) => {
          const active = isFilterActive(colFilters, "priority", k);
          const colors: Record<string, string> = { P0: "#d93025", P1: "#e8710a", P2: "#1a73e8", P3: "#5f6368" };
          const c = colors[k] ?? "#1a73e8";
          return (
            <button key={k} onClick={() => onToggleFilter("priority", k)}
              className={`gcp-card px-3 py-2 text-center cursor-pointer transition-all hover:shadow-md ${active ? "ring-2 ring-inset" : ""}`}
              style={active ? { boxShadow: `inset 0 0 0 2px ${c}` } : {}}>
              <div className="text-lg font-bold" style={{ color: c }}>{v}</div>
              <div className="text-[10px] text-[var(--gcp-text-secondary)]">P{k.replace("P", "")}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SidePanel({ testCase, onClose }: { testCase: TestCase; onClose: () => void }) {
  const { entries } = useTestChangelog(testCase.id);
  const updateDoc = useUpdateDocumentation();
  const [editingDoc, setEditingDoc] = React.useState(false);
  const [docText, setDocText] = React.useState(testCase.documentation);

  const handleSaveDoc = async () => {
    await updateDoc(testCase.id, docText, testCase.owner);
    showToast("Documentation updated");
    setEditingDoc(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--gcp-grey)] flex items-center justify-between shrink-0">
        <h3 className="font-medium text-sm flex items-center gap-2"><Beaker size={14} /> {testCase.id}</h3>
        <button onClick={onClose} className="p-1 text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)] rounded"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-1">{testCase.name}</h4>
          <p className="text-[12px] text-[var(--gcp-text-secondary)]">{testCase.description}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge s={testCase.status} />
          <PriorityBadge p={testCase.priority} />
          <span className="text-[11px] bg-[var(--gcp-grey-bg)] px-2 py-0.5 rounded">{testCase.category}</span>
          <span className="text-[11px] font-mono text-[var(--gcp-text-secondary)]">v{testCase.version}</span>
          {testCase.automated && <span className="text-[11px] gcp-badge-pass">Automated</span>}
        </div>
        <div className="flex flex-wrap gap-1">{testCase.tags.map(t => <TagBadge key={t} tag={t} />)}</div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-[var(--gcp-grey)]">
            <span className="text-[var(--gcp-text-secondary)]">Owner</span><span>{testCase.owner}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--gcp-grey)]">
            <span className="text-[var(--gcp-text-secondary)]">Script</span><span className="gcp-mono text-[12px]">{testCase.scriptPath}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--gcp-text-secondary)]">Updated</span><span className="text-[12px]">{new Date(testCase.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="border-t border-[var(--gcp-grey)] pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[12px] font-medium uppercase tracking-wider text-[var(--gcp-text-secondary)]">Documentation</h4>
            <button onClick={() => setEditingDoc(!editingDoc)} className="text-[11px] text-[var(--gcp-blue)] hover:underline">
              {editingDoc ? "Preview" : "Edit"}
            </button>
          </div>
          {editingDoc ? (
            <div className="space-y-2">
              <textarea className="gcp-input w-full min-h-[120px] font-mono text-[12px]" value={docText} onChange={e => setDocText(e.target.value)} />
              <button onClick={handleSaveDoc} className="gcp-button gcp-button-primary text-[12px] px-3 py-1">Save</button>
            </div>
          ) : (
            <div className="text-[12px] text-[var(--gcp-text-secondary)] whitespace-pre-wrap leading-relaxed">{testCase.documentation || "No documentation"}</div>
          )}
        </div>

        <div className="border-t border-[var(--gcp-grey)] pt-3">
          <h4 className="text-[12px] font-medium uppercase tracking-wider text-[var(--gcp-text-secondary)] mb-2">
            <Clock size={12} className="inline mr-1" /> Changelog (v{testCase.version})
          </h4>
          <div className="space-y-2">
            {entries.slice(0, 5).map(e => (
              <div key={e.version} className="flex gap-2 text-[12px]">
                <span className="font-mono text-[var(--gcp-blue)] shrink-0">v{e.version}</span>
                <div>
                  <p className="font-medium">{e.summary}</p>
                  <p className="text-[11px] text-[var(--gcp-text-secondary)]">{e.author} · {new Date(e.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--gcp-grey)] pt-3 space-y-2">
          <h4 className="text-[12px] font-medium uppercase tracking-wider text-[var(--gcp-text-secondary)]">HTTP / Predicates</h4>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-[var(--gcp-text-secondary)]">Expected:</span>
            <span className={`font-mono font-bold ${testCase.expectedStatus < 300 ? "text-[var(--gcp-green)]" : testCase.expectedStatus < 400 ? "text-[var(--gcp-yellow)]" : "text-[var(--gcp-red)]"}`}>{testCase.expectedStatus}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.keys(testCase.requestHeaders).length > 0 && <span className="gcp-badge gcp-badge-pass text-[10px]">{Object.keys(testCase.requestHeaders).length} headers</span>}
            {Object.keys(testCase.cookies).length > 0 && <span className="gcp-badge gcp-badge-pass text-[10px]">{Object.keys(testCase.cookies).length} cookies</span>}
            {testCase.captureResponseHeaders.length > 0 && <span className="gcp-badge gcp-badge-pass text-[10px]">Capture {testCase.captureResponseHeaders.length}</span>}
            {testCase.filmstrip.enabled && <span className="gcp-badge gcp-badge-flaky text-[10px]">Filmstrip {Math.round(testCase.filmstrip.threshold * 100)}%</span>}
            <span className="gcp-badge text-[10px]">{testCase.predicates.length} predicates</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={() => navTo(`TestAnalytics?testId=${testCase.id}`)} className="gcp-button text-[12px] flex-1 flex items-center justify-center gap-1"><BarChart3 size={13} /> Analytics</button>
          <button onClick={() => copyToClipboard(`https://aware.example.com/tests/${testCase.id}`)} className="gcp-button text-[12px] flex-1 flex items-center justify-center gap-1"><FileText size={13} /> Copy Link</button>
        </div>
      </div>
    </div>
  );
}

export function TestManager() {
  const testCases = useSyncTestCases();
  const deleteTestCase = useDeleteTestCase();
  const createTestCase = useCreateTestCase();
  const updateTestCase = useUpdateTestCase();
  const exportCases = useExportTestCases();
  const allSuites = useSyncTestSuites();
  const { stats, refetch: refreshStats } = useTestStats();

  const [searchText, setSearchText] = React.useState("");
  const [colFilters, setColFilters] = useSyncedUrlState<Record<string, ColumnFilterState>>("filters", {});
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);
  const [showGenerate, setShowGenerate] = React.useState(false);
  const [showSuiteAssign, setShowSuiteAssign] = React.useState(false);
  const [selectedPanelId, setSelectedPanelId] = React.useState<string | null>(null);

  const updateColFilter = (field: string) => (f: ColumnFilterState) => setColFilters(prev => ({ ...prev, [field]: f }));

  const handleStatFilter = (field: string, value: string) => {
    if (field === "_clear") {
      setColFilters({});
      return;
    }
    setColFilters(prev => {
      const cur = prev[field];
      const isActive = cur?.selected.includes(value);
      if (isActive) {
        const next: Record<string, ColumnFilterState> = { ...prev };
        if (next[field]) {
          next[field] = { text: "", selected: next[field].selected.filter(v => v !== value) };
        }
        return next;
      } else {
        return { ...prev, [field]: { text: "", selected: [value] } };
      }
    });
  };

  const filtered = applyFilters(testCases, colFilters, searchText);
  const categories = [...new Set(testCases.map(tc => tc.category))];
  const owners = [...new Set(testCases.map(tc => tc.owner))];
  const selectedTest = selectedPanelId ? testCases.find(t => t.id === selectedPanelId) ?? null : null;

  const handleSave = async (data: Omit<TestCase, "id" | "createdAt" | "updatedAt">) => {
    if (editingId) {
      await updateTestCase(editingId, data);
      showToast("Test case updated");
    } else {
      await createTestCase(data);
      showToast("Test case created");
    }
    setEditingId(null);
    setShowCreate(false);
    refreshStats();
  };

  const handleDelete = async (id: string) => {
    await deleteTestCase(id);
    showToast("Test case deleted");
    refreshStats();
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) await deleteTestCase(id);
    showToast(`Deleted ${selectedIds.size} test cases`);
    setSelectedIds(new Set());
    refreshStats();
  };

  const handleBulkStatus = async (status: TestStatus) => {
    for (const id of selectedIds) await updateTestCase(id, { status });
    showToast(`Updated ${selectedIds.size} test cases to ${status}`);
    setSelectedIds(new Set());
    refreshStats();
  };

  const handleBulkExport = async (format: "json" | "csv" | "junit_xml") => {
    const svc = getServices().testCases;
    const content = format === "json"
      ? JSON.stringify(testCases.filter(tc => selectedIds.has(tc.id)), null, 2)
      : format === "csv"
        ? await svc.exportCases("csv")
        : await svc.exportCases("junit_xml");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `test-cases.${format === "junit_xml" ? "xml" : format}`; a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${selectedIds.size} tests as ${format.toUpperCase()}`);
  };

  const handleFullExport = async (format: "json" | "csv" | "junit_xml") => {
    const content = await exportCases(format);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `all-test-cases.${format === "junit_xml" ? "xml" : format}`; a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported all tests as ${format.toUpperCase()}`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <AppLayout activeTab="tests">
      <div className="h-[calc(100vh-100px)] flex flex-col max-w-[1600px] mx-auto gap-3">

        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--gcp-purple-bg)] flex items-center justify-center">
              <Bug size={16} className="text-[#9334e6]" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Test Manager</h1>
              <p className="text-[12px] text-[var(--gcp-text-secondary)]">{testCases.length} total · {stats?.automated ?? 0} automated · {stats?.manual ?? 0} manual</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <button onClick={() => setShowImport(true)} className="gcp-button text-[12px] sm:text-sm flex items-center gap-1"><Upload size={13} /><span className="hidden sm:inline">Import</span></button>
            <button onClick={() => setShowGenerate(true)} className="gcp-button text-[12px] sm:text-sm flex items-center gap-1"><Sparkles size={13} /><span className="hidden sm:inline">Generate</span></button>
            <div className="relative group">
              <button className="gcp-button text-[12px] sm:text-sm flex items-center gap-1"><Download size={13} /><span className="hidden sm:inline">Export</span></button>
              <div className="absolute right-0 top-full mt-1 w-36 bg-[var(--gcp-surface)] border border-[var(--gcp-grey)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-20 overflow-hidden">
                <button onClick={() => handleFullExport("json")} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--gcp-surface-hover)] text-left"><FileJson size={14} /> JSON</button>
                <button onClick={() => handleFullExport("csv")} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--gcp-surface-hover)] text-left"><FileSpreadsheet size={14} /> CSV</button>
                <button onClick={() => handleFullExport("junit_xml")} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--gcp-surface-hover)] text-left"><FileCode size={14} /> JUnit XML</button>
              </div>
            </div>
            <button onClick={() => navTo("TestSuiteManager")} className="gcp-button text-[12px] sm:text-sm flex items-center gap-1"><FolderTree size={13} /><span className="hidden sm:inline">Suites</span></button>
            <button onClick={() => setShowCreate(true)} className="gcp-button gcp-button-primary text-[12px] sm:text-sm flex items-center gap-1"><Plus size={13} /><span className="hidden sm:inline">New Test</span></button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <StatsDashboard stats={stats} colFilters={colFilters} onToggleFilter={handleStatFilter} />

        {/* Filters */}
        <div className="gcp-card p-3 flex flex-wrap gap-2 items-center shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[160px]">
            <Search size={15} className="text-[var(--gcp-text-secondary)] shrink-0" />
            <input className="gcp-input flex-1 text-[13px]" placeholder="Search..." value={searchText} onChange={e => setSearchText(e.target.value)} />
          </div>
          <div className="hidden sm:block h-5 w-px bg-[var(--gcp-grey)]" />
          <select className="gcp-input text-[11px] sm:text-[12px]" value="" onChange={e => { if (e.target.value) setColFilters(prev => ({ ...prev, priority: { text: "", selected: [e.target.value] } })); }}>
            <option value="">Priority</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          <select className="gcp-input text-[11px] sm:text-[12px]" value="" onChange={e => { if (e.target.value) setColFilters(prev => ({ ...prev, status: { text: "", selected: [e.target.value] } })); }}>
            <option value="">Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="gcp-input text-[11px] sm:text-[12px]" value="" onChange={e => { if (e.target.value) setColFilters(prev => ({ ...prev, category: { text: "", selected: [e.target.value] } })); }}>
            <option value="">Category</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Bulk actions */}
        <BulkActionsBar
          selected={selectedIds} onClear={() => setSelectedIds(new Set())}
          onDelete={handleBulkDelete}
          onAssignSuite={() => setShowSuiteAssign(true)}
          onExport={handleBulkExport}
          onStatusChange={handleBulkStatus}
        />

        {/* Split: table + side panel */}
        <div className="flex flex-col-reverse md:flex-row gap-4 flex-1 overflow-hidden">
          <div className={`flex flex-col gcp-card overflow-hidden ${selectedTest ? "w-full md:flex-1" : "w-full"}`}>
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="gcp-table min-w-[700px] md:min-w-0">
                <thead className="sticky top-0 bg-[var(--gcp-surface)] z-10">
                  <tr>
                    <th className="w-8">
                      <input type="checkbox" className="cursor-pointer accent-[var(--gcp-blue)]"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={() => { if (selectedIds.size === filtered.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filtered.map(tc => tc.id))); }} />
                    </th>
                    <th>ID</th>
                    <th><ColumnFilter label="Name" filter={colFilters.name ?? EMPTY_FILTER} onFilterChange={updateColFilter("name")} /></th>
                    <th><ColumnFilter label="Category" allValues={categories} filter={colFilters.category ?? EMPTY_FILTER} onFilterChange={updateColFilter("category")} /></th>
                    <th><ColumnFilter label="Priority" allValues={PRIORITIES} filter={colFilters.priority ?? EMPTY_FILTER} onFilterChange={updateColFilter("priority")} /></th>
                    <th><ColumnFilter label="Severity" allValues={SEVERITIES} filter={colFilters.severity ?? EMPTY_FILTER} onFilterChange={updateColFilter("severity")} /></th>
                    <th><ColumnFilter label="Status" allValues={STATUSES} filter={colFilters.status ?? EMPTY_FILTER} onFilterChange={updateColFilter("status")} /></th>
                    <th>Tags</th>
                    <th><ColumnFilter label="Owner" allValues={owners} filter={colFilters.owner ?? EMPTY_FILTER} onFilterChange={updateColFilter("owner")} /></th>
                    <th className="text-center">v</th>
                    <th className="w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(tc => (
                    <tr key={tc.id} className={`group cursor-pointer ${selectedIds.has(tc.id) ? "bg-[var(--gcp-blue-bg)]" : ""} ${selectedPanelId === tc.id ? "ring-2 ring-inset ring-[var(--gcp-blue)]" : ""}`} onClick={() => setSelectedPanelId(selectedPanelId === tc.id ? null : tc.id)}>
                      <td onClick={e => e.stopPropagation()}><input type="checkbox" className="cursor-pointer accent-[var(--gcp-blue)]" checked={selectedIds.has(tc.id)} onChange={() => toggleSelect(tc.id)} /></td>
                      <td><span className="gcp-mono text-[11px] text-[var(--gcp-blue)]">{tc.id}</span></td>
                      <td>
                        <div className="text-[13px] font-medium leading-tight">{tc.name}</div>
                        <div className="text-[11px] text-[var(--gcp-text-secondary)] truncate max-w-[300px]">{tc.description}</div>
                      </td>
                      <td><span className="text-[12px] bg-[var(--gcp-grey-bg)] px-2 py-0.5 rounded">{tc.category}</span></td>
                      <td><PriorityBadge p={tc.priority} /></td>
                      <td className="text-[12px] capitalize">{tc.severity}</td>
                      <td><StatusBadge s={tc.status} /></td>
                      <td><div className="flex flex-wrap gap-1">{tc.tags.map(t => <TagBadge key={t} tag={t} />)}</div></td>
                      <td className="text-[12px] text-[var(--gcp-text-secondary)]">{tc.owner}</td>
                      <td className="text-center font-mono text-[11px] text-[var(--gcp-text-secondary)]">{tc.version}</td>
                      <td>
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setEditingId(tc.id)} className="p-1 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)] rounded" title="Edit"><Edit3 size={13} /></button>
                          <button onClick={() => { if (confirm("Delete this test case?")) handleDelete(tc.id); }} className="p-1 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-red)] rounded" title="Delete"><Trash2 size={13} /></button>
                          <button onClick={() => copyToClipboard(`https://aware.example.com/tests/${tc.id}`)} className="p-1 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)] rounded" title="Copy link"><ExternalLink size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-16 text-center text-[var(--gcp-text-secondary)]">
                  <Beaker size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No test cases match the current filters</p>
                  <button onClick={() => { setColFilters({}); setSearchText(""); }} className="gcp-button text-sm mt-3">Clear Filters</button>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-[var(--gcp-grey)] flex justify-between items-center text-sm text-[var(--gcp-text-secondary)] bg-[var(--gcp-surface-hover)]">
              <span>Showing {filtered.length} of {testCases.length} tests</span>
              <div className="flex gap-2">
                <button className="gcp-button text-[12px]" onClick={() => handleFullExport("json")}><FileJson size={13} className="inline mr-1" />Export JSON</button>
                <button className="gcp-button text-[12px]" onClick={() => handleFullExport("csv")}><FileSpreadsheet size={13} className="inline mr-1" />Export CSV</button>
              </div>
            </div>
          </div>

          {/* Side panel */}
          {selectedTest && (
            <div className="w-[35%] gcp-card overflow-hidden shrink-0 bg-[var(--gcp-surface)] border-l-2 border-[var(--gcp-blue)]">
              <SidePanel key={selectedTest.id} testCase={selectedTest} onClose={() => setSelectedPanelId(null)} />
            </div>
          )}
        </div>

        {/* Modals */}
        {showCreate && (
          <TestCaseForm initial={EMPTY_FORM} onSave={handleSave} onCancel={() => setShowCreate(false)} />
        )}
        {editingId && (() => {
          const tc = testCases.find(t => t.id === editingId);
          if (!tc) return null;
          const { id, createdAt, updatedAt, ...rest } = tc;
          return <TestCaseForm key={tc.id} initial={rest} onSave={handleSave} onCancel={() => setEditingId(null)} />;
        })()}
        {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={refreshStats} />}
        {showGenerate && <GenerateWizard onClose={() => setShowGenerate(false)} onGenerated={refreshStats} />}

        {showSuiteAssign && (() => {
          const selected = testCases.filter(tc => selectedIds.has(tc.id));
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSuiteAssign(false)}>
              <div className="relative w-full max-w-md bg-[var(--gcp-surface)] rounded-xl shadow-2xl border border-[var(--gcp-grey)] p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold">Assign to Suite</h3>
                <p className="text-sm text-[var(--gcp-text-secondary)]">{selected.length} tests selected</p>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {allSuites.map(s => (
                    <div key={s.id} onClick={async () => {
                      const svc = getServices().testSuites;
                      await svc.addTests(s.id, selected.map(t => t.id));
                      showToast(`Added ${selected.length} tests to "${s.name}"`);
                      setShowSuiteAssign(false);
                    }} className="px-3 py-2 rounded-lg hover:bg-[var(--gcp-surface-hover)] cursor-pointer text-sm flex items-center gap-2">
                      <FolderTree size={14} className="text-[var(--gcp-blue)]" />
                      {s.name}
                      <span className="text-[11px] text-[var(--gcp-text-secondary)] ml-auto">{s.testIds.length} tests</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowSuiteAssign(false)} className="gcp-button text-sm w-full">Cancel</button>
              </div>
            </div>
          );
        })()}

      </div>
    </AppLayout>
  );
}

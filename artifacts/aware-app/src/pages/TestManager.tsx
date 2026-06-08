import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { CiConfigBanner } from "@/components/aware/CiConfigBanner";
import { ColumnFilter, type ColumnFilterState } from "@/components/aware/ColumnFilter";
import { useSyncedUrlState } from "@/lib/urlState";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useTestData } from "@/hooks/useTestData";
import { EMPTY_FILTER, TagBadge, TestCaseStatusBadge, priorityColor } from "@/components/aware/TestCard";
import { StatsDashboard } from "@/components/aware/StatsDashboard";
import { TestManagerSidePanel } from "@/components/aware/TestManagerSidePanel";
import { RepoStatusBadge } from "@/components/aware/RepoStatusBadge";
import { CATEGORIES, PRIORITIES, STATUSES, OWNERS } from "@/lib/constants";
import {
  getTestCases, getTestSuites,
  computeTestStats,
} from "@/lib/data";
import { importAuto, exportAsXML, exportAndDownload, downloadFile } from "@/lib/testImportExport";
import type { TestCase, TestSuite, TestStats } from "@/lib/types";
import {
  Search, Check, Trash2, Tag,
  RotateCcw, Upload, Download, FileJson, FileSpreadsheet, FileCode,
  X, Beaker, BarChart3, Clock, FileText, FolderTree,
  RefreshCw, History,
} from "lucide-react";



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
          <button onClick={onClose} className="gcp-button">Close</button>
          <button onClick={handleImport} disabled={loading || !text.trim()} className="gcp-button gcp-button-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
  const [showImport, setShowImport] = React.useState(false);
  const [showChanges, setShowChanges] = React.useState(false);
  const [selectedPanelId, setSelectedPanelId] = useSyncedUrlState<string | null>("sel", null);
  const [configChanged, setConfigChanged] = React.useState(false);

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

  const allChanges = React.useMemo(() => {
    const entries = tcs.flatMap(tc =>
      tc.changelog.map(entry => ({ ...entry, testId: tc.id, testName: tc.name }))
    );
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return entries;
  }, [tcs]);

  const selectedPanel = selectedPanelId ? tcs.find(t => t.id === selectedPanelId) ?? null : null;

  const handleDelete = (ids: string[]) => {
    setSelectedIds(new Set());
    if (selectedPanelId && ids.includes(selectedPanelId)) setSelectedPanelId(null);
    markConfigChanged();
    toast(`Deleted ${ids.length} test case${ids.length > 1 ? "s" : ""}`);
  };

  const handleExport = (format: "json" | "csv" | "junit_xml") => {
    const all = getTestCases();
    if (format === "json") {
      exportAndDownload(all, "json");
    } else if (format === "junit_xml") {
      downloadFile(exportAsXML(all), "aware-tests.xml", "application/xml");
    } else {
      const csv = "id,name,category,priority,status,owner\n" + all.map(t => `${t.id},"${t.name}",${t.category},${t.priority},${t.status},${t.owner}`).join("\n");
      downloadFile(csv, "aware-tests.csv", "text/csv");
    }
    toast(`Exported as ${format.toUpperCase()}`);
  };

  const handleBulkStatusChange = (status: TestCase["status"]) => {
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
            <button onClick={() => setShowImport(true)} className="gcp-button gcp-button-sm"><Upload size={13} /> Import</button>
            <button onClick={() => handleExport("json")} className="gcp-button gcp-button-sm"><Download size={13} /> Export</button>
            <button onClick={() => setShowChanges(true)} className="gcp-button gcp-button-sm"><History size={13} /> Changes</button>
            <button onClick={() => { if (confirm("Reset all test data to defaults?")) { toast("Store reset"); } }} className="gcp-button gcp-button-sm"><RotateCcw size={13} /> Reset</button>
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
          onPriorityChange={(p: TestCase["priority"]) => { setSelectedIds(new Set()); toast(`Updated tests to ${p}`); }}
          onAddToSuite={suiteId => { setSelectedIds(new Set()); toast(`Added tests to suite`); }}
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
                    <th style={{ width: 100 }}>Repo</th>
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
                        <td><TestCaseStatusBadge s={tc.status} /></td>
                        <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: priorityColor(tc.priority) }}>{tc.priority}</span></td>
                        <td><span style={{ fontSize: 11, padding: "2px 8px", background: "var(--gcp-surface)", border: "1px solid var(--gcp-grey)", borderRadius: 4 }}>{tc.category}</span></td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                            {tc.tags.slice(0, 2).map(t => <TagBadge key={t} tagId={t} />)}
                            {tc.tags.length > 2 && <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>+{tc.tags.length - 2}</span>}
                          </div>
                        </td>
                        <td style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{tc.owner.split("@")[0]}</td>
                        <td style={{ padding: "6px 8px", fontSize: 11, whiteSpace: "nowrap", verticalAlign: "middle" }}>
                          <RepoStatusBadge status={tc.repoStatus} />
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>

                            <button onClick={() => { if (confirm(`Delete "${tc.name}"?`)) handleDelete([tc.id]); }} title="Delete" style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-red)" }}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--gcp-text-secondary)", fontSize: 13 }}>No test cases match your filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "8px 14px", borderTop: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--gcp-text-secondary)", flexShrink: 0 }}>
              <span>{filtered.length} of {tcs.length} test cases</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleExport("csv")} className="gcp-button gcp-button-xs" style={{ color: "var(--gcp-blue)", background: "none", border: "none" }}>Export CSV</button>
                <button onClick={() => handleExport("junit_xml")} className="gcp-button gcp-button-xs" style={{ color: "var(--gcp-blue)", background: "none", border: "none" }}>Export JUnit XML</button>
              </div>
            </div>
          </div>
          {selectedPanel && (
            <TestManagerSidePanel tc={selectedPanel} onClose={() => setSelectedPanelId(null)} toast={toast} navigate={navigate} />
          )}
        </div>
      </div>
      {showImport && <ImportModal onClose={() => setShowImport(false)} toast={toast} />}
      {showChanges && (
        <ChangesPanel
          changes={allChanges}
          testCount={tcs.length}
          suiteCount={suites.length}
          onExport={handleExport}
          onClose={() => setShowChanges(false)}
        />
      )}
    </AppLayout>
  );
}

function ChangesPanel({ changes, testCount, suiteCount, onExport, onClose }: {
  changes: { testId: string; testName: string; version: number; timestamp: string; author: string; summary: string; changes: string[] }[];
  testCount: number; suiteCount: number;
  onExport: (format: "json" | "csv" | "junit_xml") => void;
  onClose: () => void;
}) {
  const authors = [...new Set(changes.map(c => c.author))].length;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div className="gcp-card" style={{ width: 640, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Changes & Export</h2>
            <p style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>
              {testCount} tests · {suiteCount} suites · {changes.length} changes · {authors} contributors
            </p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "var(--gcp-text-secondary)" }}>×</button>
        </div>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--gcp-grey)", display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => onExport("json")} className="gcp-button gcp-button-xs"><FileJson size={12} /> JSON</button>
          <button onClick={() => onExport("csv")} className="gcp-button gcp-button-xs"><FileSpreadsheet size={12} /> CSV</button>
          <button onClick={() => onExport("junit_xml")} className="gcp-button gcp-button-xs"><FileCode size={12} /> JUnit XML</button>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)", alignSelf: "center" }}>Download full test registry</span>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "8px 18px" }}>
          {changes.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: "var(--gcp-text-secondary)" }}>No changes recorded yet</div>
          ) : (
            changes.slice(0, 100).map((entry, i) => (
              <div key={`${entry.testId}-${entry.version}`} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < Math.min(changes.length, 100) - 1 ? "1px solid var(--gcp-grey)" : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gcp-blue-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--gcp-blue)", fontSize: 11, fontWeight: 700 }}>
                  {entry.author[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{entry.summary}</span>
                    <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>{new Date(entry.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gcp-blue)" }}>{entry.testId}</span>
                    {' · '}{entry.testName}
                    {' · by '}{entry.author}
                  </div>
                  {entry.changes.length > 0 && (
                    <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {entry.changes.map((c, j) => (
                        <span key={j} style={{ background: "var(--gcp-grey-bg)", padding: "1px 6px", borderRadius: 3 }}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

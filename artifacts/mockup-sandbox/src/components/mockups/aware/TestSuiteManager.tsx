import React from "react";
import { Chart } from "react-google-charts";
import { AppLayout } from "./_shared/AppLayout";
import { useSyncTestSuites, useSyncTestCases } from "./_shared/hooks";
import type { TestSuite, TestCase, TestSuiteConfig } from "./_shared/types";
import { getServices } from "./_shared/services";
import { navTo, showToast, copyToClipboard } from "./_shared/nav";
import { useSyncedUrlState } from "./_shared/urlState";
import "./_group.css";
import {
  FolderTree, Plus, X, Edit3, Trash2, Check, PlayCircle,
  ChevronDown, ChevronRight, FileJson, Settings, Tag,
  Beaker, Clock, GitCompare, ExternalLink, AlertTriangle,
  Copy, Download, Workflow, BarChart3,
} from "lucide-react";

function SuiteTreeItem({
  suite, depth, allSuites, testCases, onSelect, selectedId, onDelete, onAddTest,
}: {
  suite: TestSuite; depth: number; allSuites: TestSuite[]; testCases: TestCase[];
  onSelect: (s: TestSuite) => void; selectedId: string | null; onDelete: (id: string) => void;
  onAddTest: (suiteId: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const children = allSuites.filter(s => s.parentId === suite.id);
  const suiteTests = testCases.filter(tc => suite.testIds.includes(tc.id));
  const passCount = suiteTests.filter(t => t.status === "active").length;
  const failCount = suiteTests.filter(t => t.status === "disabled" || t.status === "deprecated").length;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer rounded-lg transition-colors group ${selectedId === suite.id ? "bg-[var(--gcp-blue-bg)] ring-1 ring-[var(--gcp-blue)]" : "hover:bg-[var(--gcp-surface-hover)]"}`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => onSelect(suite)}
      >
        {children.length > 0 ? (
          <span onClick={e => { e.stopPropagation(); setExpanded(!expanded); }} className="p-0.5 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)]">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : <span className="w-[18px]" />}
        <FolderTree size={15} className="text-[var(--gcp-blue)] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate">{suite.name}</div>
          <div className="text-[11px] text-[var(--gcp-text-secondary)] flex items-center gap-2">
            <span>{suite.testIds.length} tests</span>
            {suite.schedule && <span><Clock size={10} className="inline mr-0.5" />{suite.schedule}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={() => onAddTest(suite.id)} className="p-1 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)] rounded" title="Add tests"><Plus size={13} /></button>
          <button onClick={() => onDelete(suite.id)} className="p-1 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-red)] rounded" title="Delete suite"><Trash2 size={13} /></button>
        </div>
      </div>
      {expanded && children.map(child => (
        <SuiteTreeItem key={child.id} suite={child} depth={depth + 1} allSuites={allSuites} testCases={testCases} onSelect={onSelect} selectedId={selectedId} onDelete={onDelete} onAddTest={onAddTest} />
      ))}
    </div>
  );
}

function generateGitHubActionsYaml(suite: TestSuite): string {
  const suiteName = suite.name.toLowerCase().replace(/\s+/g, "_");
  return `name: ${suite.name}
on:
  workflow_dispatch:
  schedule:
    - cron: '${suite.schedule || "0 0 * * 0"}'
jobs:
  ${suiteName}:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        target: [${suite.config.target}]
        environment: [${suite.config.environment}]
      max-parallel: ${suite.config.parallelism}
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm --filter @workspace/mockup-sandbox run test -- --suite "${suite.id}"
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-\${{ github.run_id }}
          path: artifacts/mockup-sandbox/test-results/
`;
}

function SuiteEditor({ suite, onSave, onCancel }: {
  suite?: TestSuite | null;
  onSave: (data: Omit<TestSuite, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<Omit<TestSuite, "id" | "createdAt" | "updatedAt">>({
    name: suite?.name ?? "",
    description: suite?.description ?? "",
    parentId: suite?.parentId ?? null,
    testIds: suite?.testIds ?? [],
    config: suite?.config ?? { target: "Prod", environment: "Production", parallelism: 4, retries: 1, failFast: false, timeoutMinutes: 30 },
    tags: suite?.tags ?? [],
    schedule: suite?.schedule ?? null,
  });
  const allSuites = useSyncTestSuites();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-[var(--gcp-surface)] rounded-xl shadow-2xl border border-[var(--gcp-grey)] p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{suite ? "Edit Suite" : "New Suite"}</h2>
          <button onClick={onCancel} className="p-1 text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)] rounded"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[11px] uppercase text-[var(--gcp-text-secondary)]">Name</label>
            <input className="gcp-input w-full mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Suite name" />
          </div>
          <div className="col-span-2">
            <label className="text-[11px] uppercase text-[var(--gcp-text-secondary)]">Description</label>
            <textarea className="gcp-input w-full mt-1 min-h-[50px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="text-[11px] uppercase text-[var(--gcp-text-secondary)]">Parent Suite</label>
            <select className="gcp-input w-full mt-1" value={form.parentId ?? ""} onChange={e => setForm(f => ({ ...f, parentId: e.target.value || null }))}>
              <option value="">None (root)</option>
              {allSuites.filter(s => s.id !== suite?.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase text-[var(--gcp-text-secondary)]">Schedule (cron)</label>
            <input className="gcp-input w-full mt-1" value={form.schedule ?? ""} onChange={e => setForm(f => ({ ...f, schedule: e.target.value || null }))} placeholder="0 6 * * 1-5" />
          </div>
          <div className="col-span-2">
            <label className="text-[11px] uppercase text-[var(--gcp-text-secondary)] mb-1 block">Config</label>
            <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--gcp-grey-bg)] rounded-lg">
              <div>
                <label className="text-[10px] text-[var(--gcp-text-secondary)]">Target</label>
                <select className="gcp-input w-full mt-0.5 text-[12px]" value={form.config.target} onChange={e => setForm(f => ({ ...f, config: { ...f.config, target: e.target.value } }))}>
                  <option>Prod</option><option>UAT</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[var(--gcp-text-secondary)]">Env</label>
                <select className="gcp-input w-full mt-0.5 text-[12px]" value={form.config.environment} onChange={e => setForm(f => ({ ...f, config: { ...f.config, environment: e.target.value } }))}>
                  <option>Production</option><option>Staging</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[var(--gcp-text-secondary)]">Parallelism</label>
                <input type="number" className="gcp-input w-full mt-0.5 text-[12px]" value={form.config.parallelism} onChange={e => setForm(f => ({ ...f, config: { ...f.config, parallelism: Number(e.target.value) } }))} />
              </div>
              <div>
                <label className="text-[10px] text-[var(--gcp-text-secondary)]">Retries</label>
                <input type="number" className="gcp-input w-full mt-0.5 text-[12px]" value={form.config.retries} onChange={e => setForm(f => ({ ...f, config: { ...f.config, retries: Number(e.target.value) } }))} />
              </div>
              <div>
                <label className="text-[10px] text-[var(--gcp-text-secondary)]">Timeout (min)</label>
                <input type="number" className="gcp-input w-full mt-0.5 text-[12px]" value={form.config.timeoutMinutes} onChange={e => setForm(f => ({ ...f, config: { ...f.config, timeoutMinutes: Number(e.target.value) } }))} />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={form.config.failFast} onChange={e => setForm(f => ({ ...f, config: { ...f.config, failFast: e.target.checked } }))} className="accent-[var(--gcp-blue)]" />
                  <span className="text-[11px]">Fail fast</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--gcp-grey)]">
          <button onClick={onCancel} className="gcp-button text-sm px-4 py-2">Cancel</button>
          <button onClick={() => onSave(form)} className="gcp-button gcp-button-primary text-sm px-4 py-2 flex items-center gap-1.5">
            <Check size={14} /> {suite ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTestsModal({ suiteId, onClose }: { suiteId: string; onClose: () => void }) {
  const allTestCases = useSyncTestCases();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const handleAdd = async () => {
    const svc = getServices().testSuites;
    await svc.addTests(suiteId, [...selected]);
    showToast(`Added ${selected.size} tests`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-xl max-h-[70vh] overflow-auto bg-[var(--gcp-surface)] rounded-xl shadow-2xl border border-[var(--gcp-grey)] p-6 space-y-3" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold">Add Tests to Suite</h3>
        <div className="space-y-1">
          {allTestCases.filter(tc => tc.status === "active").map(tc => (
            <div key={tc.id} onClick={() => setSelected(prev => { const n = new Set(prev); if (n.has(tc.id)) n.delete(tc.id); else n.add(tc.id); return n; })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm ${selected.has(tc.id) ? "bg-[var(--gcp-blue-bg)]" : "hover:bg-[var(--gcp-surface-hover)]"}`}>
              <input type="checkbox" checked={selected.has(tc.id)} readOnly className="accent-[var(--gcp-blue)]" />
              <span className="flex-1">{tc.name}</span>
              <span className="text-[11px] text-[var(--gcp-text-secondary)]">{tc.category} · {tc.priority}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="gcp-button text-sm">Cancel</button>
          <button onClick={handleAdd} disabled={selected.size === 0} className="gcp-button gcp-button-primary text-sm disabled:opacity-50">Add Selected</button>
        </div>
      </div>
    </div>
  );
}

export function TestSuiteManager() {
  const allSuites = useSyncTestSuites();
  const allTestCases = useSyncTestCases();
  const createSuite = getServices().testSuites.create;
  const deleteSuite = getServices().testSuites.delete;

  const [selectedSuiteId, setSelectedSuiteId] = React.useState<string | null>(null);
  const [showEditor, setShowEditor] = React.useState(false);
  const [editingSuite, setEditingSuite] = React.useState<string | null>(null);
  const [showAddTests, setShowAddTests] = React.useState<string | null>(null);
  const [showYaml, setShowYaml] = React.useState(false);

  const selected = selectedSuiteId ? allSuites.find(s => s.id === selectedSuiteId) ?? null : null;
  const selectedTests = selected ? allTestCases.filter(tc => selected.testIds.includes(tc.id)) : [];

  const handleCreate = async (data: Omit<TestSuite, "id" | "createdAt" | "updatedAt">) => {
    const svc = getServices().testSuites;
    await svc.create(data);
    showToast("Suite created");
    setShowEditor(false);
  };

  const handleUpdate = async (data: Omit<TestSuite, "id" | "createdAt" | "updatedAt">) => {
    if (!editingSuite) return;
    const svc = getServices().testSuites;
    await svc.update(editingSuite, data);
    showToast("Suite updated");
    setEditingSuite(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this suite?")) return;
    const svc = getServices().testSuites;
    await svc.delete(id);
    if (selectedSuiteId === id) setSelectedSuiteId(null);
    showToast("Suite deleted");
  };

  const handleRemoveTest = async (testId: string) => {
    if (!selected) return;
    const svc = getServices().testSuites;
    await svc.removeTests(selected.id, [testId]);
    showToast("Test removed from suite");
  };

  const catCounts: Record<string, number> = {};
  selectedTests.forEach(tc => { catCounts[tc.category] = (catCounts[tc.category] || 0) + 1; });
  const statusCounts = { active: selectedTests.filter(t => t.status === "active").length, disabled: selectedTests.filter(t => t.status !== "active").length };
  const priorityCounts: Record<string, number> = {};
  selectedTests.forEach(tc => { priorityCounts[tc.priority] = (priorityCounts[tc.priority] || 0) + 1; });

  const categoryChart = [["Category", "Count"], ...Object.entries(catCounts).sort((a, b) => b[1] - a[1])];
  const priorityChart = [["Priority", "Count", { role: "style" }], ...Object.entries(priorityCounts).sort().map(([k, v]) => [k, v, k === "P0" ? "#d93025" : k === "P1" ? "#e8710a" : k === "P2" ? "#1a73e8" : "#5f6368"])];

  return (
    <AppLayout activeTab="tests">
      <div className="h-[calc(100vh-100px)] flex max-w-[1600px] mx-auto gap-4">

        {/* Tree panel */}
        <div className="w-[320px] shrink-0 gcp-card overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[var(--gcp-grey)] flex items-center justify-between shrink-0">
            <h2 className="font-bold text-sm flex items-center gap-2"><FolderTree size={15} /> Suites</h2>
            <button onClick={() => setShowEditor(true)} className="gcp-button gcp-button-primary text-[12px] px-2.5 py-1"><Plus size={12} className="inline mr-1" />New</button>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-0.5">
            {allSuites.filter(s => s.parentId === null).map(suite => (
              <SuiteTreeItem key={suite.id} suite={suite} depth={0} allSuites={allSuites} testCases={allTestCases}
                onSelect={(s) => setSelectedSuiteId(s.id)} selectedId={selectedSuiteId}
                onDelete={handleDelete} onAddTest={(id) => setShowAddTests(id)} />
            ))}
            {allSuites.length === 0 && (
              <div className="py-8 text-center text-sm text-[var(--gcp-text-secondary)]">No suites yet</div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 gcp-card overflow-hidden flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-[var(--gcp-grey)] flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-bold text-base">{selected.name}</h2>
                  <p className="text-[12px] text-[var(--gcp-text-secondary)]">{selected.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowYaml(!showYaml)} className="gcp-button text-[12px] flex items-center gap-1"><Workflow size={13} /> Generate YAML</button>
                  <button onClick={() => { setEditingSuite(selected.id); }} className="gcp-button text-[12px] flex items-center gap-1"><Edit3 size={13} /> Edit</button>
                  <button onClick={() => navTo(`StartRun?suite=${selected.id}`)} className="gcp-button gcp-button-primary text-[12px] flex items-center gap-1"><PlayCircle size={13} /> Run</button>
                </div>
              </div>

              {/* YAML preview */}
              {showYaml && (
                <div className="border-b border-[var(--gcp-grey)] bg-[#1e1e1e] text-[#c9d1d9] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#8b949e]">GitHub Actions Workflow</span>
                    <button onClick={() => { copyToClipboard(generateGitHubActionsYaml(selected)); showToast("YAML copied"); }} className="flex items-center gap-1 text-[12px] text-[var(--gcp-blue)] hover:underline"><Copy size={12} /> Copy</button>
                  </div>
                  <pre className="text-[11px] font-mono leading-relaxed overflow-auto max-h-[200px] whitespace-pre-wrap">{generateGitHubActionsYaml(selected)}</pre>
                </div>
              )}

              <div className="flex-1 overflow-auto p-4">
                {/* Stats cards */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="gcp-card p-3 text-center">
                    <div className="text-2xl font-bold text-[var(--gcp-blue)]">{selected.testIds.length}</div>
                    <div className="text-[11px] text-[var(--gcp-text-secondary)]">Tests</div>
                  </div>
                  <div className="gcp-card p-3 text-center">
                    <div className="text-2xl font-bold text-[var(--gcp-green)]">{statusCounts.active}</div>
                    <div className="text-[11px] text-[var(--gcp-text-secondary)]">Active</div>
                  </div>
                  <div className="gcp-card p-3 text-center">
                    <div className="text-2xl font-bold text-[var(--gcp-text)]">{selected.config.parallelism}x</div>
                    <div className="text-[11px] text-[var(--gcp-text-secondary)]">Parallelism</div>
                  </div>
                  <div className="gcp-card p-3 text-center">
                    <div className="text-2xl font-bold text-[var(--gcp-text)]">{selected.config.retries}</div>
                    <div className="text-[11px] text-[var(--gcp-text-secondary)]">Retries</div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {categoryChart.length > 1 && (
                    <div className="gcp-card p-3" style={{ height: 160 }}>
                      <div className="text-[11px] font-medium text-[var(--gcp-text-secondary)] mb-1">Category Distribution</div>
                      <Chart chartType="PieChart" data={categoryChart} options={{ backgroundColor: "transparent", legend: { position: "right", textStyle: { fontSize: 10 } }, chartArea: { width: "60%", height: "80%" }, pieSliceText: "none" }} width="100%" height="120px" />
                    </div>
                  )}
                  {priorityChart.length > 1 && (
                    <div className="gcp-card p-3" style={{ height: 160 }}>
                      <div className="text-[11px] font-medium text-[var(--gcp-text-secondary)] mb-1">Priority Breakdown</div>
                      <Chart chartType="ColumnChart" data={priorityChart} options={{ backgroundColor: "transparent", legend: "none", chartArea: { width: "80%", height: "75%" }, bar: { groupWidth: "60%" }}} width="100%" height="120px" />
                    </div>
                  )}
                </div>

                {/* Config details */}
                <div className="gcp-card p-3 mb-4">
                  <h4 className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium mb-2 flex items-center gap-1"><Settings size={12} /> Configuration</h4>
                  <div className="grid grid-cols-5 gap-3 text-sm">
                    <div><span className="text-[11px] text-[var(--gcp-text-secondary)]">Target</span><div className="font-medium">{selected.config.target}</div></div>
                    <div><span className="text-[11px] text-[var(--gcp-text-secondary)]">Env</span><div className="font-medium">{selected.config.environment}</div></div>
                    <div><span className="text-[11px] text-[var(--gcp-text-secondary)]">Timeout</span><div className="font-medium">{selected.config.timeoutMinutes}m</div></div>
                    <div><span className="text-[11px] text-[var(--gcp-text-secondary)]">Fail Fast</span><div className="font-medium">{selected.config.failFast ? "Yes" : "No"}</div></div>
                    <div><span className="text-[11px] text-[var(--gcp-text-secondary)]">Schedule</span><div className="font-mono text-[12px]">{selected.schedule ?? "Manual"}</div></div>
                  </div>
                </div>

                {/* Test list */}
                <h4 className="text-[11px] uppercase tracking-wider text-[var(--gcp-text-secondary)] font-medium mb-2 flex items-center gap-1">
                  <Beaker size={12} /> Tests ({selectedTests.length})
                </h4>
                <div className="space-y-1">
                  {selectedTests.map(tc => (
                    <div key={tc.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--gcp-surface-hover)] group text-sm">
                      <span className={`w-2 h-2 rounded-full ${tc.status === "active" ? "bg-[var(--gcp-green)]" : tc.status === "disabled" ? "bg-[var(--gcp-yellow)]" : "bg-[var(--gcp-red)]"}`} />
                      <span className="gcp-mono text-[11px] text-[var(--gcp-blue)]">{tc.id}</span>
                      <span className="flex-1 truncate">{tc.name}</span>
                      <span className="text-[11px] text-[var(--gcp-text-secondary)]">{tc.category}</span>
                      <span className="text-[11px] text-[var(--gcp-text-secondary)]">{tc.priority}</span>
                      <button onClick={() => handleRemoveTest(tc.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-red)] transition-opacity"><X size={12} /></button>
                    </div>
                  ))}
                  {selectedTests.length === 0 && (
                    <div className="py-6 text-center text-sm text-[var(--gcp-text-secondary)]">
                      No tests in this suite
                      <button onClick={() => setShowAddTests(selected.id)} className="block mx-auto mt-2 gcp-button text-[12px]">Add Tests</button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--gcp-text-secondary)]">
              <div className="text-center">
                <FolderTree size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a suite to view details</p>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showEditor && <SuiteEditor onSave={handleCreate} onCancel={() => setShowEditor(false)} />}
        {editingSuite && (
          <SuiteEditor suite={allSuites.find(s => s.id === editingSuite) ?? null}
            onSave={handleUpdate} onCancel={() => setEditingSuite(null)} />
        )}
        {showAddTests && <AddTestsModal suiteId={showAddTests} onClose={() => setShowAddTests(null)} />}

      </div>
    </AppLayout>
  );
}

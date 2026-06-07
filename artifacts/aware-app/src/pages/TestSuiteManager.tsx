import React from "react";
import { useLocation } from "wouter";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  getTestCases, getTestSuites,
  createTestSuite, updateTestSuite, deleteTestSuite,
  addTestsToSuite, removeTestsFromSuite,
  subscribeToTestCases, subscribeToTestSuites,
} from "@/lib/data";
import type { TestSuite, TestCase } from "@/lib/types";
import {
  FolderTree, Plus, X, Edit3, Trash2, Check, PlayCircle,
  ChevronDown, ChevronRight, Settings,
  Beaker, Clock, GitCompare, Copy, Workflow,
} from "lucide-react";

const CATEGORY_COLORS = ["#1a73e8", "#e8710a", "#1e8e3e", "#d93025", "#9334e6", "#f9ab00", "#185abc", "#c5221f", "#5f6368"];

function useTestData() {
  const [tcs, setTcs] = React.useState<TestCase[]>(() => getTestCases());
  const [suites, setSuites] = React.useState<TestSuite[]>(() => getTestSuites());
  React.useEffect(() => {
    const u1 = subscribeToTestCases(() => setTcs(getTestCases()));
    const u2 = subscribeToTestSuites(() => setSuites(getTestSuites()));
    return () => { u1(); u2(); };
  }, []);
  return { tcs, suites };
}

function useToast() {
  const [msg, setMsg] = React.useState<string | null>(null);
  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };
  const Toast = msg ? (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 18px", borderRadius: 10, zIndex: 9999,
      background: "var(--gcp-text)", color: "var(--gcp-surface)",
      fontSize: 13, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    }}>
      <Check size={13} style={{ color: "var(--gcp-green)" }} /> {msg}
    </div>
  ) : null;
  return { show, Toast };
}

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

  return (
    <div>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 12px", cursor: "pointer", borderRadius: 8,
          paddingLeft: `${12 + depth * 20}px`,
          background: selectedId === suite.id ? "var(--gcp-blue-bg)" : "transparent",
          boxShadow: selectedId === suite.id ? "inset 0 0 0 1px var(--gcp-blue)" : "none",
          transition: "background 0.15s",
        }}
        onClick={() => onSelect(suite)}
      >
        {children.length > 0 ? (
          <span
            onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{ padding: 2, color: "var(--gcp-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : <span style={{ width: 18 }} />}
        <FolderTree size={15} style={{ color: "var(--gcp-blue)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{suite.name}</div>
          <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            <span>{suite.testIds.length} tests</span>
            {suite.schedule && <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Clock size={10} />{suite.schedule}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onAddTest(suite.id)} style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", borderRadius: 4 }} title="Add tests"><Plus size={13} /></button>
          <button onClick={() => onDelete(suite.id)} style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", borderRadius: 4 }} title="Delete suite"><Trash2 size={13} /></button>
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

function SuiteEditor({ suite, allSuites, onSave, onCancel }: {
  suite?: TestSuite | null;
  allSuites: TestSuite[];
  onSave: (data: Omit<TestSuite, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<Omit<TestSuite, "id" | "createdAt" | "updatedAt">>({
    name: suite?.name ?? "",
    description: suite?.description ?? "",
    parentId: suite?.parentId ?? null,
    testIds: suite?.testIds ?? [],
    config: suite?.config ?? { target: "Prod", environment: "Production", parallelism: 4, retries: 1, failFast: false, timeoutMinutes: 30, integration: { slackChannel: "", notifyOn: ["fail"], githubCommentPr: false, githubDeploymentStatus: false, requireApproval: false, approvers: [] } },
    tags: suite?.tags ?? [],
    schedule: suite?.schedule ?? null,
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onCancel}>
      <div style={{ position: "relative", width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto", background: "var(--gcp-surface)", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "1px solid var(--gcp-grey)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{suite ? "Edit Suite" : "New Suite"}</h2>
          <button onClick={onCancel} style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", borderRadius: 4 }}><X size={18} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 11, textTransform: "uppercase", color: "var(--gcp-text-secondary)", fontWeight: 500 }}>Name</label>
            <input className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Suite name" />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 11, textTransform: "uppercase", color: "var(--gcp-text-secondary)", fontWeight: 500 }}>Description</label>
            <textarea className="gcp-input" style={{ width: "100%", marginTop: 4, minHeight: 50 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", color: "var(--gcp-text-secondary)", fontWeight: 500 }}>Parent Suite</label>
            <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.parentId ?? ""} onChange={e => setForm(f => ({ ...f, parentId: e.target.value || null }))}>
              <option value="">None (root)</option>
              {allSuites.filter(s => s.id !== suite?.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", color: "var(--gcp-text-secondary)", fontWeight: 500 }}>Schedule (cron)</label>
            <input className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.schedule ?? ""} onChange={e => setForm(f => ({ ...f, schedule: e.target.value || null }))} placeholder="0 6 * * 1-5" />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 11, textTransform: "uppercase", color: "var(--gcp-text-secondary)", fontWeight: 500, marginBottom: 4, display: "block" }}>Config</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: 12, background: "var(--gcp-grey-bg)", borderRadius: 8 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Target</label>
                <select className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.target} onChange={e => setForm(f => ({ ...f, config: { ...f.config, target: e.target.value } }))}>
                  <option>Prod</option><option>UAT</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Env</label>
                <select className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.environment} onChange={e => setForm(f => ({ ...f, config: { ...f.config, environment: e.target.value } }))}>
                  <option>Production</option><option>Staging</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Parallelism</label>
                <input type="number" className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.parallelism} onChange={e => setForm(f => ({ ...f, config: { ...f.config, parallelism: Number(e.target.value) } }))} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Retries</label>
                <input type="number" className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.retries} onChange={e => setForm(f => ({ ...f, config: { ...f.config, retries: Number(e.target.value) } }))} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Timeout (min)</label>
                <input type="number" className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.timeoutMinutes} onChange={e => setForm(f => ({ ...f, config: { ...f.config, timeoutMinutes: Number(e.target.value) } }))} />
              </div>
              <div style={{ display: "flex", alignItems: "center", paddingTop: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.config.failFast} onChange={e => setForm(f => ({ ...f, config: { ...f.config, failFast: e.target.checked } }))} style={{ accentColor: "var(--gcp-blue)" }} />
                  <span style={{ fontSize: 11 }}>Fail fast</span>
                </label>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 11, textTransform: "uppercase", color: "var(--gcp-text-secondary)", fontWeight: 500, marginBottom: 4, display: "block" }}>Integrations</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 12, background: "var(--gcp-grey-bg)", borderRadius: 8 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Slack Channel</label>
                <input className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.integration?.slackChannel ?? ""} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, slackChannel: e.target.value } } }))} placeholder="#alerts" />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Slack Webhook URL</label>
                <input className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.integration?.slackWebhookUrl ?? ""} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, slackWebhookUrl: e.target.value } } }))} placeholder="https://hooks.slack.com/…" />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Webhook URL</label>
                <input className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.integration?.webhookUrl ?? ""} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, webhookUrl: e.target.value } } }))} placeholder="https://hooks.example.com/notify" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.config.integration?.githubCommentPr ?? false} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, githubCommentPr: e.target.checked } } }))} style={{ accentColor: "var(--gcp-blue)" }} />
                  <span style={{ fontSize: 11 }}>Post PR comments</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.config.integration?.githubDeploymentStatus ?? false} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, githubDeploymentStatus: e.target.checked } } }))} style={{ accentColor: "var(--gcp-blue)" }} />
                  <span style={{ fontSize: 11 }}>Update deployment status</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.config.integration?.requireApproval ?? false} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, requireApproval: e.target.checked } } }))} style={{ accentColor: "var(--gcp-blue)" }} />
                  <span style={{ fontSize: 11 }}>Require approval</span>
                </label>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Approvers (comma-separated)</label>
                <input className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={(form.config.integration?.approvers ?? []).join(", ")} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, approvers: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } } }))} placeholder="email@co.com, email2@co.com" />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Notify On</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {(["pass", "fail", "deploy", "approval"] as const).map(n => (
                    <span key={n} onClick={() => {
                      const current = form.config.integration?.notifyOn ?? [];
                      const next = current.includes(n) ? current.filter(x => x !== n) : [...current, n];
                      setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, notifyOn: next } } }));
                    }} style={{
                      padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer", border: "1px solid",
                      background: (form.config.integration?.notifyOn ?? []).includes(n) ? "var(--gcp-blue)" : "transparent",
                      color: (form.config.integration?.notifyOn ?? []).includes(n) ? "white" : "var(--gcp-text-secondary)",
                      borderColor: (form.config.integration?.notifyOn ?? []).includes(n) ? "var(--gcp-blue)" : "var(--gcp-grey)",
                    }}>{n}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid var(--gcp-grey)" }}>
          <button onClick={onCancel} className="gcp-button" style={{ fontSize: 13, padding: "8px 16px" }}>Cancel</button>
          <button onClick={() => onSave(form)} className="gcp-button gcp-button-primary" style={{ fontSize: 13, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
            <Check size={14} /> {suite ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTestsModal({ suiteId, allTestCases, onClose, onAdd }: {
  suiteId: string; allTestCases: TestCase[]; onClose: () => void; onAdd: (suiteId: string, testIds: string[]) => void;
}) {
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
          <button onClick={onClose} className="gcp-button" style={{ fontSize: 13 }}>Cancel</button>
          <button onClick={() => onAdd(suiteId, [...selected])} disabled={selected.size === 0}
            className="gcp-button gcp-button-primary" style={{ fontSize: 13, opacity: selected.size === 0 ? 0.5 : 1 }}>Add Selected</button>
        </div>
      </div>
    </div>
  );
}

export default function TestSuiteManager() {
  const { tcs, suites } = useTestData();
  const [, navigate] = useLocation();
  const { show, Toast } = useToast();

  const [selectedSuiteId, setSelectedSuiteId] = React.useState<string | null>(null);
  const [showEditor, setShowEditor] = React.useState(false);
  const [editingSuite, setEditingSuite] = React.useState<string | null>(null);
  const [showAddTests, setShowAddTests] = React.useState<string | null>(null);
  const [showYaml, setShowYaml] = React.useState(false);

  const selected = selectedSuiteId ? suites.find(s => s.id === selectedSuiteId) ?? null : null;
  const selectedTests = selected ? tcs.filter(tc => selected.testIds.includes(tc.id)) : [];

  const handleCreate = (data: Omit<TestSuite, "id" | "createdAt" | "updatedAt">) => {
    createTestSuite(data);
    show("Suite created");
    setShowEditor(false);
  };

  const handleUpdate = (data: Omit<TestSuite, "id" | "createdAt" | "updatedAt">) => {
    if (!editingSuite) return;
    updateTestSuite(editingSuite, data);
    show("Suite updated");
    setEditingSuite(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this suite?")) return;
    deleteTestSuite(id);
    if (selectedSuiteId === id) setSelectedSuiteId(null);
    show("Suite deleted");
  };

  const handleRemoveTest = (testId: string) => {
    if (!selected) return;
    removeTestsFromSuite(selected.id, [testId]);
    show("Test removed from suite");
  };

  const handleAddTests = (suiteId: string, testIds: string[]) => {
    addTestsToSuite(suiteId, testIds);
    show(`Added ${testIds.length} tests`);
    setShowAddTests(null);
  };

  const catCounts: Record<string, number> = {};
  selectedTests.forEach(tc => { catCounts[tc.category] = (catCounts[tc.category] || 0) + 1; });
  const statusCounts = { active: selectedTests.filter(t => t.status === "active").length, disabled: selectedTests.filter(t => t.status !== "active").length };
  const priorityCounts: Record<string, number> = {};
  selectedTests.forEach(tc => { priorityCounts[tc.priority] = (priorityCounts[tc.priority] || 0) + 1; });

  const categoryChart = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({
    name: k, value: v, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
  const priorityChart = Object.entries(priorityCounts).sort().map(([k, v]) => ({
    name: k, value: v,
    color: k === "P0" ? "#d93025" : k === "P1" ? "#e8710a" : k === "P2" ? "#1a73e8" : "#5f6368",
  }));

  return (
    <AppLayout activeHref="/tests">
      <div style={{ height: "calc(100vh - 100px)", display: "flex", maxWidth: 1600, margin: "0 auto", gap: 16 }}>

        {/* Tree panel */}
        <div className="gcp-card" style={{ width: 320, flexShrink: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 12, borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <h2 style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><FolderTree size={15} /> Suites</h2>
            <button onClick={() => setShowEditor(true)} className="gcp-button gcp-button-primary" style={{ fontSize: 12, padding: "4px 10px" }}><Plus size={12} style={{ display: "inline", marginRight: 4 }} />New</button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
            {suites.filter(s => s.parentId === null).map(suite => (
              <SuiteTreeItem key={suite.id} suite={suite} depth={0} allSuites={suites} testCases={tcs}
                onSelect={(s) => setSelectedSuiteId(s.id)} selectedId={selectedSuiteId}
                onDelete={handleDelete} onAddTest={(id) => setShowAddTests(id)} />
            ))}
            {suites.length === 0 && (
              <div style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: "var(--gcp-text-secondary)" }}>No suites yet</div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="gcp-card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {selected ? (
            <>
              <div style={{ padding: 16, borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</h2>
                  <p style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>{selected.description}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => setShowYaml(!showYaml)} className="gcp-button" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Workflow size={13} /> Generate YAML</button>
                  <button onClick={() => { setEditingSuite(selected.id); }} className="gcp-button" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Edit3 size={13} /> Edit</button>
                  <button onClick={() => navigate(`/start?suite=${selected.id}`)} className="gcp-button gcp-button-primary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><PlayCircle size={13} /> Run</button>
                </div>
              </div>

              {/* YAML preview */}
              {showYaml && (
                <div style={{ borderBottom: "1px solid var(--gcp-grey)", background: "#1e1e1e", color: "#c9d1d9", padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "#8b949e" }}>GitHub Actions Workflow</span>
                    <button onClick={() => { navigator.clipboard.writeText(generateGitHubActionsYaml(selected)); show("YAML copied"); }} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--gcp-blue)", background: "none", border: "none", cursor: "pointer" }}><Copy size={12} /> Copy</button>
                  </div>
                  <pre style={{ fontSize: 11, fontFamily: "var(--font-mono)", lineHeight: 1.6, overflow: "auto", maxHeight: 200, whiteSpace: "pre-wrap" }}>{generateGitHubActionsYaml(selected)}</pre>
                </div>
              )}

              <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                {/* Stats cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                  <div className="gcp-card" style={{ padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--gcp-blue)" }}>{selected.testIds.length}</div>
                    <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Tests</div>
                  </div>
                  <div className="gcp-card" style={{ padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--gcp-green)" }}>{statusCounts.active}</div>
                    <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Active</div>
                  </div>
                  <div className="gcp-card" style={{ padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--gcp-text)" }}>{selected.config.parallelism}x</div>
                    <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Parallelism</div>
                  </div>
                  <div className="gcp-card" style={{ padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--gcp-text)" }}>{selected.config.retries}</div>
                    <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Retries</div>
                  </div>
                </div>

                {/* Charts */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {categoryChart.length > 0 && (
                    <div className="gcp-card" style={{ padding: 12, height: 180 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gcp-text-secondary)", marginBottom: 4 }}>Category Distribution</div>
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie data={categoryChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {categoryChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {priorityChart.length > 0 && (
                    <div className="gcp-card" style={{ padding: 12, height: 180 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gcp-text-secondary)", marginBottom: 4 }}>Priority Breakdown</div>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={priorityChart}>
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                          <Bar dataKey="value" barSize={40}>
                            {priorityChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Config details */}
                <div className="gcp-card" style={{ padding: 12, marginBottom: 16 }}>
                  <h4 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--gcp-text-secondary)", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><Settings size={12} /> Configuration</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, fontSize: 13 }}>
                    <div><span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Target</span><div style={{ fontWeight: 500 }}>{selected.config.target}</div></div>
                    <div><span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Env</span><div style={{ fontWeight: 500 }}>{selected.config.environment}</div></div>
                    <div><span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Timeout</span><div style={{ fontWeight: 500 }}>{selected.config.timeoutMinutes}m</div></div>
                    <div><span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Fail Fast</span><div style={{ fontWeight: 500 }}>{selected.config.failFast ? "Yes" : "No"}</div></div>
                    <div><span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Schedule</span><div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{selected.schedule ?? "Manual"}</div></div>
                  </div>
                  {selected.config.integration && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--gcp-grey)" }}>
                      <h5 style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--gcp-text-secondary)", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><GitCompare size={10} /> Integrations</h5>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                        <div>
                          <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)", display: "block" }}>Slack</span>
                          <span style={{ color: selected.config.integration.slackChannel ? "var(--gcp-green)" : "var(--gcp-text-secondary)" }}>{selected.config.integration.slackChannel || "Not configured"}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)", display: "block" }}>GitHub</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            {selected.config.integration.githubCommentPr && <span className="gcp-badge gcp-badge-pass" style={{ fontSize: 10 }}>PR Comments</span>}
                            {selected.config.integration.githubDeploymentStatus && <span className="gcp-badge gcp-badge-pass" style={{ fontSize: 10 }}>Deploy Status</span>}
                            {!selected.config.integration.githubCommentPr && !selected.config.integration.githubDeploymentStatus && <span style={{ color: "var(--gcp-text-secondary)" }}>Not configured</span>}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)", display: "block" }}>Approval</span>
                          <span>{selected.config.integration.requireApproval ? `Required (${selected.config.integration.approvers.length})` : "Not required"}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {selected.config.integration.notifyOn.map(n => <span key={n} className="gcp-badge gcp-badge-flaky" style={{ fontSize: 10, textTransform: "capitalize" }}>{n}</span>)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Test list */}
                <h4 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--gcp-text-secondary)", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <Beaker size={12} /> Tests ({selectedTests.length})
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {selectedTests.map(tc => (
                    <div key={tc.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, fontSize: 13 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: tc.status === "active" ? "var(--gcp-green)" : tc.status === "disabled" ? "var(--gcp-yellow)" : "var(--gcp-red)" }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-blue)" }}>{tc.id}</span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tc.name}</span>
                      <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{tc.category}</span>
                      <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{tc.priority}</span>
                      <button onClick={() => handleRemoveTest(tc.id)} style={{ padding: 2, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", borderRadius: 4, opacity: 0 }} title="Remove"
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0"}
                      ><X size={12} /></button>
                    </div>
                  ))}
                  {selectedTests.length === 0 && (
                    <div style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "var(--gcp-text-secondary)" }}>
                      No tests in this suite
                      <button onClick={() => setShowAddTests(selected.id)} className="gcp-button" style={{ display: "block", margin: "8px auto 0", fontSize: 12 }}>Add Tests</button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gcp-text-secondary)" }}>
              <div style={{ textAlign: "center" }}>
                <FolderTree size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>Select a suite to view details</p>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showEditor && <SuiteEditor allSuites={suites} onSave={handleCreate} onCancel={() => setShowEditor(false)} />}
        {editingSuite && (
          <SuiteEditor suite={suites.find(s => s.id === editingSuite) ?? null}
            allSuites={suites} onSave={handleUpdate} onCancel={() => setEditingSuite(null)} />
        )}
        {showAddTests && <AddTestsModal suiteId={showAddTests} allTestCases={tcs} onClose={() => setShowAddTests(null)} onAdd={handleAddTests} />}

        {Toast}
      </div>
    </AppLayout>
  );
}

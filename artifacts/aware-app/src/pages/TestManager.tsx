import React from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { getTestCases, getTestSuites, TEST_TAGS, createTestCase, updateTestCase, deleteTestCase, resetTestStore } from "@/lib/data";
import type { TestCase } from "@/lib/types";
import {
  Plus, Search, Filter, Check, Edit2, Trash2, FlaskConical,
  RotateCcw, Tag, User, AlertTriangle, ChevronDown, X, Save,
} from "lucide-react";

function useToast() {
  const [msg, setMsg] = React.useState<string | null>(null);
  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };
  const Toast = msg ? <div className="gcp-toast"><Check size={13} style={{ color: "var(--gcp-green)" }} /> {msg}</div> : null;
  return { show, Toast };
}

const CATEGORIES = ["geo-match", "locale-split", "url-health", "security", "performance", "caching", "routing", "tls", "ddos"];
const PRIORITIES: TestCase["priority"][] = ["P0", "P1", "P2", "P3"];
const OWNERS = ["alice@co.com", "bob@co.com", "carol@co.com", "dave@co.com", "eve@co.com"];

function priorityColor(p: string) {
  return p === "P0" ? "var(--gcp-red)" : p === "P1" ? "var(--gcp-orange)" : p === "P2" ? "var(--gcp-yellow)" : "var(--gcp-text-secondary)";
}

function CreateEditModal({ tc, onSave, onClose }: {
  tc?: TestCase; onSave: (data: Partial<TestCase>) => void; onClose: () => void;
}) {
  const [form, setForm] = React.useState({
    name: tc?.name ?? "",
    description: tc?.description ?? "",
    category: tc?.category ?? "geo-match",
    priority: tc?.priority ?? "P2" as TestCase["priority"],
    owner: tc?.owner ?? "alice@co.com",
    status: tc?.status ?? "active" as TestCase["status"],
    preconditions: tc?.preconditions ?? "",
    expectedBehavior: tc?.expectedBehavior ?? "",
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--gcp-surface)", borderRadius: 6, width: "min(560px, 92vw)", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>{tc ? "Edit Test Case" : "New Test Case"}</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "var(--gcp-text-secondary)", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Test Name *</label>
            <input className="gcp-input" style={{ width: "100%" }} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Verify Geo match for /api/v1/…" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Description</label>
            <textarea className="gcp-input" style={{ width: "100%", height: 64, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Category</label>
              <select className="gcp-input" style={{ width: "100%" }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Priority</label>
              <select className="gcp-input" style={{ width: "100%" }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TestCase["priority"] }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Status</label>
              <select className="gcp-input" style={{ width: "100%" }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TestCase["status"] }))}>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Owner</label>
            <select className="gcp-input" style={{ width: "100%" }} value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}>
              {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Preconditions</label>
            <textarea className="gcp-input" style={{ width: "100%", height: 56, resize: "vertical", fontFamily: "var(--font-sans)", fontSize: 12 }} value={form.preconditions} onChange={e => setForm(f => ({ ...f, preconditions: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Expected Behavior</label>
            <textarea className="gcp-input" style={{ width: "100%", height: 56, resize: "vertical", fontFamily: "var(--font-sans)", fontSize: 12 }} value={form.expectedBehavior} onChange={e => setForm(f => ({ ...f, expectedBehavior: e.target.value }))} />
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderTop: "1px solid var(--gcp-grey)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} className="gcp-button" style={{ fontSize: 13 }}>Cancel</button>
          <button onClick={() => { if (!form.name.trim()) return; onSave(form); }} className="gcp-button-primary" style={{ fontSize: 13 }}>
            <Save size={13} /> {tc ? "Save Changes" : "Create Test Case"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TestManager() {
  const { show, Toast } = useToast();
  const [cases, setCases] = React.useState(getTestCases());
  const [suites] = React.useState(getTestSuites());
  const [search, setSearch] = React.useState("");
  const [catFilter, setCatFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [activeTab, setActiveTab] = React.useState<"cases" | "suites">("cases");
  const [editingTc, setEditingTc] = React.useState<TestCase | undefined>(undefined);
  const [creatingNew, setCreatingNew] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);

  const refresh = () => setCases(getTestCases());

  const categories = [...new Set(getTestCases().map(t => t.category))];

  const filtered = cases.filter(tc => {
    if (catFilter !== "all" && tc.category !== catFilter) return false;
    if (statusFilter !== "all" && tc.status !== statusFilter) return false;
    if (priorityFilter !== "all" && tc.priority !== priorityFilter) return false;
    if (search && !tc.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = (data: Partial<TestCase>) => {
    createTestCase(data);
    refresh();
    setCreatingNew(false);
    show("Test case created and saved to localStorage");
  };

  const handleEdit = (data: Partial<TestCase>) => {
    if (editingTc) {
      updateTestCase(editingTc.id, data);
      refresh();
      setEditingTc(undefined);
      show("Test case updated");
    }
  };

  const handleDelete = (id: string) => {
    deleteTestCase(id);
    refresh();
    setDeleteConfirm(null);
    show("Test case deleted");
  };

  const handleReset = () => {
    resetTestStore();
    setCases(getTestCases());
    show("Test store reset to defaults");
  };

  const activeCases = cases.filter(tc => tc.status === "active").length;

  return (
    <AppLayout activeHref="/tests">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--gcp-text)" }}>Test Manager</h1>
            <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", marginTop: 3 }}>
              {activeCases} active tests · {suites.length} suites · Persisted in localStorage
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleReset} className="gcp-button" style={{ fontSize: 12 }}>
              <RotateCcw size={13} /> Reset to Defaults
            </button>
            <button onClick={() => setCreatingNew(true)} className="gcp-button-primary" style={{ fontSize: 13 }}>
              <Plus size={14} /> New Test Case
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Active", value: cases.filter(t => t.status === "active").length, color: "var(--gcp-green)" },
            { label: "P0 Critical", value: cases.filter(t => t.priority === "P0").length, color: "var(--gcp-red)" },
            { label: "Disabled", value: cases.filter(t => t.status === "disabled").length, color: "var(--gcp-yellow)" },
            { label: "Suites", value: suites.length, color: "var(--gcp-blue)" },
          ].map(s => (
            <div key={s.label} className="gcp-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--gcp-grey)", gap: 0 }}>
          {[
            { id: "cases" as const, label: `Test Cases (${cases.length})` },
            { id: "suites" as const, label: `Suites (${suites.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "8px 18px", border: "none", background: "transparent", cursor: "pointer",
              fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400,
              color: activeTab === t.id ? "var(--gcp-blue)" : "var(--gcp-text-secondary)",
              borderBottom: activeTab === t.id ? "2px solid var(--gcp-blue)" : "2px solid transparent",
              marginBottom: -2, transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {activeTab === "cases" && (
          <>
            {/* Filters */}
            <div className="gcp-card" style={{ padding: "10px 14px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 160 }}>
                <Search size={13} style={{ color: "var(--gcp-text-secondary)" }} />
                <input className="gcp-input" placeholder="Search test names…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
              </div>
              <select className="gcp-input" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="all">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="gcp-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="deprecated">Deprecated</option>
              </select>
              <select className="gcp-input" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="all">All priorities</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{filtered.length} of {cases.length}</span>
            </div>

            {/* Table */}
            <div className="gcp-card" style={{ overflow: "hidden" }}>
              <table className="gcp-table">
                <thead><tr>
                  <th>Test Name</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Script</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(tc => (
                    <tr key={tc.id} style={{ opacity: tc.status === "deprecated" ? 0.5 : 1 }}>
                      <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 500, fontSize: 12 }}>{tc.name}</div>
                        <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", marginTop: 2 }}>v{tc.version} · updated {new Date(tc.updatedAt).toLocaleDateString()}</div>
                      </td>
                      <td><span style={{ fontSize: 11, background: "var(--gcp-grey-bg)", padding: "2px 7px", borderRadius: 4, border: "1px solid var(--gcp-grey)" }}>{tc.category}</span></td>
                      <td><span style={{ fontSize: 12, fontWeight: 700, color: priorityColor(tc.priority) }}>{tc.priority}</span></td>
                      <td>
                        <span className={`gcp-badge ${tc.status === "active" ? "gcp-badge-pass" : tc.status === "disabled" ? "gcp-badge-flaky" : "gcp-badge-skip"}`}>
                          {tc.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{tc.owner.split("@")[0]}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gcp-text-secondary)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tc.scriptPath}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button onClick={() => setEditingTc(tc)} style={{ padding: "4px 8px", border: "1px solid var(--gcp-grey)", borderRadius: 4, background: "var(--gcp-surface)", cursor: "pointer", color: "var(--gcp-blue)", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                            <Edit2 size={11} /> Edit
                          </button>
                          {deleteConfirm === tc.id ? (
                            <div style={{ display: "flex", gap: 3 }}>
                              <button onClick={() => handleDelete(tc.id)} style={{ padding: "4px 8px", border: "none", borderRadius: 4, background: "var(--gcp-red)", color: "white", cursor: "pointer", fontSize: 11 }}>Confirm</button>
                              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "4px 8px", border: "1px solid var(--gcp-grey)", borderRadius: 4, background: "transparent", cursor: "pointer", fontSize: 11 }}>Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(tc.id)} style={{ padding: "4px 8px", border: "1px solid var(--gcp-grey)", borderRadius: 4, background: "var(--gcp-surface)", cursor: "pointer", color: "var(--gcp-red)", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "28px", color: "var(--gcp-text-secondary)", fontSize: 13 }}>No test cases match</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "suites" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {suites.map(suite => (
              <div key={suite.id} className="gcp-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gcp-text)" }}>{suite.name}</div>
                    <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)", marginTop: 2 }}>{suite.id}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gcp-blue)", background: "var(--gcp-blue-bg)", padding: "2px 8px", borderRadius: 12 }}>
                    {suite.testIds.length} tests
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--gcp-text-secondary)", lineHeight: 1.5, marginBottom: 10 }}>{suite.description}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, color: "var(--gcp-text-secondary)" }}>
                  <div>Target: <strong style={{ color: "var(--gcp-text)" }}>{suite.config.target}</strong></div>
                  <div>Parallelism: <strong style={{ color: "var(--gcp-text)", fontFamily: "var(--font-mono)" }}>{suite.config.parallelism}</strong></div>
                  <div>Retries: <strong style={{ color: "var(--gcp-text)", fontFamily: "var(--font-mono)" }}>{suite.config.retries}</strong></div>
                  <div>Timeout: <strong style={{ color: "var(--gcp-text)", fontFamily: "var(--font-mono)" }}>{suite.config.timeoutMinutes}m</strong></div>
                </div>
                {suite.schedule && (
                  <div style={{ marginTop: 8, fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)", background: "var(--gcp-grey-bg)", padding: "4px 8px", borderRadius: 4 }}>
                    ⏱ {suite.schedule}
                  </div>
                )}
                <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                  {suite.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 10, background: "var(--gcp-blue-bg)", color: "var(--gcp-blue)", padding: "2px 8px", borderRadius: 12, fontWeight: 500 }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href={`/start?suite=${suite.id}`}>
                  <a className="gcp-button" style={{ fontSize: 11, marginTop: 12, justifyContent: "center", width: "100%" }}>
                    Run This Suite →
                  </a>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {(creatingNew || editingTc) && (
        <CreateEditModal
          tc={editingTc}
          onSave={editingTc ? handleEdit : handleCreate}
          onClose={() => { setCreatingNew(false); setEditingTc(undefined); }}
        />
      )}
      {Toast}
    </AppLayout>
  );
}

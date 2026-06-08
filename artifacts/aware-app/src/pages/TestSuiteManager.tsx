import React from "react";
import { useLocation } from "wouter";
import { GoogleBarChart, GooglePieChart } from "@/components/aware/GoogleCharts";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  createTestSuite, updateTestSuite, deleteTestSuite,
  addTestsToSuite, removeTestsFromSuite,
} from "@/lib/data";
import type { TestSuite } from "@/lib/types";

import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useTestData } from "@/hooks/useTestData";
import { SuiteTreeItem } from "@/components/aware/SuiteTreeItem";
import { SuiteEditor } from "@/components/aware/SuiteEditor";
import { AddTestsModal } from "@/components/aware/AddTestsModal";
import { YamlPreview, generateGitHubActionsYaml } from "@/components/aware/YamlPreview";
import {
  FolderTree, Plus, X, Edit3, Trash2, PlayCircle,
  Settings, Beaker, GitCompare, Workflow,
} from "lucide-react";

export default function TestSuiteManager() {
  const { tcs, suites } = useTestData();
  const [, navigate] = useLocation();
  const { show, Toast } = useSimpleToast();

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

  const priorityChart = Object.entries(priorityCounts).sort().map(([k, v]) => ({
    priority: k, count: v,
    color: k === "P0" ? "#d93025" : k === "P1" ? "#e8710a" : k === "P2" ? "#1a73e8" : "#5f6368",
  }));

  return (
    <AppLayout activeHref="/suites">
      <div style={{ height: "calc(100vh - 100px)", display: "flex", maxWidth: 1600, margin: "0 auto", gap: 16 }}>
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

              {showYaml && <YamlPreview yaml={generateGitHubActionsYaml(selected)} />}

              <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {Object.keys(catCounts).length > 0 && (
                    <div className="gcp-card" style={{ padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gcp-text-secondary)", marginBottom: 4 }}>Category Distribution</div>
                      <GooglePieChart title="" data={catCounts} height="150px" />
                    </div>
                  )}
                  {priorityChart.length > 0 && (
                    <div className="gcp-card" style={{ padding: 12, height: 180 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gcp-text-secondary)", marginBottom: 4 }}>Priority Breakdown</div>
                      <GoogleBarChart
                        title=""
                        columns={["Priority", "Count"]}
                        data={priorityChart}
                        xKey="priority"
                        yKeys={["count"]}
                        colors={["#1a73e8"]}
                        height="140px"
                        showTimeFrame={false}
                      />
                    </div>
                  )}
                </div>

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

                <h4 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--gcp-text-secondary)", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <Beaker size={12} /> Tests ({selectedTests.length})
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {selectedTests.map(tc => (
                    <div key={tc.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, fontSize: 13 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: tc.status === "active" ? "var(--gcp-green)" : tc.status === "disabled" ? "var(--gcp-yellow)" : "var(--gcp-red)" }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-blue)", cursor: "pointer", textDecoration: "underline", textDecorationColor: "transparent", transition: "text-decoration-color 0.15s" }}
                        onClick={() => navigate(`/tests?sel=${tc.id}`)}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecorationColor = "var(--gcp-blue)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecorationColor = "transparent"}
                      >{tc.id}</span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tc.name}</span>
                      <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{tc.category}</span>
                      <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{tc.priority}</span>
                      <button onClick={() => handleRemoveTest(tc.id)} style={{ padding: 2, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", borderRadius: 4, opacity: 0 }}
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

        {showEditor && <SuiteEditor allSuites={suites} onSave={handleCreate} onClose={() => setShowEditor(false)} />}
        {editingSuite && (
          <SuiteEditor suite={suites.find(s => s.id === editingSuite) ?? null}
            allSuites={suites} onSave={handleUpdate} onClose={() => setEditingSuite(null)} />
        )}
        {showAddTests && <AddTestsModal suiteId={showAddTests} allTestCases={tcs} onClose={() => setShowAddTests(null)} onAdd={handleAddTests} />}

        {Toast}
      </div>
    </AppLayout>
  );
}

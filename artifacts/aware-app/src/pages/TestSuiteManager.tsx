import React from "react";
import { useLocation } from "wouter";
import { GoogleBarChart, GooglePieChart } from "@/components/aware/GoogleCharts";
import { AppLayout } from "@/components/aware/AppLayout";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useTestData } from "@/hooks/useTestData";
import { SuiteTreeItem } from "@/components/aware/SuiteTreeItem";
import {
  FolderTree, PlayCircle,
  Settings, Beaker, GitCompare,
  Bug, Code, Search,
} from "lucide-react";


export default function TestSuiteManager() {
  const { tcs, suites } = useTestData();
  const [, navigate] = useLocation();
  const { Toast } = useSimpleToast();

  const [selectedSuiteId, setSelectedSuiteId] = React.useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = React.useState<string | null>(null);
  const [suiteSearch, setSuiteSearch] = React.useState("");
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set(suites.map(s => s.id)));

  const selected = selectedSuiteId ? suites.find(s => s.id === selectedSuiteId) ?? null : null;
  const selectedTest = selectedTestId ? tcs.find(tc => tc.id === selectedTestId) ?? null : null;
  const selectedTests = selected ? tcs.filter(tc => selected.testIds.includes(tc.id)) : [];

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
            </div>
            <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--gcp-grey)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "4px 8px", background: "var(--gcp-grey-bg)" }}>
                <Search size={12} style={{ color: "var(--gcp-text-secondary)", flexShrink: 0 }} />
                <input value={suiteSearch} onChange={e => setSuiteSearch(e.target.value)} placeholder="Filter suites..." style={{ border: "none", outline: "none", fontSize: 11, background: "transparent", flex: 1, minWidth: 0, color: "var(--gcp-text)" }} />
                {suiteSearch && <button onClick={() => setSuiteSearch("")} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", fontSize: 13, padding: 0 }}>×</button>}
              </div>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
              {suites.filter(s => s.parentId === null).map(suite => (
                <SuiteTreeItem key={suite.id} suite={suite} depth={0} allSuites={suites} testCases={tcs} filter={suiteSearch}
                  expandedIds={expandedIds} onToggle={(id) => setExpandedIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                  onSelect={(s) => { setSelectedSuiteId(s.id); setSelectedTestId(null); }} selectedId={selectedSuiteId}
                  onTestSelect={(testId) => { setSelectedTestId(testId); setSelectedSuiteId(null); }} />
              ))}
            {suites.filter(s => s.parentId === null).length === 0 && (
              <div style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: "var(--gcp-text-secondary)" }}>No suites yet</div>
            )}
          </div>
        </div>

        <div className="gcp-card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {selectedTest ? (
            <>
              <div style={{ padding: 16, borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Bug size={18} style={{ color: "var(--gcp-blue)" }} />
                  <div>
                    <h2 style={{ fontWeight: 700, fontSize: 16 }}>{selectedTest.name}</h2>
                    <p style={{ fontSize: 11, color: "var(--gcp-text-secondary)", fontFamily: "var(--font-mono)" }}>{selectedTest.id}</p>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                  <div className="gcp-card" style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>Status</div>
                    <span className={`gcp-badge ${selectedTest.status === "active" ? "gcp-badge-pass" : "gcp-badge-fail"}`} style={{ fontSize: 11 }}>{selectedTest.status}</span>
                  </div>
                  <div className="gcp-card" style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>Priority</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gcp-text)" }}>{selectedTest.priority}</div>
                  </div>
                  <div className="gcp-card" style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>Category</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{selectedTest.category}</div>
                  </div>
                  <div className="gcp-card" style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>Type</div>
                    <div style={{ fontSize: 13, fontWeight: 500, textTransform: "capitalize" }}>{selectedTest.testType}</div>
                  </div>
                </div>
                <div className="gcp-card" style={{ padding: 12, marginBottom: 12 }}>
                  <h4 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--gcp-text-secondary)", fontWeight: 600, marginBottom: 6 }}>Description</h4>
                  <p style={{ fontSize: 13, color: "var(--gcp-text)", lineHeight: 1.6 }}>{selectedTest.description || "No description"}</p>
                </div>
                {selectedTest.predicates.length > 0 && (
                  <div className="gcp-card" style={{ padding: 12, marginBottom: 12 }}>
                    <h4 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--gcp-text-secondary)", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <Code size={12} /> Predicates ({selectedTest.predicates.length})
                    </h4>
                    <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--gcp-text)", lineHeight: 1.8 }}>
                      {selectedTest.predicates.map((p, i) => <div key={i} style={{ padding: "4px 0" }}>{p.field} {p.operator} {p.expected}</div>)}
                    </div>
                  </div>
                )}
                <div className="gcp-card" style={{ padding: 12, marginBottom: 12 }}>
                  <h4 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--gcp-text-secondary)", fontWeight: 600, marginBottom: 6 }}>Script</h4>
                  <a href={`https://github.com/ruake/AWARE/blob/main/${selectedTest.scriptPath}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--gcp-blue)", textDecoration: "underline", textUnderlineOffset: 2 }}>{selectedTest.scriptPath}</a>
                </div>
              </div>
            </>
          ) : selected ? (
            <>
              <div style={{ padding: 16, borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</h2>
                  <p style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>{selected.description}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => navigate(`/start?suite=${selected.id}`)} className="gcp-button gcp-button-primary gcp-button-sm"><PlayCircle size={13} /> Run</button>
                </div>
              </div>

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
                    </div>
                  ))}
                  {selectedTests.length === 0 && (
                    <div style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "var(--gcp-text-secondary)" }}>
                      No tests in this suite
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, overflow: "auto", padding: 16, color: "var(--gcp-text-secondary)" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--gcp-text)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <FolderTree size={18} /> Overview
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                <div className="gcp-card" style={{ padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "var(--gcp-blue)" }}>{suites.length}</div>
                  <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>Total Suites</div>
                </div>
                <div className="gcp-card" style={{ padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "var(--gcp-blue)" }}>{tcs.length}</div>
                  <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>Total Tests</div>
                </div>
                <div className="gcp-card" style={{ padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "var(--gcp-green)" }}>{tcs.filter(tc => tc.status === "active").length}</div>
                  <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>Active Tests</div>
                </div>
                <div className="gcp-card" style={{ padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "var(--gcp-orange)" }}>{suites.filter(s => s.schedule).length}</div>
                  <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>Scheduled Suites</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="gcp-card" style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--gcp-text)", marginBottom: 12 }}>Tests by Category</h3>
                  {(() => {
                    const cats: Record<string, number> = {};
                    tcs.forEach(tc => { cats[tc.category] = (cats[tc.category] || 0) + 1; });
                    return Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                      <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--gcp-grey)", fontSize: 12 }}>
                        <span style={{ flex: 1, color: "var(--gcp-text)" }}>{cat}</span>
                        <span style={{ fontWeight: 600, color: "var(--gcp-blue)" }}>{count}</span>
                      </div>
                    ));
                  })()}
                </div>
                <div className="gcp-card" style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--gcp-text)", marginBottom: 12 }}>Suites by Schedule</h3>
                  {suites.filter(s => s.schedule).length === 0 ? (
                    <p style={{ fontSize: 12 }}>No scheduled suites</p>
                  ) : (
                    suites.filter(s => s.schedule).map(s => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--gcp-grey)", fontSize: 12 }}>
                        <span style={{ flex: 1, color: "var(--gcp-text)" }}>{s.name}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text-secondary)" }}>{s.schedule}</span>
                        <span style={{ fontWeight: 600, color: "var(--gcp-blue)" }}>{s.testIds.length} tests</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {Toast}
      </div>
    </AppLayout>
  );
}

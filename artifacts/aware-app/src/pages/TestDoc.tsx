import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { DIFF_ROWS, getTestCaseById, reconcile, getCheckInSteps, generateYamlContent, onSyncStatusChange } from "@/lib/data";
import { TestDocTopBar } from "@/components/aware/TestDocTopBar";
import { TestDocSidebar } from "@/components/aware/TestDocSidebar";
import { TestDocChangelog } from "@/components/aware/TestDocChangelog";
import { TestFlowDiagram } from "@/components/aware/TestFlowDiagram";
import { RepoStatusBadge } from "@/components/aware/RepoStatusBadge";
import { Github, Download, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";

export default function TestDoc() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const testId = params.get("testId") || "";
  const diffRow = DIFF_ROWS.find(d => d.id === testId);
  const testName = diffRow?.name ?? (testId || "test_geo_match_us_locale_prod[/us/]");
  const testStatus = diffRow?.candStatus ?? "FAIL";
  const testCategory = diffRow?.category ?? "geo-match";
  const testSuite = "full_suite";

  const testCase = React.useMemo(() => getTestCaseById(testId), [testId]);

  const [syncing, setSyncing] = React.useState(false);
  const [checkInSteps, setCheckInSteps] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    const unsub = onSyncStatusChange((status) => {
      setSyncing(status === "syncing");
    });
    return unsub;
  }, []);

  const handleReconcile = async () => {
    if (!testCase) return;
    setSyncing(true);
    await reconcile();
    setSyncing(false);
  };

  const handleShowCheckInSteps = () => {
    if (!testCase) return;
    setCheckInSteps(prev => prev ? null : getCheckInSteps(testCase));
  };

  const handleDownloadYaml = () => {
    if (!testCase) return;
    const yaml = generateYamlContent(testCase);
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${testCase.id}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout activeHref="/tests">
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", maxWidth: 1800, margin: "0 auto", gap: 16 }}>
        <TestDocTopBar testId={testId} testName={testName} testStatus={testStatus} testCategory={testCategory} testSuite={testSuite} testCase={testCase} />

        {/* GitHub Sync Section */}
        <div className="gcp-card" style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Github size={16} style={{ color: "var(--gcp-text-secondary)" }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Repository Sync</span>
              {testCase && <RepoStatusBadge status={testCase.repoStatus} />}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={handleReconcile} disabled={syncing} className="gcp-button gcp-button-xs">
                <RefreshCw size={12} /> {syncing ? "Syncing..." : "Re-sync"}
              </button>
              <button onClick={handleShowCheckInSteps} className="gcp-button gcp-button-xs">
                <Github size={12} /> Check-in Steps
              </button>
              <button onClick={handleDownloadYaml} className="gcp-button gcp-button-xs">
                <Download size={12} /> YAML
              </button>
            </div>
          </div>

          {checkInSteps && (
            <div style={{ marginTop: 12, padding: 12, background: "var(--gcp-grey-bg)", borderRadius: 6, fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "monospace", maxHeight: 300, overflowY: "auto" }}>
              {checkInSteps.join("\n\n")}
            </div>
          )}

          {testCase?.repoStatus === "missing" && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "flex-start", gap: 6, padding: "8px 12px", background: "var(--gcp-fail-bg)", borderRadius: 6, fontSize: 11, color: "var(--gcp-fail)" }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>Not in repository</strong> — This test case will not be executed by CI until it is checked in. Use the check-in steps above to commit it to the repo.
              </div>
            </div>
          )}

          {testCase?.repoStatus === "synced" && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "flex-start", gap: 6, padding: "8px 12px", background: "var(--gcp-pass-bg)", borderRadius: 6, fontSize: 11, color: "var(--gcp-pass)" }}>
              <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>In repository</strong> — This test case is checked into the GitHub repo and will be executed by CI.
                {testCase.lastSyncedAt && <span style={{ display: "block", marginTop: 2, opacity: 0.7 }}>Last confirmed: {new Date(testCase.lastSyncedAt).toLocaleString()}</span>}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, overflow: "hidden" }}>
          <TestDocSidebar testCase={testCase} />

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingRight: 8, paddingBottom: 32, height: "calc(100vh - 150px)" }}>
            {testCase && <TestFlowDiagram testCase={testCase} />}
            <div className="gcp-card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 16, borderBottom: "1px solid var(--gcp-grey)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gcp-surface-hover)" }}>
                <h2 style={{ fontWeight: 500, fontSize: 13 }}>Pass Rate Over Time (7d)</h2>
                <span style={{ fontSize: 20, fontWeight: 700, color: "var(--gcp-green)" }}>94.8%</span>
              </div>
              <div style={{ padding: 20, height: 192, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gcp-green)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--gcp-green)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="20" x2="400" y2="20" stroke="var(--gcp-grey)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="60" x2="400" y2="60" stroke="var(--gcp-grey)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="var(--gcp-grey)" strokeWidth="1" strokeDasharray="4 4" />
                  <path d="M0,20 L30,20 L60,20 L90,100 L120,20 L150,20 L180,20 L210,20 L240,20 L270,100 L300,20 L330,20 L360,20 L400,20 L400,120 L0,120 Z" fill="url(#areaGradient)" />
                  <path d="M0,20 L30,20 L60,20 L90,100 L120,20 L150,20 L180,20 L210,20 L240,20 L270,100 L300,20 L330,20 L360,20 L400,20" fill="none" stroke="var(--gcp-green)" strokeWidth="3" strokeLinejoin="round" />
                  <circle cx="30" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="60" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="90" cy="100" r="6" fill="var(--gcp-red)" stroke="white" strokeWidth="2" />
                  <g transform="translate(90, 115)">
                    <rect x="-40" y="0" width="80" height="20" fill="var(--gcp-surface)" stroke="var(--gcp-red)" rx="2" />
                      <text x="0" y="14" fontSize="10" fontFamily="var(--font-mono)" fill="var(--gcp-red)" textAnchor="middle" fontWeight="bold">FAIL - Build 889</text>
                  </g>
                  <circle cx="120" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="150" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="180" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="210" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="240" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="270" cy="100" r="6" fill="var(--gcp-red)" stroke="white" strokeWidth="2" />
                  <g transform="translate(270, 115)">
                    <rect x="-40" y="0" width="80" height="20" fill="var(--gcp-surface)" stroke="var(--gcp-red)" rx="2" />
                      <text x="0" y="14" fontSize="10" fontFamily="var(--font-mono)" fill="var(--gcp-red)" textAnchor="middle" fontWeight="bold">FAIL - Build 891</text>
                  </g>
                  <circle cx="300" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="330" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="360" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="400" cy="20" r="4" fill="var(--gcp-green)" />
                </svg>
              </div>
            </div>

            <div className="gcp-card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 12, borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-surface-hover)" }}>
                <h2 style={{ fontWeight: 500, fontSize: 13 }}>Recent Executions</h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="gcp-table" style={{ width: "100%", fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px 0" }}>Run</th>
                      <th style={{ padding: "8px 0" }}>Date</th>
                      <th style={{ padding: "8px 0" }}>Status</th>
                      <th style={{ padding: "8px 0", textAlign: "right" }}>Duration</th>
                      <th style={{ padding: "8px 0" }}>Build</th>
                      <th style={{ padding: "8px 0" }}>Rev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { run: "run_892_prod", date: "Today 10:45", status: "FAIL", dur: "185ms", build: "v892", rev: "2341.1.0" },
                      { run: "run_891_prod", date: "Yesterday", status: "FAIL", dur: "192ms", build: "v891", rev: "2341.1.0" },
                      { run: "run_890_prod", date: "Jun 10", status: "PASS", dur: "134ms", build: "v890", rev: "2340.2.1" },
                      { run: "run_889_prod", date: "Jun 9", status: "FAIL", dur: "145ms", build: "v889", rev: "2340.2.1" },
                      { run: "run_888_prod", date: "Jun 8", status: "PASS", dur: "132ms", build: "v888", rev: "2340.2.1" },
                      { run: "run_887_prod", date: "Jun 7", status: "PASS", dur: "138ms", build: "v887", rev: "2340.2.1" },
                      { run: "run_886_prod", date: "Jun 6", status: "PASS", dur: "450ms", build: "v886", rev: "2340.2.1", spike: true },
                      { run: "run_885_prod", date: "Jun 5", status: "PASS", dur: "135ms", build: "v885", rev: "2340.2.1" },
                    ].map((row, i) => (
                      <tr key={i} style={{ cursor: "pointer", background: row.status === 'FAIL' ? "var(--gcp-red-bg)" : "transparent" }}>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-blue)" }}>{row.run}</td>
                        <td style={{ fontSize: 11, whiteSpace: "nowrap" }}>{row.date}</td>
                        <td>
                          <span className={`gcp-badge ${row.status === 'FAIL' ? 'gcp-badge-fail' : 'gcp-badge-pass'}`} style={{ fontSize: 9, padding: "2px 6px" }}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                          {(row as any).spike ? <span style={{ background: "#fef08a", color: "#713f12", padding: "1px 4px", borderRadius: 4, fontWeight: 700 }}>{row.dur}</span> : row.dur}
                        </td>
                        <td style={{ fontSize: 11 }}>{row.build}</td>
                        <td style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)" }}>{row.rev}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="gcp-card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 12, borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-surface-hover)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontWeight: 500, fontSize: 13 }}>Duration Trend</h2>
                <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Avg: 145ms</span>
              </div>
              <div style={{ padding: 16, height: 96, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <svg width="100%" height="100%" viewBox="0 0 300 50" preserveAspectRatio="none">
                  <path d="M0,40 L30,42 L60,38 L90,41 L120,40 L150,45 L180,39 L210,10 L240,40 L270,38 L300,42" fill="none" stroke="var(--gcp-blue)" strokeWidth="2" strokeLinejoin="round" />
                  <circle cx="210" cy="10" r="4" fill="var(--gcp-yellow)" stroke="white" strokeWidth="1" />
                  <text x="210" y="25" fontSize="10" textAnchor="middle" fill="var(--gcp-text-secondary)">450ms anomaly</text>
                </svg>
              </div>
            </div>
          </div>

          <TestDocChangelog testCase={testCase} />
        </div>
      </div>
    </AppLayout>
  );
}

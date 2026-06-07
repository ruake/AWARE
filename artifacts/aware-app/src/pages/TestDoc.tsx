import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { DIFF_ROWS } from "@/lib/data";
import { navTo, repo } from "@/lib/nav";
import { ArrowLeft, Pin, Github, ExternalLink, FileText, CheckCircle2, AlertTriangle, AlertCircle, GitBranch, GitCommit, Search } from "lucide-react";

export default function TestDoc() {
  const [location, navigate] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const testId = params.get("testId") || "";
  const diffRow = DIFF_ROWS.find(d => d.id === testId);
  const testName = diffRow?.name ?? (testId || "test_geo_match_us_locale_prod[/us/]");
  const testStatus = diffRow?.candStatus ?? "FAIL";
  const testCategory = diffRow?.category ?? "geo-match";
  const testSuite = "full_suite";
  return (
    <AppLayout activeHref="/tests">
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", maxWidth: 1800, margin: "0 auto", gap: 16 }}>
        {/* Top Sticky Bar */}
        <div className="gcp-card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => window.history.back()} style={{ color: "var(--gcp-text-secondary)", background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: "50%", display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={18} />
              <span style={{ fontSize: 13 }}>Back</span>
            </button>
            <div style={{ width: 1, height: 24, background: "var(--gcp-grey)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
              <Search size={14} style={{ color: "var(--gcp-text-secondary)" }} />
              <select
                className="gcp-input"
                style={{ fontSize: 13, fontFamily: "var(--font-mono)", maxWidth: 300 }}
                value={testId}
                onChange={e => navTo(`TestDoc?testId=${e.target.value}`)}
              >
                <option value="">Jump to test...</option>
                {DIFF_ROWS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div style={{ width: 1, height: 24, background: "var(--gcp-grey)" }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>{testName}</h1>
            <span className={`gcp-badge ${testStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`} style={{ fontSize: 13, fontWeight: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>{testStatus}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ padding: "4px 8px", background: "var(--gcp-grey-bg)", fontSize: 12, fontWeight: 500, borderRadius: 4, color: "var(--gcp-text-secondary)", border: "1px solid var(--gcp-grey)" }}>{testCategory}</span>
              <span style={{ padding: "4px 8px", background: "var(--gcp-grey-bg)", fontSize: 12, fontWeight: 500, borderRadius: 4, color: "var(--gcp-text-secondary)", border: "1px solid var(--gcp-grey)" }}>{testSuite}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{ padding: 8, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", borderRadius: "50%" }} title="Pin Test">
              <Pin size={18} />
            </button>
            <button className="gcp-button" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Github size={16} />
              View in GitHub
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* 3-Column Body */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, overflow: "hidden" }}>

          {/* LEFT COLUMN: What This Test Does */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingRight: 8, paddingBottom: 32, height: "calc(100vh - 150px)" }}>
            <div className="gcp-card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-surface-hover)" }}>
                <h2 style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={18} style={{ color: "var(--gcp-blue)" }} />
                  Test Documentation
                </h2>
              </div>
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                    Validates that requests from US IP addresses are correctly assigned the <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, background: "var(--gcp-grey-bg)", padding: "1px 4px", borderRadius: 4 }}>en-US</code> locale and hit the appropriate EdgeWorker cache key without triggering a 302 geo-redirect.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {["geo-gating", "locale-match", "edgeworker", "pmuser", "cache-key", "prod"].map(tag => (
                      <span key={tag} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: "var(--gcp-blue-bg)", color: "var(--gcp-blue)", border: "1px solid var(--gcp-blue)", fontWeight: 500 }}>#{tag}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Validates</h3>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      "PMUSER_LOCALE = en-US",
                      "No 302 geo-redirect",
                      "X-Cache: TCP_HIT on repeat",
                      "x-akamai-edgeworker-info present",
                      "Locale cookie set correctly"
                    ].map((item, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
                        <CheckCircle2 size={16} style={{ color: "var(--gcp-green)", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: "var(--gcp-yellow-bg)", padding: 12, borderRadius: 6, border: "1px solid var(--gcp-yellow)" }}>
                  <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--gcp-yellow)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={14} /> Preconditions
                  </h3>
                  <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--gcp-text)", listStyle: "disc" }}>
                    <li>Geo-gating enabled in PM config</li>
                    <li>EW version &gt;= 2341.1.0</li>
                    <li>Request must spoof IP: 8.8.8.8 (US)</li>
                  </ul>
                </div>

                <div style={{ background: "var(--gcp-red-bg)", padding: 12, borderRadius: 6, border: "1px solid var(--gcp-red)" }}>
                  <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--gcp-red)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertCircle size={14} /> Known Flakiness
                  </h3>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>Flake rate:</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--gcp-red)", fontWeight: 700 }}>3.2%</span>
                      <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>(last 90d)</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", marginTop: 4 }}>
                      <span style={{ fontWeight: 500, color: "var(--gcp-text)" }}>Cause:</span> Edge cache miss on first run after staging deploy. Wait for cache warming.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="gcp-card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 12, borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-surface-hover)" }}>
                <h2 style={{ fontWeight: 500, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <GitBranch size={16} style={{ color: "var(--gcp-text-secondary)" }} />
                  Related Tests
                </h2>
              </div>
              <div style={{ padding: 0 }}>
                <table className="gcp-table" style={{ width: "100%" }}>
                  <tbody>
                    <tr style={{ cursor: "pointer" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200, whiteSpace: "nowrap" }} title="test_geo_match_jp_locale_prod">test_geo_match_jp_locale_prod</div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}><span className="gcp-badge gcp-badge-pass" style={{ fontSize: 10 }}>PASS</span></td>
                    </tr>
                    <tr style={{ cursor: "pointer" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200, whiteSpace: "nowrap" }} title="test_geo_mismatch_us_spoof_jp">test_geo_mismatch_us_spoof_jp</div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}><span className="gcp-badge gcp-badge-pass" style={{ fontSize: 10 }}>PASS</span></td>
                    </tr>
                    <tr style={{ cursor: "pointer", background: "var(--gcp-red-bg)" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--gcp-red)", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200, whiteSpace: "nowrap" }} title="test_locale_split_disabled_us">test_locale_split_disabled_us</div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}><span className="gcp-badge gcp-badge-fail" style={{ fontSize: 10 }}>FAIL</span></td>
                    </tr>
                    <tr style={{ cursor: "pointer" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200, whiteSpace: "nowrap" }} title="test_cache_key_isolation_us_prod">test_cache_key_isolation_us_prod</div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}><span className="gcp-badge gcp-badge-pass" style={{ fontSize: 10 }}>PASS</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Run History & Trends */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingRight: 8, paddingBottom: 32, height: "calc(100vh - 150px)" }}>
            <div className="gcp-card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 16, borderBottom: "1px solid var(--gcp-grey)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gcp-surface-hover)" }}>
                <h2 style={{ fontWeight: 500, fontSize: 13 }}>Pass Rate Over Time (7d)</h2>
                <span style={{ fontSize: 20, fontWeight: 700, color: "var(--gcp-green)" }}>94.8%</span>
              </div>
              <div style={{ padding: 20, height: 192, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* SVG Line Chart Mock */}
                <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gcp-green)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--gcp-green)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="400" y2="20" stroke="var(--gcp-grey)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="60" x2="400" y2="60" stroke="var(--gcp-grey)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="var(--gcp-grey)" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Area */}
                  <path d="M0,20 L30,20 L60,20 L90,100 L120,20 L150,20 L180,20 L210,20 L240,20 L270,100 L300,20 L330,20 L360,20 L400,20 L400,120 L0,120 Z" fill="url(#areaGradient)" />

                  {/* Line */}
                  <path d="M0,20 L30,20 L60,20 L90,100 L120,20 L150,20 L180,20 L210,20 L240,20 L270,100 L300,20 L330,20 L360,20 L400,20" fill="none" stroke="var(--gcp-green)" strokeWidth="3" strokeLinejoin="round" />

                  {/* Data points */}
                  <circle cx="30" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="60" cy="20" r="4" fill="var(--gcp-green)" />

                  {/* Failure 1 */}
                  <circle cx="90" cy="100" r="6" fill="var(--gcp-red)" stroke="white" strokeWidth="2" />
                  <g transform="translate(90, 115)">
                    <rect x="-40" y="0" width="80" height="20" fill="var(--gcp-surface)" stroke="var(--gcp-red)" rx="2" />
                    <text x="0" y="14" fontSize="10" fontFamily="var(--font-mono)" fill="var(--gcp-red)" textAnchor="middle" fontWeight="bold">FAIL - PM 889</text>
                  </g>

                  <circle cx="120" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="150" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="180" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="210" cy="20" r="4" fill="var(--gcp-green)" />
                  <circle cx="240" cy="20" r="4" fill="var(--gcp-green)" />

                  {/* Failure 2 */}
                  <circle cx="270" cy="100" r="6" fill="var(--gcp-red)" stroke="white" strokeWidth="2" />
                  <g transform="translate(270, 115)">
                    <rect x="-40" y="0" width="80" height="20" fill="var(--gcp-surface)" stroke="var(--gcp-red)" rx="2" />
                    <text x="0" y="14" fontSize="10" fontFamily="var(--font-mono)" fill="var(--gcp-red)" textAnchor="middle" fontWeight="bold">FAIL - PM 891</text>
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
                      <th style={{ padding: "8px 0" }}>PM</th>
                      <th style={{ padding: "8px 0" }}>EW</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { run: "run_892_prod", date: "Today 10:45", status: "FAIL", dur: "185ms", pm: "892", ew: "2341.1.0" },
                      { run: "run_891_prod", date: "Yesterday", status: "FAIL", dur: "192ms", pm: "891", ew: "2341.1.0" },
                      { run: "run_890_prod", date: "Jun 10", status: "PASS", dur: "134ms", pm: "890", ew: "2340.2.1" },
                      { run: "run_889_prod", date: "Jun 9", status: "FAIL", dur: "145ms", pm: "889", ew: "2340.2.1" },
                      { run: "run_888_prod", date: "Jun 8", status: "PASS", dur: "132ms", pm: "888", ew: "2340.2.1" },
                      { run: "run_887_prod", date: "Jun 7", status: "PASS", dur: "138ms", pm: "887", ew: "2340.2.1" },
                      { run: "run_886_prod", date: "Jun 6", status: "PASS", dur: "450ms", pm: "886", ew: "2340.2.1", spike: true },
                      { run: "run_885_prod", date: "Jun 5", status: "PASS", dur: "135ms", pm: "885", ew: "2340.2.1" },
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
                        <td style={{ fontSize: 11 }}>{row.pm}</td>
                        <td style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)" }}>{row.ew}</td>
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

          {/* RIGHT COLUMN: GitHub Change History */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingRight: 8, paddingBottom: 32, height: "calc(100vh - 150px)" }}>
            <div className="gcp-card" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ padding: 16, borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-surface-hover)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <h2 style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                  <GitCommit size={18} style={{ color: "var(--gcp-text-secondary)" }} />
                  Change History
                </h2>
                <span style={{ fontSize: 11, background: "var(--gcp-grey)", color: "var(--gcp-text)", padding: "2px 8px", borderRadius: 12, fontWeight: 500 }}>tests/geo-gating/...</span>
              </div>

              <div style={{ padding: 20, flex: 1 }}>
                <div style={{ position: "relative", borderLeft: "2px solid var(--gcp-grey)", marginLeft: 12, paddingLeft: 24, paddingBottom: 16, display: "flex", flexDirection: "column", gap: 32 }}>

                  {/* Commit 1 */}
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -31, top: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--gcp-blue)", border: "4px solid var(--gcp-surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--gcp-blue)", fontWeight: 700, textDecoration: "underline" }}>a3f9c12</a>
                          <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>Jun 5</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#9c27b0", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>AL</div>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>@alice</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--gcp-text)" }}>fix: tighten locale assertion to exact match</p>

                      <div style={{ marginTop: 8, background: "#1e1e1e", borderRadius: 6, border: "1px solid #333", overflow: "hidden", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6 }}>
                        <div style={{ padding: "8px 12px", background: "#2d2d2d", borderBottom: "1px solid #333", color: "#ccc", fontSize: 10 }}>test_geo_match.py</div>
                        <div style={{ padding: 8, overflowX: "auto" }}>
                          <div style={{ color: "#858585" }}>@@ -282,5 +282,5 @@</div>
                          <div style={{ color: "#d4d4d4" }}>     response = send_request(ip="8.8.8.8")</div>
                          <div style={{ color: "#d4d4d4" }}>     pm_vars = extract_pm_variables(response)</div>
                          <div style={{ background: "#5a1d1d", color: "#f44747", padding: "0 4px" }}>-    assert "en-US" in pm_vars["PMUSER_LOCALE"]</div>
                          <div style={{ background: "#043304", color: "#4fc1ff", padding: "0 4px" }}>+    assert pm_vars["PMUSER_LOCALE"] == "en-US"</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commit 2 */}
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -31, top: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--gcp-grey)", border: "4px solid var(--gcp-surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--gcp-blue)", textDecoration: "underline" }}>b7e4d01</a>
                          <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>May 28</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1976d2", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>BO</div>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>@bob</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--gcp-text)" }}>feat: add X-Cache validation to geo-match tests</p>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: "var(--gcp-green-bg)", color: "var(--gcp-green)", border: "1px solid var(--gcp-green)" }}>+ assert</span>
                      </div>
                    </div>
                  </div>

                  {/* Commit 3 */}
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -31, top: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--gcp-grey)", border: "4px solid var(--gcp-surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--gcp-blue)", textDecoration: "underline" }}>c1a2b39</a>
                          <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>May 21</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#9c27b0", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>AL</div>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>@alice</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--gcp-text)" }}>docs: update test docstring for PMUSER_LOCALE</p>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: "var(--gcp-grey-bg)", color: "var(--gcp-text-secondary)", border: "1px solid var(--gcp-grey)" }}>docs only</span>
                      </div>
                    </div>
                  </div>

                  {/* Commit 4 */}
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -31, top: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--gcp-grey)", border: "4px solid var(--gcp-surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--gcp-blue)", textDecoration: "underline" }}>d9f3e87</a>
                          <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>May 14</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#e65100", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>CH</div>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>@charlie</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--gcp-text)" }}>fix: skip flaky on first-cold-cache scenario</p>

                      <div style={{ marginTop: 8, background: "#1e1e1e", borderRadius: 6, border: "1px solid #333", overflow: "hidden", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6 }}>
                        <div style={{ padding: 8, overflowX: "auto" }}>
                          <div style={{ color: "#858585" }}>@@ -275,2 +275,4 @@</div>
                          <div style={{ background: "#043304", color: "#4fc1ff", padding: "0 4px" }}>+    @pytest.mark.flaky(reruns=2, condition="X-Cache == TCP_MISS")</div>
                          <div style={{ background: "#043304", color: "#4fc1ff", padding: "0 4px" }}>+    def test_geo_match_us_locale_prod():</div>
                          <div style={{ color: "#d4d4d4" }}>         # Test implementation</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commit 5 */}
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -31, top: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--gcp-grey)", border: "4px solid var(--gcp-surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--gcp-blue)", textDecoration: "underline" }}>e5c8a11</a>
                          <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>May 7</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#9c27b0", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>AL</div>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>@alice</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--gcp-text)" }}>refactor: extract geo helper into conftest.py</p>

                      <div style={{ marginTop: 8, background: "#1e1e1e", borderRadius: 6, border: "1px solid #333", overflow: "hidden", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6, opacity: 0.8 }}>
                        <div style={{ padding: 8, overflowX: "auto" }}>
                          <div style={{ color: "#858585" }}>@@ -20,10 +20,2 @@</div>
                          <div style={{ background: "#5a1d1d", color: "#f44747", padding: "0 4px" }}>-def get_geo_headers(ip):</div>
                          <div style={{ background: "#5a1d1d", color: "#f44747", padding: "0 4px" }}>{'-    return {"X-Forwarded-For": ip}'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commit 6 */}
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -31, top: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--gcp-grey)", border: "4px solid var(--gcp-surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--gcp-blue)", textDecoration: "underline" }}>f2b9d64</a>
                          <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>Apr 1</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#9c27b0", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>AL</div>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>@alice</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--gcp-text)" }}>feat: initial geo-match test implementation</p>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: "var(--gcp-blue-bg)", color: "var(--gcp-blue)", border: "1px solid var(--gcp-blue)" }}>initial</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div style={{ paddingTop: 16, borderTop: "1px solid var(--gcp-grey)", marginTop: 16 }}>
                  <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--gcp-blue)", display: "flex", alignItems: "center", gap: 4, justifyContent: "center", textDecoration: "underline" }}>
                    View full history on GitHub <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>

            <div className="gcp-card" style={{ padding: 12, background: "var(--gcp-surface-hover)", border: "1px dashed var(--gcp-grey)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 12 }}>
                <div style={{ color: "var(--gcp-text-secondary)" }}>File:</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title="tests/geo-gating/test_geo_match.py">tests/geo-gating/test_geo_match.py</div>

                <div style={{ color: "var(--gcp-text-secondary)" }}>Lines:</div>
                <div style={{ textAlign: "right" }}>284</div>

                <div style={{ color: "var(--gcp-text-secondary)" }}>Last modified:</div>
                <div style={{ textAlign: "right" }}>Jun 5 2026 by <span style={{ fontWeight: 500 }}>@alice</span></div>

                <div style={{ color: "var(--gcp-text-secondary)" }}>Function:</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title="test_geo_match_us_locale_prod">test_geo_match_us_locale_prod</div>

                <div style={{ color: "var(--gcp-text-secondary)" }}>Parametrize:</div>
                <div style={{ textAlign: "right" }}><span style={{ background: "var(--gcp-grey)", color: "var(--gcp-text)", padding: "2px 6px", borderRadius: 4, fontWeight: 700, fontSize: 10 }}>4 variants</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}

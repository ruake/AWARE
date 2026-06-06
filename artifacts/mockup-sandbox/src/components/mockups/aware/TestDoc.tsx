import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import { useSyncDiffs } from "./_shared/hooks";
import { navTo, repo } from "./_shared/nav";
import "./_group.css";
import { ArrowLeft, Pin, Github, ExternalLink, FileText, CheckCircle2, AlertTriangle, AlertCircle, GitBranch, GitCommit, Search } from "lucide-react";

export function TestDoc() {
  const diffs = useSyncDiffs();
  const params = new URLSearchParams(window.location.search);
  const testId = params.get("testId") || "";
  const diffRow = diffs.find(d => d.id === testId);
  const testName = diffRow?.name ?? (testId || "test_geo_match_us_locale_prod[/us/]");
  const testStatus = diffRow?.candStatus ?? "FAIL";
  const testCategory = diffRow?.category ?? "geo-match";
  const testSuite = "full_suite";
  return (
    <AppLayout activeTab="detail">
      <div className="flex flex-col h-[calc(100vh-80px)] max-w-[1800px] mx-auto gap-4">
        {/* Top Sticky Bar */}
        <div className="gcp-card p-4 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => window.history.back()} className="text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)] p-1 rounded-full transition-colors flex items-center gap-1">
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>
            <div className="w-px h-6 bg-[var(--gcp-grey)] mx-2"></div>
            <div className="flex items-center gap-2 relative">
              <Search size={14} className="text-[var(--gcp-text-secondary)]" />
              <select
                className="gcp-input text-sm font-mono max-w-[300px]"
                value={testId}
                onChange={e => navTo(`TestDoc?testId=${e.target.value}`)}
              >
                <option value="">Jump to test...</option>
                {diffs.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="w-px h-6 bg-[var(--gcp-grey)] mx-2"></div>
            <h1 className="text-xl font-bold font-mono tracking-tight">{testName}</h1>
            <span className={`gcp-badge text-sm font-bold shadow-sm ${testStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{testStatus}</span>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-[var(--gcp-grey-bg)] text-[12px] font-medium rounded text-[var(--gcp-text-secondary)] border border-[var(--gcp-grey)]">{testCategory}</span>
              <span className="px-2 py-1 bg-[var(--gcp-grey-bg)] text-[12px] font-medium rounded text-[var(--gcp-text-secondary)] border border-[var(--gcp-grey)]">{testSuite}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)] rounded-full transition-colors tooltip-trigger" title="Pin Test">
              <Pin size={18} />
            </button>
            <button className="gcp-button flex items-center gap-2">
              <Github size={16} />
              View in GitHub
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* 3-Column Body */}
        <div className="flex gap-4 flex-1 overflow-hidden">
          
          {/* LEFT COLUMN: What This Test Does */}
          <div className="w-[32%] flex flex-col gap-4 overflow-y-auto pr-2 pb-8" style={{ height: "calc(100vh - 150px)" }}>
            <div className="gcp-card flex flex-col">
              <div className="p-4 border-b border-[var(--gcp-grey)] bg-[var(--gcp-surface-hover)]">
                <h2 className="font-medium flex items-center gap-2">
                  <FileText size={18} className="text-[var(--gcp-blue)]" />
                  Test Documentation
                </h2>
              </div>
              <div className="p-5 flex flex-col gap-6">
                <div>
                  <p className="text-sm leading-relaxed mb-3">
                    Validates that requests from US IP addresses are correctly assigned the <code className="gcp-mono text-[12px] bg-[var(--gcp-grey-bg)] px-1 rounded">en-US</code> locale and hit the appropriate EdgeWorker cache key without triggering a 302 geo-redirect.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["geo-gating", "locale-match", "edgeworker", "pmuser", "cache-key", "prod"].map(tag => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--gcp-blue-bg)] text-[var(--gcp-blue)] border border-[var(--gcp-blue)] border-opacity-20 font-medium">#{tag}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-2">Validates</h3>
                  <ul className="space-y-2">
                    {[
                      "PMUSER_LOCALE = en-US",
                      "No 302 geo-redirect",
                      "X-Cache: TCP_HIT on repeat",
                      "x-akamai-edgeworker-info present",
                      "Locale cookie set correctly"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={16} className="text-[var(--gcp-green)] shrink-0 mt-0.5" />
                        <span className="font-mono text-[13px]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[var(--gcp-yellow-bg)] p-3 rounded-md border border-[var(--gcp-yellow)] border-opacity-30">
                  <h3 className="text-[11px] font-bold text-[var(--gcp-yellow)] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle size={14} /> Preconditions
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--gcp-text)]">
                    <li>Geo-gating enabled in PM config</li>
                    <li>EW version &gt;= 2341.1.0</li>
                    <li>Request must spoof IP: 8.8.8.8 (US)</li>
                  </ul>
                </div>

                <div className="bg-[var(--gcp-red-bg)] p-3 rounded-md border border-[var(--gcp-red)] border-opacity-20">
                  <h3 className="text-[11px] font-bold text-[var(--gcp-red)] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertCircle size={14} /> Known Flakiness
                  </h3>
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Flake rate:</span> 
                      <span className="gcp-mono text-[var(--gcp-red)] font-bold">3.2%</span> 
                      <span className="text-[12px] text-[var(--gcp-text-secondary)]">(last 90d)</span>
                    </div>
                    <p className="text-[13px] text-[var(--gcp-text-secondary)] mt-1">
                      <span className="font-medium text-[var(--gcp-text)]">Cause:</span> Edge cache miss on first run after staging deploy. Wait for cache warming.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="gcp-card flex flex-col">
              <div className="p-3 border-b border-[var(--gcp-grey)] bg-[var(--gcp-surface-hover)]">
                <h2 className="font-medium text-sm flex items-center gap-2">
                  <GitBranch size={16} className="text-[var(--gcp-text-secondary)]" />
                  Related Tests
                </h2>
              </div>
              <div className="p-0">
                <table className="gcp-table w-full">
                  <tbody>
                    <tr className="cursor-pointer hover:bg-[var(--gcp-surface-hover)]">
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[12px] truncate max-w-[200px]" title="test_geo_match_jp_locale_prod">test_geo_match_jp_locale_prod</div>
                      </td>
                      <td className="py-2.5 px-3 text-right"><span className="gcp-badge gcp-badge-pass text-[10px]">PASS</span></td>
                    </tr>
                    <tr className="cursor-pointer hover:bg-[var(--gcp-surface-hover)]">
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[12px] truncate max-w-[200px]" title="test_geo_mismatch_us_spoof_jp">test_geo_mismatch_us_spoof_jp</div>
                      </td>
                      <td className="py-2.5 px-3 text-right"><span className="gcp-badge gcp-badge-pass text-[10px]">PASS</span></td>
                    </tr>
                    <tr className="cursor-pointer hover:bg-[var(--gcp-surface-hover)] bg-[var(--gcp-red-bg)] bg-opacity-20">
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[12px] text-[var(--gcp-red)] truncate max-w-[200px]" title="test_locale_split_disabled_us">test_locale_split_disabled_us</div>
                      </td>
                      <td className="py-2.5 px-3 text-right"><span className="gcp-badge gcp-badge-fail text-[10px]">FAIL</span></td>
                    </tr>
                    <tr className="cursor-pointer hover:bg-[var(--gcp-surface-hover)]">
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[12px] truncate max-w-[200px]" title="test_cache_key_isolation_us_prod">test_cache_key_isolation_us_prod</div>
                      </td>
                      <td className="py-2.5 px-3 text-right"><span className="gcp-badge gcp-badge-pass text-[10px]">PASS</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Run History & Trends */}
          <div className="w-[36%] flex flex-col gap-4 overflow-y-auto pr-2 pb-8" style={{ height: "calc(100vh - 150px)" }}>
            <div className="gcp-card flex flex-col">
              <div className="p-4 border-b border-[var(--gcp-grey)] flex justify-between items-center bg-[var(--gcp-surface-hover)]">
                <h2 className="font-medium text-sm">Pass Rate Over Time (7d)</h2>
                <span className="text-xl font-bold text-[var(--gcp-green)]">94.8%</span>
              </div>
              <div className="p-5 h-48 relative flex items-center justify-center">
                {/* SVG Line Chart Mock */}
                <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none" className="overflow-visible">
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

            <div className="gcp-card flex flex-col">
              <div className="p-3 border-b border-[var(--gcp-grey)] bg-[var(--gcp-surface-hover)]">
                <h2 className="font-medium text-sm">Recent Executions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="gcp-table w-full text-[12px]">
                  <thead>
                    <tr>
                      <th className="py-2">Run</th>
                      <th className="py-2">Date</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Duration</th>
                      <th className="py-2">PM</th>
                      <th className="py-2">EW</th>
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
                      <tr key={i} className={`cursor-pointer hover:bg-[var(--gcp-surface-hover)] ${row.status === 'FAIL' ? 'bg-[var(--gcp-red-bg)] bg-opacity-30' : ''}`}>
                        <td className="font-mono text-[11px] text-[var(--gcp-blue)]">{row.run}</td>
                        <td className="text-[11px] whitespace-nowrap">{row.date}</td>
                        <td>
                          <span className={`gcp-badge text-[9px] px-1 py-0.5 ${row.status === 'FAIL' ? 'gcp-badge-fail' : 'gcp-badge-pass'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="text-right font-mono text-[11px]">
                          {row.spike ? <span className="bg-yellow-200 text-yellow-900 px-1 rounded font-bold">{row.dur}</span> : row.dur}
                        </td>
                        <td className="text-[11px]">{row.pm}</td>
                        <td className="text-[11px] font-mono text-[var(--gcp-text-secondary)]">{row.ew}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="gcp-card flex flex-col">
              <div className="p-3 border-b border-[var(--gcp-grey)] bg-[var(--gcp-surface-hover)] flex justify-between items-center">
                <h2 className="font-medium text-sm">Duration Trend</h2>
                <span className="text-[11px] text-[var(--gcp-text-secondary)]">Avg: 145ms</span>
              </div>
              <div className="p-4 h-24 flex items-center justify-center relative">
                <svg width="100%" height="100%" viewBox="0 0 300 50" preserveAspectRatio="none">
                  <path d="M0,40 L30,42 L60,38 L90,41 L120,40 L150,45 L180,39 L210,10 L240,40 L270,38 L300,42" fill="none" stroke="var(--gcp-blue)" strokeWidth="2" strokeLinejoin="round" />
                  <circle cx="210" cy="10" r="4" fill="var(--gcp-yellow)" stroke="white" strokeWidth="1" />
                  <text x="210" y="25" fontSize="10" textAnchor="middle" fill="var(--gcp-text-secondary)">450ms anomaly</text>
                </svg>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: GitHub Change History */}
          <div className="w-[32%] flex flex-col gap-4 overflow-y-auto pr-2 pb-8" style={{ height: "calc(100vh - 150px)" }}>
            <div className="gcp-card flex flex-col flex-1">
              <div className="p-4 border-b border-[var(--gcp-grey)] bg-[var(--gcp-surface-hover)] flex justify-between items-center sticky top-0 z-10">
                <h2 className="font-medium flex items-center gap-2">
                  <GitCommit size={18} className="text-[var(--gcp-text-secondary)]" />
                  Change History
                </h2>
                <span className="text-[11px] bg-[var(--gcp-grey)] text-[var(--gcp-text)] px-2 py-0.5 rounded-full font-medium">tests/geo-gating/...</span>
              </div>
              
              <div className="p-5 flex-1">
                <div className="relative border-l-2 border-[var(--gcp-grey)] ml-3 pl-6 pb-4 space-y-8">
                  
                  {/* Commit 1 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[var(--gcp-blue)] border-4 border-[var(--gcp-surface)] shadow-sm"></div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-[var(--gcp-blue)] hover:underline font-bold">a3f9c12</a>
                          <span className="text-xs text-[var(--gcp-text-secondary)]">Jun 5</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-[#9c27b0] text-white flex items-center justify-center text-[10px] font-bold">AL</div>
                          <span className="text-xs font-medium">@alice</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-[var(--gcp-text)]">fix: tighten locale assertion to exact match</p>
                      
                      <div className="mt-2 bg-[#1e1e1e] rounded-md border border-[#333] overflow-hidden font-mono text-[12px] leading-relaxed">
                        <div className="px-3 py-1 bg-[#2d2d2d] border-b border-[#333] text-[#cccccc] text-[10px]">test_geo_match.py</div>
                        <div className="p-2 overflow-x-auto">
                          <div className="text-[#858585]">@@ -282,5 +282,5 @@</div>
                          <div className="text-[#d4d4d4]">     response = send_request(ip="8.8.8.8")</div>
                          <div className="text-[#d4d4d4]">     pm_vars = extract_pm_variables(response)</div>
                          <div className="bg-[#5a1d1d] text-[#f44747] px-1">-    assert "en-US" in pm_vars["PMUSER_LOCALE"]</div>
                          <div className="bg-[#043304] text-[#4fc1ff] px-1">+    assert pm_vars["PMUSER_LOCALE"] == "en-US"</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commit 2 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[var(--gcp-grey)] border-4 border-[var(--gcp-surface)] shadow-sm"></div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-[var(--gcp-blue)] hover:underline">b7e4d01</a>
                          <span className="text-xs text-[var(--gcp-text-secondary)]">May 28</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-[#1976d2] text-white flex items-center justify-center text-[10px] font-bold">BO</div>
                          <span className="text-xs font-medium">@bob</span>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--gcp-text)]">feat: add X-Cache validation to geo-match tests</p>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--gcp-green-bg)] text-[var(--gcp-green)] border border-[var(--gcp-green)] border-opacity-30">+ assert</span>
                      </div>
                    </div>
                  </div>

                  {/* Commit 3 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[var(--gcp-grey)] border-4 border-[var(--gcp-surface)] shadow-sm"></div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-[var(--gcp-blue)] hover:underline">c1a2b39</a>
                          <span className="text-xs text-[var(--gcp-text-secondary)]">May 21</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-[#9c27b0] text-white flex items-center justify-center text-[10px] font-bold">AL</div>
                          <span className="text-xs font-medium">@alice</span>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--gcp-text)] text-opacity-80">docs: update test docstring for PMUSER_LOCALE</p>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--gcp-grey-bg)] text-[var(--gcp-text-secondary)] border border-[var(--gcp-grey)]">docs only</span>
                      </div>
                    </div>
                  </div>

                  {/* Commit 4 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[var(--gcp-grey)] border-4 border-[var(--gcp-surface)] shadow-sm"></div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-[var(--gcp-blue)] hover:underline">d9f3e87</a>
                          <span className="text-xs text-[var(--gcp-text-secondary)]">May 14</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-[#e65100] text-white flex items-center justify-center text-[10px] font-bold">CH</div>
                          <span className="text-xs font-medium">@charlie</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-[var(--gcp-text)]">fix: skip flaky on first-cold-cache scenario</p>
                      
                      <div className="mt-2 bg-[#1e1e1e] rounded-md border border-[#333] overflow-hidden font-mono text-[12px] leading-relaxed">
                        <div className="p-2 overflow-x-auto">
                          <div className="text-[#858585]">@@ -275,2 +275,4 @@</div>
                          <div className="bg-[#043304] text-[#4fc1ff] px-1">+    @pytest.mark.flaky(reruns=2, condition="X-Cache == TCP_MISS")</div>
                          <div className="bg-[#043304] text-[#4fc1ff] px-1">+    def test_geo_match_us_locale_prod():</div>
                          <div className="text-[#d4d4d4]">         # Test implementation</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commit 5 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[var(--gcp-grey)] border-4 border-[var(--gcp-surface)] shadow-sm"></div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-[var(--gcp-blue)] hover:underline">e5c8a11</a>
                          <span className="text-xs text-[var(--gcp-text-secondary)]">May 7</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-[#9c27b0] text-white flex items-center justify-center text-[10px] font-bold">AL</div>
                          <span className="text-xs font-medium">@alice</span>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--gcp-text)]">refactor: extract geo helper into conftest.py</p>
                      
                      <div className="mt-2 bg-[#1e1e1e] rounded-md border border-[#333] overflow-hidden font-mono text-[12px] leading-relaxed opacity-80">
                        <div className="p-2 overflow-x-auto">
                          <div className="text-[#858585]">@@ -20,10 +20,2 @@</div>
                          <div className="bg-[#5a1d1d] text-[#f44747] px-1">-def get_geo_headers(ip):</div>
                          <div className="bg-[#5a1d1d] text-[#f44747] px-1">{'-    return {"X-Forwarded-For": ip}'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commit 6 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[var(--gcp-grey)] border-4 border-[var(--gcp-surface)] shadow-sm"></div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-[var(--gcp-blue)] hover:underline">f2b9d64</a>
                          <span className="text-xs text-[var(--gcp-text-secondary)]">Apr 1</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-[#9c27b0] text-white flex items-center justify-center text-[10px] font-bold">AL</div>
                          <span className="text-xs font-medium">@alice</span>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--gcp-text)]">feat: initial geo-match test implementation</p>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--gcp-blue-bg)] text-[var(--gcp-blue)] border border-[var(--gcp-blue)] border-opacity-30">initial</span>
                      </div>
                    </div>
                  </div>

                </div>
                
                <div className="pt-4 border-t border-[var(--gcp-grey)] mt-4">
                  <a href={`${repo}/commits/main`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--gcp-blue)] hover:underline flex items-center gap-1 justify-center">
                    View full history on GitHub <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>

            <div className="gcp-card p-3 bg-[var(--gcp-surface-hover)] border-dashed border-[var(--gcp-grey)]">
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div className="text-[var(--gcp-text-secondary)]">File:</div>
                <div className="font-mono text-[11px] text-right truncate" title="tests/geo-gating/test_geo_match.py">tests/geo-gating/test_geo_match.py</div>
                
                <div className="text-[var(--gcp-text-secondary)]">Lines:</div>
                <div className="text-right">284</div>
                
                <div className="text-[var(--gcp-text-secondary)]">Last modified:</div>
                <div className="text-right">Jun 5 2026 by <span className="font-medium">@alice</span></div>
                
                <div className="text-[var(--gcp-text-secondary)]">Function:</div>
                <div className="font-mono text-[11px] text-right truncate" title="test_geo_match_us_locale_prod">test_geo_match_us_locale_prod</div>
                
                <div className="text-[var(--gcp-text-secondary)]">Parametrize:</div>
                <div className="text-right"><span className="bg-[var(--gcp-grey)] text-[var(--gcp-text)] px-1.5 py-0.5 rounded font-bold text-[10px]">4 variants</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}

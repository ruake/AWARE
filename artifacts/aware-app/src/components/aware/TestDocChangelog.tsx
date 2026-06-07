import React from "react";
import { repo } from "@/lib/nav";
import { GitCommit, ExternalLink } from "lucide-react";

export function TestDocChangelog() {
  return (
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
  );
}

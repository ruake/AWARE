import React from "react";
import { FileText, CheckCircle2, AlertTriangle, AlertCircle, GitBranch } from "lucide-react";

export function TestDocSidebar() {
  return (
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
  );
}

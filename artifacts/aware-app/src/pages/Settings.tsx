import React, { useState, useEffect } from "react";
import { PageShell } from "@/components/console/PageShell";
import { SectionHeader as SharedSectionHeader } from "@/components/aware/SectionHeader";
import { 
  getEnvConfigs, 
  getTestSuites, 
  loadAllData, 
  PROMOTION_GATE_THRESHOLD,
  getDataInitState
} from "@/lib/data";
import { 
  Settings as SettingsIcon, 
  Database, 
  Layers, 
  Beaker, 
  Palette, 
  Info,
  RefreshCw,
  ExternalLink,
  Check,
  ChevronRight,
  RotateCcw
} from "lucide-react";

// Helper to manage settings in localStorage
const SETTINGS_KEY = "aware-settings-v1";

interface AwareSettings {
  promotionThreshold: number;
}

const DEFAULT_SETTINGS: AwareSettings = {
  promotionThreshold: PROMOTION_GATE_THRESHOLD * 100, // 95
};

function getSettings(): AwareSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AwareSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // Dispatch event for cross-tab sync if needed later
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
}

function SectionHeader({ icon: Icon, title, color }: { icon: any, title: string, color: string }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <SharedSectionHeader 
        title={title} 
        icon={<Icon size={18} style={{ color }} />}
      />
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<AwareSettings>(getSettings());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  
  const envConfigs = getEnvConfigs();
  const testSuites = getTestSuites();
  const dataState = getDataInitState();

  const triggerSaveFeedback = (key: string) => {
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 2000);
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      const newSettings = { ...settings, promotionThreshold: val };
      setSettings(newSettings);
      saveSettings(newSettings);
      triggerSaveFeedback('promotionThreshold');
    }
  };

  const handleResetSection = (section: string) => {
    if (confirmReset === section) {
      if (section === 'promotion') {
        const newSettings = { ...settings, promotionThreshold: DEFAULT_SETTINGS.promotionThreshold };
        setSettings(newSettings);
        saveSettings(newSettings);
        triggerSaveFeedback('promotionThreshold');
      }
      setConfirmReset(null);
    } else {
      setConfirmReset(section);
      setTimeout(() => setConfirmReset(null), 3000);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadAllData();
      triggerSaveFeedback('data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const sectionStyle: React.CSSProperties = {
    background: "var(--proof-surface)",
    border: "1px solid var(--proof-border)",
    borderRadius: "var(--proof-radius-lg)",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "var(--proof-shadow-card)",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--proof-text)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--proof-text-secondary)",
    marginBottom: "6px",
    display: "block",
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--proof-surface-2)",
    border: "1px solid var(--proof-border-strong)",
    borderRadius: "var(--proof-radius-sm)",
    color: "var(--proof-text)",
    padding: "6px 10px",
    fontSize: "13px",
    width: "100%",
    maxWidth: "200px",
  };

  const tableHeaderStyle: React.CSSProperties = {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--proof-text-muted)",
    textAlign: "left",
    padding: "8px 12px",
    borderBottom: "1px solid var(--proof-border)",
  };

  const tableCellStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--proof-text-secondary)",
    padding: "10px 12px",
    borderBottom: "1px solid var(--proof-border-light)",
  };

  return (
    <PageShell title="Settings" subtitle="Configure application behavior and view environment state">
      <div style={{ maxWidth: "1000px", display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Section 1: Promotion Gate */}
        <section style={sectionStyle}>
          <SectionHeader icon={Check} title="Promotion Gate" color="var(--proof-green)" />
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "13px", color: "var(--proof-text-secondary)", margin: 0 }}>
              Threshold for automatic promotion between environments. Runs below this pass rate will be flagged.
            </p>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--proof-text-secondary)", marginBottom: 6, display: 'block' }} htmlFor="promotionThreshold">Pass Rate Threshold (%)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input 
                  id="promotionThreshold"
                  type="number" 
                  value={settings.promotionThreshold} 
                  onChange={handleThresholdChange}
                  min="0"
                  max="100"
                  className="proof-input"
                  style={{ maxWidth: 200, fontSize: 13 }}
                  aria-label="Promotion gate pass rate threshold percentage"
                />
                <span style={{ fontSize: "12px", color: "var(--proof-text-muted)" }}>
                  Default: {PROMOTION_GATE_THRESHOLD * 100}%
                </span>
                {savedKey === 'promotionThreshold' && (
                  <span style={{ fontSize: "12px", color: "var(--proof-green)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Check size={14} /> Saved
                  </span>
                )}
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--proof-border)", paddingTop: "12px", marginTop: "4px" }}>
              <button
                onClick={() => handleResetSection('promotion')}
                className="proof-button-xs proof-button-secondary"
                style={{
                  color: confirmReset === 'promotion' ? "var(--proof-red)" : "var(--proof-text-muted)",
                }}
              >
                <RotateCcw size={12} />
                {confirmReset === 'promotion' ? "Confirm reset to defaults?" : "Reset to defaults"}
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Data Source */}
        <section style={sectionStyle}>
          <SectionHeader icon={Database} title="Data Source" color="var(--proof-blue)" />
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Source Mode</label>
                <div style={{ fontSize: "13px", color: "var(--proof-text)", fontWeight: 500 }}>
                  {import.meta.env.DEV ? "Local Development" : "Static Production"}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Base URL</label>
                <div style={{ fontSize: "13px", color: "var(--proof-text)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>
                  {import.meta.env.VITE_DATA_BASE_URL || "/data"}
                </div>
              </div>
            </div>
            
            <div style={{ borderTop: "1px solid var(--proof-border)", paddingTop: "16px", display: "flex", alignItems: "center", gap: 12 }}>
              <button 
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="proof-button-primary"
                style={{ opacity: isRefreshing ? 0.7 : 1 }}
                aria-label="Refresh all data from source"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Refreshing..." : "Refresh All Data"}
              </button>
              {savedKey === 'data' && (
                <span style={{ fontSize: "12px", color: "var(--proof-green)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Check size={14} /> Refreshed
                </span>
              )}
            </div>
            <p style={{ fontSize: "11px", color: "var(--proof-text-muted)", marginTop: "-8px" }}>
              Clears cached state and re-fetches all JSON manifests.
            </p>
          </div>
        </section>

        {/* Section 3: Environment Quick View */}
        <section style={sectionStyle}>
          <SectionHeader icon={Layers} title="Environment Quick View" color="var(--proof-purple)" />
          <div style={{ overflowX: "auto", margin: "0 -20px", padding: "0 20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>ID</th>
                  <th style={tableHeaderStyle}>Label</th>
                  <th style={tableHeaderStyle}>Target</th>
                  <th style={tableHeaderStyle}>Network</th>
                  <th style={tableHeaderStyle}>Base URL</th>
                  <th style={tableHeaderStyle}>Property</th>
                  <th style={tableHeaderStyle}>Ver</th>
                </tr>
              </thead>
              <tbody>
                {envConfigs.map((env) => (
                  <tr key={env.id}>
                    <td style={{ ...tableCellStyle, fontFamily: "var(--font-mono)", fontSize: "11px" }}>{env.id}</td>
                    <td style={{ ...tableCellStyle, fontWeight: 500 }}>{env.label}</td>
                    <td style={tableCellStyle}>{env.target}</td>
                    <td style={tableCellStyle}>
                      <span style={{ 
                        padding: "2px 6px", 
                        borderRadius: "4px", 
                        background: env.network === "production" ? "var(--proof-red-bg)" : "var(--proof-blue-bg)",
                        color: env.network === "production" ? "var(--proof-red-bright)" : "var(--proof-blue-bright)",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase"
                      }}>
                        {env.network}
                      </span>
                    </td>
                    <td style={{ ...tableCellStyle, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {env.baseUrl}
                    </td>
                    <td style={tableCellStyle}>{env.property}</td>
                    <td style={tableCellStyle}>{env.propertyVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Test Suite Overview */}
        <section style={sectionStyle}>
          <SectionHeader icon={Beaker} title="Test Suite Overview" color="var(--proof-cyan)" />
          <div style={{ overflowX: "auto", margin: "0 -20px", padding: "0 20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Suite Name</th>
                  <th style={tableHeaderStyle}>Tests</th>
                  <th style={tableHeaderStyle}>Environments</th>
                  <th style={tableHeaderStyle}>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {testSuites.map((suite) => (
                  <tr key={suite.id}>
                    <td style={{ ...tableCellStyle, fontWeight: 500 }}>{suite.name}</td>
                    <td style={tableCellStyle}>{suite.testIds?.length || 0}</td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {["QA", "UAT", "PROD"].map(tier => (
                          <span key={tier} style={{ 
                            fontSize: "10px", 
                            padding: "1px 4px", 
                            background: "var(--proof-surface-3)",
                            borderRadius: "3px",
                            opacity: 0.8
                          }}>{tier}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ ...tableCellStyle, fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                      {suite.schedule || "Every 15m"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Appearance */}
        <section style={sectionStyle}>
          <SectionHeader icon={Palette} title="Appearance" color="var(--proof-orange)" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
            <div>
              <label style={labelStyle}>Theme</label>
              <p style={{ fontSize: "12px", color: "var(--proof-text-muted)", marginBottom: "12px" }}>
                Use the toggle in the top bar to switch between Light and Dark modes.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Pass Rate Thresholds (Read-only)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--proof-green)" }}></div>
                  <span style={{ fontSize: "12px", color: "var(--proof-text-secondary)" }}>Healthy: ≥ 95%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--proof-yellow)" }}></div>
                  <span style={{ fontSize: "12px", color: "var(--proof-text-secondary)" }}>Degraded: 80% - 95%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--proof-red)" }}></div>
                  <span style={{ fontSize: "12px", color: "var(--proof-text-secondary)" }}>Failure: &lt; 80%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: About / Version */}
        <section style={sectionStyle}>
          <SectionHeader icon={Info} title="About / Version" color="var(--proof-text-muted)" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--proof-text)" }}>A.W.A.R.E.</div>
              <div style={{ fontSize: "12px", color: "var(--proof-text-muted)", marginBottom: "12px" }}>
                Akamai Web Analytics Regression Engine
              </div>
              <div style={{ display: "flex", gap: "20px" }}>
                <div>
                  <label style={labelStyle}>Version</label>
                  <div style={{ fontSize: "13px", color: "var(--proof-text)" }}>3.0.4-stable</div>
                </div>
                <div>
                  <label style={labelStyle}>Build</label>
                  <div style={{ fontSize: "13px", color: "var(--proof-text)", fontFamily: "var(--font-mono)" }}>2025.02.15</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer"
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "6px", 
                  fontSize: "12px",
                  color: "var(--proof-blue-bright)",
                  textDecoration: "none"
                }}
              >
                GitHub Repository <ExternalLink size={12} />
              </a>
              <a 
                href="/docs" 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "6px", 
                  fontSize: "12px",
                  color: "var(--proof-blue-bright)",
                  textDecoration: "none"
                }}
              >
                Documentation <ChevronRight size={12} />
              </a>
            </div>
          </div>
        </section>

      </div>
    </PageShell>
  );
}

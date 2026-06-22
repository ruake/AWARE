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

  return (
    <PageShell title="Settings" subtitle="Configure application behavior and view environment state">
      <div 
        style={{ 
          maxWidth: "1000px", 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 20,
          animation: "page-enter 0.4s ease-out both"
        }}
      >
        
        {/* Section 1: Promotion Gate */}
        <section className="proof-card" style={{ padding: "24px" }}>
          <SectionHeader icon={Check} title="Promotion Gate" color="var(--proof-green)" />
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "13px", color: "var(--proof-text-secondary)", margin: 0 }}>
              Threshold for automatic promotion between environments. Runs below this pass rate will be flagged.
            </p>
            <div>
              <label 
                style={{ 
                  fontSize: 11, 
                  fontWeight: 600, 
                  color: "var(--proof-text-secondary)", 
                  marginBottom: 6, 
                  display: 'block',
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }} 
                htmlFor="promotionThreshold"
              >
                Pass Rate Threshold (%)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input 
                  id="promotionThreshold"
                  type="number" 
                  value={settings.promotionThreshold} 
                  onChange={handleThresholdChange}
                  min="0"
                  max="100"
                  className="proof-input"
                  style={{ maxWidth: 120, fontSize: 13 }}
                  aria-label="Promotion gate pass rate threshold percentage"
                />
                <span style={{ fontSize: "11px", color: "var(--proof-text-muted)" }}>
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
        <section className="proof-card" style={{ padding: "24px" }}>
          <SectionHeader icon={Database} title="Data Source" color="var(--proof-blue)" />
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label 
                  style={{ 
                    fontSize: 11, 
                    fontWeight: 600, 
                    color: "var(--proof-text-secondary)", 
                    marginBottom: 6, 
                    display: 'block',
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  Source Mode
                </label>
                <div style={{ fontSize: "13px", color: "var(--proof-text)", fontWeight: 500 }}>
                  {import.meta.env.DEV ? "Local Development" : "Static Production"}
                </div>
              </div>
              <div>
                <label 
                  style={{ 
                    fontSize: 11, 
                    fontWeight: 600, 
                    color: "var(--proof-text-secondary)", 
                    marginBottom: 6, 
                    display: 'block',
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  Base URL
                </label>
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
        <section className="proof-card" style={{ padding: "24px" }}>
          <SectionHeader icon={Layers} title="Environment Quick View" color="var(--proof-purple)" />
          <div style={{ overflowX: "auto", margin: "0 -24px", padding: "0 24px" }}>
            <table className="proof-table" style={{ width: "100%" }}>
              <thead>
                <tr className="proof-tr">
                  <th className="proof-th">ID</th>
                  <th className="proof-th">Label</th>
                  <th className="proof-th">Target</th>
                  <th className="proof-th">Network</th>
                  <th className="proof-th">Base URL</th>
                  <th className="proof-th">Property</th>
                  <th className="proof-th">Ver</th>
                </tr>
              </thead>
              <tbody>
                {envConfigs.map((env) => (
                  <tr key={env.id} className="proof-tr">
                    <td className="proof-td" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{env.id}</td>
                    <td className="proof-td" style={{ fontWeight: 600 }}>{env.label}</td>
                    <td className="proof-td">{env.target}</td>
                    <td className="proof-td">
                      <span style={{ 
                        padding: "2px 8px", 
                        borderRadius: "100px", 
                        background: env.network === "production" ? "var(--proof-red-bg)" : "var(--proof-blue-bg)",
                        color: env.network === "production" ? "var(--proof-red-bright)" : "var(--proof-blue-bright)",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase"
                      }}>
                        {env.network}
                      </span>
                    </td>
                    <td className="proof-td" style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {env.baseUrl}
                    </td>
                    <td className="proof-td">{env.property}</td>
                    <td className="proof-td">{env.propertyVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Test Suite Overview */}
        <section className="proof-card" style={{ padding: "24px" }}>
          <SectionHeader icon={Beaker} title="Test Suite Overview" color="var(--proof-cyan)" />
          <div style={{ overflowX: "auto", margin: "0 -24px", padding: "0 24px" }}>
            <table className="proof-table" style={{ width: "100%" }}>
              <thead>
                <tr className="proof-tr">
                  <th className="proof-th">Suite Name</th>
                  <th className="proof-th">Tests</th>
                  <th className="proof-th">Environments</th>
                  <th className="proof-th">Schedule</th>
                </tr>
              </thead>
              <tbody>
                {testSuites.map((suite) => (
                  <tr key={suite.id} className="proof-tr">
                    <td className="proof-td" style={{ fontWeight: 600 }}>{suite.name}</td>
                    <td className="proof-td">{suite.testIds?.length || 0}</td>
                    <td className="proof-td">
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {["QA", "UAT", "PROD"].map(tier => (
                          <span key={tier} className="proof-badge" style={{ 
                            fontSize: "10px", 
                            opacity: 0.8
                          }}>{tier}</span>
                        ))}
                      </div>
                    </td>
                    <td className="proof-td" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                      {suite.schedule || "Every 15m"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Appearance */}
        <section className="proof-card" style={{ padding: "24px" }}>
          <SectionHeader icon={Palette} title="Appearance" color="var(--proof-orange)" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
            <div>
              <label 
                style={{ 
                  fontSize: 11, 
                  fontWeight: 600, 
                  color: "var(--proof-text-secondary)", 
                  marginBottom: 6, 
                  display: 'block',
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              >
                Theme
              </label>
              <p style={{ fontSize: "12px", color: "var(--proof-text-muted)", marginBottom: "12px" }}>
                Use the toggle in the top bar to switch between Light and Dark modes.
              </p>
            </div>
            <div>
              <label 
                style={{ 
                  fontSize: 11, 
                  fontWeight: 600, 
                  color: "var(--proof-text-secondary)", 
                  marginBottom: 6, 
                  display: 'block',
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              >
                Pass Rate Thresholds (Read-only)
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="proof-status-dot proof-status-dot-pass"></div>
                  <span style={{ fontSize: "12px", color: "var(--proof-text-secondary)" }}>Healthy: ≥ 95%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="proof-status-dot proof-status-dot-degraded"></div>
                  <span style={{ fontSize: "12px", color: "var(--proof-text-secondary)" }}>Degraded: 80% - 95%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="proof-status-dot proof-status-dot-fail"></div>
                  <span style={{ fontSize: "12px", color: "var(--proof-text-secondary)" }}>Failure: &lt; 80%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: About / Version */}
        <section className="proof-card" style={{ padding: "24px" }}>
          <SectionHeader icon={Info} title="About / Version" color="var(--proof-text-muted)" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.01em" }}>A.W.A.R.E.</div>
              <div style={{ fontSize: "11px", color: "var(--proof-text-muted)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                Akamai Web Analytics Regression Engine
              </div>
              <div style={{ display: "flex", gap: "24px" }}>
                <div>
                  <label 
                    style={{ 
                      fontSize: 11, 
                      fontWeight: 600, 
                      color: "var(--proof-text-secondary)", 
                      marginBottom: 4, 
                      display: 'block',
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}
                  >
                    Version
                  </label>
                  <div style={{ fontSize: "13px", color: "var(--proof-text)", fontWeight: 500 }}>3.0.4-stable</div>
                </div>
                <div>
                  <label 
                    style={{ 
                      fontSize: 11, 
                      fontWeight: 600, 
                      color: "var(--proof-text-secondary)", 
                      marginBottom: 4, 
                      display: 'block',
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}
                  >
                    Build
                  </label>
                  <div style={{ fontSize: "13px", color: "var(--proof-text)", fontFamily: "var(--font-mono)" }}>2025.02.15</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                  textDecoration: "none",
                  fontWeight: 500
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
                  textDecoration: "none",
                  fontWeight: 500
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

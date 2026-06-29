import React, { useState, useEffect } from "react";
import {
  getEnvConfigs, getTestSuites, loadAllData,
  PROMOTION_GATE_THRESHOLD,
} from "@/lib/data";
import {
  Database, Layers, Beaker, Info, RefreshCw, Check, Monitor, Cpu, ExternalLink, Save, Settings2
} from "lucide-react";
import { ChromeProvider } from "@/lib/copilot/providers";
import type { ProviderStatus } from "@/lib/copilot/types";

const SETTINGS_KEY = "aware-settings-v1";
interface AwareSettings { promotionThreshold: number }
const DEFAULT_SETTINGS: AwareSettings = { promotionThreshold: PROMOTION_GATE_THRESHOLD * 100 };
function getSettings(): AwareSettings {
  try {
    const s = localStorage.getItem(SETTINGS_KEY);
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch { /* empty */ }
  return DEFAULT_SETTINGS;
}
function saveSettings(s: AwareSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); window.dispatchEvent(new Event("storage")); } catch { /* empty */ }
}

function SettingsCard({ icon: Icon, title, color, glowColor, children }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  color: string;
  glowColor: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel" style={{ overflow: "hidden", borderRadius: "var(--proof-radius-xl)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
        <div style={{ 
          width: 36, 
          height: 36, 
          borderRadius: 10, 
          flexShrink: 0, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          background: `color-mix(in srgb, ${color} 15%, transparent)`, 
          color, 
          boxShadow: `0 0 20px ${glowColor}`,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(45deg, transparent 25%, ${color}20 50%, transparent 75%)`,
            backgroundSize: "200% 200%",
            animation: "shimmer 3s infinite linear",
            opacity: 0.5
          }} />
          <Icon size={20} style={{ position: "relative", zIndex: 1 }} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--proof-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, padding: "20px 0", position: "relative" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--proof-text)", marginBottom: 4 }}>{label}</div>
        {hint && <div style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
      <div style={{ 
        position: "absolute", 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: 1, 
        background: "linear-gradient(to right, transparent, var(--proof-border), transparent)" 
      }} />
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<AwareSettings>(getSettings);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [chromeAiStatus, setChromeAiStatus] = useState<ProviderStatus>("unavailable");
  const [checkingAi, setCheckingAi] = useState(false);

  const envConfigs = getEnvConfigs();
  const suites = getTestSuites();

  const checkChromeAi = async () => {
    try {
      const provider = new ChromeProvider();
      const status = await provider.checkAvailability();
      setChromeAiStatus(status);
    } catch {
      setChromeAiStatus("unavailable");
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkChromeAi, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSync = async () => {
    setSyncing(true);
    try { await loadAllData(); } finally { setTimeout(() => setSyncing(false), 600); }
  };

  const isDarkMode = !document.documentElement.classList.contains("light");
  const toggleTheme = () => {
    const wasLight = document.documentElement.classList.contains("light");
    if (wasLight) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("proof-theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("proof-theme", "light");
    }
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div style={{ padding: "24px", maxWidth: 900, width: "100%", animation: "page-enter 0.5s ease-out both", margin: "0 auto" }}>
      <div className="glass-panel" style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 24, 
        padding: "32px", 
        borderRadius: "var(--proof-radius-xl)", 
        marginBottom: 32,
        background: "linear-gradient(135deg, var(--proof-surface) 0%, var(--proof-surface-2) 100%)",
        border: "1px solid var(--proof-border-strong)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at top right, var(--proof-blue-glow) 0%, transparent 70%)",
          opacity: 0.4,
          pointerEvents: "none"
        }} />
        <div style={{ 
          width: 56, 
          height: 56, 
          borderRadius: 16, 
          background: "var(--proof-blue-bg)", 
          border: "1px solid var(--proof-blue-border)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          color: "var(--proof-blue)",
          boxShadow: "var(--proof-glow-cyan)",
          flexShrink: 0,
          position: "relative"
        }}>
          <Settings2 size={28} />
        </div>
        <div style={{ position: "relative" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--proof-text)", margin: 0, textTransform: "uppercase" }}>
            System Configuration
          </h1>
          <p style={{ fontSize: 15, color: "var(--proof-text-secondary)", margin: "4px 0 0 0" }}>
            Fine-tune environment parameters and agent behaviors.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Appearance */}
        <SettingsCard icon={Monitor} title="Appearance" color="var(--proof-blue)" glowColor="rgba(0,196,255,0.25)">
          <Row label="Theme Mode" hint="Switch between Light and Dark terminal aesthetics">
            <button 
              onClick={toggleTheme}
              className="proof-btn proof-btn-ghost"
              style={{ border: "1px solid var(--proof-border)", background: "rgba(0,0,0,0.3)" }}
            >
              {isDarkMode ? "Engage Light Mode" : "Engage Dark Mode"}
            </button>
          </Row>
        </SettingsCard>

        {/* Chrome AI */}
        <SettingsCard icon={Cpu} title="Copilot Neural Engine" color="var(--proof-purple)" glowColor="rgba(167,139,250,0.25)">
          <Row label="Gemini Nano Status" hint="On-device AI provider connection state">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="metric-number" style={{
                fontSize: 12, padding: "4px 10px", borderRadius: 4,
                background: chromeAiStatus === "available" ? "var(--proof-green-bg)" : chromeAiStatus === "downloading" ? "var(--proof-yellow-bg)" : "var(--proof-red-bg)",
                color: chromeAiStatus === "available" ? "var(--proof-green)" : chromeAiStatus === "downloading" ? "var(--proof-yellow)" : "var(--proof-red)",
                border: `1px solid ${chromeAiStatus === "available" ? "rgba(0,229,160,0.3)" : chromeAiStatus === "downloading" ? "rgba(245,158,11,0.3)" : "rgba(255,51,85,0.3)"}`,
                boxShadow: chromeAiStatus === "available" ? "var(--proof-glow-green)" : "none"
              }}>
                {chromeAiStatus.toUpperCase()}
              </span>
              <button
                onClick={async () => { setCheckingAi(true); await checkChromeAi(); setCheckingAi(false); }}
                disabled={checkingAi}
                className="proof-btn proof-btn-ghost"
                style={{ padding: "6px 12px", border: "1px solid var(--proof-border)", fontSize: 12 }}
              >
                <RefreshCw size={14} style={{ animation: checkingAi ? "spin 1s linear infinite" : "none" }} />
                {checkingAi ? "Polling..." : "Test Connection"}
              </button>
            </div>
          </Row>
          {chromeAiStatus !== "available" && (
            <div className="glass-panel" style={{ marginTop: 16, padding: 20, borderRadius: "var(--proof-radius-lg)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--proof-text)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Info size={16} style={{ color: "var(--proof-blue)" }} />
                Initialization Protocol
              </h4>
              <ol style={{ fontSize: 13, color: "var(--proof-text-secondary)", margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, fontFamily: "var(--font-mono)" }}>
                <li>Ensure you are using <span style={{ color: "var(--proof-text)" }}>Chrome Canary</span> or <span style={{ color: "var(--proof-text)" }}>Dev</span> (v138+).</li>
                <li>Go to <code style={{ color: "var(--proof-blue)" }}>chrome://flags/#prompt-api-for-gemini-nano</code> and set to <span style={{ color: "var(--proof-green)" }}>Enabled</span>.</li>
                <li>Go to <code style={{ color: "var(--proof-blue)" }}>chrome://flags/#optimization-guide-on-device-model</code> and set to <span style={{ color: "var(--proof-green)" }}>Enabled BypassPerfRequirement</span>.</li>
                <li>Relaunch Chrome and monitor <code style={{ color: "var(--proof-blue)" }}>chrome://components</code> for "Optimization Guide On Device Model".</li>
              </ol>
              <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                <a 
                  href="https://developer.chrome.com/docs/ai/built-in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="proof-btn proof-btn-ghost"
                  style={{ fontSize: 12, color: "var(--proof-blue)", border: "1px solid rgba(0,196,255,0.3)" }}
                >
                  View Provider Docs <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}
        </SettingsCard>

        {/* Promotion gate */}
        <SettingsCard icon={Layers} title="Promotion Gates" color="var(--proof-green)" glowColor="rgba(0,229,160,0.25)">
          <Row label="Pass Rate Threshold" hint="Minimum required stability to authorize QA → UAT → PROD promotion">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <input
                type="range" min={50} max={100} step={1}
                aria-label="Pass rate threshold"
                value={settings.promotionThreshold}
                onChange={(e) => setSettings((s) => ({ ...s, promotionThreshold: Number(e.target.value) }))}
                style={{ width: 160, cursor: "pointer", accentColor: "var(--proof-green)" }}
              />
              <span className="metric-number"
                style={{
                  fontSize: 20, minWidth: 64, textAlign: "right",
                  color: settings.promotionThreshold >= 95 ? "var(--proof-green)" : settings.promotionThreshold >= 80 ? "var(--proof-yellow)" : "var(--proof-red)",
                  textShadow: settings.promotionThreshold >= 95 ? "0 0 12px rgba(0,229,160,0.4)" : "none"
                }}
              >
                {settings.promotionThreshold}%
              </span>
            </div>
          </Row>
        </SettingsCard>

        {/* Environments */}
        <SettingsCard icon={Database} title="Environment Topology" color="var(--proof-cyan)" glowColor="rgba(0,196,255,0.25)">
          {envConfigs.map((env) => (
            <div key={env.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--proof-text)", marginBottom: 4 }}>{env.label}</div>
                <div className="metric-number" style={{ fontSize: 12, color: "var(--proof-text-muted)" }}>{env.id}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span className="metric-number" style={{
                  fontSize: 11, padding: "4px 8px", borderRadius: 4,
                  color: env.target === "QA" ? "var(--proof-yellow)" : env.target === "UAT" ? "var(--proof-blue)" : "var(--proof-green)",
                  background: env.target === "QA" ? "var(--proof-yellow-bg)" : env.target === "UAT" ? "var(--proof-blue-bg)" : "var(--proof-green-bg)",
                  border: `1px solid ${env.target === "QA" ? "rgba(245,158,11,0.3)" : env.target === "UAT" ? "rgba(0,196,255,0.3)" : "rgba(0,229,160,0.3)"}`,
                }}>
                  {env.target}
                </span>
                <span className="metric-number" style={{
                  fontSize: 11, color: "var(--proof-text-secondary)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: 4,
                }}>
                  {env.network}
                </span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: "var(--proof-radius)", background: "rgba(0,0,0,0.2)", border: "1px dashed rgba(255,255,255,0.1)", display: "flex", gap: 8 }}>
            <Info size={14} style={{ color: "var(--proof-blue)", flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>
              Modify topology via <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--proof-blue)" }}>config/environments.yml</code>
            </span>
          </div>
        </SettingsCard>

        {/* Test suites */}
        <SettingsCard icon={Beaker} title="Test Suites Registry" color="var(--proof-orange)" glowColor="rgba(251,146,60,0.25)">
          {suites.slice(0, 8).map((suite) => (
            <div key={suite.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--proof-text)", marginBottom: 4 }}>{suite.name}</div>
                <div className="metric-number" style={{ fontSize: 12, color: "var(--proof-text-muted)" }}>{suite.testIds?.length ?? 0} tests registered</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {suite.envIds?.map((e) => (
                  <span key={e} className="metric-number" style={{
                    fontSize: 11, padding: "4px 8px", borderRadius: 4,
                    color: "var(--proof-text-secondary)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)"
                  }}>
                    {e}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {suites.length > 8 && (
            <div className="metric-number" style={{ paddingTop: 16, fontSize: 13, color: "var(--proof-text-muted)" }}>
              +{suites.length - 8} additional suites
            </div>
          )}
        </SettingsCard>

        {/* Data sync */}
        <SettingsCard icon={RefreshCw} title="Data Synchronization" color="var(--proof-yellow)" glowColor="rgba(245,158,11,0.25)">
          <Row label="Force Reload" hint="Re-fetch all JSON metrics and logs from the server">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="proof-btn proof-btn-ghost"
              style={{ opacity: syncing ? 0.7 : 1, cursor: syncing ? "wait" : "pointer", border: "1px solid rgba(245,158,11,0.3)", color: "var(--proof-yellow)" }}
            >
              <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          </Row>
          <Row label="Data Source Path" hint="All telemetry is sourced from JSON seed records">
            <span className="metric-number" style={{
              fontSize: 13, color: "var(--proof-text-secondary)",
              background: "rgba(0,0,0,0.3)", padding: "6px 12px", borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              /data/
            </span>
          </Row>
        </SettingsCard>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button
            onClick={handleSave}
            className="proof-btn proof-btn-primary"
            style={{ 
              padding: "12px 48px", 
              fontSize: 15, 
              fontWeight: 700,
              boxShadow: "var(--proof-glow-cyan)", 
              border: "1px solid rgba(0,196,255,0.4)",
              transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            {saved ? <><Check size={18} /> Configuration Saved</> : <><Save size={18}/> Save All Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

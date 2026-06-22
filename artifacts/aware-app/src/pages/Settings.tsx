import React, { useState, useEffect } from "react";
import {
  getEnvConfigs, getTestSuites, loadAllData,
  PROMOTION_GATE_THRESHOLD, getDataInitState,
} from "@/lib/data";
import {
  Database, Layers, Beaker, Info, RefreshCw, Check, Monitor, Cpu, ExternalLink,
} from "lucide-react";
import { ChromeProvider } from "@/lib/copilot/providers";
import { ProviderStatus } from "@/lib/copilot/types";

const SETTINGS_KEY = "aware-settings-v1";
interface AwareSettings { promotionThreshold: number }
const DEFAULT_SETTINGS: AwareSettings = { promotionThreshold: PROMOTION_GATE_THRESHOLD * 100 };
function getSettings(): AwareSettings {
  try {
    const s = localStorage.getItem(SETTINGS_KEY);
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_SETTINGS;
}
function saveSettings(s: AwareSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); window.dispatchEvent(new Event("storage")); } catch {}
}

function SettingsCard({ icon: Icon, title, colorClass, children }: {
  icon: React.ComponentType<{ size?: number, className?: string }>;
  title: string; colorClass: string; children: React.ReactNode;
}) {
  return (
    <section className="proof-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--proof-border)] bg-[var(--proof-surface-2)]">
        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${colorClass}`}>
          <Icon size={16} />
        </div>
        <span className="text-[13px] font-bold text-[var(--proof-text)]">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[var(--proof-border-light)] last:border-0 last:pb-0 first:pt-0">
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-[var(--proof-text)] mb-0.5">{label}</div>
        {hint && <div className="text-[11.5px] text-[var(--proof-text-muted)]">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
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

  useEffect(() => {
    checkChromeAi();
  }, []);

  const checkChromeAi = async () => {
    setCheckingAi(true);
    try {
      const provider = new ChromeProvider();
      const status = await provider.checkAvailability();
      setChromeAiStatus(status);
    } catch {
      setChromeAiStatus("unavailable");
    } finally {
      setCheckingAi(false);
    }
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSync = async () => {
    setSyncing(true);
    try { await loadAllData(); } finally { setTimeout(() => setSyncing(false), 600); }
  };

  // App uses `.light` class for light mode; absence = dark mode (default)
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
    <div className="px-6 py-5 max-w-[800px] w-full animate-fade-in mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--proof-text)] m-0 mb-1">
            Settings
          </h1>
          <p className="text-[13px] text-[var(--proof-text-secondary)] m-0">
            Configure environments, promotion gates, and data sources
          </p>
        </div>
        <button
          onClick={handleSave}
          className="proof-btn proof-btn-primary"
        >
          {saved ? <><Check size={14} /> Saved</> : "Save Changes"}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Appearance */}
        <SettingsCard icon={Monitor} title="Appearance" colorClass="bg-[var(--proof-blue-bg)] border border-[var(--proof-blue-border)] text-[var(--proof-blue-bright)]">
          <Row label="Theme" hint="Switch between dark (Midnight Observatory) and light modes">
            <button 
              onClick={toggleTheme}
              className="proof-btn proof-btn-ghost"
            >
              {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </button>
          </Row>
        </SettingsCard>

        {/* Chrome AI */}
        <SettingsCard icon={Cpu} title="Chrome AI (Gemini Nano)" colorClass="bg-[var(--proof-emerald-bg)] border border-[var(--proof-emerald-border)] text-[var(--proof-emerald)]">
          <Row label="Status" hint="On-device AI status for Copilot features">
            <div className="flex items-center gap-3">
              <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-[4px] ${
                chromeAiStatus === "available" ? "bg-[var(--proof-green-bg)] text-[var(--proof-green)]" :
                chromeAiStatus === "downloading" ? "bg-[var(--proof-yellow-bg)] text-[var(--proof-yellow)]" :
                "bg-[var(--proof-red-bg)] text-[var(--proof-red)]"
              }`}>
                {chromeAiStatus}
              </span>
              <button
                onClick={checkChromeAi}
                disabled={checkingAi}
                className="proof-btn proof-btn-ghost px-2 py-1 h-auto text-[11px]"
              >
                {checkingAi ? "Checking..." : "Check Availability"}
              </button>
            </div>
          </Row>
          {chromeAiStatus !== "available" && (
            <div className="mt-4 p-4 rounded-[var(--proof-radius)] bg-[var(--proof-surface-2)] border border-[var(--proof-border)]">
              <h4 className="text-[13px] font-bold text-[var(--proof-text)] mb-2 flex items-center gap-2">
                <Info size={14} className="text-[var(--proof-blue-bright)]" />
                How to enable Chrome AI
              </h4>
              <ol className="text-[12px] text-[var(--proof-text-secondary)] space-y-2 list-decimal ml-4">
                <li>Ensure you are using <strong>Chrome Canary</strong> or <strong>Dev</strong> (v138+).</li>
                <li>Go to <code className="bg-[var(--proof-surface-3)] px-1 py-0.5 rounded text-[var(--proof-blue-bright)]">chrome://flags/#prompt-api-for-gemini-nano</code> and set to <strong>Enabled</strong>.</li>
                <li>Go to <code className="bg-[var(--proof-surface-3)] px-1 py-0.5 rounded text-[var(--proof-blue-bright)]">chrome://flags/#optimization-guide-on-device-model</code> and set to <strong>Enabled BypassPerfRequirement</strong>.</li>
                <li>Relaunch Chrome and wait for the model to download (check <code className="bg-[var(--proof-surface-3)] px-1 py-0.5 rounded text-[var(--proof-blue-bright)]">chrome://components</code> for "Optimization Guide On Device Model").</li>
              </ol>
              <div className="mt-4 flex gap-3">
                <a 
                  href="https://developer.chrome.com/docs/ai/built-in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[11px] text-[var(--proof-blue-bright)] hover:underline flex items-center gap-1"
                >
                  Developer Docs <ExternalLink size={10} />
                </a>
              </div>
            </div>
          )}
        </SettingsCard>

        {/* Promotion gate */}
        <SettingsCard icon={Layers} title="Promotion Gate" colorClass="bg-[var(--proof-green-bg)] border border-[var(--proof-green-border)] text-[var(--proof-green)]">
          <Row label="Pass Rate Threshold" hint="Minimum pass rate required to promote from UAT → PROD">
            <div className="flex items-center gap-2.5">
              <input
                type="range" min={50} max={100} step={1}
                value={settings.promotionThreshold}
                onChange={(e) => setSettings((s) => ({ ...s, promotionThreshold: Number(e.target.value) }))}
                className="w-[120px] cursor-pointer"
                style={{ accentColor: "var(--proof-green)" }}
              />
              <span 
                className="text-[14px] font-extrabold font-mono min-w-[42px] text-right"
                style={{ color: settings.promotionThreshold >= 95 ? "var(--proof-green)" : settings.promotionThreshold >= 80 ? "var(--proof-yellow)" : "var(--proof-red)" }}
              >
                {settings.promotionThreshold}%
              </span>
            </div>
          </Row>
        </SettingsCard>

        {/* Environments */}
        <SettingsCard icon={Database} title="Environments" colorClass="bg-[var(--proof-blue-bg)] border border-[var(--proof-blue-border)] text-[var(--proof-blue-bright)]">
          {envConfigs.map((env) => (
            <div key={env.id} className="flex items-center justify-between py-2.5 border-b border-[var(--proof-border-light)] last:border-0 last:pb-0">
              <div>
                <div className="text-[12.5px] font-semibold text-[var(--proof-text)] mb-0.5">{env.label}</div>
                <div className="text-[11px] text-[var(--proof-text-muted)] font-mono">{env.id}</div>
              </div>
              <div className="flex gap-1.5">
                <span className="text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded-[4px]" style={{
                  color: env.target === "QA" ? "var(--proof-blue)" : env.target === "UAT" ? "var(--proof-purple)" : "var(--proof-green)",
                  background: env.target === "QA" ? "var(--proof-blue-bg)" : env.target === "UAT" ? "var(--proof-purple-bg)" : "var(--proof-green-bg)",
                }}>
                  {env.target}
                </span>
                <span className="text-[9.5px] font-semibold text-[var(--proof-text-muted)] bg-[var(--proof-hover)] px-1.5 py-0.5 rounded-[4px]">
                  {env.network}
                </span>
              </div>
            </div>
          ))}
          <div className="mt-3 px-3 py-2.5 rounded-[var(--proof-radius)] bg-[var(--proof-subtle-bg)] flex gap-2">
            <Info size={12} className="text-[var(--proof-blue-bright)] shrink-0 mt-[1px]" />
            <span className="text-[11px] text-[var(--proof-text-secondary)]">
              Edit in <code className="font-mono text-[10.5px] bg-[var(--proof-surface-2)] px-1 py-0.5 rounded-[3px]">config/environments.yml</code>
            </span>
          </div>
        </SettingsCard>

        {/* Test suites */}
        <SettingsCard icon={Beaker} title="Test Suites" colorClass="bg-[var(--proof-purple-bg)] border border-[var(--proof-purple-border)] text-[var(--proof-purple-bright)]">
          {suites.slice(0, 8).map((suite) => (
            <div key={suite.id} className="flex items-center justify-between py-2.5 border-b border-[var(--proof-border-light)] last:border-0 last:pb-0">
              <div>
                <div className="text-[12.5px] font-semibold text-[var(--proof-text)] mb-0.5">{suite.name}</div>
                <div className="text-[11px] text-[var(--proof-text-muted)]">{suite.testIds?.length ?? 0} tests</div>
              </div>
              <div className="flex gap-1">
                {suite.envIds?.map((e) => (
                  <span key={e} className="text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded-[4px] text-[var(--proof-text-secondary)] bg-[var(--proof-hover)]">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {suites.length > 8 && (
            <div className="pt-2.5 text-[11.5px] text-[var(--proof-text-muted)]">
              +{suites.length - 8} more suites
            </div>
          )}
        </SettingsCard>

        {/* Data sync */}
        <SettingsCard icon={RefreshCw} title="Data &amp; Sync" colorClass="bg-[var(--proof-yellow-bg)] border border-[var(--proof-yellow-border)] text-[var(--proof-yellow-bright)]">
          <Row label="Reload data" hint="Refetch all JSON data from the server">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="proof-btn proof-btn-ghost"
              style={{ opacity: syncing ? 0.7 : 1, cursor: syncing ? "wait" : "pointer" }}
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync Now"}
            </button>
          </Row>
          <Row label="Data source" hint="All data is loaded from JSON seed files in data/">
            <span className="text-[11px] font-mono text-[var(--proof-text-secondary)] bg-[var(--proof-surface-2)] px-2 py-1 rounded-[var(--proof-radius-sm)] border border-[var(--proof-border)]">
              data/
            </span>
          </Row>
        </SettingsCard>
      </div>
    </div>
  );
}


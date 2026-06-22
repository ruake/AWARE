import React, { useSyncExternalStore, useMemo, useState } from "react";
import { computeRunFrequency, subscribeToRuns, getRuns, getTestResultsForRun } from "@/lib/data";
import { getAutoDiscoverySummary, subscribeToAutoTests, getAutoDiscoveredTests } from "@/lib/data";
import { getTestSuites, subscribeToTestSuites } from "@/lib/data";
import { getTestCases, subscribeToTestCases } from "@/lib/data";
import { getAllPromotionDecisions, subscribeToPromotions } from "@/lib/data";
import { getEnvConfigs } from "@/lib/envConfig";
import { AboutHero } from "@/components/aware/AboutHero";
import { AboutStats } from "@/components/aware/AboutStats";
import { AboutFeatures } from "@/components/aware/AboutFeatures";
import { AboutEnvMap } from "@/components/aware/AboutEnvMap";
import { AboutTechStack } from "@/components/aware/AboutTechStack";
import { AboutTestCategories } from "@/components/aware/AboutTestCategories";
import { Database, Copy, Check } from "lucide-react";

export default function About() {
  const liveRuns = useSyncExternalStore(subscribeToRuns, getRuns);
  const suites = useSyncExternalStore(subscribeToTestSuites, getTestSuites);
  const testCases = useSyncExternalStore(subscribeToTestCases, getTestCases);
  const autoTests = useSyncExternalStore(subscribeToAutoTests, getAutoDiscoveredTests);
  const promos = useSyncExternalStore(subscribeToPromotions, getAllPromotionDecisions);
  const freq = computeRunFrequency();
  const [copied, setCopied] = useState(false);

  const promoteCount = promos.filter((p) => p.decision === "promote").length;
  const promoPct = promos.length > 0 ? Math.round((promoteCount / promos.length) * 100) : 0;
  const totalTests = testCases.length > 0 ? testCases.length : autoTests.length;
  const recentRuns = [...liveRuns]
    .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
    .slice(0, 20);
  const overallRate =
    recentRuns.length > 0
      ? Math.round(recentRuns.reduce((s, r) => s + r.passPct, 0) / recentRuns.length)
      : 0;
  const envs = getEnvConfigs();
  const summary = getAutoDiscoverySummary();
  const cats = summary.byCategory ?? {};
  const runsPerDay = typeof freq === "object" ? `${freq.runsPerDay.toFixed(1)}/day` : String(freq);

  const lastRunDate = useMemo(() => {
    if (liveRuns.length === 0) return "Never";
    const sorted = [...liveRuns].sort(
      (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime()
    );
    return new Date(sorted[0].started).toLocaleDateString();
  }, [liveRuns]);

  const dataHealthy = useMemo(() => {
    if (liveRuns.length === 0) return false;
    // Simple heuristic: if we can fetch results for the latest run, data is "healthy"
    const latest = [...liveRuns].sort((a,b) => new Date(b.started).getTime() - new Date(a.started).getTime())[0];
    return !!getTestResultsForRun(latest.id);
  }, [liveRuns]);

  const handleCopyVersion = () => {
    const version = "3.0.4"; // Matches Settings.tsx
    const diagnostic = `AWARE v${version} — ${liveRuns.length} runs — ${new Date().toISOString()}`;
    navigator.clipboard.writeText(diagnostic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          padding: "32px 24px",
          maxWidth: 1100,
          margin: "0 auto",
          animation: "page-enter 0.4s ease-out both",
        }}
      >
        <AboutHero />

        {/* System Status Section */}
        <div
          className="proof-card"
          style={{
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            background: "var(--proof-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Database size={18} style={{ color: "var(--proof-blue)" }} />
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>System Status</div>
            <div style={{ height: 16, width: 1, background: "var(--proof-border)" }} />
            <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--proof-text-secondary)", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "var(--proof-text-muted)" }}>Data:</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: dataHealthy ? "var(--proof-green)" : "var(--proof-red)", fontWeight: 600 }}>
                  <div className={`proof-status-dot proof-status-dot-${dataHealthy ? 'pass' : 'fail'}`} />
                  {dataHealthy ? "Healthy" : "Error"}
                </span>
              </div>
              <div><span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "var(--proof-text-muted)" }}>Runs:</span> <span style={{ color: "var(--proof-text)", fontWeight: 600 }}>{liveRuns.length}</span></div>
              <div><span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "var(--proof-text-muted)" }}>Latest:</span> <span style={{ color: "var(--proof-text)", fontWeight: 600 }}>{lastRunDate}</span></div>
              <div><span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "var(--proof-text-muted)" }}>Nodes:</span> <span style={{ color: "var(--proof-text)", fontWeight: 600 }}>{envs.length}</span></div>
            </div>
          </div>
          <button
            onClick={handleCopyVersion}
            className="proof-button proof-button-xs proof-button-secondary"
          >
            {copied ? <Check size={12} style={{ color: "var(--proof-green)" }} /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy version info"}
          </button>
        </div>

        <AboutStats
          runs={liveRuns.length}
          tests={totalTests}
          suites={suites.length}
          passRate={overallRate}
          promoPct={promoPct}
          runsPerDay={runsPerDay}
          envCount={envs.length}
        />
        
        <AboutFeatures />
        
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24 }}>
          <AboutEnvMap />
          <AboutTechStack />
        </div>

        {Object.keys(cats).length > 0 && (
          <AboutTestCategories categories={cats as Record<string, number>} />
        )}
      </div>
    </div>
  );
}

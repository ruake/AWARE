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
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { Database, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: "easeOut" as const, duration: 0.4 } }
};

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
  const totalTests = (testCases.length || autoTests.length) || 0;
  const recentRuns = [...liveRuns]
    .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
    .slice(0, 20);
  const overallRate =
    recentRuns.length > 0
      ? Math.round(recentRuns.reduce((s, r) => s + (r.passPct || 0), 0) / recentRuns.length)
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
    <div className="proof-page" style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          padding: "var(--proof-page-py) var(--proof-page-px)",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <motion.div variants={itemVariants}>
          <AboutHero />
        </motion.div>

        {/* System Status Section */}
        <motion.div variants={itemVariants}>
          <div
            className="proof-card"
            style={{
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              background: "var(--proof-surface-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--proof-radius-lg)",
                  background: "var(--proof-blue-bg)",
                  border: "1px solid var(--proof-blue-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--proof-blue)",
                }}
              >
                <Database size={18} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--proof-text)" }}>System Status</div>
                <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--proof-text-secondary)", marginTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "var(--proof-text-muted)" }}>Data:</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: dataHealthy ? "var(--proof-green)" : "var(--proof-red)", fontWeight: 500 }}>
                      <span className="proof-live-dot" style={{ backgroundColor: dataHealthy ? "var(--proof-green)" : "var(--proof-red)", boxShadow: `0 0 6px var(--proof-${dataHealthy ? 'green' : 'red'}-glow)` }} />
                      {dataHealthy ? "Healthy" : "Error"}
                    </span>
                  </div>
                  <div><span style={{ color: "var(--proof-text-muted)" }}>Runs:</span> <span style={{ color: "var(--proof-text)", fontWeight: 500 }}>{liveRuns.length}</span></div>
                  <div><span style={{ color: "var(--proof-text-muted)" }}>Latest:</span> <span style={{ color: "var(--proof-text)", fontWeight: 500 }}>{lastRunDate}</span></div>
                  <div><span style={{ color: "var(--proof-text-muted)" }}>Nodes:</span> <span style={{ color: "var(--proof-text)", fontWeight: 500 }}>{envs.length}</span></div>
                </div>
              </div>
            </div>
            <button
              onClick={handleCopyVersion}
              className="proof-btn proof-btn-ghost"
              style={{ fontSize: 12 }}
            >
              {copied ? <Check size={14} style={{ color: "var(--proof-green)" }} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy diagnostic"}
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AboutStats
            runs={liveRuns.length}
            tests={totalTests}
            suites={suites.length}
            passRate={overallRate}
            promoPct={promoPct}
            runsPerDay={runsPerDay}
            envCount={envs.length}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <AboutFeatures />
        </motion.div>
        
        <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 28 }}>
          <PanelErrorBoundary label="Environment Map">
            <AboutEnvMap />
          </PanelErrorBoundary>
          <AboutTechStack />
        </motion.div>

        {Object.keys(cats).length > 0 && (
          <motion.div variants={itemVariants}>
            <AboutTestCategories categories={cats as Record<string, number>} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

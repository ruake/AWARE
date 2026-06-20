import React, { useSyncExternalStore } from "react";
import { computeRunFrequency, subscribeToRuns, getRuns } from "@/lib/data";
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

export default function About() {
  const liveRuns = useSyncExternalStore(subscribeToRuns, getRuns);
  const suites = useSyncExternalStore(subscribeToTestSuites, getTestSuites);
  const testCases = useSyncExternalStore(subscribeToTestCases, getTestCases);
  const autoTests = useSyncExternalStore(subscribeToAutoTests, getAutoDiscoveredTests);
  const promos = useSyncExternalStore(subscribeToPromotions, getAllPromotionDecisions);
  const freq = computeRunFrequency();
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
          gap: 20,
          padding: "20px 24px",
          maxWidth: 1100,
          margin: "0 auto",
          animation: "page-enter 0.22s ease-out both",
        }}
      >
        <AboutHero />
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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

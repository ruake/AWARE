import React from "react";
import { RUNS, ENV_SUMMARY, computeRunFrequency } from "@/lib/data";
import { getAutoDiscoveredTests, getAutoDiscoverySummary } from "@/lib/data";
import { getTestSuites } from "@/lib/data";
import { getAllPromotionDecisions } from "@/lib/data";
import { getEnvConfigs } from "@/lib/envConfig";
import { AboutHero } from "@/components/aware/AboutHero";
import { AboutStats } from "@/components/aware/AboutStats";
import { AboutFeatures } from "@/components/aware/AboutFeatures";
import { AboutEnvMap } from "@/components/aware/AboutEnvMap";
import { AboutTechStack } from "@/components/aware/AboutTechStack";
import { AboutTestCategories } from "@/components/aware/AboutTestCategories";

export default function About() {
  const suites = getTestSuites();
  const tests = getAutoDiscoveredTests();
  const summary = getAutoDiscoverySummary();
  const promos = getAllPromotionDecisions();
  const freq = computeRunFrequency();
  const promoteCount = promos.filter((p) => p.decision === "promote").length;
  const promoPct = promos.length > 0 ? Math.round((promoteCount / promos.length) * 100) : 0;
  const overallRate =
    ENV_SUMMARY.length > 0
      ? Math.round(ENV_SUMMARY.reduce((s, e) => s + e.passRate, 0) / ENV_SUMMARY.length)
      : 0;
  const envs = getEnvConfigs();
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
          runs={RUNS.length}
          tests={tests.length}
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

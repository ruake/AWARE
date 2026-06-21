import React from "react";
import {
  BarChart3,
  GitCompare,
  Shield,
  Globe,
  Layers,
  TrendingUp,
  Activity,
  Bot,
} from "lucide-react";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { AboutSection } from "./AboutSection";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Dashboard",
    desc: "Real-time pass rate trends with anomaly detection",
    color: "var(--proof-blue)",
  },
  {
    icon: GitCompare,
    title: "Regression Compare",
    desc: "Baseline vs candidate diff with column filters",
    color: "var(--proof-green)",
  },
  {
    icon: Activity,
    title: "Run History",
    desc: "Filterable run table with detail panels",
    color: "var(--proof-yellow)",
  },
  {
    icon: Shield,
    title: "Promotion Gating",
    desc: "Gate deployments with ≥95% pass-rate thresholds",
    color: "var(--proof-orange)",
  },
  {
    icon: Layers,
    title: "Test Suites",
    desc: "Hierarchical tree with YAML export",
    color: "var(--proof-red)",
  },
  {
    icon: Globe,
    title: "Cross-Env Testing",
    desc: "3 tiers × 2 networks, property version shown",
    color: "var(--proof-cyan)",
  },
  {
    icon: Bot,
    title: "AI Copilot",
    desc: "Context-aware analysis with three LLM providers",
    color: "var(--proof-purple)",
  },
  {
    icon: TrendingUp,
    title: "Trends Analytics",
    desc: "Flakiness leaderboard, heatmaps, Z-score anomalies",
    color: "var(--proof-green)",
  },
];

export function AboutFeatures() {
  return (
    <PanelErrorBoundary label="Features">
      <AboutSection
        color="var(--proof-blue)"
        title="Features"
        badge={`${FEATURES.length} modules`}
        glow="0 0 8px var(--proof-blue-glow)"
      >
        <div
          style={{
            padding: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {FEATURES.map((f) => {
            const I = f.icon;
            return (
              <div key={f.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: `color-mix(in srgb, ${f.color} 10%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${f.color} 15%, transparent)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <I size={15} style={{ color: f.color }} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--proof-text)",
                      letterSpacing: "-0.1px",
                    }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--proof-text-secondary)",
                      lineHeight: 1.45,
                      marginTop: 2,
                    }}
                  >
                    {f.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AboutSection>
    </PanelErrorBoundary>
  );
}

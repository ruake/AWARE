import React from "react";
import {
  Activity,
  RefreshCw,
  Layers,
  ArrowRight,
  Bug,
  Rocket,
  Heart,
} from "lucide-react";

interface Action {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  message: string;
}

const ACTIONS: Action[] = [
  {
    id: "latest-runs",
    label: "Latest Runs",
    description: "Pass rates for the last 10 runs",
    icon: <Activity size={13} />,
    message: "Show me the last 10 test runs with pass rates and failure counts.",
  },
  {
    id: "flaky-tests",
    label: "Flaky Tests",
    description: "Tests flipping PASS↔FAIL",
    icon: <RefreshCw size={13} />,
    message: "Which tests are flaky? Analyze the last 5 runs and rank by flakiness score.",
  },
  {
    id: "compare-envs",
    label: "Compare Envs",
    description: "QA vs UAT vs PROD health",
    icon: <Layers size={13} />,
    message: "Compare pass rates and failure counts across QA, UAT, and PROD environments.",
  },
  {
    id: "promotion-gate",
    label: "Promotion Gate",
    description: "UAT → PROD readiness",
    icon: <ArrowRight size={13} />,
    message: "What is the current UAT → PROD promotion gate status? Show recent decisions.",
  },
  {
    id: "failures",
    label: "Failure Breakdown",
    description: "Categories failing in latest run",
    icon: <Bug size={13} />,
    message: "Break down test failures by category for the latest run. What's failing most?",
  },
  {
    id: "release-ready",
    label: "Release Ready?",
    description: "Can we deploy to PROD?",
    icon: <Rocket size={13} />,
    message:
      "Is the current build ready for PROD? Check the latest UAT run pass rate against the ≥95% promotion threshold and recent promotion gate decisions.",
  },
  {
    id: "env-health",
    label: "Env Health",
    description: "Overall environment status",
    icon: <Heart size={13} />,
    message:
      "Give me a health summary of all three environments. Compare pass rates and flag any that need attention.",
  },
];

interface Props {
  onAction: (message: string) => void;
  busy: boolean;
}

export default function QuickActions({ onAction, busy }: Props) {
  return (
    <div
      style={{
        width: 180,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--proof-border)",
        background: "var(--proof-surface)",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          padding: "10px 10px 6px",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--proof-text-secondary)",
        }}
      >
        Quick Actions
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 6px 8px" }}>
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            disabled={busy}
            onClick={() => onAction(action.message)}
            title={action.description}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "7px 8px",
              borderRadius: 6,
              border: "none",
              background: "none",
              cursor: busy ? "not-allowed" : "pointer",
              textAlign: "left",
              opacity: busy ? 0.5 : 1,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => {
              if (!busy) (e.currentTarget as HTMLButtonElement).style.background = "var(--proof-surface-2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            <span
              style={{
                color: "var(--proof-blue)",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {action.icon}
            </span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-text)", lineHeight: 1.2 }}>
                {action.label}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--proof-text-secondary)",
                  lineHeight: 1.3,
                  marginTop: 1,
                }}
              >
                {action.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

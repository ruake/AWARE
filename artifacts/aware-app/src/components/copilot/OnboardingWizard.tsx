import React from "react";
import { Bot, Sparkles, Zap, Shield, TrendingUp, ArrowRight, X, MessageSquare, Settings, Cpu } from "lucide-react";

interface OnboardingWizardProps {
  onStartChat: (message: string) => void;
  onDismiss: () => void;
}

const FEATURES = [
  {
    icon: <Sparkles size={18} />,
    title: "Analyze Test Failures",
    desc: "Get root-cause analysis for test failures with suggested fixes and impacted areas.",
  },
  {
    icon: <Zap size={18} />,
    title: "Detect Flaky Tests",
    desc: "Identify flaky and unstable tests with statistical analysis across recent runs.",
  },
  {
    icon: <Shield size={18} />,
    title: "Promotion Gate Check",
    desc: "Verify promotion readiness with pass-rate thresholds and environment comparisons.",
  },
  {
    icon: <TrendingUp size={18} />,
    title: "Compare Environments",
    desc: "Track trends across QA, UAT, and PROD with historical pass-rate visualizations.",
  },
];

const PROMPTS = [
  "What's the current health status?",
  "Show me flaky tests",
  "Can we promote to PROD?",
  "What failed in the latest run?",
  "Compare QA, UAT, and PROD",
  "Show suite health breakdown",
];

const STEPS = [
  { icon: <Cpu size={14} />, title: "Select a provider", desc: "Choose OpenAI, WebLLM, or Chrome AI" },
  { icon: <Settings size={14} />, title: "Configure your settings", desc: "Set API keys or download models" },
  { icon: <MessageSquare size={14} />, title: "Ask a question", desc: "Use a quick action or type your own" },
];

export default function OnboardingWizard({ onStartChat, onDismiss }: OnboardingWizardProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        overflow: "hidden",
        minHeight: 0,
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          height: "100%",
          overflowY: "auto",
          padding: "40px 24px 60px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          aria-label="Close onboarding"
          title="Dismiss"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            color: "var(--proof-text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all var(--proof-transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--proof-surface-hover)";
            e.currentTarget.style.color = "var(--proof-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--proof-surface)";
            e.currentTarget.style.color = "var(--proof-text-muted)";
          }}
        >
          <X size={15} />
        </button>

        {/* Bot icon */}
        <div
          aria-hidden="true"
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.08))",
            border: "1px solid var(--proof-blue-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 24px var(--proof-blue-glow), 0 0 0 1px var(--proof-blue-border)",
            flexShrink: 0,
          }}
        >
          <Bot size={34} style={{ color: "var(--proof-blue-bright)" }} />
        </div>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--proof-text)",
              margin: 0,
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
            }}
          >
            Welcome to A.W.A.R.E. Copilot
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--proof-text-secondary)",
              margin: "8px 0 0",
              lineHeight: 1.5,
            }}
          >
            Your AI-powered test observability assistant — analyze regressions, detect flakes,
            and accelerate deployments across QA, UAT, and PROD.
          </p>
        </div>

        {/* Feature cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            width: "100%",
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: "var(--proof-surface)",
                border: "1px solid var(--proof-border)",
                borderRadius: 12,
                padding: "14px 14px 16px",
                transition: "all var(--proof-transition)",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--proof-border-accent)";
                e.currentTarget.style.background = "var(--proof-surface-hover)";
                e.currentTarget.style.boxShadow = "var(--proof-shadow-card-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--proof-border)";
                e.currentTarget.style.background = "var(--proof-surface)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "var(--proof-blue-bg)",
                  border: "1px solid var(--proof-blue-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--proof-blue-bright)",
                  marginBottom: 10,
                }}
              >
                {f.icon}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--proof-text)",
                  marginBottom: 4,
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--proof-text-secondary)",
                  lineHeight: 1.45,
                }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Suggested prompts */}
        <div style={{ width: "100%" }}>
          <h2
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              margin: 0,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}
          >
            Try asking…
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => onStartChat(p)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 14px",
                  borderRadius: 999,
                  border: "1px solid var(--proof-blue-border)",
                  background: "var(--proof-blue-bg)",
                  color: "var(--proof-blue-bright)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  transition: "all var(--proof-transition)",
                  lineHeight: 1.3,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--proof-blue-bg-strong)";
                  e.currentTarget.style.borderColor = "var(--proof-blue-border)";
                  e.currentTarget.style.boxShadow = "0 0 12px var(--proof-blue-glow)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--proof-blue-bg)";
                  e.currentTarget.style.borderColor = "var(--proof-blue-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Step-by-step guide */}
        <div
          style={{
            width: "100%",
            background: "var(--proof-surface)",
            border: "1px solid var(--proof-border)",
            borderRadius: 12,
            padding: "18px 20px",
          }}
        >
          <h2
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              margin: 0,
              marginBottom: 14,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}
          >
            How It Works
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {STEPS.map((step) => (
              <div
                key={step.title}
                style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--proof-blue-bg)",
                    border: "1px solid var(--proof-blue-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--proof-blue-bright)",
                    flexShrink: 0,
                  }}
                >
                  {step.icon}
                </div>
                <div style={{ flex: 1, paddingTop: 3 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--proof-text)",
                      marginBottom: 2,
                    }}
                  >
                    {step.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--proof-text-secondary)" }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Single primary CTA */}
        <button
          onClick={onDismiss}
          autoFocus
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 28px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, var(--proof-blue), var(--proof-blue-hover))",
            color: "#fff",
            cursor: "pointer",
            fontSize: 13.5,
            fontWeight: 700,
            transition: "all var(--proof-transition)",
            boxShadow: "0 0 20px var(--proof-blue-glow)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 28px var(--proof-blue-glow), 0 0 0 2px var(--proof-blue-border)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 0 20px var(--proof-blue-glow)";
            e.currentTarget.style.transform = "none";
          }}
        >
          Start Exploring
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

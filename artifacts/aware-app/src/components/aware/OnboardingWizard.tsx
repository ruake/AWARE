import React, { useState, useCallback } from "react";
import { Rocket, LayoutDashboard, GitCompare, BarChart3, Keyboard, X } from "lucide-react";

const LS_KEY = "aware-onboarding-v1";

interface Step {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  content: React.ReactNode;
}

const STEPS: Step[] = [
  {
    icon: Rocket,
    title: "Welcome to A.W.A.R.E.",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0 }}>
          <strong style={{ color: "var(--proof-text)" }}>A.W.A.R.E.</strong> — Akamai Web Analytics & Regression
          Engine — is a unified observability dashboard for CDN test automation.
        </p>
        <p style={{ margin: 0 }}>
          Monitor Playwright and pytest regression suites across all Akamai edge
          environments from a single pane of glass.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
          {[
            "Track test pass rates across 6 environments",
            "Compare baseline vs. candidate runs",
            "Detect anomalies and flaky tests",
            "AI-powered analysis with Copilot",
          ].map((text) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--proof-blue)",
                  flexShrink: 0,
                }}
              />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: LayoutDashboard,
    title: "Environments & Networks",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0 }}>
          AWARE monitors tests across <strong style={{ color: "var(--proof-text)" }}>3 tiers</strong> and{" "}
          <strong style={{ color: "var(--proof-text)" }}>2 networks</strong>, yielding{" "}
          <strong style={{ color: "var(--proof-text)" }}>6 environments</strong>:
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            padding: "8px 0",
          }}
        >
          {[
            { tier: "QA", color: "var(--proof-emerald)" },
            { tier: "UAT", color: "var(--proof-indigo)" },
            { tier: "PROD", color: "var(--proof-text-muted)" },
          ].map(({ tier, color }) => (
            <div
              key={tier}
              style={{
                background: "var(--proof-surface-2)",
                borderRadius: 12,
                padding: "12px 8px",
                textAlign: "center",
                border: "1px solid var(--proof-border)",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color, marginBottom: 4 }}>{tier}</div>
              <div style={{ fontSize: 11, color: "var(--proof-text-muted)", lineHeight: 1.8 }}>
                staging<br />production
              </div>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 13 }}>
          The <strong style={{ color: "var(--proof-text)" }}>promotion gate</strong> requires UAT regression &ge; 95% pass
          rate before activating PROD properties.
        </p>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: "Key Pages",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Dashboard", key: "g d", desc: "KPIs, anomalies, sparklines" },
          { label: "Runs", key: "g r", desc: "Filterable test history" },
          { label: "Compare", key: "g c", desc: "Baseline vs candidate diffs" },
          { label: "Trends", key: "g t", desc: "Charts, flakiness, heatmaps" },
          { label: "Copilot", key: "g p", desc: "AI analysis assistant" },
        ].map(({ label, key: k, desc }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: "var(--proof-surface-2)",
              borderRadius: 10,
              border: "1px solid var(--proof-border)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: "var(--proof-text)", fontSize: 14 }}>{label}</div>
              <div style={{ fontSize: 12, color: "var(--proof-text-muted)" }}>{desc}</div>
            </div>
            <kbd
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                padding: "2px 8px",
                background: "var(--proof-surface)",
                border: "1px solid var(--proof-border)",
                borderRadius: 4,
                color: "var(--proof-blue-bright)",
              }}
            >
              {k}
            </kbd>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Keyboard,
    title: "Keyboard Shortcuts",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--proof-text-muted)",
            marginBottom: 4,
          }}
        >
          Navigation (press g then letter)
        </div>
        {[
          { keys: "g d", desc: "Dashboard" },
          { keys: "g r", desc: "Runs" },
          { keys: "g c", desc: "Compare" },
          { keys: "g t", desc: "Trends" },
          { keys: "g p", desc: "Copilot" },
        ].map(({ keys, desc }) => (
          <div key={keys} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>{desc}</span>
            <kbd
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                padding: "2px 8px",
                background: "var(--proof-surface-2)",
                border: "1px solid var(--proof-border)",
                borderRadius: 4,
                color: "var(--proof-blue-bright)",
              }}
            >
              {keys}
            </kbd>
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--proof-border)", margin: "4px 0", paddingTop: 8 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--proof-text-muted)",
              marginBottom: 4,
            }}
          >
            General
          </div>
          {[
            { keys: "j / k", desc: "Navigate list items" },
            { keys: "?", desc: "Toggle shortcut help" },
            { keys: "Esc", desc: "Close / Cancel" },
          ].map(({ keys, desc }) => (
            <div
              key={keys}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}
            >
              <span style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>{desc}</span>
              <kbd
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  padding: "2px 8px",
                  background: "var(--proof-surface-2)",
                  border: "1px solid var(--proof-border)",
                  borderRadius: 4,
                  color: "var(--proof-blue-bright)",
                }}
              >
                {keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export function useOnboarding(): { show: boolean; dismiss: () => void } {
  const [show, setShow] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) !== "dismissed";
    } catch {
      return true;
    }
  });

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, "dismissed");
    } catch {}
    setShow(false);
  }, []);

  return { show, dismiss };
}

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const current = STEPS[step]!;
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "copilotFadeIn 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onComplete();
      }}
    >
      <div
        style={{
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border)",
          borderRadius: 20,
          padding: 0,
          maxWidth: 520,
          width: "90%",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onComplete}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            color: "var(--proof-text-muted)",
            cursor: "pointer",
            padding: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            zIndex: 1,
          }}
          aria-label="Close onboarding"
        >
          <X size={18} />
        </button>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "28px 32px 0" }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i <= step ? "var(--proof-blue)" : "var(--proof-border)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "24px 32px 0" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "var(--proof-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--proof-border)",
            }}
          >
            <Icon size={28} style={{ color: "var(--proof-blue-bright)" }} />
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "16px 32px 0" }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--proof-text)",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            {current.title}
          </h2>
        </div>

        <div
          style={{
            padding: "16px 32px 24px",
            color: "var(--proof-text-secondary)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {current.content}
        </div>

        {isLast && (
          <div style={{ padding: "0 32px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id="onboarding-dont-show"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ accentColor: "var(--proof-blue)", cursor: "pointer" }}
            />
            <label
              htmlFor="onboarding-dont-show"
              style={{ fontSize: 13, color: "var(--proof-text-secondary)", cursor: "pointer", userSelect: "none" }}
            >
              Don't show this again
            </label>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 32px 24px",
            borderTop: "1px solid var(--proof-border)",
          }}
        >
          <div>
            {!isLast && (
              <button
                onClick={onComplete}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--proof-text-muted)",
                  fontSize: 13,
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: 8,
                }}
              >
                Skip
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!isFirst && (
              <button
                onClick={handleBack}
                style={{
                  background: "var(--proof-surface-2)",
                  border: "1px solid var(--proof-border)",
                  color: "var(--proof-text)",
                  padding: "8px 20px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="proof-btn proof-btn-primary"
              style={{ padding: "8px 24px", fontSize: 13 }}
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

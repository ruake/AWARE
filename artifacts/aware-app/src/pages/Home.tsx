import React from "react";
import { useLocation } from "wouter";
import { RUNS, getEnvLabels } from "@/lib/data";
import { getAutoDiscoveredTests } from "@/lib/testDiscovery";
import PoPGlobe from "@/components/aware/PoPGlobe";

export default function Home() {
  const [, navigate] = useLocation();

  const totalRuns = RUNS.length;
  const passRate =
    totalRuns > 0 ? Math.round(RUNS.reduce((s, r) => s + r.passPct, 0) / totalRuns) : 0;
  const totalTestCases = getAutoDiscoveredTests().length;
  const envCount = getEnvLabels().length;

  const stats = React.useMemo(
    () => [
      { label: "Total Runs", value: totalRuns },
      { label: "Pass Rate", value: `${passRate}%` },
      { label: "Test Cases", value: totalTestCases },
      { label: "Environments", value: envCount },
    ],
    [totalRuns, passRate, totalTestCases, envCount],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--proof-bg)",
        color: "var(--proof-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Hero */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "40px 48px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: 1100,
            width: "100%",
            gap: 48,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "var(--proof-blue)",
                marginBottom: 14,
              }}
            >
              Bring Your Own Testing Tool
            </div>
            <h1
              style={{
                fontSize: 52,
                fontWeight: 800,
                letterSpacing: "-2px",
                lineHeight: 1.08,
                margin: 0,
                background: "linear-gradient(135deg, var(--proof-text) 0%, var(--proof-blue) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              A.W.A.R.E.
            </h1>
            <p
              style={{
                fontSize: 17,
                color: "var(--proof-text-secondary)",
                marginTop: 16,
                marginBottom: 0,
                lineHeight: 1.6,
                maxWidth: 460,
              }}
            >
              Plug in any test framework. We handle the runs, collect every result, and surface
              analytics and AI-powered insights so your team ships with confidence.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 20,
                marginBottom: 4,
              }}
            >
              {["pytest", "Jest", "Playwright", "Cypress", "k6", "custom"].map((fw) => (
                <span
                  key={fw}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: "rgba(91,138,245,0.1)",
                    border: "1px solid rgba(91,138,245,0.25)",
                    color: "var(--proof-blue)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {fw}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={() => navigate("/start")}
                className="proof-button-primary"
                style={{ padding: "11px 26px", fontSize: 14 }}
              >
                Connect a Runner
              </button>
              <button
                onClick={() => navigate("/")}
                className="proof-button"
                style={{ padding: "11px 26px", fontSize: 14 }}
              >
                View Dashboard
              </button>
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <PoPGlobe size={500} interactive={false} />
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section
        style={{
          padding: "48px 48px 64px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            Live Stats
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
            }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="proof-card"
                style={{
                  padding: "20px 16px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "var(--proof-blue)",
                    letterSpacing: "-0.5px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--proof-text-secondary)",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        style={{
          padding: "48px 48px 80px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 1100, width: "100%" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            Features
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {[
              {
                title: "Any Test Framework",
                body: "Bring pytest, Jest, Playwright, Cypress, k6, or any custom runner. Connect via our lightweight SDK or CLI — no rewrites required.",
              },
              {
                title: "We Run & Collect",
                body: "Schedule runs across environments and targets. Every result, log, and duration is captured and stored in full history automatically.",
              },
              {
                title: "Analytics & AI Copilot",
                body: "Pass/fail trends, flaky test detection, regression risk scoring, and an AI copilot that answers questions about your data in plain English.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="proof-card"
                style={{
                  padding: "28px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 3,
                    borderRadius: 2,
                    background:
                      "linear-gradient(90deg, var(--proof-blue) 0%, var(--proof-purple) 100%)",
                    marginBottom: 4,
                  }}
                />
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--proof-text)",
                  }}
                >
                  {f.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--proof-text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {f.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "24px 48px",
          fontSize: 11,
          color: "var(--proof-text-muted)",
          borderTop: "1px solid var(--proof-border)",
        }}
      >
        A.W.A.R.E. &middot; Akamai Web Analytics Regression Engine &middot; Open source &middot; MIT
        License
      </footer>
    </div>
  );
}

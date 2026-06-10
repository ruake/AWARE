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
            <h1
              style={{
                fontSize: 48,
                fontWeight: 800,
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
                margin: 0,
                background: "linear-gradient(135deg, var(--proof-text) 0%, var(--proof-blue) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              PROOF
            </h1>
            <p
              style={{
                fontSize: 16,
                color: "var(--proof-text-secondary)",
                marginTop: 12,
                marginBottom: 0,
                lineHeight: 1.5,
                maxWidth: 420,
              }}
            >
              CDN Observability Platform — Monitor, compare, and validate CDN behavior across
              environments with automated regression testing.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button
                onClick={() => navigate("/start")}
                className="proof-button-primary"
                style={{ padding: "10px 24px", fontSize: 14 }}
              >
                Get Started
              </button>
              <button
                onClick={() => navigate("/")}
                className="proof-button"
                style={{ padding: "10px 24px", fontSize: 14 }}
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
                title: "Real-time Monitoring",
                body: "Track CDN behavior across environments with live dashboards and automated regression detection.",
              },
              {
                title: "Smart Alerts",
                body: "Anomaly detection and regression alerts powered by statistical analysis and configurable thresholds.",
              },
              {
                title: "Team Collaboration",
                body: "Share reports, compare results, and approve promotions with your team.",
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
        PROOF CDN Observability Platform &middot; Open source &middot; MIT License
      </footer>
    </div>
  );
}

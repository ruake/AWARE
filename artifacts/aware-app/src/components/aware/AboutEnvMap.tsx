import React from "react";
import { Network } from "lucide-react";
import { AboutSection } from "./AboutSection";

export function AboutEnvMap() {
  return (
    <AboutSection
      color="var(--proof-green)"
      title="Environment Map"
      glow="var(--proof-green-glow)"
    >
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          {
            tier: "QA",
            color: "var(--proof-green)",
            desc: "First gate — daily Playwright + pytest",
            envs: ["QA / Staging", "QA / Production"],
          },
          {
            tier: "UAT",
            color: "var(--proof-yellow)",
            desc: "Stakeholder acceptance environment",
            envs: ["UAT / Staging", "UAT / Production"],
          },
          {
            tier: "PROD",
            color: "var(--proof-red)",
            desc: "Live edge — Akamai property active",
            envs: ["PROD / Staging", "PROD / Production"],
          },
        ].map((t) => (
          <div
            key={t.tier}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-subtle-bg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>
                {t.tier}
              </span>
              <span style={{ fontSize: 11, color: "var(--proof-text-muted)", marginLeft: "auto" }}>
                {t.desc}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {t.envs.map((e) => (
                <span
                  key={e}
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "var(--proof-text-secondary)",
                    background: "var(--proof-subtle-bg2)",
                    border: "1px solid var(--proof-border)",
                    borderRadius: 5,
                    padding: "2px 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Network size={9} style={{ opacity: 0.5 }} /> {e}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AboutSection>
  );
}

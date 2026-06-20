import React from "react";
import { Activity, Github, ExternalLink, ArrowUpRight } from "lucide-react";

export function AboutHero() {
  return (
    <div
      style={{
        padding: "32px 36px",
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.5,
          background:
            "radial-gradient(ellipse at top right, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at bottom left, rgba(139,92,246,0.06) 0%, transparent 60%)",
        }}
      />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
            }}
          >
            <Activity size={24} style={{ color: "white" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: "var(--proof-text)",
                  letterSpacing: "-1px",
                }}
              >
                A.W.A.R.E.
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--proof-text-muted)",
                  fontFamily: "var(--font-mono)",
                  background: "var(--proof-subtle-bg2)",
                  border: "1px solid var(--proof-border)",
                  padding: "2px 8px",
                  borderRadius: 5,
                }}
              >
                v1.0.0
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--proof-text-secondary)",
                letterSpacing: "-0.1px",
                marginTop: 2,
              }}
            >
              Akamai Web Analytics Regression Engine
            </div>
          </div>
        </div>
        <p
          style={{
            fontSize: 14,
            color: "var(--proof-text-secondary)",
            margin: 0,
            maxWidth: 680,
            lineHeight: 1.6,
            letterSpacing: "-0.1px",
          }}
        >
          CDN test observability dashboard. Monitors Playwright + pytest suites across{" "}
          <strong style={{ color: "var(--proof-text)" }}>QA → UAT → PROD</strong>, each with staging
          and production networks, and enforces a{" "}
          <strong style={{ color: "var(--proof-green)" }}>≥95% pass-rate promotion gate</strong>{" "}
          before each tier advances.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--proof-text)",
              background: "var(--proof-subtle-bg2)",
              border: "1px solid var(--proof-border-strong)",
              borderRadius: 8,
              padding: "6px 14px",
              textDecoration: "none",
              transition: "border-color 0.13s, background 0.13s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-accent)";
              (e.currentTarget as HTMLElement).style.background = "var(--proof-blue-bg)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-strong)";
              (e.currentTarget as HTMLElement).style.background = "var(--proof-subtle-bg2)";
            }}
          >
            <Github size={14} /> GitHub Repo <ExternalLink size={10} style={{ opacity: 0.6 }} />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--proof-blue-bright)",
              background: "var(--proof-blue-bg)",
              border: "1px solid var(--proof-border-accent)",
              borderRadius: 8,
              padding: "6px 14px",
              textDecoration: "none",
              transition: "border-color 0.13s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-blue)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-accent)";
            }}
          >
            CI Workflow <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

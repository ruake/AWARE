import React from "react";
import { Activity, Github, ExternalLink, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export function AboutHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        padding: "32px 36px",
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at top right, var(--proof-blue-glow) 0%, transparent 60%), radial-gradient(ellipse at bottom left, var(--proof-purple-glow) 0%, transparent 60%)",
        }}
      />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, var(--proof-blue) 0%, var(--proof-emerald) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px var(--proof-blue-glow)",
            }}
          >
            <Activity size={24} style={{ color: "white" }} />
          </motion.div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: "var(--proof-text)",
                  letterSpacing: "-1px",
                  background: "linear-gradient(to right, var(--proof-text), var(--proof-text-secondary))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
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
                  borderRadius: "var(--proof-radius-sm)",
                }}
              >
                v3.0.4
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
          <motion.a
            whileHover={{ y: -2, backgroundColor: "var(--proof-blue-bg)", borderColor: "var(--proof-border-accent)" }}
            whileTap={{ scale: 0.98 }}
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--proof-text)",
              background: "var(--proof-subtle-bg2)",
              border: "1px solid var(--proof-border-strong)",
              borderRadius: 8,
              padding: "6px 14px",
              textDecoration: "none",
              transition: "border-color 0.13s, background 0.13s",
            }}
          >
            <Github size={14} /> GitHub Repo <ExternalLink size={10} style={{ opacity: 0.6 }} />
          </motion.a>
          <motion.a
            whileHover={{ y: -2, borderColor: "var(--proof-blue)" }}
            whileTap={{ scale: 0.98 }}
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--proof-blue-bright)",
              background: "var(--proof-blue-bg)",
              border: "1px solid var(--proof-border-accent)",
              borderRadius: 8,
              padding: "6px 14px",
              textDecoration: "none",
              transition: "border-color 0.13s",
            }}
          >
            CI Workflow <ArrowUpRight size={12} />
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}

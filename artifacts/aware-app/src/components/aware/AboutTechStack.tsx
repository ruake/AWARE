import React from "react";
import { AboutSection } from "./AboutSection";
import { motion } from "framer-motion";

const STACK = [
  { label: "React 19", sub: "UI framework", color: "var(--proof-blue)" },
  { label: "TypeScript 5", sub: "Type safety", color: "var(--proof-purple)" },
  { label: "Vite 7", sub: "Build tool", color: "var(--proof-yellow)" },
  { label: "Recharts", sub: "Data viz", color: "var(--proof-green)" },
  { label: "GitHub Actions", sub: "CI/CD", color: "var(--proof-text-secondary)" },
  { label: "Playwright", sub: "E2E testing", color: "var(--proof-cyan)" },
  { label: "pytest", sub: "API testing", color: "var(--proof-orange)" },
  { label: "wouter", sub: "Routing", color: "var(--proof-red)" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

export function AboutTechStack() {
  return (
    <AboutSection
      color="var(--proof-purple)"
      title="Tech Stack"
      glow="var(--proof-purple-glow)"
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        {STACK.map((s) => (
          <motion.div
            key={s.label}
            variants={item}
            whileHover={{ scale: 1.02, backgroundColor: "var(--proof-subtle-bg2)" }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-subtle-bg)",
              transition: "background-color 0.2s",
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 700, color: s.color }}>{s.label}</span>
            <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>{s.sub}</span>
          </motion.div>
        ))}
      </motion.div>
    </AboutSection>
  );
}

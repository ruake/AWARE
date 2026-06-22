import React from "react";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { AboutSection } from "./AboutSection";
import { motion } from "framer-motion";

export function AboutTestCategories({ categories }: { categories: Record<string, number> }) {
  const total = Object.values(categories).reduce((s, c) => s + c, 0);
  return (
    <PanelErrorBoundary label="Test categories">
      <AboutSection color="var(--proof-cyan)" title="Test Coverage by Category">
        <div
          style={{
            padding: "16px 20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          {Object.entries(categories).map(([cat, count]) => {
            const pct = Math.round((count / total) * 100);
            return (
              <div key={cat} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "var(--proof-text-secondary)",
                      textTransform: "capitalize",
                    }}
                  >
                    {cat}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      color: "var(--proof-text-muted)",
                    }}
                  >
                    {String(count)}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "var(--proof-bar-track)",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    viewport={{ once: true }}
                    style={{
                      height: "100%",
                      background: "var(--proof-blue)",
                      borderRadius: 99,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </AboutSection>
    </PanelErrorBoundary>
  );
}

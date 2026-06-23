import React from "react";
import { motion } from "framer-motion";

export function AboutSection({
  color,
  title,
  badge,
  glow,
  children,
}: {
  color: string;
  title: string;
  badge?: string;
  glow?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      style={{
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: "var(--proof-radius-xl)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px 14px",
          borderBottom: "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <motion.div
          animate={{
            opacity: [1, 0.6, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: 3,
            height: 18,
            borderRadius: 99,
            background: color,
            boxShadow: glow ?? "none",
          }}
        />
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: "var(--proof-text)",
            letterSpacing: "-0.2px",
          }}
        >
          {title}
        </span>
        {badge && (
          <span
            style={{
              fontSize: 11,
              color: "var(--proof-text-muted)",
              background: "var(--proof-subtle-bg2)",
              border: "1px solid var(--proof-border)",
              borderRadius: 999,
              padding: "1px 8px",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

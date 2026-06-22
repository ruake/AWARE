import React from "react";
import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, actions, icon, children }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
        paddingBottom: 8,
        borderBottom: "1px solid var(--proof-border)",
        position: "relative",
        marginBottom: 20,
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          position: "absolute",
          bottom: -1,
          left: 0,
          width: 60,
          height: 2,
          background: "var(--proof-blue)",
          borderRadius: 99,
          boxShadow: "0 0 8px var(--proof-blue-glow)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icon && (
          <div style={{ 
            color: "var(--proof-blue)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: 32,
            height: 32,
            background: "var(--proof-blue-bg)",
            borderRadius: 8,
            border: "1px solid var(--proof-blue-border)",
          }}>
            {React.isValidElement(icon) 
              ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 18 }) 
              : icon}
          </div>
        )}
        <div>
          <h1 style={{ 
            fontSize: 13, 
            fontWeight: 700, 
            color: "var(--proof-text)", 
            margin: 0,
            letterSpacing: "0.1em",
            textTransform: "uppercase"
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ 
              fontSize: 11, 
              color: "var(--proof-text-secondary)", 
              marginTop: 2,
              marginBottom: 0,
              fontWeight: 500,
              letterSpacing: "0.02em"
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ 
        display: "flex", 
        gap: 8, 
        alignItems: "center",
        marginBottom: 2
      }}>
        {actions}
        {children}
      </div>
    </div>
  );
}


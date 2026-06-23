import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function SectionHeader({ title, subtitle, actions, icon, children, as: Tag = "h1" }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
        padding: "4px 0 4px 16px",
        position: "relative",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: 3,
          background: "var(--proof-blue)",
          boxShadow: "var(--proof-glow-cyan)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icon && (
          <div style={{ 
            color: "var(--proof-blue)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
          }}>
            {React.isValidElement(icon) 
              ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 18 }) 
              : icon}
          </div>
        )}
        <div>
          <Tag style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            color: "var(--proof-text)", 
            margin: 0,
            letterSpacing: "0.1em",
            textTransform: "uppercase"
          }}>
            {title}
          </Tag>
          {subtitle && (
            <p style={{ 
              fontSize: 11, 
              color: "var(--proof-text-secondary)", 
              marginTop: 4,
              marginBottom: 0,
              fontWeight: 500,
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
      }}>
        {actions}
        {children}
      </div>
    </div>
  );
}

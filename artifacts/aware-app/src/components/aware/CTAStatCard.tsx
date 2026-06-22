import React from "react";
import { motion } from "framer-motion";

interface CTAStatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  onClick?: () => void;
  active?: boolean;
  accentColor?: string;
  icon?: React.ReactNode;
}

export function CTAStatCard({
  label,
  value,
  subtitle,
  onClick,
  active,
  accentColor = "var(--proof-blue)",
  icon,
}: CTAStatCardProps) {
  const [hovered, setHovered] = React.useState(false);

  const isInteractive = !!onClick;
  const isHighlit = active || hovered;

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => isInteractive && setHovered(true)}
      onMouseLeave={() => isInteractive && setHovered(false)}
      whileHover={isInteractive ? { y: -3, scale: 1.01 } : {}}
      whileTap={isInteractive ? { scale: 0.98 } : {}}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "16px 20px",
        background: active
          ? `linear-gradient(135deg, ${accentColor}12 0%, transparent 60%)`
          : hovered
            ? "var(--proof-surface-hover)"
            : "var(--proof-surface)",
        border: `1px solid ${isHighlit ? accentColor + "50" : "var(--proof-border)"}`,
        borderTop: `3px solid ${isHighlit ? accentColor : "var(--proof-border-strong)"}`,
        borderRadius: 16,
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.15s ease, border-color 0.15s ease",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        userSelect: "none",
        boxShadow: active 
          ? `0 8px 24px ${accentColor}15, 0 0 0 1px ${accentColor}20` 
          : "0 2px 12px rgba(0,0,0,0.4)",
      }}
    >
      {/* Label + Icon row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: isHighlit ? accentColor : "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            transition: "color 0.15s ease",
          }}
        >
          {label}
        </span>
        {icon && (
          <div
            style={{
              color: accentColor,
              opacity: isHighlit ? 1 : 0.4,
              transition: "opacity 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {React.isValidElement(icon) 
              ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 14 }) 
              : icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "var(--font-mono)",
          color: "var(--proof-text)",
          letterSpacing: "-1.5px",
          lineHeight: 1,
          zIndex: 1,
        }}
      >
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: 11,
            color: "var(--proof-text-muted)",
            marginTop: 2,
            fontWeight: 500,
            zIndex: 1,
          }}
        >
          {subtitle}
        </div>
      )}

      {/* Background glow when active */}
      {active && (
        <div
          style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Active indicator bar at bottom */}
      {active && (
        <motion.div
          layoutId="active-bar"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: accentColor,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />
      )}
    </motion.div>
  );
}

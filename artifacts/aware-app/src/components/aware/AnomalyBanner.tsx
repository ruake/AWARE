import React from "react";
import { AlertTriangle, AlertCircle, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AnomalyBannerProps {
  hasAlert: boolean;
  hasDegradation: boolean;
  regressions: number;
  degradedTiers: string;
  onInvestigate: () => void;
  onDismiss?: () => void;
  count?: number;
}

export function AnomalyBanner({
  hasAlert,
  hasDegradation,
  regressions,
  degradedTiers,
  onInvestigate,
  onDismiss,
  count,
}: AnomalyBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);
  if ((!hasAlert && !hasDegradation) || dismissed) return null;
  const isCritical = hasAlert;

  const color = isCritical ? "var(--proof-red)" : "var(--proof-yellow)";
  const colorBright = isCritical ? "var(--proof-red-bright)" : "var(--proof-yellow-bright)";
  const colorBg = isCritical ? "var(--proof-red-bg-strong)" : "var(--proof-yellow-bg)";
  const colorBorder = isCritical ? "var(--proof-red-border)" : "var(--proof-yellow-border)";
  const colorIconBg = isCritical ? "var(--proof-red-bg)" : "var(--proof-yellow-bg)";
  const Icon = isCritical ? AlertCircle : AlertTriangle;

  const message = isCritical
    ? regressions > 0
      ? `${regressions} regression${regressions !== 1 ? "s" : ""} detected — immediate action required`
      : "Critical environment failure — pass rate below minimum threshold"
    : `${degradedTiers} degraded — pass rate below promotion gate`;

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      setTimeout(onDismiss, 300);
    }
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderRadius: 16,
            background: colorBg,
            border: `1px solid ${colorBorder}`,
            borderLeft: `5px solid ${color}`,
            boxShadow: isCritical 
              ? `0 8px 32px rgba(239, 68, 68, 0.15), 0 0 0 1px ${colorBorder}`
              : `0 8px 32px rgba(245, 158, 11, 0.1), 0 0 0 1px ${colorBorder}`,
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Pulsing indicator for critical */}
          {isCritical && (
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: "absolute",
                top: -1,
                left: -1,
                right: -1,
                bottom: -1,
                borderRadius: 16,
                border: `1px solid ${color}`,
                pointerEvents: "none",
              }}
            />
          )}

          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: colorIconBg,
              border: `1px solid ${colorBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 2px 8px ${color}20`,
            }}
          >
            <Icon size={16} strokeWidth={2.5} style={{ color: colorBright }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: colorBright,
                lineHeight: 1.2,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {count && count > 0 ? (
                <span style={{ 
                  background: colorBright, 
                  color: "white", 
                  fontSize: 10, 
                  padding: "1px 6px", 
                  borderRadius: 99,
                  fontWeight: 900
                }}>
                  {count}
                </span>
              ) : null}
              {message}
            </div>
            {isCritical && (
              <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 4, fontWeight: 500 }}>
                Review the Compare page to identify affected tests and determine root cause.
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onInvestigate}
              style={{
                background: colorBright,
                color: isCritical ? "white" : "var(--proof-surface)",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                boxShadow: `0 4px 12px ${color}30`,
              }}
            >
              Investigate <ArrowRight size={12} strokeWidth={3} />
            </motion.button>
            
            {onDismiss && (
              <motion.button
                whileHover={{ background: colorBorder }}
                onClick={handleDismiss}
                aria-label="Dismiss banner"
                style={{
                  background: "transparent",
                  border: `1px solid ${colorBorder}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colorBright,
                  transition: "background 0.15s",
                }}
              >
                <X size={14} strokeWidth={2.5} />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import React, { useEffect, useState } from "react";
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
  const [dismissed, setDismissed] = useState(false);

  const sessionKey = `aware-anomaly-dismissed-${hasAlert ? "alert" : "deg"}-${regressions}-${degradedTiers}`;

  useEffect(() => {
    const isDismissed = sessionStorage.getItem(sessionKey) === "true";
    setDismissed(isDismissed);
  }, [sessionKey]);

  if ((!hasAlert && !hasDegradation) || dismissed) return null;

  const isCritical = hasAlert;

  const color = isCritical ? "var(--proof-red)" : "var(--proof-yellow)";
  const colorBright = isCritical ? "var(--proof-red-bright)" : "var(--proof-yellow-bright)";
  const colorBg = isCritical ? "var(--proof-red-bg)" : "var(--proof-yellow-bg)";
  const colorBorder = isCritical ? "var(--proof-red-border)" : "var(--proof-yellow-border)";
  const colorIconBg = isCritical ? "var(--proof-red-glow)" : "var(--proof-yellow-glow)";
  const Icon = isCritical ? AlertCircle : AlertTriangle;

  const message = isCritical
    ? regressions > 0
      ? `${regressions} regression${regressions !== 1 ? "s" : ""} detected — immediate action required`
      : "Critical environment failure — pass rate below minimum threshold"
    : `${degradedTiers} degraded — pass rate below promotion gate`;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(sessionKey, "true");
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
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            overflow: "hidden"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 20px",
              background: colorBg,
              borderBottom: `1px solid ${colorBorder}`,
              borderLeft: `4px solid ${color}`,
              position: "relative",
              zIndex: 10,
              width: "100%",
            }}
          >
            {isCritical && (
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: -4,
                  bottom: 0,
                  width: 4,
                  background: colorBright,
                  pointerEvents: "none",
                }}
              />
            )}

            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: colorIconBg,
                border: `1px solid ${colorBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 2px 12px ${color}30`,
              }}
            >
              <Icon size={20} strokeWidth={2.5} style={{ color: colorBright }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--proof-text)",
                  lineHeight: 1.4,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {count && count > 0 ? (
                  <span style={{ 
                    background: colorBright, 
                    color: "#000", 
                    fontSize: 11, 
                    padding: "2px 8px", 
                    borderRadius: 99,
                    fontWeight: 800
                  }}>
                    {count}
                  </span>
                ) : null}
                {message}
              </div>
              {isCritical && (
                <div style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 2, fontWeight: 400 }}>
                  Review the Compare page to identify affected tests and determine root cause.
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, flexShrink: 0, alignItems: "center" }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onInvestigate}
                style={{
                  background: colorBright,
                  color: "#000",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: `0 4px 12px ${color}30`,
                }}
              >
                Investigate <ArrowRight size={14} strokeWidth={2.5} />
              </motion.button>
              
              <motion.button
                whileHover={{ background: "var(--proof-hover)" }}
                onClick={handleDismiss}
                aria-label="Dismiss banner"
                style={{
                  background: "transparent",
                  border: `1px solid transparent`,
                  borderRadius: 6,
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--proof-text-secondary)",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <X size={16} strokeWidth={2.5} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

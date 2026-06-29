import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToRuns, getRuns } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { getSelectedSuiteSnapshot, subscribeToSelectedSuites } from "@/lib/filters";
import { RunsPanel } from "./sidebar/RunsPanel";
import { ComparePanel } from "./sidebar/ComparePanel";
import { TrendsPanel } from "./sidebar/TrendsPanel";
import { TestsPanel } from "./sidebar/TestsPanel";
import { CopilotPanel } from "./sidebar/CopilotPanel";
import { X, Activity, Clock, ShieldCheck, Bot } from "lucide-react";

interface ConsoleSidebarProps {
  activePanel: string;
  visible: boolean;
  onClose: () => void;
}

const PANEL_LABELS: Record<string, string> = {
  dashboard: "Overview",
  runs: "Run History",
  compare: "Comparison",
  trends: "Analytics",
  suites: "Suites",
  tests: "Test Explorer",
  copilot: "AWARE Copilot",
  about: "AWARE Engine",
};

const PANEL_ACCENTS: Record<string, string> = {
  dashboard: "var(--proof-blue)",
  runs: "var(--proof-green)",
  compare: "var(--proof-purple)",
  trends: "var(--proof-yellow)",
  suites: "var(--proof-cyan)",
  tests: "var(--proof-orange)",
  copilot: "var(--proof-blue-bright)",
  about: "var(--proof-text-muted)",
};

function RunHealthBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      style={{
        width: 32,
        height: 3,
        borderRadius: 99,
        background: "var(--proof-surface)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          height: "100%",
          background: color,
          borderRadius: 99,
        }}
      />
    </div>
  );
}

function RecentRunsList() {
  const [location, navigate] = useLocation();
  const runs = useSyncExternalStore(subscribeToRuns, getRuns);
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const envFilteredRuns =
    envSnap.envIds.length > 0 ? runs.filter((r) => envSnap.envIds.includes(r.envId)) : runs;
  const recent = [...envFilteredRuns]
    .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
    .slice(0, 15);
  const selectedRunId = location.split("/runs/")[1]?.split(/[?/]/)[0] ?? "";

  if (recent.length === 0) return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--proof-text-muted)" }}>
      <Clock size={24} style={{ marginBottom: 12, opacity: 0.2 }} />
      <div style={{ fontSize: 11, fontWeight: 500 }}>No recent runs</div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 16 }}>
      <div
        style={{
          padding: "16px 14px 8px",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--proof-text-muted)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--font-sans)",
        }}
      >
        <Activity size={12} />
        Latest Activity
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
        {recent.map((run, idx) => {
          const pct = run.passPct ?? 0;
          const c =
            pct >= 95
              ? "var(--proof-green)"
              : pct >= 80
                ? "var(--proof-yellow)"
                : "var(--proof-red)";
          const isSelected = run.id === selectedRunId;
          
          return (
            <motion.div
              key={run.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => navigate(`/runs/${run.id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                cursor: "pointer",
                position: "relative",
                borderRadius: "var(--proof-radius-sm)",
                background: isSelected
                  ? "var(--proof-surface-active)"
                  : "transparent",
                border: "1px solid transparent",
                borderColor: isSelected ? "var(--proof-border-strong)" : "transparent",
                transition: "all 0.2s ease",
              }}
              whileHover={{ background: "var(--proof-surface-hover)" }}
            >
              {isSelected && (
                <motion.div
                  layoutId="active-run-indicator"
                  style={{
                    position: "absolute",
                    left: -1,
                    top: 6,
                    bottom: 6,
                    width: 3,
                    background: "var(--proof-blue)",
                    borderRadius: "4px",
                    boxShadow: "var(--proof-glow-cyan)",
                  }}
                />
              )}

              <div style={{ position: "relative", display: "flex", flexShrink: 0 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: c,
                    boxShadow: isSelected ? `0 0 8px ${c}` : "none",
                  }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    color: isSelected ? "var(--proof-text)" : "var(--proof-text-secondary)",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {run.label || run.id}
                </span>
                <span style={{ fontSize: 9, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}>
                  {run.env} · {run.envId}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <RunHealthBar pct={pct} color={c} />
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    color: c,
                    width: 32,
                    textAlign: "right",
                  }}
                >
                  {pct}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function ConsoleSidebar({ activePanel, visible, onClose }: ConsoleSidebarProps) {
  const _envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const _suiteSnap = useSyncExternalStore(subscribeToSelectedSuites, getSelectedSuiteSnapshot);

  if (!visible) return null;

  const headline = PANEL_LABELS[activePanel] || "Explorer";
  const accent = PANEL_ACCENTS[activePanel] || "var(--proof-blue)";

  const renderPanel = () => {
    switch (activePanel) {
      case "dashboard":
        return (
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            <RecentRunsList />
          </div>
        );
      case "runs":
        return <RunsPanel />;
      case "compare":
        return <ComparePanel />;
      case "trends":
        return <TrendsPanel />;
      case "suites":
      case "tests":
        return <TestsPanel />;
      case "copilot":
        return <CopilotPanel />;
      case "about":
        return (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: "var(--proof-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                boxShadow: "var(--proof-glow-cyan)",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </motion.div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--proof-text)", marginBottom: 6, letterSpacing: "-0.02em" }}>
              AWARE v1.0
            </div>
            <div style={{ fontSize: 12, color: "var(--proof-text-muted)", lineHeight: 1.6, maxWidth: 160 }}>
              Akamai Web Analytics Regression Engine
            </div>
            
            <div style={{ marginTop: 40, width: "100%", textAlign: "left" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                Engine Status
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <StatusRow icon={ShieldCheck} label="Core Engine" status="Online" color="var(--proof-green)" />
                <StatusRow icon={Activity} label="Data Pipeline" status="Active" color="var(--proof-green)" />
                <StatusRow icon={Bot} label="AI Copilot" status="Ready" color="var(--proof-blue)" />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <aside
      style={{
        width: 280,
        minWidth: 280,
        background: "var(--proof-surface-2)",
        borderRight: "1px solid var(--proof-border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
        }}
      />

      <div
        style={{
          padding: "0 16px",
          height: 44,
          fontSize: 11,
          fontWeight: 700,
          color: "var(--proof-text)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          borderBottom: "1px solid var(--proof-border-strong)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 10px ${accent}`,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--proof-text-secondary)" }}>{headline}</span>
        </div>
        <motion.button
          onClick={onClose}
          aria-label="Close sidebar"
          whileHover={{ background: "var(--proof-surface)", color: "var(--proof-text)" }}
          whileTap={{ scale: 0.95 }}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-muted)",
            padding: 6,
            display: "flex",
            borderRadius: 8,
            transition: "all 0.2s ease",
          }}
        >
          <X size={14} />
        </motion.button>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            {renderPanel()}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}

function StatusRow({ icon: Icon, label, status, color }: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string; status: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--proof-surface)", display: "flex", alignItems: "center", justifyItems: "center", flexShrink: 0, border: "1px solid var(--proof-border-light)" }}>
        <Icon size={12} style={{ margin: "0 auto", color: "var(--proof-text-muted)" }} />
      </div>
      <div style={{ flex: 1, fontSize: 11, color: "var(--proof-text-secondary)" }}>{label}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: color, textTransform: "uppercase" }}>{status}</div>
    </div>
  );
}

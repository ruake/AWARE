import React from "react";
import { Zap } from "lucide-react";
import type { AIUseCase } from "@/lib/ai";
import { AI_USE_CASES } from "@/lib/ai";
import { RUNS } from "@/lib/runs";

const CATEGORIES = ["analysis", "alert", "recommendation", "report", "setup"] as const;

const CAT_LABEL: Record<string, string> = {
  analysis: "Analysis",
  alert: "Alerts",
  recommendation: "Recommendations",
  report: "Reports",
  setup: "Setup & Config",
};

const CAT_COLOR: Record<string, string> = {
  analysis: "#5b8af5",
  alert: "#ef4444",
  recommendation: "#22c55e",
  report: "#a855f7",
  setup: "#f59e0b",
};

interface Props {
  activeUseCase: string | null;
  useCaseIcons: Record<string, React.ReactNode>;
  onSelect: (uc: AIUseCase) => void;
}

export default function Sidebar({ activeUseCase, useCaseIcons, onSelect }: Props) {
  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--proof-text-secondary)",
          padding: "4px 2px 8px",
          flexShrink: 0,
        }}
      >
        Quick Analysis
      </div>
      {CATEGORIES.map((cat) => {
        const catUcs = AI_USE_CASES.filter((uc) => uc.category === cat);
        if (!catUcs.length) return null;
        return (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: CAT_COLOR[cat],
                marginBottom: 4,
                paddingLeft: 2,
              }}
            >
              {CAT_LABEL[cat]}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {catUcs.map((uc) => {
                const needsData = uc.category !== "setup";
                const disabled = needsData && RUNS.length === 0;
                const isActive = activeUseCase === uc.id;
                const color = CAT_COLOR[cat];
                return (
                  <button
                    key={uc.id}
                    onClick={() => !disabled && onSelect(uc)}
                    title={disabled ? "No test runs loaded — seed data first" : uc.description}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      padding: "6px 10px",
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: isActive ? 700 : 500,
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.4 : 1,
                      border: `1px solid ${isActive ? color : `${color}28`}`,
                      background: isActive ? `${color}22` : `${color}0c`,
                      color: isActive ? color : "var(--proof-text)",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.12s",
                      lineHeight: 1.3,
                      boxShadow: isActive ? `0 0 0 1px ${color}40` : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (disabled) return;
                      e.currentTarget.style.background = `${color}1e`;
                      e.currentTarget.style.borderColor = `${color}55`;
                      e.currentTarget.style.color = color;
                    }}
                    onMouseLeave={(e) => {
                      if (disabled) return;
                      e.currentTarget.style.background = isActive ? `${color}22` : `${color}0c`;
                      e.currentTarget.style.borderColor = isActive ? color : `${color}28`;
                      e.currentTarget.style.color = isActive ? color : "var(--proof-text)";
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ flexShrink: 0, opacity: 0.8 }}>
                        {useCaseIcons[uc.id] || <Zap size={11} />}
                      </span>
                      {uc.name}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--proof-text-muted)",
                        lineHeight: 1.3,
                        marginLeft: 20,
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {uc.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import React from "react";
import { Briefcase, Minus, BookOpen, Smile, Terminal, ChevronDown } from "lucide-react";
import type { ToneOption } from "@/lib/copilot/types";
import { TONE_LABELS, TONE_DESCRIPTIONS } from "@/lib/copilot/types";

interface ToneSelectorProps {
  currentTone: ToneOption;
  onToneChange: (tone: ToneOption) => void;
}

const ORDER: ToneOption[] = ["professional", "concise", "detailed", "friendly", "technical"];

const TONE_ICONS: Record<ToneOption, React.ReactNode> = {
  professional: <Briefcase size={12} />,
  concise: <Minus size={12} />,
  detailed: <BookOpen size={12} />,
  friendly: <Smile size={12} />,
  technical: <Terminal size={12} />,
};

const TONE_COLORS: Record<ToneOption, string> = {
  professional: "#60a5fa",
  concise: "#a78bfa",
  detailed: "#f59e0b",
  friendly: "#34d399",
  technical: "#f472b6",
};

export default function ToneSelector({ currentTone, onToneChange }: ToneSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid var(--proof-border)",
          background: "var(--proof-surface-2)",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 600,
          color: TONE_COLORS[currentTone],
        }}
      >
        {TONE_ICONS[currentTone]}
        {TONE_LABELS[currentTone]}
        <ChevronDown size={10} style={{ color: "var(--proof-text-secondary)" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            width: 220,
            background: "var(--proof-surface-2)",
            border: "1px solid var(--proof-border)",
            borderRadius: 8,
            padding: 4,
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "toneFadeIn 0.15s ease-out",
          }}
        >
          {ORDER.map((tone) => {
            const isActive = tone === currentTone;
            const color = TONE_COLORS[tone];
            return (
              <button
                key={tone}
                onClick={() => {
                  onToneChange(tone);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: isActive ? `${color}18` : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--proof-surface-1)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                    opacity: isActive ? 1 : 0.35,
                    transition: "opacity 0.1s",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      color: "var(--proof-text)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ color }}>{TONE_ICONS[tone]}</span>
                    {TONE_LABELS[tone]}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--proof-text-secondary)",
                      marginTop: 2,
                      lineHeight: 1.3,
                    }}
                  >
                    {TONE_DESCRIPTIONS[tone]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes toneFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

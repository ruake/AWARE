import React from "react";
import { Globe, Cpu, Zap, ChevronDown, Loader2 } from "lucide-react";
import type { ProviderType, ProviderStatus } from "@/lib/copilot/types";

interface Props {
  providerType: ProviderType;
  providerStatus: Record<ProviderType, ProviderStatus>;
  downloadProgress: { progress: number; text: string } | null;
  onSwitch: (type: ProviderType) => void;
}

const META: Record<
  ProviderType,
  { label: string; icon: React.ReactNode; color: string; description: string }
> = {
  custom: {
    label: "Custom Endpoint",
    icon: <Globe size={12} />,
    color: "#10a37f",
    description: "Any OpenAI-compatible server — configure URL in Settings",
  },
  webllm: {
    label: "WebLLM",
    icon: <Cpu size={12} />,
    color: "#8b5cf6",
    description: "Runs locally — downloads model on first use",
  },
  chrome: {
    label: "Chrome AI",
    icon: <Zap size={12} />,
    color: "#4285f4",
    description: "On-device via Chrome's built-in Gemini Nano",
  },
};

const ORDER: ProviderType[] = ["webllm", "chrome", "custom"];

const STATUS_DOT: Record<ProviderStatus, { color: string; title: string }> = {
  available: { color: "#22c55e", title: "Available" },
  downloading: { color: "#f59e0b", title: "Downloading…" },
  unavailable: { color: "#6b7280", title: "Unavailable" },
};

const UNAVAILABLE_REASON: Record<ProviderType, string> = {
  webllm: "Your browser may not support WebGPU, which is required for WebLLM",
  chrome: "Requires Chrome 127+ with Gemini Nano enabled",
  custom: "Configure an API URL in Settings to enable",
};

export default function ProviderSelector({
  providerType,
  providerStatus,
  downloadProgress,
  onSwitch,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  const current = META[providerType];
  const currentStatus = providerStatus[providerType];

  React.useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", clickHandler);
      document.addEventListener("keydown", keyHandler);
    }
    return () => {
      document.removeEventListener("mousedown", clickHandler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`AI provider: ${current.label}`}
        title={`Current provider: ${current.label}`}
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
          color: current.color,
        }}
      >
        {currentStatus === "downloading" ? (
          <Loader2
            size={11}
            style={{ animation: "spin 1s linear infinite", color: current.color }}
          />
        ) : (
          current.icon
        )}
        {current.label}
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: STATUS_DOT[currentStatus]?.color ?? "#6b7280",
            flexShrink: 0,
          }}
        />
        <ChevronDown size={10} style={{ color: "var(--proof-text-secondary)" }} />
      </button>

      {/* Download progress bar */}
      {downloadProgress && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            width: 220,
            background: "var(--proof-surface-2)",
            border: "1px solid var(--proof-border)",
            borderRadius: 8,
            padding: "8px 10px",
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", marginBottom: 4 }}>
            {downloadProgress.text}
          </div>
          <div
            style={{
              height: 4,
              background: "var(--proof-border)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round(downloadProgress.progress * 100)}%`,
                background: META.webllm.color,
                borderRadius: 2,
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: current.color, marginTop: 3, textAlign: "right" }}>
            {Math.round(downloadProgress.progress * 100)}%
          </div>
        </div>
      )}

      {/* Dropdown menu */}
      {open && !downloadProgress && (
        <div
          role="listbox"
          aria-label="Select AI provider"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            width: 230,
            background: "var(--proof-surface-2)",
            border: "1px solid var(--proof-border)",
            borderRadius: 8,
            padding: 4,
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "copilotFadeIn 0.12s ease-out",
          }}
        >
          {ORDER.map((type) => {
            const meta = META[type];
            const status = providerStatus[type];
            const dot = STATUS_DOT[status] ?? STATUS_DOT.unavailable;
            const isActive = type === providerType;
            const disabled = status === "unavailable";
            return (
              <button
                key={type}
                role="option"
                aria-selected={isActive}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    onSwitch(type);
                    setOpen(false);
                  }
                }}
                title={disabled ? UNAVAILABLE_REASON[type] : meta.description}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "7px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: isActive ? `${meta.color}14` : "transparent",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.5 : 1,
                  textAlign: "left",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  if (!disabled && !isActive)
                    e.currentTarget.style.background = "var(--proof-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!disabled && !isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                  <span style={{ color: meta.color }}>{meta.icon}</span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      color: "var(--proof-text)",
                    }}
                  >
                    {meta.label}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: dot.color,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: disabled ? "var(--proof-red-bright)" : "var(--proof-text-muted)",
                    lineHeight: 1.3,
                    paddingLeft: 20,
                  }}
                >
                  {disabled ? UNAVAILABLE_REASON[type] : meta.description}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

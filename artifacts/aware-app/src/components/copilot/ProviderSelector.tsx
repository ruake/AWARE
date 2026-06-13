import React from "react";
import { Globe, Cpu, Zap, CheckCircle2, Loader2 } from "lucide-react";
import type { LLMProviderType } from "@/lib/types";

type ProviderStatus = "available" | "downloading" | "unavailable";

interface Props {
  providerAvail: Record<string, ProviderStatus>;
  loading: boolean;
  showProviderMenu: boolean;
  providerRef: React.RefObject<HTMLDivElement | null>;
  onSwitch: (type: LLMProviderType) => void;
  onToggleMenu: () => void;
}

const PROVIDER_META: Record<
  LLMProviderType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  openai: { label: "OpenAI", icon: <Globe size={12} />, color: "#10a37f" },
  webllm: { label: "WebLLM", icon: <Cpu size={12} />, color: "#8b5cf6" },
  chrome: { label: "Chrome AI", icon: <Zap size={12} />, color: "#4285f4" },
};

const PROVIDER_ORDER: LLMProviderType[] = ["openai", "webllm", "chrome"];

export default function ProviderSelector({
  providerAvail,
  loading,
  showProviderMenu,
  providerRef,
  onSwitch,
  onToggleMenu,
}: Props) {
  return (
    <div
      ref={providerRef}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", gap: 3 }}>
        {PROVIDER_ORDER.map((type) => {
          const meta = PROVIDER_META[type];
          const status = providerAvail[type];
          const disabled = loading || status === "unavailable";
          return (
            <button
              key={type}
              onClick={() => !disabled && onSwitch(type)}
              disabled={disabled}
              title={`${meta.label}: ${status === "available" ? "Connected" : status === "downloading" ? "Downloading…" : "Unavailable"}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 9px",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : status === "available" ? 1 : 0.6,
                border: `1px solid ${status === "available" ? `${meta.color}44` : "var(--proof-border)"}`,
                background: status === "available" ? `${meta.color}12` : "var(--proof-surface-2)",
                color: status === "available" ? meta.color : "var(--proof-text-secondary)",
                transition: "all 0.12s",
              }}
            >
              {loading ? (
                <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                meta.icon
              )}
              {meta.label}
              {status === "available" && <CheckCircle2 size={9} style={{ color: meta.color }} />}
            </button>
          );
        })}
      </div>
      <button
        onClick={onToggleMenu}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          padding: "5px 8px",
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 500,
          cursor: "pointer",
          border: "1px solid var(--proof-border)",
          background: "var(--proof-surface-2)",
          color: "var(--proof-text-secondary)",
        }}
      >
        Settings
      </button>
    </div>
  );
}

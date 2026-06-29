import React from "react";
import { X, RotateCcw, Thermometer, FileText, Hash, Sliders, Check } from "lucide-react";
import type { CopilotSettings, ToneOption } from "@/lib/copilot/types";
import { TONE_LABELS, TONE_DESCRIPTIONS } from "@/lib/copilot/types";
import { DEFAULT_COPILOT_SETTINGS } from "@/lib/copilot/storage";

interface ModelConfigPanelProps {
  settings: CopilotSettings;
  onSettingsChange: (settings: CopilotSettings) => void;
  onClose: () => void;
}

const TOKEN_PRESETS = [256, 512, 1024, 2048, 4096, 8192];

const TONE_ORDER: ToneOption[] = ["professional", "concise", "detailed", "friendly", "technical"];

const TONE_ACCENT: Record<ToneOption, string> = {
  professional: "var(--proof-blue)",
  concise: "var(--proof-purple)",
  detailed: "var(--proof-yellow)",
  friendly: "var(--proof-emerald)",
  technical: "#f472b6"};

function formatTokens(n: number): string {
  if (n >= 1024) return `${n / 1024}K tokens`;
  return `${n} tokens`;
}

function formatContextWindow(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export default function ModelConfigPanel({
  settings,
  onSettingsChange,
  onClose}: ModelConfigPanelProps) {
  const [local, setLocal] = React.useState<CopilotSettings>({ ...settings });
  const [promptChars, setPromptChars] = React.useState(settings.systemPrompt.length);

  const update = (patch: Partial<CopilotSettings>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    if (patch.systemPrompt !== undefined) {
      setPromptChars(patch.systemPrompt.length);
    }
  };

  const handleSave = () => {
    onSettingsChange(local);
    onClose();
  };

  const handleReset = () => {
    setLocal({ ...DEFAULT_COPILOT_SETTINGS });
    setPromptChars(DEFAULT_COPILOT_SETTINGS.systemPrompt.length);
  };

  const handleToneSelect = (tone: ToneOption) => update({ tone });

  const tempPercent = ((local.temperature - 0) / (1 - 0)) * 100;
  const tempGradient = `linear-gradient(to right, #3b82f6 0%, #f97316 ${tempPercent}%, var(--proof-surface-3) ${tempPercent}%, var(--proof-surface-3) 100%)`;

  const tokensPercent = ((local.maxTokens - 256) / (8192 - 256)) * 100;
  const tokensGradient = `linear-gradient(to right, #8b5cf6 0%, #a78bfa ${tokensPercent}%, var(--proof-surface-3) ${tokensPercent}%, var(--proof-surface-3) 100%)`;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 999,
          animation: "modelConfigFadeIn 0.15s ease-out"}}
        onClick={onClose}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 360,
          maxWidth: "100vw",
          background: "var(--proof-bg-elevated)",
          borderLeft: "1px solid var(--proof-border)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          animation: "modelConfigSlideIn 0.2s ease-out",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.4)"}}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid var(--proof-border)",
            flexShrink: 0}}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sliders size={14} style={{ color: "var(--proof-blue-bright)" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--proof-text)" }}>
              Model Config
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              color: "var(--proof-text-muted)",
              cursor: "pointer"}}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--proof-hover)";
              e.currentTarget.style.color = "var(--proof-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--proof-text-muted)";
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 20}}
        >
          <Section icon={<Thermometer size={13} />} title="Temperature" accent="var(--proof-orange)">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={local.temperature}
                onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
                className="model-config-slider"
                style={{ flex: 1, background: tempGradient }}
              />
              <span
                style={{
                  minWidth: 36,
                  textAlign: "right",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    local.temperature > 0.7
                      ? "var(--proof-orange)"
                      : local.temperature > 0.3
                        ? "var(--proof-blue-bright)"
                        : "var(--proof-blue)"}}
              >
                {local.temperature.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>Precise</span>
              <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>Creative</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", marginTop: 2 }}>
              Higher = more creative, Lower = more deterministic
            </div>
          </Section>

          <Section icon={<Hash size={13} />} title="Max Tokens" accent="var(--proof-purple)">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="range"
                min={256}
                max={8192}
                step={256}
                value={local.maxTokens}
                onChange={(e) => update({ maxTokens: parseInt(e.target.value, 10) })}
                className="model-config-slider model-config-slider-purple"
                style={{ flex: 1, background: tokensGradient }}
              />
              <span
                style={{
                  minWidth: 64,
                  textAlign: "right",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--proof-purple-bright)"}}
              >
                {formatTokens(local.maxTokens)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                marginTop: 6}}
            >
              {TOKEN_PRESETS.map((val) => {
                const active = local.maxTokens === val;
                return (
                  <button
                    key={val}
                    onClick={() => update({ maxTokens: val })}
                    style={{
                      padding: "3px 7px",
                      fontSize: 10,
                      fontWeight: active ? 700 : 500,
                      fontFamily: "var(--font-mono)",
                      borderRadius: 4,
                      border: active
                        ? "1px solid var(--proof-purple)"
                        : "1px solid var(--proof-border)",
                      background: active ? "var(--proof-purple-bg)" : "var(--proof-surface-2)",
                      color: active ? "var(--proof-purple-bright)" : "var(--proof-text-muted)",
                      cursor: "pointer",
                      transition: "all 0.1s"}}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "var(--proof-surface-3)";
                        e.currentTarget.style.color = "var(--proof-text-secondary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "var(--proof-surface-2)";
                        e.currentTarget.style.color = "var(--proof-text-muted)";
                      }
                    }}
                  >
                    {val >= 1024 ? `${val / 1024}K` : val}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section icon={<FileText size={13} />} title="System Prompt" accent="var(--proof-blue)">
            <textarea
              value={local.systemPrompt}
              onChange={(e) => update({ systemPrompt: e.target.value })}
              placeholder="Custom instructions for the AI..."
              rows={5}
              style={{
                width: "100%",
                resize: "vertical",
                minHeight: 90,
                maxHeight: 200,
                padding: "10px 12px",
                background: "var(--proof-surface)",
                border: "1px solid var(--proof-border)",
                borderRadius: 6,
                color: "var(--proof-text)",
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                lineHeight: 1.6}}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 5}}
            >
              <button
                onClick={() => {
                  setLocal((prev) => ({ ...prev, systemPrompt: "" }));
                  setPromptChars(0);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 7px",
                  fontSize: 10,
                  borderRadius: 4,
                  border: "1px solid var(--proof-border)",
                  background: "var(--proof-surface-2)",
                  color: "var(--proof-text-muted)",
                  cursor: "pointer"}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--proof-surface-3)";
                  e.currentTarget.style.color = "var(--proof-text-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--proof-surface-2)";
                  e.currentTarget.style.color = "var(--proof-text-muted)";
                }}
              >
                <RotateCcw size={10} />
                Reset to default
              </button>
              <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>
                {promptChars} char{promptChars !== 1 ? "s" : ""}
              </span>
            </div>
          </Section>

          <Section icon={<Sliders size={13} />} title="Tone" accent="var(--proof-emerald)">
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {TONE_ORDER.map((tone) => {
                const active = local.tone === tone;
                const color = TONE_ACCENT[tone];
                return (
                  <button
                    key={tone}
                    onClick={() => handleToneSelect(tone)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 10px",
                      borderRadius: 6,
                      border: active ? `1px solid ${color}40` : "1px solid transparent",
                      background: active ? `${color}12` : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.1s"}}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = "var(--proof-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: color,
                        flexShrink: 0,
                        opacity: active ? 1 : 0.35,
                        transition: "opacity 0.1s"}}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: active ? 700 : 500,
                          color: "var(--proof-text)"}}
                      >
                        {TONE_LABELS[tone]}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--proof-text-secondary)",
                          marginTop: 1,
                          lineHeight: 1.3}}
                      >
                        {TONE_DESCRIPTIONS[tone]}
                      </div>
                    </div>
                    {active && <Check size={12} style={{ color, flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section icon={<Sliders size={13} />} title="Context Window" accent="var(--proof-text-muted)">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                background: "var(--proof-surface)",
                border: "1px solid var(--proof-border)",
                borderRadius: 6}}
            >
              <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                Maximum context size
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--proof-text)"}}
              >
                {formatContextWindow(local.contextWindow)} tokens
              </span>
            </div>
          </Section>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 16px",
            borderTop: "1px solid var(--proof-border)",
            flexShrink: 0}}
        >
          <button
            onClick={handleReset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 12px",
              borderRadius: 6,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-surface-2)",
              color: "var(--proof-text-muted)",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap"}}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--proof-surface-3)";
              e.currentTarget.style.color = "var(--proof-text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--proof-surface-2)";
              e.currentTarget.style.color = "var(--proof-text-muted)";
            }}
          >
            <RotateCcw size={12} />
            Reset
          </button>

          <div style={{ flex: 1 }} />

          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 12px",
              borderRadius: 6,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-surface-2)",
              color: "var(--proof-text-secondary)",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer"}}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--proof-surface-3)";
              e.currentTarget.style.color = "var(--proof-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--proof-surface-2)";
              e.currentTarget.style.color = "var(--proof-text-secondary)";
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 14px",
              borderRadius: 6,
              border: "none",
              background: "var(--proof-blue)",
              color: "#fff",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer"}}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--proof-blue-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--proof-blue)";
            }}
          >
            <Check size={13} />
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

function Section({
  icon,
  title,
  accent,
  children}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8}}
      >
        <span style={{ color: accent, display: "flex" }}>{icon}</span>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "var(--proof-text)",
            letterSpacing: "0.1px"}}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

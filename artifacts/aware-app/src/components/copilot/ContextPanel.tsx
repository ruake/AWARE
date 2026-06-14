import React from "react";
import { getTestCases, getTestSuites } from "@/lib/data";
import { RUNS } from "@/lib/runs";
import type { ProviderType, ProviderStatus } from "@/lib/copilot/types";
import { Cpu, Globe, Database, FileText, Layers, Bot, MessageSquare } from "lucide-react";

interface Props {
  providerType: ProviderType;
  providerStatus: Record<ProviderType, ProviderStatus>;
  messages: { id: string }[];
}

const META: Record<ProviderType, { label: string; color: string }> = {
  openai: { label: "OpenAI", color: "#10a37f" },
  webllm: { label: "WebLLM (WebGPU)", color: "#8b5cf6" },
  chrome: { label: "Chrome AI (on-device)", color: "#4285f4" },
};

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--proof-text-secondary)",
        padding: "0 12px",
        marginBottom: 6,
      }}
    >
      {icon}
      {label}
    </div>
  );
}

export default function ContextPanel({ providerType, providerStatus, messages }: Props) {
  const meta = META[providerType];
  const status = providerStatus[providerType];

  const testCount = getTestCases().length;
  const suiteCount = getTestSuites().length;
  const runCount = RUNS.length;

  const statusColor =
    status === "available" ? "#22c55e" : status === "downloading" ? "#f59e0b" : "#6b7280";
  const statusLabel =
    status === "available" ? "Ready" : status === "downloading" ? "Downloading…" : "Unavailable";

  return (
    <div
      style={{
        width: 200,
        flexShrink: 0,
        borderLeft: "1px solid var(--proof-border)",
        background: "var(--proof-surface)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        gap: 0,
      }}
    >
      {/* Session info */}
      <div style={{ padding: "10px 12px", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <Bot size={14} style={{ color: "var(--proof-blue)" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)" }}>
            Session
          </span>
        </div>
        <div style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 0" }}>
            <MessageSquare size={11} />
            {messages.length} messages
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--proof-border)", margin: "0 12px" }} />

      {/* Provider status — Amershi G18: make limitations clear */}
      <div style={{ padding: "10px 12px", flexShrink: 0 }}>
        <SectionHeader icon={<Cpu size={10} />} label="Provider" />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 0",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: statusColor,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: meta.color, flex: 1 }}>
            {meta.label}
          </span>
        </div>
        <div
          style={{
            fontSize: 10,
            color: statusColor,
            fontWeight: 500,
            paddingLeft: 14,
          }}
        >
          {statusLabel}
        </div>
      </div>

      <div style={{ height: 1, background: "var(--proof-border)", margin: "0 12px" }} />

      {/* Available data — Amershi G2: show contextually relevant info */}
      <div style={{ padding: "10px 12px", flexShrink: 0 }}>
        <SectionHeader icon={<Database size={10} />} label="Data Sources" />
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <DataRow icon={<FileText size={11} />} label="Test cases" value={testCount} color="var(--proof-blue)" />
          <DataRow icon={<Layers size={11} />} label="Test suites" value={suiteCount} color="var(--proof-green)" />
          <DataRow icon={<Globe size={11} />} label="CI runs" value={runCount} color="var(--proof-text)" />
        </div>
      </div>

      <div style={{ height: 1, background: "var(--proof-border)", margin: "0 12px" }} />

      {/* Capabilities — Kocielnik: expectation setting */}
      <div style={{ padding: "10px 12px", flexShrink: 0 }}>
        <SectionHeader icon={<Bot size={10} />} label="Capabilities" />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            padding: "2px 0",
          }}
        >
          {["Analyze", "Compare", "Trend", "Flakiness", "Gate"].map((cap) => (
            <span
              key={cap}
              style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 10,
                background: "var(--proof-blue-bg)",
                color: "var(--proof-blue)",
                border: "1px solid var(--proof-blue)40",
                fontWeight: 500,
              }}
            >
              {cap}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 9, color: "var(--proof-text-secondary)", marginTop: 6, lineHeight: 1.4 }}>
          Ask in natural language about runs, failures, promotion gate status, or environment health.
        </div>
      </div>
    </div>
  );
}

function DataRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 0",
      }}
    >
      <span style={{ color: "var(--proof-text-secondary)", display: "flex" }}>{icon}</span>
      <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", flex: 1 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

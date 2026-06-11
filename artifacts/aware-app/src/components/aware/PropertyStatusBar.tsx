import React from "react";
import { useLocation } from "wouter";
import { CheckCircle2, AlertCircle, Clock, ExternalLink, Server, Layers } from "lucide-react";
import { getEnvConfigs } from "@/lib/envConfig";
import type { EnvironmentConfig } from "@/lib/types";

const ENV_COLORS: Record<string, { accent: string; bg: string; badge: string }> = {
  QA: {
    accent: "#a855f7",
    bg: "rgba(168,85,247,0.08)",
    badge: "rgba(168,85,247,0.15)",
  },
  UAT: {
    accent: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    badge: "rgba(245,158,11,0.15)",
  },
  PROD: {
    accent: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    badge: "rgba(34,197,94,0.15)",
  },
};

function StatusIcon({ status }: { status: EnvironmentConfig["propertyStatus"] }) {
  if (status === "active")
    return <CheckCircle2 size={11} style={{ color: "#22c55e", flexShrink: 0 }} />;
  if (status === "pending")
    return <Clock size={11} style={{ color: "#f59e0b", flexShrink: 0 }} />;
  return <AlertCircle size={11} style={{ color: "#ef4444", flexShrink: 0 }} />;
}

function EnvPropertyCard({
  env,
  onClick,
}: {
  env: EnvironmentConfig;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const colors = ENV_COLORS[env.label] ?? ENV_COLORS["QA"];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "10px 14px",
        borderRadius: 8,
        background: hovered ? colors.bg : "transparent",
        border: `1px solid ${hovered ? colors.accent + "40" : "var(--proof-border)"}`,
        cursor: "pointer",
        transition: "all 0.15s ease",
        position: "relative",
      }}
    >
      {/* Env label + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              color: colors.accent,
              fontFamily: "var(--font-mono)",
            }}
          >
            {env.label}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: env.propertyStatus === "active" ? "#22c55e" : env.propertyStatus === "pending" ? "#f59e0b" : "#ef4444",
              background: env.propertyStatus === "active" ? "rgba(34,197,94,0.12)" : env.propertyStatus === "pending" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
              padding: "1px 6px",
              borderRadius: 10,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <StatusIcon status={env.propertyStatus} />
            {env.propertyStatus ?? "unknown"}
          </span>
        </div>
        <ExternalLink size={10} style={{ color: "var(--proof-text-tertiary)", opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }} />
      </div>

      {/* Property name + version */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
          <Layers size={10} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--proof-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {env.property ?? "—"}
          </span>
        </div>
        {env.propertyVersion != null && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: colors.accent,
              background: colors.badge,
              padding: "1px 7px",
              borderRadius: 5,
              fontFamily: "var(--font-mono)",
              flexShrink: 0,
            }}
          >
            v{env.propertyVersion}
          </span>
        )}
      </div>

      {/* Edge hostname */}
      {env.edgeHostname && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Server size={9} style={{ color: "var(--proof-text-tertiary)", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 10,
              color: "var(--proof-text-secondary)",
              fontFamily: "var(--font-mono)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {env.edgeHostname}
          </span>
        </div>
      )}
    </div>
  );
}

export function PropertyStatusBar() {
  const [, navigate] = useLocation();
  const envs = React.useMemo(() => getEnvConfigs(), []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 10,
        padding: "10px 0 2px",
      }}
    >
      {/* Left label */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
          paddingRight: 10,
          borderRight: "1px solid var(--proof-border)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            color: "var(--proof-text-secondary)",
          }}
        >
          Akamai
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            color: "var(--proof-text-secondary)",
          }}
        >
          Property
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            color: "var(--proof-text-secondary)",
          }}
        >
          Status
        </span>
      </div>

      {/* Env cards */}
      {envs.map((env) => (
        <EnvPropertyCard
          key={env.id}
          env={env}
          onClick={() => navigate(`/runs?env=${encodeURIComponent(env.label)}`)}
        />
      ))}
    </div>
  );
}

import React from "react";
import { useLocation } from "wouter";
import { CheckCircle2, AlertCircle, Clock, Server, Layers, Globe } from "lucide-react";
import { getEnvConfigs } from "@/lib/envConfig";
import type { EnvironmentConfig } from "@/lib/types";

const TIER_META: Record<string, { accent: string; stagingBg: string; prodBg: string }> = {
  QA:   { accent: "#a855f7", stagingBg: "rgba(168,85,247,0.07)",  prodBg: "rgba(192,132,252,0.10)" },
  UAT:  { accent: "#f59e0b", stagingBg: "rgba(245,158,11,0.07)",  prodBg: "rgba(251,191,36,0.10)"  },
  PROD: { accent: "#22c55e", stagingBg: "rgba(34,197,94,0.07)",   prodBg: "rgba(74,222,128,0.10)"  },
};

function StatusPill({ status }: { status: EnvironmentConfig["propertyStatus"] }) {
  const cfg =
    status === "active"
      ? { color: "#22c55e", bg: "rgba(34,197,94,0.13)", icon: CheckCircle2, label: "active" }
      : status === "pending"
      ? { color: "#f59e0b", bg: "rgba(245,158,11,0.13)", icon: Clock,        label: "pending" }
      : { color: "#ef4444", bg: "rgba(239,68,68,0.13)",  icon: AlertCircle,  label: "inactive" };
  const Icon = cfg.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 9,
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        padding: "1px 6px",
        borderRadius: 10,
        textTransform: "uppercase",
        letterSpacing: "0.4px",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

function NetworkCard({
  env,
  accent,
  bg,
  onClick,
}: {
  env: EnvironmentConfig;
  accent: string;
  bg: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const isStaging = env.network === "staging";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${env.label} — ${env.baseUrl}`}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "7px 10px",
        borderRadius: 6,
        background: hovered ? (isStaging ? "rgba(255,255,255,0.06)" : bg) : (isStaging ? "transparent" : bg + "88"),
        border: `1px solid ${hovered ? accent + "50" : "var(--proof-border)"}`,
        cursor: "pointer",
        transition: "all 0.14s ease",
        minWidth: 0,
      }}
    >
      {/* Network badge + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            color: isStaging ? "var(--proof-text-secondary)" : accent,
            fontFamily: "var(--font-mono)",
          }}
        >
          {isStaging ? "staging" : "production"}
        </span>
        <StatusPill status={env.propertyStatus} />
      </div>

      {/* Property version */}
      {env.propertyVersion != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Layers size={9} style={{ color: "var(--proof-text-tertiary)", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 10,
              color: "var(--proof-text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            v{env.propertyVersion}
          </span>
        </div>
      )}

      {/* IPs */}
      {env.ips && env.ips.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Server size={9} style={{ color: "var(--proof-text-tertiary)", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 9,
              color: "var(--proof-text-tertiary)",
              fontFamily: "var(--font-mono)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {env.ips[0]}{env.ips.length > 1 ? ` +${env.ips.length - 1}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function TierGroup({
  tier,
  staging,
  production,
  onNavigate,
}: {
  tier: string;
  staging: EnvironmentConfig;
  production: EnvironmentConfig;
  onNavigate: (env: EnvironmentConfig) => void;
}) {
  const meta = TIER_META[tier] ?? TIER_META.QA;

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 5,
        padding: "8px 10px",
        borderRadius: 8,
        border: `1px solid ${meta.accent}28`,
        background: `linear-gradient(135deg, ${meta.accent}08 0%, transparent 100%)`,
      }}
    >
      {/* Tier header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: meta.accent,
            boxShadow: `0 0 6px ${meta.accent}80`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: meta.accent,
            fontFamily: "var(--font-mono)",
          }}
        >
          {tier}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: "auto" }}>
          <Globe size={9} style={{ color: "var(--proof-text-tertiary)" }} />
          <span
            style={{
              fontSize: 9,
              color: "var(--proof-text-tertiary)",
              fontFamily: "var(--font-mono)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 120,
            }}
          >
            {staging.property ?? staging.baseUrl}
          </span>
        </div>
      </div>

      {/* Staging + Production side by side */}
      <div style={{ display: "flex", gap: 5 }}>
        <NetworkCard
          env={staging}
          accent={meta.accent}
          bg={meta.stagingBg}
          onClick={() => onNavigate(staging)}
        />
        <NetworkCard
          env={production}
          accent={meta.accent}
          bg={meta.prodBg}
          onClick={() => onNavigate(production)}
        />
      </div>
    </div>
  );
}

export function PropertyStatusBar() {
  const [, navigate] = useLocation();
  const envs = React.useMemo(() => getEnvConfigs(), []);

  // Group into tiers: QA / UAT / PROD
  const tiers = React.useMemo(() => {
    const map: Record<string, { staging?: EnvironmentConfig; production?: EnvironmentConfig }> = {};
    for (const e of envs) {
      if (!map[e.target]) map[e.target] = {};
      if (e.network === "staging") map[e.target].staging = e;
      else map[e.target].production = e;
    }
    return ["QA", "UAT", "PROD"]
      .filter((t) => map[t]?.staging && map[t]?.production)
      .map((t) => ({ tier: t, staging: map[t].staging!, production: map[t].production! }));
  }, [envs]);

  if (tiers.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingTop: 10,
        paddingBottom: 4,
      }}
    >
      {/* Bar header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            color: "var(--proof-text-secondary)",
          }}
        >
          Akamai Property Status
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--proof-border)", opacity: 0.5 }} />
        <span
          style={{
            fontSize: 9,
            color: "var(--proof-text-tertiary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          www.akamai.com · staging + production
        </span>
      </div>

      {/* Three tier cards */}
      <div style={{ display: "flex", gap: 10 }}>
        {tiers.map(({ tier, staging, production }) => (
          <TierGroup
            key={tier}
            tier={tier}
            staging={staging}
            production={production}
            onNavigate={(env) =>
              navigate(`/runs?env=${encodeURIComponent(env.label)}`)
            }
          />
        ))}
      </div>
    </div>
  );
}

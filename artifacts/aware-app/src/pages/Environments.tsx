import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Server,
  Globe,
  Layers,
  ArrowUpRight,
  GitCompare,
  Activity,
  Shield,
} from "lucide-react";
import { getEnvConfigs } from "@/lib/envConfig";
import { RUNS, subscribeToSelectedEnv, getSelectedEnvSnapshot } from "@/lib/data";
import { getAllPromotionDecisions } from "@/lib/promotions";
import type { EnvironmentConfig, PromotionDecision } from "@/lib/types";

const TIER_ORDER = ["QA", "UAT", "PROD"] as const;
const TIER_META: Record<string, { accent: string; label: string }> = {
  QA: { accent: "#a855f7", label: "Quality Assurance" },
  UAT: { accent: "#f59e0b", label: "User Acceptance Testing" },
  PROD: { accent: "#22c55e", label: "Production" },
};

function StatusPill({ status }: { status: EnvironmentConfig["propertyStatus"] }) {
  const cfg =
    status === "active"
      ? { color: "#22c55e", bg: "rgba(34,197,94,0.13)", icon: CheckCircle2, label: "Active" }
      : status === "pending"
        ? { color: "#f59e0b", bg: "rgba(245,158,11,0.13)", icon: Clock, label: "Pending" }
        : { color: "#ef4444", bg: "rgba(239,68,68,0.13)", icon: AlertCircle, label: "Inactive" };
  const Icon = cfg.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        padding: "2px 8px",
        borderRadius: 10,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function EnvCard({
  env,
  runCount,
  passRate,
}: {
  env: EnvironmentConfig;
  runCount: number;
  passRate: number;
}) {
  const isStaging = env.network === "staging";
  return (
    <div
      style={{
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Globe size={14} style={{ color: isStaging ? "#f59e0b" : "#22c55e", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--proof-text)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {env.network}
          </span>
        </div>
        <StatusPill status={env.propertyStatus ?? "active"} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          color: "var(--proof-text-secondary)",
        }}
      >
        <Server size={11} />
        <span>v{env.propertyVersion}</span>
        <span style={{ margin: "0 4px", opacity: 0.3 }}>·</span>
        <Layers size={11} />
        <span>{env.property}</span>
      </div>
      {env.edgeHostname && (
        <div
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--proof-text-muted)",
            wordBreak: "break-all",
          }}
        >
          {env.edgeHostname}
        </div>
      )}
      {env.ips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {env.ips.map((ip) => (
            <span
              key={ip}
              style={{
                fontSize: 9,
                fontFamily: "var(--font-mono)",
                padding: "1px 5px",
                borderRadius: 3,
                background: "rgba(255,255,255,0.04)",
                color: "var(--proof-text-muted)",
              }}
            >
              {ip}
            </span>
          ))}
        </div>
      )}
      {runCount > 0 && (
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 2,
            paddingTop: 8,
            borderTop: "1px solid var(--proof-border)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
            <span
              style={{
                fontWeight: 700,
                color: "var(--proof-text)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {runCount}
            </span>{" "}
            runs
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
            <span
              style={{
                fontWeight: 700,
                color: passRate >= 95 ? "#22c55e" : passRate >= 80 ? "#f59e0b" : "#ef4444",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {passRate}%
            </span>{" "}
            pass
          </div>
        </div>
      )}
    </div>
  );
}

function PromotionGate({ decisions }: { decisions: PromotionDecision[] }) {
  const latest = decisions.slice(-5).reverse();
  return (
    <div
      style={{
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <Shield size={14} style={{ color: "var(--proof-blue)" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
          Promotion Gate
        </span>
      </div>
      {latest.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--proof-text-muted)", padding: "8px 0" }}>
          No promotion decisions recorded yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {latest.map((d) => (
            <div
              key={d.runId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                padding: "6px 8px",
                borderRadius: 4,
                background:
                  d.decision === "promote"
                    ? "rgba(34,197,94,0.08)"
                    : d.decision === "block"
                      ? "rgba(239,68,68,0.08)"
                      : "rgba(245,158,11,0.08)",
              }}
            >
              {d.decision === "promote" ? (
                <CheckCircle2 size={12} style={{ color: "#22c55e", flexShrink: 0 }} />
              ) : d.decision === "block" ? (
                <AlertCircle size={12} style={{ color: "#ef4444", flexShrink: 0 }} />
              ) : (
                <Clock size={12} style={{ color: "#f59e0b", flexShrink: 0 }} />
              )}
              <span
                style={{
                  fontWeight: 600,
                  textTransform: "capitalize",
                  color:
                    d.decision === "promote"
                      ? "#22c55e"
                      : d.decision === "block"
                        ? "#ef4444"
                        : "#f59e0b",
                }}
              >
                {d.decision}
              </span>
              <span
                style={{
                  color: "var(--proof-text-secondary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                }}
              >
                {d.runId.slice(0, 12)}
              </span>
              {d.note && (
                <span
                  style={{ color: "var(--proof-text-muted)", marginLeft: "auto", fontSize: 11 }}
                >
                  {d.note}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyVersionTable() {
  const configs = getEnvConfigs();
  const tiers = TIER_ORDER.map((tier) => ({
    tier,
    staging: configs.find((c) => c.target === tier && c.network === "staging"),
    production: configs.find((c) => c.target === tier && c.network === "production"),
  }));
  return (
    <div
      style={{
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "12px 16px",
          borderBottom: "1px solid var(--proof-border)",
        }}
      >
        <GitCompare size={14} style={{ color: "var(--proof-blue)" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
          Property Version Matrix
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--proof-border)" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  color: "var(--proof-text-secondary)",
                  fontWeight: 600,
                }}
              >
                Tier
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  color: "var(--proof-text-secondary)",
                  fontWeight: 600,
                }}
              >
                Staging
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  color: "var(--proof-text-secondary)",
                  fontWeight: 600,
                }}
              >
                Production
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  color: "var(--proof-text-secondary)",
                  fontWeight: 600,
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {tiers.map(({ tier, staging, production }) => (
              <tr key={tier} style={{ borderBottom: "1px solid var(--proof-border)" }}>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontWeight: 600, color: TIER_META[tier]?.accent }}>{tier}</span>
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--proof-text)",
                  }}
                >
                  v{staging?.propertyVersion ?? "—"}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--proof-text)",
                  }}
                >
                  v{production?.propertyVersion ?? "—"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {staging && <StatusPill status={staging.propertyStatus ?? "active"} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Environments() {
  const [, navigate] = useLocation();
  const configs = getEnvConfigs();
  const decisions = getAllPromotionDecisions();

  const runStats = React.useMemo(() => {
    const map: Record<string, { count: number; passPctSum: number }> = {};
    RUNS.forEach((r) => {
      const key = r.env;
      if (!map[key]) map[key] = { count: 0, passPctSum: 0 };
      map[key].count++;
      map[key].passPctSum += r.passPct;
    });
    return map;
  }, []);

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Environments</h1>
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 4 }}>
            {configs.length} environments across {TIER_ORDER.length} tiers
          </p>
        </div>
      </div>

      {/* Grid: environments grouped by tier */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {TIER_ORDER.map((tier) => {
          const tierConfigs = configs.filter((c) => c.target === tier);
          const meta = TIER_META[tier] ?? { accent: "var(--proof-text)", label: tier };
          return (
            <div key={tier}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div
                  style={{ width: 10, height: 10, borderRadius: "50%", background: meta.accent }}
                />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--proof-text)" }}>
                  {tier}
                </span>
                <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>{meta.label}</span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: 10,
                }}
              >
                {tierConfigs.map((env) => {
                  const stats = runStats[tier] ?? { count: 0, passPctSum: 0 };
                  const avgPass = stats.count > 0 ? Math.round(stats.passPctSum / stats.count) : 0;
                  return (
                    <EnvCard key={env.id} env={env} runCount={stats.count} passRate={avgPass} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom row: property matrix + promotion gate */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <PropertyVersionTable />
        <PromotionGate decisions={decisions} />
      </div>
    </div>
  );
}

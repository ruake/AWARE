import React from "react";
import { useSelectedEnv, useEnvHealth } from "@/lib/hooks/useData";
import { getEnvConfigs } from "@/lib/envConfig";

const TIERS = ["QA", "UAT", "PROD"] as const;

export function EnvTierSelector() {
  const { envIds, setEnvIds } = useSelectedEnv();
  const envHealth = useEnvHealth();

  const tierHealth = React.useMemo(() => {
    const TIERS_LIST = ["QA", "UAT", "PROD"] as const;
    return TIERS_LIST.map((tier) => {
      const tierEnvs = envHealth.filter((e) => e.label.toUpperCase().startsWith(tier));
      const avg =
        tierEnvs.length > 0
          ? Math.round(tierEnvs.reduce((s, e) => s + e.passRate, 0) / tierEnvs.length)
          : 0;
      const min = tierEnvs.length > 0 ? Math.min(...tierEnvs.map((e) => e.passRate)) : 0;
      const status: "healthy" | "degraded" | "critical" =
        min >= 95 ? "healthy" : min >= 80 ? "degraded" : "critical";
      return { tier, passRate: avg, status };
    });
  }, [envHealth]);

  const handleSelect = (tier: string) => {
    if (tier === "all") {
      setEnvIds([]);
    } else {
      setEnvIds(
        getEnvConfigs()
          .filter((e) => e.target === tier)
          .map((e) => e.id),
      );
    }
  };

  const activeTier: string | null =
    envIds.length === 0
      ? "all"
      : (TIERS.find((t) => {
          const ids = getEnvConfigs()
            .filter((e) => e.target === t)
            .map((e) => e.id);
          return ids.length === envIds.length && ids.every((id) => envIds.includes(id));
        }) ?? null);

  const options = ["all", ...TIERS] as const;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
      {options.map((tier, i) => {
        const isActive = activeTier === tier;
        const isFirst = i === 0;
        const isLast = i === options.length - 1;
        const health = tier !== "all" ? tierHealth.find((h) => h.tier === tier) : null;

        const color = health
          ? health.status === "healthy"
            ? "var(--proof-green)"
            : health.status === "degraded"
              ? "var(--proof-yellow)"
              : "var(--proof-red)"
          : isActive
            ? "var(--proof-text)"
            : "var(--proof-text-muted)";

        return (
          <button
            key={tier}
            onClick={() => handleSelect(tier)}
            aria-pressed={isActive}
            title={
              health ? `${health.tier}: ${health.passRate}% pass rate` : "Show all environments"
            }
            style={{
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: isActive ? 700 : 600,
              lineHeight: "16px",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.5px",
              border: "1px solid var(--proof-border)",
              borderRight: isLast ? "1px solid var(--proof-border)" : "none",
              borderTopLeftRadius: isFirst ? "var(--proof-radius-full)" : 0,
              borderBottomLeftRadius: isFirst ? "var(--proof-radius-full)" : 0,
              borderTopRightRadius: isLast ? "var(--proof-radius-full)" : 0,
              borderBottomRightRadius: isLast ? "var(--proof-radius-full)" : 0,
              background: isActive ? "rgba(0,196,255,0.1)" : "rgba(255,255,255,0.02)",
              color: isActive ? "var(--proof-blue)" : "var(--proof-text-secondary)",
              borderColor: isActive ? "var(--proof-blue)" : "var(--proof-border)",
              boxShadow: isActive ? "var(--proof-glow-cyan)" : "none",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 6,
              zIndex: isActive ? 2 : 1,
              position: "relative"
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "var(--proof-text)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.color = "var(--proof-text-secondary)";
              }
            }}
          >
            {health && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
            )}
            <span>{tier === "all" ? "All" : tier}</span>
            {health && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, opacity: 0.7 }}>
                {health.passRate}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

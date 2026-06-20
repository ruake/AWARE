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
      const avg = tierEnvs.length > 0
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
      : TIERS.find((t) => {
          const ids = getEnvConfigs()
            .filter((e) => e.target === t)
            .map((e) => e.id);
          return ids.length === envIds.length && ids.every((id) => envIds.includes(id));
        }) ?? null;

  const options = ["all", ...TIERS] as const;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
      {options.map((tier, i) => {
        const isActive = activeTier === tier;
        const isFirst = i === 0;
        const isLast = i === options.length - 1;
        const health = tier !== "all" ? tierHealth.find((h) => h.tier === tier) : null;

        const color =
          health
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
            title={health ? `${health.tier}: ${health.passRate}% pass rate` : "Show all environments"}
            style={{
              padding: "2px 9px",
              fontSize: 10.5,
              fontWeight: isActive ? 700 : 500,
              lineHeight: "16px",
              fontFamily: "var(--font-sans)",
              letterSpacing: "-0.2px",
              border: isActive
                ? "1px solid var(--proof-border-strong)"
                : "1px solid var(--proof-border)",
              borderRight: isLast ? undefined : "none",
              borderTopLeftRadius: isFirst ? "var(--proof-radius-sm)" : 0,
              borderBottomLeftRadius: isFirst ? "var(--proof-radius-sm)" : 0,
              borderTopRightRadius: isLast ? "var(--proof-radius-sm)" : 0,
              borderBottomRightRadius: isLast ? "var(--proof-radius-sm)" : 0,
              background: isActive ? "var(--proof-hover)" : "transparent",
              color,
              cursor: "pointer",
              transition: "all 0.12s",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "var(--proof-hover-light)";
                e.currentTarget.style.color = "var(--proof-text)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--proof-text-muted)";
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

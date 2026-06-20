import React from "react";
import {
  Activity,
  CheckCircle2,
  Layers,
  TrendingUp,
  Shield,
  Clock,
  Globe,
} from "lucide-react";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";

function useCountUp(target: number): string {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    let n = 0;
    const step = Math.max(1, Math.floor(target / 35));
    const t = setInterval(() => {
      n += step;
      if (n >= target) {
        n = target;
        clearInterval(t);
      }
      setV(n);
    }, 20);
    return () => clearInterval(t);
  }, [target]);
  return v.toLocaleString();
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "20px 22px",
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 14,
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-accent)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border)";
        (e.currentTarget as HTMLElement).style.transform = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--proof-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: "var(--proof-text)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "-2px",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function AboutStats({
  runs,
  tests,
  suites,
  passRate,
  promoPct,
  runsPerDay,
  envCount,
}: {
  runs: number;
  tests: number;
  suites: number;
  passRate: number;
  promoPct: number;
  runsPerDay: string;
  envCount: number;
}) {
  const cRuns = useCountUp(runs);
  const cTests = useCountUp(tests);
  const cSuites = useCountUp(suites);
  const cRate = useCountUp(passRate);

  return (
    <PanelErrorBoundary label="Live stats">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard
          label="Total Runs"
          value={cRuns}
          color="var(--proof-blue)"
          icon={<Activity size={14} />}
        />
        <StatCard
          label="Tests"
          value={cTests}
          color="var(--proof-green)"
          icon={<CheckCircle2 size={14} />}
        />
        <StatCard
          label="Suites"
          value={cSuites}
          color="var(--proof-yellow)"
          icon={<Layers size={14} />}
        />
        <StatCard
          label="Pass Rate"
          value={`${cRate}%`}
          color="var(--proof-green)"
          icon={<TrendingUp size={14} />}
        />
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}
      >
        <StatCard
          label="Promotions"
          value={`${promoPct}%`}
          color="var(--proof-purple)"
          icon={<Shield size={14} />}
        />
        <StatCard
          label="Run Frequency"
          value={runsPerDay}
          color="var(--proof-text-secondary)"
          icon={<Clock size={14} />}
        />
        <StatCard
          label="Environments"
          value={envCount}
          color="var(--proof-cyan)"
          icon={<Globe size={14} />}
        />
      </div>
    </PanelErrorBoundary>
  );
}

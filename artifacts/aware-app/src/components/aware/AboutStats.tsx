import React from "react";
import { Activity, CheckCircle2, Layers, TrendingUp, Shield, Clock, Globe } from "lucide-react";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { motion } from "framer-motion";

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
    <motion.div
      whileHover={{ y: -4, borderColor: "var(--proof-border-accent)" }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "20px 22px",
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 14,
        transition: "border-color 0.15s",
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
    </motion.div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
};

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
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <motion.div variants={item}>
            <StatCard
              label="Total Runs"
              value={cRuns}
              color="var(--proof-blue)"
              icon={<Activity size={14} />}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              label="Tests"
              value={cTests}
              color="var(--proof-green)"
              icon={<CheckCircle2 size={14} />}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              label="Suites"
              value={cSuites}
              color="var(--proof-yellow)"
              icon={<Layers size={14} />}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              label="Avg Pass Rate"
              value={`${cRate}%`}
              color="var(--proof-green)"
              icon={<TrendingUp size={14} />}
            />
          </motion.div>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}
        >
          <motion.div variants={item}>
            <StatCard
              label="Promotions"
              value={`${promoPct}%`}
              color="var(--proof-purple)"
              icon={<Shield size={14} />}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              label="Run Frequency"
              value={runsPerDay}
              color="var(--proof-text-secondary)"
              icon={<Clock size={14} />}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              label="Environments"
              value={envCount}
              color="var(--proof-cyan)"
              icon={<Globe size={14} />}
            />
          </motion.div>
        </div>
      </motion.div>
    </PanelErrorBoundary>
  );
}

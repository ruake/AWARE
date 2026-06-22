import React from "react";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface RunRibbonCardProps {
  label: string;
  run?: { id: string; passPct: number; env: string; started: string };
  nextDue?: string;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
  index: number;
  compact?: boolean;
}

export function RunRibbonCard({
  label,
  run,
  nextDue,
  icon,
  accent,
  onClick,
  index,
  compact = false,
}: RunRibbonCardProps) {
  const [now, setNow] = React.useState(Date.now);
  const [hovered, setHovered] = React.useState(false);

  React.useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const age = React.useMemo(() => {
    const ts = run?.started ?? nextDue;
    if (!ts) return "—";
    const diffMs = now - new Date(ts).getTime();
    
    // Future dated (nextDue)
    if (diffMs < 0) {
      const futureMs = -diffMs;
      const days = Math.floor(futureMs / 86400000);
      if (days > 0) return `In ${days}d`;
      const hrs = Math.floor(futureMs / 3600000);
      if (hrs > 0) return `In ${hrs}h`;
      const mins = Math.floor(futureMs / 60000);
      return `In ${mins}m`;
    }

    // Past dated
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) {
      if (!run && nextDue) return "Queued"; // If it's nextDue and in the past < 1 day
      return `${hrs}h ago`;
    }
    const days = Math.floor(hrs / 24);
    if (!run && nextDue && days >= 1) return `Overdue ${days}d`;
    return `${days}d ago`;
  }, [run?.started, nextDue, now]);

  const passColor = run
    ? run.passPct >= 95
      ? "var(--proof-green)"
      : run.passPct >= 80
        ? "var(--proof-yellow)"
        : "var(--proof-red)"
    : "var(--proof-text-muted)";

  return (
    <motion.div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${label}: ${run?.id ?? (nextDue ? "Scheduled" : "No run")}`}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: (index * 60) / 1000 }}
      whileHover={{ 
        x: 4,
        background: `linear-gradient(90deg, ${accent}12, var(--proof-surface-2))`,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 10 : 12,
        padding: compact ? "10px 12px" : "14px 18px",
        borderRadius: 16,
        background: `linear-gradient(90deg, ${accent}08, var(--proof-surface))`,
        border: `1px solid var(--proof-border)`,
        borderLeft: `4px solid ${accent}`,
        cursor: onClick ? "pointer" : "default",
        boxShadow: hovered
          ? `0 8px 24px rgba(0,0,0,0.5), 0 0 24px ${accent}10, 0 0 0 1px ${accent}20`
          : "0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,130,178,0.08)",
        minWidth: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          width: compact ? 32 : 38,
          height: compact ? 32 : 38,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${accent}24, ${accent}10)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${accent}30`,
          boxShadow: `0 0 12px ${accent}14`,
        }}
      >
        {React.isValidElement(icon)
          ? React.cloneElement(
              icon as React.ReactElement<{ size?: number; style?: React.CSSProperties }>,
              { size: compact ? 14 : 18, style: { color: accent } },
            )
          : icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: compact ? 12 : 13,
            fontWeight: 700,
            color: "var(--proof-text)",
            fontFamily: "var(--font-mono)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.4px",
          }}
        >
          {run?.id ?? (nextDue ? "Scheduled" : "—")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          {run ? (
            <>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--proof-text-muted)",
                  background: "var(--proof-surface-2)",
                  border: "1px solid var(--proof-border-light)",
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontWeight: 600,
                }}
              >
                {run.env}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: passColor,
                  fontFamily: "var(--font-mono)",
                  background: `${passColor}12`,
                  border: `1px solid ${passColor}20`,
                  borderRadius: 4,
                  padding: "1px 6px",
                  letterSpacing: "-0.3px",
                }}
              >
                {run.passPct}%
              </span>
            </>
          ) : nextDue ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                color: accent,
                fontWeight: 700,
              }}
            >
              <Calendar size={10} strokeWidth={2.5} />
              {new Date(nextDue).getTime() > Date.now() ? "Scheduled" : "Queued"}
            </span>
          ) : null}

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              color: "var(--proof-text-muted)",
              fontWeight: 500,
            }}
          >
            <Clock size={10} />
            {age}
          </span>
        </div>
      </div>

      {/* Hover arrow */}
      {onClick && (
        <ArrowRight
          size={16}
          style={{
            color: accent,
            opacity: hovered ? 1 : 0,
            transition: "opacity 160ms ease, transform 160ms ease",
            transform: hovered ? "translateX(0)" : "translateX(-8px)",
            flexShrink: 0,
          }}
        />
      )}
    </motion.div>
  );
}

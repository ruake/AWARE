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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: (index * 60) / 1000, ease: "easeOut" }}
      whileHover={onClick ? { 
        x: 4,
        background: `linear-gradient(90deg, ${accent}15, var(--proof-surface-hover))`,
        borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
      } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 12 : 16,
        padding: compact ? "12px" : "16px",
        borderRadius: "var(--proof-radius-lg)",
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderLeft: `3px solid ${accent}`,
        cursor: onClick ? "pointer" : "default",
        boxShadow: "var(--proof-shadow-sm)",
        position: "relative",
        overflow: "hidden",
        transition: "all var(--proof-transition)",
        minWidth: 0,
      }}
      className="proof-ribbon-card"
      onMouseEnter={(e) => {
        const glow = e.currentTarget.querySelector('.proof-ribbon-glow') as HTMLElement;
        if (glow) glow.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        const glow = e.currentTarget.querySelector('.proof-ribbon-glow') as HTMLElement;
        if (glow) glow.style.opacity = '0';
      }}
    >
      {/* Background glow on hover */}
      <div 
        className="proof-ribbon-glow"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(100px circle at left center, ${accent}10, transparent)`,
          opacity: 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none"
        }}
      />

      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          width: compact ? 36 : 42,
          height: compact ? 36 : 42,
          borderRadius: "var(--proof-radius-md)",
          background: `color-mix(in srgb, ${accent} 15%, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
          color: accent
        }}
      >
        {React.isValidElement(icon)
          ? React.cloneElement(
              icon as React.ReactElement<{ size?: number; strokeWidth?: number }>,
              { size: compact ? 18 : 20, strokeWidth: 2.5 }
            )
          : icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {label}
            </span>
            {run && (
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
            )}
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "var(--proof-text-muted)",
              fontWeight: 500,
            }}
          >
            {run ? <Clock size={12} /> : <Calendar size={12} />}
            {age}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              fontSize: compact ? 13 : 14,
              fontWeight: 600,
              color: "var(--proof-text)",
              fontFamily: "var(--font-mono)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1
            }}
          >
            {run?.id ?? (nextDue ? "Scheduled" : "—")}
          </div>

          {run ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {/* Mini progress bar */}
              <div style={{ width: 48, height: 4, background: "var(--proof-surface-2)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${run.passPct}%`, background: passColor, borderRadius: 2 }} />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: passColor,
                  fontFamily: "var(--font-mono)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: 3, background: passColor }} />
                {run.passPct}%
              </span>
            </div>
          ) : nextDue ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: accent,
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: 3, background: accent }} />
              {new Date(nextDue).getTime() > Date.now() ? "Scheduled" : "Queued"}
            </span>
          ) : (
            <div style={{ width: 6, height: 6, borderRadius: 3, background: "var(--proof-text-muted)" }} />
          )}
        </div>
      </div>

      {/* Hover arrow */}
      {onClick && (
        <div 
          className="proof-ribbon-arrow"
          style={{ color: accent, flexShrink: 0, opacity: 0, transform: "translateX(-8px)", transition: "all 0.2s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateX(0)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.transform = 'translateX(-8px)'; }}
        >
          <ArrowRight size={18} />
        </div>
      )}
    </motion.div>
  );
}

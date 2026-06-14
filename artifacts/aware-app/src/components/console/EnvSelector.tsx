import React from "react";
import { ChevronDown, Check, Search, Globe } from "lucide-react";
import { ENV_CONFIGS, getEnvConfigById } from "../../lib/envConfig";

interface EnvSelectorProps {
  currentEnvId?: string;
  onEnvChange?: (envId: string) => void;
  variant?: "topbar" | "full";
}

const GROUP_LABELS: Record<string, string> = {
  QA: "QA Environments",
  UAT: "UAT Environments",
  PROD: "PROD Environments",
};

const TIER_ORDER = ["QA", "UAT", "PROD"];

function filterEnvs(query: string) {
  if (!query) return ENV_CONFIGS;
  const q = query.toLowerCase();
  return ENV_CONFIGS.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.target.toLowerCase().includes(q) ||
      e.network.toLowerCase().includes(q),
  );
}

function getGroupedEnvs(filtered: typeof ENV_CONFIGS) {
  const groups: Record<string, typeof ENV_CONFIGS> = {};
  for (const env of filtered) {
    if (!groups[env.target]) groups[env.target] = [];
    groups[env.target].push(env);
  }
  return groups;
}

export function EnvSelector({ currentEnvId, onEnvChange, variant = "topbar" }: EnvSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const current = currentEnvId ? getEnvConfigById(currentEnvId) : undefined;

  const filtered = filterEnvs(query);
  const grouped = getGroupedEnvs(filtered);

  const flatItems = React.useMemo(() => {
    const items: { envId: string; label: string }[] = [];
    for (const tier of TIER_ORDER) {
      const group = grouped[tier];
      if (!group) continue;
      for (const env of group) {
        items.push({ envId: env.id, label: env.label });
      }
    }
    return items;
  }, [query, grouped]);

  React.useEffect(() => {
    setActiveIdx(-1);
  }, [query]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(-1);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
      return;
    }
    if (e.key === "Enter" && activeIdx >= 0 && activeIdx < flatItems.length) {
      e.preventDefault();
      const item = flatItems[activeIdx];
      onEnvChange?.(item.envId);
      setOpen(false);
    }
  }

  React.useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLElement>("[data-env-item]");
    if (items[activeIdx]) {
      items[activeIdx].scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  const trigger = (
    <button
      ref={triggerRef}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((o) => !o);
        }
      }}
      aria-haspopup="listbox"
      aria-expanded={open}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: variant === "full" ? "8px 14px" : "4px 8px",
        fontSize: variant === "full" ? 13 : 11,
        fontWeight: 600,
        cursor: "pointer",
        border: "1px solid var(--proof-border-strong)",
        borderRadius: 5,
        background: variant === "full" ? "var(--proof-surface-2)" : "rgba(255,255,255,0.03)",
        color: "var(--proof-text-secondary)",
        fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
        transition: "all 0.15s",
        width: variant === "full" ? "100%" : undefined,
        justifyContent: variant === "full" ? "space-between" : undefined,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        e.currentTarget.style.color = "var(--proof-text)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          variant === "full" ? "var(--proof-surface-2)" : "rgba(255,255,255,0.03)";
        e.currentTarget.style.color = "var(--proof-text-secondary)";
      }}
    >
      {variant === "full" && <Globe size={14} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />}
      <span style={{ flex: 1, textAlign: "left" }}>{current?.label ?? "Select environment"}</span>
      <ChevronDown
        size={12}
        style={{
          flexShrink: 0,
          color: "var(--proof-text-muted)",
          transition: "transform 0.15s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
    </button>
  );

  const panel = open && (
    <div
      ref={panelRef}
      role="listbox"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{
        position: variant === "full" ? "relative" : "absolute",
        top: variant === "full" ? 4 : "calc(100% + 4px)",
        left: 0,
        right: variant === "full" ? undefined : 0,
        width: variant === "full" ? "100%" : 280,
        background: "var(--proof-surface-2)",
        border: "1px solid var(--proof-border)",
        borderRadius: 6,
        boxShadow: "var(--proof-shadow-lg)",
        zIndex: 200,
        overflow: "hidden",
        animation: "slide-down 0.15s ease-out",
      }}
    >
      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 8px",
          borderBottom: "1px solid var(--proof-border)",
        }}
      >
        <Search size={13} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find environments"
          role="searchbox"
          aria-label="Find environments"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12,
            color: "var(--proof-text)",
            fontFamily: "var(--font-sans)",
            minWidth: 0,
          }}
        />
      </div>

      {/* Groups */}
      <div
        ref={listRef}
        style={{
          maxHeight: 320,
          overflowY: "auto",
          padding: "4px 0",
        }}
      >
        {filtered.length === 0 && (
          <div
            style={{
              padding: "16px 12px",
              textAlign: "center",
              fontSize: 12,
              color: "var(--proof-text-muted)",
            }}
          >
            No environments match "{query}"
          </div>
        )}

        {TIER_ORDER.map((tier) => {
          const group = grouped[tier];
          if (!group || group.length === 0) return null;
          let groupAccent: string;
          if (tier === "QA") groupAccent = "var(--proof-blue)";
          else if (tier === "UAT") groupAccent = "var(--proof-yellow)";
          else groupAccent = "var(--proof-green)";

          return (
            <div key={tier}>
              <div
                style={{
                  padding: "6px 10px 4px",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  color: "var(--proof-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: groupAccent,
                    flexShrink: 0,
                  }}
                />
                {GROUP_LABELS[tier]}
              </div>
              {group.map((env) => {
                const isSelected = env.id === currentEnvId;
                const flatIdx = flatItems.findIndex((f) => f.envId === env.id);
                const isActive = flatIdx === activeIdx;

                return (
                  <div
                    key={env.id}
                    data-env-item
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onEnvChange?.(env.id);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setActiveIdx(flatIdx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px 7px 26px",
                      cursor: "pointer",
                      fontSize: 12,
                      color: isActive ? "var(--proof-text)" : "var(--proof-text-secondary)",
                      background: isActive
                        ? "var(--proof-surface-hover)"
                        : "transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>{env.label}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        padding: "1px 5px",
                        borderRadius: 3,
                        fontFamily: "var(--font-mono)",
                        background:
                          env.network === "staging"
                            ? "rgba(245,158,11,0.12)"
                            : "rgba(37,99,235,0.12)",
                        color:
                          env.network === "staging"
                            ? "var(--proof-yellow)"
                            : "var(--proof-blue)",
                        border:
                          env.network === "staging"
                            ? "1px solid rgba(245,158,11,0.25)"
                            : "1px solid rgba(37,99,235,0.25)",
                      }}
                    >
                      {env.network}
                    </span>
                    {isSelected && (
                      <Check size={13} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (variant === "full") {
    return (
      <div style={{ width: "100%", position: "relative" }}>
        {trigger}
        {panel}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {trigger}
      {panel}
    </div>
  );
}

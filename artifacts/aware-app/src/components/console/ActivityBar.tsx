import React from "react";

interface ActivityItem {
  id: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  onClick: () => void;
}

interface ActivityBarProps {
  items: ActivityItem[];
  activeId?: string;
  onSidebarToggle: () => void;
  sidebarVisible: boolean;
}

export function ActivityBar({
  items,
  activeId,
  onSidebarToggle,
  sidebarVisible,
}: ActivityBarProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  return (
    <aside
      style={{
        width: 64,
        minWidth: 64,
        background: "var(--proof-activity-bar-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRight: "1px solid var(--proof-border)",
        flexShrink: 0,
        height: "100%",
        userSelect: "none",
        paddingTop: 8,
        paddingBottom: 8,
        gap: 2,
        position: "relative",
        zIndex: 10,
      }}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const isHovered = hoveredId === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={item.onClick}
            title={item.label}
            aria-label={item.label}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              position: "relative",
              width: 48,
              height: 48,
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              transition: "all 150ms cubic-bezier(0.2,0,0,1)",
              background: isActive
                ? "linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(96,165,250,0.12) 100%)"
                : isHovered
                  ? "var(--proof-hover)"
                  : "transparent",
              color: isActive
                ? "var(--proof-blue-bright)"
                : isHovered
                  ? "var(--proof-text)"
                  : "var(--proof-text-muted)",
              boxShadow: isActive
                ? "inset 0 0 0 1px rgba(59,130,246,0.25), 0 0 0 1px rgba(59,130,246,0.1)"
                : "none",
              transform: isHovered && !isActive ? "scale(1.05)" : "scale(1)",
              flexShrink: 0,
            }}
          >
            {/* Active indicator left bar */}
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  left: -8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 3,
                  height: 28,
                  borderRadius: "0 3px 3px 0",
                  background: "linear-gradient(180deg, var(--proof-blue-bright), var(--proof-blue))",
                  boxShadow: "0 0 8px var(--proof-blue-glow)",
                }}
              />
            )}

            {/* Glow ring on active */}
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 12,
                  background:
                    "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.25) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
            )}

            <Icon
              size={18}
              style={{
                transition: "transform 150ms ease",
                transform: isHovered ? "scale(1.1)" : "scale(1)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 8.5,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.1px",
                textTransform: "uppercase",
                lineHeight: 1,
                opacity: isActive ? 1 : 0.7,
                maxWidth: 48,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Sidebar toggle */}
      <button
        onClick={onSidebarToggle}
        title={sidebarVisible ? "Collapse panel" : "Expand panel"}
        aria-label="Toggle sidebar"
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "var(--proof-hover)";
          el.style.color = "var(--proof-text)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "transparent";
          el.style.color = "var(--proof-text-muted)";
        }}
        style={{
          width: 32,
          height: 32,
          border: "1px solid var(--proof-border)",
          borderRadius: 8,
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--proof-text-muted)",
          transition: "all 150ms ease",
          marginTop: 4,
          flexShrink: 0,
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: "transform 200ms ease",
            transform: sidebarVisible ? "scaleX(1)" : "scaleX(-1)",
          }}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>
    </aside>
  );
}

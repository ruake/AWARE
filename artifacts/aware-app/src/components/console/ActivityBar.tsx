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
        width: 56,
        minWidth: 56,
        background: "var(--proof-activity-bar-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRight: "1px solid var(--proof-border-strong)",
        flexShrink: 0,
        height: "100%",
        userSelect: "none",
        paddingTop: 12,
        paddingBottom: 12,
        gap: 8,
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
              width: 44,
              height: 44,
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              transition: "all 200ms cubic-bezier(0.2,0,0,1)",
              background: isActive
                ? "var(--proof-blue-bg)"
                : isHovered
                  ? "var(--proof-surface-3)"
                  : "transparent",
              color: isActive
                ? "var(--proof-blue-bright)"
                : isHovered
                  ? "var(--proof-text)"
                  : "var(--proof-text-muted)",
              boxShadow: isActive
                ? "var(--proof-glow-cyan)"
                : "none",
              transform: isHovered && !isActive ? "scale(1.05)" : "scale(1)",
              flexShrink: 0,
            }}
          >
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  left: -6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 3,
                  height: 24,
                  borderRadius: "0 4px 4px 0",
                  background: "var(--proof-blue)",
                  boxShadow: "var(--proof-glow-cyan)",
                  zIndex: 2,
                }}
              />
            )}

            <Icon
              size={18}
              style={{
                transition: "transform 200ms ease",
                transform: isHovered ? "scale(1.1)" : "scale(1)",
                flexShrink: 0,
              }}
            />
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

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
          border: "1px solid var(--proof-border-strong)",
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

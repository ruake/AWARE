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
  return (
    <aside
      style={{
        width: "var(--proof-activity-bar-width)",
        minWidth: "var(--proof-activity-bar-width)",
        background: "var(--proof-activity-bar-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        borderRight: "1px solid var(--proof-border)",
        flexShrink: 0,
        height: "100%",
        userSelect: "none",
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={item.onClick}
            title={item.label}
            aria-label={item.label}
            className={`proof-nav-item${isActive ? " active" : ""}`}
          >
            {/* Active left accent bar */}
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 2,
                  height: 24,
                  borderRadius: "0 2px 2px 0",
                  background: "var(--proof-blue)",
                  boxShadow: "0 0 8px var(--proof-blue-glow)",
                }}
              />
            )}
            <Icon size={16} />
            <span className="proof-nav-label">{item.label}</span>
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Sidebar toggle */}
      <button
        onClick={onSidebarToggle}
        title={sidebarVisible ? "Collapse panel" : "Expand panel"}
        aria-label="Toggle sidebar"
        style={{
          width: "100%",
          height: 38,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          color: sidebarVisible ? "var(--proof-text-secondary)" : "var(--proof-text-muted)",
          transition: "color var(--proof-transition), background var(--proof-transition)",
          opacity: sidebarVisible ? 1 : 0.5,
          borderTop: "1px solid var(--proof-border)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "var(--proof-text)";
          el.style.background = "var(--proof-hover)";
          el.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = sidebarVisible
            ? "var(--proof-text-secondary)"
            : "var(--proof-text-muted)";
          el.style.background = "transparent";
          el.style.opacity = sidebarVisible ? "1" : "0.5";
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: "transform var(--proof-transition-slow)",
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

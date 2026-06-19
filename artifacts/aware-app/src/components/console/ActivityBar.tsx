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
        alignItems: "center",
        borderRight: "1px solid var(--proof-border)",
        flexShrink: 0,
        height: "100%",
        userSelect: "none",
        paddingTop: 6,
        paddingBottom: 6,
      }}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const Icon = item.icon;
        return (
          <NavButton
            key={item.id}
            icon={<Icon size={18} />}
            label={item.label}
            isActive={isActive}
            onClick={item.onClick}
          />
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Sidebar toggle */}
      <button
        onClick={onSidebarToggle}
        title={sidebarVisible ? "Collapse panel" : "Expand panel"}
        aria-label="Toggle sidebar"
        style={{
          width: 40,
          height: 40,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--proof-radius)",
          color: sidebarVisible ? "var(--proof-text-secondary)" : "var(--proof-text-muted)",
          transition: "color var(--proof-transition), background var(--proof-transition)",
          marginBottom: 2,
          opacity: sidebarVisible ? 1 : 0.6,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
          (e.currentTarget as HTMLElement).style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = sidebarVisible
            ? "var(--proof-text-secondary)"
            : "var(--proof-text-muted)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.opacity = sidebarVisible ? "1" : "0.6";
        }}
      >
        <svg
          width="16"
          height="16"
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

function NavButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        marginBottom: 2,
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <div
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
      <button
        onClick={onClick}
        title={label}
        aria-label={label}
        style={{
          width: 40,
          height: 40,
          border: "none",
          background: isActive ? "rgba(0,122,204,0.12)" : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--proof-radius)",
          color: isActive ? "var(--proof-blue-bright)" : "var(--proof-text-muted)",
          transition: "all var(--proof-transition)",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }
        }}
      >
        {icon}
      </button>
    </div>
  );
}

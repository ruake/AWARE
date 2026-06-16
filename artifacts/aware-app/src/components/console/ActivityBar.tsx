import React from "react";
import { useLocation } from "wouter";

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
  const [location] = useLocation();

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
        paddingTop: 4,
      }}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            style={{
              position: "relative",
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 6,
                  width: 2,
                  height: 36,
                  borderRadius: "0 2px 2px 0",
                  background: "var(--proof-text)",
                }}
              />
            )}
            <button
              onClick={item.onClick}
              title={item.label}
              aria-label={item.label}
              style={{
                width: 40,
                height: 40,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 4,
                color: isActive ? "var(--proof-text)" : "var(--proof-text-secondary)",
                transition: "color 0.1s, background 0.1s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <Icon size={20} />
            </button>
          </div>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Sidebar toggle at bottom */}
      <button
        onClick={onSidebarToggle}
        title={sidebarVisible ? "Close sidebar" : "Open sidebar"}
        aria-label="Toggle sidebar"
        style={{
          width: 48,
          height: 48,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--proof-text-secondary)",
          transition: "color 0.1s, background 0.1s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>
    </aside>
  );
}

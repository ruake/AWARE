import React from "react";
import { Link } from "wouter";
import { icons, ChevronLeft, ChevronRight } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number | string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface ConsoleSidebarProps {
  navGroups: NavGroup[];
  activePath: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function resolveIcon(name: string) {
  const IconComp = (icons as Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>>)[name];
  return IconComp;
}

export function ConsoleSidebar({
  navGroups,
  activePath,
  collapsed,
  onToggleCollapse,
}: ConsoleSidebarProps) {
  const [hovered, setHovered] = React.useState(false);
  const effectiveWidth = collapsed && !hovered ? 48 : 200;

  const isActive = (href: string) =>
    href === "/" ? activePath === "/" : activePath === href || activePath.startsWith(href + "/");

  return (
    <aside
      style={{
        width: effectiveWidth,
        transition: "width 0.2s ease",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--proof-surface)",
        borderRight: "1px solid var(--proof-border)",
        overflow: "hidden",
        height: "100%",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Nav groups */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "8px 0",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {navGroups.map((group, gi) => (
          <div key={`${group.title}-${gi}`}>
            {/* Group title */}
            <div
              style={{
                padding: collapsed && !hovered ? "0" : "6px 16px 4px",
                fontSize: 10,
                fontWeight: 700,
                color: "var(--proof-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                fontFamily: "var(--font-mono)",
                opacity: collapsed && !hovered ? 0 : 1,
                transition: "opacity 0.2s ease, padding 0.2s ease",
                height: collapsed && !hovered ? 0 : "auto",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {group.title}
            </div>

            {/* Items */}
            {group.items.map((item) => {
              const active = isActive(item.href);
              const IconComp = resolveIcon(item.icon);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed && !hovered ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: collapsed && !hovered ? "10px 14px" : "8px 14px",
                    margin: "0 6px",
                    cursor: "pointer",
                    textDecoration: "none",
                    color: active ? "var(--proof-blue)" : "var(--proof-text-secondary)",
                    background: active ? "rgba(37,99,235,0.10)" : "transparent",
                    borderRadius: 6,
                    transition: "background 0.15s, color 0.15s, padding 0.2s ease",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    justifyContent: collapsed && !hovered ? "center" : "flex-start",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "var(--proof-text)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--proof-text-secondary)";
                    }
                  }}
                >
                  {IconComp ? (
                    <IconComp
                      size={18}
                      style={{
                        flexShrink: 0,
                        color: active ? "var(--proof-blue)" : "var(--proof-text-secondary)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        background: "var(--proof-grey)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      opacity: collapsed && !hovered ? 0 : 1,
                      transition: "opacity 0.2s ease",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: active
                          ? "rgba(37,99,235,0.15)"
                          : "rgba(255,255,255,0.06)",
                        color: active ? "var(--proof-blue)" : "var(--proof-text-muted)",
                        opacity: collapsed && !hovered ? 0 : 1,
                        transition: "opacity 0.2s ease",
                        flexShrink: 0,
                        lineHeight: "14px",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Collapse toggle */}
      <div
        style={{
          borderTop: "1px solid var(--proof-border)",
          padding: "4px 6px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onToggleCollapse}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed && !hovered ? "center" : "flex-start",
            gap: 8,
            width: "100%",
            padding: collapsed && !hovered ? "8px 0" : "6px 8px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-muted)",
            borderRadius: 6,
            transition: "background 0.15s, color 0.15s",
            fontSize: 11,
            fontFamily: "var(--font-sans)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "var(--proof-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--proof-text-muted)";
          }}
        >
          {collapsed && !hovered ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span
                style={{
                  opacity: collapsed && !hovered ? 0 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                Collapse
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

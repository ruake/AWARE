import React from "react";
import { Link } from "wouter";
import {
  Activity,
  BarChart3,
  Beaker,
  Bot,
  CheckCircle2,
  Container,
  FileText,
  FolderTree,
  GitCompare,
  Globe,
  History,
  Info,
  LayoutDashboard,
  PlayCircle,
  Radio,
  Search,
  Share2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

const ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; style?: React.CSSProperties }>
> = {
  Activity,
  BarChart3,
  Beaker,
  Bot,
  CheckCircle2,
  Container,
  FileText,
  FolderTree,
  GitCompare,
  Globe,
  History,
  Info,
  LayoutDashboard,
  PlayCircle,
  Radio,
  Search,
  Share2,
};

function resolveIcon(name: string) {
  return ICON_MAP[name];
}

export function ConsoleSidebar({
  navGroups,
  activePath,
  collapsed,
  onToggleCollapse,
}: ConsoleSidebarProps) {
  const [hovered, setHovered] = React.useState(false);
  const expanded = !collapsed || hovered;
  const effectiveWidth = expanded
    ? "var(--proof-console-sidebar-width)"
    : "var(--proof-console-sidebar-collapsed)";

  const isActive = (href: string) =>
    href === "/" ? activePath === "/" : activePath === href || activePath.startsWith(href + "/");

  return (
    <aside
      style={{
        width: effectiveWidth,
        minWidth: effectiveWidth,
        transition:
          "width 0.2s cubic-bezier(0.4,0,0.2,1), min-width 0.2s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--proof-sidebar-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRight: "1px solid var(--proof-border)",
        overflow: "hidden",
        height: "100%",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "8px 6px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {navGroups.map((group, gi) => (
          <div key={`${group.title}-${gi}`} style={{ marginBottom: 4 }}>
            {gi > 0 && (
              <div
                style={{
                  height: 1,
                  background: "var(--proof-border)",
                  margin: "6px 6px",
                  opacity: expanded ? 1 : 0,
                  transition: "opacity 0.15s",
                }}
              />
            )}

            {/* Group label */}
            <div
              style={{
                padding: expanded ? "6px 10px 3px" : "0",
                fontSize: 9.5,
                fontWeight: 700,
                color: "var(--proof-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.9px",
                fontFamily: "var(--font-mono)",
                opacity: expanded ? 1 : 0,
                height: expanded ? "auto" : 0,
                overflow: "hidden",
                whiteSpace: "nowrap",
                transition: "opacity 0.15s, height 0.15s",
                userSelect: "none",
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
                  title={!expanded ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: expanded ? "7px 10px" : "8px 0",
                    margin: "1px 0",
                    justifyContent: expanded ? "flex-start" : "center",
                    cursor: "pointer",
                    textDecoration: "none",
                    color: active
                      ? "var(--proof-console-nav-active-text)"
                      : "var(--proof-console-nav-text)",
                    background: active ? "var(--proof-console-nav-active)" : "transparent",
                    borderRadius: 8,
                    transition: "background 0.12s, color 0.12s",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--proof-console-nav-hover)";
                      (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--proof-console-nav-text)";
                    }
                  }}
                >
                  {/* Active indicator dot */}
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 3,
                        height: 14,
                        borderRadius: "0 3px 3px 0",
                        background: "var(--proof-console-nav-active-text)",
                      }}
                    />
                  )}

                  {IconComp ? (
                    <IconComp
                      size={15}
                      style={{
                        flexShrink: 0,
                        opacity: active ? 1 : 0.65,
                        marginLeft: active && expanded ? 6 : active ? 0 : 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: 4,
                        background: "var(--proof-border)",
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: active ? 600 : 400,
                      letterSpacing: "-0.1px",
                      opacity: expanded ? 1 : 0,
                      transition: "opacity 0.15s",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.label}
                  </span>

                  {item.badge !== undefined && expanded && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 999,
                        background: active
                          ? "var(--proof-console-nav-active)"
                          : "var(--proof-subtle-bg2)",
                        color: active
                          ? "var(--proof-console-nav-active-text)"
                          : "var(--proof-text-muted)",
                        border: `1px solid ${active ? "var(--proof-border-accent)" : "var(--proof-border)"}`,
                        flexShrink: 0,
                        minWidth: 18,
                        textAlign: "center",
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
      <div style={{ borderTop: "1px solid var(--proof-border)", padding: "6px", flexShrink: 0 }}>
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: expanded ? "flex-start" : "center",
            gap: 8,
            width: "100%",
            padding: expanded ? "6px 10px" : "7px 0",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-muted)",
            borderRadius: 8,
            transition: "background 0.13s, color 0.13s",
            fontSize: 11.5,
            fontFamily: "var(--font-sans)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--proof-console-nav-hover)";
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)";
          }}
        >
          {!expanded ? (
            <ChevronRight size={14} />
          ) : (
            <>
              <ChevronLeft size={14} />
              <span
                style={{ opacity: 1, transition: "opacity 0.15s", fontWeight: 500, fontSize: 11.5 }}
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

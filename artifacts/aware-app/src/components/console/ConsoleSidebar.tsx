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
  const effectiveWidth = expanded ? 200 : 52;

  const isActive = (href: string) =>
    href === "/" ? activePath === "/" : activePath === href || activePath.startsWith(href + "/");

  return (
    <aside
      style={{
        width: effectiveWidth,
        transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--proof-sidebar-bg)",
        backdropFilter: "blur(10px)",
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
          gap: 2,
        }}
      >
        {navGroups.map((group, gi) => (
          <div key={`${group.title}-${gi}`}>
            {gi > 0 && (
              <div
                style={{
                  margin: "6px 10px",
                  borderTop: "1px solid var(--proof-border)",
                  opacity: 0.5,
                }}
              />
            )}

            {/* Group label */}
            <div
              style={{
                padding: expanded ? "6px 16px 3px" : "0",
                fontSize: 9.5,
                fontWeight: 700,
                color: "var(--proof-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                fontFamily: "var(--font-mono)",
                opacity: expanded ? 1 : 0,
                height: expanded ? "auto" : 0,
                overflow: "hidden",
                whiteSpace: "nowrap",
                transition: "opacity 0.15s, height 0.15s",
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
                    gap: 10,
                    padding: expanded ? "7px 12px" : "9px 0",
                    margin: "1px 0",
                    justifyContent: expanded ? "flex-start" : "center",
                    cursor: "pointer",
                    textDecoration: "none",
                    color: active ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
                    background: active ? "rgba(59,130,246,0.1)" : "transparent",
                    borderLeft: active ? "2px solid var(--proof-blue)" : "2px solid transparent",
                    transition: "background 0.12s, color 0.12s, border-color 0.12s",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.06)";
                      (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
                    }
                  }}
                >
                  {IconComp ? (
                    <IconComp size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
                  ) : (
                    <div
                      style={{
                        width: 16,
                        height: 16,
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
                        background: active ? "rgba(59,130,246,0.15)" : "var(--proof-hover)",
                        color: active ? "var(--proof-blue-bright)" : "var(--proof-text-muted)",
                        border: `1px solid ${active ? "rgba(59,130,246,0.25)" : "var(--proof-border)"}`,
                        flexShrink: 0,
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
        style={{ borderTop: "1px solid var(--proof-border)", padding: "4px 6px", flexShrink: 0 }}
      >
        <button
          onClick={onToggleCollapse}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: expanded ? "flex-start" : "center",
            gap: 8,
            width: "100%",
            padding: expanded ? "6px 8px" : "8px 0",
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
            (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)";
          }}
        >
          {!expanded ? (
            <ChevronRight size={15} />
          ) : (
            <>
              <ChevronLeft size={15} />
              <span style={{ opacity: expanded ? 1 : 0, transition: "opacity 0.15s" }}>
                Collapse
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

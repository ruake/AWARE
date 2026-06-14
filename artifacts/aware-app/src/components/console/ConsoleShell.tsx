import React from "react";
import { ConsoleTopBar } from "./ConsoleTopBar";
import { ConsoleSidebar } from "./ConsoleSidebar";
import { ConsoleBreadcrumbs } from "./ConsoleBreadcrumbs";
import { CommandPalette } from "../aware/CommandPalette";
import { useLiveStatus } from "@/lib/useLiveStatus";
import { Check, AlertTriangle, Activity, X } from "lucide-react";

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

interface ConsoleShellProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  sidebarNav?: NavGroup[];
  activePath?: string;
}

export function ConsoleShell({
  children,
  breadcrumbs,
  sidebarNav,
  activePath = "/",
}: ConsoleShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const paletteRef = React.useRef(paletteOpen);
  const pendingG = React.useRef(false);
  const { currentToast, dismissToast } = useLiveStatus();

  React.useEffect(() => {
    paletteRef.current = paletteOpen;
  }, [paletteOpen]);

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && e.shiftKey) {
        e.preventDefault();
        setPaletteOpen((p) => !p);
        return;
      }
      if (e.key === "g" && !e.ctrlKey && !e.metaKey) {
        pendingG.current = true;
        setTimeout(() => {
          pendingG.current = false;
        }, 500);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((p) => !p);
        return;
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (e.key === "Escape") {
        if (paletteRef.current) {
          setPaletteOpen(false);
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed((p) => !p);

  return (
    <div
      style={{
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--proof-bg)",
        color: "var(--proof-text)",
      }}
    >
      {/* Top bar — fixed */}
      <ConsoleTopBar
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
        onSearchOpen={() => setPaletteOpen(true)}
      />

      {/* Below top bar layout */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
          marginTop: 48,
        }}
      >
        {/* Sidebar */}
        {sidebarNav && sidebarNav.length > 0 && (
          <ConsoleSidebar
            navGroups={sidebarNav}
            activePath={activePath}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        )}

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && <ConsoleBreadcrumbs items={breadcrumbs} />}

          {/* Content */}
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "20px 24px",
            }}
          >
            {children}
          </main>
        </div>
      </div>

      {/* Command Palette */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      {/* Live status toast */}
      {currentToast && (
        <div
          onClick={dismissToast}
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            borderRadius: 10,
            zIndex: 50,
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            border: `1px solid ${currentToast.type === "success" ? "var(--proof-green)" : currentToast.type === "warning" ? "var(--proof-yellow)" : "var(--proof-blue)"}`,
            background:
              currentToast.type === "success"
                ? "var(--proof-green-bg)"
                : currentToast.type === "warning"
                  ? "var(--proof-yellow-bg)"
                  : "var(--proof-blue-bg)",
            color:
              currentToast.type === "success"
                ? "var(--proof-green)"
                : currentToast.type === "warning"
                  ? "var(--proof-yellow)"
                  : "var(--proof-blue)",
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {currentToast.type === "success" ? (
            <Check size={15} />
          ) : currentToast.type === "warning" ? (
            <AlertTriangle size={15} />
          ) : (
            <Activity size={15} />
          )}
          {currentToast.message}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissToast();
            }}
            aria-label="Close"
            style={{
              marginLeft: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              opacity: 0.6,
              lineHeight: 1,
              color: "inherit",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

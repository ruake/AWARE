import React from "react";
import { useLocation } from "wouter";
import { ConsoleTopBar } from "./ConsoleTopBar";
import { ConsoleSidebar } from "./ConsoleSidebar";
import { ActivityBar } from "./ActivityBar";
import { StatusBar } from "./StatusBar";
import { CommandPalette } from "../aware/CommandPalette";
import { useLiveStatus } from "@/lib/useLiveStatus";
import {
  Check,
  AlertTriangle,
  Activity,
  X,
  LayoutDashboard,
  History,
  GitCompare,
  BarChart3,
  Beaker,
  Bot,
  Settings,
  Info,
} from "lucide-react";

interface ConsoleShellProps {
  children: React.ReactNode;
}

const ACTIVITY_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { id: "runs", icon: History, label: "Runs", href: "/runs" },
  { id: "compare", icon: GitCompare, label: "Compare", href: "/compare" },
  { id: "trends", icon: BarChart3, label: "Trends", href: "/trends" },
  { id: "tests", icon: Beaker, label: "Tests", href: "/tests" },
  { id: "copilot", icon: Bot, label: "Copilot", href: "/copilot" },
  { id: "settings", icon: Settings, label: "Settings", href: "/settings" },
  { id: "about", icon: Info, label: "About", href: "/about" },
];

function activityIdFromPath(path: string): string {
  if (path === "/") return "dashboard";
  const seg = path.split("/")[1];
  if (seg === "runs" || seg === "activity" || seg === "pulse") return "runs";
  if (seg === "compare") return "compare";
  if (seg === "trends" || seg === "analytics") return "trends";
  if (seg === "tests") return "tests";
  if (seg === "copilot") return "copilot";
  if (seg === "settings") return "settings";
  if (seg === "about") return "about";
  return "dashboard";
}

export function ConsoleShell({ children }: ConsoleShellProps) {
  const [location, navigate] = useLocation();
  const [sidebarVisible, setSidebarVisible] = React.useState(true);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const paletteRef = React.useRef(paletteOpen);
  const { currentToast, dismissToast } = useLiveStatus();

  const currentActivity = activityIdFromPath(location);

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

  // Auto-hide sidebar on About and Settings (no useful sidebar context there)
  React.useEffect(() => {
    if (currentActivity === "about" || currentActivity === "settings") {
      const id = setTimeout(() => setSidebarVisible(false), 0);
      return () => clearTimeout(id);
    }
    return;
  }, [currentActivity]);

  const handleActivityClick = (item: (typeof ACTIVITY_ITEMS)[number]) => {
    if (item.id === "about" || item.id === "settings") {
      navigate(item.href);
      setSidebarVisible(false);
    } else if (item.id === currentActivity && sidebarVisible) {
      setSidebarVisible(false);
    } else {
      setSidebarVisible(true);
      navigate(item.href);
    }
  };

  const toggleSidebar = () => setSidebarVisible((p) => !p);

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
      {/* Title bar */}
      <ConsoleTopBar onSearchOpen={() => setPaletteOpen(true)} />

      {/* Main area: ActivityBar + Sidebar + Content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Activity Bar (always visible, leftmost) */}
        <ActivityBar
          items={ACTIVITY_ITEMS.map((item) => ({
            ...item,
            onClick: () => handleActivityClick(item),
          }))}
          activeId={currentActivity}
          onSidebarToggle={toggleSidebar}
          sidebarVisible={sidebarVisible}
        />

        {/* Sidebar */}
        <div
          style={{
            display: "flex",
            transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            width: sidebarVisible ? "auto" : 0,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {sidebarVisible && (
            <ConsoleSidebar
              activePanel={currentActivity}
              visible={sidebarVisible}
              onClose={() => setSidebarVisible(false)}
            />
          )}
        </div>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            overflowX: "hidden",
            background: "var(--proof-editor-bg)",
            backgroundImage:
              "radial-gradient(circle, rgba(99,130,178,0.045) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            position: "relative",
          }}
        >
          {children}
        </main>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Command Palette */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      {/* Live status toast */}
      {currentToast && (() => {
        const toastColor =
          currentToast.type === "success"
            ? "var(--proof-green)"
            : currentToast.type === "warning"
              ? "var(--proof-yellow)"
              : "var(--proof-blue)";
        const toastBg =
          currentToast.type === "success"
            ? "var(--proof-green-bg)"
            : currentToast.type === "warning"
              ? "var(--proof-yellow-bg)"
              : "var(--proof-blue-bg)";
        const ToastIcon =
          currentToast.type === "success"
            ? Check
            : currentToast.type === "warning"
              ? AlertTriangle
              : Activity;
        return (
          <div
            onClick={dismissToast}
            style={{
              position: "fixed",
              bottom: 40,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 20px",
              borderRadius: 16,
              zIndex: 1000,
              cursor: "pointer",
              boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px ${toastColor}40, 0 0 32px ${toastColor}20`,
              border: `1px solid ${toastColor}40`,
              background: `linear-gradient(135deg, ${toastBg}, rgba(13,24,42,0.98))`,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              color: toastColor,
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
              animation: "page-enter 0.3s cubic-bezier(0.2,0,0,1) both",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: `${toastColor}20`,
              }}
            >
              <ToastIcon size={14} aria-hidden="true" />
            </span>
            {currentToast.message}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast();
              }}
              aria-label="Close"
              style={{
                marginLeft: 8,
                background: "var(--proof-surface-3)",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                opacity: 0.8,
                color: "inherit",
                padding: 4,
                display: "flex",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
            >
              <X size={14} />
            </button>
          </div>
        );
      })()}
    </div>
  );
}

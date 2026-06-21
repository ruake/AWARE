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
        {sidebarVisible && (
          <ConsoleSidebar
            activePanel={currentActivity}
            visible={sidebarVisible}
            onClose={() => setSidebarVisible(false)}
          />
        )}

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
              gap: 10,
              padding: "10px 16px",
              borderRadius: 12,
              zIndex: 100,
              cursor: "pointer",
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${toastColor}30, 0 0 24px ${toastColor}18`,
              border: `1px solid ${toastColor}30`,
              background: `linear-gradient(135deg, ${toastBg}, rgba(13,18,32,0.95))`,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              color: toastColor,
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: "nowrap",
              animation: "toast-pop 0.2s cubic-bezier(0.2,0,0,1) both",
            }}
          >
            <ToastIcon size={14} aria-hidden="true" />
            {currentToast.message}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast();
              }}
              aria-label="Close"
              style={{
                marginLeft: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
                opacity: 0.5,
                lineHeight: 1,
                color: "inherit",
                padding: 2,
                display: "flex",
              }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })()}
    </div>
  );
}

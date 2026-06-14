import React from "react";
import { ConsoleTopBar } from "./ConsoleTopBar";
import { ConsoleSidebar } from "./ConsoleSidebar";
import { ConsoleBreadcrumbs } from "./ConsoleBreadcrumbs";

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

  const toggleSidebar = () => setSidebarCollapsed((p) => !p);

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--proof-bg)",
        color: "var(--proof-text)",
      }}
    >
      {/* Top bar — fixed */}
      <ConsoleTopBar onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />

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
          {breadcrumbs && breadcrumbs.length > 0 && (
            <ConsoleBreadcrumbs items={breadcrumbs} />
          )}

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
    </div>
  );
}

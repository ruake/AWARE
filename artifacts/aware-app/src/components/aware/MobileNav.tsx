import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Menu, X, LayoutDashboard, History, GitCompare, BarChart3, Bot, Settings, Info } from "lucide-react";
import { useMobile } from "@/hooks/useMobile";

const NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { id: "runs", icon: History, label: "Runs", href: "/runs" },
  { id: "compare", icon: GitCompare, label: "Compare", href: "/compare" },
  { id: "trends", icon: BarChart3, label: "Trends", href: "/trends" },
  { id: "copilot", icon: Bot, label: "Copilot", href: "/copilot" },
  { id: "settings", icon: Settings, label: "Settings", href: "/settings" },
  { id: "about", icon: Info, label: "About", href: "/about" },
];

function activeIdFromPath(path: string): string {
  if (path === "/") return "dashboard";
  const seg = path.split("/")[1];
  const map: Record<string, string> = {
    runs: "runs", compare: "compare", trends: "trends", analytics: "trends",
    tests: "tests", copilot: "copilot", settings: "settings", about: "about",
  };
  return map[seg!] ?? "dashboard";
}

export function MobileNav() {
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);
  const [location, navigate] = useLocation();
  const activeId = activeIdFromPath(location);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!isMobile) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        style={{
          width: 28, height: 28, padding: 0, border: "1px solid var(--proof-border-light)",
          background: "transparent", cursor: "pointer", color: "var(--proof-text-muted)",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "var(--proof-radius-sm)", transition: "all var(--proof-transition)", flexShrink: 0,
        }}
      >
        <Menu size={14} />
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 999,
              background: "var(--proof-overlay)",
              animation: "fade-in 0.15s ease-out both",
            }}
          />
          <nav
            role="navigation"
            aria-label="Mobile navigation"
            style={{
              position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 1000,
              width: "min(300px, 80vw)",
              background: "var(--proof-surface)",
              borderRight: "1px solid var(--proof-border-strong)",
              display: "flex", flexDirection: "column",
              animation: "proof-slide-up 0.2s ease-out both",
              boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px", borderBottom: "1px solid var(--proof-border-strong)",
            }}>
              <span style={{
                fontSize: 14, fontWeight: 800, color: "var(--proof-text)",
                letterSpacing: "-0.3px", fontFamily: "var(--font-mono)",
              }}>
                A.W.A.R.E.
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                style={{
                  width: 28, height: 28, padding: 0, border: "none",
                  background: "transparent", cursor: "pointer", color: "var(--proof-text-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "var(--proof-radius-sm)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: 4 }}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.href);
                      setOpen(false);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px", borderRadius: "var(--proof-radius-md)",
                      background: isActive ? "var(--proof-blue-bg)" : "transparent",
                      color: isActive ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
                      border: "none", cursor: "pointer", fontSize: 14, fontWeight: isActive ? 700 : 500,
                      textAlign: "left", width: "100%",
                      borderLeft: isActive ? "3px solid var(--proof-blue)" : "3px solid transparent",
                      transition: "all var(--proof-transition)",
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--proof-border-strong)",
              fontSize: 11, color: "var(--proof-text-muted)",
              textAlign: "center",
            }}>
              A.W.A.R.E. v1.0
            </div>
          </nav>
        </>
      )}
    </>
  );
}

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  History,
  GitCompareArrows,
  BarChart3,
  Sun,
  Moon,
  Activity,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "@/lib/motion";

const NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Runs", href: "/runs", icon: History },
  { label: "Compare", href: "/compare", icon: GitCompareArrows },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [loc] = useLocation();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("aware-theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.classList.toggle("light", stored === "light");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    localStorage.setItem("aware-theme", next);
  };

  return (
    <div className="min-h-screen bg-gcp-bg text-gcp-text flex flex-col">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="sticky top-0 z-20 h-14 bg-gcp-elevated/80 backdrop-blur-md border-b border-gcp-border-strong flex items-center shadow-[0_1px_0_rgba(66,133,244,0.08)]"
      >
        {/* Gradient accent bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-gcp-blue/60 to-transparent origin-center"
        />

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 min-w-[160px]">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-gcp-blue/30 to-gcp-purple/30 border border-gcp-blue/20">
            <Activity size={13} className="text-gcp-blue" />
          </div>
          <div>
            <span className="font-mono font-bold text-xs tracking-[0.18em] text-gcp-text block leading-tight">
              A.W.A.R.E.
            </span>
            <span className="text-[9px] tracking-[0.12em] font-mono block leading-tight text-gcp-text-muted">
              PROOF
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-stretch h-full flex-1">
          {NAV.map((n) => {
            const active = n.href === "/" ? loc === "/" : loc.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative flex items-center gap-1.5 px-3.5 text-xs font-medium transition-colors h-full
                  ${active ? "text-gcp-text" : "text-gcp-text-secondary hover:text-gcp-text hover:bg-gcp-elevated/60"}`}
              >
                <n.icon size={13} />
                {n.label}
                {active && (
                  <motion.span
                    layoutId="nav-active-indicator"
                    transition={SPRING}
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-gcp-blue rounded-t-full shadow-[0_0_6px_rgba(66,133,244,0.5)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="px-4 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            onClick={toggleTheme}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-gcp-elevated/60 hover:bg-gcp-elevated border border-gcp-border transition-colors text-gcp-text-secondary hover:text-gcp-text"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
          </motion.button>
          <span className="text-[10px] font-mono text-gcp-text-muted px-2 py-1 rounded bg-gcp-elevated/60 backdrop-blur-sm border border-gcp-border-strong shadow-sm">
            v{import.meta.env.VITE_APP_VERSION || "0.1"}
          </span>
        </div>
      </motion.header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

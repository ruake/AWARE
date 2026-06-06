import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, List, GitCompare, FlaskConical, Play,
  Activity, Bell, Search, Zap, Menu, X, Github
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/runs", label: "Runs", icon: List },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/tests", label: "Test Manager", icon: FlaskConical },
  { href: "/start", label: "Start Run", icon: Play },
  { href: "/status", label: "How It Works", icon: Activity },
];

export function AppLayout({ children, activeHref }: { children: React.ReactNode; activeHref?: string }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const notifCount = 3;
  const current = activeHref ?? location;

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(s => !s); }
      if (e.key === "Escape") { setSearchOpen(false); setNotifOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--gcp-grey-bg)" }}>

      {/* Top header */}
      <header style={{
        height: 56, background: "var(--gcp-surface)", borderBottom: "1px solid var(--gcp-grey)",
        display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
        position: "sticky", top: 0, zIndex: 100, flexShrink: 0,
        boxShadow: "0 1px 3px rgba(60,64,67,0.12)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
          <div style={{ width: 28, height: 28, background: "var(--gcp-blue)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={15} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.2px", color: "var(--gcp-text)" }}>A.W.A.K.E.</span>
          <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)", fontFamily: "var(--font-mono)", marginTop: 2 }}>CDN·OBS</span>
        </div>

        {/* Desktop nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = current === item.href || (item.href !== "/" && current.startsWith(item.href));
            const Icon = item.icon;
            return (
              <NavLink key={item.href} href={item.href} active={active}>
                <Icon size={14} /> {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <button
            onClick={() => setSearchOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--gcp-grey)", borderRadius: 4, background: "var(--gcp-grey-bg)", padding: "5px 10px", fontSize: 12, color: "var(--gcp-text-secondary)", cursor: "pointer" }}
          >
            <Search size={13} />
            <span>Search</span>
            <kbd style={{ fontSize: 10, border: "1px solid var(--gcp-grey)", borderRadius: 3, padding: "0 4px", lineHeight: "16px" }}>⌘K</kbd>
          </button>

          <a href="https://github.com/salesforce/aware" target="_blank" rel="noopener noreferrer" title="GitHub Actions" style={{ padding: 6, borderRadius: 4, color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Github size={18} />
          </a>

          <div style={{ position: "relative" }}>
            <button onClick={() => setNotifOpen(n => !n)} style={{ position: "relative", padding: 6, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center" }}>
              <Bell size={18} />
              {notifCount > 0 && (
                <span style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "var(--gcp-red)", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{notifCount}</span>
              )}
            </button>
            {notifOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: 320, background: "var(--gcp-surface)", border: "1px solid var(--gcp-grey)", borderRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 200 }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--gcp-grey)", fontWeight: 600, fontSize: 13 }}>Notifications</div>
                {[
                  { type: "fail", msg: "7 regressions detected in latest Prod/Production run", time: "2m ago" },
                  { type: "warn", msg: "Prod/Production pass rate dropped 4% from baseline", time: "18m ago" },
                  { type: "pass", msg: "UAT/Production run completed — 100% pass rate", time: "1h ago" },
                ].map((n, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderBottom: i < 2 ? "1px solid var(--gcp-grey)" : "none", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 4, background: n.type === "fail" ? "var(--gcp-red)" : n.type === "warn" ? "var(--gcp-yellow)" : "var(--gcp-green)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "var(--gcp-text)", lineHeight: 1.4 }}>{n.msg}</div>
                      <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu btn */}
        <button onClick={() => setMobileOpen(m => !m)} style={{ padding: 6, border: "none", background: "transparent", cursor: "pointer" }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile nav */}
      {mobileOpen && (
        <div style={{ background: "var(--gcp-surface)", borderBottom: "1px solid var(--gcp-grey)", padding: "8px 12px" }}>
          {NAV_ITEMS.map(item => {
            const active = current === item.href || (item.href !== "/" && current.startsWith(item.href));
            const Icon = item.icon;
            return (
              <NavLink key={item.href} href={item.href} active={active} onClick={() => setMobileOpen(false)} style={{ display: "flex", marginBottom: 4, padding: "10px 12px", fontSize: 14 }}>
                <Icon size={16} /> {item.label}
              </NavLink>
            );
          })}
        </div>
      )}

      {/* Search modal */}
      {searchOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }} onClick={() => setSearchOpen(false)}>
          <div style={{ background: "var(--gcp-surface)", borderRadius: 8, width: "min(560px, 90vw)", boxShadow: "0 8px 40px rgba(0,0,0,0.25)", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--gcp-grey)", gap: 10 }}>
              <Search size={16} color="var(--gcp-text-secondary)" />
              <input autoFocus placeholder="Search runs, tests, comparisons…" style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontFamily: "var(--font-sans)", color: "var(--gcp-text)", background: "transparent" }} />
              <kbd style={{ fontSize: 11, border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "2px 6px", color: "var(--gcp-text-secondary)" }}>ESC</kbd>
            </div>
            <div style={{ padding: "8px 0" }}>
              {[
                { label: "Dashboard", href: "/", desc: "Promotion readiness overview" },
                { label: "Latest Runs", href: "/runs", desc: "All GitHub Actions test runs" },
                { label: "Compare runs", href: "/compare", desc: "Baseline vs candidate diff" },
                { label: "Start new run", href: "/start", desc: "Trigger regression test suite" },
              ].map(item => (
                <NavLink key={item.href} href={item.href} active={false} onClick={() => setSearchOpen(false)}
                  style={{ display: "flex", gap: 12, padding: "10px 16px", justifyContent: "flex-start" }}>
                  <span style={{ fontWeight: 500, fontSize: 13, flex: "0 0 auto" }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)", fontWeight: 400 }}>{item.desc}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, padding: "20px 24px", maxWidth: 1600, margin: "0 auto", width: "100%" }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--gcp-grey)", background: "var(--gcp-surface)", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)", fontFamily: "var(--font-mono)" }}>
          A.W.A.K.E. — Akamai Web Analyser &amp; Kit for Evaluations · v2.0.0
        </span>
        <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={{ fontSize: 11, color: "var(--gcp-blue)", background: "none", border: "none", cursor: "pointer" }}>
          Copy link
        </button>
      </footer>
    </div>
  );
}

function NavLink({ href, active, children, onClick, style }: {
  href: string; active: boolean; children: React.ReactNode;
  onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 4, fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? "var(--gcp-blue)" : "var(--gcp-text-secondary)",
        background: active ? "var(--gcp-blue-bg)" : "transparent",
        textDecoration: "none", transition: "all 0.15s", whiteSpace: "nowrap",
        ...style,
      }}
    />
  );
}

export function copyToClipboardUtil(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement("textarea");
    el.value = text; document.body.appendChild(el);
    el.select(); document.execCommand("copy");
    document.body.removeChild(el);
  });
}

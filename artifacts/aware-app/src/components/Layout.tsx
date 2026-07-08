import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, History, GitCompareArrows, Activity, Sun, Moon } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Runs', href: '/runs', icon: History },
  { label: 'Compare', href: '/compare', icon: GitCompareArrows },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [loc] = useLocation();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('aware-theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      document.documentElement.classList.toggle('light', stored === 'light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('light', next === 'light');
    localStorage.setItem('aware-theme', next);
  };

  return (
    <div className="min-h-screen bg-gcp-bg text-gcp-text flex flex-col">
      <header className="sticky top-0 z-20 h-14 bg-gcp-surface/95 backdrop-blur-sm border-b border-gcp-border flex items-center gap-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 min-w-[180px]">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gcp-blue/20 border border-gcp-blue/30">
            <Activity size={14} className="text-gcp-blue" />
          </div>
          <span className="font-mono font-bold text-sm tracking-[0.2em] text-gcp-text">A.W.A.R.E.</span>
        </div>
        {/* Nav */}
        <nav className="flex items-stretch h-full gap-0 flex-1">
          {NAV.map(n => {
            const active = n.href === '/' ? loc === '/' : loc.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}>
                <a className={`relative flex items-center gap-2 px-4 text-sm font-medium transition-colors h-full
                  ${active ? 'text-gcp-text' : 'text-gcp-text-secondary hover:text-gcp-text hover:bg-gcp-elevated/50'}`}>
                  <n.icon size={14} />
                  {n.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gcp-blue rounded-t-full" />
                  )}
                </a>
              </Link>
            );
          })}
        </nav>
        {/* Right side */}
        <div className="px-4 flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gcp-elevated/60 hover:bg-gcp-elevated border border-gcp-border transition-colors text-gcp-text-secondary hover:text-gcp-text"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

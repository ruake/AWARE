import React from 'react';
import { Link, useLocation } from 'wouter';
import { Activity } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', href: '/' },
  { label: 'Runs', href: '/runs' },
  { label: 'Compare', href: '/compare' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [loc] = useLocation();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="sticky top-0 z-20 h-14 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 flex items-center gap-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 min-w-[180px]">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-sky-500/20 border border-sky-500/30">
            <Activity size={14} className="text-sky-400" />
          </div>
          <span className="font-mono font-bold text-sm tracking-[0.2em] text-zinc-100">A.W.A.R.E.</span>
        </div>
        {/* Nav */}
        <nav className="flex items-stretch h-full gap-0 flex-1">
          {NAV.map(n => {
            const active = n.href === '/' ? loc === '/' : loc.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}>
                <a className={`relative flex items-center px-5 text-sm font-medium transition-colors h-full
                  ${active ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
                  {n.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-sky-500 rounded-t-full" />
                  )}
                </a>
              </Link>
            );
          })}
        </nav>
        {/* Right side */}
        <div className="px-6 text-xs text-zinc-600 font-mono tracking-wider">
          CDN OBSERVABILITY
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

import { Link, useLocation } from 'wouter';

const NAV = [
  { label: 'Dashboard', href: '/' },
  { label: 'Runs', href: '/runs' },
  { label: 'Compare', href: '/compare' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [loc] = useLocation();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-6 h-12 flex items-center gap-8">
        <span className="font-mono font-bold text-sm tracking-widest text-zinc-100">A.W.A.R.E.</span>
        <nav className="flex gap-1">
          {NAV.map(n => (
            <Link key={n.href} href={n.href}>
              <a className={`px-3 py-1 rounded text-sm transition-colors ${
                loc === n.href || (n.href !== '/' && loc.startsWith(n.href))
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              }`}>{n.label}</a>
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

import React from "react";
import { 
  LayoutDashboard, 
  List, 
  GitCompare, 
  Info, 
  Search,
  PlayCircle,
  Menu, 
  Moon, 
  Sun, 
  ExternalLink,
  Bell,
  Command,
  Check,
  AlertTriangle,
  Activity
} from "lucide-react";
import { navTo, repo } from "./nav";
import { CommandPalette } from "./CommandPalette";
import { useLiveStatus } from "./useLiveStatus";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

export function AppLayout({ children, activeTab }: AppLayoutProps) {
  const [isDark, setIsDark] = React.useState(false);
  const [sidebarExpanded, setSidebarExpanded] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const { currentToast, dismissToast, pendingCount, clearCount } = useLiveStatus();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark', !isDark);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "Dashboard" },
    { id: "runs", label: "Runs", icon: List, path: "Runs" },
    { id: "new-run", label: "New Run", icon: PlayCircle, path: "StartRun" },
    { id: "compare", label: "Compare", icon: GitCompare, path: "Compare" },
    { id: "search", label: "Search", icon: Search, path: "SearchDemo" },
    { id: "about", label: "About", icon: Info, path: "About" },
  ];

  return (
    <div className={`aware-theme min-h-screen flex flex-col bg-[var(--gcp-grey-bg)] text-[var(--gcp-text)] ${isDark ? 'dark' : ''}`}>
      {/* Top Nav */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 bg-[var(--gcp-surface)] border-b border-[var(--gcp-grey)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[var(--gcp-blue)] flex items-center justify-center text-white font-bold text-lg tracking-tighter">
              AW
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[var(--gcp-text)] leading-tight">A.W.A.K.E.</span>
              <span className="text-[10px] text-[var(--gcp-text-secondary)] uppercase tracking-wider">Akamai Web Analyser & Kit for Evaluations</span>
            </div>
          </div>
        </div>

        <nav className="flex h-full">
          {navItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => navTo(item.path)}
              className={`flex items-center px-4 h-full cursor-pointer text-sm font-medium border-b-2 transition-colors ${
                activeTab === item.id 
                  ? "border-[var(--gcp-blue)] text-[var(--gcp-blue)]" 
                  : "border-transparent text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)] hover:bg-[var(--gcp-surface-hover)]"
              }`}
            >
              {item.label}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Live status indicator */}
          <div className="relative">
            <button
              onClick={() => { clearCount(); }}
              className="relative p-2 text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)] rounded-full transition-colors"
              title={`${pendingCount} pending updates`}
            >
              <Bell size={18} />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-[var(--gcp-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* ⌘K button */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[var(--gcp-text-secondary)] bg-[var(--gcp-grey-bg)] border border-[var(--gcp-grey)] rounded-md hover:bg-[var(--gcp-surface-hover)] transition-colors"
          >
            <Search size={13} />
            <span className="hidden sm:inline">Search... </span>
            <kbd className="px-1.5 py-0.5 bg-[var(--gcp-surface)] border border-[var(--gcp-grey)] rounded font-mono text-[10px] font-bold">
              <Command size={10} className="inline" />K
            </kbd>
          </button>

          <button onClick={toggleTheme} className="p-2 text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)] rounded-full">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a href={`${repo}/actions`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[13px] text-[var(--gcp-blue)] hover:underline">
            GitHub Actions <ExternalLink size={14} />
          </a>
          <div className="w-8 h-8 rounded-full bg-[var(--gcp-green)] text-white flex items-center justify-center text-sm font-bold cursor-pointer">
            E
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`flex flex-col border-r border-[var(--gcp-grey)] bg-[var(--gcp-surface)] transition-all duration-300 ${
            sidebarExpanded ? 'w-48' : 'w-14'
          }`}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <div className="py-2">
            <button className="w-full flex justify-center p-3 text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)]">
              <Menu size={20} />
            </button>
          </div>
          <div className="flex-1 py-2 flex flex-col gap-1">
            {navItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => navTo(item.path)}
                className={`flex items-center px-4 py-3 cursor-pointer overflow-hidden whitespace-nowrap ${
                  activeTab === item.id 
                    ? "bg-[var(--gcp-blue-bg)] text-[var(--gcp-blue)]" 
                    : "text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)] hover:text-[var(--gcp-text)]"
                }`}
              >
                <item.icon size={20} className="min-w-[20px]" />
                <span className={`ml-4 text-sm font-medium transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      {/* Live status toast */}
      {currentToast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-[13px] z-50 cursor-pointer transition-all animate-slide-up border ${
            currentToast.type === "success"
              ? "bg-[var(--gcp-green-bg)] text-[var(--gcp-green)] border-[var(--gcp-green)]"
              : currentToast.type === "warning"
              ? "bg-[var(--gcp-yellow-bg)] text-[var(--gcp-yellow)] border-[var(--gcp-yellow)]"
              : "bg-[var(--gcp-blue-bg)] text-[var(--gcp-blue)] border-[var(--gcp-blue)]"
          }`}
          onClick={dismissToast}
        >
          {currentToast.type === "success" ? <Check size={16} /> :
           currentToast.type === "warning" ? <AlertTriangle size={16} /> :
           <Activity size={16} />}
          <span>{currentToast.message}</span>
          <button onClick={e => { e.stopPropagation(); dismissToast(); }} className="ml-2 opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}
    </div>
  );
}

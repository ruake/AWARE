import React from "react";
import { 
  LayoutDashboard, 
  List, 
  GitCompare, 
  Info, 
  Search,
  Menu, 
  Moon, 
  Sun, 
  ExternalLink 
} from "lucide-react";
import { navTo, repo } from "./nav";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

export function AppLayout({ children, activeTab }: AppLayoutProps) {
  const [isDark, setIsDark] = React.useState(false);
  const [sidebarExpanded, setSidebarExpanded] = React.useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark', !isDark);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "Dashboard" },
    { id: "runs", label: "Runs", icon: List, path: "Runs" },
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
              <span className="font-bold text-[var(--gcp-text)] leading-tight">A.W.A.R.E.</span>
              <span className="text-[10px] text-[var(--gcp-text-secondary)] uppercase tracking-wider">Akamai Web Analytics & Regression Engine</span>
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

        <div className="flex items-center gap-4">
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
    </div>
  );
}
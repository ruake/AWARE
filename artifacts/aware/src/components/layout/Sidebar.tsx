import { Link, useLocation } from "wouter";
import { LayoutDashboard, History, ArrowLeftRight, TrendingUp, Bot, ServerCog, FileText, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { section: "Overview", items: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Runs", href: "/runs", icon: History }
  ]},
  { section: "Analysis", items: [
    { label: "Compare", href: "/compare", icon: ArrowLeftRight },
    { label: "Trends", href: "/trends", icon: TrendingUp }
  ]},
  { section: "Tools", items: [
    { label: "Copilot", href: "/copilot", icon: Bot },
    { label: "Tests", href: "/tests", icon: FileText },
    { label: "Status", href: "/status", icon: ServerCog }
  ]},
  { section: "Config", items: [
    { label: "Settings", href: "/settings", icon: SettingsIcon }
  ]}
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-sidebar text-sidebar-foreground flex flex-col h-full overflow-y-auto">
      <div className="p-4 py-6">
        {NAV_ITEMS.map((group, i) => (
          <div key={group.section} className={cn("mb-6", i === NAV_ITEMS.length - 1 && "mt-auto")}>
            <h4 className="px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              {group.section}
            </h4>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-md mx-2 transition-colors",
                    isActive 
                      ? "bg-sidebar-primary/10 text-sidebar-primary font-medium" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}

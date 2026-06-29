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
    <aside className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col h-full overflow-y-auto">
      <div className="flex items-center gap-2 px-5 h-14 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
          A
        </div>
        <span className="text-sm font-semibold tracking-tight">A.W.A.R.E.</span>
      </div>
      <div className="flex-1 p-3 py-4">
        {NAV_ITEMS.map((group, i) => (
          <div key={group.section} className={cn("mb-5", i === NAV_ITEMS.length - 1 && "mt-auto")}>
            <h4 className="px-3 text-[11px] font-medium text-sidebar-foreground/40 uppercase tracking-wider mb-1.5">
              {group.section}
            </h4>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    "flex items-center gap-3 px-3 py-2 text-[13px] rounded-sm transition-all",
                    isActive
                      ? "bg-sidebar-primary/12 text-sidebar-primary font-medium shadow-[inset_2px_0_0_0]"
                      : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}>
                    <item.icon className="w-4 h-4 shrink-0" />
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

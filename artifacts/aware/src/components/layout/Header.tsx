import { RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";

export function Header() {
  const { lastLoaded, loadData } = useStore();

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <Activity className="w-5 h-5 text-primary" />
        <div>
          <h1 className="font-bold text-foreground leading-none tracking-tight">A.W.A.R.E.</h1>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            Akamai Web Analytics Regression Engine
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {lastLoaded && (
          <span className="text-muted-foreground text-xs">
            Updated {formatDistanceToNow(new Date(lastLoaded), { addSuffix: true })}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => loadData()} className="h-8 gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>
    </header>
  );
}

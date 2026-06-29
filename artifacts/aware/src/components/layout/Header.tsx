import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";

export function Header() {
  const { lastLoaded, loadData } = useStore();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-muted-foreground/70 font-medium">
          Akamai Web Analytics
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {lastLoaded && (
          <span className="text-muted-foreground text-[12px]">
            Updated {formatDistanceToNow(new Date(lastLoaded), { addSuffix: true })}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => loadData()} className="h-7 gap-1.5 text-[12px] px-2.5">
          <RefreshCw className="w-3 h-3" />
          Refresh
        </Button>
      </div>
    </header>
  );
}

import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Runs from "@/pages/Runs";
import RunDetail from "@/pages/RunDetail";
import Compare from "@/pages/Compare";
import Trends from "@/pages/Trends";
import Copilot from "@/pages/Copilot";
import Status from "@/pages/Status";
import Tests from "@/pages/Tests";
import Settings from "@/pages/Settings";
import { useStore } from "@/lib/store";
import { useTheme } from "@/hooks/use-theme";
import { Toaster } from "@/components/ui/toaster";
import { Home } from "lucide-react";
import { Link } from "wouter";

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 text-center">
      <div className="text-6xl font-bold text-muted-foreground/30">404</div>
      <div>
        <h2 className="text-xl font-semibold mb-1">Page not found</h2>
        <p className="text-muted-foreground text-sm">The page you requested doesn't exist.</p>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition"
      >
        <Home className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  );
}

function App() {
  const loadData = useStore(state => state.loadData);
  const theme    = useTheme(state => state.theme);

  // Apply theme class once on mount, update cleanly on theme change
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  // Load data once on mount — not on every theme change
  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AppLayout>
        <Switch>
          <Route path="/"           component={Dashboard} />
          <Route path="/runs"       component={Runs} />
          <Route path="/runs/:runId" component={RunDetail} />
          <Route path="/compare"    component={Compare} />
          <Route path="/trends"     component={Trends} />
          <Route path="/copilot"    component={Copilot} />
          <Route path="/status"     component={Status} />
          <Route path="/tests"      component={Tests} />
          <Route path="/settings"   component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
      <Toaster />
    </WouterRouter>
  );
}

export default App;

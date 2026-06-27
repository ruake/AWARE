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

function App() {
  const loadData = useStore(state => state.loadData);
  const theme = useTheme(state => state.theme);

  useEffect(() => {
    loadData();
    // Initialize theme
    const root = window.document.documentElement;
    root.classList.add(theme);
  }, [loadData, theme]);

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AppLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/runs" component={Runs} />
          <Route path="/runs/:runId" component={RunDetail} />
          <Route path="/compare" component={Compare} />
          <Route path="/trends" component={Trends} />
          <Route path="/copilot" component={Copilot} />
          <Route path="/status" component={Status} />
          <Route path="/tests" component={Tests} />
          <Route path="/settings" component={Settings} />
          <Route>404 Not Found</Route>
        </Switch>
      </AppLayout>
    </WouterRouter>
  );
}

export default App;

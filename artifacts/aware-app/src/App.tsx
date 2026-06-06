import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Runs from "@/pages/Runs";
import RunDetail from "@/pages/RunDetail";
import Compare from "@/pages/Compare";
import TestAnalytics from "@/pages/TestAnalytics";
import StartRun from "@/pages/StartRun";
import TestManager from "@/pages/TestManager";
import Status from "@/pages/Status";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/runs" component={Runs} />
      <Route path="/runs/:runId" component={RunDetail} />
      <Route path="/compare" component={Compare} />
      <Route path="/analytics" component={TestAnalytics} />
      <Route path="/start" component={StartRun} />
      <Route path="/tests" component={TestManager} />
      <Route path="/status" component={Status} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
